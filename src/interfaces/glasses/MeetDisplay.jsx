// src/interfaces/glasses/MeetDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useMeet } from '../../context/MeetContext';
import { Card } from '../../components/ui/card';
import { StatusIndicators } from '../../components/StatusIndicators';
import { VideoFeed } from '../../components/VideoFeed';
import { MeetingPanel } from '../../components/MeetingPanel';
import { MeetingControls } from '../../components/MeetingControls';
import { Mic, Camera, Plus } from 'lucide-react';

export const GlassesMeetDisplay = () => {
 const {
   currentMeeting,
   participants,
   isMuted,
   isVideoOff,
   deviceType,
   error,
   toggleMute,
   toggleVideo,
   updateGlassesLayout,
   adjustBrightness,
 } = useMeet();

 const [showCreatePanel, setShowCreatePanel] = useState(false);

 useEffect(() => {
   if (!currentMeeting) return;
   updateGlassesLayout(participants);
   adjustBrightness(0.8);
 }, [currentMeeting, participants, updateGlassesLayout, adjustBrightness]);

 if (error) {
   return (
     <Card className="p-4 bg-red-50">
       <p className="text-red-600">Error: {error}</p>
     </Card>
   );
 }

 if (!currentMeeting) {
   return (
     <div className="min-h-screen bg-black text-white p-4">
       <button
         onClick={() => setShowCreatePanel(true)}
         className="mb-4 bg-blue-500 hover:bg-blue-600 p-3 rounded-full"
       >
         <Plus className="w-6 h-6" />
       </button>
       
       {showCreatePanel && (
         <MeetingPanel onClose={() => setShowCreatePanel(false)} />
       )}
       
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
     </div>
   );
 }

 return (
   <div className="min-h-screen bg-black text-white">
     <div className="max-w-7xl mx-auto px-4 py-6">
       <header className="mb-6">
         <StatusIndicators
           isMuted={isMuted}
           isVideoOff={isVideoOff}
           participants={participants}
         />
         <div>
           <h1 className="text-2xl font-bold">{currentMeeting.title}</h1>
           <p className="text-gray-400">
             {new Date(currentMeeting.startTime).toLocaleString()}
           </p>
         </div>
       </header>

       <main className="grid grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
         <div className="col-span-2">
           <VideoFeed
             participants={participants}
             currentMeeting={currentMeeting}
             deviceType={deviceType}
             className="w-full h-full rounded-lg bg-gray-900"
           />
         </div>
         <div className="space-y-4">
           <Card className="bg-gray-900 p-4">
             <h2 className="text-xl mb-4">Participants ({participants.length})</h2>
             <div className="space-y-2">
               {participants.map(p => (
                 <div key={p.id} className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                     {p.name?.[0] || '?'}
                   </div>
                   <span>{p.name || 'Anonymous'}</span>
                 </div>
               ))}
             </div>
           </Card>
         </div>
       </main>

       <footer className="fixed bottom-6 left-1/2 -translate-x-1/2">
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
       </footer>
     </div>
   </div>
 );
};