const { WebClient } = require('@slack/web-api');
const slackToken = process.env.SLACK_API_TOKEN;
const slackClient = new WebClient(slackToken);

async function sendMessageToSlack(channel, message) {
  try {
    const res = await slackClient.chat.postMessage({
      channel: channel,
      text: message,
    });
    console.log('Message sent to Slack:', res.ts);
  } catch (error) {
    console.error('Error sending message to Slack:', error);
  }
}

module.exports = { sendMessageToSlack };
