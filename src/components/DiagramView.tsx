import { useState, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  Node, 
  Edge, 
  NodeChange, 
  EdgeChange, 
  Connection, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  ReactFlowProvider,
  ReactFlowInstance
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, Button, IconButton, Tooltip, Divider, TextField, useTheme as useMuiTheme } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CustomNode from './nodes/CustomNode';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../App';

// Define custom node types outside the component
// This prevents the React Flow warning about creating new nodeTypes objects
const nodeTypesMap = {
  custom: CustomNode,
};

// Initial nodes and edges for a simple why-because graph
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 50 },
    data: { label: 'System Outage', nodeType: 'problem' },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: { label: 'Database Connection Pool Exhaustion', nodeType: 'cause' },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { label: 'Memory Leak in Connection Handling', nodeType: 'cause' },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 100, y: 350 },
    data: { label: 'Connection Pool Metrics at 100%', nodeType: 'evidence' },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 400, y: 350 },
    data: { label: 'Memory Usage Increasing Over Time', nodeType: 'evidence' },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  { id: 'e2-4', source: '2', target: '4' },
  { id: 'e3-5', source: '3', target: '5' },
];

// Define empty callback props outside component to prevent recreation
const defaultViewport = { x: 0, y: 0, zoom: 1 };

// Add proOptions for panOnDrag settings
const proOptions = { hideAttribution: false };

const DiagramView = () => {
  const { currentProject, saveProject } = useAppContext();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // Get theme mode and MUI theme for colors
  const { mode } = useTheme();
  const muiTheme = useMuiTheme();

  // Memoize ALL objects and callbacks used in ReactFlow props
  const nodeTypes = useMemo(() => nodeTypesMap, []);
  
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  // Memoize node click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setEditLabel(node.data.label);
      setIsEditing(false);
    },
    []
  );

  // Memoize pane click handler
  const onPaneClick = useCallback(
    () => {
      setSelectedNode(null);
      setIsEditing(false);
    },
    []
  );

  // Memoize other handlers
  const onInit = useCallback(
    (instance: ReactFlowInstance) => setReactFlowInstance(instance),
    []
  );

  // Add new node
  const addNode = (type: 'problem' | 'cause' | 'evidence') => {
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'custom',
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: type === 'problem' 
          ? 'New Problem' 
          : type === 'cause' 
            ? 'New Cause' 
            : 'New Evidence',
        nodeType: type
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setEditLabel(newNode.data.label);
    setIsEditing(true);
  };

  // Update node label
  const updateNodeLabel = () => {
    if (!selectedNode || !editLabel.trim()) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: editLabel.trim(),
            },
          };
        }
        return node;
      })
    );
    
    setIsEditing(false);
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    
    // Remove connected edges
    setEdges((eds) =>
      eds.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    );
    
    // Remove node
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setSelectedNode(null);
  };

  // Save diagram
  const saveDiagram = () => {
    if (!currentProject) return;
    
    saveProject({
      ...currentProject,
      nodes,
      edges,
    });
  };

  // Add memoized fitViewOptions
  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Toolbar */}
      <Paper elevation={0} sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Add Problem">
            <Button 
              variant="outlined" 
              startIcon={<HelpOutlineIcon />}
              size="small"
              onClick={() => addNode('problem')}
              sx={{ borderColor: 'primary.main', color: 'primary.main' }}
            >
              Problem
            </Button>
          </Tooltip>
          
          <Tooltip title="Add Cause">
            <Button 
              variant="outlined" 
              startIcon={<InfoIcon />}
              size="small"
              onClick={() => addNode('cause')}
              sx={{ borderColor: 'secondary.main', color: 'secondary.main' }}
            >
              Cause
            </Button>
          </Tooltip>
          
          <Tooltip title="Add Evidence">
            <Button 
              variant="outlined" 
              startIcon={<LightbulbIcon />}
              size="small"
              onClick={() => addNode('evidence')}
              sx={{ borderColor: 'text.secondary', color: 'text.secondary' }}
            >
              Evidence
            </Button>
          </Tooltip>
        </Box>
        
        {selectedNode && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isEditing ? (
              <>
                <TextField
                  size="small"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && updateNodeLabel()}
                  autoFocus
                  sx={{ width: '300px' }}
                />
                <Button 
                  variant="contained" 
                  size="small"
                  onClick={updateNodeLabel}
                >
                  Save
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Selected: <strong>{selectedNode.data.label}</strong>
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => setIsEditing(true)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={deleteSelectedNode}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
          </Box>
        )}
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="contained" 
            size="small"
            onClick={saveDiagram}
            disabled={!currentProject}
          >
            Save Diagram
          </Button>
        </Box>
      </Paper>
      
      {/* ReactFlow Canvas */}
      <Box sx={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onInit={onInit}
            nodeTypes={nodeTypes}
            defaultViewport={defaultViewport}
            fitViewOptions={fitViewOptions}
            proOptions={proOptions}
            fitView
            attributionPosition="bottom-right"
            className={mode === 'dark' ? 'react-flow-dark-mode' : ''}
          >
            <Controls 
              position="bottom-right"
              showInteractive={false}
            />
            <MiniMap 
              nodeStrokeWidth={3}
              zoomable
              pannable
              className={mode === 'dark' ? 'react-flow-dark-mode' : ''}
            />
            <Background 
              color={mode === 'dark' ? muiTheme.palette.divider : '#e2e8f0'} 
              gap={16} 
              size={1}
            />
          </ReactFlow>
        </ReactFlowProvider>
        
        {/* Zoom controls */}
        <Paper
          elevation={1}
          sx={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '8px',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <IconButton size="small" sx={{ p: 1, color: 'text.primary' }}>
            <ZoomInIcon fontSize="small" />
          </IconButton>
          <Divider />
          <IconButton size="small" sx={{ p: 1, color: 'text.primary' }}>
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Divider />
          <IconButton size="small" sx={{ p: 1, color: 'text.primary' }}>
            <FitScreenIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Box>
    </Box>
  );
};

export default DiagramView; 