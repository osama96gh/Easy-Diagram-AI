import React from 'react';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from '@mui/icons-material/Download';
import FullscreenIcon from '@mui/icons-material/Fullscreen';

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onDownloadImage: () => void;
  onFullScreen: () => void;
}

/**
 * ZoomControls component for controlling diagram zoom level and actions
 */
const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetView,
  onDownloadImage,
  onFullScreen
}) => {
  return (
    <div className="zoom-controls">
      <button
        className="zoom-button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOutIcon fontSize="small" />
      </button>
      
      <span className="zoom-level">
        {Math.round(scale * 100)}%
      </span>
      
      <button
        className="zoom-button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomInIcon fontSize="small" />
      </button>
      
      <button
        className="zoom-button reset-zoom"
        onClick={onResetView}
        aria-label="Reset view"
        title="Reset view"
      >
        <RestartAltIcon fontSize="small" />
      </button>
      
      <button
        className="zoom-button download"
        onClick={onDownloadImage}
        aria-label="Download diagram"
        title="Download diagram"
      >
        <DownloadIcon fontSize="small" />
      </button>
      
      <button
        className="zoom-button fullscreen"
        onClick={onFullScreen}
        aria-label="Full screen"
        title="Full screen"
      >
        <FullscreenIcon fontSize="small" />
      </button>
    </div>
  );
};

export default ZoomControls;
