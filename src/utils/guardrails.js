import OpenAI from 'openai';

class Guardrails {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Check content using OpenAI's moderation API
   */
  async moderateContent(text) {
    try {
      const response = await this.openai.moderations.create({
        input: text,
      });

      const result = response.results[0];
      
      return {
        flagged: result.flagged,
        categories: result.categories,
        categoryScores: result.category_scores,
        safe: !result.flagged
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      // If moderation fails, err on the side of caution
      return {
        flagged: true,
        safe: false,
        error: error.message
      };
    }
  }

  /**
   * Get a user-friendly message about why content was flagged
   */
  getFlaggedReason(moderationResult) {
    if (!moderationResult.flagged) {
      return null;
    }

    const flaggedCategories = Object.entries(moderationResult.categories)
      .filter(([_, flagged]) => flagged)
      .map(([category, _]) => category);

    if (flaggedCategories.length === 0) {
      return 'Content was flagged by our safety system.';
    }

    return `Content was flagged for: ${flaggedCategories.join(', ')}. Please keep the conversation appropriate.`;
  }

  /**
   * Validate both user input and AI response
   */
  async validateExchange(userMessage, aiResponse = null) {
    const userModeration = await this.moderateContent(userMessage);
    
    if (!userModeration.safe) {
      return {
        safe: false,
        reason: this.getFlaggedReason(userModeration),
        type: 'user_input'
      };
    }

    if (aiResponse) {
      const aiModeration = await this.moderateContent(aiResponse);
      if (!aiModeration.safe) {
        return {
          safe: false,
          reason: 'AI response was filtered for safety.',
          type: 'ai_response'
        };
      }
    }

    return {
      safe: true,
      reason: null,
      type: null
    };
  }
}

export default Guardrails;
