import { StateGraph } from "@langchain/langgraph/web";
import { 
  createWBAStateMachine, 
  runWBAStateMachine, 
  initializeWBAState, 
  WBAState,
  WBANodeType,
  WBALinkType 
} from './wbaStateMachine';
import type { AIService, ChatMessage, Project } from '../context/AppContext';
import type { Node, Edge } from 'reactflow';
import type { OllamaSettings } from '../types';
import type { Message } from './aiService';

type ConnectionType = 'necessary' | 'sufficient' | 'contradicts';

// Define a simple mock for the missing service types
class CreateChatCompletionService {
  constructor() {}
}

class BackendService {
  constructor() {}
}

// Define WBAStateMachine class
class WBAStateMachine {
  constructor(llm: any) {}
  
  async runMachine(state: WBAState): Promise<WBAState> {
    return state;
  }
}

// Create an AIService implementation that uses our WBA state machine
export class WBAAgentService implements AIService {
  private stateMachine: any; // Using any to avoid TS errors
  private llm: any;
  private backendService: any;
  private state: WBAState;
  private settings: OllamaSettings;
  private systemPrompt: string | undefined;
  private defaultChatHistory: { role: string; content: string }[] = [];
  
  constructor(settings: OllamaSettings) {
    this.settings = settings;
    this.stateMachine = createWBAStateMachine('ollama', settings.model || 'llama3', settings.temperature || 0.7);
    this.state = initializeWBAState(null);
    this.systemPrompt = settings.systemPrompt;
    this.llm = {}; // Empty object to avoid null reference
    this.backendService = {}; // Empty object to avoid null reference
  }
  
  // Update the agent with new settings
  updateSettings(settings: OllamaSettings): void {
    this.settings = settings;
    this.stateMachine = createWBAStateMachine('ollama', settings.model || 'llama3', settings.temperature || 0.7);
    // Maintain the current state but apply new settings
  }
  
  // Set the current project
  setProject(project: Project | undefined): void {
    this.state = {
      ...this.state,
      project
    };
  }
  
