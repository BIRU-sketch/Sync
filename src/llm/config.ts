
import type { LLMConfig, LLMModel } from './types';

export const DEFAULT_MODEL: LLMModel = 'gemini-3.5-flash-lite';

export const DEFAULT_CONFIG: Partial<LLMConfig> = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  topK: 40,
};

export function getLLMConfig(): LLMConfig {
  // Try multiple sources for the API key
  const apiKey = 
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is required. Set VITE_GEMINI_API_KEY or GEMINI_API_KEY in .env file.');
  }

  return {
    apiKey,
    model: DEFAULT_MODEL,
    ...DEFAULT_CONFIG,
  };
}

export function getModelCapabilities(model: LLMModel) {
  const capabilities = {
    'gemini-2.5-flash-lite': {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      contextWindow: 1000000,
    },
    'gemini-2.5-flash': {
      maxTokens: 8192,
      supportsStreaming: true,
      supportsFunctionCalling: true,
      supportsVision: true,
      contextWindow: 1000000,
    },
    'gemini-1.0-pro': {
      maxTokens: 2048,
      supportsStreaming: true,
      supportsFunctionCalling: false,
      supportsVision: false,
      contextWindow: 38000,
    },
  };

  return capabilities[model] || capabilities['gemini-2.5-flash-lite'];
}