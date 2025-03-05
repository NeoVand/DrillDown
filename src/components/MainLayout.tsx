import React from 'react';
import { Box, Grid } from '@mui/material';

interface MainLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  mainContent: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  leftPanel, 
  rightPanel,
  mainContent
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      m: 0,
      p: 0
    }}>
      <Grid container sx={{ 
        width: '100%', 
        height: '100%', 
        m: 0, 
        p: 0, 
        spacing: 0,
        flexWrap: 'nowrap'
      }}>
        <Grid item xs={12} md={4} lg={3} sx={{ 
          height: '100%', 
          borderRight: '1px solid #e2e8f0', 
          display: 'flex',
          flexDirection: 'column',
          m: 0,
          p: 0
        }}>
          {leftPanel}
        </Grid>
        <Grid item xs={12} md={8} lg={9} sx={{ 
          height: '100%', 
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          m: 0,
          p: 0
        }}>
          {rightPanel}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MainLayout; 