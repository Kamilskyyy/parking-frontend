const Home = () => {
  return (
    <div className="flex flex-col items-center mt-1 gap-6">
      
      
      <div className="bg-parking-panel p-4 px-8 rounded-full flex items-center gap-6 shadow-xl border border-white/10 mt-1">
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold">Data:</label>
          <input type="date" className="rounded bg-white text-black px-2 py-1 outline-none" />
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold">Godzina:</label>
          <input type="time" className="rounded bg-white text-black px-2 py-1 outline-none" />
        </div>
        
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold">Rodzaj:</label>
          <select className="rounded bg-white text-black px-2 py-1 outline-none min-w-[140px]">
            <option>Standardowe</option>
            <option>Dla niepełnosprawnych</option>
            <option>Elektryczne</option>
          </select>
        </div>

        <button className="bg-parking-blue hover:bg-blue-700 px-8 py-2 rounded-full font-bold text-sm shadow-lg transition-all">
          Szukaj
        </button>
      </div>

      {/* Kontener na mapę */}
      <div className="w-[800px] h-[600px] bg-gray-300 rounded flex items-center justify-center text-gray-600 shadow-2xl border-4 border-gray-400 font-bold text-xl relative">
        <span className="opacity-50">Miejsce na mapę parkingu</span>
        {/* Strzałki wjazdu/wyjazdu*/}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 text-3xl">⬇</div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-cyan-400 text-3xl">⬆</div>
      </div>
    </div>
  );
};

export default Home;