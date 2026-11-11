# TicketSense

AI-powered helpdesk ticket classifier. Paste a support ticket, get the category, priority, owning team, and a suggested reply — all in seconds.

## Quick start (Windows / PowerShell)

```powershell
cd C:\TicketSense
copy .env.example .env
# Edit .env and set GROQ_API_KEY=your_key_here
npm install
npm start
# Open http://localhost:3000
```

## Run tests

```powershell
npm test
```

## Environment variables

| Variable       | Required | Default | Description              |
| -------------- | -------- | ------- | ------------------------ |
| `GROQ_API_KEY` | Yes      | —       | Your Groq API key        |
| `PORT`         | No       | `3000`  | Port the server binds to |

## API

| Method | Endpoint          | Description                |
| ------ | ----------------- | -------------------------- |
| GET    | `/api/categories` | List all category names    |
| POST   | `/api/classify`   | Classify a ticket          |

### POST /api/classify

**Request:** `{ "ticket": "..." }`

**Response:** `{ "category": "...", "priority": "...", "team": "...", "reply": "..." }`

## Customizing categories

Edit `teams.json` to add, rename, or remove categories. The LLM prompt and team lookup update automatically.
