import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputAdornment,
  Slider,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import type { AzureOpenAISettings } from '../types';

interface AzureOpenAISettingsProps {
  settings: AzureOpenAISettings;
  onSettingsChange: (settings: AzureOpenAISettings) => void;
}

const AzureOpenAISettings: React.FC<AzureOpenAISettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const handleChange = (field: keyof AzureOpenAISettings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>Azure OpenAI Settings</Typography>
      
      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="API Endpoint"
          value={settings.endpoint}
          onChange={(e) => handleChange('endpoint', e.target.value)}
          placeholder="https://your-resource-name.openai.azure.com/"
          size="small"
          helperText="Your Azure OpenAI API endpoint"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Azure OpenAI endpoint URL from your resource">
                  <IconButton edge="end" size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="API Key"
          value={settings.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Your Azure OpenAI API key"
          size="small"
          type="password"
          helperText="API key from Azure portal"
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="Deployment ID"
          value={settings.deploymentId}
          onChange={(e) => handleChange('deploymentId', e.target.value)}
          placeholder="Your deployment name"
          size="small"
          helperText="The name of your model deployment"
        />
      </FormControl>

      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="API Version"
          value={settings.apiVersion}
          onChange={(e) => handleChange('apiVersion', e.target.value)}
          placeholder="2023-05-15"
          size="small"
          helperText="Azure OpenAI API version (e.g., 2023-05-15)"
        />
      </FormControl>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Temperature: {settings.temperature.toFixed(2)}
          <Tooltip title="Controls randomness: Higher values produce more creative but potentially less focused outputs">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Slider
          value={settings.temperature}
          onChange={(_, newValue) => handleChange('temperature', newValue)}
          min={0}
          max={2}
          step={0.05}
          marks={[
            { value: 0, label: '0' },
            { value: 1, label: '1' },
            { value: 2, label: '2' },
          ]}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Top P: {settings.topP.toFixed(2)}
          <Tooltip title="Controls diversity: Lower values make output more focused, higher values more diverse">
            <IconButton size="small">
              <HelpOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Slider
          value={settings.topP}
          onChange={(_, newValue) => handleChange('topP', newValue)}
          min={0}
          max={1}
          step={0.05}
          marks={[
            { value: 0, label: '0' },
            { value: 0.5, label: '0.5' },
            { value: 1, label: '1' },
          ]}
        />
      </Box>
    </Box>
  );
};

export default AzureOpenAISettings; 