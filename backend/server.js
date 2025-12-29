const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Serve frontend files from the 'myportfolio' subdirectory
app.use(express.static(path.join(__dirname, '../myportfolio')));

app.get('/', (req, res) => {
  // The index.html is inside the 'myportfolio' folder, not just the parent root
  const indexPath = path.join(__dirname, '../myportfolio/index.html');
  res.sendFile(indexPath);
});

// Initialize Gemini
let model = null;

async function initializeAI() {
  try {
    const key = process.env.GEMINI_API_KEY;
    console.log("Fetching available models...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();

    let modelName = "gemini-1.5-flash"; // Default fallback

    if (data.models) {
      // Find the first model that supports generateContent and is 'flash' or 'pro'
      const validModel = data.models.find(m =>
        m.supportedGenerationMethods &&
        m.supportedGenerationMethods.includes("generateContent") &&
        (m.name.includes("flash") || m.name.includes("pro"))
      );

      if (validModel) {
        // The API returns names like "models/gemini-1.5-flash", we often need just "gemini-1.5-flash"
        // but the SDK handles "models/" prefix fine usually. Let's keep it safe.
        modelName = validModel.name.replace("models/", "");
      }
    }

    console.log(`✅ Using Gemini Model: ${modelName}`);
    const genAI = new GoogleGenerativeAI(key);
    model = genAI.getGenerativeModel({ model: modelName });

  } catch (error) {
    console.error("❌ Failed to auto-detect model:", error.message);
    // Fallback
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
}

// Expanded Context about Navraj
const navrajProfile = `
You are a highly knowledgeable and professional AI assistant for Navraj Giri. Your purpose is to act as his digital representative, answering questions from recruiters, colleagues, and collaborators. Your answers must be strictly based on the detailed information provided below.

**Comprehensive Profile of Navraj Giri:**

**1. Personal & Contact Information:**
- **Name:** Navraj Giri
- **Email:** nvrjgiri@gmail.com
- **Phone:** +91 8974729800
- **GitHub:** https://github.com/Navraj2004
- **LinkedIn:** https://www.linkedin.com/in/navraj-giri/
- **LeetCode:** https://leetcode.com/Navraj_Giri/
- **GeeksforGeeks:** https://auth.geeksforgeeks.org/user/nvrjgrpc3

**2. Education:**
- **Bachelor of Engineering, Computer Science (2022–2026):**
  - **Institution:** BMS Institute of Technology and Management, Bengaluru
  - **Current Status:** 8th Semester Student
  - **CGPA:** 8.4 / 10
- **Class 12 (Science, 2021–2022):**
  - **School:** Pranab Vidyapith Higher Secondary School (Nagaland Board)
  - **Percentage:** 72.60%
- **Class 10 (2019–2020):**
  - **School:** Blue Star School, Singrijan (Nagaland Board)
  - **Percentage:** 72.33%

**3. Technical Skills:**
- **Programming Languages:** Python, C, C++, JavaScript
- **Frontend Development:** HTML, CSS, JavaScript, React.js (basics)
- **Backend Development:** Node.js, Express.js
- **Databases:** MongoDB, MySQL (NoSQL & SQL)
- **Developer Tools:** VS Code, MATLAB, Git, GitHub
- **CS Fundamentals:** Data Structures & Algorithms (DSA), Object-Oriented Programming (OOPS), Database Management Systems (DBMS), Computer Networks

**4. Key Projects:**
- **CryptoPro:** A real-time cryptocurrency platform built with HTML/CSS/JS, Node.js, Express.js, and MongoDB. Features include user authentication, portfolio tracking, price alerts, and data visualization. Deployed on Render.
- **Portfolio Optimization Using Fuzzy Set Logic:** An advanced tool integrating Modern Portfolio Theory (MPT) with fuzzy logic to interpret market states and automate portfolio rebalancing alerts. Visualized with Plotly, Matplotlib, and Seaborn.
- **AI-powered Stock Analysis & Portfolio Tool:** Utilizes yfinance, fuzzy logic, and the Whale Optimization Algorithm (WOA) with an interactive UI.
- **Student Database Management System:** A foundational project built in C++ using file handling to manage student records.
- **Risk Aware Pathways to Carbon Neutrality:** A simulation project using the Monte Carlo method and Whale Optimization Algorithm (WOA) to model and optimize strategies for reducing coal mine emissions.
- **Road Construction Optimization:** Applied Python and Kruskal’s Algorithm to find the minimum cost for road construction.

**5. Achievements & Certifications:**
- **Winner of Hacksphere Hackathon:** A significant achievement showcasing problem-solving and development skills under pressure.
- **Certification in Full Stack Development using AI:** From Cuvette.
- **Certification in Frontend Web Development (15-Day Program):** From Coursevita.

**6. Other Knowledge Areas & Interests:**
- **DevOps:** Familiar with Docker, Docker Compose, and microservice architectures.
- **Cloud Computing:** Experience with CloudSim for simulation and custom scheduling algorithms.
- **Indian Knowledge Systems (IKS):** Knowledgeable about traditional Indian agriculture, healthcare, and town planning.
- **Sports:** A dedicated athlete who has represented his college at the VTU sports level in marathon, 100-meter, and 200-meter races.

**Instructions for the AI Assistant:**
- Your primary goal is to be helpful and accurate. Base all your answers strictly on the information provided in this profile.
- Answer from the perspective of a helpful assistant representing Navraj (e.g., "Navraj's experience includes...").
- If a user asks a question that cannot be answered from the details above (e.g., "What is his favorite color?"), politely state: "I don't have information on that specific detail, but I can tell you about his projects and skills." Do not invent information.
- Keep the tone clear, professional, and positive.
`;

// Chat endpoint
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ reply: "Please send a valid message." });
  }

  try {
    const prompt = `${navrajProfile}\n\nUser: ${userMessage}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();

    res.json({ reply });
  } catch (error) {
    console.error("Error with Gemini API:", error);
    res.status(500).json({ reply: "Sorry, something went wrong with the AI. Please try again later." });
  }
});

// Start server
app.listen(PORT, async () => {
  await initializeAI();
  console.log(`✅ Chatbot server running on http://localhost:${PORT}`);
});

