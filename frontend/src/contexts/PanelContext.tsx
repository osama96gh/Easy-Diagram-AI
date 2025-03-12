import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Enhanced panel state interface
export interface PanelState {
  id: string;
  isExpanded: boolean;
  defaultFlex: number;
  expandedFlex: number;
  collapsedWidth: string;
  orientation: 'horizontal' | 'vertical';
  minSize?: string;
  maxSize?: string;
  position: 'left' | 'center' | 'right' | 'bottom';
}

// Define the structure for all panels' states
export interface PanelsState {
  [key: string]: PanelState;
}

// Define the context interface
interface PanelContextType {
  panelStates: PanelsState;
  togglePanelExpansion: (panelId: string) => void;
  getPanelStyle: (panelId: string) => React.CSSProperties;
  isPanelExpanded: (panelId: string) => boolean;
  resetPanelLayout: () => void;
}

// Create the context with a default value
const PanelContext = createContext<PanelContextType | undefined>(undefined);

// Initial panel states factory function
const createInitialPanelStates = (): PanelsState => ({
  leftPanel: {
    id: 'leftPanel',
    isExpanded: true,
    defaultFlex: 1,
    expandedFlex: 2,
    collapsedWidth: '40px',
    orientation: 'horizontal',
    position: 'left'
  },
  centerPanel: {
    id: 'centerPanel',
    isExpanded: true,
    defaultFlex: 2,
    expandedFlex: 3,
    collapsedWidth: '40px',
    orientation: 'horizontal',
    position: 'center'
  },
  rightPanel: {
    id: 'rightPanel',
    isExpanded: true,
    defaultFlex: 1,
    expandedFlex: 2,
    collapsedWidth: '40px',
    orientation: 'horizontal',
    position: 'right'
  },
  bottomPanel: {
    id: 'bottomPanel',
    isExpanded: true,
    defaultFlex: 1,
    expandedFlex: 1,
    collapsedWidth: '40px',
    orientation: 'vertical',
    position: 'bottom'
  },
});

// Provider component
export const PanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelStates, setPanelStates] = useState<PanelsState>(() => {
    // Try to load saved panel states from localStorage
    const savedStates = localStorage.getItem('panelStates');
    if (savedStates) {
      try {
        return JSON.parse(savedStates);
      } catch (e) {
        console.error('Failed to parse saved panel states:', e);
      }
    }
    return createInitialPanelStates();
  });

  // Save panel states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('panelStates', JSON.stringify(panelStates));
  }, [panelStates]);

  // Reset panel layout to default
  const resetPanelLayout = () => {
    setPanelStates(createInitialPanelStates());
  };

  // Toggle a panel's expansion state
  const togglePanelExpansion = (panelId: string) => {
    setPanelStates((prevStates) => ({
      ...prevStates,
      [panelId]: {
        ...prevStates[panelId],
        isExpanded: !prevStates[panelId].isExpanded,
      },
    }));
  };

  // Calculate the flex value for a panel based on all panels' states
  const calculateFlexValue = (panelId: string): string => {
    const panel = panelStates[panelId];
    
    if (!panel.isExpanded) {
      return `0 0 ${panel.collapsedWidth}`;
    }
    
    // For horizontal panels (left, center, right)
    if (panel.orientation === 'horizontal') {
      // Make centerPanel (diagram preview) the only one that grows dynamically
      if (panelId === 'centerPanel') {
        // Use flex-grow: 1 to make it fill available space
        return `1 1 auto`;
      } else {
        // For leftPanel and rightPanel, use fixed width with no growing
        return `0 0 auto`;
      }
    }
    
    // Use default flex for vertical panels (bottom panel)
    return `${panel.defaultFlex}`;
  };

  // Get the CSS style for a panel
  const getPanelStyle = (panelId: string): React.CSSProperties => {
    const panel = panelStates[panelId];
    
    const style: React.CSSProperties = {
      flex: calculateFlexValue(panelId),
    };
    
    // Add min/max size constraints if defined
    if (panel.minSize) {
      style.minWidth = panel.orientation === 'horizontal' ? panel.minSize : undefined;
      style.minHeight = panel.orientation === 'vertical' ? panel.minSize : undefined;
    }
    
    if (panel.maxSize) {
      style.maxWidth = panel.orientation === 'horizontal' ? panel.maxSize : undefined;
      style.maxHeight = panel.orientation === 'vertical' ? panel.maxSize : undefined;
    }
    
    return style;
  };

  // Check if a panel is expanded
  const isPanelExpanded = (panelId: string): boolean => {
    return panelStates[panelId]?.isExpanded || false;
  };

  // Provide the context value
  const contextValue: PanelContextType = {
    panelStates,
    togglePanelExpansion,
    getPanelStyle,
    isPanelExpanded,
    resetPanelLayout,
  };

  return (
    <PanelContext.Provider value={contextValue}>
      {children}
    </PanelContext.Provider>
  );
};

// Custom hook to use the panel context
export const usePanelContext = (): PanelContextType => {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error('usePanelContext must be used within a PanelProvider');
  }
  return context;
};
