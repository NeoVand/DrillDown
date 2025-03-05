import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppContextProvider, useAppContext } from './context/AppContext';
import { CanvasProvider } from './context/CanvasContext';
import MainLayout from './components/MainLayout';
import OllamaConnectionModal from './components/OllamaConnectionModal';
import LeftPanel from './components/LeftPanel';
import DiagramView from './components/DiagramView';
import RightPanel from './components/RightPanel';
import './App.css';

// Define theme context
interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  toggleMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// App wrapper component
function App() {
  // Use state for theme preference
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  
  const toggleMode = () => {
    setMode((prevMode: 'light' | 'dark') => (prevMode === 'light' ? 'dark' : 'light'));
  };
  
  // Create theme based on mode
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'dark' ? '#90caf9' : '#1976d2',
          },
          secondary: {
            main: mode === 'dark' ? '#f48fb1' : '#dc004e',
          },
          background: {
            default: mode === 'dark' ? '#121212' : '#f5f5f5',
            paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                borderRadius: 8,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
              },
            },
          },
          MuiTextField: {
            defaultProps: {
              variant: 'outlined',
              size: 'small',
            },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8,
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'dark' 
                  ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
              },
            },
          },
          MuiListItem: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 6,
              },
            },
          },
          MuiTooltip: {
            styleOverrides: {
              tooltip: {
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                color: mode === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.75rem',
                borderRadius: 4,
                padding: '6px 12px',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContextProvider>
          <CanvasProvider>
            <AppContent />
          </CanvasProvider>
        </AppContextProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Content component that uses the AppContext
function AppContent() {
  const { isOllamaConnected, ollcamaConnectionError } = useAppContext();
  const [showConnectionModal, setShowConnectionModal] = useState(!isOllamaConnected);
  
  // Close the connection modal
  const handleCloseModal = () => {
    setShowConnectionModal(false);
  };
  
  // Show the modal again if connection is lost
  useEffect(() => {
    if (!isOllamaConnected) {
      setShowConnectionModal(true);
    }
  }, [isOllamaConnected]);
  
  return (
    <>
      <MainLayout 
        leftPanel={<LeftPanel />}
        mainContent={null}
        rightPanel={<RightPanel />}
      />
      <OllamaConnectionModal 
        open={showConnectionModal}
        onClose={handleCloseModal}
        isConnected={isOllamaConnected}
        error={ollcamaConnectionError || undefined}
      />
    </>
  );
}

export default App;
