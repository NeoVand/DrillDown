import React from 'react';
import { Box, useTheme as useMuiTheme } from '@mui/material';
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle,
  ImperativePanelHandle
} from 'react-resizable-panels';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import '../styles/PanelLayout.css';
import { useTheme } from '../App';

interface PanelLayoutProps {
  activeTab: string;
  onTabChange: (tabName: string) => void;
}

const PanelLayout: React.FC<PanelLayoutProps> = ({ activeTab, onTabChange }) => {
  // Create refs to imperatively control panels if needed
  const leftPanelRef = React.useRef<ImperativePanelHandle>(null);
  const rightPanelRef = React.useRef<ImperativePanelHandle>(null);
  
  // Get app theme mode
  const { mode } = useTheme();
  
  // Get MUI theme for colors
  const muiTheme = useMuiTheme();

  // Handle resize to save state (optional)
  const handleResize = React.useCallback((sizes: number[]) => {
    localStorage.setItem('panelSizes', JSON.stringify(sizes));
  }, []);

  // Get saved panel sizes or use defaults
  const getInitialSizes = React.useCallback(() => {
    const savedSizes = localStorage.getItem('panelSizes');
    if (savedSizes) {
      try {
        return JSON.parse(savedSizes);
      } catch (e) {
        console.error('Error parsing saved panel sizes', e);
      }
    }
    // Default gives left panel 40% of the width
    return [40, 60];
  }, []);
  
  // Adjust opacity based on theme mode
  const bgOpacity = mode === 'light' ? '0.15' : '0.20';
  const hoverOpacity = mode === 'light' ? '0.25' : '0.30';
  const activeOpacity = mode === 'light' ? '0.35' : '0.40';
  const lineOpacity = mode === 'light' ? '0.5' : '0.5';

  // Get colors from MUI theme
  const primaryColor = muiTheme.palette.primary.main;
  const primaryLightColor = muiTheme.palette.primary.light;

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <PanelGroup 
        direction="horizontal" 
        onLayout={handleResize}
        style={{ height: '100%' }}
      >
        {/* Left Panel (Chat) */}
        <Panel 
          defaultSize={getInitialSizes()[0]} 
          minSize={25} 
          maxSize={75}
          ref={leftPanelRef}
          style={{ height: '100%' }}
        >
          <LeftPanel />
        </Panel>
        
        {/* Resize Handle */}
        <PanelResizeHandle 
          style={{
            width: '8px',
            background: `${primaryColor}${bgOpacity.replace('0.', '')}`, // Use primary color with opacity
            cursor: 'col-resize',
            transition: 'background 0.2s',
          }}
          className="resize-handle"
          onDragging={(isDragging) => {
            // Apply active state when dragging
            const handle = document.querySelector('.resize-handle') as HTMLElement;
            if (handle) {
              handle.style.background = isDragging 
                ? `${primaryColor}${activeOpacity.replace('0.', '')}` 
                : `${primaryColor}${bgOpacity.replace('0.', '')}`;
            }
          }}
          onMouseOver={() => {
            // Apply hover state
            const handle = document.querySelector('.resize-handle') as HTMLElement;
            if (handle) {
              handle.style.background = `${primaryColor}${hoverOpacity.replace('0.', '')}`;
            }
          }}
          onMouseOut={() => {
            // Reset to default if not dragging
            const handle = document.querySelector('.resize-handle') as HTMLElement;
            const activeHandle = document.querySelector('.resize-handle:active');
            if (handle && !activeHandle) {
              handle.style.background = `${primaryColor}${bgOpacity.replace('0.', '')}`;
            }
          }}
        >
          <div 
            className="handle-line" 
            style={{
              width: '2px',
              height: '30px',
              background: mode === 'light' 
                ? `${primaryLightColor}${lineOpacity.replace('0.', '')}` 
                : `${muiTheme.palette.divider}${'80'.replace('0.', '')}`, // Use divider color from theme instead of primary color
              margin: '0 auto',
              borderRadius: '1px',
              position: 'relative',
              top: 'calc(50% - 15px)'
            }}
          />
        </PanelResizeHandle>
        
        {/* Right Panel (Diagram, etc.) */}
        <Panel 
          defaultSize={getInitialSizes()[1]} 
          minSize={25} 
          ref={rightPanelRef}
          style={{ height: '100%' }}
        >
          <RightPanel activeTab={activeTab} onTabChange={onTabChange} />
        </Panel>
      </PanelGroup>
    </Box>
  );
};

export default PanelLayout; 