import React from 'react';
import { useLocationTracking } from '../../contexts/LocationTrackingContext';
import { MapPinIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface LocationStatusIndicatorProps {
  className?: string;
}

export function LocationStatusIndicator({ className = '' }: LocationStatusIndicatorProps) {
  const { state, config } = useLocationTracking();

  if (!state.isTracking) {
    return null;
  }

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStatusColor = () => {
    if (state.error) return 'text-red-500';
    if (state.lastUpdate) {
      const now = new Date();
      const diff = now.getTime() - state.lastUpdate.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 10) return 'text-green-500';
      if (minutes < 30) return 'text-yellow-500';
      return 'text-red-500';
    }
    return 'text-gray-500';
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <MapPinIcon className={`h-4 w-4 ${getStatusColor()}`} />
      <span className={`${getStatusColor()}`}>
        {state.error ? 'Location Error' : 'Location Tracking'}
      </span>
      {state.lastUpdate && !state.error && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <ClockIcon className="h-3 w-3" />
          <span>{formatLastUpdate(state.lastUpdate)}</span>
        </div>
      )}
      {state.error && (
        <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />
      )}
    </div>
  );
}

