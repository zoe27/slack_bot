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
    // 尝试同步任务到 Notion
    await syncTaskFromSlackToNotion(task);
    
    // 如果同步成功，反馈成功信息
    await respond({
      response_type: 'in_channel',
      text: `任务 "${task}" 已经成功同步到 Notion！`
    });
  } catch (error) {
    console.error('同步任务到 Notion 失败:', error);

    // 判断错误类型，给出不同的反馈信息
    if (error.message.includes('network')) {
      await respond({
        response_type: 'ephemeral',
        text: `网络连接出现问题，任务同步失败。请检查网络并重试。`
      });
    } else if (error.message.includes('validation')) {
      await respond({
        response_type: 'ephemeral',
        text: `任务格式错误，无法同步到 Notion。请确保任务格式正确后再试。`
      });
    } else if (error.message.includes('server')) {
      await respond({
        response_type: 'ephemeral',
        text: `服务器错误，任务同步失败。请稍后再试。`
      });
    } else {
      // 默认错误信息
      await respond({
        response_type: 'ephemeral',
        text: `任务同步失败，发生未知错误。请稍后再试。`
      });
    }
  }
});


// 监听 Slack 中的 /help 命令
app.command('/sn-help', async ({ command, ack, respond }) => {
  await ack();
  await respond({
    text: `:sparkles: *Welcome to the Task Management Help Guide!*

Here are the available commands you can use:

---

*1. /create_task*  
:page_with_curl: **Create a new task**  
*Usage Example:* \`/create_task Task Name\`  
_Define the task's name and start managing your projects._

---

*2. /update_task*  
:pencil2: **Update an existing task**  
*Usage Example:* \`/update_task Task Name New Status\`  
_Change the status or other information of an ongoing task._

---

*3. /view_task*  
:eyes: **View task details**  
*Usage Example:* \`/view_task Task Name\`  
_Quickly see the details of the task you're tracking._

---

*4. /status*  
:bar_chart: **Check task status**  
*Usage Example:* \`/status Task Name\`  
_Follow up on progress and check if any updates are needed._

---

*5. /sn-help*  
:question: **Display this help message**

---

:link: **For detailed documentation, visit**:  
[Link to Documentation]

Hope this guide helps you get the most out of our task management system! :tada:`
  });
});


const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

app.command('/update-task', async ({ command, ack, respond }) => {
  await ack();

  const input = command.text.trim();
  const match = input.match(/^"(.*?)"\s*->\s*(.+)$/);

  // ⛔️ 格式错误
  if (!match) {
    return await respond({
      response_type: 'ephemeral',
      text: `⚠️ 格式错误，请使用以下格式：\n\`/update-task "任务名称" -> 状态\`\n例如：\n• \`/update-task "Fix login bug" -> In Progress\`\n• \`/update-task "修复日报模块" -> 已完成\``,
    });
  }

  const [, taskName, newStatus] = match;

  try {
    // ✅ 动态获取数据库的 Status 选项
    const dbMeta = await notion.databases.retrieve({ database_id: databaseId });
    const statusOptions = dbMeta.properties.Status.status.options.map(opt => opt.name);

    // ⛔️ 校验状态合法性
    if (!statusOptions.includes(newStatus)) {
      return await respond({
        response_type: 'ephemeral',
        text: `⚠️ 状态「${newStatus}」无效，请使用以下状态之一：\n• ${statusOptions.join('\n• ')}`,
      });
    }

    // 🔍 查找任务
    const result = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Project',
        title: {
          equals: taskName,
        },
      },
    });

    if (!result.results.length) {
      return await respond({
        response_type: 'ephemeral',
        text: `❌ 没有找到任务「${taskName}」，请确认任务名是否精确匹配。`,
      });
    }

    const taskId = result.results[0].id;

    // ✅ 更新状态
    await notion.pages.update({
      page_id: taskId,
      properties: {
        Status: {
          status: {
            name: newStatus,
          },
        },
      },
    });

    await respond({
      response_type: 'in_channel',
      text: `✅ 任务「${taskName}」的状态已更新为「${newStatus}」`,
    });

  } catch (error) {
    console.error('❌ 更新任务失败:', error);
    await respond({
      response_type: 'ephemeral',
      text: `❌ 操作失败：${error?.message || '未知错误，请稍后再试。'}`,
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