// public/app.js — TicketSense "ticket comes alive" UI (3-step flow)
const API_BASE = "";

// ─── Icons ───
const CAT_ICONS = {
  Network:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  Hardware:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  Software:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="7 8 10 11 7 14"/><line x1="13" y1="14" x2="17" y2="14"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  "Access & Accounts":'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  Email:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  Security:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  Other:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
const AI_AVATAR = '<svg width="30" height="30" viewBox="0 0 32 32" fill="none"><defs><linearGradient id="av" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse"><stop stop-color="#6BB20A"/><stop offset="1" stop-color="#4D8906"/></linearGradient></defs><rect width="32" height="32" rx="9" fill="url(#av)"/><path d="M19 7H11a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V11l-4-4z" fill="rgba(255,255,255,.15)" stroke="#fff" stroke-width="1.3"/><path d="M19 7v4h4" stroke="#fff" stroke-width="1.3"/><path d="M12.5 17l2.5 2.5L19.5 14" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// ─── DOM ───
const $ = (s) => document.getElementById(s);
const landingView = $("landingView");
const resultView = $("resultView");
const newTicketBtn = $("newTicketBtn");
const themeToggle = $("themeToggle");

// 3-step elements
const step1 = $("step1");
const step2 = $("step2");
const step3 = $("step3");
const dot1 = $("dot1");
const dot2 = $("dot2");
const dot3 = $("dot3");
const nameInput = $("nameInput");
const deptSelect = $("deptSelect");
const step3Title = $("step3Title");
const step1NextBtn = $("step1NextBtn");
const step2BackBtn = $("step2BackBtn");
const step2NextBtn = $("step2NextBtn");
const step3BackBtn = $("step3BackBtn");

// Ticket input elements
const textarea = $("ticketInput");
const charCount = $("charCount");
const triageBtn = $("triageBtn");

// Result elements
const ticketStub = $("ticketStub");
const stubRequester = $("stubRequester");
const stickyBar = $("stickyBar");
const stickyRequester = $("stickyRequester");
const chatArea = $("chatArea");
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");
const errorToast = $("errorToast");
const errorText = $("errorText");
const retryBtn = $("retryBtn");

// ─── State ───
let currentStep = 1;
let userName = "";
let userDept = "Finance";
let result = null;
let ticket = "";
let chatHistory = [];
let chatBusy = false;
let errorTimeout = null;

// ─── Theme ───
function prefTheme() {
  var s = localStorage.getItem("ticketsense-theme");
  if (s) return s;
  return matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light";
}
function setTheme(t) { document.documentElement.setAttribute("data-theme", t); localStorage.setItem("ticketsense-theme", t); }
setTheme(prefTheme());
themeToggle.addEventListener("click", function() {
  setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// ─── Parallax blobs ───
var blobs = document.querySelectorAll(".blob");
var prefersRM = matchMedia("(prefers-reduced-motion:reduce)").matches;
if (!prefersRM) {
  document.addEventListener("mousemove", function(e) {
    var x = (e.clientX / innerWidth - 0.5) * 2;
    var y = (e.clientY / innerHeight - 0.5) * 2;
    blobs.forEach(function(b, i) {
      var f = (i + 1) * 10;
      b.style.setProperty("--px", x * f + "px");
      b.style.setProperty("--py", y * f + "px");
    });
  });
}

// ─── Step Navigation ───
function getFirstName(fullName) {
  if (!fullName) return "";
  var parts = fullName.trim().split(/\s+/);
  return parts[0] || "";
}

function goToStep(targetStep, direction) {
  var prevStep = currentStep;
  currentStep = targetStep;

  var stepPanes = [step1, step2, step3];
  var dots = [dot1, dot2, dot3];

  dots.forEach(function(d, idx) {
    d.classList.toggle("active", idx === currentStep - 1);
  });

  stepPanes.forEach(function(pane, idx) {
    pane.classList.remove("slide-left", "slide-right");
    if (idx === currentStep - 1) {
      pane.classList.add("active");
      if (!prefersRM) {
        pane.classList.add(direction === "forward" ? "slide-left" : "slide-right");
      }
    } else {
      pane.classList.remove("active");
    }
  });

  if (currentStep === 1) {
    nameInput.focus();
  } else if (currentStep === 2) {
    deptSelect.focus();
  } else if (currentStep === 3) {
    var fName = getFirstName(userName);
    step3Title.textContent = fName ? ("What's going wrong, " + fName + "?") : "What's going wrong?";
    textarea.focus();
  }
}

// Step 1: Next
function handleStep1Next() {
  var n = nameInput.value.trim();
  if (!n) {
    showError("Please enter your name.");
    nameInput.focus();
    return;
  }
  if (n.length > 60) {
    showError("Name must be 60 characters or fewer.");
    nameInput.focus();
    return;
  }
  userName = n;
  goToStep(2, "forward");
}

step1NextBtn.addEventListener("click", handleStep1Next);
nameInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleStep1Next();
  }
});

