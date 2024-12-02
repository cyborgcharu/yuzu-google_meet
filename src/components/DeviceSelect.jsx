// src/components/DeviceSelect.jsx - Temporary component
function DeviceSelect() {
    const navigate = useNavigate();
    return (
      <div className="grid grid-cols-3 gap-4 p-8 bg-black text-white">
        {['Glasses', 'Ring', 'Watch'].map(device => (
          <Card 
            key={device} 
            className="p-4 bg-gray-900 hover:bg-gray-800 cursor-pointer"
            onClick={() => navigate(`/${device.toLowerCase()}`)}
          >
            <h2 className="text-xl">{device}</h2>
            <p className="text-sm text-gray-400">Temporary Selection</p>
          </Card>
        ))}
      </div>
    );
   }