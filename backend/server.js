const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(bodyParser.json());

/* =======================
   DIAGNOSTIC ENDPOINT
======================= */
app.get("/diagnostic", (req, res) => {
  res.json({
    status: "Backend is running",
    apiKeyPresent: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

/* =======================
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

/* =======================
   GEMINI INIT WITH BETTER ERROR HANDLING
======================= */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing in environment variables");
  console.error("Please set it using: export GEMINI_API_KEY='your-key-here'");
  process.exit(1);
}

console.log("✅ API Key found, length:", process.env.GEMINI_API_KEY.length);

let genAI, model;

try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Try models in order of preference
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
  const modelToUse = "gemini-1.5-flash"; // Use the latest stable model
  
  model = genAI.getGenerativeModel({
    model: modelToUse
  });
  console.log(`✅ Gemini model initialized successfully: ${modelToUse}`);
} catch (error) {
  console.error("❌ Failed to initialize Gemini:", error.message);
  process.exit(1);
}

/* =======================
   CONTEXT
======================= */
const navrajProfile = `You are an AI assistant for Navraj Giri.
Answer strictly from the information below.

Navraj Giri is a Computer Science Engineering student at BMS Institute of Technology and Management, Bengaluru.

Education:
- B.E. Computer Science (2022–2026)
- Current Semester: 5th
- CGPA: 8.4 / 10

Key Project: "Risk Aware Pathways to Carbon Neutrality"
- Uses Monte Carlo Simulation to estimate uncertainty in coal mine emissions
- Applies Whale Optimization Algorithm (WOA) to optimize mitigation strategies
- Focuses on reducing carbon footprint under risk conditions
- Aligns with SDG 13 (Climate Action)

Skills: Python, C, C++, JavaScript, Node.js, Express, MongoDB, SQL

Rules:
- Do NOT invent information
- If unknown, say you don't know`;

/* =======================
   TEST ENDPOINT (SIMPLE)
======================= */
app.get("/test-gemini", async (req, res) => {
  console.log("🧪 Testing Gemini API...");
  
  try {
    const result = await model.generateContent("Say 'Hello, I am working!' in one sentence");
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ Gemini test successful:", text);
    
    res.json({ 
      status: "SUCCESS", 
      reply: text,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Gemini test failed:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      status: "FAILED", 
      errorName: error.name,
      errorMessage: error.message,
      fullError: error.toString()
    });
  }
});

/* =======================
   CHAT API (ENHANCED LOGGING)
======================= */
app.post("/chat", async (req, res) => {
  const requestId = Date.now();
  console.log(`\n📨 [${requestId}] New chat request received`);
  
  try {
    const { message } = req.body;
    
    console.log(`📝 [${requestId}] Message:`, message);
    
    if (!message || message.trim() === "") {
      console.log(`⚠️ [${requestId}] Empty message received`);
      return res.status(400).json({ reply: "Please provide a message" });
    }

    const prompt = `${navrajProfile}

User: ${message}
Assistant:`;

    console.log(`🤖 [${requestId}] Sending to Gemini...`);
    
    const result = await model.generateContent(prompt);
    
    console.log(`📥 [${requestId}] Received response from Gemini`);
    
    const response = await result.response;
    const reply = response.text();
    
    console.log(`✅ [${requestId}] Reply:`, reply.substring(0, 100) + "...");
    
    res.json({ reply });
    
  } catch (error) {
    console.error(`\n❌ [${requestId}] ERROR OCCURRED:`);
    console.error(`Error Type: ${error.constructor.name}`);
    console.error(`Error Message: ${error.message}`);
    console.error(`Error Stack:`, error.stack);
    
    // Check for specific error types
    let errorMessage = "AI temporarily unavailable. Please try again.";
    let statusCode = 500;
    
    if (error.message) {
      const msg = error.message.toLowerCase();
      
      if (msg.includes("api key") || msg.includes("invalid key")) {
        errorMessage = "Invalid API key. Please check configuration.";
        console.error("💡 Hint: Verify your GEMINI_API_KEY is correct");
      } else if (msg.includes("quota") || msg.includes("rate limit")) {
        errorMessage = "API quota exceeded. Please try again later.";
        console.error("💡 Hint: Check your Gemini API quota at https://aistudio.google.com");
      } else if (msg.includes("safety") || msg.includes("blocked")) {
        errorMessage = "Response was blocked by safety filters. Try rephrasing.";
      } else if (msg.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
      } else if (msg.includes("network") || msg.includes("fetch")) {
        errorMessage = "Network error. Check your internet connection.";
      }
    }
    
    res.status(statusCode).json({
      reply: errorMessage,
      debug: {
        errorType: error.constructor.name,
        errorMessage: error.message
      }
    });
  }
});

/* =======================
   ERROR HANDLER
======================= */
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ 
    reply: "Server error occurred",
    error: err.message 
  });
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🔍 Diagnostic endpoint: http://localhost:${PORT}/diagnostic`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test-gemini`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/chat`);
  console.log(`${"=".repeat(50)}\n`);
});
