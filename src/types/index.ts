export type ModelProvider = 'ollama' | 'azure';

export interface OllamaSettings {
  model: string;
  temperature: number;
  topP: number;
  useFixedSeed: boolean;
  seed: number;
  numCtx: number;
  streaming?: boolean;
  systemPrompt?: string;
}

export interface AzureOpenAISettings {
  endpoint: string;
  apiKey: string;
  deploymentId: string;
  apiVersion: string;
  temperature: number;
  topP: number;
} 