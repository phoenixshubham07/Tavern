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

async function testModel(modelName, prompt) {
    console.log(`Testing ${modelName} with prompt: "${prompt}"...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Check for images in parts
        if (response.candidates && response.candidates[0].content.parts) {
            response.candidates[0].content.parts.forEach((part, index) => {
                if (part.inlineData) {
                    console.log(`Part ${index}: Found inlineData (Image)! MimeType: ${part.inlineData.mimeType}`);
                } else if (part.text) {
                    console.log(`Part ${index}: Text: ${part.text.substring(0, 50)}...`);
                } else {
                    console.log(`Part ${index}: Unknown type`, Object.keys(part));
                }
            });
        }
    } catch (e) {
        console.error(`Error testing ${modelName}:`, e.message);
    }
}

// Check if gemini-flash-latest works (Image Prompt)
testModel("gemini-flash-latest", "Generate a cute cartoon image of a robot.");
