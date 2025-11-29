const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyAOzIyuN4MefQAWl9SvNvARKHG0OqrRiMg");

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // actually, let's list models
        // The SDK doesn't have a direct listModels on the instance in some versions, 
        // but usually we can try to just run a simple prompt on a known working model like gemini-pro
        // or try to find the list method.
        // Wait, the error message suggested "Call ListModels".
        // In the Node SDK, it might not be directly exposed easily without a helper.
        // Let's try gemini-1.5-flash-001 first as a guess in the actual code, it's faster.

        console.log("Testing gemini-1.5-flash-001...");
        const model001 = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model001.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

run();
