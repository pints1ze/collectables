import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import type { ScrapeProductResponse, ScrapedProductData } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body as { url: string }

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required', success: false } as ScrapeProductResponse,
        { status: 400 }
      )
    }

    // Validate URL is from hallmark.com
    if (!url.includes('hallmark.com')) {
      return NextResponse.json(
        { error: 'URL must be from hallmark.com', success: false } as ScrapeProductResponse,
        { status: 400 }
      )
    }

    console.log('Scraping URL:', url)
    
    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`)
    }

    const html = await response.text()
    console.log('Page fetched successfully, HTML length:', html.length)
    const $ = cheerio.load(html)
    
    // Debug: Log some key elements to help understand page structure
    console.log('Page structure debug:')
    console.log('- h1 elements:', $('h1').map((_, el) => $(el).text().trim()).get().slice(0, 3))
    console.log('- og:title meta:', $('meta[property="og:title"]').attr('content'))
    console.log('- og:description meta:', $('meta[property="og:description"]').attr('content'))
    console.log('- Elements containing "Item number":', $('*').filter((_, el) => $(el).text().includes('Item number')).length)
    console.log('- Elements containing "About":', $('*').filter((_, el) => $(el).text().toLowerCase().includes('about this product')).length)

    // Initialize result object
    const scrapedData: ScrapedProductData = {
      title: null,
      description: null,
      brand: null,
      series_name: null,
      year_released: null,
      sku: null,
    }

    // Extract title - prioritize H1 as it's cleaner, then fall back to meta tags
    // Hallmark.com uses various structures, try multiple approaches
    const h1Title = $('h1[data-testid="product-title"], h1.product-title, h1.product-name').first().text().trim() ||
                     $('h1').first().text().trim() ||
                     $('.product-title, [class*="product-title"], [class*="ProductTitle"]').first().text().trim() ||
                     $('[data-testid="product-title"]').first().text().trim()
    const ogTitle = $('meta[property="og:title"]').attr('content')?.trim()
    const metaTitle = $('meta[name="title"]').attr('content')?.trim()
    
    // Prefer H1 title as it's cleaner (no extra info like prices)
    scrapedData.title = h1Title || ogTitle || metaTitle || null
    console.log('Title extraction:', { h1Title, ogTitle, metaTitle, result: scrapedData.title })

    // Extract description - try multiple selectors for hallmark.com
    const ogDescription = $('meta[property="og:description"]').attr('content')?.trim()
    const metaDescription = $('meta[name="description"]').attr('content')?.trim()
    
    // Hallmark.com often uses "About this product" section
    // Find heading containing "About" and get the following paragraph/div
    let aboutSection = null
    $('h2, h3, h4').each((_, el) => {
      const text = $(el).text().toLowerCase()
      if (text.includes('about') && text.includes('product')) {
        const nextText = $(el).next('p, div').first().text().trim()
        if (nextText && nextText.length > 20) {
          aboutSection = nextText
          return false // break
        }
      }
    })
    
    // Fallback to other description selectors
    if (!aboutSection) {
      aboutSection = $('[class*="product-description"], [class*="product-details"], [data-testid="product-description"]').first().text().trim() ||
                     $('.description, [class*="Description"]').first().text().trim() ||
                     $('p:contains("Celebrate"), p:contains("ornament")').first().text().trim()
    }
    
    scrapedData.description = ogDescription || metaDescription || aboutSection || null
    console.log('Description extraction:', { ogDescription, metaDescription, aboutSection, result: scrapedData.description })

    // Extract brand - usually "Hallmark" but check for specific brand names
    const brandText = 
      $('.brand, .product-brand, [data-testid="brand"]').first().text().trim() ||
      $('meta[property="product:brand"]').attr('content')?.trim() ||
      null
    
    scrapedData.brand = brandText || 'Hallmark'

    // Extract series/collection name - hallmark.com often has this in breadcrumbs or category
    // Look for "Keepsake Ornaments" or similar in breadcrumbs
    const breadcrumbText = $('[class*="breadcrumb"], nav[aria-label*="breadcrumb"], .breadcrumbs').text()
    const categoryMeta = $('meta[property="product:category"]').attr('content')?.trim()
    const seriesText = $('.series, .collection, .product-series, [data-testid="series"], [class*="series"], [class*="Series"]').first().text().trim()
    
    // Extract from breadcrumbs (e.g., "Home / Ornaments / Keepsake Ornaments")
    let extractedSeries = null
    if (breadcrumbText) {
      const breadcrumbParts = breadcrumbText.split('/').map(p => p.trim()).filter(p => p)
      // Usually the last part before the product name
      if (breadcrumbParts.length > 1) {
        extractedSeries = breadcrumbParts[breadcrumbParts.length - 1]
      }
    }
    
    let finalSeries = seriesText || extractedSeries || categoryMeta || null
    // Clean up whitespace and newlines
    if (finalSeries) {
      finalSeries = finalSeries.replace(/\s+/g, ' ').trim()
      // Remove duplicates if present (e.g., "Keepsake Ornaments\nKeepsake Ornaments")
      const parts = finalSeries.split(/\s+/)
      finalSeries = [...new Set(parts)].join(' ')
    }
    scrapedData.series_name = finalSeries
    console.log('Series extraction:', { breadcrumbText: breadcrumbText?.substring(0, 100), categoryMeta, seriesText, result: scrapedData.series_name })

    // Extract year released - look for year patterns
    const yearMatch = 
      $('.year, .release-year, .product-year').first().text().match(/\b(19|20)\d{2}\b/) ||
      scrapedData.title?.match(/\b(19|20)\d{2}\b/) ||
      scrapedData.description?.match(/\b(19|20)\d{2}\b/)
    
    if (yearMatch) {
      const year = parseInt(yearMatch[0])
      if (year >= 1900 && year <= new Date().getFullYear() + 1) {
        scrapedData.year_released = year
      }
    }

    // Extract SKU/product number - hallmark.com uses "Item number:" format
    // Search through all text nodes to find "Item number:" pattern
    let skuValue = null
    
    // Try to find text containing "Item number:"
    $('*').each((_, el) => {
      const text = $(el).text()
      if (text.includes('Item number:') || text.includes('Item Number:')) {
        // Try to extract SKU from this element's text
        const match = text.match(/Item\s+number:\s*([A-Z0-9]+)/i)
        if (match && match[1]) {
          skuValue = match[1]
          return false // break
        }
        // Try next sibling if current element doesn't have the SKU
        const nextText = $(el).next().text().trim()
        if (nextText && /^[A-Z0-9]+$/.test(nextText)) {
          skuValue = nextText
          return false // break
        }
      }
    })
    
    // Fallback to other selectors
    if (!skuValue) {
      skuValue = $('.sku, .product-sku, [data-testid="sku"], .product-number, [class*="item-number"], [class*="ItemNumber"]').first().text().trim() ||
                 $('meta[property="product:retailer_item_id"]').attr('content')?.trim() ||
                 $('meta[property="product:product_id"]').attr('content')?.trim() ||
                 null
      
      // Clean up if we got extra text
      if (skuValue && skuValue.includes('Item number:')) {
        const match = skuValue.match(/Item\s+number:\s*([A-Z0-9]+)/i)
        if (match && match[1]) {
          skuValue = match[1]
        }
      }
    }
    
    scrapedData.sku = skuValue || null
    console.log('SKU extraction:', { result: scrapedData.sku })

    // Clean up extracted data
    Object.keys(scrapedData).forEach((key) => {
      const value = scrapedData[key as keyof ScrapedProductData]
      if (typeof value === 'string' && value.trim() === '') {
        scrapedData[key as keyof ScrapedProductData] = null as any
      }
    })

    console.log('Scraped product data:', JSON.stringify(scrapedData, null, 2))

    return NextResponse.json({
      data: scrapedData,
      success: true,
    } as ScrapeProductResponse)
  } catch (error) {
    console.error('Error scraping product:', error)
    return NextResponse.json(
      {
        data: {
          title: null,
          description: null,
          brand: null,
          series_name: null,
          year_released: null,
          sku: null,
        },
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape product',
      } as ScrapeProductResponse,
      { status: 500 }
    )
  }
}

