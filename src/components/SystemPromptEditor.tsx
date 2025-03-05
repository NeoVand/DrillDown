import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface SystemPromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  defaultValue?: string;
}

const SystemPromptEditor: React.FC<SystemPromptEditorProps> = ({ 
  value, 
  onChange,
  defaultValue
}) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleReset = () => {
    if (defaultValue) {
      onChange(defaultValue);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" gutterBottom>
            System Prompt
          </Typography>
          <Tooltip title="The system prompt sets the behavior and context for the AI model">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box>
          <Tooltip title="Copy to clipboard">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {defaultValue && (
            <Tooltip title="Reset to default">
              <IconButton size="small" onClick={handleReset}>
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      
      <TextField
        fullWidth
        multiline
        rows={10}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter system prompt..."
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }
        }}
      />
      
      <Typography variant="caption" color="text.secondary">
        The system prompt provides context and instructions for the AI model. Be specific about the assistant's role, capabilities, and constraints.
      </Typography>
    </Box>
  );
};

export default SystemPromptEditor; 