// Step 2: Back / Next
step2BackBtn.addEventListener("click", function() {
  goToStep(1, "backward");
});

function handleStep2Next() {
  userDept = deptSelect.value || "Other";
  goToStep(3, "forward");
}

step2NextBtn.addEventListener("click", handleStep2Next);
deptSelect.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    handleStep2Next();
  }
});

// Step 3: Back
step3BackBtn.addEventListener("click", function() {
  goToStep(2, "backward");
});

// ─── Char counter ───
function updCount() {
  var n = textarea.value.length;
  charCount.textContent = n + " / 4000";
  charCount.classList.toggle("near", n >= 3600 && n < 4000);
  charCount.classList.toggle("at", n >= 4000);
}
textarea.addEventListener("input", updCount);

// ─── Helpers ───
function genId() { return "TS-" + String(1000 + Math.floor(Math.random() * 9000)); }
function initials(name) {
  return name.split(/[\s&(]+/).filter(function(w){return w.length > 1}).slice(0,2).map(function(w){return w[0].toUpperCase()}).join("");
}

// ─── Classify ───
async function classify() {
  ticket = textarea.value.trim();
  if (!ticket) { textarea.focus(); return; }
  if (!userName.trim()) {
    showError("Please enter your name first.");
    goToStep(1, "backward");
    return;
  }

  triageBtn.disabled = true;
  triageBtn.classList.add("loading");

  try {
    var res = await fetch(API_BASE + "/api/classify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: ticket,
        name: userName.trim(),
        department: userDept
      })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || "Classification failed.");
    result = data;
    showResult(data);
  } catch (err) {
    showError(err.message);
  } finally {
    triageBtn.disabled = false;
    triageBtn.classList.remove("loading");
  }
}

triageBtn.addEventListener("click", classify);
textarea.addEventListener("keydown", function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); classify(); }
});
document.querySelectorAll(".pill[data-example]").forEach(function(p) {
  p.addEventListener("click", function() { textarea.value = p.getAttribute("data-example"); updCount(); textarea.focus(); });
});

