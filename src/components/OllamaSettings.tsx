import React, { useEffect, useState, useCallback } from 'react';
import {
  Typography,
  FormControl,
  Select,
  MenuItem,
  Slider,
  TextField,
  Checkbox,
  FormControlLabel,
  Box,
  Button,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
  IconButton,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import MemoryIcon from '@mui/icons-material/Memory';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CasinoIcon from '@mui/icons-material/Casino';
import { fetchWithCORS, checkOllamaConnection, getOllamaStartCommand } from '../config/api';
import { OllamaSettings as OllamaSettingsType } from '../types';
import { useAppContext } from '../context/AppContext';

interface OllamaSettingsProps {
  onSettingsSave: (settings: OllamaSettingsType) => void;
  autoApply?: boolean;
  hideTitle?: boolean;
  initialSettings?: OllamaSettingsType;
  onHelp?: () => void;
}

const OllamaSettings: React.FC<OllamaSettingsProps> = ({ 
  onSettingsSave, 
  autoApply = false, 
  hideTitle = false, 
  initialSettings, 
  onHelp 
}) => {
  const theme = useTheme();
  const { isOllamaConnected, checkOllamaConnection: recheckConnection } = useAppContext();
  const [settings, setSettings] = useState<OllamaSettingsType>(initialSettings || {
    model: '',
    temperature: 0.7,
    topP: 0.9,
    useFixedSeed: false,
    seed: 42,
    numCtx: 2048,
    streaming: true, // Always enable streaming by default
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Memoize the fetch models function
  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const { connected, error: connectionError } = await checkOllamaConnection();
      
      if (!connected) {
        throw new Error(connectionError || 'Failed to connect to Ollama');
      }

      const response = await fetchWithCORS('/api/tags');
      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];
      setAvailableModels(models);
      setError(null);
      
      // Just update the settings state without calling onSettingsSave directly
      setSettings(currentSettings => {
        if (models.length > 0 && !currentSettings.model) {
          return { ...currentSettings, model: models[0] };
        }
        return currentSettings;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching models:', errorMessage);
      setError(`Cannot connect to Ollama. ${getOllamaStartCommand()}`);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid render loops

  // Effect to check connection status
  const checkConnection = async () => {
    setIsCheckingConnection(true);
    await recheckConnection();
    setIsCheckingConnection(false);
  };

  // Function to handle help button click with connection status check
  const handleHelpClick = () => {
    if (onHelp) {
      onHelp();
    }
  };

  // Fetch models on mount only
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Effect to handle the case when we need to update model after fetching
  useEffect(() => {
    // Only apply the setting when autoApply is true and settings has a model
    if (autoApply && settings.model && !initialSettings?.model) {
      onSettingsSave(settings);
    }
  }, [autoApply, settings.model, onSettingsSave, initialSettings?.model]);

  // Add effect to update settings when initialSettings changes
  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...initialSettings,
        streaming: true, // Always force streaming to be true
      });
    }
  }, [initialSettings]);

  const handleSettingChange = (field: keyof OllamaSettingsType, value: any) => {
    // If trying to disable streaming, ignore and keep it enabled
    if (field === 'streaming') {
      value = true; // Always force streaming to true
    }
    
    // First update the local state
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    
    // Then, if autoApply is enabled, use a requestAnimationFrame to ensure
    // the state update happens after rendering is complete
    if (autoApply) {
      // Use requestAnimationFrame to defer the state update to parent
      // This prevents the "Cannot update a component while rendering a different component" error
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
          mb: 2,
          color: theme.palette.primary.main 
        }}>
          <TuneIcon sx={{ fontSize: '1.25rem' }} />
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 600,
              letterSpacing: '-0.01em'
            }}
          >
            Model Settings
          </Typography>
          
          {/* Connection status chip */}
          <Chip
            size="small"
            icon={isOllamaConnected ? <CheckCircleIcon fontSize="small" /> : <ErrorIcon fontSize="small" />}
            label={isOllamaConnected ? "Connected" : "Disconnected"}
            color={isOllamaConnected ? "success" : "error"}
            sx={{ ml: 1 }}
          />
          
          <Tooltip title="Get help with Ollama connection" placement="right">
            <Button 
              size="small" 
              onClick={handleHelpClick}
              variant="outlined"
              startIcon={<HelpOutlineIcon fontSize="small" />}
              sx={{ 
                ml: 'auto',
                minWidth: 0,
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: 500
              }}
            >
              Help
            </Button>
          </Tooltip>
        </Box>
      )}

      <FormControl 
        fullWidth 
        size="small"
        sx={{ 
          mb: 2,
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          }
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 0.5 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MemoryIcon sx={{ 
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              mr: 0.5
            }} />
            <Typography sx={{ 
              fontWeight: 500,
              color: theme.palette.text.secondary,
              fontSize: '0.825rem',
            }}>
              Model
            </Typography>
            <Tooltip title="Select the AI model to use for generation. Different models may have different capabilities and performance characteristics." placement="right">
              <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Button
            size="small"
            onClick={checkConnection}
            disabled={isCheckingConnection}
            startIcon={isCheckingConnection ? <CircularProgress size={14} /> : null}
            sx={{ 
              minWidth: 0,
              px: 1.5,
              py: 0.25,
              textTransform: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          >
            {isCheckingConnection ? 'Checking...' : 'Refresh'}
          </Button>
        </Box>
        <Select
          value={settings.model || ''}
          onChange={(e) => handleSettingChange('model', e.target.value)}
          startAdornment={
            <MemoryIcon sx={{ 
              ml: 0.5, 
              mr: 1,
              fontSize: '1.25rem',
              color: theme.palette.primary.main,
              opacity: 0.8
            }} />
          }
          MenuProps={{
            autoFocus: false,
            disableAutoFocusItem: true,
            onClose: () => {
              const selectElement = document.querySelector('[aria-labelledby="model-select"]');
              if (selectElement) {
                (selectElement as HTMLElement).focus();
              }
            }
          }}
          id="model-select"
          size="small"
        >
          {loading ? (
            <MenuItem disabled>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                <CircularProgress size={14} />
                <Typography sx={{ fontSize: '0.875rem' }}>
                  Loading models...
                </Typography>
              </Box>
            </MenuItem>
          ) : error ? (
            <MenuItem disabled>
              <Typography color="error" sx={{ fontSize: '0.875rem' }}>
                {error}
              </Typography>
            </MenuItem>
          ) : (
            availableModels.map((model) => (
              <MenuItem 
                key={model} 
                value={model}
                sx={{
                  borderRadius: '6px',
                  mx: 0.5,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  }
                }}
              >
                {model}
              </MenuItem>
            ))
          )}
        </Select>
      </FormControl>

      {/* Grid for sliders side by side */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Temperature Slider */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ThermostatIcon sx={{ 
                fontSize: '1rem',
                color: theme.palette.text.secondary,
                mr: 0.5
              }} />
              <Typography sx={{ 
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontSize: '0.825rem',
              }}>
                Temperature
              </Typography>
              <Tooltip title="Controls randomness in the output. Higher values make the output more creative but less focused, lower values make it more deterministic and focused." placement="right">
                <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                  <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <span style={{ 
              fontFamily: 'var(--font-mono)',
              color: theme.palette.primary.main,
              fontSize: '0.75rem'
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
            size="small"
            sx={{
              mx: 1,
              width: 'calc(100% - 16px)',
              '& .MuiSlider-mark': {
                width: '3px',
                height: '3px',
                borderRadius: '50%',
              },
              '& .MuiSlider-markLabel': {
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                transform: 'none',
                '&[data-index="0"]': {
                  transform: 'translateX(0%)',
                  left: '0 !important'
                },
                '&[data-index="2"]': {
                  transform: 'translateX(0%)',
                  left: 'auto !important',
                  right: 0
                }
              }
            }}
          />
        </Grid>

        {/* Top P Slider */}
        <Grid item xs={12} sm={6}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon sx={{ 
                fontSize: '1rem',
                color: theme.palette.text.secondary,
                mr: 0.5
              }} />
              <Typography sx={{ 
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontSize: '0.825rem',
              }}>
                Top P
              </Typography>
              <Tooltip title="Controls diversity of word choices. Lower values make the output more focused, higher values allow more diverse word choices." placement="right">
                <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                  <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <span style={{ 
              fontFamily: 'var(--font-mono)',
              color: theme.palette.primary.main,
              fontSize: '0.75rem'
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
              { value: 1, label: '1' },
            ]}
            size="small"
            sx={{
              mx: 1,
              width: 'calc(100% - 16px)',
              '& .MuiSlider-mark': {
                width: '3px',
                height: '3px',
                borderRadius: '50%',
              },
              '& .MuiSlider-markLabel': {
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                transform: 'none',
                '&[data-index="0"]': {
                  transform: 'translateX(0%)',
                  left: '0 !important'
                },
                '&[data-index="1"]': {
                  transform: 'translateX(0%)',
                  left: 'auto !important',
                  right: 0
                }
              }
            }}
          />
        </Grid>
      </Grid>

      {/* Context Length Slider moved up before Fixed Seed */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.5 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ShowChartIcon sx={{ 
              fontSize: '1rem',
              color: theme.palette.text.secondary,
              mr: 0.5
            }} />
            <Typography sx={{ 
              fontWeight: 500,
              color: theme.palette.text.secondary,
              fontSize: '0.825rem',
            }}>
              Context Length
            </Typography>
            <Tooltip title="Maximum token context window to consider. Larger values may allow for more coherent responses but consume more resources." placement="right">
              <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <span style={{ 
            fontFamily: 'var(--font-mono)',
            color: theme.palette.primary.main,
            fontSize: '0.75rem'
          }}>
            {settings.numCtx}
          </span>
        </Box>
        <Slider
          value={settings.numCtx}
          onChange={(_, value) => handleSettingChange('numCtx', value as number)}
          min={512}
          max={16384}
          step={512}
          marks={[
            { value: 2048, label: '2K' },
            { value: 8192, label: '8K' },
            { value: 16384, label: '16K' },
          ]}
          size="small"
          sx={{
            mx: 1,
            width: 'calc(100% - 16px)',
            '& .MuiSlider-mark': {
              width: '3px',
              height: '3px',
              borderRadius: '50%',
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.7rem',
              fontFamily: 'var(--font-mono)',
              transform: 'none',
              '&[data-index="0"]': {
                transform: 'translateX(0%)',
                left: '0 !important'
              },
              '&[data-index="2"]': {
                transform: 'translateX(0%)',
                left: 'auto !important',
                right: 0
              }
            }
          }}
        />
      </Box>

      {/* Use Fixed Seed moved to bottom */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={settings.useFixedSeed}
                onChange={(e) => handleSettingChange('useFixedSeed', e.target.checked)}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CasinoIcon sx={{ 
                  fontSize: '1rem',
                  color: theme.palette.text.secondary,
                  mr: 0.5
                }} />
                <Typography sx={{ 
                  fontWeight: 500,
                  color: theme.palette.text.secondary,
                  fontSize: '0.825rem',
                }}>
                  Use Fixed Seed
                </Typography>
                <Tooltip title="Using a fixed seed helps produce more consistent outputs for the same input." placement="right">
                  <IconButton size="small" sx={{ ml: 0.5, opacity: 0.7 }}>
                    <HelpOutlineIcon sx={{ fontSize: '0.8rem' }} />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        </Box>
        
        {settings.useFixedSeed && (
          <TextField
            label="Seed"
            type="number"
            value={settings.seed}
            onChange={(e) => handleSettingChange('seed', parseInt(e.target.value))}
            size="small"
            sx={{ 
              width: '120px',
              ml: 2
            }}
            InputProps={{
              inputProps: { min: 0 },
              sx: {
                fontSize: '0.875rem',
              }
            }}
          />
        )}
      </Box>

      {!autoApply && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onSettingsSave(settings)}
            size="small"
          >
            Save Settings
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default OllamaSettings; 