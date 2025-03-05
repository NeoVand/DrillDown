import React from 'react';
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Box,
  Typography,
  Paper,
  Link,
} from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { getOllamaStartCommand } from '../config/api';

const OllamaConnectionStatus: React.FC = () => {
  const {
    isOllamaConnected,
    ollcamaConnectionError: ollamaConnectionError,
    isRetryingConnection,
    checkOllamaConnection,
    enableFallbackMode,
    fallbackMode,
  } = useAppContext();

  // If connected or in fallback mode, don't show anything
  if (isOllamaConnected || fallbackMode) {
    return null;
  }

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '8px',
        borderLeft: '4px solid #f44336',
      }}
    >
      <Alert 
        severity="error" 
        sx={{ 
          mb: 2,
          '& .MuiAlert-icon': {
            alignItems: 'center'
          }
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>Cannot connect to Ollama</AlertTitle>
        {ollamaConnectionError}
      </Alert>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        Make sure you have Ollama installed and running. You can start it by running:
      </Typography>
      
      <Paper 
        variant="outlined" 
        sx={{ 
          p: 1.5, 
          mb: 3, 
          backgroundColor: 'rgba(0, 0, 0, 0.05)', 
          fontFamily: 'monospace',
          borderRadius: '4px',
          fontSize: '0.9rem',
          overflowX: 'auto'
        }}
      >
        <code>{getOllamaStartCommand()}</code>
      </Paper>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        For more information on installing Ollama, visit the <Link href="https://ollama.ai" target="_blank" rel="noopener">Ollama website</Link>.
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button 
          variant="contained" 
          color="primary"
          disabled={isRetryingConnection}
          onClick={() => checkOllamaConnection()}
          startIcon={isRetryingConnection ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isRetryingConnection ? 'Retrying...' : 'Retry Connection'}
        </Button>
        
        <Button 
          variant="outlined"
          onClick={() => enableFallbackMode()}
        >
          Continue in Fallback Mode
        </Button>
      </Box>
    </Paper>
  );
};

export default OllamaConnectionStatus; 