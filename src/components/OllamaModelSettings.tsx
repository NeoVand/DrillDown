import React from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  InputAdornment,
  Slider,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import type { OllamaSettings } from '../types';

interface OllamaModelSettingsProps {
  settings: OllamaSettings;
  onSettingsChange: (settings: OllamaSettings) => void;
}

const OllamaModelSettings: React.FC<OllamaModelSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const handleChange = (field: keyof OllamaSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h6" gutterBottom>Ollama Model Settings</Typography>
      
      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="Model Name"
          value={settings.model}
          onChange={(e) => handleChange('model', e.target.value)}
          placeholder="llama3, mistral, mixtral, etc."
          size="small"
          helperText="Enter the name of the model you want to use with Ollama"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Model must be available in your Ollama installation">
                  <IconButton edge="end" size="small">
                    <HelpOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
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

      <FormControlLabel
        control={
          <Switch
            checked={settings.streaming ?? true}
            onChange={(e) => handleChange('streaming', e.target.checked)}
            color="primary"
          />
        }
        label="Enable streaming responses"
      />

      <FormControlLabel
        control={
          <Switch
            checked={settings.useFixedSeed ?? false}
            onChange={(e) => handleChange('useFixedSeed', e.target.checked)}
            color="primary"
          />
        }
        label="Use fixed seed"
      />

      {settings.useFixedSeed && (
        <FormControl fullWidth variant="outlined" size="small">
          <TextField
            label="Seed Value"
            type="number"
            value={settings.seed || 0}
            onChange={(e) => handleChange('seed', parseInt(e.target.value, 10))}
            size="small"
            helperText="Fixed seed for reproducible outputs"
          />
        </FormControl>
      )}

      <FormControl fullWidth variant="outlined" size="small">
        <TextField
          label="Context Length"
          type="number"
          value={settings.numCtx || 2048}
          onChange={(e) => handleChange('numCtx', parseInt(e.target.value, 10))}
          size="small"
          helperText="Maximum context length (in tokens)"
        />
      </FormControl>
    </Box>
  );
};

export default OllamaModelSettings; 