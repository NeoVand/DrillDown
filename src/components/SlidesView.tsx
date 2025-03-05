import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';
import { useAppContext } from '../context/AppContext';
import { useTheme as useAppTheme } from '../App';

const SlidesView = () => {
  const { currentProject, aiService, saveProject } = useAppContext();
  const [slides, setSlides] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);
  
  // Get theme for styling
  const muiTheme = useTheme();
  const { mode } = useAppTheme();

  // Update the slides when the current project changes
  React.useEffect(() => {
    if (currentProject?.slides) {
      setSlides(currentProject.slides);
    } else {
      setSlides('');
    }
  }, [currentProject]);

  // Generate slides from the current report
  const generateSlides = async () => {
    if (!currentProject || !aiService || !currentProject.report) return;
    
    setIsGenerating(true);
    
    try {
      const generatedSlides = await aiService.generateSlidesFromReport(currentProject);
      setSlides(generatedSlides);
      
      // Save the slides to the project
      if (currentProject) {
        saveProject({
          ...currentProject,
          slides: generatedSlides,
        });
      }
    } catch (error) {
      console.error('Error generating slides:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the slides
  const saveSlides = () => {
    if (!currentProject) return;
    
    saveProject({
      ...currentProject,
      slides,
    });
  };

  // Format slides for display
  const formatSlides = (slides: string) => {
    // Split by slide separator
    const slideContents = slides.split('---');
    
    return slideContents.map((content, index) => (
      <Box 
        key={index}
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px',
          p: 3,
          mb: 4,
          bgcolor: 'background.paper',
          minHeight: '200px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.primary' }}>
          {content.trim()}
        </Typography>
      </Box>
    ));
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default',
      color: 'text.primary'
    }}>
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <Typography variant="h6">Slides</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateSlides}
            disabled={!currentProject || isGenerating || !currentProject?.report}
          >
            {isGenerating ? 'Generating...' : 'Generate Slides'}
          </Button>
          <Button
            variant="outlined"
            onClick={saveSlides}
            disabled={!currentProject || !slides}
          >
            Save Slides
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        px: 2,
        py: 1,
      }}>
        {slides ? (
          formatSlides(slides)
        ) : (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              {!currentProject
                ? 'Please select or create a project first'
                : !currentProject.report
                ? 'Generate a report first before creating slides'
                : 'Click "Generate Slides" to create presentation slides from your report'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default SlidesView; 