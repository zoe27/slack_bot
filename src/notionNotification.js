const cron = require('node-cron');
const { Client } = require('@notionhq/client');
const axios = require('axios');

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

// 上次检查时间：初始化为当前时间
let lastCheckedTime = new Date().toISOString();

// 本地记录每个任务的最后状态（用于比对变更）
let taskState = {};

// 获取 Notion 中编辑时间大于 lastCheckedTime 的任务
async function fetchTasksFromNotion() {
    try {
        console.log('Fetching tasks from Notion since:', lastCheckedTime);
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

// 发送 Slack 通知（仅当状态发生变化时）
async function sendSlackNotification(task) {
    try {
        const taskId = task.id;
        const taskName = task.properties.Project?.title?.[0]?.text?.content || 'Unnamed Task';
        const taskStatus = task.properties.Status?.status?.name || 'Unknown';

        const previousStatus = taskState[taskId];
        console.log(`📝 Task "${taskName}" [${taskId}] - Status: ${previousStatus} → ${taskStatus}`);

        if (previousStatus !== taskStatus) {
            const message = {
                text: `🔄 Task *"${taskName}"* has changed status to: *${taskStatus}*`,
            };
            await axios.post(slackWebhookUrl, message);
            console.log(`✅ Sent Slack notification for task "${taskName}"`);
            taskState[taskId] = taskStatus;
        }
    } catch (error) {
        console.error('❌ Error sending Slack notification:', error);
    }
}

// 获取本次任务列表中的最大 last_edited_time
function getLatestEditedTime(tasks) {
    return tasks.reduce((latest, task) => {
        const edited = new Date(task.last_edited_time);
        return edited > latest ? edited : latest;
    }, new Date(lastCheckedTime));
}

// 启动定时任务，每分钟轮询一次
function startNotionToSlackSync() {
    console.log('🚀 Notion to Slack sync started!');

    cron.schedule('*/1 * * * *', async () => {
        console.log('⏳ Checking for updates...');

        const tasks = await fetchTasksFromNotion();
        console.log(`📦 Fetched ${tasks.length} updated tasks.`);

        if (tasks.length > 0) {
            for (const task of tasks) {
                await sendSlackNotification(task);
            }

            // ✅ 用 Notion 返回的最大更新时间更新 lastCheckedTime（并加 1ms 防止重复）
            const latest = getLatestEditedTime(tasks);
            lastCheckedTime = new Date(latest.getTime() + 1).toISOString();
            console.log('🕒 Updated lastCheckedTime to:', lastCheckedTime);
        }
    });
}

module.exports = { startNotionToSlackSync };
