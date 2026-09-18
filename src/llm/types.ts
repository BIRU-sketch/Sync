
export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

export interface LLMContext {
  conversation: LLMMessage[];
  projectContext?: ProjectContext;
  userPreferences?: UserPreferences;
  currentTask?: string;
}

export interface ProjectContext {
  root: string;
  branch: string | null;
  isDirty: boolean;
  remote: string | null;
  recentFiles?: string[];
  recentCommands?: string[];
}

export interface UserPreferences {
  codeStyle?: string;
  preferredLanguage?: string;
  documentationStyle?: 'concise' | 'detailed' | 'tutorial';
  complexityLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LLMResponse {
  content: string;
  reasoning?: string;
  confidence?: number;
  suggestedActions?: string[];
  requiresConfirmation?: boolean;
}

export interface PlanStep {
  description: string;
  estimatedTime?: string;
  dependencies?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ExecutionPlan {
  goal: string;
  steps: PlanStep[];
  totalEstimatedTime?: string;
  resources?: string[];
  alternatives?: string[];
}

export interface ThinkingProcess {
  currentStep: string;
  progress: number;
  thoughts: string[];
  decisions: {
    [key: string]: string;
  };
  blockers?: string[];
}

export type LLMModel = 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-1.0-pro';

export interface LLMConfig {
  apiKey: string;
  model: LLMModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}