import { ChatOpenAI } from '@langchain/openai';
import { Ollama } from '@langchain/ollama';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../context/AppContext';
import { OllamaSettings } from '../types';

// WBA node types
export type WBANodeType = 'problem' | 'cause' | 'condition' | 'action' | 'omission' | 'evidence';

// Define link types to categorize causal relationships
export type WBALinkType = 'necessary' | 'contributing' | 'possible' | 'correlation';

// Define the state interface
export interface WBAState {
  mode: 'define_problem' | 'elicit_causes' | 'gather_evidence' | 'verify_links' | 'check_sufficiency' | 'generate_report';
  messages: Array<any>;
  currentNode?: string;
  project?: Project;
  uncertainty: number;
  evidenceRequests: Array<string>;
  analysisFlags: {
    needMoreCauses: boolean;
    needMoreEvidence: boolean;
    needLinkVerification: boolean;
    isAnalysisComplete: boolean;
  };
}

// Define the state machine interface
export interface WBAStateMachine {
  modelName: string;
  temperature: number;
  state: WBAState;
  invoke: (input: string) => Promise<WBAState>;
}

/**
 * Create a simplistic state machine for WBA analysis.
 * This is a simplified version that doesn't use langgraph.
 */
export function createWBAStateMachine(modelProvider: string = 'ollama', modelName: string = 'llama3', temperature: number = 0.7): WBAStateMachine {
  // Initialize the state
  const initialState: WBAState = initializeWBAState();
  
  // Create the state machine
  const machine: WBAStateMachine = {
    modelName,
    temperature,
    state: initialState,
    invoke: async (input: string) => {
      try {
        // Update the state with user input
        machine.state.messages.push({
          role: 'user',
          content: input
        });
        
        // Get system prompt based on the current state
        const systemPrompt = getSystemPromptForState(machine.state.mode, machine);
        
        // Prepare the messages for the model
        const messages = [
          new SystemMessage(systemPrompt),
          ...machine.state.messages.map((msg: any) => 
            msg.role === 'user' 
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          )
        ];
        
        // Call the model
        let response;
        
        if (modelProvider === 'ollama') {
          const ollama = new Ollama({
            baseUrl: "http://localhost:11434",
            model: machine.modelName,
            temperature: machine.temperature,
          });
          
          try {
            // For the new @langchain/ollama API
            const result = await ollama.invoke(messages);
            // Ollama returns the response directly as a string
            response = result;
          } catch (error) {
            console.error("Error calling Ollama:", error);
            // Fallback message if the model call fails
            response = "I'm sorry, I encountered an error processing your request. Please try again.";
          }
        } else {
          // Use OpenAI/Azure as fallback
          const model = new ChatOpenAI({
            temperature: machine.temperature,
          });
          
          try {
            const result = await model.invoke(messages);
            response = result.content;
          } catch (error) {
            console.error("Error calling OpenAI:", error);
            // Fallback message if the model call fails
            response = "I'm sorry, I encountered an error processing your request. Please try again.";
          }
        }
        
        // Update state with the assistant's response
        machine.state.messages.push({
          role: 'assistant',
          content: response
        });
        
        // Update other state properties based on the response
        // (In a full implementation, we would analyze the response here)
        
        return machine.state;
      } catch (error) {
        console.error("Error in WBA state machine:", error);
        
        // Update state with error message
        machine.state.messages.push({
          role: 'assistant',
          content: "I'm sorry, I encountered an error processing your request. Please try again."
        });
        
        return machine.state;
      }
    }
  };
  
  return machine;
}

/**
 * Initialize the WBA state.
 */
export function initializeWBAState(project?: Project | null): WBAState {
  return {
    mode: 'define_problem',
    messages: [],
    uncertainty: 0.5,
    evidenceRequests: [],
    analysisFlags: {
      needMoreCauses: true,
      needMoreEvidence: true,
      needLinkVerification: true,
      isAnalysisComplete: false
    },
    project: project || undefined
  };
}

/**
 * Get the system prompt based on the current state.
 */
