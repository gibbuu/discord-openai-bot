# Discord OpenAI Bot

A powerful Discord bot with OpenAI integration featuring **guardrails**, **memory**, and **function calling** capabilities.

## Features

### 🛡️ Guardrails (Content Moderation)
- Automatic content moderation using OpenAI's Moderation API
- Filters both user input and AI responses
- Prevents inappropriate content in conversations
- Real-time safety checks

### 💾 Memory (Conversation History)
- SQLite database for persistent conversation storage
- Maintains context across multiple messages
- Per-user, per-channel conversation history
- Configurable history length
- Ability to clear history on demand

### 🔧 Function Calling (Tools & Database)
The bot can intelligently use various tools to assist users:

1. **Calculator** - Perform mathematical operations (add, subtract, multiply, divide, power)
2. **Weather** - Get current weather information for any city (requires API key)
3. **Conversation Search** - Search through past conversation messages
4. **Date/Time** - Get current date and time in any timezone

## Setup

### Prerequisites
- Node.js 18.x or higher
- Discord Bot Token ([Create one here](https://discord.com/developers/applications))
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))
- (Optional) OpenWeatherMap API Key for weather functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/gibbuu/discord-openai-bot.git
   cd discord-openai-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4-turbo-preview
   BOT_PREFIX=!
   MAX_CONVERSATION_HISTORY=10
   WEATHER_API_KEY=your_weather_api_key_here  # Optional
   ```

4. **Start the bot**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## Usage

### Interacting with the Bot

There are three ways to interact with the bot:

1. **Mention the bot**: `@BotName your message here`
2. **Use the prefix**: `!your message here`
3. **Direct Messages**: Just send a DM to the bot

### Commands

- `!help` - Display help information and available features
- `!clear` - Clear your conversation history in the current channel
- `!stats` - Show bot statistics and your message count

### Example Conversations

**Basic Chat:**
```
User: !hello, how are you?
Bot: Hello! I'm doing great, thank you for asking. How can I help you today?
```

**Using Calculator:**
```
User: @Bot what is 156 * 89?
Bot: The result of 156 × 89 is 13,884.
```

**Weather Information:**
```
User: !what's the weather in London?
Bot: Weather in London, UK:
- Temperature: 12°C (feels like 10°C)
- Conditions: partly cloudy
- Humidity: 76%
- Wind Speed: 4.5 m/s
```

**Conversation Search:**
```
User: @Bot search our conversation for "weather"
Bot: Found 2 message(s) containing "weather":
1. [user]: what's the weather in London?
2. [assistant]: Weather in London, UK: Temperature: 12°C...
```

**Date/Time:**
```
User: !what time is it in Tokyo?
Bot: Current date and time in Asia/Tokyo: January 14, 2026, 01:59:19 AM JST
```

## Architecture

### Project Structure
```
discord-openai-bot/
├── src/
│   ├── index.js              # Main bot logic
│   ├── database/
│   │   └── memory.js         # SQLite conversation storage
│   ├── utils/
│   │   └── guardrails.js     # Content moderation
│   └── tools/
│       └── index.js          # Function calling tools
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

### Core Components

#### 1. Main Bot (src/index.js)
- Discord.js client setup
- Message handling and routing
- OpenAI integration with streaming
- Function call orchestration
- Error handling and logging

#### 2. Memory System (src/database/memory.js)
- SQLite database for conversation storage
- CRUD operations for messages
- Query optimization with indexes
- Conversation history retrieval

#### 3. Guardrails (src/utils/guardrails.js)
- OpenAI Moderation API integration
- Input/output content filtering
- Safety categorization
- User-friendly error messages

#### 4. Tools (src/tools/index.js)
- Modular tool definitions
- OpenAI function calling format
- Tool execution engine
- Extensible architecture for adding new tools

## How It Works

### Message Processing Flow

1. **User sends a message** → Bot receives via Discord
2. **Guardrail Check** → User input is checked for safety
3. **Memory Retrieval** → Recent conversation history is loaded
4. **OpenAI Processing** → Message sent to OpenAI with conversation context
5. **Function Calling** → If needed, tools are executed (calculator, weather, etc.)
6. **Response Generation** → OpenAI generates final response
7. **Guardrail Check** → Bot response is checked for safety
8. **Memory Storage** → Exchange is saved to database
9. **Response Sent** → User receives the response

### Function Calling

The bot uses OpenAI's function calling feature to intelligently use tools:

```javascript
User: "What's 45 times 67 and what's the weather in Paris?"

→ Bot calls calculator(multiply, 45, 67)
→ Bot calls get_weather("Paris")
→ Bot generates response with both results
```

## Security & Safety

### Content Moderation
- All messages pass through OpenAI's Moderation API
- Checks for: hate speech, self-harm, sexual content, violence, etc.
- Both user input and bot output are filtered
- Inappropriate content is blocked with informative messages

### Data Privacy
- Conversation data stored locally in SQLite
- No data shared with third parties (except OpenAI for processing)
- Users can clear their history anytime with `!clear`

### Error Handling
- Graceful degradation on API failures
- Informative error messages
- Logging for debugging

## Extending the Bot

### Adding New Tools

Create a new tool in `src/tools/index.js`:

```javascript
export const myTool = {
  definition: {
    type: 'function',
    function: {
      name: 'my_tool',
      description: 'Description of what the tool does',
      parameters: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Parameter description'
          }
        },
        required: ['param1']
      }
    }
  },
  
  execute: async (args) => {
    // Tool implementation
    return 'Result';
  }
};

// Add to allTools array
export const allTools = [calculator, weather, databaseQuery, datetime, myTool];
```

## Troubleshooting

### Bot doesn't respond
- Check that the bot has proper permissions in your Discord server
- Verify `DISCORD_TOKEN` and `OPENAI_API_KEY` are correct
- Check console for error messages
- Ensure the bot can read and send messages in the channel

### "Content was flagged" messages
- The guardrails detected potentially inappropriate content
- Rephrase your message to be more appropriate
- This is a safety feature to ensure responsible AI usage

### Database errors
- Ensure the bot has write permissions in its directory
- Delete `conversations.db` to start fresh (will lose history)
- Check disk space availability

### Function calling not working
- Verify you're using a model that supports function calling (GPT-4, GPT-3.5-turbo)
- Check console logs for tool execution errors
- Ensure tools are properly defined in the allTools array

## Performance

- **Response Time**: Typically 1-3 seconds (depends on OpenAI API)
- **Memory**: ~50MB base + database size
- **Database**: SQLite with indexes for fast queries
- **Concurrent Users**: Handles multiple simultaneous conversations

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this bot for your own projects!

## Credits

Built with:
- [Discord.js](https://discord.js.org/) - Discord API wrapper
- [OpenAI Node.js SDK](https://github.com/openai/openai-node) - OpenAI API client
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite database
- [axios](https://axios-http.com/) - HTTP client for API calls

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
