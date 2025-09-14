import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.get("/", (req, res) => res.send("Groq proxy server running"));

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("Incoming body:", req.body);

    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    console.log("Using Groq key starts with:", groqKey.slice(0, 8));

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: userMessage }
        ]
      })
    });

    console.log("Groq status:", groqRes.status);
    const data = await groqRes.json();
    console.log("Groq response:", data);

    if (!data?.choices?.[0]) {
      return res.status(500).json({ error: "Groq API returned no choices", raw: data });
    }

    const answer = data.choices[0].message.content;
    res.json({ reply: answer });
  } catch (err) {
    console.error("Server crashed:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
