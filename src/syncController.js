const { addTaskToNotion } = require('./notionApi');

// 处理任务同步
async function syncTaskFromSlackToNotion(task) {
  const notionResponse = await addTaskToNotion(task);
  console.log('任务已同步到 Notion:', notionResponse);
}

module.exports = { syncTaskFromSlackToNotion };
