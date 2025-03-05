import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  ReactFlowInstance
} from 'reactflow';
import { useAppContext } from './AppContext';
import { WBANodeType, WBALinkType } from '../utils/wbaStateMachine';
import { WBAAgentService } from '../utils/wbaAgentService';

// Define the context type
interface CanvasContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  handleAddNode: (nodeData: any) => Node | null;
  handleNodeTypeChange: (nodeId: string, newType: WBANodeType) => void;
  selectedNode: Node | null;
  setSelectedNode: (node: Node | null) => void;
  reactFlowInstance: ReactFlowInstance | null;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;
  selectedEdgeType: WBALinkType;
  setSelectedEdgeType: (type: WBALinkType) => void;
  currentProject: any;
}

// Create the context
const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

// Create the provider component
export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentProject, setCurrentProject, saveProject, aiService, createNewProject } = useAppContext();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState<WBALinkType>('necessary');

  // Update nodes and edges when current project changes
  useEffect(() => {
    if (currentProject) {
      setNodes(currentProject.nodes);
      setEdges(currentProject.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [currentProject]);

  // Handle node changes (including position changes from dragging)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes to local state
      const updatedNodes = applyNodeChanges(changes, nodes);
      setNodes(updatedNodes);
      
      // Update project with new node positions
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          nodes: updatedNodes
        };
        
        // Only save if there are position changes (to avoid unnecessary saves)
        const hasPositionChanges = changes.some(change => 
          change.type === 'position' && change.position
        );
        
        if (hasPositionChanges) {
          saveProject(updatedProject);
        }
      }
    },
    [nodes, currentProject, saveProject]
  );

  // Handle edge changes
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const updatedEdges = applyEdgeChanges(changes, edges);
      setEdges(updatedEdges);
      
      if (currentProject) {
        saveProject({
          ...currentProject,
          edges: updatedEdges
        });
      }
    },
    [edges, currentProject, saveProject]
  );

  // Handle connecting nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!currentProject) return;
      
      const newEdge: Edge = {
        ...connection,
        id: `e${Date.now()}`,
        source: connection.source || '',
        target: connection.target || '',
        type: 'custom',
        data: {
          linkType: selectedEdgeType,
          confidence: 'medium'
        }
      };
      
      const newEdges = addEdge(newEdge, edges);
      setEdges(newEdges);
      
      saveProject({
        ...currentProject,
        edges: newEdges
      });
    },
    [currentProject, edges, selectedEdgeType, saveProject]
  );

  // Handle adding a new node
  const handleAddNode = useCallback(
    (nodeData: any) => {
      if (!currentProject) {
        // Create a new project instead of showing an error
        const newProject = createNewProject("Untitled Analysis", "Created from adding a node");
        
        // Create the node in the new project
        const newNode: Node = {
          id: `node_${Date.now()}`,
          type: nodeData.type || 'customNode',
          position: nodeData.position || { 
            x: Math.random() * 300 + 100, 
            y: Math.random() * 300 + 100 
          },
          data: nodeData.data || { 
            label: 'New Node',
            nodeType: 'problem',
            description: ''
          },
        };
        
        // Update the new project with the node
        const updatedProject = {
          ...newProject,
          nodes: [newNode]
        };
        
        // Set and save the new project
        setCurrentProject(updatedProject);
        saveProject(updatedProject);
        
        // Select the new node
        setSelectedNode(newNode);
        
        // Update the agent with the new project if it exists 
        // and has the setProject method
        if (aiService) {
          // First set the project if the method exists
          if ('setProject' in aiService) {
            (aiService as WBAAgentService).setProject(updatedProject);
          }
          
          // Then reset the chat history if that method exists
          if ('setChatHistory' in aiService) {
            (aiService as any).setChatHistory([]);
          }
        }
        
        return newNode;
      }
      
      // Rest of the function for when a project already exists
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: nodeData.type || 'customNode',
        position: nodeData.position || { 
          x: Math.random() * 300 + 100, 
          y: Math.random() * 300 + 100 
        },
        data: nodeData.data || { 
          label: 'New Node',
          nodeType: 'problem',
          description: ''
        },
      };
      
      // Update project with the new node
      const updatedNodes = [...currentProject.nodes, newNode];
      const updatedProject = {
        ...currentProject,
        nodes: updatedNodes
      };
      
      setNodes(updatedNodes);
      setCurrentProject(updatedProject);
      
      // Save the updated project
      saveProject(updatedProject);
      
      // Select the new node
      setSelectedNode(newNode);
      
      // Also update the WBA agent with the updated project
      if (aiService) {
        // Only call setProject if it exists
        if ('setProject' in aiService) {
          (aiService as WBAAgentService).setProject(updatedProject);
        }
      }
      
      return newNode;
    },
    [currentProject, aiService, createNewProject, setCurrentProject, saveProject]
  );

  // Handle changing a node's type
  const handleNodeTypeChange = useCallback(
    (nodeId: string, newType: WBANodeType) => {
      if (!currentProject) return;
      
      const updatedNodes = nodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              nodeType: newType
            }
          };
        }
        return node;
      });
      
      setNodes(updatedNodes);
      
      const updatedProject = {
        ...currentProject,
        nodes: updatedNodes
      };
      
      setCurrentProject(updatedProject);
      saveProject(updatedProject);
    },
    [currentProject, nodes, setCurrentProject, saveProject]
  );

  return (
    <CanvasContext.Provider
      value={{
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        handleAddNode,
        handleNodeTypeChange,
        selectedNode,
        setSelectedNode,
        reactFlowInstance,
        setReactFlowInstance,
        selectedEdgeType,
        setSelectedEdgeType,
        currentProject
      }}
    >
      {children}
    </CanvasContext.Provider>
  );
};

// Hook for using the context
export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}; 