import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    login: '', password: '', firstName: '', lastName: '', email: '', phone: ''
  });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Rejestracja udana! Możesz się teraz zalogować.');
        navigate('/');
      }
    } catch (err) {
      alert('Błąd rejestracji');
    }
  };

  return (
    <div className="flex justify-center mt-10">
      <div className="bg-white text-black p-8 rounded-xl shadow-lg w-[500px]">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Załóż Konto:</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input className="border p-2 rounded w-1/2" placeholder="Imię" required
              onChange={e => setFormData({...formData, firstName: e.target.value})} />
            <input className="border p-2 rounded w-1/2" placeholder="Nazwisko" required
              onChange={e => setFormData({...formData, lastName: e.target.value})} />
          </div>
          <input className="border p-2 rounded" placeholder="Login" required
            onChange={e => setFormData({...formData, login: e.target.value})} />
          <input className="border p-2 rounded" type="email" placeholder="mail@example.com" required
            onChange={e => setFormData({...formData, email: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Telefon" required
            onChange={e => setFormData({...formData, phone: e.target.value})} />
          <input className="border p-2 rounded" type="password" placeholder="Hasło (Minimum 8 znaków)" minLength="8" required
            onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <button type="submit" className="group bg-parking-blue text-white px-8 py-2 rounded-full font-bold uppercase hover:bg-blue-700">Załóż</button>
        </form>
      </div>
    </div>
  );
};

export default Register;