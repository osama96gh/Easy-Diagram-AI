import React from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { usePanelContext } from '../../../contexts/PanelContext';
import './BasePanel.css';

export interface BasePanelProps {
  title: string;
  panelId: string;
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  headerContent?: React.ReactNode;
}

/**
 * BasePanel component that encapsulates common panel functionality
 * Used as a foundation for all panel components
 */
const BasePanel: React.FC<BasePanelProps> = ({
  title,
  panelId,
  children,
  orientation = 'horizontal',
  className = '',
  headerContent
}) => {
  const { isPanelExpanded, togglePanelExpansion, getPanelStyle } = usePanelContext();
  const isExpanded = isPanelExpanded(panelId);
  
  // Determine the appropriate CSS class based on the panel type and orientation
  const panelClass = orientation === 'horizontal' 
    ? (panelId === 'rightPanel' ? 'diagram-list-panel' : 'editor-panel') 
    : 'command-box';
  
  // Determine the appropriate header class
  const headerClass = `${panelClass}-header`;
  
  return (
    <div 
      className={`${panelClass} ${isExpanded ? '' : 'collapsed'} ${className}`}
      style={getPanelStyle(panelId)}
    >
      <div className={headerClass}>
        <h2>{title}</h2>
        {isExpanded && headerContent}
        <button 
          className="toggle-arrow" 
          onClick={() => togglePanelExpansion(panelId)}
          aria-label={isExpanded ? `Hide ${title}` : `Show ${title}`}
        >
          {orientation === 'horizontal' ? 
            (isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />) : 
            (isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowUpIcon />)}
        </button>
      </div>
      {isExpanded && children}
    </div>
  );
};

export default BasePanel;
