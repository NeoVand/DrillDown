import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  Chip,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  Tooltip,
  InputAdornment
} from '@mui/material';
import ModelSettings from './ModelSettings';
import OllamaConnectionModal from './OllamaConnectionModal';
import { useAppContext } from '../context/AppContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { alpha } from '@mui/material/styles';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import ScienceIcon from '@mui/icons-material/Science';

interface ModelSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

// TabPanel component for the tabbed interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`model-settings-tabpanel-${index}`}
      aria-labelledby={`model-settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `model-settings-tab-${index}`,
    'aria-controls': `model-settings-tabpanel-${index}`,
  };
}

const ModelSettingsDialog: React.FC<ModelSettingsDialogProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const {
    modelProvider,
    setModelProvider,
    ollamaSettings,
    setOllamaSettings,
    azureSettings,
    setAzureSettings,
    isOllamaConnected,
    checkOllamaConnection,
    ollcamaConnectionError: ollamaConnectionError,
    systemPrompt,
    setSystemPrompt,
    selectedPromptTemplate,
    setSelectedPromptTemplate,
    promptTemplates,
    useWBAAgent,
    setUseWBAAgent
  } = useAppContext();

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Always ensure WBA agent is active
  useEffect(() => {
    if (!useWBAAgent) {
      setUseWBAAgent(true);
    }
  }, [useWBAAgent, setUseWBAAgent]);

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle prompt template change
  const handlePromptTemplateChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const templateName = event.target.value as string;
    setSelectedPromptTemplate(templateName);
    if (templateName in promptTemplates) {
      setSystemPrompt(promptTemplates[templateName as keyof typeof promptTemplates].content);
    }
  };

  const handleProviderChange = (provider: 'ollama' | 'azure') => {
    setModelProvider(provider);

    // Check Ollama connection when switching to Ollama
    if (provider === 'ollama') {
      checkOllamaConnection().then(result => {
        if (!result.connected) {
          setShowConnectionModal(true);
        }
      });
    }
  };

  const handleOllamaSettingsChange = (settings: typeof ollamaSettings) => {
    setOllamaSettings(settings);
  };

  const handleAzureSettingsChange = (settings: typeof azureSettings) => {
    setAzureSettings(settings);
  };

  const handleHelp = () => {
    // Open help resources in a new tab
    window.open('https://github.com/your-organization/your-repository/wiki/Settings', '_blank');
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            bgcolor: theme.palette.background.paper,
            maxHeight: '80vh',
            height: 'auto',
            overflowX: 'hidden',
            width: { xs: '90vw', sm: '80vw', md: '600px' },
            maxWidth: '100%',
            '& ::-webkit-scrollbar': {
              width: '8px',
              backgroundColor: 'transparent',
              marginRight: 0,
            },
            '& ::-webkit-scrollbar-thumb': {
              backgroundColor: alpha(theme.palette.primary.main, 0.2),
              borderRadius: '4px',
              marginRight: 0,
            },
            '& ::-webkit-scrollbar-thumb:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.3),
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.dark', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center' 
        }}>
          Model Settings
          <Tooltip title="Settings Help">
            <IconButton size="small" onClick={handleHelp} sx={{ color: 'white' }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="model settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<SmartToyIcon fontSize="small" />} 
              iconPosition="start" 
              label="Model Settings" 
              {...a11yProps(0)}
            />
            <Tab 
              icon={<TuneIcon fontSize="small" />} 
              iconPosition="start" 
              label="System Prompt" 
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        <DialogContent sx={{ 
          px: 2.5, 
          py: 2, 
          display: 'flex', 
          flexDirection: 'column',
          height: 'auto',
          overflow: 'auto',
          overflowX: 'hidden',
          pr: 2.5,
        }}>
          <TabPanel value={tabValue} index={0}>
            {modelProvider === 'ollama' && (
              <Alert severity={isOllamaConnected ? "success" : "warning"} sx={{ mb: 2 }}>
                {isOllamaConnected 
                  ? "Connected to Ollama server" 
                  : "Not connected to Ollama server. Click Connect to establish connection."}
                <Button 
                  size="small" 
                  sx={{ ml: 2 }} 
                  variant="outlined"
                  onClick={() => setShowConnectionModal(true)}
                >
                  {isOllamaConnected ? "Test Connection" : "Connect"}
                </Button>
              </Alert>
            )}
            
            <ModelSettings
              onProviderChange={handleProviderChange}
              ollamaSettings={ollamaSettings}
              onOllamaSettingsChange={handleOllamaSettingsChange}
              azureSettings={azureSettings}
              onAzureSettingsChange={handleAzureSettingsChange}
              hideTitle={false}
              onHelp={() => setShowConnectionModal(true)}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Prompt Template</Typography>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="prompt-template-label">Template</InputLabel>
                <Select
                  labelId="prompt-template-label"
                  id="prompt-template-select"
                  value={selectedPromptTemplate}
                  label="Template"
                  onChange={handlePromptTemplateChange as any}
                  size="small"
                >
                  {Object.entries(promptTemplates).map(([key, template]) => (
                    <MenuItem key={key} value={key}>{template.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              label="System Prompt"
              multiline
              rows={8}
              fullWidth
              variant="outlined"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              size="small"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button 
                variant="outlined"
                size="small"
                onClick={() => {
                  if (selectedPromptTemplate in promptTemplates) {
                    setSystemPrompt(promptTemplates[selectedPromptTemplate as keyof typeof promptTemplates].content);
                  }
                }}
              >
                Reset to Default
              </Button>
            </Box>
          </TabPanel>
        </DialogContent>
        
        <DialogActions sx={{ 
          borderTop: `1px solid ${theme.palette.divider}`,
          px: 2.5,
          py: 1.5,
        }}>
          <Button 
            onClick={onClose}
            variant="contained"
            color="primary"
            size="small"
            sx={{
              textTransform: 'none',
              px: 2,
              py: 0.5,
              borderRadius: 1,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <OllamaConnectionModal
        open={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        isConnected={isOllamaConnected}
        error={ollamaConnectionError || undefined}
      />
    </>
  );
};

export default ModelSettingsDialog; 