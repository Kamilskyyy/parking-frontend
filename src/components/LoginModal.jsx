import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ isOpen, onClose }) => {
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginInput, password })
      });
      
      if (!res.ok) throw new Error('Błędne dane logowania');
      
      const data = await res.json();
      login(data.token, { login: data.login, role: data.role });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white text-black p-6 rounded-xl w-96 shadow-lg relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-gray-500 font-bold">X</button>
        <h2 className="text-xl font-semibold mb-4">Zaloguj</h2>
        
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Login" 
            className="border p-2 rounded"
            value={loginInput} onChange={e => setLoginInput(e.target.value)} required
          />
          <input 
            type="password" 
            placeholder="Hasło" 
            className="border p-2 rounded"
            value={password} onChange={e => setPassword(e.target.value)} required
          />
          
          <button 
            type="button"
            onClick={() => { onClose(); navigate('/register'); }}
            className="text-parkingBlue text-sm text-center hover:underline"
          >
            Załóż Konto
          </button>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Anuluj</button>
            <button type="submit" className="bg-parking-blue text-white px-4 py-2 rounded hover:bg-blue-700">Zaloguj</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginModal;