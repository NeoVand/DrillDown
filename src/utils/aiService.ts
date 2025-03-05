import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

// Type definitions
export type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface AIServiceConfig {
  modelName: string;
  temperature: number;
  systemPrompt: string;
}

// Default configurations
const DEFAULT_MODEL = 'llama3';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_SYSTEM_PROMPT = 
  'You are an AI assistant integrated into a Root Cause Analysis (RCA) application called Drill Down. ' +
  'Your role is to help users analyze problems using Why-Because Analysis methodology, ' +
  'identify root causes, and generate comprehensive reports and presentation slides. ' +
  'You should ask clarifying questions, suggest potential causes, and help the user create ' +
  'a clear and structured analysis diagram, report, and slides.';

// AI Service class
class AIService {
  private modelName: string;
  private temperature: number;
  private systemPrompt: string;
  private model: ChatOllama;
  private chain: RunnableSequence;
  
  constructor(config?: Partial<AIServiceConfig>) {
    this.modelName = config?.modelName || DEFAULT_MODEL;
    this.temperature = config?.temperature || DEFAULT_TEMPERATURE;
    this.systemPrompt = config?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    
    // Initialize the model
    this.model = new ChatOllama({
      model: this.modelName,
      format: 'json',
      temperature: this.temperature,
    });
    
    // Create the chain
    this.chain = RunnableSequence.from([
      this.model,
      new StringOutputParser(),
    ]);
  }
  
  // Update configurations
  updateConfig(config: Partial<AIServiceConfig>) {
    let needsReinitialize = false;
    
    if (config.modelName && config.modelName !== this.modelName) {
      this.modelName = config.modelName;
      needsReinitialize = true;
    }
    
    if (config.temperature !== undefined && config.temperature !== this.temperature) {
      this.temperature = config.temperature;
      needsReinitialize = true;
    }
    
    if (config.systemPrompt) {
      this.systemPrompt = config.systemPrompt;
    }
    
    if (needsReinitialize) {
      this.model = new ChatOllama({
        model: this.modelName,
        format: 'json',
        temperature: this.temperature,
      });
      
      this.chain = RunnableSequence.from([
        this.model,
        new StringOutputParser(),
      ]);
    }
  }
  
  // Convert messages to Langchain format
  private convertMessages(messages: Message[]) {
    return messages.map(msg => {
      switch (msg.role) {
        case 'system':
          return new SystemMessage(msg.content);
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }
  
  // Generate a response
  async generateResponse(messages: Message[]): Promise<string> {
    // Add system prompt if not present
    if (!messages.some(msg => msg.role === 'system')) {
      messages = [{ role: 'system', content: this.systemPrompt }, ...messages];
    }
    
    try {
      const langchainMessages = this.convertMessages(messages);
      return await this.chain.invoke(langchainMessages);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm sorry, I encountered an error while processing your request. Please try again.";
    }
  }
  
  // Specialized methods for different flows
  
  // Diagram Assistance Flow
  async suggestCauses(problemDescription: string, existingCauses: string[] = []): Promise<string[]> {
    const existingCausesText = existingCauses.length > 0 
      ? `Existing causes identified: ${existingCauses.join(', ')}. `
      : '';
    
    const prompt = `${existingCausesText}Based on the problem description: "${problemDescription}", 
      suggest potential root causes that could have contributed to this problem. 
      Focus on identifying actionable and specific causes.`;
    
    const response = await this.generateResponse([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ]);
    
    // This is a simplified parsing approach
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[0-9\-\*\.\s]+/, '').trim());
  }
  
  // Report Generation Flow
  async generateReport(
    problemDefinition: string, 
    causes: string[], 
    evidence: Record<string, string[]>
  ): Promise<string> {
    const causesText = causes.map((cause, i) => `${i+1}. ${cause}`).join('\n');
    const evidenceText = Object.entries(evidence)
      .map(([cause, items]) => `Evidence for "${cause}":\n${items.map(e => `- ${e}`).join('\n')}`)
      .join('\n\n');
    
    const prompt = `Generate a comprehensive Root Cause Analysis (RCA) report for the following problem:
      
      Problem Definition: ${problemDefinition}
      
      Identified Causes:
      ${causesText}
      
      Supporting Evidence:
      ${evidenceText}
      
      Include the following sections in the report:
      1. Executive Summary
      2. Problem Statement
      3. Timeline of Events (you can make reasonable assumptions)
      4. Root Causes Identified
      5. Evidence and Analysis
      6. Recommendations
      7. Conclusion
      
      Format the report using Markdown.`;
    
    return await this.generateResponse([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ]);
  }
  
  // Slide Creation Flow
  async generateSlides(reportContent: string): Promise<string> {
    const prompt = `Convert the following RCA report into a set of concise, executive-summary slides.
      Use a maximum of 6-8 slides, focusing on the most important information.
      Format the output as a markdown document with "---" separating each slide.
      
      Report content:
      ${reportContent}`;
    
    return await this.generateResponse([
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: prompt }
    ]);
  }
}

// Create and export a singleton instance
const aiService = new AIService();

export default aiService; 