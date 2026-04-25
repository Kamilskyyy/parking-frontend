import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Reservations = () => {
  const { token } = useContext(AuthContext);
  const [reservations, setReservations] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    if (token) {
      fetch('http://localhost:8080/api/reservations?view=ALL', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setReservations(data))
      .catch(err => console.error(err));
    }
  }, [token]);

  const openDetails = async (res) => {
    setSelectedRes(res);
    setQrCode(null);
    // Pobranie QR kodu
    try {
      const response = await fetch(`http://localhost:8080/api/reservations/${res.id}/qr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if(response.ok) {
        const data = await response.json();
        setQrCode(data.pngBase64);
      }
    } catch (e) { console.error("Błąd pobierania QR"); }
  };

  if (!token) return <h2 className="text-center mt-10">Zaloguj się, aby zobaczyć rezerwacje.</h2>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-6 text-gray-200">REZERWACJE UŻYTKOWNIKA:</h2>
      <div className="flex flex-wrap gap-6">
        {reservations.map(res => (
          <div 
            key={res.id} 
            onClick={() => openDetails(res)}
            className="bg-gray-600 w-48 p-4 rounded-xl cursor-pointer hover:bg-gray-500 shadow-lg text-center flex flex-col gap-2"
          >
            <p className="font-semibold text-gray-300">Rezerwacja nr {res.id}</p>
            <p className="text-white">Miejsce nr {res.spotId}</p>
            <p className="text-gray-400 text-sm">{new Date(res.startTime).toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      {/* Modal szczegółów rezerwacji */}
      {selectedRes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#0066cc] text-white p-6 rounded-2xl w-80 relative flex flex-col items-center text-center shadow-2xl border border-blue-400">
            <button onClick={() => setSelectedRes(null)} className="absolute top-2 right-4 text-xl font-bold">X</button>
            <h2 className="text-lg font-bold mb-4 uppercase">REZERWACJA NR {selectedRes.id}</h2>
            
            <p>Miejsce nr {selectedRes.spotId} ({selectedRes.spotCode})</p>
            <p className="text-sm opacity-80 mt-1">Data: {new Date(selectedRes.startTime).toLocaleDateString()}</p>
            <p className="text-sm opacity-80">
              Godzina: {new Date(selectedRes.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
              {new Date(selectedRes.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
            
            <p className={`mt-3 text-sm font-bold ${selectedRes.status === 'CONFIRMED' || selectedRes.status === 'COMPLETED' ? 'text-green-300' : 'text-yellow-300'}`}>
              Status: {selectedRes.status}
            </p>

            <div className="bg-white p-2 mt-4 rounded shadow-inner">
              {qrCode ? (
                <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-32 h-32" />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-black text-xs">Ładowanie QR...</div>
              )}
            </div>

            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full mt-6 shadow-md">
              Anuluj rezerwacje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;