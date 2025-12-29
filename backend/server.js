const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ===== Middleware ===== */
app.use(cors());
app.use(bodyParser.json());

/* ===== Health Check ===== */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

/* ===== Gemini Init ===== */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.0-pro"   // ✅ FIXED MODEL
});

/* ===== Context ===== */
const navrajProfile = `
You are a professional AI assistant representing Navraj Giri.
Answer strictly from the data below.

Name: Navraj Giri
Education: B.E. Computer Science (2022–2026)
Institution: BMS Institute of Technology and Management
Current Semester: 8th
CGPA: 8.4 / 10

Skills:
Python, C, C++, JavaScript, HTML, CSS, Node.js, Express.js,
MongoDB, MySQL, DSA, OOPS, DBMS, Computer Networks

Projects:
• CryptoPro – Real-time crypto trading platform
• Portfolio Optimization using Fuzzy Logic
• AI-powered Stock Analysis Tool
• Student Database Management System (C++)
• Risk Aware Pathways to Carbon Neutrality
  – Uses Monte Carlo Simulation and Whale Optimization Algorithm
  – Focuses on emission uncertainty analysis and mitigation strategies
• Road Construction Optimization using Kruskal’s Algorithm

Achievements:
• Winner – Hacksphere Hackathon
• Full Stack Development using AI (Cuvette)
• Frontend Web Development (Coursevita)

Rules:
- Do not invent information
- Be concise and professional
`;

/* ===== Chat API ===== */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "Message is required" });
    }

    const prompt = `${navrajProfile}\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    res.status(500).json({
      reply: "AI temporarily unavailable. Please try again."
    });
  }
});

/* ===== Start Server ===== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
