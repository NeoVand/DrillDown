import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, IconButton, Tooltip, Divider, Card, CardContent } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import { useAppContext } from '../context/AppContext';

// Define the slide interface
interface Slide {
  title: string;
  content: string;
  notes: string;
}

// Mock slides for demonstration
const initialSlides: Slide[] = [
  {
    title: 'Root Cause Analysis',
    content: 'System Outage Incident - March 15, 2023',
    notes: 'Introduction slide for the presentation'
  },
  {
    title: 'Problem Statement',
    content: 'System outage occurred on March 15, 2023, affecting customer-facing applications for 2 hours.',
    notes: 'Clearly define the problem that occurred'
  },
  {
    title: 'Root Causes Identified',
    content: '1. Database Connection Pool Exhaustion\n2. Memory Leak in Connection Handling',
    notes: 'Explain the primary causes that led to the incident'
  },
  {
    title: 'Evidence',
    content: '• Connection pool metrics at 100%\n• Memory usage increasing over time\n• Log analysis revealed connection timeout errors',
    notes: 'Present the evidence that supports your findings'
  },
  {
    title: 'Recommendations',
    content: '1. Implement proper connection closing\n2. Add monitoring and alerts\n3. Configure memory leak detection\n4. Review connection pool policies',
    notes: 'Provide clear recommendations to prevent future incidents'
  },
  {
    title: 'Action Plan',
    content: '• Fix connection handling code (Dev Team)\n• Configure monitoring alerts (Ops Team)\n• Update connection pool settings (DBA)',
    notes: 'Outline specific actions with owners and timelines'
  },
  {
    title: 'Questions?',
    content: 'Thank you for your attention',
    notes: 'Closing slide for questions and discussion'
  }
];

const SlideView = () => {
  const { currentProject, saveProject } = useAppContext();
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load slides from project if available
  useEffect(() => {
    if (currentProject?.slides) {
      try {
        // Try to parse the slides from the string in the project
        const parsedSlides = JSON.parse(currentProject.slides);
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          setSlides(parsedSlides);
        }
      } catch (error) {
        console.error('Error parsing slides:', error);
      }
    }
  }, [currentProject]);

  // Navigate between slides
  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Generate slides from report using AI
  const generateSlidesFromReport = () => {
    // In a real implementation, this would call the AI service
    // For now, we'll just use the initial slides
    setSlides(initialSlides);
    setCurrentSlideIndex(0);
  };

  // Save slides to project
  const saveSlides = () => {
    if (!currentProject) return;
    
    setIsSaving(true);
    
    saveProject({
      ...currentProject,
      slides: JSON.stringify(slides),
      updatedAt: new Date(),
    });
    
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  // Export slides as PDF (mock implementation)
  const exportSlides = () => {
    alert('In a real implementation, this would export slides as PDF');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden',
      bgcolor: '#f8fafc'
    }}>
      {/* Toolbar */}
      <Paper elevation={0} sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Presentation Slides
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Slide {currentSlideIndex + 1} of {slides.length}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Generate slides from report">
            <Button 
              variant="outlined" 
              startIcon={<AutoFixHighIcon />}
              size="small"
              onClick={generateSlidesFromReport}
              disabled={!currentProject?.report}
            >
              Generate
            </Button>
          </Tooltip>
          
          <Tooltip title="Export slides">
            <IconButton 
              size="small" 
              onClick={exportSlides}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Button 
            variant="contained" 
            size="small"
            onClick={saveSlides}
            disabled={!currentProject || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Slides'}
          </Button>
        </Box>
      </Paper>
      
      {/* Slide Preview */}
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative'
      }}>
        {/* Slide navigation */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 0, 
          right: 0, 
          display: 'flex', 
          justifyContent: 'center',
          gap: 2
        }}>
          <IconButton 
            onClick={goToPrevSlide} 
            disabled={currentSlideIndex === 0}
            sx={{ bgcolor: 'white', boxShadow: 1 }}
          >
            <NavigateBeforeIcon />
          </IconButton>
          
          <IconButton 
            onClick={toggleFullscreen}
            sx={{ bgcolor: 'white', boxShadow: 1 }}
          >
            <FullscreenIcon />
          </IconButton>
          
          <IconButton 
            onClick={goToNextSlide} 
            disabled={currentSlideIndex === slides.length - 1}
            sx={{ bgcolor: 'white', boxShadow: 1 }}
          >
            <NavigateNextIcon />
          </IconButton>
        </Box>
        
        {/* Current slide */}
        <Card 
          elevation={3} 
          sx={{ 
            width: isFullscreen ? '100%' : '80%', 
            height: isFullscreen ? '100%' : '70%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'white',
            transition: 'all 0.3s ease',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Slide header */}
          <Box sx={{ 
            bgcolor: '#3b82f6', 
            color: 'white', 
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
              {slides[currentSlideIndex]?.title || 'Slide Title'}
            </Typography>
          </Box>
          
          {/* Slide content */}
          <CardContent sx={{ 
            flexGrow: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            p: 4
          }}>
            <Typography variant="h6" sx={{ whiteSpace: 'pre-line' }}>
              {slides[currentSlideIndex]?.content || 'Slide content goes here'}
            </Typography>
          </CardContent>
        </Card>
        
        {/* Slide notes */}
        <Paper elevation={1} sx={{ 
          width: isFullscreen ? '100%' : '80%', 
          mt: 2, 
          p: 2,
          borderRadius: 2,
          bgcolor: '#fffbeb',
          border: '1px dashed #f59e0b'
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            <strong>Speaker Notes:</strong> {slides[currentSlideIndex]?.notes || 'No notes for this slide'}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default SlideView; 