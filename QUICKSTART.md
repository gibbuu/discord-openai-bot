# Quick Start Guide

## Installation

```bash
# Clone and setup
git clone https://github.com/gibbuu/discord-openai-bot.git
cd discord-openai-bot
npm install

# Configure
cp .env.example .env
# Edit .env with your credentials

# Run
npm start
```

## Required Credentials

1. **Discord Bot Token**: https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section
   - Copy the token
   - Enable "Message Content Intent"

2. **OpenAI API Key**: https://platform.openai.com/api-keys
   - Create a new API key
   - Copy the key

3. **Weather API Key** (Optional): https://openweathermap.org/api
   - Sign up for a free account
   - Copy your API key

## Configuration (.env)

```env
DISCORD_TOKEN=your_discord_bot_token
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
BOT_PREFIX=!
MAX_CONVERSATION_HISTORY=10
WEATHER_API_KEY=your_weather_api_key  # Optional
```

## Bot Invite Link

Generate an invite link with these permissions:
- Read Messages/View Channels
- Send Messages
- Read Message History
- Mention Everyone (optional)

Minimum scope: `bot` with permissions integer: `277025508352`

Example invite URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=277025508352&scope=bot
```

## Usage Examples

### Basic Commands
```
!help              - Show help message
!clear             - Clear conversation history
!stats             - Show bot statistics
```

### Chat Examples
```
@Bot hello!
@Bot what's 156 times 89?
@Bot what's the weather in Tokyo?
@Bot search our conversation for "calculator"
@Bot what time is it in New York?
```

### Prefix Usage
```
!tell me a joke
!what's 100 divided by 5?
!what's the weather in Paris?
```

## Features Overview

### 🛡️ Guardrails
- Automatic content moderation
- Blocks inappropriate content
- Filters both input and output

### 💾 Memory
- Remembers conversation context
- Per-user, per-channel storage
- SQLite database backend
- Clear history on demand

### 🔧 Tools
1. **Calculator** - Math operations
2. **Weather** - Current weather data
3. **Search** - Conversation history search
4. **DateTime** - Current date/time

## Troubleshooting

### Bot not responding?
- Check bot has proper Discord permissions
- Verify .env credentials are correct
- Look at console for error messages

### "Content was flagged"?
- Message contained inappropriate content
- Rephrase your message
- This is a safety feature

### Database errors?
- Ensure write permissions in bot directory
- Delete conversations.db to reset
- Check available disk space

## Architecture

```
Message Flow:
User Message → Guardrails Check → Load History → 
OpenAI Processing → Function Calls (if needed) → 
Response Generation → Guardrails Check → 
Save to Database → Send Response
```

## Support

For issues or questions, open an issue on GitHub:
https://github.com/gibbuu/discord-openai-bot/issues
