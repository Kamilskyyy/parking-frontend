import { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <>
      {/* Czarny pasek na górze */}
      <header className="bg-parking-black h-20 flex items-center justify-between px-10 shadow-2xl">
        
        {/* LOGO (Lewa strona) */}
        <div className="bg-parking-blue border-2 border-white rounded-md px-4 py-1 flex items-center gap-2 shadow-lg">
          <Link to="/" className="text-white font-black text-2xl tracking-tighter">
            PARKING 🚗
          </Link>
        </div>

        {/* NAWIGACJA (Środek) */}
        <nav className="flex-12 flex justify-center gap-25 text-sm font-semibold tracking-widest text-gray-400">
          <Link to="/" className="text-gray-400 hover:text-white font-bold text-sm tracking-widest uppercase">Podgląd Parkingu</Link>
          <Link to="/reservations" className="text-gray-400 hover:text-white font-bold text-sm tracking-widest uppercase">Rezerwacje</Link>
        </nav>

        {/* PRZYCISK LOGOWANIA (Prawa strona) */}
        <div className="flex-1 flex justify-end">
          {user ? (
            <button onClick={logout} className="group bg-parking-blue text-white px-8 py-2 rounded-full font-bold uppercase hover:bg-blue-700 transition-all min-w-[160px] ">
              {/* Ten tekst widać normalnie, znika po najechaniu */}
              <span className="group-hover:hidden">
                {user.login || 'USER'}
              </span>

              {/* Ten tekst jest ukryty, pojawia się po najechaniu */}
              <span className="hidden group-hover:inline">
                Wyloguj
              </span>
            </button>
          ) : (
            <button 
              onClick={() => setLoginModalOpen(true)}
              className="bg-parking-blue text-white px-10 py-2 rounded-full font-bold uppercase text-sm shadow-md hover:bg-blue-700 transition-all"
            >
              Zaloguj
            </button>
          )}
        </div>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};

export default Header;