import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useAppContext } from '../context/AppContext';

const ReportView = () => {
  const { currentProject, aiService, saveProject } = useAppContext();
  const [report, setReport] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState<boolean>(false);

  // Update the report when the current project changes
  React.useEffect(() => {
    if (currentProject?.report) {
      setReport(currentProject.report);
    } else {
      setReport('');
    }
  }, [currentProject]);

  // Generate a report from the current diagram
  const generateReport = async () => {
    if (!currentProject || !aiService) return;
    
    setIsGenerating(true);
    
    try {
      const generatedReport = await aiService.generateReportFromDiagram(currentProject);
      setReport(generatedReport);
      
      // Save the report to the project
      if (currentProject) {
        saveProject({
          ...currentProject,
          report: generatedReport,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the report
  const saveReport = () => {
    if (!currentProject) return;
    
    saveProject({
      ...currentProject,
      report,
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center' 
      }}>
        <Typography variant="h6">Report</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={generateReport}
            disabled={!currentProject || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
          <Button
            variant="outlined"
            onClick={saveReport}
            disabled={!currentProject || !report}
          >
            Save Report
          </Button>
        </Box>
      </Box>
      
      <Paper 
        elevation={0} 
        sx={{ 
          flexGrow: 1, 
          p: 2, 
          border: '1px solid #e2e8f0',
          overflow: 'auto'
        }}
      >
        {report ? (
          <pre style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap' }}>
            {report}
          </pre>
        ) : (
          <Box sx={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'text.secondary'
          }}>
            <Typography variant="body1">
              {currentProject 
                ? 'Click "Generate Report" to create a report based on your diagram.' 
                : 'Select a project to generate a report.'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ReportView; 