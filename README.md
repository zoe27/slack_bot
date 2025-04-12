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

3. **Create .env file**
    SLACK_BOT_TOKEN=xoxb-xxxx
    SLACK_SIGNING_SECRET=your_singing_ser
    NOTION_API_KEY=your_notion_token
    NOTION_DATABASE_ID=your_database_id
    SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

4. **Start the sync service:**
    node index.js

📦 Project Structure
.
├── index.js                  # Entry point
├── sync.js                   # Core logic for sync
├── .env                      # Environment variables (gitignored)
├── .gitignore
└── README.md




