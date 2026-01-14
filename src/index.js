import { Client, GatewayIntentBits, Events } from 'discord.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import MemoryDatabase from './database/memory.js';
import Guardrails from './utils/guardrails.js';
import { getToolDefinitions, executeTool } from './tools/index.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN || !process.env.OPENAI_API_KEY) {
  console.error('Error: DISCORD_TOKEN and OPENAI_API_KEY must be set in .env file');
  process.exit(1);
}

// Initialize services
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const db = new MemoryDatabase();
const guardrails = new Guardrails(process.env.OPENAI_API_KEY);

// Configuration
const CONFIG = {
  prefix: process.env.BOT_PREFIX || '!',
  maxHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY) || 10,
  model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
};

// System prompt
const SYSTEM_PROMPT = `You are a helpful AI assistant in a Discord server. You have access to several tools that you can use to help users:
- Calculator for math operations
- Weather information lookup
- Conversation history search
- Current date and time

Be friendly, concise, and helpful. Use tools when appropriate to provide accurate information.`;

/**
 * Process a message with OpenAI, including function calling
 */
async function processMessage(userId, channelId, userMessage) {
  try {
    // Step 1: Guardrail check on user input
    console.log('Checking user input with guardrails...');
    const inputValidation = await guardrails.validateExchange(userMessage);
    
    if (!inputValidation.safe) {
      return {
        content: `⚠️ ${inputValidation.reason}`,
        flagged: true
      };
    }

    // Step 2: Get conversation history (memory)
    const history = db.getConversationHistory(userId, channelId, CONFIG.maxHistory);
    
    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Step 3: Call OpenAI with function calling support
    let response = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: messages,
      tools: getToolDefinitions(),
      tool_choice: 'auto',
    });

    let assistantMessage = response.choices[0].message;

    // Step 4: Handle function calls
    const maxIterations = 5;
    let iterations = 0;

    while (assistantMessage.tool_calls && iterations < maxIterations) {
      iterations++;
      console.log(`Processing tool call iteration ${iterations}...`);

      // Add assistant's message with tool calls to conversation
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`Executing tool: ${functionName}`, functionArgs);

        const result = await executeTool(
          functionName,
          functionArgs,
          db,
          userId,
          channelId
        );

        // Add tool response to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      // Get next response from OpenAI
      response = await openai.chat.completions.create({
        model: CONFIG.model,
        messages: messages,
        tools: getToolDefinitions(),
        tool_choice: 'auto',
      });

      assistantMessage = response.choices[0].message;
    }

    const finalResponse = assistantMessage.content;

    // Step 5: Guardrail check on AI response
    console.log('Checking AI response with guardrails...');
    const outputValidation = await guardrails.validateExchange(
      userMessage,
      finalResponse
    );

    if (!outputValidation.safe) {
      return {
        content: '⚠️ I apologize, but I cannot provide that response. Let me try to help you in a different way.',
        flagged: true
      };
    }

    // Step 6: Store in memory
    db.addMessage(userId, channelId, 'user', userMessage);
    db.addMessage(userId, channelId, 'assistant', finalResponse);

    return {
      content: finalResponse,
      flagged: false
    };

  } catch (error) {
    console.error('Error processing message:', error);
    return {
      content: '❌ Sorry, I encountered an error processing your message. Please try again.',
      error: error.message
    };
  }
}

/**
 * Handle Discord bot ready event
 */
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Connected to ${readyClient.guilds.cache.size} server(s)`);
  console.log(`💾 Database: ${db.getMessageCount()} messages stored`);
  console.log(`🤖 Model: ${CONFIG.model}`);
  console.log(`🛡️ Guardrails: Enabled`);
  console.log(`📝 Max conversation history: ${CONFIG.maxHistory}`);
});

/**
 * Handle incoming messages
 */
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if message mentions the bot or is a DM
  const isMentioned = message.mentions.has(client.user);
  const isDM = message.channel.type === 1; // DM channel type
  
  // Check if message starts with prefix
  const hasPrefix = message.content.startsWith(CONFIG.prefix);

  // Process special commands
  if (hasPrefix) {
    const args = message.content.slice(CONFIG.prefix.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    switch (command) {
      case 'clear':
        db.clearHistory(message.author.id, message.channel.id);
        await message.reply('🗑️ Conversation history cleared!');
        return;

      case 'help':
        await message.reply(`
**Discord OpenAI Bot - Help**

**Usage:**
- Mention me or use \`${CONFIG.prefix}\` prefix to chat
- I have memory of our conversation
- I can use tools to help you

**Commands:**
- \`${CONFIG.prefix}help\` - Show this help message
- \`${CONFIG.prefix}clear\` - Clear conversation history
- \`${CONFIG.prefix}stats\` - Show bot statistics

**Available Tools:**
- 🧮 Calculator - Perform math operations
- 🌤️ Weather - Get weather information
- 🔍 Search - Search conversation history
- 📅 Date/Time - Get current date and time

**Features:**
- 🛡️ Content moderation (guardrails)
- 💾 Conversation memory
- 🔧 Function calling with tools
        `);
        return;

      case 'stats':
        const totalMessages = db.getMessageCount();
        const userMessages = db.getConversationHistory(
          message.author.id,
          message.channel.id,
          1000
        ).length;
        
        await message.reply(`
**📊 Bot Statistics**
- Total messages stored: ${totalMessages}
- Your messages in this channel: ${userMessages}
- Model: ${CONFIG.model}
- Guardrails: ✅ Enabled
        `);
        return;
    }
  }

  // Only respond if mentioned, DM, or has prefix
  if (!isMentioned && !isDM && !hasPrefix) return;

  // Remove bot mention and prefix from message
  let content = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`), '')
    .trim();
  
  if (hasPrefix) {
    content = message.content.slice(CONFIG.prefix.length).trim();
  }

  if (!content) {
    await message.reply('Please provide a message to chat with me!');
    return;
  }

  // Show typing indicator
  await message.channel.sendTyping();

  // Process the message
  const result = await processMessage(
    message.author.id,
    message.channel.id,
    content
  );

  // Send response
  try {
    await message.reply(result.content);
  } catch (error) {
    console.error('Error sending message:', error);
    await message.reply('❌ Sorry, I had trouble sending my response.');
  }
});

/**
 * Handle errors
 */
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  db.close();
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  db.close();
  client.destroy();
  process.exit(0);
});

// Start the bot
console.log('🚀 Starting Discord OpenAI Bot...');
client.login(process.env.DISCORD_TOKEN);
