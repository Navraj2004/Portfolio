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
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

/* =======================
   GEMINI INIT WITH AUTO MODEL DETECTION
======================= */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try models in order until one works
const MODELS_TO_TRY = [
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro-latest", 
  "gemini-1.5-pro",
  "gemini-pro",
  "models/gemini-pro"
];

let model = null;
let workingModel = null;

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
   GET WORKING MODEL
======================= */
async function getWorkingModel() {
  if (workingModel && model) {
    return { model, name: workingModel };
  }

  console.log("🔍 Testing available models...");
  
  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Testing: ${modelName}...`);
      const testModel = genAI.getGenerativeModel({ model: modelName });
      
      // Test with a simple prompt
      const result = await testModel.generateContent("Say hi");
      await result.response;
      
      console.log(`✅ Model working: ${modelName}`);
      model = testModel;
      workingModel = modelName;
      return { model: testModel, name: modelName };
      
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message.substring(0, 100));
    }
  }
  
  throw new Error("No working Gemini models found. Please check your API key.");
}

/* =======================
   LIST AVAILABLE MODELS ENDPOINT
======================= */
app.get("/list-models", async (req, res) => {
  try {
    const models = await genAI.listModels();
    res.json({
      models: models.map(m => ({
        name: m.name,
        displayName: m.displayName,
        supportedMethods: m.supportedGenerationMethods
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      hint: "Your API key might not have access to list models"
    });
  }
});

/* =======================
   TEST ENDPOINT
======================= */
app.get("/test-gemini", async (req, res) => {
  try {
    const { model: testModel, name } = await getWorkingModel();
    
    const result = await testModel.generateContent("Say 'Hello! I am working correctly!' in one sentence");
    const response = await result.response;
    const text = response.text();
    
    res.json({ 
      status: "SUCCESS",
      modelUsed: name,
      reply: text
    });
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    res.status(500).json({ 
      status: "FAILED",
      error: error.message,
      hint: "Your API key might be invalid or expired. Get a new one at https://aistudio.google.com/app/apikey"
    });
  }
});

/* =======================
   CHAT API
======================= */
app.post("/chat", async (req, res) => {
  const requestId = Date.now();
  console.log(`\n📨 [${requestId}] New chat request`);
  
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please provide a message" });
    }

    console.log(`📝 [${requestId}] Message: ${message}`);
    
    // Get or initialize working model
    const { model: chatModel, name: modelName } = await getWorkingModel();
    
    console.log(`🤖 [${requestId}] Using model: ${modelName}`);

    const prompt = `${navrajProfile}

User: ${message}
Assistant:`;

    const result = await chatModel.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();
    
    console.log(`✅ [${requestId}] Reply generated`);
    
    res.json({ reply });
    
  } catch (error) {
    console.error(`❌ [${requestId}] ERROR:`, error.message);
    
    let errorMessage = "AI temporarily unavailable. Please try again.";
    
    if (error.message.includes("API key")) {
      errorMessage = "Invalid API key. Please get a new one from https://aistudio.google.com/app/apikey";
    } else if (error.message.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later or upgrade your plan.";
    } else if (error.message.includes("No working")) {
      errorMessage = "Unable to find compatible AI model. Please check your API key permissions.";
    }
    
    res.status(500).json({ reply: errorMessage });
  }
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, async () => {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`${"=".repeat(60)}`);
  
  // Test model on startup
  try {
    const { name } = await getWorkingModel();
    console.log(`✅ Active Gemini model: ${name}`);
  } catch (error) {
    console.error(`❌ WARNING: Could not initialize Gemini model`);
    console.error(`   Error: ${error.message}`);
    console.error(`   The /chat endpoint may not work until this is resolved.`);
  }
  
  console.log(`\n📍 Endpoints:`);
  console.log(`   • Health: http://localhost:${PORT}/`);
  console.log(`   • Test: http://localhost:${PORT}/test-gemini`);
  console.log(`   • List Models: http://localhost:${PORT}/list-models`);
  console.log(`   • Chat: POST http://localhost:${PORT}/chat`);
  console.log(`${"=".repeat(60)}\n`);
});
