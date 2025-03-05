import React, { useState } from 'react';
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
} from '@mui/material';
import ModelSettings from './ModelSettings';
import OllamaConnectionModal from './OllamaConnectionModal';
import { useAppContext } from '../context/AppContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import TuneIcon from '@mui/icons-material/Tune';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { alpha } from '@mui/material/styles';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ 
        height: '100%', 
        overflow: 'auto',
        width: '100%',
        overflowX: 'hidden'
      }}
    >
      {value === index && (
        <Box sx={{ pt: 2, width: '100%' }}>{children}</Box>
      )}
    </div>
  );
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
  } = useAppContext();

  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
    setShowConnectionModal(true);
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
        <Box sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          px: 2.5,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Settings
          </Typography>
          
          {modelProvider === 'ollama' && (
            <Chip
              size="small"
              icon={isOllamaConnected ? <CheckCircleIcon fontSize="small" /> : <ErrorIcon fontSize="small" />}
              label={isOllamaConnected ? "Connected" : "Disconnected"}
              color={isOllamaConnected ? "success" : "error"}
              sx={{ ml: 1 }}
            />
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2.5 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<TuneIcon fontSize="small" />} 
              iconPosition="start" 
              label="Model" 
              sx={{ textTransform: 'none', minHeight: 40 }}
            />
            <Tab 
              icon={<SmartToyIcon fontSize="small" />} 
              iconPosition="start" 
              label="Prompts" 
              sx={{ textTransform: 'none', minHeight: 40 }}
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
            <ModelSettings
              onProviderChange={handleProviderChange}
              ollamaSettings={ollamaSettings}
              onOllamaSettingsChange={handleOllamaSettingsChange}
              azureSettings={azureSettings}
              onAzureSettingsChange={handleAzureSettingsChange}
              onHelp={handleHelp}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="prompt-template-label">Prompt Template</InputLabel>
                <Select
                  labelId="prompt-template-label"
                  id="prompt-template-select"
                  value={selectedPromptTemplate}
                  label="Prompt Template"
                  onChange={handlePromptTemplateChange as any}
                  size="small"
                >
                  {Object.entries(promptTemplates).map(([key, template]) => (
                    <MenuItem key={key} value={key}>{template.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
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
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
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
                <Button 
                  variant="contained"
                  size="small"
                  onClick={() => {
                    // The changes are automatically saved to context when setSystemPrompt is called
                    // We might want to add feedback here eventually
                  }}
                >
                  Save Changes
                </Button>
              </Box>
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