import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LLMConfig, LLMMessage, LLMResponse, LLMContext } from './types';
import { getLLMConfig } from './config';

export class LLMClient {
  private client: GoogleGenerativeAI;
  private config: LLMConfig;
  private conversationHistory: LLMMessage[] = [];

  constructor(config?: Partial<LLMConfig>) {
    this.config = { ...getLLMConfig(), ...config };
    this.client = new GoogleGenerativeAI(this.config.apiKey);
  }

  async generateResponse(
    prompt: string,
    context?: LLMContext
  ): Promise<LLMResponse> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });


      const chatHistory = this.buildChatHistory(context);
      

      const fullPrompt = this.buildSystemPrompt(context) + '\n\n' + prompt;

      const result = await model.generateContent(fullPrompt);
      const response = result.response;
      const text = response.text();

      this.addToHistory('user', prompt);
      this.addToHistory('assistant', text);

      return {
        content: text,
        confidence: this.estimateConfidence(response),
      };
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }


  async *generateResponseStream(
    prompt: string,
    context?: LLMContext
  ): AsyncGenerator<string, void, unknown> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxTokens,
          topP: this.config.topP,
          topK: this.config.topK,
        },
      });

      const fullPrompt = this.buildSystemPrompt(context) + '\n\n' + prompt;
      const result = await model.generateContentStream(fullPrompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }

      const finalResponse = await result.response;
      this.addToHistory('user', prompt);
      this.addToHistory('assistant', finalResponse.text());

    } catch (error) {
      console.error('LLM streaming error:', error);
      throw new Error(`Failed to generate streaming response: ${error.message}`);
    }
  }

  
  clearHistory(): void {
    this.conversationHistory = [];
  }


  getHistory(): LLMMessage[] {
    return [...this.conversationHistory];
  }


  private addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({
      role,
      content,
      timestamp: Date.now(),
    });


    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
  }


  private buildChatHistory(context?: LLMContext): string {
    if (!context?.conversation || context.conversation.length === 0) {
      return '';
    }

    return context.conversation
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }


  private buildSystemPrompt(context?: LLMContext): string {
    let systemPrompt = `You are a helpful AI voice companion for developers. You assist with coding tasks, research, and problem-solving.`;

    if (context?.projectContext) {
      systemPrompt += `\n\nProject Context:
- Root: ${context.projectContext.root}
- Branch: ${context.projectContext.branch || 'N/A'}
- Status: ${context.projectContext.isDirty ? 'Uncommitted changes' : 'Clean'}`;
    }

    if (context?.userPreferences) {
      systemPrompt += `\n\nUser Preferences:
- Code Style: ${context.userPreferences.codeStyle || 'Standard'}
- Preferred Language: ${context.userPreferences.preferredLanguage || 'English'}
- Documentation Style: ${context.userPreferences.documentationStyle || 'Concise'}
- Complexity Level: ${context.userPreferences.complexityLevel || 'Intermediate'}`;
    }

    if (context?.currentTask) {
      systemPrompt += `\n\nCurrent Task: ${context.currentTask}`;
    }

    return systemPrompt;
  }


  private estimateConfidence(response: any): number {
    // This is a simplified confidence estimation
    // In production, you might use more sophisticated methods
    try {
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const candidate = candidates[0];
        if (candidate.safetyRatings) {
          const avgSafety = candidate.safetyRatings.reduce((sum: number, rating: any) => 
            sum + rating.probability, 0) / candidate.safetyRatings.length;
          return Math.min(0.95, 0.7 + avgSafety * 0.1);
        }
      }
    } catch (error) {
      // Fallback to default confidence
    }
    return 0.8;
  }
}


let llmClientInstance: LLMClient | null = null;

export function getLLMClient(config?: Partial<LLMConfig>): LLMClient {
  if (!llmClientInstance) {
    llmClientInstance = new LLMClient(config);
  }
  return llmClientInstance;
}

export function resetLLMClient(): void {
  llmClientInstance = null;
}