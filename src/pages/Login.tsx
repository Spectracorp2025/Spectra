import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'motion/react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use the consistent pattern for phone-based logins
      const emailToAuth = `${identifier}@spectra.app`;

      // 1. Auth with Firebase
      await signInWithEmailAndPassword(auth, emailToAuth, password);
      
      // We don't navigate immediately; App.tsx listener will handle it 
      // once profile is loaded.
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Número de teléfono o contraseña incorrectos.');
      } else {
        setError('Ocurrió un error al iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2">INICIAR SESIÓN</h1>
            <p className="text-white/60 font-medium tracking-wide">Bienvenido de nuevo a SPECTRA</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-indigo-400 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text"
                  placeholder="Número de Teléfono"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-indigo-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type="password"
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm font-medium"
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  <span>INGRESAR</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center mt-8 text-white/40 font-medium">
            ¿No tienes una cuenta? {' '}
            <Link to="/register" className="text-white hover:underline decoration-indigo-500 decoration-2 underline-offset-4">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
