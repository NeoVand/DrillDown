import { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps, useReactFlow, NodeToolbar } from 'reactflow';
import { Box, Paper, Typography, useTheme, Tooltip, TextField, Select, MenuItem, IconButton, FormControl, InputLabel, Chip, Avatar, Stack, Button } from '@mui/material';
import { useTheme as useAppTheme } from '../../App';
import { WBANodeType } from '../../utils/wbaStateMachine';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useAppContext } from '../../context/AppContext';
import { alpha } from '@mui/material/styles';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BlockIcon from '@mui/icons-material/Block';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';

// Define the node data structure
export type NodeType = 'problem' | 'cause' | 'condition' | 'action' | 'omission' | 'evidence';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface NodeData {
  label: string;
  nodeType: NodeType;
  confidence?: ConfidenceLevel;
  description?: string;
  evidence?: string[];
  evidenceCount?: number;
}

const CustomNode = memo(({ id, data, isConnectable, selected }: NodeProps<NodeData>) => {
  const muiTheme = useTheme();
  const { mode } = useAppTheme();
  const { currentProject, saveProject } = useAppContext();
  const { setNodes } = useReactFlow();
  
  // State for inline editing
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editLabel, setEditLabel] = useState<string>(data.label || '');
  const [editDescription, setEditDescription] = useState<string>(data.description || '');
  const [editNodeType, setEditNodeType] = useState<NodeType>(data.nodeType || 'problem');
  const [editConfidence, setEditConfidence] = useState<ConfidenceLevel>(data.confidence || 'medium');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle node deletion
  const onDelete = () => {
    if (!currentProject) return;
    
    // Filter out this node from the nodes list
    const updatedNodes = currentProject.nodes.filter(node => node.id !== id);
    
    // Filter out edges connected to this node
    const updatedEdges = currentProject.edges.filter(edge => 
      edge.source !== id && edge.target !== id
    );
    
    // Update the project
    saveProject({
      ...currentProject,
      nodes: updatedNodes,
      edges: updatedEdges
    });
  };

  // Reference to the edit form for outside click detection
  const formRef = useRef<HTMLFormElement>(null);

  // Update state when props change
  useEffect(() => {
    setEditLabel(data.label || '');
    setEditDescription(data.description || '');
    setEditNodeType(data.nodeType || 'problem');
    setEditConfidence(data.confidence || 'medium');
  }, [data]);

  // Handle outside clicks to exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditing && formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  // Function to save changes
  const saveChanges = () => {
    if (!currentProject) return;
    
    const updatedNodes = currentProject.nodes.map(node => {
      if (node.id === id) {
        return {
          ...node,
          data: {
            ...node.data,
            label: editLabel,
            nodeType: editNodeType,
            description: editDescription,
            confidence: editConfidence
          }
        };
      }
      return node;
    });
    
    saveProject({
      ...currentProject,
      nodes: updatedNodes
    });
    
    setIsEditing(false);
  };
  
  // Function to cancel editing
  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
  };

  // Calculate color based on node type
  const getNodeColor = (nodeType: NodeType) => {
    switch (nodeType) {
      case 'problem':
        return '#e57373'; // red lighten-2
      case 'cause':
        return '#4fc3f7'; // light blue lighten-2
      case 'condition':
        return '#81c784'; // green lighten-2
      case 'action':
        return '#ffd54f'; // amber lighten-2
      case 'omission':
        return '#ba68c8'; // purple lighten-2
      case 'evidence':
        return '#a1887f'; // brown lighten-2
      default:
        return '#90a4ae'; // blue-grey lighten-2
    }
  };

  // Get icon based on node type
  const getNodeIcon = (nodeType: NodeType) => {
    switch (nodeType) {
      case 'problem':
        return <ErrorOutlineIcon fontSize="small" />;
      case 'cause':
        return <LightbulbOutlinedIcon fontSize="small" />;
      case 'condition':
        return <CheckCircleOutlineIcon fontSize="small" />;
      case 'action':
        return <PlayArrowIcon fontSize="small" />;
      case 'omission':
        return <BlockIcon fontSize="small" />;
      case 'evidence':
        return <VerifiedUserOutlinedIcon fontSize="small" />;
      default:
        return <HelpOutlineIcon fontSize="small" />;
    }
  };

  // Format confidence level for display
  const formatConfidence = (confidence?: ConfidenceLevel) => {
    return confidence || 'medium';
  };

  // Get color for confidence level
  const getConfidenceColor = (confidence?: ConfidenceLevel) => {
    if (confidence === 'high') return '#4caf50';
    if (confidence === 'low') return '#f44336';
    return '#ff9800'; // medium (default)
  };

  return (
    <Box
      sx={{
        backgroundColor: getNodeColor(data.nodeType),
        padding: 1,
        borderRadius: 2,
        borderWidth: selected ? 2 : 1,
        borderStyle: 'solid',
        borderColor: selected ? 'primary.main' : (isEditing ? 'secondary.main' : 'transparent'),
        transition: 'all 0.2s ease',
        boxShadow: selected || isEditing ? 2 : 1,
        minWidth: isEditing ? 320 : 220,
        maxWidth: isEditing ? 400 : 320,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: data.confidence === 'low' ? 0.7 : 1,
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: 3
        }
      }}
      onClick={isEditing ? undefined : () => setIsEditing(true)}
    >
      {/* Target and Source Handles for Connections */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: 8, height: 8 }}
        isConnectable={isConnectable}
      />
      
      {isEditing ? (
        // Edit mode - form fields for editing node properties
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
          <Stack spacing={1.5} sx={{ mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="node-type-label">Type</InputLabel>
              <Select
                labelId="node-type-label"
                value={editNodeType}
                onChange={(e) => setEditNodeType(e.target.value as NodeType)}
                label="Type"
                size="small"
                sx={{ mb: 1 }}
              >
                <MenuItem value="problem">Problem</MenuItem>
                <MenuItem value="cause">Cause</MenuItem>
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="action">Action</MenuItem>
                <MenuItem value="omission">Omission</MenuItem>
                <MenuItem value="evidence">Evidence</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="Label"
              variant="outlined"
              size="small"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              multiline
              minRows={2}
              fullWidth
              autoFocus
            />
            
            <TextField
              label="Description"
              variant="outlined"
              size="small"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            
            <FormControl fullWidth size="small">
              <InputLabel id="confidence-label">Confidence</InputLabel>
              <Select
                labelId="confidence-label"
                value={editConfidence}
                onChange={(e) => setEditConfidence(e.target.value as ConfidenceLevel)}
                label="Confidence"
                size="small"
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={cancelEditing}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                type="submit"
                color="primary"
              >
                Save
              </Button>
            </Box>
          </Stack>
        </form>
      ) : (
        // Display mode - show node info
        <>
          {/* Node Type Badge */}
          <Box sx={{ 
            position: 'absolute', 
            top: '-10px', 
            right: '10px', 
            backgroundColor: alpha(getNodeColor(data.nodeType), 0.8),
            color: 'text.primary',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            padding: '2px 8px',
            borderRadius: '10px',
            textTransform: 'capitalize',
            boxShadow: 1,
            border: '1px solid',
            borderColor: alpha('#fff', 0.2)
          }}>
            {data.nodeType}
          </Box>
          
          {/* Main Content */}
          <Stack spacing={0.5}>
            {/* Node Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ 
                width: 28, 
                height: 28, 
                bgcolor: alpha('#fff', 0.3),
                color: 'text.primary'
              }}>
                {getNodeIcon(data.nodeType)}
              </Avatar>
              
              <Typography 
                variant="subtitle1" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'text.primary',
                  lineHeight: 1.2
                }}
              >
                {data.label}
              </Typography>
            </Box>
            
            {/* Description (if available) */}
            {data.description && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.primary',
                  opacity: 0.9,
                  mt: 0.5,
                  fontSize: '0.85rem',
                  // Show ellipsis for long descriptions
                  display: '-webkit-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {data.description}
              </Typography>
            )}
            
            {/* Footer with metadata */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center', 
              mt: 0.5,
              borderTop: '1px solid',
              borderColor: alpha('#000', 0.1),
              pt: 0.5
            }}>
              {/* Confidence indicator */}
              <Chip
                label={formatConfidence(data.confidence)}
                size="small"
                sx={{ 
                  height: 20,
                  fontSize: '0.7rem',
                  backgroundColor: alpha(getConfidenceColor(data.confidence), 0.2),
                  color: getConfidenceColor(data.confidence),
                  '& .MuiChip-label': {
                    padding: '0 8px'
                  }
                }}
              />
              
              {/* Evidence count if applicable */}
              {data.nodeType === 'cause' && data.evidenceCount !== undefined && data.evidenceCount > 0 && (
                <Tooltip title="Supporting evidence">
                  <Chip
                    icon={<ArticleIcon sx={{ fontSize: '0.8rem' }} />}
                    label={data.evidenceCount}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.7rem',
                      backgroundColor: alpha('#2196f3', 0.2),
                      color: '#0d47a1',
                      '& .MuiChip-label': {
                        padding: '0 4px'
                      }
                    }}
                  />
                </Tooltip>
              )}
            </Box>
          </Stack>
          
          {/* Edit button */}
          <IconButton
            size="small"
            sx={{ 
              position: 'absolute',
              bottom: 4,
              right: 4,
              color: alpha('#000', 0.6),
              backgroundColor: alpha('#fff', 0.3),
              '&:hover': {
                backgroundColor: alpha('#fff', 0.5),
              },
              width: 24,
              height: 24
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <EditIcon sx={{ fontSize: '0.9rem' }} />
          </IconButton>
        </>
      )}
      
      <NodeToolbar>
        <Paper sx={{ display: 'flex', p: 0.5 }}>
          <Tooltip title="Delete node">
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </NodeToolbar>
    </Box>
  );
});

export default CustomNode; 