
export * from './types';
export * from './config';
export * from './client';
export * from './planning';
export * from './questioning';
export * from './memory';

import { getLLMClient } from './client';
import { getPlanningAgent } from './planning';
import { getQuestioningAgent } from './questioning';
import { getMemoryManager } from './memory';
import type { LLMContext, ExecutionPlan, QuestionResult } from './types';

export class LLMSystem {
  private client = getLLMClient();
  private planner = getPlanningAgent();
  private questioner = getQuestioningAgent();
  private memory = getMemoryManager();

  async plan(task: string, context?: LLMContext): Promise<ExecutionPlan> {
    this.memory.addMessage({
      role: 'user',
      content: `Plan: ${task}`,
      timestamp: Date.now(),
    }, { task, importance: 'high' });

    const plan = await this.planner.createPlan(task, context);

    this.memory.addMessage({
      role: 'assistant',
      content: `Created plan for: ${task}`,
      timestamp: Date.now(),
    }, { task, importance: 'high' });

    return plan;
  }


  async ask(question: string, context?: LLMContext): Promise<QuestionResult> {
    // Add to memory
    this.memory.addMessage({
      role: 'user',
      content: question,
      timestamp: Date.now(),
    });

    const result = await this.questioner.askQuestion(question, context);
    
    // Store answer in memory
    this.memory.addMessage({
      role: 'assistant',
      content: result.answer,
      timestamp: Date.now(),
    }, { importance: result.confidence > 0.7 ? 'medium' : 'low' });

    return result;
  }


  async *askStream(question: string, context?: LLMContext): AsyncGenerator<string, void, unknown> {
    this.memory.addMessage({
      role: 'user',
      content: question,
      timestamp: Date.now(),
    });

    let fullResponse = '';
    
    for await (const chunk of this.questioner.askQuestionStream(question, context)) {
      fullResponse += chunk;
      yield chunk;
    }

  
    const result = this.questioner.parseQuestionResponse(fullResponse);
    
    this.memory.addMessage({
      role: 'assistant',
      content: result.answer,
      timestamp: Date.now(),
    }, { importance: result.confidence > 0.7 ? 'medium' : 'low' });
  }


  getContext(limit?: number): LLMContext {
    return this.memory.getRecentContext(limit);
  }

  searchMemory(query: string, limit?: number) {
    return this.memory.searchMemory(query, limit);
  }


  clearMemory(): void {
    this.memory.clearAll();
  }

  getStats() {
    return {
      memory: this.memory.getStats(),
      conversationHistory: this.client.getHistory(),
    };
  }
}

let llmSystemInstance: LLMSystem | null = null;

export function getLLMSystem(): LLMSystem {
  if (!llmSystemInstance) {
    llmSystemInstance = new LLMSystem();
  }
  return llmSystemInstance;
}

export function resetLLMSystem(): void {
  llmSystemInstance = null;
}