export function getSystemPromptForState(mode: WBAState['mode'], machine: WBAStateMachine): string {
  // Base prompt that applies to all states
  const basePrompt = `You are an expert in Why-Because Analysis (WBA), a method for investigating incidents and problems by identifying causal relationships.

When creating nodes in the analysis, always use these EXACT phrases:
- "CREATE PROBLEM NODE: [name]" - to create a problem node
- "CREATE CAUSE NODE: [name]" - to create a cause node
- "CREATE CONDITION NODE: [name]" - to create a condition node
- "CREATE ACTION NODE: [name]" - to create an action node
- "CREATE OMISSION NODE: [name]" - to create an omission node (something that didn't happen but should have)
- "CREATE EVIDENCE NODE: [name]" - to create an evidence node

When linking nodes, use the exact phrase:
- "LINK [source node] TO [target node]" - to create a causal relationship between nodes

Keep your responses brief and focus on one aspect at a time. Ask clarifying questions when needed.
Current analysis mode: ${mode}`;

  // Additional instructions based on the current mode
  switch (mode) {
    case 'define_problem':
      return `${basePrompt}
      
Focus on helping the user define the main problem or incident. This should be specific, observable, and well-defined. 
Ask clarifying questions to ensure the problem is properly scoped.
When the problem is clear, create a problem node using the exact phrase "CREATE PROBLEM NODE: [problem statement]".
Then suggest moving to the cause elicitation phase.`;

    case 'elicit_causes':
      return `${basePrompt}
      
Focus on identifying direct causes of the problem or previously identified causes.
For each cause identified, create a cause node using the exact phrase "CREATE CAUSE NODE: [cause statement]".
Ask about conditions that enabled these causes using "CREATE CONDITION NODE: [condition]".
Identify specific actions or omissions using "CREATE ACTION NODE: [action]" or "CREATE OMISSION NODE: [omission]".
Link each cause to the problem or its parent cause with "LINK [cause] TO [problem/parent cause]".
Build the causal chain methodically, one cause at a time.`;

    case 'gather_evidence':
      return `${basePrompt}
      
Focus on gathering evidence for each cause and condition identified.
For each piece of evidence, create an evidence node with "CREATE EVIDENCE NODE: [evidence details]".
Link evidence to the relevant cause or condition with "LINK [evidence] TO [cause/condition]".
Ask questions to elicit specific observations, data, or documentation that supports each causal factor.
Note any evidence that is missing but would be valuable.`;

    case 'verify_links':
      return `${basePrompt}
      
Focus on verifying the causal relationships in the diagram.
For each causal link, assess whether the cause is necessary and sufficient for the effect.
Ensure the necessary condition test is satisfied: "If the cause had not occurred, would the effect have occurred?"
Ensure the sufficient condition test is satisfied: "If the cause occurs, will the effect always occur?"
Suggest removing links that don't satisfy these tests, or adding missing intermediate causes.
Use "LINK [cause] TO [effect]" to clarify or correct relationships.`;

    case 'check_sufficiency':
      return `${basePrompt}
      
Focus on evaluating whether the analysis is complete and sufficient.
Identify any gaps in the causal chain or unexplained aspects of the problem.
Suggest additional causes that might need investigation.
Assess whether the root causes have been identified.
Evaluate whether the evidence adequately supports the identified causes.
Suggest specific improvements to the analysis using the creation and linking phrases.`;

    case 'generate_report':
      return `${basePrompt}
      
Focus on summarizing the completed analysis into a coherent report.
Structure the report with these sections:
1. Problem Description
2. Key Causal Factors
3. Root Causes
4. Evidence Summary
5. Recommendations

For recommendations, suggest specific actions to address the identified causes.
Use bullet points for clarity and keep the report concise but comprehensive.`;

    default:
      return basePrompt;
  }
}

/**
 * Run the WBA state machine.
 */
export async function runWBAStateMachine(machine: WBAStateMachine, state: WBAState, input: string): Promise<WBAState> {
  // Update the machine's state with the current state
  machine.state = state;
  // Invoke the machine with the input
  return await machine.invoke(input);
} 