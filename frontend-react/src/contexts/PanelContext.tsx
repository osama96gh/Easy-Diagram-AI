import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the structure for a panel's state
export interface PanelState {
  id: string;
  isExpanded: boolean;
  defaultFlex: number;
  expandedFlex: number;
  collapsedWidth: string;
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
}

// Create the context with a default value
const PanelContext = createContext<PanelContextType | undefined>(undefined);

// Initial panel states
const initialPanelStates: PanelsState = {
  leftPanel: {
    id: 'leftPanel',
    isExpanded: true,
    defaultFlex: 1,
    expandedFlex: 2,
    collapsedWidth: '40px',
  },
  centerPanel: {
    id: 'centerPanel',
    isExpanded: true,
    defaultFlex: 2,
    expandedFlex: 3,
    collapsedWidth: '40px',
  },
  bottomPanel: {
    id: 'bottomPanel',
    isExpanded: true,
    defaultFlex: 1,
    expandedFlex: 1,
    collapsedWidth: '40px',
  },
};

// Provider component
export const PanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [panelStates, setPanelStates] = useState<PanelsState>(initialPanelStates);

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
    
    // For horizontal panels (left and center)
    if (panelId === 'leftPanel' || panelId === 'centerPanel') {
      // If the other horizontal panel is collapsed, use expanded flex
      const otherPanelId = panelId === 'leftPanel' ? 'centerPanel' : 'leftPanel';
      if (!panelStates[otherPanelId].isExpanded) {
        return `${panel.expandedFlex}`;
      }
    }
    
    // Use default flex for normal cases
    return `${panel.defaultFlex}`;
  };

  // Get the CSS style for a panel
  const getPanelStyle = (panelId: string): React.CSSProperties => {
    const panel = panelStates[panelId];
    
    return {
      flex: calculateFlexValue(panelId),
    };
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
