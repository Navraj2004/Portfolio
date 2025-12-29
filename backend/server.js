const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =======================
   MIDDLEWARE
======================= */
app.use(cors());
app.use(bodyParser.json());

/* =======================
   HEALTH CHECK ROUTE
======================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

/* =======================
   GEMINI INITIALIZATION
   (STABLE & SAFE)
======================= */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

/* =======================
   NAVRAJ PROFILE CONTEXT
======================= */
const navrajProfile = `
You are a highly knowledgeable and professional AI assistant for Navraj Giri.
Your purpose is to act as his digital representative.

Name: Navraj Giri
Email: nvrjgiri@gmail.com
Phone: +91 8974729800

Education:
- Bachelor of Engineering, Computer Science (2022–2026)
- Institution: BMS Institute of Technology and Management, Bengaluru
- Current Semester: 8th
- CGPA: 8.4 / 10

Skills:
- Python, C, C++, JavaScript
- HTML, CSS, JavaScript
- Node.js, Express.js
- MongoDB, MySQL
- DSA, OOPS, DBMS, Computer Networks

Projects:
- CryptoPro (crypto trading platform)
- Portfolio Optimization using Fuzzy Logic
- AI-powered Stock Analysis Tool
- Student Database Management System (C++)
- Risk Aware Pathways to Carbon Neutrality
- Road Construction Optimization (Kruskal)

Achievements:
- Winner of Hacksphere Hackathon
- Full Stack Development using AI (Cuvette)
- Frontend Web Development (Coursevita)

Rules:
- Answer ONLY from this data
- Do NOT invent anything
- Be professional and clear
`;

/* =======================
   CHAT API
======================= */
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Message is required" });
    }

    const prompt = `
${navrajProfile}

User: ${message}
Assistant:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();

    res.json({ reply });
  } } catch (error) {
  console.error("❌ Gemini Error FULL:", error);

  res.status(500).json({
    reply: "Gemini error",
    error: error.message || error.toString()
  });
}

});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
