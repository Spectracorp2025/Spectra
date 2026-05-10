import Layout from '../components/Layout';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { Shield, User, Globe, Database, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export default function Dashboard() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'checking'>('checking');

  useEffect(() => {
    const checkConn = async () => {
      if (!user) return;
      try {
        // Fetch current user profile from server to check connectivity
        await getDocFromServer(doc(db, 'profiles', user.id));
        setDbStatus('connected');
      } catch (err) {
        console.error("DB Error:", err);
        setDbStatus('error');
      }
    };
    checkConn();
  }, [user]);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Plus': return 'from-amber-400 to-amber-600';
      case 'Premium': return 'from-indigo-400 to-indigo-600';
      default: return 'from-slate-400 to-slate-600';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Panel Inicial</h2>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">HOLA, {user?.name.split(' ')[0].toUpperCase()}</h1>
          </div>
          
          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl">
            <div className={`w-2 h-2 rounded-full animate-pulse ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} />
            <span className="text-xs font-bold uppercase tracking-widest text-white/60">
              {dbStatus === 'connected' ? 'Conectado a SPECTRA-DB' : dbStatus === 'error' ? 'Error de Conexión' : 'Verificando...'}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${getRankColor(user?.rank || '')} shadow-lg shadow-black/20`}>
                  <Shield size={32} className="text-white" />
                </div>
                <div>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Nivel de Acceso</p>
                  <h3 className="text-3xl font-black">{user?.rank.toUpperCase()}</h3>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed max-w-md font-medium">
                {user?.rank === 'Plus' 
                  ? 'Tienes acceso total a todas las herramientas, juegos e información privilegiada de la plataforma.' 
                  : user?.rank === 'Premium'
                  ? 'Disfrutas de beneficios exclusivos y acceso a la mayoría de las herramientas y juegos de pago.'
                  : 'Usuario estándar. Explora la tienda y planes para mejorar tu rango y obtener más beneficios.'}
              </p>
            </div>
            <Shield size={200} className="absolute -bottom-10 -right-10 text-white/5 rotate-12" />
          </motion.div>

          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-4">
                <User size={18} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Perfil</span>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">Edad</span>
                    <span className="font-bold">{user?.age} años</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-white/40 text-sm">País</span>
                    <span className="font-bold flex items-center gap-2">
                       <Globe size={14} />
                       {user?.country}
                    </span>
                 </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-4">
                <Database size={18} className="text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Status</span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <Database size={20} />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Base de Datos</p>
                    <p className="text-[10px] text-white/40 uppercase font-medium">En línea</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Plataforma', value: 'Web Estática', icon: Globe },
            { label: 'Optimización', value: 'Mobile/PC', icon: Smartphone },
            { label: 'Seguridad', value: 'Encriptado', icon: Shield },
            { label: 'Soporte', value: 'WhatsApp', icon: Smartphone },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest leading-tight">{stat.label}</p>
                <p className="text-sm font-bold truncate">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
