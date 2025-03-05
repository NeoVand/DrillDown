import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { useTheme as useAppTheme } from '../../App';

// Define the node data structure
interface NodeData {
  label: string;
  nodeType: 'problem' | 'cause' | 'evidence';
}

const CustomNode = ({ data, selected }: NodeProps<NodeData>) => {
  const muiTheme = useTheme();
  const { mode } = useAppTheme();
  const isDarkMode = mode === 'dark';

  // Define colors based on node type and theme
  const getNodeStyles = () => {
    const colors = {
      problem: {
        borderColor: muiTheme.palette.primary.main,
        backgroundColor: isDarkMode 
          ? muiTheme.palette.primary.dark + '33' // 20% opacity
          : muiTheme.palette.primary.light + '22', // 13% opacity
        color: isDarkMode 
          ? muiTheme.palette.primary.light
          : muiTheme.palette.primary.dark,
        icon: '❓'
      },
      cause: {
        borderColor: muiTheme.palette.secondary.main,
        backgroundColor: isDarkMode 
          ? muiTheme.palette.secondary.dark + '33'
          : muiTheme.palette.secondary.light + '22',
        color: isDarkMode 
          ? muiTheme.palette.secondary.light
          : muiTheme.palette.secondary.dark,
        icon: '⚠️'
      },
      evidence: {
        borderColor: isDarkMode 
          ? muiTheme.palette.text.secondary
          : muiTheme.palette.text.primary,
        backgroundColor: isDarkMode 
          ? muiTheme.palette.background.default
          : muiTheme.palette.background.paper,
        color: muiTheme.palette.text.primary,
        icon: '💡'
      }
    };

    return colors[data.nodeType] || colors.evidence;
  };

  const styles = getNodeStyles();

  return (
    <Paper
      elevation={selected ? 3 : 1}
      sx={{
        minWidth: '180px',
        maxWidth: '250px',
        borderRadius: '8px',
        border: '2px solid',
        borderColor: styles.borderColor,
        backgroundColor: styles.backgroundColor,
        padding: '12px',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.05)' : 'scale(1)',
        position: 'relative',
      }}
    >
      {/* Source handle - top */}
      <Handle
        type="source"
        position={Position.Top}
        style={{
          background: styles.borderColor,
          width: '8px',
          height: '8px',
          top: '-5px',
        }}
      />

      {/* Target handle - bottom */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          background: styles.borderColor,
          width: '8px',
          height: '8px',
          bottom: '-5px',
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography
          variant="body1"
          component="div"
          sx={{
            fontWeight: 'medium',
            color: styles.color,
            wordBreak: 'break-word',
            fontSize: '0.9rem',
            lineHeight: 1.3,
          }}
        >
          {styles.icon} {data.label}
        </Typography>
      </Box>
    </Paper>
  );
};

export default memo(CustomNode); 