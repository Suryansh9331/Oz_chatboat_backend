// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load env vars
dotenv.config();

const companyData = fs.readFileSync(
  path.join(__dirname, "kb", "company.txt"),
  "utf8"
);

const app = express();
app.use(cors());
app.use(express.json());

// Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ reply: "No question provided." });
    }

    // Always send only company data + current question
    const messages = [
      {
        role: "system",
        content: `You are a helpful assistant who only answers based on the following company information. 
If you cannot answer from the information, say exactly: "I don’t know based on company data."

Company information:
-----------------
${companyData}
-----------------`,
      },
      { role: "user", content: question },
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // updated model
      messages,
    });

    const answer =
      completion?.choices?.[0]?.message?.content ||
      "Sorry, I couldn’t generate a reply.";

    res.json({ reply: answer });
  } catch (err) {
    // Log full error to see what’s going on
    console.error("Error in /api/chat:", err.response?.data || err.message);
    res.status(500).json({ reply: "Server error." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
