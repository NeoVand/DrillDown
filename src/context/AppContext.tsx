import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Edge, Node } from 'reactflow';
import { checkOllamaConnection, streamOllamaChat } from '../config/api';
import { ModelProvider, OllamaSettings, AzureOpenAISettings } from '../types';
import { RCAAgentService } from '../utils/rcaAgentService';

// Define project structure
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  problemStatement?: string;
  nodes: Node[];
  edges: Edge[];
  report?: string;
  slides?: string;
}

// Define chat message structure
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define the AI Service interface
export interface AIService {
  chat: (message: string) => Promise<string>;
  streamChat: (message: string, onChunk: (chunk: string) => void) => Promise<void>;
  analyzeNodes: (nodes: Node[], edges: Edge[]) => Promise<string>;
  generateReportFromDiagram: (project: Project | null) => Promise<string>;
  generateSlidesFromReport: (project: Project | null) => Promise<string>;
  searchEvidence: (query: string) => Promise<string>;
}

// Define the context type
export interface AppContextType {
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  saveProject: (project: Project) => void;
  createNewProject: (name: string, description?: string) => Project;
  deleteProject: (id: string) => void;
  chatHistory: ChatMessage[];
  addChatMessage: (message: string, role: 'user' | 'assistant') => void;
  clearChatHistory: () => void;
  aiService: AIService | null;
  modelProvider: ModelProvider;
  setModelProvider: (provider: ModelProvider) => void;
  ollamaSettings: OllamaSettings;
  setOllamaSettings: (settings: OllamaSettings) => void;
  azureSettings: AzureOpenAISettings;
  setAzureSettings: (settings: AzureOpenAISettings) => void;
  isOllamaConnected: boolean;
  checkOllamaConnection: () => Promise<{ connected: boolean; error?: string }>;
  ollcamaConnectionError: string | null;
  updateLastAssistantMessage: (content: string) => void;
  isRetryingConnection: boolean;
  enableFallbackMode: () => void;
  fallbackMode: boolean;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  selectedPromptTemplate: string;
  setSelectedPromptTemplate: (template: string) => void;
  promptTemplates: Record<string, { name: string; content: string }>;
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the OllamaAIService class
class OllamaAIService implements AIService {
  private settings: OllamaSettings;

  constructor(settings: OllamaSettings) {
    this.settings = settings;
  }

  updateSettings(settings: OllamaSettings) {
    this.settings = settings;
  }

  async chat(message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      this.streamChat(
        message,
        (chunk) => { fullResponse += chunk; },
      )
        .then(() => resolve(fullResponse))
        .catch(reject);
    });
  }

  async streamChat(message: string, onChunk: (chunk: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create messages array with user's message
      const messages = [{ role: 'user', content: message }];
      
      // Create options object from settings
      const options = {
        temperature: this.settings.temperature,
        top_p: this.settings.topP,
        seed: this.settings.useFixedSeed ? this.settings.seed : undefined,
        num_ctx: this.settings.numCtx
      };
      
      // Call the streamOllamaChat function
      streamOllamaChat(
        this.settings.model,
        messages,
        options,
        onChunk,
        () => resolve(),
        reject
      );
    });
  }

  async analyzeNodes(nodes: Node[], edges: Edge[]): Promise<string> {
    const diagramDescription = this.describeDiagram(nodes, edges);
    const prompt = `Analyze this root cause analysis diagram and provide insights:\n\n${diagramDescription}\n\nFocus on identifying key relationships between causes and effects, and suggest any additional factors that might be worth investigating.`;
    
    return this.chat(prompt);
  }
  
  async generateReportFromDiagram(project: Project | null): Promise<string> {
    if (!project) return "No project selected.";
    
    const diagramDescription = this.describeDiagram(project.nodes, project.edges);
    const prompt = `Generate a comprehensive root cause analysis report based on this diagram:\n\n${diagramDescription}\n\nThe problem statement is: ${project.problemStatement || 'Not specified'}\n\nInclude the following sections:\n- Executive Summary\n- Problem Statement\n- Root Causes Identified\n- Evidence and Analysis\n- Recommendations\n- Timeline for Implementation\n- Conclusion\n\nFormat the report in Markdown.`;
    
    return this.chat(prompt);
  }
  
  async generateSlidesFromReport(project: Project | null): Promise<string> {
    if (!project) return "No project selected.";
    if (!project.report) return "No report available. Generate a report first.";
    
    const prompt = `Convert this root cause analysis report into presentation slides in Markdown format. Each slide should be separated by "---".\n\nReport:\n${project.report}\n\nCreate slides for:\n1. Title and overview\n2. Problem statement\n3. Root causes identified\n4. Key evidence\n5. Recommendations\n6. Next steps\n7. Q&A\n\nMake the slides concise with bullet points where appropriate.`;
    
    return this.chat(prompt);
  }
  
  async searchEvidence(query: string): Promise<string> {
    const prompt = `Search for evidence related to "${query}" in the context of a root cause analysis. Return relevant information that could help determine the cause of the problem.`;
    
    return this.chat(prompt);
  }
  
  private describeDiagram(nodes: Node[], edges: Edge[]): string {
    let description = "Diagram contains:\n\n";
    
    // Describe nodes
    description += "Nodes:\n";
    nodes.forEach(node => {
      const data = node.data as any;
      description += `- ${node.id}: Type=${data.nodeType}, Label="${data.label}"\n`;
    });
    
    // Describe connections
    description += "\nConnections:\n";
    edges.forEach(edge => {
      description += `- ${edge.source} -> ${edge.target}\n`;
    });
    
    return description;
  }
}

