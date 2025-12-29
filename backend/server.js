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
   GEMINI INIT (SAFE)
======================= */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash" // Updated model name
});

/* =======================
   CONTEXT
======================= */
const navrajProfile = `
You are an AI assistant for Navraj Giri.
Answer strictly from the information below.

Navraj Giri is a Computer Science Engineering student at
BMS Institute of Technology and Management, Bengaluru.

Education:
- B.E. Computer Science (2022–2026)
- Current Semester: 5th
- CGPA: 8.4 / 10

Key Project:
"Risk Aware Pathways to Carbon Neutrality"
- Uses Monte Carlo Simulation to estimate uncertainty in coal mine emissions
- Applies Whale Optimization Algorithm (WOA) to optimize mitigation strategies
- Focuses on reducing carbon footprint under risk conditions
- Aligns with SDG 13 (Climate Action)

Skills:
Python, C, C++, JavaScript, Node.js, Express, MongoDB, SQL

Rules:
- Do NOT invent information
- If unknown, say you don't know
`;

/* =======================
   CHAT API
======================= */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ reply: "Message required" });
    }

    const prompt = `${navrajProfile}

User: ${message}
Assistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();
    
    res.json({ reply });
    
  } catch (error) {
    console.error("❌ GEMINI ERROR:", error);
    
    // More detailed error response
    let errorMessage = "AI temporarily unavailable. Please try again.";
    
    if (error.message) {
      console.error("Error details:", error.message);
      
      // Check for specific error types
      if (error.message.includes("API key")) {
        errorMessage = "API key issue. Please check configuration.";
      } else if (error.message.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again later.";
      }
    }
    
    res.status(500).json({
      reply: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
