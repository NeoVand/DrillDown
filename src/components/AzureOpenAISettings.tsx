import React, { useState, useEffect } from 'react';
import {
  Typography,
  TextField,
  Box,
  Slider,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Button,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { AzureOpenAISettings as AzureOpenAISettingsType } from '../types';

interface AzureOpenAISettingsProps {
  onSettingsSave: (settings: AzureOpenAISettingsType) => void;
  autoApply?: boolean;
  hideTitle?: boolean;
  initialSettings?: AzureOpenAISettingsType;
  onHelp?: () => void;
}

const AzureOpenAISettings: React.FC<AzureOpenAISettingsProps> = ({
  onSettingsSave,
  autoApply = false,
  hideTitle = false,
  initialSettings,
}) => {
  const theme = useTheme();
  const [settings, setSettings] = useState<AzureOpenAISettingsType>(
    initialSettings || {
      endpoint: '',
      apiKey: '',
      deploymentId: '',
      apiVersion: '2023-05-15',
      temperature: 0.7,
      topP: 0.9,
    }
  );

  // Update settings when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSettingChange = (field: keyof AzureOpenAISettingsType, value: any) => {
    // Update local state
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // If autoApply is enabled, save the settings
    if (autoApply) {
      requestAnimationFrame(() => {
        onSettingsSave(newSettings);
      });
    }
  };

  return (
    <Box>
      {!hideTitle && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1, 
          mb: 3,
          color: theme.palette.primary.main 
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: '1.125rem',
              letterSpacing: '-0.025em'
            }}
          >
            Azure OpenAI Settings
          </Typography>
          <Tooltip title="Configure Azure OpenAI connection and parameters" placement="right">
            <IconButton size="small" sx={{ ml: 'auto', color: 'inherit', opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography sx={{ 
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}>
            Azure OpenAI Endpoint
          </Typography>
          <Tooltip title="The full URL of your Azure OpenAI resource (e.g., https://your-resource-name.openai.azure.com)" placement="right">
            <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          value={settings.endpoint}
          onChange={(e) => handleSettingChange('endpoint', e.target.value)}
          placeholder="https://your-resource-name.openai.azure.com"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography sx={{ 
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}>
            API Key
          </Typography>
          <Tooltip title="Your Azure OpenAI API key" placement="right">
            <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          type="password"
          value={settings.apiKey}
          onChange={(e) => handleSettingChange('apiKey', e.target.value)}
          placeholder="Enter your API key"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography sx={{ 
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}>
            Deployment ID
          </Typography>
          <Tooltip title="The name of your Azure OpenAI deployment" placement="right">
            <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          value={settings.deploymentId}
          onChange={(e) => handleSettingChange('deploymentId', e.target.value)}
          placeholder="Enter your deployment name"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          mb: 1 
        }}>
          <Typography sx={{ 
            fontWeight: 500,
            color: theme.palette.text.secondary,
            fontSize: '0.875rem',
          }}>
            API Version
          </Typography>
          <Tooltip title="Azure OpenAI API version to use" placement="right">
            <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
              <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <TextField
          fullWidth
          value={settings.apiVersion}
          onChange={(e) => handleSettingChange('apiVersion', e.target.value)}
          placeholder="2023-05-15"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
            }
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ 
              fontWeight: 500,
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}>
              Temperature
            </Typography>
            <Tooltip title="Controls randomness in the output. Higher values (e.g., 0.8) make the output more creative but less focused, lower values (e.g., 0.2) make it more deterministic and focused." placement="right">
              <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <span style={{ 
            fontFamily: 'var(--font-mono)',
            color: theme.palette.primary.main,
            fontSize: '0.8125rem'
          }}>
            {settings.temperature}
          </span>
        </Box>
        <Slider
          value={settings.temperature}
          onChange={(_, value) => handleSettingChange('temperature', value as number)}
          min={0}
          max={2}
          step={0.1}
          marks={[
            { value: 0, label: '0' },
            { value: 1, label: '1' },
            { value: 2, label: '2' },
          ]}
          sx={{
            '& .MuiSlider-mark': {
              width: '4px',
              height: '4px',
              borderRadius: '50%',
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }
          }}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ 
              fontWeight: 500,
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
            }}>
              Top P
            </Typography>
            <Tooltip title="Controls diversity of word choices. Lower values (e.g., 0.1) make the output more focused on highly probable words, higher values (e.g., 0.9) allow more diverse word choices." placement="right">
              <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <span style={{ 
            fontFamily: 'var(--font-mono)',
            color: theme.palette.primary.main,
            fontSize: '0.8125rem'
          }}>
            {settings.topP}
          </span>
        </Box>
        <Slider
          value={settings.topP}
          onChange={(_, value) => handleSettingChange('topP', value as number)}
          min={0}
          max={1}
          step={0.1}
          marks={[
            { value: 0, label: '0' },
            { value: 0.5, label: '0.5' },
            { value: 1, label: '1' },
          ]}
          sx={{
            '& .MuiSlider-mark': {
              width: '4px',
              height: '4px',
              borderRadius: '50%',
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
            }
          }}
        />
      </Box>

      {!autoApply && (
        <Button
          variant="contained"
          fullWidth
          sx={{ 
            mt: 2,
            py: 1.25,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.9375rem',
            letterSpacing: '-0.025em',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              bgcolor: alpha(theme.palette.primary.main, 0.9)
            }
          }}
          onClick={() => onSettingsSave(settings)}
        >
          Apply Settings
        </Button>
      )}
    </Box>
  );
};

export default AzureOpenAISettings; 