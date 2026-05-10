import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Tool, UserRank } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  Wrench, Plus, Trash2, Edit2, Download, Lock, CheckCircle2, 
  X, DollarSign, Image as ImageIcon, FileText 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Tools() {
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    price_cop: '',
    download_url: '',
    free_ranks: [] as UserRank[]
  });

  const WHATSAPP_NUMBER = '3009555880';
  const RANKS: UserRank[] = ['Normal', 'Premium', 'Plus'];

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'tools'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Tool[];
      
      setTools(docs);
    } catch (err) {
      console.error('Error fetching tools:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, price_cop: parseInt(formData.price_cop) };
    try {
      if (editingTool) {
        await updateDoc(doc(db, 'tools', editingTool.id), payload);
      } else {
        await addDoc(collection(db, 'tools'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      fetchTools();
      closeModal();
    } catch (err) { console.error('Error saving tool:', err); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar herramienta?')) return;
    try { 
      await deleteDoc(doc(db, 'tools', id));
      fetchTools(); 
    } catch (err) { 
      console.error('Error deleting tool:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, tool: Tool | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (tool) {
      setEditingTool(tool);
      setFormData({
        name: tool.name,
        description: tool.description,
        photo_url: tool.photo_url,
        price_cop: tool.price_cop.toString(),
        download_url: tool.download_url || '',
        free_ranks: tool.free_ranks || []
      });
    } else {
      setEditingTool(null);
      setFormData({ name: '', description: '', photo_url: '', price_cop: '', download_url: '', free_ranks: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingTool(null); };

  const toggleRank = (rank: UserRank) => {
    setFormData(prev => ({
        ...prev,
        free_ranks: prev.free_ranks.includes(rank) ? prev.free_ranks.filter(r => r !== rank) : [...prev.free_ranks, rank]
    }));
  };

  const buyTool = (tool: Tool) => {
    const text = `Hola, quiero comprar la herramienta: ${tool.name} - Precio: $${tool.price_cop} COP`;
    window.open(`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const hasAccess = (tool: Tool) => user?.is_admin || (user && tool.free_ranks.includes(user.rank));

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Power Up Your Experience</h2>
            <h1 className="text-4xl font-black tracking-tighter">HERRAMIENTAS</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR HERRAMIENTA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">
                <Wrench size={18} />
              </div>
            </div>

            {user?.is_admin && (
              <button 
                onClick={(e) => openModal(e)}
                className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-white/10 h-12"
              >
                <Plus size={20} />
                <span className="md:inline">Añadir Herramienta</span>
              </button>
            )}
          </div>
        </header>        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <div key={i} className="bg-white/5 rounded-[2.5rem] h-80 animate-pulse" />)
          ) : filteredTools.length > 0 ? (
            filteredTools.map(tool => {
              const free = hasAccess(tool);
              return (
                <motion.div key={tool.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 flex flex-col relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                      <img src={tool.photo_url} alt={tool.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight">{tool.name}</h3>
                      <p className="text-indigo-400 font-bold text-xs">${tool.price_cop.toLocaleString('es-CO')} COP</p>
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-sm font-medium mb-8 line-clamp-3">{tool.description}</p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
                      {RANKS.map(r => (
                        <span key={r} className={cn("text-[8px] font-bold px-2 py-0.5 rounded-full uppercase border whitespace-nowrap", tool.free_ranks.includes(r) ? "bg-indigo-500/20 border-indigo-500 text-indigo-300" : "bg-white/5 border-white/10 text-white/20")}>
                          {r} {tool.free_ranks.includes(r) ? 'Free' : 'Paid'}
                        </span>
                      ))}
                    </div>

                    {free ? (
                      <a href={tool.download_url} target="_blank" className="w-full bg-indigo-500 text-white font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
                        <Download size={18} /> DESCARGAR
                      </a>
                    ) : (
                      <button onClick={() => buyTool(tool)} className="w-full bg-white text-black font-black py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all">
                        <DollarSign size={18} /> OBTENER HERRAMIENTA
                      </button>
                    )}
                  </div>

                  {user?.is_admin && (
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={(e) => openModal(e, tool)} className="p-1.5 bg-white/5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"><Edit2 size={14} /></button>
                      <button onClick={(e) => handleDelete(e, tool.id)} className="p-1.5 bg-red-500/10 rounded-lg text-red-400 hover:bg-red-500/20 transition-all"><Trash2 size={14} /></button>
                    </div>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-white/20 font-black tracking-widest uppercase">No se encontraron herramientas</p>
            </div>
          )}
        </div>
            
            {/* Modal - keeping it simple for now, using similar structure to Store/Games */}
        </div>

        {/* Modal simplified for space */}
        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black uppercase mb-6">{editingTool ? 'Editar' : 'Nueva'} Herramienta</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Nombre" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input required type="number" placeholder="Precio (COP)" value={formData.price_cop} onChange={e => setFormData({...formData, price_cop: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <textarea required placeholder="Descripción" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium resize-none" />
                            <input required placeholder="URL Foto" value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <input placeholder="URL Descarga" value={formData.download_url} onChange={e => setFormData({...formData, download_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Acceso Gratuito</label>
                                <div className="flex gap-2">
                                    {RANKS.map(rank => (
                                        <button key={rank} type="button" onClick={() => toggleRank(rank)} className={cn("flex-1 py-3 rounded-xl border font-bold text-xs transition-all", formData.free_ranks.includes(rank) ? "bg-indigo-500 border-indigo-400 text-white" : "bg-white/5 border-white/10 text-white/40")}>
                                            {rank}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                                {editingTool ? 'Guardar Cambios' : 'Crear Herramienta'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </Layout>
  );
}
