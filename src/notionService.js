const { Client } = require('@notion/client');
const notion = new Client({ auth: process.env.NOTION_API_TOKEN });

async function createNotionPage(title, properties) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: properties.databaseId },
      properties: {
        title: {
          title: [{ text: { content: title } }],
        },
        ...properties,
      },
    });
    console.log('Page created in Notion:', response.id);
  } catch (error) {
    console.error('Error creating page in Notion:', error);
  }
}

module.exports = { createNotionPage };
