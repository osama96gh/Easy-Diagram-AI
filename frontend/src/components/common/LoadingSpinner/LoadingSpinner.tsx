import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {
  return <div className={`spinner ${className || ''}`} />;
};
