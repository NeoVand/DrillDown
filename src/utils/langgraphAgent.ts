import { ChatOllama } from '@langchain/ollama';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import type { Node, Edge } from 'reactflow';
import type { Project } from '../context/AppContext';
import type { Message } from './aiService';

// Define the NodeSuggestion type
interface NodeSuggestion {
  label: string;
  nodeType: 'problem' | 'cause' | 'evidence';
  description?: string;
}

// Define agent modes for context-aware responses
type AgentMode = 'diagram' | 'report' | 'slides' | null;

// Function to create a system prompt based on mode
const getSystemPrompt = (mode: AgentMode): string => {
  const basePrompt = 
    'You are an AI assistant integrated into a Root Cause Analysis (RCA) application called Drill Down. ' +
    'Your role is to help users analyze problems using Why-Because Analysis methodology, ' +
    'identify root causes, and generate comprehensive reports and presentation slides. ';
  
  switch (mode) {
    case 'diagram':
      return basePrompt + 
        'You are currently in DIAGRAM mode. Help the user construct their Why-Because Graph (WBG). ' +
        'Ask clarifying questions about the problem, suggest possible causes, and help them structure ' +
        'their analysis. Remember that in Why-Because Analysis, we establish causal connections between ' +
        'events/states, where every cause must be a necessary factor for the effect. ' +
        'Causes answer "Why did this happen?" and support evidence answers "How do we know?"';
    
    case 'report':
      return basePrompt + 
        'You are currently in REPORT mode. Help the user create a comprehensive RCA report based on their diagram. ' +
        'The report should include an executive summary, problem statement, analysis of causes, supporting evidence, ' +
        'and recommendations. Format your responses in Markdown.';
    
    case 'slides':
      return basePrompt + 
        'You are currently in SLIDES mode. Help the user create executive summary slides based on their report. ' +
        'Focus on clarity, conciseness, and highlighting the most important findings and recommendations. ' +
        'Format your responses in Markdown with "---" separating slides.';
    
    default:
      return basePrompt + 
        'Ask the user which aspect of their RCA they want help with: building their diagram, ' +
        'creating their report, or generating presentation slides.';
  }
};

// Tools for processing diagram data
class DiagramTools {
  static describeDiagram(nodes: Node[], edges: Edge[]): string {
    let description = "Current diagram contains:\n\n";
    
    // Describe nodes
    description += "Nodes:\n";
    nodes.forEach(node => {
      const data = node.data as any;
      description += `- ${node.id}: Type=${data.nodeType}, Label="${data.label}"\n`;
    });
    
    // Describe connections
    description += "\nConnections:\n";
    edges.forEach(edge => {
      description += `- ${edge.source} -> ${edge.target} (${edge.source} causes ${edge.target})\n`;
    });
    
    return description;
  }
}

// Format node and edge information for the LLM context
const formatDiagramContext = (nodes: Node[], edges: Edge[]): string => {
  return DiagramTools.describeDiagram(nodes, edges);
};

// Format report content for the LLM context
const formatReportContext = (report: string | undefined): string => {
  if (!report) return "No report has been created yet.";
  return `Current report content:\n\n${report}`;
};

// Create the RCA agent
export class RCAAgent {
  private model: ChatOllama;
  private chatHistory: (AIMessage | HumanMessage | SystemMessage)[] = [];
  
  constructor(modelName: string, temperature: number = 0.7) {
    // Initialize the model
    this.model = new ChatOllama({
      model: modelName,
      temperature,
    });
  }

