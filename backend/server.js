const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

// 🔐 Gemini Init
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "models/gemini-1.0-pro"
});

// 🧠 Context
const navrajProfile = `
You are an AI assistant representing Navraj Giri.

Education:
- B.E. Computer Science (2022–2026)
- BMS Institute of Technology and Management
- Current Semester: 8th
- CGPA: 8.4

Projects:
- Risk Aware Pathways to Carbon Neutrality:
  Uses Monte Carlo Simulation to model uncertainty in carbon emissions
  and Whale Optimization Algorithm to optimize mitigation strategies.

Rules:
- Answer strictly from this information
- Be professional
`;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "Message required" });
    }

    const prompt = `${navrajProfile}\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    res.status(500).json({
      reply: "AI temporarily unavailable. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on ${PORT}`);
});
