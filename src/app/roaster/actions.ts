'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
// @ts-ignore
import pdf from 'pdf-parse'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!)

export async function roastCV(formData: FormData) {
  const file = formData.get('resume') as File
  
  if (!file) {
    return { error: 'No file provided' }
  }

  try {
    // 1. Extract Text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    // @ts-ignore
    const pdf = require('pdf-parse/lib/pdf-parse.js')
    const data = await pdf(buffer)
    const text = data.text

    if (!text || text.length < 50) {
      return { error: 'Could not extract enough text from PDF.' }
    }

    // 2. Analyze & Generate SVG with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
    const systemPrompt = `
    You are a savage career coach. Find the most pretentious, vague, or cliché sentence in this resume. 
    Roast it mercilessly but incorrectly. 
    
    Then, create a STUNNING, HIGH-QUALITY SVG image (1600x800) that visually represents this roast.
    - The SVG must have a dark background (#1a1b1e).
    - STYLE: "Detailed Neon Comic Book Stick Figures".
        - Use THICK white strokes (stroke-width="3") for characters, but add THINNER lines for details.
        - **CRITICAL: MAKE IT BIG.** Draw the characters LARGE and ZOOMED IN. Do not leave empty space.
        - DRAW A FULL SCENE: Add background elements (desks, computers, fire, mountains, clouds) relevant to the roast.
        - Add PROPS: Give the stick man items to hold or interact with.
        - Add SHADING/LIGHTING: Use semi-transparent shapes (opacity="0.3") to add depth or glow effects.
        - Make the stick figures EXPRESSIVE (exaggerated poses, big heads, facial expressions).
        - Add "action lines" or "impact bursts" (like in comics) to emphasize the roast.
        - Use a rich color palette: Neon Blue, Pink, Green, Yellow for different elements.
    - LAYOUT & TEXT (CRITICAL):
        - The image is 1600x800.
        - DRAWING AREA: The middle 60% of the height (y=150 to y=650).
        - QUOTE AREA: Top 15% (y=50). Use <text x="800" y="80" text-anchor="middle" font-family="sans-serif" font-style="italic" fill="#a0a0a0" font-size="24">...quote...</text>
        - ROAST AREA: Bottom 20% (y=700). Use <text x="800" y="750" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#ffffff" font-size="48">...roast...</text>
        - Ensure the roast text is broken into multiple lines (<tspan x="800" dy="1.2em">) if it's too long, so it fits width 1400.
    - WATERMARK: Bottom right corner, small text.
    
    Output ONLY JSON: { 
        "quote": "The sentence you found", 
        "roast": "Your savage joke", 
        "svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 800'>...</svg>" 
    }.
    `
    
    const result = await model.generateContent([systemPrompt, text])
    const response = await result.response
    const jsonText = response.text().replace(/```json/g, '').replace(/```/g, '')
    const analysis = JSON.parse(jsonText)

    if (!analysis.svg) {
        throw new Error('Failed to generate SVG')
    }

    return { svg: analysis.svg }

  } catch (error: any) {
    console.error('Roaster Error:', error)
    return { error: error.message || 'Failed to roast CV' }
  }
}
