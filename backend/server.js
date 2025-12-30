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
  "gemini-2.5-flash",   // ✅ confirmed working
  "gemini-1.5-flash",   // fallback
  "gemini-1.5-pro"      // fallback
];

let model = null;
let workingModel = null;

/* =======================
   CONTEXT
======================= */
const navrajProfile = `You are an AI assistant for Navraj Giri.
Answer strictly from the information below.

Navraj Giri is a final-year Computer Science and Engineering student at BMS Institute of Technology and Management, Bengaluru, pursuing a Bachelor of Engineering (B.E.) degree from 2022 to 2026. He is currently in his 8th semester and has consistently demonstrated strong academic performance with a CGPA of 8.4 out of 10. His academic journey reflects a solid foundation in computer science principles combined with practical, hands-on project experience.

Navraj’s interest lies primarily in software development, data-driven systems, optimization techniques, and applied artificial intelligence. Over the course of his degree, he has actively worked on multiple academic and self-driven projects that bridge theoretical knowledge with real-world applications.

Academic Background and Learning Focus

As a Computer Science Engineering student, Navraj has studied and applied core subjects such as:

Programming fundamentals

Data Structures and Algorithms (DSA)

Database Management Systems

Operating Systems

Computer Networks

Software Engineering

Cloud Computing concepts

In addition to theoretical learning, he strongly focuses on practical implementation, which is evident from the number and diversity of projects he has completed. His academic approach emphasizes understanding why a solution works rather than simply memorizing syntax or formulas.

Technical Skills Overview

Navraj has developed a strong and versatile technical skill set across multiple domains:

Programming Languages

He is proficient in:

Python – used extensively for simulations, optimization algorithms, and data analysis

C and C++ – used for system-level programming, performance-oriented tasks, and file-handling projects

JavaScript – used for frontend and backend web development

Web and Backend Development

Navraj has hands-on experience with:

Node.js and Express.js for backend API development

HTML, CSS, and JavaScript for frontend user interfaces

RESTful API design and client–server communication

Databases

He has worked with:

SQL for relational database design and querying

MongoDB (NoSQL) for modern web applications requiring flexible data models

Tools and Platforms

Navraj is comfortable using:

VS Code and IntelliJ IDEA as development environments

MATLAB for simulation and numerical experimentation

Docker and Docker Compose for containerization and microservices

Maven and Gradle for Java project build and dependency management

Major Academic and Technical Projects
1. Risk Aware Pathways to Carbon Neutrality Using Monte Carlo Simulations

This is Navraj’s major project and one of his most technically significant works. The project addresses the critical global challenge of carbon emissions in coal mining, with a focus on uncertainty and risk-aware decision-making.

Project Objective

The goal of this project is to estimate carbon emissions under uncertain conditions and identify optimized mitigation strategies that help move toward carbon neutrality.

Methodology

Monte Carlo Simulation is used to model uncertainty in emission factors, operational conditions, and environmental variables. Instead of relying on a single deterministic value, thousands of simulations are run to understand possible emission outcomes.

Whale Optimization Algorithm (WOA), a nature-inspired optimization algorithm, is applied to identify optimal mitigation strategies that minimize emissions while considering risk.

The system evaluates multiple scenarios to determine strategies that are robust under uncertainty rather than ideal only under perfect conditions.

Key Contributions

Introduces a risk-aware framework instead of a fixed estimation model

Helps policymakers and engineers understand emission variability

Supports informed decision-making under uncertainty

Relevance

This project aligns with Sustainable Development Goal (SDG) 13 – Climate Action, making it socially relevant as well as technically advanced.

2. Cryptocurrency Trading Platform

Navraj developed a full-stack cryptocurrency trading platform that allows users to simulate or perform buy and sell operations.

Technologies Used

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

Database: MongoDB

Key Features

User-friendly interface

Secure API-based backend

Database-driven transaction handling

Modular and scalable design

This project demonstrates Navraj’s ability to build end-to-end web applications, covering frontend design, backend logic, and database integration.

3. Portfolio Optimization Tool for Indian Stocks

This project focuses on financial optimization using computational intelligence.

Core Concepts

Modern Portfolio Theory (MPT)

Fuzzy set logic to handle uncertainty in market behavior

Implementation

Developed using Python

Integrates stock data analysis with optimization techniques

Aims to balance risk and return for Indian stock portfolios

This project highlights Navraj’s interest in optimization, data analysis, and applied mathematics in real-world domains.

4. Student Database Management System

This project was implemented using C++ and file handling techniques.

Functionality

Stores and manages student records

Performs CRUD operations (Create, Read, Update, Delete)

Focuses on efficiency and structured data management

It demonstrates strong fundamentals in C++ programming and system-level thinking.

Additional Experience and Learning
Internship Experience

Navraj has completed a four-week virtual internship, where he gained exposure to professional workflows, problem-solving practices, and applied technical skills.

Cloud and Simulation Work

He has worked with CloudSim, a simulation framework used to model cloud computing environments. He also implemented a custom scheduling algorithm, which required understanding resource allocation and performance optimization.

DevOps and Build Tools

Navraj has hands-on experience with:

Docker for containerizing applications

Docker Compose for managing multi-service systems

Maven and Gradle for Java-based project builds

Hackathons

He has participated in and won a hackathon, demonstrating teamwork, innovation, and the ability to work under time constraints.

Learning Approach and Strengths

Navraj prefers clear, concept-based explanations and often relates abstract ideas to real-world or mechanical analogies. This learning style helps him deeply understand complex topics such as optimization algorithms, simulations, and system architectures.

His strengths include:

Strong problem-solving ability

Ability to learn new technologies independently

Balance between theory and implementation

Attention to correctness and performance

Overall Summary

Navraj Giri is a final-year Computer Science Engineering student with a strong academic record and a diverse project portfolio. His work spans multiple domains including artificial intelligence, optimization, cloud simulation, web development, and sustainability-focused computing.

He combines solid programming fundamentals with modern tools and frameworks, making him capable of building scalable, real-world systems. His major project on carbon neutrality reflects both technical depth and social responsibility, while his other projects demonstrate versatility across web, finance, and systems programming.

Overall, Navraj represents a well-rounded engineering graduate with the skills, mindset, and experience required for modern software and technology roles.`;

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
