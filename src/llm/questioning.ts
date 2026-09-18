
import { getLLMClient } from './client';
import type { LLMContext, LLMResponse } from './types';

export interface QuestionResult {
  answer: string;
  confidence: number;
  sources?: string[];
  followUpQuestions?: string[];
  relatedTopics?: string[];
}

export interface ClarificationRequest {
  question: string;
  reason: string;
  options?: string[];
}

export class QuestioningAgent {

  async askQuestion(
    question: string,
    context?: LLMContext
  ): Promise<QuestionResult> {
    const llm = getLLMClient();
    
    const prompt = this.buildQuestionPrompt(question, context);
    
    try {
      const response = await llm.generateResponse(prompt, context);
      return this.parseQuestionResponse(response.content);
    } catch (error) {
      console.error('Question answering error:', error);
      return {
        answer: `I encountered an error trying to answer that question: ${error.message}`,
        confidence: 0.1,
      };
    }
  }


  async *askQuestionStream(
    question: string,
    context?: LLMContext
  ): AsyncGenerator<string, void, unknown> {
    const llm = getLLMClient();
    
    const prompt = this.buildQuestionPrompt(question, context);
    let fullResponse = '';
    
    try {
      for await (const chunk of llm.generateResponseStream(prompt, context)) {
        fullResponse += chunk;
        yield chunk;
      }
    } catch (error) {
      console.error('Question streaming error:', error);
      const errorMessage = `I encountered an error: ${error.message}`;
      yield errorMessage;
    }
  }


  async needsClarification(
    question: string,
    context?: LLMContext
  ): Promise<ClarificationRequest | null> {
    const llm = getLLMClient();
    
    const clarificationPrompt = `Analyze this question and determine if it needs clarification:

Question: "${question}"

Consider:
- Is the question ambiguous?
- Are there multiple interpretations?
- Is important context missing?
- Are there undefined terms?

If clarification is needed, provide:
QUESTION: [What needs to be clarified]
REASON: [Why clarification is needed]
OPTIONS: [Optional: List of possible interpretations or choices]

If the question is clear and complete, respond with: "NO_CLARIFICATION_NEEDED"`;

    try {
      const response = await llm.generateResponse(clarificationPrompt, context);
      
      if (response.content.includes('NO_CLARIFICATION_NEEDED')) {
        return null;
      }

      return this.parseClarificationResponse(response.content);
    } catch (error) {
      console.error('Clarification analysis error:', error);
      return null;
    }
  }


  async generateFollowUpQuestions(
    originalQuestion: string,
    answer: string,
    context?: LLMContext
  ): Promise<string[]> {
    const llm = getLLMClient();
    
    const followUpPrompt = `Based on this Q&A, generate 3-5 relevant follow-up questions:

Original Question: ${originalQuestion}

Answer: ${answer}

Generate follow-up questions that:
1. Deepen understanding of the topic
2. Explore related aspects
3. Address potential next steps
4. Clarify complex points

Format each question on a new line starting with "- "`;

    try {
      const response = await llm.generateResponse(followUpPrompt, context);
      const questions = response.content
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^[-*]\s*/, '').trim());
      
      return questions.slice(0, 5); // limit to 5 questions
    } catch (error) {
      console.error('Follow-up generation error:', error);
      return [];
    }
  }


  async batchAnswerQuestions(
    questions: string[],
    context?: LLMContext
  ): Promise<QuestionResult[]> {
    const results: QuestionResult[] = [];
    
    for (const question of questions) {
      const result = await this.askQuestion(question, context);
      results.push(result);
    }
    
    return results;
  }

  private buildQuestionPrompt(question: string, context?: LLMContext): string {
    let prompt = `Please answer the following question thoroughly and accurately.

Question: ${question}

Provide:
1. A clear, direct answer
2. Relevant context and background
3. Examples if applicable
4. Any important caveats or limitations

If you're uncertain about any part of the answer, acknowledge it and explain your level of confidence.`;

    if (context?.projectContext) {
      prompt += `\n\nProject Context:
- Working in: ${context.projectContext.root}
- Current branch: ${context.projectContext.branch || 'main'}
- Git status: ${context.projectContext.isDirty ? 'Has uncommitted changes' : 'Clean'}`;
    }

    if (context?.conversation && context.conversation.length > 0) {
      const recentContext = context.conversation.slice(-3).map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');
      
      prompt += `\n\nRecent Conversation:\n${recentContext}`;
    }

    return prompt;
  }

 
  parseQuestionResponse(response: string): QuestionResult {
    const sources: string[] = [];
    const followUpQuestions: string[] = [];
    const relatedTopics: string[] = [];

    const sourcesMatch = response.match(/sources?:([\s\S]*?)(?:follow-up|related|$)/i);
    if (sourcesMatch) {
      const sourceLines = sourcesMatch[1].split('\n').filter(line => line.trim());
      sources.push(...sourceLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    const followUpMatch = response.match(/follow-up questions?:([\s\S]*?)(?:related|$)/i);
    if (followUpMatch) {
      const questionLines = followUpMatch[1].split('\n').filter(line => line.trim());
      followUpQuestions.push(...questionLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    const relatedMatch = response.match(/related topics?:([\s\S]*)/i);
    if (relatedMatch) {
      const topicLines = relatedMatch[1].split('\n').filter(line => line.trim());
      relatedTopics.push(...topicLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    let confidence = 0.8;
    if (response.toLowerCase().includes('uncertain') || response.toLowerCase().includes('not sure')) {
      confidence = 0.5;
    }
    if (response.toLowerCase().includes('definitely') || response.toLowerCase().includes('certain')) {
      confidence = 0.95;
    }

    return {
      answer: response,
      confidence,
      sources: sources.length > 0 ? sources : undefined,
      followUpQuestions: followUpQuestions.length > 0 ? followUpQuestions : undefined,
      relatedTopics: relatedTopics.length > 0 ? relatedTopics : undefined,
    };
  }

  private parseClarificationResponse(response: string): ClarificationRequest {
    const questionMatch = response.match(/question:\s*(.+)/i);
    const reasonMatch = response.match(/reason:\s*(.+)/i);
    const optionsMatch = response.match(/options?:([\s\S]*)/i);

    const options: string[] = [];
    if (optionsMatch) {
      const optionLines = optionsMatch[1].split('\n').filter(line => line.trim());
      options.push(...optionLines.map(line => line.replace(/^[-*]\s*/, '').trim()));
    }

    return {
      question: questionMatch ? questionMatch[1].trim() : 'Please provide more details',
      reason: reasonMatch ? reasonMatch[1].trim() : 'The question needs clarification',
      options: options.length > 0 ? options : undefined,
    };
  }
}

let questioningAgentInstance: QuestioningAgent | null = null;

export function getQuestioningAgent(): QuestioningAgent {
  if (!questioningAgentInstance) {
    questioningAgentInstance = new QuestioningAgent();
  }
  return questioningAgentInstance;
}