import { NextRequest, NextResponse } from 'next/server'
import type { ImageSearchResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

    if (!apiKey || !searchEngineId) {
      console.warn('Google Custom Search API credentials not configured')
      return NextResponse.json({
        results: [],
        error: 'Google Custom Search API credentials not configured',
      } as ImageSearchResponse & { error?: string })
    }

    // First, use OpenAI to extract search terms from the image
    // This allows us to search with relevant keywords instead of just "site:hallmark.com"
    let searchQuery = 'site:hallmark.com'
    
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY
      if (openaiApiKey) {
        // Convert image to base64 for OpenAI API
        const imageBuffer = await imageFile.arrayBuffer()
        const imageBase64 = Buffer.from(imageBuffer).toString('base64')
        const imageMimeType = imageFile.type || 'image/jpeg'

        // Call OpenAI Vision API to extract search terms
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Look at this image of a collectible item. Extract 2-4 key search terms that would help find this product on hallmark.com. Return only the search terms separated by spaces, no other text. Focus on: product name, series name, character name, or distinctive features visible in the image.`
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:${imageMimeType};base64,${imageBase64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 50,
          }),
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          const content = openaiData.choices[0]?.message?.content?.trim()
          if (content) {
            // Combine extracted terms with site restriction
            const terms = content.split(/\s+/).filter((t: string) => t.length > 0).slice(0, 4).join(' ')
            if (terms) {
              searchQuery = `(site:hallmark.com OR site:hookedonhallmark.com OR site:www.ornamentmall.com) ${terms}`
            }
          }
        }
      }
    } catch (aiError) {
      console.warn('Failed to extract search terms from image, using default query:', aiError)
      // Continue with default query
    }

    // Now perform the Google Custom Search
    console.log('Performing Google Custom Search with query:', searchQuery)
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
    searchUrl.searchParams.set('key', apiKey)
    searchUrl.searchParams.set('cx', searchEngineId)
    searchUrl.searchParams.set('searchType', 'image')
    searchUrl.searchParams.set('q', searchQuery)
    searchUrl.searchParams.set('num', '6')

    const searchResponse = await fetch(searchUrl.toString())
    console.log('Google Custom Search response status:', searchResponse.status)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error('Google Custom Search API error:', errorText)
      
      // Return error info so frontend can show it
      return NextResponse.json({
        results: [],
        error: `Search failed: ${errorText.substring(0, 200)}`,
      } as ImageSearchResponse & { error?: string })
    }

    const searchData = await searchResponse.json()

    // Debug: Log first item structure to understand the API response
    if (searchData.items && searchData.items.length > 0) {
      console.log('Sample search result item structure:', JSON.stringify(searchData.items[0], null, 2))
    }

    // Parse Google Custom Search API response
    const items = searchData.items || []
    const results = items.slice(0, 6).map((item: any) => {
      // For image search, item.link might be the image URL
      // Use image.contextLink or image.link for the page URL, fallback to item.link
      let pageUrl = item.image?.contextLink || item.image?.link || item.link || ''
      const thumbnailUrl = item.image?.thumbnailLink || item.link || ''
      
      // Detect if we got an image URL instead of a page URL
      const isImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(pageUrl) || 
                         pageUrl.includes('/images/') ||
                         pageUrl.includes('/static/')
      
      if (isImageUrl) {
        console.warn('Detected image URL instead of page URL:', pageUrl)
        // Try to find the page URL in other fields
        if (item.image?.contextLink && !/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(item.image.contextLink)) {
          pageUrl = item.image.contextLink
          console.log('Using image.contextLink as page URL:', pageUrl)
        } else if (item.image?.link && !/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(item.image.link)) {
          pageUrl = item.image.link
          console.log('Using image.link as page URL:', pageUrl)
        } else {
          // Try to construct page URL from image URL (hallmark.com specific)
          // Example: https://www.hallmark.com/on/demandware.static/.../5QXD7292/...jpg
          // Might be from: https://www.hallmark.com/products/.../5QXD7292
          const skuMatch = pageUrl.match(/products\/([A-Z0-9]+)/i) || pageUrl.match(/\/([A-Z0-9]{8,})\//)
          if (skuMatch) {
            const sku = skuMatch[1]
            // Try common hallmark.com product URL patterns
            const possibleUrls = [
              `https://www.hallmark.com/products/${sku}`,
              `https://www.hallmark.com/ornaments/${sku}`,
              `https://www.hallmark.com/gifts/${sku}`,
            ]
            console.log('Could not find page URL, SKU extracted:', sku, 'Possible URLs:', possibleUrls)
            // For now, we'll use the first possible URL or keep the image URL
            // The user will need to verify or we can try fetching these
            pageUrl = possibleUrls[0] || pageUrl
          }
        }
      }
      
      console.log('Final search result:', {
        title: item.title,
        pageUrl: pageUrl,
        thumbnailUrl: thumbnailUrl.substring(0, 100),
      })
      
      return {
        title: item.title || '',
        url: pageUrl, // Use the page URL, not the image URL
        snippet: item.snippet || '',
        thumbnail: thumbnailUrl,
        displayLink: item.displayLink || '',
      }
    })

    console.log(`Google Custom Search found ${results.length} results (total: ${searchData.searchInformation?.totalResults || 0})`)

    return NextResponse.json({
      results,
      totalResults: searchData.searchInformation?.totalResults || 0,
    } as ImageSearchResponse)
  } catch (error) {
    console.error('Error searching images:', error)
    return NextResponse.json({
      results: [],
      error: error instanceof Error ? error.message : 'Failed to search images',
    } as ImageSearchResponse & { error?: string })
  }
}