// Create a mock Azure AI service
class MockAzureAIService implements AIService {
  async chat(message: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `This is a simulated Azure OpenAI response to: "${message}". In the real app, this would call Azure OpenAI.`;
  }
  
  async streamChat(message: string, onChunk: (chunk: string) => void): Promise<void> {
    const fullResponse = `This is a simulated Azure OpenAI response to: "${message}". In the real app, this would call Azure OpenAI.`;
    const chunks = fullResponse.split(' ');
    
    for (let i = 0; i < chunks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      onChunk(chunks[i] + ' ');
    }
  }
  
  async analyzeNodes(nodes: Node[], edges: Edge[]): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return "Based on your diagram, I can see several potential root causes. The primary issue appears to be the database connection pool exhaustion, which was triggered by a memory leak in the connection handling code.";
  }
  
  async generateReportFromDiagram(project: Project | null): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `# Root Cause Analysis Report

## Problem Statement

${project?.problemStatement || 'System outage incident on March 15th, 2024'}

## Executive Summary

The system experienced a complete outage for approximately 2 hours on March 15th, affecting all users. 
Our investigation determined that the primary cause was a database connection pool exhaustion triggered by 
a memory leak in the connection handling code that was recently deployed.

## Root Causes Identified

- **Primary cause**: Database connection pool exhaustion
- **Contributing factor**: Memory leak in connection handling code
- **Contributing factor**: Insufficient monitoring and alerting

## Evidence and Analysis

Connection pool metrics showed 100% utilization right before the system failure. Error logs revealed 
numerous connection timeout exceptions. Code review identified a recent change that failed to properly 
release database connections in certain error scenarios.

## Recommendations

- Fix the identified memory leak in the connection handling code
- Implement proper connection pooling with timeouts and limits
- Enhance monitoring system to alert before pool exhaustion
- Establish better code review practices for resource management

## Timeline for Implementation

| Action | Owner | Timeline | Priority |
| ------ | ----- | -------- | -------- |
| Deploy hotfix | Dev Team | Immediate | Critical |
| Improve monitoring | Ops Team | 1 week | High |
| Update review process | Management | 2 weeks | Medium |

## Conclusion

This incident highlights the importance of proper resource management and monitoring. The implemented changes 
will prevent similar issues in the future and improve overall system stability.`;
  }
  
  async generateSlidesFromReport(project: Project | null): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `# ${project?.name || 'Root Cause Analysis'}
## Executive Summary

---

## Problem Statement
${project?.problemStatement || 'System experienced unexpected downtime'}

- Duration: 2 hours
- Affected all users
- Occurred during peak hours

---

## Root Causes Identified
1. **Primary**: Database connection pool exhaustion
2. **Contributing**: Memory leak in connection handling
3. **Contributing**: Insufficient monitoring

---

## Key Evidence
- Connection metrics at 100% before failure
- Error logs showing timeouts
- Code review findings

---

## Recommendations
1. Fix the memory leak
2. Implement connection limits
3. Enhance monitoring system
4. Improve code review process

---

## Next Steps
| Action | Owner | Timeline |
| ------ | ----- | -------- |
| Deploy fix | Development | Immediate |
| Add monitoring | Operations | 1 week |
| Update processes | Management | 2 weeks |

---

# Thank You
## Questions?`;
  }
  
  async searchEvidence(query: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return `Found 3 pieces of evidence related to "${query}":\n\n1. Error logs showing connection timeouts\n2. Connection pool metrics at 100% utilization\n3. Recent code change affecting connection handling`;
  }
}

