import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { UserPlus, User, Lock, Phone, Calendar, Globe, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    country: '',
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use phone as part of a dummy email to satisfy Firebase Auth without needing SMS
      const internalEmail = `${formData.phone}@spectra.app`;
      
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        internalEmail, 
        formData.password
      );

      const firebaseUser = userCredential.user;

      // 2. Create User Profile in Firestore
      const profile: UserProfile = {
        id: firebaseUser.uid,
        name: formData.name,
        age: parseInt(formData.age) || 0,
        country: formData.country,
        phone: formData.phone,
        email: internalEmail,
        rank: 'Normal',
        is_admin: false,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, 'profiles', firebaseUser.uid), {
        ...profile,
        created_at: serverTimestamp()
      });

      // Navigation is handled by App.tsx once profile is ready
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este número de teléfono ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Error: El método de inicio de sesión "Email/Password" debe estar habilitado en la consola de Firebase.');
      } else if (err.message?.includes('permission-denied')) {
        setError('Error de permisos en la base de datos. Por favor contacta al administrador.');
      } else {
        setError('Ocurrió un error al registrarse: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter mb-2">REGISTRO</h1>
            <p className="text-white/60 font-medium tracking-wide">Únete a la comunidad SPECTRA</p>
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-orange-400 transition-colors">
                  <User size={18} />
                </div>
                <input name="name" type="text" placeholder="Nombre Completo" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium" required />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-orange-400 transition-colors">
                  <Calendar size={18} />
                </div>
                <input name="age" type="number" placeholder="Edad" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium" required />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-orange-400 transition-colors">
                  <Globe size={18} />
                </div>
                <input name="country" type="text" placeholder="País" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium" required />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-orange-400 transition-colors">
                  <Phone size={18} />
                </div>
                <input name="phone" type="text" placeholder="Teléfono" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium" required />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-orange-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all text-sm font-medium" required />
              </div>
            </div>

            {error && (
              <div className="md:col-span-2 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm font-medium">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>REGISTRARSE</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="text-center mt-8 text-white/40 font-medium">
            ¿Ya tienes una cuenta? {' '}
            <Link to="/login" className="text-white hover:underline decoration-orange-500 decoration-2 underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
