import React from 'react';
import { Box } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`rca-tabpanel-${index}`}
      aria-labelledby={`rca-tab-${index}`}
      style={{ height: '100%', flexGrow: 1, overflow: 'auto' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%', p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

export default TabPanel; 