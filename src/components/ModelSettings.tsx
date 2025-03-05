import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  useTheme,
  SelectChangeEvent,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import TuneIcon from '@mui/icons-material/Tune';
import CategoryIcon from '@mui/icons-material/Category';
import OllamaSettings from './OllamaSettings';
import AzureOpenAISettings from './AzureOpenAISettings';
import { ModelProvider, OllamaSettings as OllamaSettingsType, AzureOpenAISettings as AzureOpenAISettingsType } from '../types';

interface ModelSettingsProps {
  onProviderChange: (provider: ModelProvider) => void;
  ollamaSettings: OllamaSettingsType;
  onOllamaSettingsChange: (newSettings: OllamaSettingsType) => void;
  azureSettings: AzureOpenAISettingsType;
  onAzureSettingsChange: (newSettings: AzureOpenAISettingsType) => void;
  hideTitle?: boolean;
  onHelp?: () => void;
}

const ModelSettings: React.FC<ModelSettingsProps> = ({
  onProviderChange,
  ollamaSettings,
  onOllamaSettingsChange,
  azureSettings,
  onAzureSettingsChange,
  hideTitle = false,
  onHelp,
}) => {
  const theme = useTheme();
  // Keep track of which provider is selected
  const [provider, setProvider] = useState<ModelProvider>('ollama');

  const handleProviderChange = (e: SelectChangeEvent) => {
    const newProvider = e.target.value as ModelProvider;
    setProvider(newProvider);
    onProviderChange(newProvider);
  };

  return (
    <Box sx={{ 
      width: '100%', 
      overflowX: 'hidden',
      px: 0.5 // Add slight padding to prevent edge touching
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 0.5 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CategoryIcon sx={{ 
            fontSize: '1rem',
            color: theme.palette.text.secondary,
            mr: 0.5
          }} />
          <Typography sx={{ 
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.825rem',
          }}>
            Provider
          </Typography>
          <Tooltip title="Select which AI provider you want to use" placement="right">
            <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Provider dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }} size="small">
        <Select
          value={provider}
          onChange={handleProviderChange}
          size="small"
          startAdornment={
            <CategoryIcon sx={{ 
              ml: 0.5, 
              mr: 1,
              fontSize: '1.25rem',
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
          }
        >
          <MenuItem value="ollama">Ollama (Local)</MenuItem>
          <MenuItem value="azure">Azure OpenAI</MenuItem>
        </Select>
      </FormControl>

      {/* Render the settings for the selected provider */}
      {provider === 'ollama' && (
        <OllamaSettings
          autoApply
          initialSettings={ollamaSettings}
          onSettingsSave={onOllamaSettingsChange}
          hideTitle
          onHelp={onHelp}
        />
      )}

      {provider === 'azure' && (
        <AzureOpenAISettings
          autoApply
          initialSettings={azureSettings}
          onSettingsSave={onAzureSettingsChange}
          hideTitle
          onHelp={onHelp}
        />
      )}
    </Box>
  );
};

export default ModelSettings; 