  // Convert message format
  private convertMessages(messages: Message[]): (AIMessage | HumanMessage | SystemMessage)[] {
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

  // Process a chat message with context
  async processMessage(
    message: string,
    chatHistory: Message[],
    currentProject: Project | null = null,
    mode: AgentMode = null
  ): Promise<string> {
    try {
      // Set up the system prompt based on mode
      const systemPrompt = getSystemPrompt(mode);
      const systemMessage = new SystemMessage(systemPrompt);
      
      // Convert chat history
      const convertedHistory = this.convertMessages(chatHistory);
      
      // Create context message based on project and mode
      let contextMessage: SystemMessage | null = null;
      
      if (currentProject) {
        if (mode === 'diagram' && currentProject.nodes && currentProject.nodes.length > 0) {
          const diagramContext = formatDiagramContext(currentProject.nodes, currentProject.edges);
          contextMessage = new SystemMessage(`Current diagram context: ${diagramContext}`);
        } else if (mode === 'report' && currentProject.nodes) {
          const diagramContext = formatDiagramContext(currentProject.nodes, currentProject.edges);
          contextMessage = new SystemMessage(`Use this diagram to help create a report: ${diagramContext}`);
        } else if (mode === 'slides' && currentProject.report) {
          contextMessage = new SystemMessage(`Base your slides on this report: ${currentProject.report}`);
        }
      }
      
      // Build the messages array
      const messages: (AIMessage | HumanMessage | SystemMessage)[] = [systemMessage];
      
      // Add context if available
      if (contextMessage) {
        messages.push(contextMessage);
      }
      
      // Add chat history
      messages.push(...convertedHistory);
      
      // Add the current message
      messages.push(new HumanMessage(message));
      
      // Get response from the model
      const response = await this.model.invoke(messages);
      
      return response.content as string;
    } catch (error) {
      console.error("Error in RCA agent:", error);
      return "I encountered an error processing your request. Please try again.";
    }
  }

  // Specialized method for suggesting nodes based on the current diagram
  async suggestNodes(
    userPrompt: string,
    project: Project,
    chatHistory: Message[] = []
  ): Promise<NodeSuggestion[]> {
    if (!project || !project.nodes || !project.edges) {
      return [];
    }

    const diagramDescription = formatDiagramContext(project.nodes, project.edges);
    
    const nodeParser = StructuredOutputParser.fromZodSchema(
      z.array(
        z.object({
          nodeType: z.enum(['problem', 'cause', 'evidence']),
          label: z.string(),
          description: z.string().optional(),
        })
      )
    );
    
    // Build messages including chat history context
    const systemMessage = new SystemMessage(
      `You are an AI assistant helping with Root Cause Analysis. Based on the current diagram and the user's request, suggest new nodes 
      that would enhance the analysis. Format your response exactly according to the specified JSON schema.`
    );
    
    const convertedHistory = this.convertMessages(chatHistory);
    
    const userMessage = new HumanMessage(
      `Current diagram:\n${diagramDescription}\n\nUser request: ${userPrompt}\n\nSuggest nodes that would be helpful to add to this diagram.
      ${nodeParser.getFormatInstructions()}`
    );
    
    const messages = [systemMessage, ...convertedHistory, userMessage];
    
    try {
      const response = await this.model.invoke(messages);
      const parsed = await nodeParser.parse(response.content as string);
      return parsed;
    } catch (error) {
      console.error("Error suggesting nodes:", error);
      return [];
    }
  }

  // Method to generate a report based on the diagram
  async generateReport(
    project: Project,
    chatHistory: Message[] = []
  ): Promise<string> {
    if (!project || !project.nodes || !project.edges) {
      return "Cannot generate a report without a diagram. Please create a diagram first.";
    }
    
    const diagramDescription = formatDiagramContext(project.nodes, project.edges);
    
    // Build messages with chat history context
    const systemMessage = new SystemMessage(
      `You are an AI assistant generating a comprehensive Root Cause Analysis report. 
       Format your response using Markdown with appropriate headers, bullet points, etc.`
    );
    
    const convertedHistory = this.convertMessages(chatHistory);
    
    const userMessage = new HumanMessage(
      `Based on this diagram, generate a full RCA report with the following sections:
       1. Executive Summary
       2. Problem Statement
       3. Analysis of Causes
       4. Supporting Evidence
       5. Recommendations
       6. Conclusion
       
       Diagram description:
       ${diagramDescription}
       
       ${project.problemStatement ? `Additional problem context: ${project.problemStatement}` : ''}
       
       Make the report detailed, professional, and actionable.`
    );
    
    const messages = [systemMessage, ...convertedHistory, userMessage];
    
    try {
      const response = await this.model.invoke(messages);
      return response.content as string;
    } catch (error) {
      console.error("Error generating report:", error);
      return "I encountered an error generating the report. Please try again.";
    }
  }

  // Method to generate slides based on a report
  async generateSlides(
    project: Project,
    chatHistory: Message[] = []
  ): Promise<string> {
    if (!project || !project.report) {
      return "Cannot generate slides without a report. Please create a report first.";
    }
    
    // Build messages with chat history context
    const systemMessage = new SystemMessage(
      `You are an AI assistant creating executive presentation slides based on an RCA report.
       Your slides should be concise, clear, and focused on key findings and recommendations.
       Format your response as a Markdown document with "---" separating each slide.`
    );
    
    const convertedHistory = this.convertMessages(chatHistory);
    
    const userMessage = new HumanMessage(
      `Convert this RCA report into presentation slides (max 7-8 slides):
       
       ${project.report}
       
       Include the following slides:
       - Title slide
       - Problem overview
       - Key causes identified
       - Evidence summary
       - Recommendations
       - Next steps
       
       Format using Markdown with "---" to separate slides.`
    );
    
    const messages = [systemMessage, ...convertedHistory, userMessage];
    
    try {
      const response = await this.model.invoke(messages);
      return response.content as string;
    } catch (error) {
      console.error("Error generating slides:", error);
      return "I encountered an error generating the slides. Please try again.";
    }
  }
}

// Create and export agent factory function
export const createRCAAgent = (modelName: string, temperature: number = 0.7): RCAAgent => {
  return new RCAAgent(modelName, temperature);
}; 