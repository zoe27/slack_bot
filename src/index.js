const { syncTaskFromSlackToNotion } = require('./syncController');
const { startNotionToSlackSync } = require('./notionNotification');
const { App } = require('@slack/bolt');
require('dotenv').config();

if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) {
  throw new Error('Missing SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET in environment variables.');
}

// 初始化 Slack Bot
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// 监听 /create-task 命令
app.command('/create-task', async ({ command, ack, respond }) => {
  await ack();

  const task = command.text;

  console.log('收到任务:', task);

  try {
    await syncTaskFromSlackToNotion(task);
    await respond({
      response_type: 'in_channel',
      text: `任务 "${task}" 已经同步到 Notion！`
    });
  } catch (error) {
    console.error('同步任务到 Notion 失败:', error);
    await respond({
      response_type: 'ephemeral',
      text: `任务同步失败，请稍后再试。`
    });
  }
});

// 启动 Slack Bot
(async () => {
  await app.start(process.env.PORT || 3000);
  try {
    startNotionToSlackSync();
    console.log(`Slack Bot 已启动，监听端口 ${process.env.PORT || 3000}`);
  } catch (error) {
    console.error('启动 Notion 到 Slack 同步失败:', error);
  }
})();