// src/interfaces/wrist/MeetDisplay.jsx
export const WristMeetDisplay = () => {
  const {
    currentMeeting,
    isMuted,
    isVideoOff,
    error,
    toggleMute,
    toggleVideo,
    endMeeting,
    initializeMediaStream
  } = useMeet();

  useEffect(() => {
    initializeMediaStream().catch(console.error);
  }, [initializeMediaStream]);

  if (error) return <Card className="p-4 bg-red-50"><p className="text-red-600">Error: {error}</p></Card>;

  return (
    <div className="fixed inset-0 bg-slate-900">
      <div className="flex flex-col h-full items-center justify-center space-y-6">
        <VideoFeed compact />
        
        <Card className="w-[300px] bg-slate-800/90 backdrop-blur-sm text-white shadow-lg">
          <div className="p-4 flex justify-center space-x-4">
            <button 
              onClick={toggleMute}
              className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-slate-700'} hover:opacity-90`}
            >
              <Mic className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={toggleVideo}
              className={`p-4 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-slate-700'} hover:opacity-90`}
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            {currentMeeting && (
              <button 
                onClick={endMeeting}
                className="p-4 rounded-full bg-red-500 hover:opacity-90"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};