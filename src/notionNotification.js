const cron = require('node-cron');
const { Client } = require('@notionhq/client');
const axios = require('axios');

// 🔧 初始化 Notion 客户端 & 配置
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// 🕒 上次检查时间（初始为脚本启动时间）
let lastCheckedTime = new Date().toISOString();

// 🧠 本地缓存：记录任务 ID -> 最后已知状态
let taskState = {};

// 🎨 格式化 Slack 消息（可轻松扩展）
function formatSlackMessage({ taskName, oldStatus, newStatus, url }) {
    return {
        text: `📌 *任务更新*\n*任务名*: ${taskName}\n*状态变更*: ${getStatusEmoji(oldStatus)} ${oldStatus} ➡️ ${getStatusEmoji(newStatus)} ${newStatus}\n🔗 <${url}|点击查看任务>`,
    };
}

function getStatusEmoji(status) {
    const emojiMap = {
        '待办': '🟡',
        '进行中': '🟢',
        '已完成': '✅',
        '已取消': '❌',
    };
    return emojiMap[status] || '📄';
}

// 📥 获取编辑时间晚于 lastCheckedTime 的任务
async function fetchTasksFromNotion() {
    try {
        console.log('🔍 Fetching tasks updated since:', lastCheckedTime);
        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                timestamp: 'last_edited_time',
                last_edited_time: {
                    after: lastCheckedTime,
                },
            },
        });
        return response.results || [];
    } catch (error) {
        console.error('❌ Error fetching tasks from Notion:', error);
        return [];
    }
}

// 📤 发送状态变更通知到 Slack
async function sendSlackNotification(task) {
    try {
        const taskId = task.id;
        const taskName = task.properties.Project?.title?.[0]?.text?.content || 'Unnamed Task';
        const taskStatus = task.properties.Status?.status?.name || 'Unknown';
        const taskUrl = task.url || `https://www.notion.so/${taskId.replace(/-/g, '')}`;

        const previousStatus = taskState[taskId];
        console.log(`📝 "${taskName}" (${taskId}) - ${previousStatus} → ${taskStatus}`);

        if (previousStatus !== taskStatus) {
            const message = formatSlackMessage({
                taskName,
                oldStatus: previousStatus || '未知',
                newStatus: taskStatus,
                url: taskUrl,
            });

            await axios.post(slackWebhookUrl, message);
            console.log(`✅ Sent Slack notification for "${taskName}"`);
            taskState[taskId] = taskStatus;
        }
    } catch (error) {
        console.error('❌ Error sending Slack notification:', error);
    }
}

// ⏱ 计算此次任务中最晚的编辑时间
function getLatestEditedTime(tasks) {
    return tasks.reduce((latest, task) => {
        const edited = new Date(task.last_edited_time);
        return edited > latest ? edited : latest;
    }, new Date(lastCheckedTime));
}

// 🚀 启动轮询
function startNotionToSlackSync() {
    console.log('🟢 Notion → Slack Sync Started');

    cron.schedule('*/1 * * * *', async () => {
        console.log('\n⏳ Checking for updates...');

        const tasks = await fetchTasksFromNotion();
        console.log(`📦 ${tasks.length} task(s) updated.`);

        if (tasks.length > 0) {
            for (const task of tasks) {
                await sendSlackNotification(task);
            }

            const latest = getLatestEditedTime(tasks);
            lastCheckedTime = new Date(latest.getTime() + 1).toISOString(); // 防止重复通知
            console.log('🕒 lastCheckedTime updated to:', lastCheckedTime);
        }
    });
}

module.exports = { startNotionToSlackSync };
