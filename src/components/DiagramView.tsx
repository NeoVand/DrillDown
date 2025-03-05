import React, { useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import { 
  ReportProblem as ReportIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  FactCheck as FactCheckIcon,
  Block as BlockIcon,
  HelpOutline as HelpOutlineIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Analytics as AnalyticsIcon,
  ArrowRightAlt as ArrowRightAltIcon
} from '@mui/icons-material';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  ReactFlowProvider,
  Panel,
  NodeRemoveChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme as useMuiTheme } from '@mui/material';
import CustomNode from './nodes/CustomNode';
import CustomEdge from './nodes/CustomEdge';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../App';
import { useCanvas } from '../context/CanvasContext';
import { WBANodeType } from '../utils/wbaStateMachine';

// Define custom node types outside the component
// This prevents the React Flow warning about creating new nodeTypes objects
const nodeTypesMap = {
  custom: CustomNode,
  customNode: CustomNode,
};

const edgeTypesMap = {
  custom: CustomEdge,
};

// Add proOptions for panOnDrag settings
const proOptions = { hideAttribution: false };

const DiagramView = () => {
  const { aiService } = useAppContext();
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    handleAddNode, 
    selectedNode, 
    setSelectedNode, 
    reactFlowInstance, 
    setReactFlowInstance, 
    selectedEdgeType, 
    setSelectedEdgeType,
    currentProject
  } = useCanvas();
  
  // Get theme mode and MUI theme for colors
  const { mode } = useTheme();
  const muiTheme = useMuiTheme();

  // Memoize ALL objects and callbacks used in ReactFlow props
  const nodeTypes = useMemo(() => nodeTypesMap, []);
  const edgeTypes = useMemo(() => edgeTypesMap, []);
  
  // Memoize node click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: any) => {
      setSelectedNode(node);
    },
    [setSelectedNode]
  );

  // Memoize pane click handler
  const onPaneClick = useCallback(
    () => {
      setSelectedNode(null);
    },
    [setSelectedNode]
  );

  // Memoize other handlers
  const onInit = useCallback(
    (instance: any) => setReactFlowInstance(instance),
    [setReactFlowInstance]
  );

  // Add a node of specific type
  const addNodeOfType = (type: WBANodeType) => {
    handleAddNode({
      type: 'customNode',
      position: { 
        x: Math.random() * 300 + 100, 
        y: Math.random() * 300 + 100 
      },
      data: { 
        label: type === 'problem' 
          ? 'New Problem' 
          : type === 'cause' 
            ? 'New Cause' 
            : type === 'condition'
              ? 'New Condition'
              : type === 'action'
                ? 'New Action'
                : type === 'omission'
                  ? 'New Omission'
                  : 'New Evidence',
        nodeType: type,
        description: ''
      }
    });
  };

  // Delete selected node
  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    
    // Remove the node using the canvas context
    const changes: NodeRemoveChange[] = [{ 
      type: 'remove', 
      id: selectedNode.id 
    }];
    
    onNodesChange(changes);
    
    // Clear selection
    setSelectedNode(null);
  };

  // Save diagram
  const saveDiagram = () => {
    if (!currentProject) return;
    
    // The canvas context already handles saving, so this is just a placeholder
    console.log("Diagram saved");
  };

  // Add memoized fitViewOptions
  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);

  const analyzeWithWBA = async () => {
    if (!aiService || !currentProject) return;
    
    try {
      const analysis = await aiService.analyzeNodes(nodes, edges);
      
      console.log("WBA Analysis:", analysis);
      
      alert("Analysis complete. Check the chat for insights.");
    } catch (error) {
      console.error("Error analyzing with WBA:", error);
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        width: '100%',
        position: 'relative',
        bgcolor: mode === 'dark' ? 'background.default' : '#f5f5f5', // Light gray background in light mode
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onInit}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        proOptions={proOptions}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background />
        <Controls position="bottom-right" />
        
        {/* Consolidated toolbar */}
        <Panel position="top-center">
          <Paper
            elevation={3}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: mode === 'dark' 
                ? muiTheme.palette.background.paper 
                : muiTheme.palette.common.white,
              border: '1px solid',
              borderColor: mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.12)' 
                : 'rgba(0, 0, 0, 0.12)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1,
              mb: 1
            }}
          >
            {/* Node creation buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 'medium' }}>
                Add:
              </Typography>
              
              <Tooltip title="Add Problem Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('problem')}
                  sx={{ 
                    color: muiTheme.palette.primary.main,
                    bgcolor: muiTheme.palette.primary.main + '16',
                    '&:hover': { bgcolor: muiTheme.palette.primary.main + '32' }
                  }}
                >
                  <ReportIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Cause Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('cause')}
                  sx={{ 
                    color: muiTheme.palette.secondary.main,
                    bgcolor: muiTheme.palette.secondary.main + '16',
                    '&:hover': { bgcolor: muiTheme.palette.secondary.main + '32' }
                  }}
                >
                  <EventIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Condition Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('condition')}
                  sx={{ 
                    color: muiTheme.palette.info.main,
                    bgcolor: muiTheme.palette.info.main + '16',
                    '&:hover': { bgcolor: muiTheme.palette.info.main + '32' }
                  }}
                >
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Action Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('action')}
                  sx={{ 
                    color: muiTheme.palette.warning.main,
                    bgcolor: muiTheme.palette.warning.main + '16',
                    '&:hover': { bgcolor: muiTheme.palette.warning.main + '32' }
                  }}
                >
                  <FactCheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Omission Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('omission')}
                  sx={{ 
                    color: muiTheme.palette.error.main,
                    bgcolor: muiTheme.palette.error.main + '16',
                    '&:hover': { bgcolor: muiTheme.palette.error.main + '32' }
                  }}
                >
                  <BlockIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add Evidence Node" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => addNodeOfType('evidence')}
                  sx={{ 
                    color: muiTheme.palette.text.secondary,
                    bgcolor: muiTheme.palette.text.secondary + '16',
                    '&:hover': { bgcolor: muiTheme.palette.text.secondary + '32' }
                  }}
                >
                  <HelpOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Connection type buttons instead of dropdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, fontWeight: 'medium' }}>
                Connection:
              </Typography>
              
              <Tooltip title="Necessary Connection" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedEdgeType('necessary')}
                  sx={{ 
                    color: selectedEdgeType === 'necessary' ? muiTheme.palette.primary.main : 'text.secondary',
                    bgcolor: selectedEdgeType === 'necessary' ? muiTheme.palette.primary.main + '16' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedEdgeType === 'necessary' ? muiTheme.palette.primary.main : 'divider',
                    '&:hover': { bgcolor: muiTheme.palette.primary.main + '24' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      bgcolor: 'currentColor',
                      transform: 'translateY(-50%)'
                    }
                  }}
                >
                  <ArrowRightAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Contributing Connection" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedEdgeType('contributing')}
                  sx={{ 
                    color: selectedEdgeType === 'contributing' ? muiTheme.palette.secondary.main : 'text.secondary',
                    bgcolor: selectedEdgeType === 'contributing' ? muiTheme.palette.secondary.main + '16' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedEdgeType === 'contributing' ? muiTheme.palette.secondary.main : 'divider',
                    '&:hover': { bgcolor: muiTheme.palette.secondary.main + '24' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      bgcolor: 'currentColor',
                      transform: 'translateY(-50%)',
                      borderTop: '1px dashed currentColor'
                    }
                  }}
                >
                  <ArrowRightAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Possible Connection" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedEdgeType('possible')}
                  sx={{ 
                    color: selectedEdgeType === 'possible' ? muiTheme.palette.info.main : 'text.secondary',
                    bgcolor: selectedEdgeType === 'possible' ? muiTheme.palette.info.main + '16' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedEdgeType === 'possible' ? muiTheme.palette.info.main : 'divider',
                    '&:hover': { bgcolor: muiTheme.palette.info.main + '24' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      right: '20%',
                      height: '1px',
                      bgcolor: 'currentColor',
                      transform: 'translateY(-50%)',
                      borderTop: '1px dotted currentColor'
                    }
                  }}
                >
                  <ArrowRightAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Correlation Connection" arrow>
                <IconButton 
                  size="small" 
                  onClick={() => setSelectedEdgeType('correlation')}
                  sx={{ 
                    color: selectedEdgeType === 'correlation' ? muiTheme.palette.warning.main : 'text.secondary',
                    bgcolor: selectedEdgeType === 'correlation' ? muiTheme.palette.warning.main + '16' : 'transparent',
                    border: '1px solid',
                    borderColor: selectedEdgeType === 'correlation' ? muiTheme.palette.warning.main : 'divider',
                    '&:hover': { bgcolor: muiTheme.palette.warning.main + '24' },
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '20%',
                      right: '20%',
                      height: '2px',
                      bgcolor: 'currentColor',
                      transform: 'translateY(-50%)',
                      opacity: 0.5
                    }
                  }}
                >
                  <ArrowRightAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            <Divider orientation="vertical" flexItem />
            
            {/* Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Delete Selected Node" arrow>
                <span>
                  <IconButton 
                    size="small" 
                    onClick={deleteSelectedNode}
                    disabled={!selectedNode}
                    sx={{ 
                      color: muiTheme.palette.error.main,
                      bgcolor: selectedNode ? muiTheme.palette.error.main + '16' : undefined,
                      '&:hover': { bgcolor: selectedNode ? muiTheme.palette.error.main + '32' : undefined }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title="Save Diagram" arrow>
                <IconButton 
                  size="small" 
                  onClick={saveDiagram}
                  disabled={!currentProject}
                  sx={{ 
                    color: muiTheme.palette.success.main,
                    bgcolor: currentProject ? muiTheme.palette.success.main + '16' : undefined,
                    '&:hover': { bgcolor: currentProject ? muiTheme.palette.success.main + '32' : undefined }
                  }}
                >
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Analyze Diagram" arrow>
                <IconButton 
                  size="small" 
                  onClick={analyzeWithWBA}
                  disabled={!currentProject?.nodes?.length}
                  sx={{ 
                    color: muiTheme.palette.primary.main,
                    bgcolor: currentProject?.nodes?.length ? muiTheme.palette.primary.main + '16' : undefined,
                    '&:hover': { bgcolor: currentProject?.nodes?.length ? muiTheme.palette.primary.main + '32' : undefined }
                  }}
                >
                  <AnalyticsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        </Panel>
        
        {/* Project info */}
        <Panel position="top-right">
          <Paper 
            elevation={3}
            sx={{ 
              p: 1,
              borderRadius: 2,
              bgcolor: mode === 'dark' 
                ? muiTheme.palette.background.paper 
                : muiTheme.palette.common.white,
              border: '1px solid',
              borderColor: mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.12)' 
                : 'rgba(0, 0, 0, 0.12)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {currentProject?.name || 'Untitled Analysis'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {nodes?.length || 0} nodes • {edges?.length || 0} connections
            </Typography>
          </Paper>
        </Panel>
        
        {/* Selected node info */}
        {selectedNode && (
          <Panel position="bottom-center">
            <Paper 
              elevation={3}
              sx={{ 
                p: 1,
                borderRadius: 2,
                bgcolor: mode === 'dark' 
                  ? muiTheme.palette.background.paper 
                  : muiTheme.palette.common.white,
                border: '1px solid',
                borderColor: mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.12)' 
                  : 'rgba(0, 0, 0, 0.12)',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                Selected: <span style={{ color: muiTheme.palette.primary.main }}>{selectedNode.data.label}</span>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Click on the node to edit it)
              </Typography>
            </Paper>
          </Panel>
        )}
      </ReactFlow>
    </Box>
  );
};

// Wrap with ReactFlowProvider to ensure context is available
const DiagramViewWithProvider = () => (
  <ReactFlowProvider>
    <DiagramView />
  </ReactFlowProvider>
);

export default DiagramViewWithProvider; 