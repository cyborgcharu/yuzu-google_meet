// src/components/MeetingControls.jsx
import React from 'react';
import { useMeet } from '../context/MeetContext';
import { Mic, Camera } from 'lucide-react';

export const MeetingControls = () => {
 const { isMuted, isVideoOff, toggleMute, toggleVideo } = useMeet();

 return (
   <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
     <div className="flex gap-4 bg-gray-900 p-4 rounded-full shadow-lg">
       <button 
         onClick={toggleMute}
         className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-blue-500'}`}
       >
         <Mic className="w-6 h-6 text-white" />
       </button>
       <button 
         onClick={toggleVideo}
         className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-blue-500'}`}
       >
         <Camera className="w-6 h-6 text-white" />
       </button>
     </div>
   </div>
 );
};