import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTheme } from '../App';

const ThemeToggle = () => {
  const { mode, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
      <IconButton 
        onClick={toggleTheme} 
        size="small"
        sx={{ 
          p: 1,
          color: 'primary.light',
          '&:hover': {
            color: 'primary.main'
          }
        }}
      >
        {mode === 'light' ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle; 