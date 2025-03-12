import React, { useEffect, useState } from 'react';
import './StatusMessage.css';

export interface StatusMessageProps {
  message: string | null;
  type: 'loading' | 'error' | 'success' | 'info' | null;
  autoHide?: boolean;
  duration?: number;
  className?: string;
}

/**
 * StatusMessage component for displaying consistent status messages
 * across the application
 */
const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type,
  autoHide = true,
  duration = 3000,
  className = ''
}) => {
  const [visible, setVisible] = useState<boolean>(!!message);
  
  useEffect(() => {
    setVisible(!!message);
    
    // Auto-hide the message after the specified duration if autoHide is true
    if (autoHide && message && type === 'success') {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [message, type, autoHide, duration]);
  
  if (!message || !visible) return null;
  
  return (
    <div className={`status ${type || ''} ${className}`}>
      {message}
    </div>
  );
};

export default StatusMessage;
