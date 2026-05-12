import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { SharedAccount, UserRank } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  UserCircle, Plus, Trash2, Edit2, Key, Calendar, 
  X, Image as ImageIcon, Link as LinkIcon, FileText, Lock, Eye, EyeOff 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SharedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SharedAccount | null>(null);
  const [showPass, setShowPass] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    platform: '',
    email: '',
    password: '',
    expiration_date: '',
    allowed_ranks: [] as UserRank[]
  });

  const RANKS: UserRank[] = ['Normal', 'Premium', 'Plus'];

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'shared_accounts'), orderBy('expiration_date', 'asc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SharedAccount[];
      
      if (user?.is_admin) {
        setAccounts(docs);
      } else {
        const now = new Date();
        // Filter out expired accounts for non-admins
        const valid = docs.filter(acc => new Date(acc.expiration_date) > now);
        setAccounts(valid);
      }
    } catch (err) { 
      console.error('Error fetching accounts:', err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateDoc(doc(db, 'shared_accounts', editingAccount.id), formData);
      } else {
        await addDoc(collection(db, 'shared_accounts'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      fetchAccounts();
      closeModal();
    } catch (err) { console.error('Error saving account:', err); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar cuenta?')) return;
    try { 
      await deleteDoc(doc(db, 'shared_accounts', id));
      fetchAccounts(); 
    } catch (err) { 
      console.error('Error deleting account:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, acc: SharedAccount | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (acc) {
      setEditingAccount(acc);
      setFormData({
        platform: acc.platform,
        email: acc.email,
        password: acc.password || '',
        expiration_date: acc.expiration_date.split('T')[0],
        allowed_ranks: acc.allowed_ranks || []
      });
    } else {
      setEditingAccount(null);
      setFormData({ platform: '', email: '', password: '', expiration_date: '', allowed_ranks: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingAccount(null); };

  const toggleRank = (rank: UserRank) => {
    setFormData(prev => ({
        ...prev,
        allowed_ranks: prev.allowed_ranks.includes(rank) ? prev.allowed_ranks.filter(r => r !== rank) : [...prev.allowed_ranks, rank]
    }));
  };

  const getTimeLeft = (date: string) => {
    const remaining = new Date(date).getTime() - Date.now();
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Expirado';
    if (days === 0) return 'Expira hoy';
    return `Expira en ${days} días`;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Acceso a Cuentas Compartidas</h2>
            <h1 className="text-4xl font-black tracking-tighter">CUENTAS</h1>
          </div>
          {user?.is_admin && (
            <button onClick={(e) => openModal(e)} className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={20} />
              <span className="hidden md:inline">Nueva Cuenta</span>
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? Array(2).fill(0).map((_, i) => <div key={i} className="bg-white/5 rounded-[2.5rem] h-48 animate-pulse" />) : accounts.map(acc => {
            const hasAccess = user?.is_admin || (user && acc.allowed_ranks.includes(user.rank));
            return (
              <motion.div key={acc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <UserCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">{acc.platform}</h3>
                      <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
                        <Calendar size={12} />
                        <span>{getTimeLeft(acc.expiration_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {acc.allowed_ranks.map(r => (
                       <span key={r} className="bg-white/5 text-white/40 text-[8px] font-black px-1.5 py-0.5 rounded border border-white/5">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                   <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 overflow-hidden">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                         <FileText size={16} className="text-white/20 flex-shrink-0" />
                         <span className={cn(
                           "text-sm font-medium text-white/80 truncate",
                           showEmail === acc.id ? "" : "blur-sm select-none"
                         )}>
                            {showEmail === acc.id ? acc.email : '••••••••••••••••'}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <button onClick={() => setShowEmail(showEmail === acc.id ? null : acc.id)} className="text-white/20 hover:text-white">
                           {showEmail === acc.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {showEmail === acc.id && (
                          <button onClick={() => { navigator.clipboard.writeText(acc.email); }} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">COPIAR</button>
                        )}
                      </div>
                   </div>
                   
                   <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 overflow-hidden">
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                         <Lock size={16} className="text-white/20 flex-shrink-0" />
                         <span className={cn("text-sm font-bold font-mono tracking-wider truncate transition-all", hasAccess ? "" : "blur-sm select-none")}>
                            {showPass === acc.id || !hasAccess ? (hasAccess ? acc.password : '********') : '••••••••'}
                         </span>
                      </div>
                      {hasAccess ? (
                        <div className="flex items-center gap-3 ml-4">
                          <button onClick={() => setShowPass(showPass === acc.id ? null : acc.id)} className="text-white/20 hover:text-white">
                            {showPass === acc.id ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          {showPass === acc.id && (
                             <button onClick={() => { navigator.clipboard.writeText(acc.password); }} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300">COPIAR</button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[8px] font-black uppercase bg-red-500/20 text-red-400 px-2 py-1 rounded">No Access</div>
                      )}
                   </div>
                </div>

                {user?.is_admin && (
                   <div className="absolute top-4 right-4 flex gap-2">
                     <button onClick={(e) => openModal(e, acc)} className="p-2 bg-black/40 rounded-xl text-white/40 hover:text-white"><Edit2 size={14} /></button>
                     <button onClick={(e) => handleDelete(e, acc.id)} className="p-2 bg-black/40 rounded-xl text-red-500/40 hover:text-red-400"><Trash2 size={14} /></button>
                   </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black uppercase mb-6">Configurar Cuenta</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Plataforma (Ej: Netflix)" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input required placeholder="Email de la Cuenta" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input required placeholder="Contraseña de la Cuenta" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Fecha de Expiración</label>
                                <input required type="date" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-white/60" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Rangos con Acceso</label>
                                <div className="flex gap-2">
                                    {RANKS.map(rank => (
                                        <button key={rank} type="button" onClick={() => toggleRank(rank)} className={cn("flex-1 py-3 rounded-xl border font-bold text-xs transition-all", formData.allowed_ranks.includes(rank) ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-white/40")}>
                                            {rank}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                                Guardar Cuenta
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
