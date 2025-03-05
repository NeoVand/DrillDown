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
  Select,
  Chip,
  Stack
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
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const LeftPanel = () => {
  const { 
    currentProject,
    createNewProject,
    projects,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    aiService,
    modelProvider,
    setModelProvider,
    ollamaSettings,
    setOllamaSettings,
    azureSettings,
    setAzureSettings,
    isOllamaConnected,
    checkOllamaConnection: contextCheckOllamaConnection,
    updateLastAssistantMessage,
    systemPrompt,
    setSystemPrompt,
    selectedPromptTemplate,
    setSelectedPromptTemplate,
    promptTemplates,
    useWBAAgent,
    setUseWBAAgent,
    saveProject
  } = useAppContext();
  
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  
  const [chatMessage, setChatMessage] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [attachMenuAnchorEl, setAttachMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
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

  // Auto-scroll to the bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoadingModels(true);
        const { connected } = await contextCheckOllamaConnection();
        
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
  }, [contextCheckOllamaConnection]);

  // Add a welcome message if chat history is empty and agent is enabled
  useEffect(() => {
    if (chatHistory.length === 0 && useWBAAgent && aiService) {
      // Add welcome message
      addChatMessage(
        "Welcome to DrillDown's Why-Because Analysis assistant. " +
        "I'll help you analyze your problem using causal analysis methods. " +
        "Let's start by defining the problem you want to analyze.",
        'assistant'
      );
    }
  }, [useWBAAgent, aiService, chatHistory.length, addChatMessage]);

  const handleAttachClick = (event: React.MouseEvent<HTMLElement>) => {
    setAttachMenuAnchorEl(event.currentTarget);
    setIsAttachMenuOpen(true);
  };

  const handleAttachClose = () => {
    setIsAttachMenuOpen(false);
  };

  const handleAttachFile = (type: 'document' | 'image' | 'code') => {
    handleAttachClose();
    
    // This would open a file dialog
    const input = document.createElement('input');
    input.type = 'file';
    
    // Set accept based on type
    if (type === 'document') {
      input.accept = '.pdf,.doc,.docx,.txt';
    } else if (type === 'image') {
      input.accept = '.jpg,.jpeg,.png,.gif';
    } else if (type === 'code') {
      input.accept = '.js,.jsx,.ts,.tsx,.py,.java,.go,.rb,.c,.cpp';
    }
    
    // Handle file selection
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = () => {
          // This is just a placeholder for file handling
          // In a real app, you'd likely want to upload this to a server or process it
          const fileName = file.name;
          const fileContent = reader.result;
          
          addChatMessage(`I'm attaching a file: ${fileName}`, 'user');
          // TODO: Actually process the file
        };
        
        if (type === 'image') {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      }
    };
    
    input.click();
  };

  const handleSettingsOpen = () => {
    setIsModelSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setIsModelSettingsOpen(false);
  };

  // Original handleSendMessage function - rename to handleChatSubmit
  const handleChatSubmit = async () => {
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

        // If using WBA agent, check for special commands to modify the diagram
        if (useWBAAgent && currentProject) {
          const lcMessage = userMessage.toLowerCase();
          
          // Auto-create problem node if user is describing a problem in first few messages
          if (chatHistory.length <= 3 && 
              (lcMessage.includes('problem is') || lcMessage.includes('issue is') || lcMessage.includes('analyzing'))) {
            
            // Extract a reasonable problem description (first sentence or limit to 100 chars)
            const problemDescription = userMessage.split(/[.!?]/, 1)[0].trim();
            
            // Create a problem node if one doesn't exist already
            const hasProblemNode = currentProject.nodes.some(node => 
              node.data.nodeType === 'problem'
            );
            
            if (!hasProblemNode && aiService) {
              // Use the WBA agent to create a problem node
              const createNodeCommand = `/canvas create_node:problem:${problemDescription}`;
              await aiService.chat(createNodeCommand);
              
              // Save the project after adding the node
              if (currentProject) {
                saveProject(currentProject);
              }
            }
          }
          
          // Handle user specifying a cause or evidence that should create a node
          if (lcMessage.includes('cause is') || lcMessage.includes('caused by') || 
              lcMessage.includes('reason is') || lcMessage.includes('because')) {
            
            // Extract potential cause (text after "cause is", "caused by", etc.)
            let causeDescription = '';
            if (lcMessage.includes('cause is')) {
              causeDescription = userMessage.substring(userMessage.toLowerCase().indexOf('cause is') + 9);
            } else if (lcMessage.includes('caused by')) {
              causeDescription = userMessage.substring(userMessage.toLowerCase().indexOf('caused by') + 10);
            } else if (lcMessage.includes('reason is')) {
              causeDescription = userMessage.substring(userMessage.toLowerCase().indexOf('reason is') + 10);
            } else if (lcMessage.includes('because')) {
              causeDescription = userMessage.substring(userMessage.toLowerCase().indexOf('because') + 8);
            }
            
            // Create a cause node if we extracted something
            if (causeDescription.trim().length > 0 && aiService) {
              // Limit to first sentence
              causeDescription = causeDescription.split(/[.!?]/, 1)[0].trim();
              
              // Use the WBA agent to create a cause node
              if (causeDescription.length > 0) {
                const createNodeCommand = `/canvas create_node:cause:${causeDescription}`;
                await aiService.chat(createNodeCommand);
                
                // Save the project after adding the node
                if (currentProject) {
                  saveProject(currentProject);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        addChatMessage('Sorry, I encountered an error processing your message.', 'assistant');
      }
    }
  };
  
  // Define a function to handle direct message sending (used by buttons)
  const sendMessage = async (message: string) => {
    if (!aiService || !message.trim() || isSending) return;
    
    setIsSending(true);
    
    try {
      // Add user message to chat
      addChatMessage(message, 'user');
      
      // Add an initial empty assistant message that will be updated
      addChatMessage('', 'assistant');
      
      // Initialize response
      let fullResponse = '';
      
      // Stream the response
      await aiService.streamChat(message, (chunk) => {
        // Update the response with each chunk
        fullResponse += chunk;
        
        // Update the last assistant message with the cumulative response
        updateLastAssistantMessage(fullResponse);
      });
    } catch (error) {
      console.error('Error sending message:', error);
      addChatMessage('Sorry, I encountered an error processing your message.', 'assistant');
    } finally {
      setIsSending(false);
      setUserInput('');
      
      // Scroll to the bottom
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  // Handle form submission
  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isSending) return;
    
    sendMessage(userInput);
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
      
      // Clear chat history when creating a new project
      clearChatHistory();
    }
  };

  const renderChatMessage = (content: string, isAssistant: boolean) => {
    // Process clickable suggestions in assistant messages
    if (isAssistant) {
      // Handle command links in format [text](cmd://action)
      const processedContent = content.replace(/\[([^\]]+)\]\(cmd:\/\/([^)]+)\)/g, (match, text, command) => {
        return `<button class="suggestion-button" data-command="${command}">${text}</button>`;
      });
      
      return (
        <Typography 
          variant="body2"
          sx={{ 
            whiteSpace: 'pre-wrap',
            '& pre': { 
              whiteSpace: 'pre-wrap',
              backgroundColor: isAssistant 
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.primary.dark, 0.1),
              padding: 1,
              borderRadius: 1,
              overflowX: 'auto',
              maxWidth: '100%',
              marginTop: 1,
              marginBottom: 1
            },
            '& code': {
              backgroundColor: isAssistant
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.primary.dark, 0.1),
              padding: '0.1em 0.3em',
              borderRadius: '0.3em',
              fontSize: '0.875em'
            },
            '& .suggestion-button': {
              display: 'inline-block',
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              padding: '4px 10px',
              borderRadius: '8px',
              margin: '2px 4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              border: 'none',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'primary.dark',
              }
            }
          }}
          dangerouslySetInnerHTML={{ __html: processedContent }}
          onClick={(e) => {
            // Handle clicks on suggestion buttons
            const target = e.target as HTMLElement;
            if (target.classList.contains('suggestion-button')) {
              const command = target.getAttribute('data-command');
              if (command) {
                handleSuggestionClick(command);
              }
            }
          }}
        />
      );
    }
    
    // Regular message rendering for user messages
    return (
      <Typography 
        variant="body2"
        sx={{ 
          whiteSpace: 'pre-wrap',
          '& pre': { 
            whiteSpace: 'pre-wrap',
            backgroundColor: isAssistant 
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.primary.dark, 0.1),
            padding: 1,
            borderRadius: 1,
            overflowX: 'auto',
            maxWidth: '100%',
            marginTop: 1,
            marginBottom: 1
          },
          '& code': {
            backgroundColor: isAssistant
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.primary.dark, 0.1),
            padding: '0.1em 0.3em',
            borderRadius: '0.3em',
            fontSize: '0.875em'
          }
        }}
      >
        {content}
      </Typography>
    );
  };

  // Handle clicks on suggestion buttons
  const handleSuggestionClick = (command: string) => {
    if (!aiService) return;
    
    switch (command) {
      case 'create_problem':
        // Send command to create a problem node
        setUserInput('/canvas create_node:problem:New Problem');
        // Use the actual send method
        sendMessage('/canvas create_node:problem:New Problem');
        break;
      case 'create_cause':
        // Prompt user to describe the cause
        setUserInput('The cause is ');
        // Focus the input
        inputRef.current?.focus();
        break;
      case 'create_condition':
        // Prompt user to describe the condition
        setUserInput('The condition is ');
        // Focus the input
        inputRef.current?.focus();
        break;
      case 'add_evidence':
        // Prompt user to provide evidence
        setUserInput('The evidence is ');
        // Focus the input
        inputRef.current?.focus();
        break;
      case 'find_factors':
        // Ask the agent to help find factors
        setUserInput('What are the contributing factors?');
        sendMessage('What are the contributing factors?');
        break;
      case 'collect_evidence':
        // Ask the agent to help collect evidence
        setUserInput('What evidence should I collect?');
        sendMessage('What evidence should I collect?');
        break;
      case 'connect_nodes':
        // Ask the agent to help connect nodes
        setUserInput('How should I connect these nodes?');
        sendMessage('How should I connect these nodes?');
        break;
      case 'generate_report':
        // Generate a report from the diagram
        if (aiService && currentProject) {
          aiService.generateReportFromDiagram(currentProject)
            .then(report => {
              // Update the project with the report
              if (currentProject) {
                saveProject({
                  ...currentProject,
                  report
                });
              }
            });
        }
        break;
      case 'reset':
        // Clear chat history and create a new project
        clearChatHistory();
        createNewProject('New Analysis');
        break;
      default:
        // For any other commands, just send them to the agent
        setUserInput(`/${command}`);
        sendMessage(`/${command}`);
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
          DrillDown
          {useWBAAgent && 
            <Typography 
              component="span" 
              variant="body2" 
              sx={{ 
                ml: 1, 
                color: 'primary.light', 
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'primary.light',
                borderRadius: 1,
                px: 0.7,
                py: 0.1,
                fontSize: '0.7rem',
                fontWeight: 'medium'
              }}
            >
              WBA
            </Typography>
          }
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Settings">
            <IconButton 
              size="small" 
              sx={{ color: 'text.secondary' }}
              onClick={handleSettingsOpen}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box className="chat-history" sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        {chatHistory.length === 0 ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%', 
              opacity: 0.7,
              textAlign: 'center',
              px: 2
            }}
          >
            <Typography variant="h6" gutterBottom>
              Welcome to DrillDown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {useWBAAgent 
                ? "I'll guide you through Why-Because Analysis. Let's start by defining the problem you want to analyze."
                : "Start a new conversation with the AI assistant to analyze root causes or explore your diagrams."}
            </Typography>
          </Box>
        ) : (
          chatHistory.map((message, index) => (
            <Box 
              key={index} 
              sx={{ 
                display: 'flex', 
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1.5,
                maxWidth: '92%',
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                  fontSize: '0.875rem',
                  mt: 0.5 // Align with message top
                }}
              >
                {message.role === 'user' ? 'You' : 'AI'}
              </Avatar>
              <Paper
                sx={{
                  p: 1.5,
                  bgcolor: message.role === 'user' 
                    ? 'primary.light' 
                    : 'background.default',
                  color: message.role === 'user' 
                    ? 'primary.contrastText' 
                    : 'text.primary',
                  borderRadius: 2,
                  maxWidth: 'calc(100% - 50px)',
                  wordBreak: 'break-word',
                }}
              >
                {renderChatMessage(message.content, message.role === 'assistant')}
              </Paper>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      <Box className="chat-input" sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          multiline
          maxRows={5}
          placeholder="Type a message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={(e) => {
            // Send on Enter (without shift for newline)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleChatSubmit();
            }
          }}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Attach file">
                    <IconButton 
                      size="small" 
                      onClick={handleAttachClick}
                      sx={{ color: 'text.secondary' }}
                    >
                      <AttachFileIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Send message">
                    <IconButton 
                      color="primary" 
                      aria-label="send message"
                      disabled={!chatMessage.trim() || isSending}
                      onClick={handleChatSubmit}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </Box>

      {/* New Project Modal */}
      <Modal
        open={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
      >
        <Paper sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          p: 4,
          outline: 'none',
        }}>
          <Typography variant="h6" component="h2" gutterBottom>
            Create New Project
          </Typography>
          <TextField
            fullWidth
            label="Project Name"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            margin="normal"
            variant="outlined"
            autoFocus
          />
          <TextField
            fullWidth
            label="Description (Optional)"
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            margin="normal"
            variant="outlined"
            multiline
            rows={3}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button 
              onClick={() => setIsNewProjectModalOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              variant="contained"
              disabled={!newProjectName.trim()}
            >
              Create
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Attach Menu */}
      <Menu
        anchorEl={attachMenuAnchorEl}
        open={isAttachMenuOpen}
        onClose={handleAttachClose}
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
          <ListItemText>Code File</ListItemText>
        </MenuItem>
      </Menu>

      {/* Model Settings Dialog */}
      <ModelSettingsDialog
        open={isModelSettingsOpen}
        onClose={handleSettingsClose}
      />
    </Box>
  );
};

export default LeftPanel; 