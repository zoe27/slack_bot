brew install ngrok  将本地映射到公网
    ngrok http http://localhost:3000

# Notion to Slack Task Sync (POC)

A lightweight Node.js proof-of-concept to sync task status changes in Notion to Slack, supporting:

- Scheduled polling with `node-cron`
- Change detection (status diff only)
- Slack notifications via webhook
- Fine-grained timestamp filtering to avoid missed updates

---

## 🔧 Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/zoe/slack_bot.git
   cd slack_bot


2. **Install dependencies**
    npm install

3. **Add environment variables**
    cp .env.example .env
    
    Fill in your:
        NOTION_API_KEY
        NOTION_DATABASE_ID
        SLACK_WEBHOOK_URL


4. **Start the sync service:**
    node index.js

📦 Project Structure
.
├── index.js                  # Entry point
├── sync.js                   # Core logic for sync
├── .env                      # Environment variables (gitignored)
├── .gitignore
└── README.md




