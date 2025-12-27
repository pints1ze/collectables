import { NextRequest, NextResponse } from 'next/server'

export interface ImageAnalysisResult {
  title: string
  description: string | null
  brand: string | null
  series_name: string | null
  year_released: number | null
  condition: string | null
  tags: string[]
}

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

    // Convert image to base64 for OpenAI API
    const imageBuffer = await imageFile.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const imageMimeType = imageFile.type || 'image/jpeg'

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      // Return mock data for development if API key is not set
      console.warn('OPENAI_API_KEY not set, returning mock data')
      return NextResponse.json({
        title: 'Collectible Item',
        description: 'A collectible item from your collection',
        brand: null,
        series_name: null,
        year_released: null,
        condition: null,
        tags: [],
      } as ImageAnalysisResult)
    }

    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                text: `Analyze this image of a collectible item and extract the following information in JSON format:
{
  "title": "A descriptive title for the item",
  "description": "A detailed description of the item, or null if not clear",
  "brand": "The brand or manufacturer name, or null if not visible",
  "series_name": "The series or collection name, or null if not visible",
  "year_released": "The year the item was released (as a number), or null if not visible",
  "condition": "The condition of the item (e.g., Mint, Near Mint, Good, Fair, Poor), or null if not clear",
  "tags": ["Array of relevant tags/categories", "e.g., trading cards, action figures, etc."]
}

Be specific and accurate. Only include information that is clearly visible in the image. If something is not visible or unclear, use null for that field.`
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
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    // Parse the JSON response
    let analysisResult: ImageAnalysisResult
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
      const jsonString = jsonMatch ? jsonMatch[1] : content
      analysisResult = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content)
      // Fallback: try to extract structured data from text
      analysisResult = {
        title: 'Collectible Item',
        description: content.substring(0, 200),
        brand: null,
        series_name: null,
        year_released: null,
        condition: null,
        tags: [],
      }
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

