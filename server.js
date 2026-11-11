// server.js — Express app setup
require("dotenv").config();
const express = require("express");
const path = require("path");
const { getCategories, postClassify, postChat } = require("./lib/handler");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/categories", getCategories);
app.post("/api/classify", postClassify);
app.post("/api/chat", postChat);

app.listen(PORT, () => {
  console.log(`TicketSense running at http://localhost:${PORT}`);
});

module.exports = app;
