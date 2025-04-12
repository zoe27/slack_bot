const { Client } = require('@notionhq/client');
require('dotenv').config();

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 添加任务到 Notion
async function addTaskToNotion(task) {
    try {
      // 可以保留这个打印数据库结构的调试代码
      /*
      const database = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
      console.dir(database.properties, { depth: null });
      */
  
      const response = await notion.pages.create({
        parent: { database_id: process.env.NOTION_DATABASE_ID },
        properties: {
          Project: {
            title: [
              {
                text: {
                  content: task,
                },
              },
            ],
          },
          Status: {
            status: {
              name: 'Not started', // 注意：必须是数据库中已有的 status 名称
            },
          },
          owner: {
            rich_text: [
              {
                text: {
                  content: "Zoe", // 可以动态改成 Slack 的用户名
                },
              },
            ],
          },
          Deadline: {
            date: {
              start: new Date().toISOString().split("T")[0], // 今天日期
            },
          },
        },
      });
  
      console.log("✅ 成功添加任务到 Notion:", response.url);
      return response;
    } catch (error) {
      console.error("❌ Error creating task in Notion:", error.message);
      if (error.body) {
        console.error(JSON.stringify(error.body, null, 2));
      }
    }
  }
  

module.exports = { addTaskToNotion };
