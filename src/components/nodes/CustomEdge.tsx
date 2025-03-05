import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { Chip, Tooltip, useTheme } from '@mui/material';
import { WBALinkType } from '../../utils/wbaStateMachine';

// Define the edge data structure
interface EdgeData {
  linkType?: WBALinkType;
  confidence?: 'high' | 'medium' | 'low';
  label?: string;
}

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
  markerEnd,
}: EdgeProps<EdgeData>) => {
  const theme = useTheme();
  
  // Get edge path
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Define styles based on link type
  const getEdgeStyle = () => {
    const baseStyle = {
      strokeWidth: selected ? 2 : 1,
      stroke: theme.palette.text.primary,
    };

    if (!data?.linkType) return baseStyle;

    switch (data.linkType) {
      case 'necessary':
        return {
          ...baseStyle,
          stroke: theme.palette.primary.main,
          strokeWidth: selected ? 3 : 2, // Stronger visual
        };
      case 'contributing':
        return {
          ...baseStyle,
          stroke: theme.palette.secondary.main,
        };
      case 'possible':
        return {
          ...baseStyle,
          stroke: theme.palette.warning.main,
          strokeDasharray: '5,5', // Dashed line for uncertain links
        };
      case 'correlation':
        return {
          ...baseStyle,
          stroke: theme.palette.error.main,
          strokeDasharray: '1,5', // Dotted line for correlations
        };
      default:
        return baseStyle;
    }
  };

  // Get styles based on confidence
  const getConfidenceStyle = () => {
    if (!data?.confidence) return {};

    switch (data.confidence) {
      case 'high':
        return { opacity: 1 };
      case 'medium':
        return { opacity: 0.75 };
      case 'low':
        return { opacity: 0.5 };
      default:
        return { opacity: 1 };
    }
  };

  const edgeStyle = {
    ...getEdgeStyle(),
    ...getConfidenceStyle(),
    ...style,
  };

  // Generate a label for the edge type
  const getLinkTypeLabel = () => {
    if (!data?.linkType) return '';

    const labels = {
      necessary: 'Necessary Cause',
      contributing: 'Contributing Factor',
      possible: 'Possible Cause',
      correlation: 'Correlation (Not Causal)',
    };

    return labels[data.linkType];
  };

  return (
    <>
      <path
        id={id}
        style={edgeStyle}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Only show label if the edge is selected or has a custom label */}
      {(selected || data?.label) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <Tooltip title={getLinkTypeLabel()}>
              <Chip
                label={data?.label || data?.linkType || 'cause'}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  backgroundColor: theme.palette.background.paper,
                  borderColor: edgeStyle.stroke,
                  color: edgeStyle.stroke,
                  boxShadow: selected ? `0 0 8px ${theme.palette.primary.main}` : 'none',
                }}
              />
            </Tooltip>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default memo(CustomEdge); 