// lib/handler.js — Express request handlers
const path = require("path");
const classify = require("./classify");
const chat = require("./chat");
const teams = require(path.join(__dirname, "..", "teams.json"));

const MAX_TICKET = 4000;
const MAX_CHAT_MSG = 2000;
const MAX_HISTORY = 12;
const VALID_DEPARTMENTS = [
  "HR",
  "Finance",
  "IT",
  "Sales",
  "Marketing",
  "Operations",
  "Legal",
  "Other",
];

function sanitizeDepartment(dept) {
  if (typeof dept !== "string") return "Other";
  const trimmed = dept.trim();
  const match = VALID_DEPARTMENTS.find(
    (d) => d.toLowerCase() === trimmed.toLowerCase()
  );
  return match || "Other";
}

function sanitizeName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 60) return null;
  return trimmed;
}

/**
 * GET /api/categories
 */
function getCategories(_req, res) {
  res.json(Object.keys(teams));
}

/**
 * POST /api/classify
 * Body: { ticket, name, department }
 */
async function postClassify(req, res) {
  try {
    const rawTicket = (req.body && req.body.ticket) || "";
    const rawName = req.body && req.body.name;
    const rawDept = req.body && req.body.department;

    if (typeof rawTicket !== "string" || rawTicket.trim().length === 0) {
      return res.status(400).json({ error: "Ticket text is required." });
    }

    if (rawTicket.length > MAX_TICKET) {
      return res
        .status(400)
        .json({ error: "Ticket must be " + MAX_TICKET + " characters or fewer." });
    }

    const name = sanitizeName(rawName);
    if (!name) {
      return res.status(400).json({ error: "Name is required (1 to 60 characters)." });
    }

    const department = sanitizeDepartment(rawDept);

    const result = await classify(rawTicket.trim(), name, department);
    return res.json({
      ...result,
      name,
      department,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 502
        ? "The AI service is temporarily unavailable. Please try again in a moment."
        : err.message || "Internal server error.";
    return res.status(status).json({ error: message });
  }
}

/**
 * POST /api/chat
 * Body: { ticket, category, priority, team, history, message, name, department }
 * Returns: { reply }
 */
async function postChat(req, res) {
  try {
    const { ticket, category, priority, team, message, history, name: rawName, department: rawDept } =
      req.body || {};

    if (!ticket || typeof ticket !== "string" || !ticket.trim()) {
      return res.status(400).json({ error: "Ticket context is required." });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Message is required." });
    }
    if (message.length > MAX_CHAT_MSG) {
      return res
        .status(400)
        .json({ error: "Message must be " + MAX_CHAT_MSG + " characters or fewer." });
    }

    const name = sanitizeName(rawName);
    if (!name) {
      return res.status(400).json({ error: "Name is required (1 to 60 characters)." });
    }

    const department = sanitizeDepartment(rawDept);

    const safeHistory = Array.isArray(history)
      ? history.slice(-MAX_HISTORY)
      : [];

    const reply = await chat({
      ticket: String(ticket).trim(),
      category: String(category || "Other"),
      priority: String(priority || "Medium"),
      team: String(team || "Service Desk (L1)"),
      message: message.trim(),
      history: safeHistory,
      name,
      department,
    });

    return res.json({ reply });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      status === 502
        ? "The AI service is temporarily unavailable. Please try again in a moment."
        : err.message || "Internal server error.";
    return res.status(status).json({ error: message });
  }
}

module.exports = {
  getCategories,
  postClassify,
  postChat,
  VALID_DEPARTMENTS,
  sanitizeDepartment,
  sanitizeName,
};