// ─── Show result ───
function showResult(data) {
  // Transition out landing
  landingView.classList.add("leaving");
  setTimeout(function() {
    landingView.classList.add("hidden");
    landingView.classList.remove("leaving");
    resultView.classList.remove("hidden");
    newTicketBtn.classList.remove("hidden");

    // Populate stub
    var tid = genId();
    $("ticketId").textContent = tid;
    var requesterText = (userName || "Requester") + " - " + (userDept || "Department");
    stubRequester.textContent = requesterText;
    stickyRequester.textContent = requesterText;

    $("catIcon").innerHTML = CAT_ICONS[data.category] || CAT_ICONS.Other;
    $("stubCategory").textContent = data.category;
    $("teamAvatar").textContent = initials(data.team);
    $("stubTeam").textContent = data.team;

    // Priority stamp
    var stamp = $("priorityStamp");
    stamp.setAttribute("data-p", data.priority);
    $("stampText").textContent = data.priority.toUpperCase();
    stamp.classList.remove("stamp-in");

    // Sticky bar
    $("stickyId").textContent = tid;
    $("stickyCat").textContent = data.category;
    var ss = $("stickyStamp"); ss.textContent = data.priority.toUpperCase(); ss.setAttribute("data-p", data.priority);
    $("stickyTeam").textContent = data.team;

    // Animate in
    requestAnimationFrame(function() {
      resultView.classList.add("enter");
      setTimeout(function() { ticketStub.classList.add("show"); }, 80);
      setTimeout(function() { stamp.classList.add("stamp-in"); }, 350);
      if (data.priority === "Low") setTimeout(function() { confetti(stamp); }, 500);

      // Seed chat
      chatHistory = [];
      chatArea.innerHTML = "";
      setTimeout(function() {
        addUserBubble(ticket);
        chatHistory.push({ role: "user", content: ticket });
      }, 450);
      setTimeout(function() {
        addAIBubble(data.reply);
        chatHistory.push({ role: "assistant", content: data.reply });
      }, 650);
    });

    // Start sticky observer
    startStickyObserver();
    window.scrollTo({ top: 0 });
  }, 400);
}

// ─── New ticket ───
newTicketBtn.addEventListener("click", function() {
  resultView.classList.remove("enter");
  ticketStub.classList.remove("show");
  $("priorityStamp").classList.remove("stamp-in");
  stickyBar.classList.remove("visible");

  setTimeout(function() {
    resultView.classList.add("hidden");
    newTicketBtn.classList.add("hidden");
    chatArea.innerHTML = "";
    chatHistory = [];
    result = null;
    ticket = "";
    textarea.value = "";
    updCount();

    // Name and Department remain preserved!
    nameInput.value = userName;
    deptSelect.value = userDept;

    landingView.classList.remove("hidden");
    goToStep(1, "backward");
  }, 400);
});

// ─── Sticky observer ───
var stickyObs = null;
function startStickyObserver() {
  if (stickyObs) stickyObs.disconnect();
  stickyObs = new IntersectionObserver(function(entries) {
    stickyBar.classList.toggle("visible", !entries[0].isIntersecting);
  }, { threshold: 0, rootMargin: "-64px 0px 0px 0px" });
  stickyObs.observe(ticketStub);
}

// ─── Confetti ───
function confetti(anchor) {
  if (prefersRM) return;
  var rect = anchor.getBoundingClientRect();
  for (var i = 0; i < 18; i++) {
    var dot = document.createElement("div");
    dot.className = "confetti-dot";
    dot.style.position = "fixed";
    dot.style.left = rect.left + rect.width / 2 + "px";
    dot.style.top = rect.top + rect.height / 2 + "px";
    dot.style.setProperty("--dx", (Math.random() - 0.5) * 180 + "px");
    dot.style.setProperty("--dy", (Math.random() - 0.5) * 180 + "px");
    dot.style.animationDelay = Math.random() * 0.25 + "s";
    dot.style.zIndex = "400";
    document.body.appendChild(dot);
    setTimeout(function() { dot.remove(); }, 1400);
  }
}

// ─── Error ───
function showError(msg) {
  errorText.textContent = msg;
  errorToast.classList.remove("hidden");
  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(function() { errorToast.classList.add("hidden"); }, 5000);
}
retryBtn.addEventListener("click", function() {
  errorToast.classList.add("hidden");
  if (!result && currentStep === 3) classify();
});

// ═══ CHAT ═══
chatInput.addEventListener("input", function() {
  chatSendBtn.disabled = chatBusy || !chatInput.value.trim();
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
});
chatInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!chatBusy && chatInput.value.trim()) sendChat(chatInput.value.trim());
  }
});
chatSendBtn.addEventListener("click", function() {
  if (!chatBusy && chatInput.value.trim()) sendChat(chatInput.value.trim());
});

