// src/components/StatusIndicators.jsx
import React from 'react';
import { useMeet } from '../context/MeetContext';

export function StatusIndicators() {
  const { deviceStates, currentTime } = useMeet();

  return (
    <div className="fixed top-4 right-20 z-50"> {/* Changed positioning */}
      <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-sm text-white/90">{currentTime}</span>
        <div className="h-4 w-[1px] bg-white/20" />
        <div className="flex items-center space-x-2">
          {['glasses', 'wrist', 'ring'].map((device) => (
            <div key={device} className="relative group">
              <div 
                className={`h-2 w-2 rounded-full ${
                  deviceStates?.[device]?.connected ? 'bg-green-500' : 'bg-red-500'
                } shadow-md`}
              />
              
              <div className="absolute -top-8 right-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {device.charAt(0).toUpperCase() + device.slice(1)}: 
                  {deviceStates?.[device]?.connected ? ' Connected' : ' Disconnected'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}