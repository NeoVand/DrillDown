import { RCAAgent } from './langgraphAgent';
import type { AIService } from '../context/AppContext';
import type { ChatMessage } from '../context/AppContext';
import type { Node, Edge } from 'reactflow';
import type { Project } from '../context/AppContext';
import type { OllamaSettings } from '../types';
import type { Message, MessageRole } from './aiService';

// Create an AIService implementation that uses our RCAAgent
export class RCAAgentService implements AIService {
  private agent: RCAAgent;
  private settings: OllamaSettings;
  private defaultChatHistory: { role: 'user' | 'assistant'; content: string }[];
  private currentMode: 'diagram' | 'report' | 'slides' | null = null;
  private systemPrompt: string | undefined;
  
  constructor(settings: OllamaSettings) {
    this.settings = settings;
    this.agent = new RCAAgent(settings.model, settings.temperature);
    this.defaultChatHistory = [];
    this.systemPrompt = settings.systemPrompt;
  }
  
  // Update settings (e.g., when user changes model or temperature)
  updateSettings(settings: OllamaSettings): void {
    this.settings = settings;
    this.agent = new RCAAgent(settings.model, settings.temperature);
    this.systemPrompt = settings.systemPrompt;
  }
  
  // Basic chat functionality
  async chat(message: string): Promise<string> {
    // Use streamChat internally for consistency
    let fullResponse = '';
    
    await this.streamChat(
      message,
      (chunk) => { fullResponse += chunk; }
    );
    
    return fullResponse;
  }

  // Create a new method that takes a progress callback
  private async chatWithProgress(message: string, onProgress: (text: string) => void): Promise<string> {
    try {
      const agent = this.createAgent();
      let fullResponse = '';
      
      // Create a promise that will resolve with the full response
      const responsePromise = new Promise<string>((resolve, reject) => {
        try {
          // Use our own streaming approach since streamChat may not exist on the agent
          const history = this.getChatHistory();
          
          // Start the agent processing
          agent.processMessage(
            message,
            history,
            this.getCurrentProject(),
            this.currentMode
          )
          .then(response => {
            // This will be called after processing completes
            resolve(response);
          })
          .catch(error => {
            console.error("Error in RCA chat process:", error);
            reject(error);
          });
          
          // Meanwhile, simulate streaming for UI feedback
          this.simulateStreamingWithCallback(message, (token) => {
            fullResponse += token;
            onProgress(token);
          });
        } catch (error) {
          console.error("Error setting up chat stream:", error);
          reject(error);
        }
      });
      
      // Add user message to chat history
      this.addMessageToHistory({ role: 'user', content: message });
      
      // Wait for the full response and add it to history
      const response = await responsePromise;
      this.addMessageToHistory({ role: 'assistant', content: response });
      
      return response;
    } catch (error) {
      console.error("Error in RCA chat:", error);
      // Return a helpful error message that can be displayed to the user
      return "I'm sorry, there was an error processing your request. Please try again.";
    }
  }

  // Helper method to simulate streaming with a callback
  private simulateStreamingWithCallback(message: string, onToken: (token: string) => void): void {
    // Create chunks to simulate streaming
    const chunks = this.simulateStreaming(message);
    let index = 0;
    
    const streamInterval = setInterval(() => {
      if (index < chunks.length) {
        onToken(chunks[index]);
        index++;
      } else {
        clearInterval(streamInterval);
      }
    }, 50);
  }
  
  // Set the current mode based on the active tab
  setActiveTab(tabName: string): void {
    switch (tabName.toLowerCase()) {
      case 'diagram':
        this.currentMode = 'diagram';
        break;
      case 'report':
        this.currentMode = 'report';
        break;
      case 'slides':
        this.currentMode = 'slides';
        break;
      default:
        this.currentMode = null;
    }
  }
  
