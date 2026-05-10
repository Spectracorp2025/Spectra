import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Game, UserRank } from '../types';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Gamepad2, Plus, Trash2, Edit2, Download, Lock, CheckCircle2, 
  X, DollarSign, Image as ImageIcon, FileText, Smartphone, Monitor 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Games({ type = 'mobile' }: { type?: 'mobile' | 'pc' }) {
  const { user } = useAuth();
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price_cop: '',
    download_url: '',
    password: '',
    free_ranks: [] as UserRank[]
  });

  const WHATSAPP_NUMBER = '3009555880';
  const RANKS: UserRank[] = ['Normal', 'Premium', 'Plus'];

  useEffect(() => {
    fetchGames();
  }, [type]);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'games'), 
        where('type', '==', type),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Game[];
      
      setGames(docs);
    } catch (err) {
      console.error('Error fetching games:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGames = games.filter(game => 
    game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price_cop: parseInt(formData.price_cop),
      type: type
    };

    try {
      if (editingGame) {
        await updateDoc(doc(db, 'games', editingGame.id), payload);
      } else {
        await addDoc(collection(db, 'games'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      fetchGames();
      closeModal();
    } catch (err) {
      console.error('Error saving game:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este juego?')) return;
    try {
      await deleteDoc(doc(db, 'games', id));
      fetchGames();
    } catch (err) {
      console.error('Error deleting game:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, game: Game | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (game) {
      setEditingGame(game);
      setFormData({
        name: game.name,
        description: game.description,
        photo_url: game.photo_url,
        price_cop: game.price_cop.toString(),
        download_url: game.download_url || '',
        password: game.password || '',
        free_ranks: game.free_ranks || []
      });
    } else {
      setEditingGame(null);
      setFormData({ name: '', description: '', photo_url: '', price_cop: '', download_url: '', password: '', free_ranks: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
  };

  const toggleRank = (rank: UserRank) => {
    setFormData(prev => ({
        ...prev,
        free_ranks: prev.free_ranks.includes(rank) 
            ? prev.free_ranks.filter(r => r !== rank)
            : [...prev.free_ranks, rank]
    }));
  };

  const buyGame = (game: Game) => {
    const text = `Hola, quiero comprar el acceso al juego: ${game.name} (${type === 'mobile' ? 'Móvil' : 'Videojuego'}) - Precio: $${game.price_cop} COP`;
    window.open(`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const hasAccess = (game: Game) => {
    return user?.is_admin || (user && game.free_ranks.includes(user.rank));
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-white/80 font-bold uppercase tracking-[0.2em] text-sm mb-2">{type === 'mobile' ? 'Mobile Entertainment' : 'PC & Console Experience'}</h2>
            <h1 className="text-4xl font-black tracking-tighter uppercase">{type === 'mobile' ? 'Juegos Movil' : 'Videojuegos'}</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR JUEGO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-all shadow-2xl"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                <Gamepad2 size={18} />
              </div>
            </div>

            {user?.is_admin && (
              <button 
                onClick={(e) => openModal(e)}
                className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-white/10 h-12"
              >
                <Plus size={20} />
                <span className="md:inline">Añadir Juego</span>
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-[2.5rem] h-[30rem] animate-pulse" />
            ))
          ) : filteredGames.length > 0 ? (
            filteredGames.map((game) => {
              const free = hasAccess(game);
              return (
                <motion.div 
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col"
                >
                  <div className="aspect-video md:aspect-[16/11] w-full overflow-hidden relative">
                    <img src={game.photo_url} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    {free && (
                        <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                           <CheckCircle2 size={12} /> Acceso Libre
                        </div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full font-black text-sm text-indigo-400">
                      ${game.price_cop.toLocaleString('es-CO')}
                    </div>
                    {user?.is_admin && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <button onClick={(e) => openModal(e, game)} className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all text-white border border-white/10">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(e, game.id)} className="p-2 bg-red-500/20 backdrop-blur-md rounded-xl hover:bg-red-500/40 transition-all text-red-400 border border-red-500/20">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{game.name}</h3>
                    <div className="relative">
                      <p className={cn(
                        "text-white/80 text-sm font-medium mb-4 transition-all duration-300",
                        expandedId === game.id ? "" : "line-clamp-2"
                      )}>
                        {game.description}
                      </p>
                      {game.description.length > 80 && (
                        <button 
                          onClick={() => setExpandedId(expandedId === game.id ? null : game.id)}
                          className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-white transition-colors"
                        >
                          {expandedId === game.id ? 'VER MENOS' : 'VER MÁS'}
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-auto space-y-3">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                           {RANKS.map(r => (
                               <span key={r} className={cn(
                                   "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border",
                                   game.free_ranks.includes(r) ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-white/30"
                               )}>
                                   {r} {game.free_ranks.includes(r) ? 'Free' : 'Paid'}
                               </span>
                           ))}
                        </div>

                        {free ? (
                            <div className="space-y-3">
                               <a 
                                 href={game.download_url} 
                                 target="_blank" 
                                 className="w-full bg-green-500 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-500/20"
                               >
                                 <Download size={18} /> DESCARGAR
                               </a>
                               {game.password && (
                                   <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-white/40">
                                         <Lock size={14} />
                                         <span className="text-[10px] font-bold uppercase tracking-widest">Password:</span>
                                      </div>
                                      <code className="text-indigo-400 font-mono font-bold">{game.password}</code>
                                   </div>
                               )}
                            </div>
                        ) : (
                            <button 
                              onClick={() => buyGame(game)}
                              className="w-full bg-white text-black font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-black/20"
                            >
                              <DollarSign size={18} /> OBTENER ACCESO
                            </button>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <Gamepad2 size={64} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/60 font-bold uppercase tracking-widest">No hay {type === 'mobile' ? 'juegos móviles' : 'videojuegos'} disponibles</p>
            </div>
          )}
        </div>

        {/* Admin Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{editingGame ? 'Editar' : 'Nuevo'} {type === 'mobile' ? 'Juego Móvil' : 'Videojuego'}</h2>
                  <button onClick={closeModal} className="text-white/40 hover:text-white"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Nombre</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Precio (COP)</label>
                        <input required type="number" value={formData.price_cop} onChange={e => setFormData({...formData, price_cop: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Descripción</label>
                     <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium resize-none" />
                  </div>

                  <div className="space-y-1">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">URL de Foto</label>
                     <input required value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Link Descarga</label>
                        <input value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Contraseña ZIP</label>
                        <input value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Rangos con Acceso Gratuito</label>
                     <div className="flex gap-2">
                        {RANKS.map(rank => (
                            <button
                                key={rank}
                                type="button"
                                onClick={() => toggleRank(rank)}
                                className={cn(
                                    "flex-1 py-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all",
                                    formData.free_ranks.includes(rank) ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                                )}
                            >
                                {rank}
                            </button>
                        ))}
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                    {editingGame ? 'Guardar Cambios' : 'Crear Juego'}
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
