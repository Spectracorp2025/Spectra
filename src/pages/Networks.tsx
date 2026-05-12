import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { SocialNetwork } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Share2, Plus, Trash2, Edit2, ExternalLink, X, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Networks() {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<SocialNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNetwork, setEditingNetwork] = useState<SocialNetwork | null>(null);
  const [formData, setFormData] = useState({ title: '', photo_url: '', link: '' });

  useEffect(() => { fetchNetworks(); }, []);

  const fetchNetworks = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'networks'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as SocialNetwork[];
      
      setNetworks(docs);
    } catch (err) { 
      console.error('Error fetching networks:', err);
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNetwork) {
        await updateDoc(doc(db, 'networks', editingNetwork.id), formData);
      } else {
        await addDoc(collection(db, 'networks'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      fetchNetworks();
      closeModal();
    } catch (err) { console.error('Error saving network:', err); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar red social?')) return;
    try { 
      await deleteDoc(doc(db, 'networks', id));
      fetchNetworks(); 
    } catch (err) { 
      console.error('Error deleting network:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, network: SocialNetwork | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (network) {
      setEditingNetwork(network);
      setFormData({ title: network.title, photo_url: network.photo_url, link: network.link });
    } else {
      setEditingNetwork(null);
      setFormData({ title: '', photo_url: '', link: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingNetwork(null); };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Connect With Us</h2>
            <h1 className="text-4xl font-black tracking-tighter">REDES</h1>
          </div>
          {user?.is_admin && (
            <button onClick={(e) => openModal(e)} className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={20} />
              <span className="hidden md:inline">Añadir Red</span>
            </button>
          )}
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {isLoading ? Array(4).fill(0).map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-3xl animate-pulse" />) : networks.map(network => (
            <motion.a 
              key={network.id}
              href={network.link}
              target="_blank" 
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-5 flex flex-col items-center justify-center text-center hover:bg-black/60 hover:border-indigo-500/50 transition-all duration-500 relative shadow-2xl"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 mb-4 rounded-2xl overflow-hidden shadow-2xl group-hover:scale-110 transition-all duration-700 border border-white/10">
                <img src={network.photo_url} alt={network.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-black text-xs md:text-sm uppercase tracking-wider text-white group-hover:text-indigo-400 transition-colors uppercase line-clamp-1">{network.title}</h3>
              <div className="mt-3 text-indigo-400/50 group-hover:text-indigo-400 transition-colors">
                 <ExternalLink size={14} />
              </div>

              {user?.is_admin && (
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.preventDefault(); openModal(e, network); }} className="p-2 bg-white text-black rounded-xl hover:bg-indigo-500 hover:text-white transition-all shadow-xl"><Edit2 size={12} /></button>
                  <button onClick={(e) => { e.preventDefault(); handleDelete(e, network.id); }} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-xl"><Trash2 size={12} /></button>
                </div>
              )}
            </motion.a>
          ))}
        </div>

        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                        <h2 className="text-2xl font-black uppercase mb-6">{editingNetwork ? 'Editar' : 'Nueva'} Red Social</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input required placeholder="URL Icono/Foto" value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input required placeholder="Link de Red Social" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                                {editingNetwork ? 'Guardar Cambios' : 'Añadir Red'}
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
