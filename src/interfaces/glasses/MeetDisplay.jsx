// src/interfaces/glasses/MeetDisplay.jsx
import React, { useEffect, useContext } from 'react';
import { MeetContext } from '../../context/MeetContext';
import { Card } from '../../components/ui/card';
import { StatusIndicators } from '../../components/StatusIndicators';
import { VideoFeed } from '../../components/VideoFeed';
import { MeetingControls } from '../../components/MeetingControls';
import { Mic, Camera, Phone } from 'lucide-react';

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
 } = useContext(MeetContext);

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
     <div className="p-4 space-y-4 bg-black text-white">
       <Card className="p-4 bg-gray-900">
         <p className="text-lg">No active meeting</p>
       </Card>
       <MeetingControls />
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
           <MeetingControls />
           <button
             onClick={toggleMute}
             className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-blue-500'}`}
           >
             <Mic className="text-white" />
           </button>
           <button
             onClick={toggleVideo} 
             className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-blue-500'}`}
           >
             <Camera className="text-white" />
           </button>
           <button className="p-4 rounded-full bg-red-500">
             <Phone className="text-white" />
           </button>
         </div>
       </footer>
     </div>
   </div>
 );
};