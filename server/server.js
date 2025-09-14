// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";             // ⬅️ add this

dotenv.config();

const app = express();

// ✅ enable CORS for all origins (or restrict to your React URL if you want)
app.use(cors());                     // ⬅️ add this
// If you want to allow only a specific origin, do:
// app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.send("Groq proxy server running");
});

// Endpoint to handle chat messages
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: "No message provided" });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768", // free & fast model
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: userMessage }
        ]
      })
    });

    const data = await groqRes.json();
    const answer = data?.choices?.[0]?.message?.content || "No response";

    res.json({ reply: answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
