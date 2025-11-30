const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Read API Key
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GOOGLE_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
    console.error("Could not find GOOGLE_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testSVG() {
    console.log("Testing SVG generation...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const prompt = `
        You are a savage career coach. 
        Generate a roast for a resume.
        Then, create a simple, funny, artistic SVG image that visually represents this roast.
        The SVG should be self-contained and look good on a dark background.
        Output ONLY JSON: { "roast": "The text roast", "svg": "<svg>...</svg>" }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Response:", text.substring(0, 200) + "...");

        // Try to parse JSON
        const jsonText = text.replace(/```json/g, '').replace(/```/g, '');
        const json = JSON.parse(jsonText);
        if (json.svg && json.svg.startsWith('<svg')) {
            console.log("Success! Generated SVG.");
            console.log("SVG Length:", json.svg.length);
        } else {
            console.log("Failed to generate valid SVG JSON.");
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

testSVG();
