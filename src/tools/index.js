import axios from 'axios';

/**
 * Calculator tool for mathematical operations
 */
export const calculator = {
  definition: {
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Perform basic mathematical calculations. Supports addition, subtraction, multiplication, division, and power operations.',
      parameters: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide', 'power'],
            description: 'The mathematical operation to perform'
          },
          a: {
            type: 'number',
            description: 'First number'
          },
          b: {
            type: 'number',
            description: 'Second number'
          }
        },
        required: ['operation', 'a', 'b']
      }
    }
  },
  
  execute: async (args) => {
    const { operation, a, b } = args;
    
    let result;
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          return 'Error: Cannot divide by zero';
        }
        result = a / b;
        break;
      case 'power':
        result = Math.pow(a, b);
        break;
      default:
        return 'Error: Unknown operation';
    }
    
    return `Result: ${a} ${operation} ${b} = ${result}`;
  }
};

/**
 * Weather tool for getting weather information
 */
export const weather = {
  definition: {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a specific city',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'The city name to get weather for'
          },
          country: {
            type: 'string',
            description: 'Optional country code (e.g., US, UK, FR)'
          }
        },
        required: ['city']
      }
    }
  },
  
  execute: async (args) => {
    const { city, country } = args;
    const apiKey = process.env.WEATHER_API_KEY;
    
    if (!apiKey) {
      return 'Weather API key not configured. This is a demo response: The weather in ' + city + ' is sunny with a temperature of 72°F (22°C).';
    }
    
    try {
      const location = country ? `${city},${country}` : city;
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`
      );
      
      const data = response.data;
      return `Weather in ${data.name}, ${data.sys.country}:
- Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)
- Conditions: ${data.weather[0].description}
- Humidity: ${data.main.humidity}%
- Wind Speed: ${data.wind.speed} m/s`;
    } catch (error) {
      return `Unable to fetch weather for ${city}. Error: ${error.message}`;
    }
  }
};

/**
 * Database query tool for searching conversation history
 */
export const databaseQuery = {
  definition: {
    type: 'function',
    function: {
      name: 'search_conversation_history',
      description: 'Search through past conversation messages for specific keywords or topics',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query or keyword to look for in conversation history'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 5)',
            default: 5
          }
        },
        required: ['query']
      }
    }
  },
  
  execute: async (args, db, userId, channelId) => {
    const { query, limit = 5 } = args;
    
    if (!db) {
      return 'Database not available';
    }
    
    try {
      // Get all conversation history
      const history = db.getConversationHistory(userId, channelId, 50);
      
      // Simple text search
      const results = history
        .filter(msg => msg.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
      
      if (results.length === 0) {
        return `No messages found containing "${query}"`;
      }
      
      const formatted = results.map((msg, idx) => 
        `${idx + 1}. [${msg.role}]: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`
      ).join('\n');
      
      return `Found ${results.length} message(s) containing "${query}":\n${formatted}`;
    } catch (error) {
      return `Error searching conversation history: ${error.message}`;
    }
  }
};

/**
 * Get current date and time tool
 */
export const datetime = {
  definition: {
    type: 'function',
    function: {
      name: 'get_current_datetime',
      description: 'Get the current date and time',
      parameters: {
        type: 'object',
        properties: {
          timezone: {
            type: 'string',
            description: 'Optional timezone (e.g., America/New_York, Europe/London)',
            default: 'UTC'
          }
        }
      }
    }
  },
  
  execute: async (args) => {
    const { timezone = 'UTC' } = args;
    
    try {
      const now = new Date();
      const options = {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short'
      };
      
      const formatted = now.toLocaleString('en-US', options);
      return `Current date and time in ${timezone}: ${formatted}`;
    } catch (error) {
      return `Error getting date/time: ${error.message}`;
    }
  }
};

// Export all tools
export const allTools = [calculator, weather, databaseQuery, datetime];

// Get tool definitions for OpenAI API
export function getToolDefinitions() {
  return allTools.map(tool => tool.definition);
}

// Execute a tool by name
export async function executeTool(toolName, args, db = null, userId = null, channelId = null) {
  const tool = allTools.find(t => t.definition.function.name === toolName);
  
  if (!tool) {
    return `Error: Tool "${toolName}" not found`;
  }
  
  try {
    return await tool.execute(args, db, userId, channelId);
  } catch (error) {
    return `Error executing ${toolName}: ${error.message}`;
  }
}
