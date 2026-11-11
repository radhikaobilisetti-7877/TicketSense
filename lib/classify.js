// lib/classify.js — LLM call + validation
const path = require("path");
const teams = require(path.join(__dirname, "..", "teams.json"));

const VALID_PRIORITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = Object.keys(teams);

/**
 * Build the system prompt from the current teams.json keys.
 */
function buildSystemPrompt(name, department) {
  const categoryList = CATEGORIES.join(", ");
  const requesterInfo = name && department
    ? `Requester: ${name}, Department: ${department}. Address the requester by first name in the suggested_reply. The department is context only and must NOT change the category choice or the priority.`
    : "Address the requester by first name if known in the suggested_reply.";

  return [
    "You are a helpdesk ticket classifier. Given a support ticket, classify it and respond with ONLY valid JSON (no markdown, no explanation).",
    "",
    requesterInfo,
    "",
    `Categories (pick exactly one): ${categoryList}`,
    "",
    "Priority guide:",
    "  Critical = outage, security breach, or many users blocked",
    "  High     = one user fully blocked",
    "  Medium   = degraded but a workaround exists",
    "  Low      = request or question",
    "",
    "Respond with this JSON schema ONLY:",
    '{"category": "<one of the categories above>", "priority": "<Low|Medium|High|Critical>", "suggested_reply": "<2-3 polite sentences addressed to the user>"}',
  ].join("\n");
}

/**
 * Call Groq LLM and return raw parsed JSON.
 */
async function callLLM(ticketText, name, department) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const err = new Error("GROQ_API_KEY is not configured on the server.");
    err.statusCode = 500;
    throw err;
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(name, department) },
        { role: "user", content: ticketText },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(
      `LLM request failed (${res.status}): ${body.slice(0, 200)}`
    );
    err.statusCode = 502;
    throw err;
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("LLM returned an empty response.");
    err.statusCode = 502;
    throw err;
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    const err = new Error("LLM response was not valid JSON.");
    err.statusCode = 502;
    throw err;
  }

  return parsed;
}

/**
 * Normalize and validate the LLM output.
 */
function validate(raw) {
  // --- category ---
  let category = String(raw.category || "").trim();
  const match = CATEGORIES.find(
    (c) => c.toLowerCase() === category.toLowerCase()
  );
  category = match || "Other";

  // --- priority ---
  let priority = String(raw.priority || "").trim();
  const pMatch = VALID_PRIORITIES.find(
    (p) => p.toLowerCase() === priority.toLowerCase()
  );
  priority = pMatch || "Medium";

  // --- team ---
  const team = teams[category];

  // --- reply ---
  const reply = String(raw.suggested_reply || "No reply generated.");

  return { category, priority, team, reply };
}

/**
 * Public API: classify a ticket string.
 * Returns { category, priority, team, reply }.
 */
async function classify(ticketText, name, department) {
  const raw = await callLLM(ticketText, name, department);
  return validate(raw);
}

// Expose internals for testing
classify.validate = validate;
classify.CATEGORIES = CATEGORIES;

module.exports = classify;
