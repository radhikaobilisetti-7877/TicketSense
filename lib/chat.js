// lib/chat.js — Continuous chat LLM logic
async function chat({ ticket, category, priority, team, message, history, name, department }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured on the server.");
    err.statusCode = 500;
    throw err;
  }

  const requesterLine = name && department
    ? `Requester: ${name}, Department: ${department}. Address the requester by first name.`
    : (name ? `Requester: ${name}. Address the requester by first name.` : "");

  const systemPrompt = [
    "You are a helpful IT helpdesk assistant.",
    requesterLine,
    "Ticket: " + ticket,
    "Category: " + category,
    "Priority: " + priority,
    "Owning team: " + team,
    "",
    "Continue the conversation naturally and help resolve the issue with clear, concise, practical answers (2-4 sentences unless asked for more).",
    "If the user asks to change your previous reply, rewrite it.",
    "If the user only sends a greeting, greet back briefly and ask how you can help.",
    "No placeholders like [Name].",
  ].filter(Boolean).join("\n");

  const trimmedHistory = (history || []).slice(-12);

  const messages = [
    { role: "system", content: systemPrompt },
    ...trimmedHistory,
    { role: "user", content: message },
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      temperature: 0.5,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(
      "LLM request failed (" + res.status + "): " + body.slice(0, 200)
    );
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    const err = new Error("LLM returned an empty response.");
    err.statusCode = 502;
    throw err;
  }

  return reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

module.exports = chat;
