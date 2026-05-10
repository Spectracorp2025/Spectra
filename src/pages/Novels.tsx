import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { LightNovel } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { BookOpen, Plus, Trash2, Edit2, ChevronRight, X, Image as ImageIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Novels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [novels, setNovels] = useState<LightNovel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNovel, setEditingNovel] = useState<LightNovel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: ''
  });

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'novels'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as LightNovel[];
      setNovels(docs);
    } catch (err) {
      console.error('Error fetching novels:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNovels = novels.filter(novel => 
    novel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    novel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingNovel) {
        await updateDoc(doc(db, 'novels', editingNovel.id), formData);
      } else {
        await addDoc(collection(db, 'novels'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      fetchNovels();
      closeModal();
    } catch (err) {
      console.error('Error saving novel:', err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar esta novela?')) return;
    try {
      await deleteDoc(doc(db, 'novels', id));
      fetchNovels();
    } catch (err) {
      console.error('Error deleting novel:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (novel: LightNovel | null = null) => {
    if (novel) {
      setEditingNovel(novel);
      setFormData({
        title: novel.title,
        description: novel.description || '',
        photo_url: novel.photo_url
      });
    } else {
      setEditingNovel(null);
      setFormData({ title: '', description: '', photo_url: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNovel(null);
  };

  return (
    <Layout title="Novelas Ligeras">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/20 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0">
              < BookOpen size={28} />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-black tracking-tight uppercase">BIBLIOTECA SPECTRA</h2>
              <p className="text-white font-medium tracking-wide">Lee las mejores novelas ligeras de la plataforma.</p>
            </div>
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR NOVELA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/40 focus:outline-none focus:border-emerald-500 transition-all shadow-lg"
              />
            </div>
          </div>
          {user?.is_admin && (
            <button 
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Plus size={20} />
              <span>NUEVA NOVELA</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredNovels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredNovels.map((novel) => (
              <motion.div 
                key={novel.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -5 }}
                onClick={() => navigate(`/novels/${novel.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 border border-white/10 group-hover:border-emerald-500/50 transition-all">
                  <img src={novel.photo_url} alt={novel.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 flex items-center gap-1">
                      VER NOVELA <ChevronRight size={14} />
                    </span>
                  </div>
                  {user?.is_admin && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); openModal(novel); }}
                        className="p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white hover:bg-white hover:text-black transition-all"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(novel.id, e)}
                        className="p-1.5 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm truncate uppercase tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{novel.title}</h3>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">SPECTRA ORIGINALS</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <BookOpen size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-medium">No hay novelas disponibles todavía.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight">
                    {editingNovel ? 'EDITAR NOVELA' : 'NUEVA NOVELA'}
                  </h3>
                  <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-emerald-400 transition-colors">
                        <FileText size={18} />
                      </div>
                      <input 
                        type="text"
                        placeholder="Título de la novela"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="relative group">
                      <textarea 
                        placeholder="Descripción"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-medium min-h-[100px] resize-none"
                      />
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-emerald-400 transition-colors">
                        <ImageIcon size={18} />
                      </div>
                      <input 
                        type="url"
                        placeholder="URL de la portada"
                        value={formData.photo_url}
                        onChange={(e) => setFormData({...formData, photo_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest text-xs"
                  >
                    {editingNovel ? 'GUARDAR CAMBIOS' : 'CREAR NOVELA'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
