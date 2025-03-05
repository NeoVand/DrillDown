import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { useAppContext } from '../context/AppContext';

interface ProjectButtonsProps {
  onNewProject: () => void;
}

const ProjectButtons: React.FC<ProjectButtonsProps> = ({ onNewProject }) => {
  const { currentProject } = useAppContext();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2,
    }}>
      <Button 
        variant="text" 
        startIcon={<AddIcon />}
        onClick={onNewProject}
        size="small"
        color="primary"
        sx={{ 
          textTransform: 'none',
          color: 'primary.light',
          '&:hover': {
            color: 'primary.main',
          }
        }}
      >
        New
      </Button>
      <Button 
        variant="text" 
        startIcon={<SaveIcon />}
        disabled={!currentProject}
        size="small"
        color="primary"
        sx={{ 
          textTransform: 'none',
          color: 'primary.light',
          '&:hover': {
            color: 'primary.main',
          }
        }}
      >
        Save
      </Button>
      <Button 
        variant="text" 
        startIcon={<FolderOpenIcon />}
        size="small"
        color="primary"
        sx={{ 
          textTransform: 'none',
          color: 'primary.light',
          '&:hover': {
            color: 'primary.main',
          }
        }}
      >
        Load
      </Button>
    </Box>
  );
};

export default ProjectButtons; 