const { App } = require('@slack/bolt');
require('dotenv').config();

// 初始化 Slack Bot
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// 监听特定命令（例如：/create-task）
app.command('/create-task', async ({ command, ack, respond }) => {
  await ack();

  const task = command.text;

  // 这里调用 Notion API 创建任务
  // 可调用 notionApi.js 中的方法

  await respond({
    response_type: 'in_channel',
    text: `任务 "${task}" 已经添加到 Notion！`
  });
});

// 启动 Slack Bot
(async () => {
  await app.start();
  console.log('Slack Bot 已启动');
})();
