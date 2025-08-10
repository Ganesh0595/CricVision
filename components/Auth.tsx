
import React, { useState } from 'react';
import { Player, Gender, PlayerRole } from '../types';
import { COUNTRIES, INDIAN_STATES, PLAYER_ROLES } from '../constants';

interface AuthProps {
  onLogin: (email: string) => void;
  onRegister: (player: Omit<Player, 'id' | 'registrationDate'>) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onRegister }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="absolute top-8 left-8 flex items-center space-x-3">
         <img src="https://img.icons8.com/color/48/000000/cricket.png" alt="Cricket Logo" className="h-10 w-10"/>
         <h1 className="text-2xl font-bold text-gray-800 dark:text-white">BCC Pune</h1>
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 transition-all duration-500">
        {isLoginView ? (
          <Login onRegisterClick={() => setIsLoginView(false)} onLogin={onLogin} />
        ) : (
          <Register onLoginClick={() => setIsLoginView(true)} onRegister={onRegister} />
        )}
      </div>
       <footer className="text-center text-xs text-slate-500 dark:text-slate-400 mt-8 max-w-md">
        <p>BCC PUNE © 2025 - Champions of Gliding</p>
        <p className="mt-1">This application was developed by <strong className="font-semibold text-orange-500 dark:text-orange-400">Ganesh Ambhore</strong>.</p>
      </footer>
    </div>
  );
};

const Login: React.FC<{ onRegisterClick: () => void; onLogin: (email: string) => void }> = ({ onRegisterClick, onLogin }) => {
  const [email, setEmail] = useState('ganesha@gmail.com');
  const [password, setPassword] = useState('Ganesh@1995');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'ganesha@gmail.com' && password === 'Ganesh@1995') {
      onLogin(email);
    } else {
      alert("Invalid email or password. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Welcome Back!</h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">Sign in to continue</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-2 p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border-2 border-transparent focus:border-orange-500 focus:outline-none transition" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full mt-2 p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg border-2 border-transparent focus:border-orange-500 focus:outline-none transition" required />
        </div>
        <button type="submit" className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all">
          Login
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
        Don't have an account?{' '}
        <button onClick={onRegisterClick} className="font-medium text-orange-500 hover:text-red-600">
          Register
        </button>
      </p>
    </div>
  );
};

const Register: React.FC<{ onLoginClick: () => void; onRegister: (player: Omit<Player, 'id' | 'registrationDate'>) => void }> = ({ onLoginClick, onRegister }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    gender: Gender.Male,
    role: PlayerRole.Batter,
    state: '',
    country: 'India',
    photoUrl: 'https://picsum.photos/seed/newuser/200',
    jerseyNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, photoUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const jerseyNumber = formData.jerseyNumber ? parseInt(formData.jerseyNumber, 10) : undefined;
    onRegister({ ...formData, jerseyNumber });
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">Create Account</h2>
      <p className="text-center text-gray-600 dark:text-gray-300 mb-8">Join the club today!</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="fullName" placeholder="Full Name" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <input type="email" name="email" placeholder="Email Address" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <input type="date" name="dob" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            <select name="gender" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
             <input type="number" name="jerseyNumber" placeholder="Jersey Number" value={formData.jerseyNumber} onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <div className="md:col-span-2">
                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                    {PLAYER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <select name="country" value={formData.country} onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {formData.country === 'India' && (
              <select name="state" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required>
                 <option value="">Select State</option>
                 {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
             {formData.country !== 'India' && (
                 <input name="state" placeholder="State/Province" onChange={handleChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" required />
            )}
        </div>
        <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Upload Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
        </div>
        <button type="submit" className="w-full p-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-red-700 transition-all mt-4">
          Register
        </button>
      </form>
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
        Already have an account?{' '}
        <button onClick={onLoginClick} className="font-medium text-orange-500 hover:text-red-600">
          Login
        </button>
      </p>
    </div>
  );
};
