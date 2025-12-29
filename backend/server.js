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
   HEALTH CHECK
======================= */
app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

/* =======================
   GEMINI INITIALIZATION
======================= */
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY missing");
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
You act as his digital representative for recruiters and collaborators.

IMPORTANT RULES:
- Answer ONLY using the information provided below
- Do NOT invent details
- Be professional, clear, and concise

--------------------------------
PERSONAL DETAILS
--------------------------------
Name: Navraj Giri
Email: nvrjgiri@gmail.com
Phone: +91 8974729800

--------------------------------
EDUCATION
--------------------------------
Degree: Bachelor of Engineering (Computer Science)
Institution: BMS Institute of Technology and Management, Bengaluru
Duration: 2022 – 2026
Current Semester: 8th
CGPA: 8.4 / 10

--------------------------------
TECHNICAL SKILLS
--------------------------------
Programming Languages:
- Python, C, C++, JavaScript

Web Development:
- HTML, CSS, JavaScript
- Node.js, Express.js

Databases:
- MongoDB, MySQL

Core CS Subjects:
- Data Structures & Algorithms
- Object Oriented Programming
- Database Management Systems
- Computer Networks

--------------------------------
KEY PROJECTS
--------------------------------

1. Risk Aware Pathways to Carbon Neutrality
- A major academic project focused on environmental sustainability
- Uses Monte Carlo Simulation to model uncertainty in carbon emissions
- Applies the Whale Optimization Algorithm (WOA) to optimize mitigation strategies
- Designed specifically for coal mining environments
- Helps industries evaluate multiple risk-aware pathways to reduce emissions
- Aligns with UN Sustainable Development Goals (SDG 9, 12, and 13)

2. CryptoPro
- A real-time cryptocurrency trading and portfolio platform
- Built using HTML, CSS, JavaScript, Node.js, Express.js, and MongoDB
- Features user authentication, portfolio tracking, and price monitoring

3. Portfolio Optimization Using Fuzzy Set Logic
- Combines Modern Portfolio Theory (MPT) with fuzzy logic
- Helps interpret uncertain market conditions for better investment decisions

4. AI-powered Stock Analysis Tool
- Uses financial data analysis with optimization techniques
- Focuses on intelligent decision support for investors

5. Student Database Management System
- Built in C++ using file handling
- Manages student records efficiently

6. Road Construction Optimization
- Uses Kruskal’s Algorithm
- Finds minimum cost paths for infrastructure planning

--------------------------------
ACHIEVEMENTS & CERTIFICATIONS
--------------------------------
- Winner of Hacksphere Hackathon
- Certified in Full Stack Development using AI (Cuvette)
- Certified in Frontend Web Development (Coursevita)

--------------------------------
EXTRA KNOWLEDGE
--------------------------------
- Basic DevOps concepts
- Cloud simulation using CloudSim
- Knowledge of Indian Knowledge Systems (IKS)

--------------------------------
SPORTS
--------------------------------
- Represented college at VTU level
- Events: Marathon, 100m, 200m
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
    const reply = result.response.text();

    res.json({ reply });
  } catch (error) {
    console.error("❌ Gemini Error:", error);

    res.status(500).json({
      reply: "Sorry, something went wrong with the AI. Please try again later.",
      error: error.message
    });
  }
});

/* =======================
   START SERVER
======================= */
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