  // Streaming chat functionality
  async streamChat(message: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      // Use the current mode (set based on active tab)
      const mode = this.currentMode;
      
      // Format the chat history for the agent
      const formattedHistory: Message[] = this.defaultChatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant' as MessageRole,
        content: msg.content,
      }));
      
      // Process the message with our agent
      const response = await this.agent.processMessage(message, formattedHistory, null, mode);
      
      // Since we don't have true streaming with the agent yet, we'll simulate it
      const chunks = this.simulateStreaming(response);
      
      for (const chunk of chunks) {
        onChunk(chunk);
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Update the chat history
      this.defaultChatHistory.push({ role: 'user', content: message });
      this.defaultChatHistory.push({ role: 'assistant', content: response });
      
    } catch (error) {
      console.error('Error in RCA agent stream chat:', error);
      onChunk('I encountered an error processing your request. Please try again.');
    }
  }
  
  // Simulate streaming by breaking the response into chunks
  private simulateStreaming(text: string): string[] {
    const avgChunkSize = 20; // Average characters per chunk
    const chunks: string[] = [];
    
    let remainingText = text;
    while (remainingText.length > 0) {
      // Vary chunk size slightly for more natural effect
      const size = Math.floor(avgChunkSize * (0.8 + Math.random() * 0.4));
      const chunk = remainingText.slice(0, size);
      remainingText = remainingText.slice(size);
      chunks.push(chunk);
    }
    
    return chunks;
  }
  
  // Analyze nodes and suggest improvements
  async analyzeNodes(nodes: Node[], edges: Edge[]): Promise<string> {
    if (!nodes.length) {
      return "Your diagram is empty. Start by adding a problem node to describe the issue you're analyzing.";
    }
    
    // Format the chat history for the agent
    const formattedHistory: Message[] = this.defaultChatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant' as MessageRole,
      content: msg.content,
    }));
    
    try {
      // Use a special prompt for node analysis
      const analysisPrompt = "Analyze my current diagram and suggest improvements or additional nodes I should consider.";
      
      // Create a mock project with just the nodes and edges
      const mockProject: Project = {
        id: 'temp',
        name: 'Analysis',
        createdAt: new Date(),
        updatedAt: new Date(),
        nodes,
        edges,
      };
      
      const response = await this.agent.processMessage(
        analysisPrompt, 
        formattedHistory,
        mockProject, 
        'diagram'
      );
      
      return response;
    } catch (error) {
      console.error('Error analyzing nodes:', error);
      return "I encountered an error analyzing your diagram. Please try again.";
    }
  }
  
  // Generate a report from the diagram
  async generateReportFromDiagram(project: Project | null): Promise<string> {
    if (!project) {
      return "No project is currently selected. Please select or create a project first.";
    }
    
    if (!project.nodes || project.nodes.length === 0) {
      return "Your diagram is empty. Please create a diagram first before generating a report.";
    }
    
    // Format the chat history for the agent
    const formattedHistory: Message[] = this.defaultChatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant' as MessageRole,
      content: msg.content,
    }));
    
    try {
      const report = await this.agent.generateReport(project, formattedHistory);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      return "I encountered an error generating the report. Please try again.";
    }
  }
  
  // Generate slides from a report
  async generateSlidesFromReport(project: Project | null): Promise<string> {
    if (!project) {
      return "No project is currently selected. Please select or create a project first.";
    }
    
    if (!project.report) {
      return "This project doesn't have a report yet. Please generate a report first before creating slides.";
    }
    
    // Format the chat history for the agent
    const formattedHistory: Message[] = this.defaultChatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant' as MessageRole,
      content: msg.content,
    }));
    
    try {
      const slides = await this.agent.generateSlides(project, formattedHistory);
      return slides;
    } catch (error) {
      console.error('Error generating slides:', error);
      return "I encountered an error generating the slides. Please try again.";
    }
  }
  
  // Search for evidence (implement as needed)
  async searchEvidence(query: string): Promise<string> {
    try {
      // This would typically integrate with a search API or database
      // For now, we'll use the agent to generate a response
      const searchPrompt = `I'm looking for evidence related to: ${query}. Can you help me find relevant information?`;
      
      // Format the chat history for the agent
      const formattedHistory: Message[] = this.defaultChatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant' as MessageRole,
        content: msg.content,
      }));
      
      const response = await this.agent.processMessage(searchPrompt, formattedHistory, null, null);
      return response;
    } catch (error) {
      console.error('Error searching for evidence:', error);
      return "I encountered an error during the search. Please try again.";
    }
  }
  
  // Update chat history
  setChatHistory(history: ChatMessage[]): void {
    this.defaultChatHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  private getChatHistory(): Message[] {
    // Start with an empty array
    const history: Message[] = [];
    
    // Add system prompt if available
    if (this.systemPrompt) {
      history.push({ role: 'system', content: this.systemPrompt });
    }
    
    // Add the conversation history
    this.defaultChatHistory.forEach(msg => {
      history.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });
    
    return history;
  }

  private getCurrentProject(): Project | null {
    // This method should return the current project
    // For now, we'll just return null since we don't have direct access to AppContext here
    return null;
  }

  private createAgent(): RCAAgent {
    // This method should create and return the RCAAgent instance
    // For now, we'll just return the existing agent
    return this.agent;
  }

  private addMessageToHistory(message: { role: 'user' | 'assistant'; content: string }): void {
    this.defaultChatHistory.push(message);
  }
} 