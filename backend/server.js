const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Check for API Key immediately
if (!process.env.GEMINI_API_KEY) {
  console.error("CRITICAL ERROR: GEMINI_API_KEY is missing from .env file");
  process.exit(1);
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Using gemini-1.5-flash for better performance and reliability
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const navrajProfile = `
You are a helpful and professional AI assistant representing Navraj Giri. 
Use the following details to answer questions. If the information isn't here, politely say you don't know.

Education:
- B.E. in Computer Science (2022–2026)
- Institution: BMS Institute of Technology and Management
- Current Status: 8th Semester
- Academic Record: CGPA 8.4

Major Project:
- Title: Risk Aware Pathways to Carbon Neutrality
- Tech: Monte Carlo Simulation (uncertainty modeling), Whale Optimization Algorithm (WOA)
- Focus: Reducing coal mining emissions, aligned with SDG 9, 12, and 13.

Skills:
- Languages/Tech: Python, C, C++, JavaScript, Node.js, Express, MongoDB, MySQL
`;

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    // Modern Gemini 1.5 approach using startChat for better context handling
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: navrajProfile }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am now acting as Navraj Giri's assistant. How can I help?" }],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    // Detailed logging to your terminal to find the "real" error
    console.error("--- Gemini API Error ---");
    console.error("Message:", error.message);
    
    // Check for specific common errors
    if (error.message.includes("429")) {
        console.error("Error Type: Rate Limit Exceeded");
    } else if (error.message.includes("location not supported")) {
        console.error("Error Type: Regional Restriction (Use a Proxy or VPN)");
    }

    res.status(500).json({
      reply: "AI temporarily unavailable. Check server logs for details.",
      error: error.message // Optional: Remove this in production for security
    });
  }
});

app.get("/", (req, res) => {
  res.json({ status: "Backend is running" });
});

app.listen(PORT, () => {
  console.log(`Server is live at http://localhost:${PORT}`);
});
