import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  TextField, 
  IconButton, 
  Divider,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Modal,
  InputAdornment,
  List,
  ListItem,
  Badge,
  Tooltip,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import TuneIcon from '@mui/icons-material/Tune';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { GiTrenchSpade } from 'react-icons/gi';
import ModelSettingsDialog from './ModelSettingsDialog';
import OllamaConnectionStatus from './OllamaConnectionStatus';
import { useAppContext } from '../context/AppContext';
import { checkOllamaConnection, fetchWithCORS } from '../config/api';

const LeftPanel = () => {
  const { 
    currentProject,
    createNewProject,
    projects,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    updateLastAssistantMessage,
    aiService,
    modelProvider,
    isOllamaConnected,
    ollamaSettings,
    setOllamaSettings
  } = useAppContext();
  
  const [chatMessage, setChatMessage] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [attachMenuAnchorEl, setAttachMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  
  // Project creation state
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // Get model settings from context
  const { ollamaSettings: contextOllamaSettings, setOllamaSettings: setContextOllamaSettings } = useAppContext();
  
  // AI temperature state (temporary until full integration with ollamaSettings)
  const [aiTemperature, setAiTemperature] = useState<number>(contextOllamaSettings.temperature || 0.7);

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const { connected } = await checkOllamaConnection();
        
        if (connected) {
          const response = await fetchWithCORS('/api/tags');
          const data = await response.json();
          const models = data.models?.map((m: any) => m.name) || [];
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [isOllamaConnected]);

  // File attachment handling
  const handleAttachClick = (event: React.MouseEvent<HTMLElement>) => {
    setAttachMenuAnchorEl(event.currentTarget);
    setIsAttachMenuOpen(true);
  };

  const handleAttachClose = () => {
    setIsAttachMenuOpen(false);
  };

  const handleAttachFile = (type: 'document' | 'image' | 'code') => {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    // Set accepted file types based on the attachment type
    switch (type) {
      case 'document':
        fileInput.accept = '.pdf,.doc,.docx,.txt,.md';
        break;
      case 'image':
        fileInput.accept = '.jpg,.jpeg,.png,.gif,.svg';
        break;
      case 'code':
        fileInput.accept = '.js,.jsx,.ts,.tsx,.py,.java,.html,.css,.json';
        break;
    }
    
    // Handle file selection
    fileInput.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // In a real app, you would process the file here
        // For now, just add a message about the attached file
        setChatMessage(`I'm attaching ${files[0].name} to help with the analysis.`);
      }
    };
    
    // Trigger file selection dialog
    fileInput.click();
    handleAttachClose();
  };

  const handleSettingsOpen = () => {
    setIsModelSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsModelSettingsOpen(false);
  };

  const handleSendMessage = async () => {
    if (chatMessage.trim() === '') return;
    
    // Add user message to chat
    addChatMessage(chatMessage, 'user');
    
    // Clear input
    const userMessage = chatMessage;
    setChatMessage('');
    
    // Process with AI
    if (aiService) {
      try {
        // Add an initial empty assistant message that will be updated
        addChatMessage('', 'assistant');
        
        // Initialize response
        let fullResponse = '';
        
        // Stream the response
        await aiService.streamChat(userMessage, (chunk) => {
          // Update the response with each chunk
          fullResponse += chunk;
          
          // Update the last assistant message with the cumulative response
          updateLastAssistantMessage(fullResponse);
        });
      } catch (error) {
        console.error('Error getting AI response:', error);
        addChatMessage('Sorry, I encountered an error processing your request.', 'assistant');
      }
    } else {
      // Fallback if AI service is not available
      setTimeout(() => {
        addChatMessage('AI service is not available at the moment.', 'assistant');
      }, 500);
    }
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = createNewProject(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsNewProjectModalOpen(false);
    }
  };

  return (
    <Box className="left-panel" sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: 0,
      m: 0,
      p: 0
    }}>
      <Box className="app-header" sx={{ 
        display: 'flex', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        minHeight: 48,
        p: 0,
        px: 2,
      }}>
        <Box sx={{ 
          color: 'primary.light', 
          mr: 1.5, 
          display: 'flex', 
          alignItems: 'center'
        }}>
          <Box sx={{ 
            transform: 'rotate(180deg)', 
            display: 'flex',
            alignItems: 'center',
            height: '28px', // Match icon size
          }}>
            <GiTrenchSpade size={28} />
          </Box>
        </Box>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            fontWeight: 'bold', 
            flexGrow: 1, 
            color: 'primary.light',
            display: 'flex',
            alignItems: 'center',
            lineHeight: 1, // Improve text vertical alignment
            mt: '1px' // Fine-tune alignment with the icon
          }}
        >
          Drill Down
        </Typography>
        
        {/* Connection status indicator */}
        {modelProvider === 'ollama' && (
          <Tooltip title={isOllamaConnected ? "Ollama Connected" : "Ollama Disconnected"}>
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: isOllamaConnected ? 'success.main' : 'error.main',
                display: 'inline-block',
                mr: 1,
              }}
            />
          </Tooltip>
        )}
        
        {/* Add Model Settings button */}
        <Tooltip title="AI Model Settings">
          <IconButton 
            color="primary" 
            size="small" 
            onClick={handleSettingsOpen}
            sx={{ ml: 1, color: 'primary.light' }}
          >
            <TuneIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box className="chatbot-toolbar toolbar" sx={{ 
        mx: 2, 
        mt: 2, 
        mb: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          RCA Assistant
        </Typography>
        <Box className="chat-header-actions" sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Clear Chat">
            <IconButton 
              size="small"
              className="icon-button"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box className="chat-history" sx={{ 
        flexGrow: 1, 
        overflow: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}>
        {chatHistory.length === 0 ? (
          <Box sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            alignItems: 'center',
            color: 'text.secondary',
            textAlign: 'center',
            px: 4
          }}>
            <Box sx={{ color: 'primary.light', mb: 2, opacity: 0.8, display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ transform: 'rotate(180deg)' }}>
                <GiTrenchSpade size={48} />
              </Box>
            </Box>
            <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
              Welcome to Drill Down RCA
            </Typography>
            <Typography variant="body2">
              I'm your RCA assistant. I can help you analyze problems, identify root causes, and generate reports.
            </Typography>
          </Box>
        ) : (
          chatHistory.map((message, index) => (
            <Box 
              key={index}
              className={`chat-message ${message.role}`}
              sx={{ 
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                display: 'flex',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1.5,
                mb: 2,
                maxWidth: '90%'
              }}
            >
              {message.role === 'assistant' && (
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.light',
                    width: 32,
                    height: 32
                  }}
                >
                  <Box sx={{ color: (theme) => theme.palette.primary.contrastText, display: 'flex', transform: 'rotate(180deg)' }}>
                    <GiTrenchSpade size={16} />
                  </Box>
                </Avatar>
              )}
              <Paper 
                elevation={0}
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.default',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  p: 2,
                  borderRadius: message.role === 'user' 
                    ? '16px 16px 4px 16px' 
                    : '16px 16px 16px 4px',
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Paper>
            </Box>
          ))
        )}
      </Box>
      
      {/* Chat input box */}
      <Box sx={{ 
        px: 2, 
        py: 1.5, 
        borderTop: '1px solid', 
        borderColor: 'divider',
        mt: 'auto'
      }}>
        <Box sx={{ position: 'relative' }}>
          <TextField
            fullWidth
            placeholder="Ask about your RCA..."
            variant="outlined"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={chatMessage.trim() === ''}
                  >
                    <SendIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {/* Ollama connection status will only show if there's a connection error */}
        <OllamaConnectionStatus />
        
        {/* AI Model Settings Dialog */}
        <ModelSettingsDialog 
          open={isModelSettingsOpen} 
          onClose={handleSettingsClose}
        />
      </Box>
      
      {/* Attachment Menu */}
      <Menu
        anchorEl={attachMenuAnchorEl}
        open={isAttachMenuOpen}
        onClose={handleAttachClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => handleAttachFile('document')}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Document</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAttachFile('image')}>
          <ListItemIcon>
            <ImageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Image</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAttachFile('code')}>
          <ListItemIcon>
            <CodeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Code</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* New Project Modal */}
      <Modal
        open={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        aria-labelledby="new-project-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 4
        }}>
          <Typography id="new-project-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>
            Create New Project
          </Typography>
          
          <TextField
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            margin="normal"
            required
          />
          
          <TextField
            label="Description (optional)"
            fullWidth
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setIsNewProjectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default LeftPanel; 