async function sendChat(msg) {
  if (!result) return;
  chatBusy = true;
  chatSendBtn.disabled = true;
  chatInput.value = "";
  chatInput.style.height = "auto";

  addUserBubble(msg);
  chatHistory.push({ role: "user", content: msg });
  var typing = addTyping();

  try {
    var res = await fetch(API_BASE + "/api/chat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticket: ticket,
        category: result.category,
        priority: result.priority,
        team: result.team,
        message: msg,
        history: chatHistory.slice(-12),
        name: userName.trim(),
        department: userDept
      })
    });
    var data = await res.json();
    typing.remove();
    if (!res.ok) throw new Error(data.error || "Chat failed.");
    chatHistory.push({ role: "assistant", content: data.reply });
    addAIBubble(data.reply);
  } catch (err) {
    typing.remove();
    addErrorBubble(err.message);
  } finally {
    chatBusy = false;
    chatSendBtn.disabled = !chatInput.value.trim();
  }
}

// ─── Bubble helpers ───
function addUserBubble(text) {
  var b = document.createElement("div");
  b.className = "chat-bubble chat-bubble-user";
  b.textContent = text;
  chatArea.appendChild(b);
  scrollChat();
}

function addAIBubble(text) {
  var wrap = document.createElement("div");
  wrap.className = "bubble-ai-wrap";
  var av = document.createElement("div");
  av.className = "ai-avatar"; av.innerHTML = AI_AVATAR;
  wrap.appendChild(av);
  var col = document.createElement("div");
  col.className = "bubble-ai-col";
  var b = document.createElement("div");
  b.className = "chat-bubble chat-bubble-ai";
  b.textContent = text;
  col.appendChild(b);

  var row = document.createElement("div");
  row.className = "bubble-copy-row";
  var cp = document.createElement("button");
  cp.className = "btn-copy"; cp.type = "button"; cp.setAttribute("aria-label", "Copy");
  cp.innerHTML = '<svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><svg class="check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" style="display:none"><polyline points="20 6 9 17 4 12"/></svg><span class="copy-label">Copy</span>';
  cp.addEventListener("click", function() {
    navigator.clipboard.writeText(text).then(function() {
      cp.classList.add("copied");
      cp.querySelector(".copy-label").textContent = "Copied";
      cp.querySelector(".copy-icon").style.display = "none";
      cp.querySelector(".check-icon").style.display = "block";
      setTimeout(function() {
        cp.classList.remove("copied");
        cp.querySelector(".copy-label").textContent = "Copy";
        cp.querySelector(".copy-icon").style.display = "";
        cp.querySelector(".check-icon").style.display = "none";
      }, 2000);
    }).catch(function(){});
  });
  row.appendChild(cp);
  col.appendChild(row);
  wrap.appendChild(col);
  chatArea.appendChild(wrap);
  scrollChat();
}

function addErrorBubble(text) {
  var b = document.createElement("div");
  b.className = "chat-bubble chat-bubble-ai";
  b.style.borderColor = "rgba(239,68,68,.3)"; b.style.color = "var(--err)";
  b.textContent = text;
  chatArea.appendChild(b);
  scrollChat();
}

function addTyping() {
  var w = document.createElement("div");
  w.className = "typing-wrap";
  var av = document.createElement("div");
  av.className = "ai-avatar"; av.innerHTML = AI_AVATAR;
  w.appendChild(av);
  var d = document.createElement("div");
  d.className = "typing-dots";
  d.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  w.appendChild(d);
  chatArea.appendChild(w);
  scrollChat();
  return w;
}

function scrollChat() {
  requestAnimationFrame(function() { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); });
}

// Initial focus
nameInput.focus();
