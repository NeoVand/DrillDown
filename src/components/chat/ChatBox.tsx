import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useAppContext } from '../../context/AppContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useCanvas } from '../../context/CanvasContext'; 
import AddIcon from '@mui/icons-material/Add';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import FeedIcon from '@mui/icons-material/Feed';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import HistoryIcon from '@mui/icons-material/History';
import { WBANodeType } from '../../utils/wbaStateMachine';

// Define suggested action types
interface SuggestedAction {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

const ChatBox: React.FC = () => {
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const {
    chatHistory,
    isTyping,
    sendMessage,
    darkMode
  } = useAppContext();
  
  const { 
    handleAddNode,
    handleNodeTypeChange,
    currentProject
  } = useCanvas();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Focus input field when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show suggestions after each user message
  useEffect(() => {
    if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'user') {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim() === '') return;
    
    sendMessage(userInput);
    setUserInput('');
  };

  // Get the last user message for context
  const getLastUserMessage = () => {
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      if (chatHistory[i].role === 'user') {
        return chatHistory[i].content;
      }
    }
    return '';
  };

  // Create a problem node from the last user message
  const handleCreateProblemNode = () => {
    const message = getLastUserMessage();
    if (!message) return;
    
    const problemNode = handleAddNode({
      type: 'customNode',
      position: { x: 100, y: 100 },
      data: {
        label: message.length > 60 ? message.substring(0, 57) + '...' : message,
        nodeType: 'problem' as WBANodeType,
        description: message,
        confidence: 'medium'
      }
    });
    
    setShowSuggestions(false);
    sendMessage(`I've created a problem node for: "${message}". What do you think are some potential causes?`);
  };

  // Generate potential causes based on the last user message
  const handleGenerateCauses = () => {
    const message = getLastUserMessage();
    if (!message) return;
    
    setShowSuggestions(false);
    sendMessage(`Please analyze this problem and suggest 3-5 potential causes: "${message}"`);
  };

  // Request the agent to create a summary report
  const handleCreateReport = () => {
    setShowSuggestions(false);
    sendMessage('Please generate a summary report of our analysis so far.');
  };

  // Suggest next steps in the analysis
  const handleSuggestNextSteps = () => {
    setShowSuggestions(false);
    sendMessage('What should be our next steps in this analysis?');
  };

  // Define available suggested actions
  const suggestedActions: SuggestedAction[] = [
    {
      label: 'Create Problem Node',
      icon: <AddIcon />,
      action: handleCreateProblemNode,
      color: '#e57373' // red lighten-2
    },
    {
      label: 'Generate Potential Causes',
      icon: <LightbulbIcon />,
      action: handleGenerateCauses,
      color: '#4fc3f7' // light blue lighten-2
    },
    {
      label: 'Generate Report',
      icon: <FeedIcon />,
      action: handleCreateReport,
      color: '#81c784' // green lighten-2
    },
    {
      label: 'Suggest Next Steps',
      icon: <HistoryIcon />,
      action: handleSuggestNextSteps,
      color: '#ffd54f' // amber lighten-2
    }
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        borderRadius: 2,
        bgcolor: 'background.paper'
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <SmartToyIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="div">
          DrillDown Assistant
        </Typography>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          bgcolor: darkMode ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.02)'
        }}
      >
        {chatHistory.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7
            }}
          >
            <SmartToyIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" gutterBottom>
              Welcome to DrillDown
            </Typography>
            <Typography variant="body2" align="center" sx={{ maxWidth: '80%' }}>
              I'm your analysis assistant. Describe a problem or incident you'd like to analyze, 
              and I'll help you build a Why-Because Analysis diagram.
            </Typography>
          </Box>
        ) : (
          chatHistory.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  gap: 1
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                </Avatar>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: message.role === 'user' ? 'primary.light' : 'background.default',
                    color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                    '& pre': {
                      bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                      p: 1,
                      borderRadius: 1,
                      overflowX: 'auto',
                    },
                    '& code': {
                      bgcolor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                      p: 0.5,
                      borderRadius: 0.5,
                    }
                  }}
                >
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {message.content}
                  </ReactMarkdown>
                </Paper>
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  ml: message.role === 'user' ? 0 : 5,
                  mr: message.role === 'user' ? 5 : 0,
                  mt: 0.5,
                  color: 'text.secondary',
                  fontSize: '0.7rem'
                }}
              >
                {message.role === 'user' ? 'You' : 'Assistant'} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Typography>
            </Box>
          ))
        )}
        
        {/* Suggested actions after user messages */}
        {showSuggestions && (
          <Box sx={{ alignSelf: 'flex-start', maxWidth: '85%', mt: 1, mb: 1 }}>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block', 
                ml: 5, 
                mb: 1,
                color: 'text.secondary' 
              }}
            >
              Suggested actions:
            </Typography>
            <Stack 
              direction="row" 
              spacing={1} 
              sx={{ 
                ml: 5,
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {suggestedActions.map((action, index) => (
                <Chip
                  key={index}
                  icon={React.cloneElement(action.icon as React.ReactElement, { 
                    style: { color: action.color } 
                  })}
                  label={action.label}
                  onClick={action.action}
                  sx={{
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    mb: 1
                  }}
                  clickable
                />
              ))}
            </Stack>
          </Box>
        )}
        
        {isTyping && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'flex-start',
              ml: 5,
              gap: 1
            }}
          >
            <CircularProgress size={16} thickness={6} />
            <Typography variant="caption" color="text.secondary">
              Assistant is typing...
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          placeholder="Type your message..."
          variant="outlined"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          inputRef={inputRef}
          InputProps={{
            sx: { borderRadius: 4 }
          }}
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={!userInput.trim() || isTyping}
          endIcon={<SendIcon />}
          sx={{ borderRadius: 2 }}
        >
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatBox; 