// Create the provider component
export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Model settings state
  const [modelProvider, setModelProvider] = useState<ModelProvider>('ollama');
  const [ollamaSettings, setOllamaSettings] = useState<OllamaSettings>({
    model: '',
    temperature: 0.7,
    topP: 0.9,
    useFixedSeed: false,
    seed: 42,
    numCtx: 2048,
    streaming: true,
  });
  const [azureSettings, setAzureSettings] = useState<AzureOpenAISettings>({
    endpoint: '',
    apiKey: '',
    deploymentId: '',
    apiVersion: '2023-05-15',
    temperature: 0.7,
    topP: 0.9,
  });
  
  // Ollama connection state
  const [isOllamaConnected, setIsOllamaConnected] = useState<boolean>(false);
  const [ollamaConnectionError, setOllamaConnectionError] = useState<string | null>(null);
  const [isRetryingConnection, setIsRetryingConnection] = useState<boolean>(false);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  
  // AI Service instances
  const [aiService, setAiService] = useState<AIService | null>(null);
  
  // Add system prompt state
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are an AI assistant integrated into a Root Cause Analysis (RCA) application called Drill Down. " +
    "Your role is to help users analyze problems using Why-Because Analysis methodology, identify root causes, " +
    "and generate comprehensive reports and presentation slides. You should ask clarifying questions, " +
    "suggest potential causes, and help the user create a clear and structured analysis diagram, report, and slides."
  );
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState<string>('diagram-assistance');
  
  // Define prompt templates
  const promptTemplates = {
    'diagram-assistance': {
      name: 'Diagram Assistance',
      content: "You are an AI assistant integrated into a Root Cause Analysis (RCA) application called Drill Down. Your role is to help users create and analyze Why-Because Graphs to identify root causes. Focus on asking clarifying questions and suggesting potential causes and relationships."
    },
    'report-generation': {
      name: 'Report Generation',
      content: "You are an AI assistant helping users generate comprehensive Root Cause Analysis reports. Your goal is to transform the user's diagram and notes into a well-structured professional report with executive summary, problem statement, root causes, evidence, and recommendations."
    },
    'slide-creation': {
      name: 'Slide Creation',
      content: "You are an AI assistant specializing in creating presentation slides from Root Cause Analysis reports. Create concise, visually-focused slides that communicate key findings and recommendations to executives and stakeholders."
    },
    'root-cause-analysis': {
      name: 'Root Cause Analysis',
      content: "You are an expert Root Cause Analysis consultant. Guide the user through the 5 Whys technique and other RCA methodologies. Help identify causal factors, distinguish symptoms from causes, and develop effective preventive measures."
    }
  };
  
  // Initialize AI Service based on selected provider
  useEffect(() => {
    if (modelProvider === 'ollama' && ollamaSettings) {
      // Use the new RCA Agent Service instead of the basic Ollama service
      const rcaService = new RCAAgentService(ollamaSettings);
      
      // Pass in the current chat history
      rcaService.setChatHistory(chatHistory);
      
      setAiService(rcaService);
      
      // Check connection
      checkConnection();
    } else if (modelProvider === 'azure' && azureSettings) {
      setAiService(new MockAzureAIService());
    } else {
      setAiService(null);
    }
  }, [modelProvider, ollamaSettings, azureSettings]);

  // Update the RCA service with the latest chat history when it changes
  useEffect(() => {
    if (aiService && modelProvider === 'ollama') {
      (aiService as RCAAgentService).setChatHistory(chatHistory);
    }
  }, [chatHistory, aiService, modelProvider]);
  
  // Check Ollama connection
  const checkConnection = useCallback(async () => {
    const result = await checkOllamaConnection();
    setIsOllamaConnected(result.connected);
    setOllamaConnectionError(result.error || null);
    return result;
  }, []);
  
  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);
  
  // For demo purposes, initialize with a sample project
  React.useEffect(() => {
    if (projects.length === 0) {
      const sampleProject = createNewProject('Sample RCA Project', 'Analysis of the March 15th system outage');
      sampleProject.problemStatement = 'The system experienced a complete outage for 2 hours on March 15th, affecting all users.';
      setProjects([sampleProject]);
    }
  }, []);

  const saveProject = (project: Project) => {
    setProjects(prev => {
      const existing = prev.findIndex(p => p.id === project.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...project, updatedAt: new Date() };
        return updated;
      } else {
        return [...prev, { ...project, updatedAt: new Date() }];
      }
    });
    
    if (currentProject?.id === project.id) {
      setCurrentProject({ ...project, updatedAt: new Date() });
    }
  };

  const createNewProject = (name: string, description?: string): Project => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      nodes: [],
      edges: [],
    };
    
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  const addChatMessage = (message: string, role: 'user' | 'assistant') => {
    setChatHistory(prev => [...prev, { role, content: message }]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const updateLastAssistantMessage = (content: string) => {
    setChatHistory(prev => {
      // Find the last assistant message
      const lastAssistantIndex = [...prev].reverse().findIndex(msg => msg.role === 'assistant');
      
      if (lastAssistantIndex >= 0) {
        // Convert from reverse index to normal index
        const index = prev.length - 1 - lastAssistantIndex;
        const updated = [...prev];
        updated[index] = { ...updated[index], content };
        return updated;
      }
      
      // If no assistant message found, add one
      return [...prev, { role: 'assistant', content }];
    });
  };

  // Enable fallback mode
  const enableFallbackMode = useCallback(() => {
    setFallbackMode(true);
    // Create a mock AI service that provides simulated responses
    const mockService = new MockAIService();
    setAiService(mockService);
  }, []);

  // Override setOllamaSettings to ensure streaming is always true
  const setOllamaSettingsWithStreaming = useCallback((settings: OllamaSettings) => {
    // Always ensure streaming is true regardless of input
    setOllamaSettings({
      ...settings,
      streaming: true
    });
  }, []);

  // Include the system prompt when creating or updating the AI service
  useEffect(() => {
    if (modelProvider === 'ollama' && isOllamaConnected) {
      const ollamaService = new RCAAgentService({
        ...ollamaSettings,
        systemPrompt // Pass the system prompt to the service
      });
      setAiService(ollamaService);
    } else if (modelProvider === 'azure') {
      // Add Azure support later
      setAiService(null);
    } else {
      setAiService(null);
    }
  }, [modelProvider, isOllamaConnected, ollamaSettings, systemPrompt]); // Add systemPrompt as a dependency

  return (
    <AppContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        projects,
        setProjects,
        saveProject,
        createNewProject,
        deleteProject,
        chatHistory,
        addChatMessage,
        clearChatHistory,
        aiService,
        modelProvider,
        setModelProvider,
        ollamaSettings,
        setOllamaSettings: setOllamaSettingsWithStreaming,
        azureSettings,
        setAzureSettings,
        isOllamaConnected,
        checkOllamaConnection: checkConnection,
        ollcamaConnectionError: ollamaConnectionError,
        updateLastAssistantMessage,
        isRetryingConnection,
        enableFallbackMode,
        fallbackMode,
        systemPrompt,
        setSystemPrompt,
        selectedPromptTemplate,
        setSelectedPromptTemplate,
        promptTemplates,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Mock AI service for fallback mode
class MockAIService implements AIService {
  async chat(message: string): Promise<string> {
    // Return a helpful message about Ollama connection issues
    if (message.toLowerCase().includes('ollama') || 
        message.toLowerCase().includes('connection') || 
        message.toLowerCase().includes('error')) {
      return "I'm currently running in fallback mode because we couldn't connect to Ollama. Please make sure Ollama is installed and running on your system. You can start it by running `ollama serve` in your terminal.";
    }
    
    // Standard response for other inquiries
    return "I'm operating in fallback mode with limited capabilities because we couldn't connect to Ollama. Basic RCA functionality is available, but advanced features like node analysis may not work properly. Please check your Ollama installation and restart the application once Ollama is running.";
  }

  async streamChat(message: string, onChunk: (chunk: string) => void): Promise<void> {
    const response = await this.chat(message);
    
    // Simulate streaming with chunks
    const chunks = response.split(' ');
    for (const word of chunks) {
      onChunk(word + ' ');
      // Add a small delay to simulate streaming
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  }

  async analyzeNodes(nodes: Node[], edges: Edge[]): Promise<string> {
    return "Node analysis is not available in fallback mode. Please connect to Ollama to use this feature.";
  }

  async generateReportFromDiagram(project: Project | null): Promise<string> {
    if (!project) return "No project selected.";
    
    return `# Root Cause Analysis Report (Fallback Mode)

## Executive Summary
This is a simulated report generated in fallback mode due to Ollama connection issues.

## Problem Statement
${project.problemStatement || "No problem statement provided."}

## Findings
To generate a complete report with findings based on your diagram, please ensure Ollama is running and reconnect.

## Recommendations
1. Check that Ollama is installed on your system
2. Run \`ollama serve\` in your terminal
3. Restart this application

Note: This is a placeholder report generated because we couldn't connect to the Ollama API.`;
  }

  async generateSlidesFromReport(project: Project | null): Promise<string> {
    if (!project) return "No project selected.";
    
    return `# Root Cause Analysis Findings
(Fallback Mode)

---

# Problem
${project.problemStatement || "No problem statement provided."}

---

# Connection Issue
Unable to connect to Ollama API

---

# How to Resolve
1. Install Ollama if not already installed
2. Run \`ollama serve\` in your terminal
3. Restart this application

---

# Questions?
`;
  }

  async searchEvidence(query: string): Promise<string> {
    return "Evidence search is not available in fallback mode. Please connect to Ollama to use this feature.";
  }
}

// Hook for using the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}; 