import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Announcement } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Megaphone, Plus, Trash2, Edit2, ExternalLink, X, Image as ImageIcon, Video, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'image' as 'image' | 'video',
    media_url: ''
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Announcement[];
      setAnnouncements(docs);
    } catch (err) {
      console.error('Error fetching announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(ann => 
    ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ann.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await updateDoc(doc(db, 'announcements', editingAnnouncement.id), formData);
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      fetchAnnouncements();
      closeModal();
    } catch (err) {
      console.error('Error saving announcement:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, ann: Announcement | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (ann) {
      setEditingAnnouncement(ann);
      setFormData({
        title: ann.title,
        description: ann.description,
        type: ann.type,
        media_url: ann.media_url
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({ title: '', description: '', type: 'image', media_url: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
  };

  return (
    <Layout title="Anuncios">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/20 p-6 rounded-3xl backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
              <Megaphone size={28} />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-black tracking-tight uppercase">SPECTRA NEWS</h2>
              <p className="text-white/80 font-medium tracking-wide">Enterate de las últimas actualizaciones y noticias.</p>
            </div>
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR ANUNCIO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-all shadow-lg"
              />
            </div>
          </div>
          {user?.is_admin && (
            <button 
              onClick={(e) => openModal(e)}
              className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={20} />
              <span>NUEVO ANUNCIO</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredAnnouncements.map((ann) => (
              <motion.div 
                key={ann.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden group hover:border-indigo-500/30 transition-all flex flex-col"
              >
                <div className="relative aspect-video">
                  {ann.type === 'video' ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                       {ann.media_url.includes('youtube.com') || ann.media_url.includes('youtu.be') ? (
                         <iframe 
                           src={ann.media_url.replace('watch?v=', 'embed/')} 
                           className="w-full h-full"
                           frameBorder="0"
                           allowFullScreen
                         />
                       ) : (
                         <video src={ann.media_url} controls className="w-full h-full object-contain" />
                       )}
                    </div>
                  ) : (
                    <img src={ann.media_url} alt={ann.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                  )}
                  {user?.is_admin && (
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => openModal(e, ann)} className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-black transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => handleDelete(e, ann.id)} className="p-2 bg-red-500/80 backdrop-blur-md rounded-xl text-white hover:bg-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black uppercase rounded-full tracking-widest shadow-lg">
                      {ann.type}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-grow flex flex-col">
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{ann.title}</h3>
                    <div className="relative">
                      <p className={cn(
                        "text-white/60 text-sm leading-relaxed whitespace-pre-wrap transition-all duration-300",
                        expandedId === ann.id ? "" : "line-clamp-3"
                      )}>
                        {ann.description}
                      </p>
                      {ann.description.length > 200 && (
                        <button 
                          onClick={() => setExpandedId(expandedId === ann.id ? null : ann.id)}
                          className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors"
                        >
                          {expandedId === ann.id ? 'VER MENOS' : 'VER MÁS'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Megaphone size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-medium">No hay anuncios publicados todavía.</p>
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
                    {editingAnnouncement ? 'EDITAR ANUNCIO' : 'NUEVO ANUNCIO'}
                  </h3>
                  <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-indigo-400 transition-colors">
                        <FileText size={18} />
                      </div>
                      <input 
                        type="text"
                        placeholder="Título del anuncio"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>

                    <div className="relative group">
                      <textarea 
                        placeholder="Descripción detallada"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm font-medium min-h-[120px] resize-none"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, type: 'image'})}
                            className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all font-bold text-xs tracking-widest ${
                                formData.type === 'image' 
                                ? 'bg-indigo-500 border-indigo-400 text-white' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                        >
                            <ImageIcon size={16} />
                            IMAGEN
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({...formData, type: 'video'})}
                            className={`flex items-center justify-center gap-2 py-3 rounded-2xl border transition-all font-bold text-xs tracking-widest ${
                                formData.type === 'video' 
                                ? 'bg-indigo-500 border-indigo-400 text-white' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                        >
                            <Video size={16} />
                            VIDEO
                        </button>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-y-0 left-4 flex items-center text-white/40 group-focus-within:text-indigo-400 transition-colors">
                        <ExternalLink size={18} />
                      </div>
                      <input 
                        type="url"
                        placeholder={formData.type === 'image' ? "URL de la imagen" : "Link de YouTube o Video"}
                        value={formData.media_url}
                        onChange={(e) => setFormData({...formData, media_url: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm font-medium"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-white/5"
                  >
                    {editingAnnouncement ? 'GUARDAR CAMBIOS' : 'PUBLICAR ANUNCIO'}
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
