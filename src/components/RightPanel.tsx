import React, { useState, lazy, Suspense } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Paper, 
  CircularProgress,
  Modal,
  Typography,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import DescriptionIcon from '@mui/icons-material/Description';
import SlideshowIcon from '@mui/icons-material/Slideshow';
// Import components lazily
const DiagramView = lazy(() => import('./DiagramView'));
const ReportView = lazy(() => import('./ReportView'));
const SlidesView = lazy(() => import('./SlidesView'));
import { useAppContext } from '../context/AppContext';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import ProjectButtons from './ProjectButtons';

interface RightPanelProps {
  activeTab?: string;
  onTabChange?: (tabName: string) => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  activeTab: externalActiveTab,
  onTabChange: externalOnTabChange
}) => {
  const { currentProject, createNewProject } = useAppContext();
  const [internalActiveTab, setInternalActiveTab] = useState('diagram');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const theme = useTheme();
  
  // Determine whether to use internal or external state
  const activeTab = externalActiveTab || internalActiveTab;
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    // Update internal state
    setInternalActiveTab(newValue);
    
    // Notify parent component if onTabChange prop is provided
    if (externalOnTabChange) {
      externalOnTabChange(newValue);
    }
  };

  const handleNewProject = () => {
    setIsNewProjectModalOpen(true);
  };
  
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject = createNewProject(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsNewProjectModalOpen(false);
    }
  };
  
  const handleCloseNewProjectModal = () => {
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  // Render tab content with suspense fallback
  const renderTabContent = () => {
    return (
      <Suspense fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      }>
        {activeTab === 'diagram' && <DiagramView />}
        {activeTab === 'report' && <ReportView />}
        {activeTab === 'slide' && <SlidesView />}
      </Suspense>
    );
  };

  return (
    <Box className="right-panel" sx={{ 
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderRadius: 0,
      m: 0,
      p: 0
    }}>
      <Paper 
        className="tabs-header" 
        sx={{ 
          p: 0,
          display: 'flex', 
          alignItems: 'center',
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0
        }}
      >
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            minHeight: 48,
            borderRadius: 0,
            '& .MuiTab-root': {
              borderRadius: 0,
              minHeight: 48,
              color: 'text.secondary',
              opacity: 0.7,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: 'primary.main',
                opacity: 1,
                fontWeight: 'medium'
              }
            },
            '& .MuiTab-root:not(.Mui-selected) .MuiSvgIcon-root': {
              color: 'primary.light'
            },
            '& .Mui-selected .MuiSvgIcon-root': {
              color: 'primary.main'
            }
          }}
        >
          <Tab 
            icon={<AccountTreeIcon />} 
            iconPosition="start" 
            label="Diagram" 
            value="diagram" 
          />
          <Tab 
            icon={<DescriptionIcon />} 
            iconPosition="start" 
            label="Report" 
            value="report" 
          />
          <Tab 
            icon={<SlideshowIcon />} 
            iconPosition="start" 
            label="Slide" 
            value="slide" 
          />
        </Tabs>
        
        <Box sx={{ 
          ml: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          pr: 2,
          gap: 0.5
        }}>
          <ProjectButtons onNewProject={handleNewProject} />
          <ThemeToggle />
          <UserMenu />
        </Box>
      </Paper>

      <Box 
        className="tab-content" 
        sx={{ 
          flexGrow: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {renderTabContent()}
      </Box>
      
      {/* New Project Modal */}
      <Modal
        open={isNewProjectModalOpen}
        onClose={handleCloseNewProjectModal}
        aria-labelledby="new-project-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          p: 4,
        }}>
          <Typography id="new-project-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
            Create New Project
          </Typography>
          <TextField
            autoFocus
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Project Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCloseNewProjectModal}>Cancel</Button>
            <Button 
              onClick={handleCreateProject}
              variant="contained"
              disabled={!newProjectName.trim()}
            >
              Create
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default RightPanel; 