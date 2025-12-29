const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro"
});

const navrajProfile = `
You are an AI assistant representing Navraj Giri.

Education:
- B.E. Computer Science (2022–2026)
- BMS Institute of Technology and Management
- 8th Semester, CGPA 8.4

Major Project:
Risk Aware Pathways to Carbon Neutrality:
- Uses Monte Carlo Simulation for uncertainty modeling
- Uses Whale Optimization Algorithm (WOA)
- Focused on coal mining emission reduction
- Aligns with SDG 9, 12, and 13

Skills:
Python, C, C++, JavaScript, Node.js, Express, MongoDB, MySQL

Rules:
Answer ONLY from this data.
Do NOT invent.
`;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "Message is required" });
    }

    const prompt = `${navrajProfile}\nUser: ${message}\nAssistant:`;
    const result = await model.generateContent(prompt);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Gemini Error:", error.message);
    res.status(500).json({
      reply: "AI temporarily unavailable. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
