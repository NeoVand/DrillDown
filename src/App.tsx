import { useState, useEffect, useMemo, createContext, useContext } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import './App.css'
import { AppContextProvider, useAppContext } from './context/AppContext'
import PanelLayout from './components/PanelLayout'

// Create ThemeContext for theme switching
export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Main App component wrapper
function App() {
  const [mode, setMode] = useState<ThemeMode>('light');

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Create theme based on current mode
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: '#3b82f6', // Tailwind blue-500
          light: '#60a5fa', // Tailwind blue-400
          dark: '#2563eb', // Tailwind blue-600
        },
        secondary: {
          main: '#f59e0b', // Tailwind amber-500
          light: '#fbbf24', // Tailwind amber-400
          dark: '#d97706', // Tailwind amber-600
        },
        background: {
          default: mode === 'light' ? '#f8fafc' : '#0f172a', // Tailwind slate-50 or slate-900
          paper: mode === 'light' ? '#ffffff' : '#1e293b',  // White or slate-800
        },
        error: {
          main: '#ef4444', // Tailwind red-500
        },
        warning: {
          main: '#f59e0b', // Tailwind amber-500
        },
        info: {
          main: '#3b82f6', // Tailwind blue-500
        },
        success: {
          main: '#10b981', // Tailwind emerald-500
        },
        text: {
          primary: mode === 'light' ? '#1e293b' : '#f1f5f9', // Tailwind slate-800 or slate-100
          secondary: mode === 'light' ? '#64748b' : '#94a3b8', // Tailwind slate-500 or slate-400
        },
        divider: mode === 'light' ? '#e2e8f0' : '#334155', // Tailwind slate-200 or slate-700
      },
      typography: {
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600,
        h1: {
          fontSize: '2.5rem',
          fontWeight: 600,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 600,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 600,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 600,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 600,
        },
        body1: {
          lineHeight: 1.5,
        },
        body2: {
          lineHeight: 1.5,
        },
        button: {
          fontWeight: 500,
          textTransform: 'none',
        },
      },
      shape: {
        borderRadius: 0,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
              },
            },
          },
        },
        MuiTextField: {
          defaultProps: {
            variant: 'outlined',
            size: 'small',
          },
        },
        MuiPaper: {
          defaultProps: {
            elevation: 0,
            square: true,
          },
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              borderRadius: 0,
            },
          },
        },
        MuiCard: {
          defaultProps: {
            square: true,
          },
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              borderRadius: 0,
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContextProvider>
          <AppContent />
        </AppContextProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// Content component that uses the AppContext
function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('diagram');
  const { aiService, modelProvider } = useAppContext();
  
  // Update the RCA agent with the current tab whenever it changes
  useEffect(() => {
    if (aiService && modelProvider === 'ollama') {
      // Only for RCAAgentService
      try {
        const rcaService = aiService as any;
        if (rcaService.setActiveTab) {
          rcaService.setActiveTab(activeTab);
        }
      } catch (error) {
        console.error('Error setting active tab for RCA agent:', error);
      }
    }
  }, [activeTab, aiService, modelProvider]);

  // Handle tab changes from RightPanel
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column', 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      m: 0,
      p: 0
    }}>
      {/* Use our new resizable panel layout */}
      <PanelLayout activeTab={activeTab} onTabChange={handleTabChange} />
    </Box>
  );
}

export default App;