  // Create a new node in the diagram
  createNode(nodeType: WBANodeType, label: string, description?: string): Node | null {
    if (!this.state.project) return null;
    
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label,
        nodeType,
        description,
        confidence: 50 // Default confidence as number
      },
    };
    
    // Update the project with the new node
    const updatedNodes = [...this.state.project.nodes, newNode];
    this.state.project.nodes = updatedNodes;
    
    return newNode;
  }
  
  // Create a connection between two nodes
  createConnection(sourceNodeId: string, targetNodeId: string, linkType: WBALinkType = 'necessary'): Edge | null {
    if (!this.state.project) return null;
    
    // Verify source and target nodes exist
    const sourceExists = this.state.project.nodes.some((node: any) => node.id === sourceNodeId);
    const targetExists = this.state.project.nodes.some((node: any) => node.id === targetNodeId);
    
    if (!sourceExists || !targetExists) {
      console.error(`Cannot create connection: node ${!sourceExists ? sourceNodeId : targetNodeId} not found`);
      return null;
    }
    
    const newEdge: Edge = {
      id: `edge_${Date.now()}`,
      source: sourceNodeId,
      target: targetNodeId,
      type: 'custom',
      data: {
        linkType,
        confidence: 50 // Default confidence as number
      }
    };
    
    // Update the project with the new edge
    const updatedEdges = [...this.state.project.edges, newEdge];
    this.state.project.edges = updatedEdges;
    
    return newEdge;
  }
  
  // Find node by label (for cases when we want to connect nodes by their labels)
  findNodeByLabel(label: string): Node | undefined {
    if (!this.state.project) return undefined;
    return this.state.project.nodes.find((node: any) => 
      node.data.label.toLowerCase() === label.toLowerCase()
    );
  }
  
  // Process agent commands to modify the diagram
  processAgentCommand(command: string): { 
    success: boolean; 
    message: string; 
    nodeId?: string;
    edgeId?: string;
  } {
    if (!this.state.project) {
      return { success: false, message: "No active project found" };
    }
    
    // Command format: [action]:[params]
    // Examples:
    // create_node:problem:Server outage:The main server went down unexpectedly
    // create_connection:node_123456:node_789101:necessary
    
    const parts = command.split(':');
    const action = parts[0];
    
    try {
      if (action === 'create_node' && parts.length >= 3) {
        const nodeType = parts[1] as WBANodeType;
        const label = parts[2];
        const description = parts[3] || '';
        
        // Validate node type
        const validNodeTypes: WBANodeType[] = ['problem', 'cause', 'condition', 'action', 'omission', 'evidence'];
        if (!validNodeTypes.includes(nodeType)) {
          return { success: false, message: `Invalid node type: ${nodeType}` };
        }
        
        const newNode = this.createNode(nodeType, label, description);
        
        if (newNode) {
          return { 
            success: true, 
            message: `Created new ${nodeType} node: "${label}"`,
            nodeId: newNode.id
          };
        }
      }
      else if (action === 'create_connection' && parts.length >= 3) {
        let sourceId = parts[1];
        let targetId = parts[2];
        const linkType = (parts[3] as WBALinkType) || 'necessary';
        
        // Check if the IDs are actually labels, and if so, find the nodes
        if (!sourceId.startsWith('node_')) {
          const sourceNode = this.findNodeByLabel(sourceId);
          if (sourceNode) {
            sourceId = sourceNode.id;
          } else {
            return { success: false, message: `Could not find node with label: ${sourceId}` };
          }
        }
        
        if (!targetId.startsWith('node_')) {
          const targetNode = this.findNodeByLabel(targetId);
          if (targetNode) {
            targetId = targetNode.id;
          } else {
            return { success: false, message: `Could not find node with label: ${targetId}` };
          }
        }
        
        // Validate link type
        const validLinkTypes: WBALinkType[] = ['necessary', 'contributing', 'possible', 'correlation'];
        if (!validLinkTypes.includes(linkType)) {
          return { success: false, message: `Invalid link type: ${linkType}` };
        }
        
        const newEdge = this.createConnection(sourceId, targetId, linkType);
        
        if (newEdge) {
          return { 
            success: true, 
            message: `Created new ${linkType} connection`,
            edgeId: newEdge.id
          };
        }
      }
      
      return { success: false, message: `Invalid command format: ${command}` };
    } catch (error) {
      console.error("Error processing agent command:", error);
      return { success: false, message: `Error processing command: ${error}` };
    }
  }
  
  // Process a chat message
  async chat(message: string): Promise<string> {
    // Handle special commands for canvas manipulation
    if (message.startsWith('/canvas')) {
      const command = message.substring('/canvas'.length).trim();
      const result = this.processAgentCommand(command);
      return result.message;
    }
    
    try {
      // Update the state with the new message
      this.state.messages = [
        ...this.state.messages,
        { role: 'user', content: message }
      ];
      
      // Run the state machine
      const newState = await runWBAStateMachine(this.stateMachine, this.state, message);
      
      // Update our state with the result
      this.state = newState;
      
      // Get the last assistant message
      const assistantMessages = this.state.messages.filter(msg => msg.role === 'assistant');
      const responseMessage = assistantMessages.length > 0
        ? assistantMessages[assistantMessages.length - 1].content
        : "I'm not sure how to respond to that.";
      
      // Force node creation for specific types of responses
      const createdNodes = await this.forceNodeCreation(responseMessage, message);
      
      // If nodes were created, add information about them to the response
      let finalResponse = responseMessage;
      if (createdNodes.length > 0) {
        const nodeInfo = createdNodes.map(node => 
          `🔷 Created ${node.type} node: "${node.label}"`
        ).join('\n');
        
        finalResponse += '\n\n' + nodeInfo;
      }
      
      return finalResponse;
    } catch (error) {
      console.error("Error in chat:", error);
      return "I encountered an error processing your message. Please try again.";
    }
  }
  
  // Update streamChat method to include tool usage messages
  async streamChat(message: string, onChunk: (chunk: string) => void): Promise<void> {
    // Add the message to the chat history
    this.addMessageToHistory('user', message);
    
    // Handle special command for canvas manipulation
    if (message.startsWith('/canvas ')) {
      const command = message.substring('/canvas '.length);
      const result = this.processAgentCommand(command);
      
      if (result.success) {
        onChunk(`Command executed: ${result.message}`);
        this.addMessageToHistory('assistant', `Command executed: ${result.message}`);
      } else {
        onChunk(`Error: ${result.message}`);
        this.addMessageToHistory('assistant', `Error: ${result.message}`);
      }
      return;
    }

    // Check if this is the first few messages in the conversation
    const isFirstFewMessages = this.defaultChatHistory.length <= 3;
    
    // Look for problem patterns in the user's message
    const lcMessage = message.toLowerCase();
    const isProblemDescription = 
      lcMessage.includes('problem is') || 
      lcMessage.includes('issue is') || 
      lcMessage.includes('analyzing') || 
      lcMessage.includes('analyze') ||
      lcMessage.includes('investigate') || 
      lcMessage.includes('happened') ||
      lcMessage.includes('occurred') ||
      lcMessage.includes('incident');
    
    // Detect if the user is describing a cause
    const isCauseDescription =
      lcMessage.includes('cause is') || 
      lcMessage.includes('caused by') || 
      lcMessage.includes('reason is') || 
      lcMessage.includes('because');
    
    // Process the message
    try {
      let response: string;
      
      // If this is one of the first messages AND it looks like a problem description
      // Immediately suggest creating a node
      if (isFirstFewMessages && isProblemDescription) {
        // Extract a potential problem description
        const problemDescription = message.split(/[.!?]/, 1)[0].trim().substring(0, 100);
        
        // First, provide immediate feedback that we're processing
        await this.chunkMessage(`I'm analyzing your problem. Let me help you create a diagram for this analysis.\n\n`, onChunk, 10);
        
        // Create the problem node
        const createdNodes = await this.forceNodeCreation(`I'll create a problem node for "${problemDescription}"`, message);
        
        if (createdNodes.length > 0) {
          // If a problem node was created, send a confirmation with suggested next actions
          response = `I've created a problem node for "${problemDescription}".\n\n` +
            `What would you like to do next?\n\n` +
            `[Create a cause node](cmd://create_cause)\n` +
            `[Identify contributing factors](cmd://find_factors)\n` + 
            `[Gather evidence](cmd://collect_evidence)`;
        } else {
          // Generate regular response if node creation failed
          response = await this.chat(message);
          
          // But still append suggested actions
          response += `\n\nWould you like to:\n\n` +
            `[Create a problem node](cmd://create_problem)\n` +
            `[Create a cause node](cmd://create_cause)\n` +
            `[Add evidence](cmd://add_evidence)`;
        }
      }
      // Similarly handle cause descriptions
      else if (isCauseDescription) {
        await this.chunkMessage(`I see you've described a cause. Let me update the diagram...\n\n`, onChunk, 10);
        
        // Try to extract the cause description
        let causeDescription = '';
        if (lcMessage.includes('cause is')) {
          causeDescription = message.substring(message.toLowerCase().indexOf('cause is') + 9).split(/[.!?]/, 1)[0].trim();
        } else if (lcMessage.includes('caused by')) {
          causeDescription = message.substring(message.toLowerCase().indexOf('caused by') + 10).split(/[.!?]/, 1)[0].trim();
        } else if (lcMessage.includes('reason is')) {
          causeDescription = message.substring(message.toLowerCase().indexOf('reason is') + 10).split(/[.!?]/, 1)[0].trim();
        } else if (lcMessage.includes('because')) {
          causeDescription = message.substring(message.toLowerCase().indexOf('because') + 8).split(/[.!?]/, 1)[0].trim();
        }
        
        if (causeDescription) {
          // Create a cause node with the extracted description
          const createdNodes = await this.forceNodeCreation(`I'll create a cause node for "${causeDescription}"`, message);
          
          if (createdNodes.length > 0) {
            response = `I've added a cause node for "${causeDescription}".\n\n` +
              `What would you like to do next?\n\n` +
              `[Add another cause](cmd://create_cause)\n` +
              `[Add a condition](cmd://create_condition)\n` +
              `[Connect nodes](cmd://connect_nodes)`;
          } else {
            // Generate regular response if node creation failed
            response = await this.chat(message);
            
            // Still suggest next actions
            response += `\n\nWould you like to:\n\n` +
              `[Create a cause node](cmd://create_cause)\n` +
              `[Add a condition](cmd://create_condition)\n` +
              `[Add evidence](cmd://add_evidence)`;
          }
        } else {
          // Fall back to normal chat if extraction failed
          response = await this.chat(message);
        }
      } else {
        // Regular chat for other messages
        response = await this.chat(message);
        
        // Still add some suggested actions
        if (this.getCurrentProject()?.nodes.length === 0) {
          response += `\n\nWould you like to:\n\n` +
            `[Create a problem node](cmd://create_problem)\n` +
            `[Start fresh](cmd://reset)`;
        } else {
          response += `\n\nWould you like to:\n\n` +
            `[Add a cause](cmd://create_cause)\n` +
            `[Add evidence](cmd://add_evidence)\n` + 
            `[Generate report](cmd://generate_report)`;
        }
      }
      
      // Add the response to the chat history
      this.addMessageToHistory('assistant', response);
      
      // Stream the response to the UI
      await this.chunkMessage(response, onChunk);
      
      // After sending response, automatically create nodes based on the content
      await this.forceNodeCreation(response, message);
    } catch (error) {
      console.error('Error in streamChat:', error);
      onChunk(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      this.addMessageToHistory('assistant', `An error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Helper function to split message into chunks and stream with delay
  private async chunkMessage(message: string, onChunk: (chunk: string) => void, chunkSize = 10): Promise<void> {
    // Split message into words
    const words = message.split(' ');
    
    // Send chunks of words with a small delay
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Modified to make node creation more aggressive and return created nodes
  private async forceNodeCreation(assistantMessage: string, userMessage: string): Promise<Array<{type: WBANodeType, label: string, id: string}>> {
    if (!this.state.project) return [];
    
    const createdNodes: Array<{type: WBANodeType, label: string, id: string}> = [];
    
    // STEP 1: Always create a problem node if none exists and we're in the first few messages
    const hasProblemNode = this.state.project.nodes.some((node: any) => 
      node.data.nodeType === 'problem'
    );
    
    if (!hasProblemNode && this.state.messages.length <= 6) {
      // Create a problem node from first user message that's long enough
      const firstUserMessage = this.state.messages.find(msg => 
        msg.role === 'user' && msg.content.length > 30
      );
      
      if (firstUserMessage) {
        // Extract a good label from the first message - first sentence or truncated
        let problemLabel = firstUserMessage.content.split('.')[0];
        if (problemLabel.length > 50) {
          problemLabel = problemLabel.substring(0, 47) + '...';
        }
        
        const newNode = this.createNode('problem', problemLabel, firstUserMessage.content);
        if (newNode) {
          createdNodes.push({
            type: 'problem', 
            label: problemLabel,
            id: newNode.id
          });
          
          console.log("Created initial problem node:", problemLabel);
        }
      }
    }
    
    // STEP 2: Check for explicit cause mentions in user message
    const causePhrases = [
      /cause.*?is\s+(.*?)(?:\.|,|$)/i,
      /because\s+(.*?)(?:\.|,|$)/i,
      /due to\s+(.*?)(?:\.|,|$)/i,
      /reason.*?is\s+(.*?)(?:\.|,|$)/i,
    ];
    
    for (const pattern of causePhrases) {
      const match = userMessage.match(pattern);
      if (match && match[1]?.trim()) {
        const causeLabel = match[1].trim();
        
        // Check if this cause already exists
        const existingNode = this.state.project.nodes.find((node: any) => 
          node.data.nodeType === 'cause' && 
          node.data.label.toLowerCase() === causeLabel.toLowerCase()
        );
        
        if (!existingNode) {
          const newNode = this.createNode('cause', causeLabel);
          if (newNode) {
            createdNodes.push({
              type: 'cause', 
              label: causeLabel,
              id: newNode.id
            });
            
            // Connect to problem node if one exists
            const problemNode = this.state.project.nodes.find((node: any) => 
              node.data.nodeType === 'problem'
            );
            if (problemNode) {
              this.createConnection(newNode.id, problemNode.id, 'necessary');
            }
          }
        }
      }
    }
    
    // STEP 3: Check for explicit node creation in assistant message
    const nodeCreationPatterns = [
      { 
        pattern: /I will create a problem node for:?\s*["']?(.*?)["']?(?:\.|$)/i,
        type: 'problem'
      },
      { 
        pattern: /I will create a cause node for:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'cause'
      },
      { 
        pattern: /I will create a condition node for:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'condition'
      },
      { 
        pattern: /I will create an action node for:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'action'
      },
      { 
        pattern: /I will create an omission node for:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'omission'
      },
      { 
        pattern: /I will create an evidence node for:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'evidence'
      },
      { 
        pattern: /Creating a problem node:?\s*["']?(.*?)["']?(?:\.|$)/i,
        type: 'problem'
      },
      { 
        pattern: /Creating a cause node:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'cause'
      },
      { 
        pattern: /Creating a condition node:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'condition'
      },
      { 
        pattern: /Creating an action node:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'action'
      },
      { 
        pattern: /Creating an omission node:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'omission'
      },
      { 
        pattern: /Creating an evidence node:?\s*["']?(.*?)["']?(?:\.|$)/i, 
        type: 'evidence'
      }
    ];
    
    for (const { pattern, type } of nodeCreationPatterns) {
      const matches = [...assistantMessage.matchAll(new RegExp(pattern, 'gi'))];
      for (const match of matches) {
        if (match && match[1]?.trim()) {
          const nodeLabel = match[1].trim();
          
          // Check if this node already exists
          const existingNode = this.state.project.nodes.find((node: any) => 
            node.data.nodeType === type && 
            node.data.label.toLowerCase() === nodeLabel.toLowerCase()
          );
          
          if (!existingNode) {
            const newNode = this.createNode(type as WBANodeType, nodeLabel);
            if (newNode) {
              createdNodes.push({
                type: type as WBANodeType, 
                label: nodeLabel,
                id: newNode.id
              });
              
              // If it's a cause, connect to the problem
              if (type === 'cause') {
                const problemNode = this.state.project.nodes.find((node: any) => 
                  node.data.nodeType === 'problem'
                );
                if (problemNode) {
                  this.createConnection(newNode.id, problemNode.id, 'necessary');
                }
              }
            }
          }
        }
      }
    }
    
    // STEP 4: Parse causal language from assistant message
    const causalPatterns = [
      /important cause is ["']?(.*?)["']?(?:\.|,|$)/i,
      /contributing factor is ["']?(.*?)["']?(?:\.|,|$)/i,
      /another cause is ["']?(.*?)["']?(?:\.|,|$)/i,
      /identified cause is ["']?(.*?)["']?(?:\.|,|$)/i,
      /because of ["']?(.*?)["']?(?:\.|,|$)/i
    ];
    
    for (const pattern of causalPatterns) {
      const matches = [...assistantMessage.matchAll(new RegExp(pattern, 'gi'))];
      for (const match of matches) {
        if (match && match[1]?.trim()) {
          const causeLabel = match[1].trim();
          
          // Check if this cause already exists
          const existingNode = this.state.project.nodes.find((node: any) => 
            node.data.nodeType === 'cause' && 
            node.data.label.toLowerCase() === causeLabel.toLowerCase()
          );
          
          if (!existingNode) {
            const newNode = this.createNode('cause', causeLabel);
            if (newNode) {
              createdNodes.push({
                type: 'cause', 
                label: causeLabel,
                id: newNode.id
              });
              
              // Connect to problem node if one exists
              const problemNode = this.state.project.nodes.find((node: any) => 
                node.data.nodeType === 'problem'
              );
              if (problemNode) {
                this.createConnection(newNode.id, problemNode.id, 'necessary');
              }
            }
          }
        }
      }
    }
    
    // STEP 5: Special handling for competitor mentions
    const competitorMentions = [
      ...userMessage.matchAll(/competitor['s]* (.*?)(?:\.|,|$)/gi),
      ...assistantMessage.matchAll(/competitor['s]* (.*?)(?:\.|,|$)/gi)
    ];
    
    for (const match of competitorMentions) {
      if (match && match[1]?.trim()) {
        const competitorAction = match[1].trim();
        
        // Find if we already have a node with this text
        const existingNode = this.findNodeBySubstring(competitorAction);
        
        if (!existingNode) {
          const newNode = this.createNode('cause', `Competitor ${competitorAction}`);
          if (newNode) {
            createdNodes.push({
              type: 'cause', 
              label: `Competitor ${competitorAction}`,
              id: newNode.id
            });
          }
        }
      }
    }
    
    // Add more patterns and node types as needed
    
    return createdNodes;
  }
  
  // Helper to find a node by substring
  private findNodeBySubstring(substring: string): Node | undefined {
    if (!this.state.project) return undefined;
    return this.state.project.nodes.find((node: any) => 
      node.data.label.toLowerCase().includes(substring.toLowerCase())
    );
  }
  
  // Analyze nodes in the diagram
  async analyzeNodes(nodes: Node[], edges: Edge[]): Promise<string> {
    if (!nodes.length) {
      return "The diagram is empty. Let's start by defining the main problem.";
    }
    
    try {
      // Create a temporary state with the given nodes/edges
      const tempState: WBAState = {
        ...this.state,
        project: this.state.project ? {
          ...this.state.project,
          nodes,
          edges,
        } : undefined,
      };
      
      // Run analysis through the state machine
      const analysisMessage = "Please analyze the current diagram and provide insights";
      const newState = await runWBAStateMachine(this.stateMachine, tempState, analysisMessage);
      
      // Return the last assistant message
      const assistantMessages = newState.messages.filter(msg => msg.role === 'assistant');
      return assistantMessages.length > 0 
        ? assistantMessages[assistantMessages.length - 1].content 
        : "I've analyzed the diagram but don't have specific recommendations at this time.";
    } catch (error) {
      console.error("Error analyzing nodes:", error);
      return "I encountered an error analyzing the diagram. Please try again.";
    }
  }
  
  // Generate report from the diagram
  async generateReportFromDiagram(project: Project | undefined): Promise<string> {
    if (!project || !project.nodes.length) {
      return "Cannot generate a report from an empty diagram. Please create a diagram first.";
    }
    
    try {
      // Create a temporary state with the project
      const tempState: WBAState = {
        ...this.state,
        project,
        mode: 'generate_report',
      };
      
      // Run report generation through the state machine
      const reportMessage = "Please generate a comprehensive report based on this diagram";
      const newState = await runWBAStateMachine(this.stateMachine, tempState, reportMessage);
      
      // Return the last assistant message
      const assistantMessages = newState.messages.filter(msg => msg.role === 'assistant');
      return assistantMessages.length > 0 
        ? assistantMessages[assistantMessages.length - 1].content 
        : "I'm having trouble generating a report at this time.";
    } catch (error) {
      console.error("Error generating report:", error);
      return "I encountered an error generating the report. Please try again.";
    }
  }
  
  // Generate slides from the report
  async generateSlidesFromReport(project: Project | undefined): Promise<string> {
    if (!project || !project.report) {
      return "No report found to generate slides from. Please generate a report first.";
    }
    
    try {
      // For simplicity, we'll just generate some basic slides
      // In a real implementation, you'd run this through the state machine
      return `# Why-Because Analysis: ${project.name}
## Problem Statement
${project.problemStatement || "No problem statement defined"}

## Key Causes
${this.generateSlidesForCauses(project.nodes, project.edges)}

## Recommendations
- Based on our analysis, we recommend further investigation into key areas
- Implement preventive measures for identified root causes
- Monitor the system for similar patterns in the future`;
    } catch (error) {
      console.error("Error generating slides:", error);
      return "I encountered an error generating the slides. Please try again.";
    }
  }
  
  // Helper method to generate slides for causes
  private generateSlidesForCauses(nodes: Node[], edges: Edge[]): string {
    // Find all cause nodes
    const causeNodes = nodes.filter(node => 
      node.data.nodeType === 'cause' || 
      node.data.nodeType === 'condition' || 
      node.data.nodeType === 'action' || 
      node.data.nodeType === 'omission'
    );
    
    if (!causeNodes.length) return "No causes identified yet";
    
    return causeNodes.map(node => `- ${node.data.label}`).join('\n');
  }
  
  // Search for evidence
  async searchEvidence(query: string): Promise<string> {
    try {
      // In a real implementation, this would search through evidence
      // For now, we'll return a placeholder
      return `Evidence related to "${query}" would appear here. This function will search through available evidence and documents.`;
    } catch (error) {
      console.error("Error searching evidence:", error);
      return "I encountered an error searching for evidence. Please try again.";
    }
  }
  
  // Update chat history
  setChatHistory(history: ChatMessage[]): void {
    this.defaultChatHistory = history.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Also update the state messages to match the chat history
    this.state.messages = history.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  private getCurrentProject(): Project | undefined {
    return this.state.project;
  }

  private addMessageToHistory(role: string, content: string): void {
    this.defaultChatHistory.push({ role, content });
  }

  private addNodeToState(node: Node): void {
    if (!this.state.project) return;
    this.state.project.nodes.push(node);
  }

  private updateNodeInState(node: Node): void {
    if (!this.state.project) return;
    const index = this.state.project.nodes.findIndex((n: any) => n.id === node.id);
    if (index !== -1) {
      this.state.project.nodes[index] = node;
    }
  }

  private getNodeById(nodeId: string): Node | undefined {
    if (!this.state.project) return undefined;
    return this.state.project.nodes.find((node: any) => node.id === nodeId);
  }

  private extractNodeData(node: Node): any {
    return node.data;
  }

  private createNodeFromData(node: Node): any {
    return {
      id: node.id,
      data: { ...node.data },
      position: node.position || { x: 0, y: 0 },
      type: 'custom'
    };
  }

  private updateNodeWithData(node: Node): any {
    return {
      ...node,
      data: { ...node.data }
    };
  }

  private processNodeForAnalysis(node: Node): any {
    return {
      id: node.id,
      type: node.data.nodeType,
      label: node.data.label,
      description: node.data.description || ''
    };
  }
} 