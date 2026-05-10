import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { LightNovel, Chapter } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, where } from 'firebase/firestore';
import { BookOpen, Plus, Trash2, Edit2, Play, ChevronLeft, Calendar, FileText, PlusCircle, X, Trash } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function NovelDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [novel, setNovel] = useState<LightNovel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    order: 1,
    content: [] as any[]
  });

  useEffect(() => {
    if (id) {
       fetchNovel();
       fetchChapters();
    }
  }, [id]);

  const fetchNovel = async () => {
    if (!id) return;
    const docSnap = await getDoc(doc(db, 'novels', id));
    if (docSnap.exists()) {
      setNovel({ id: docSnap.id, ...docSnap.data() } as LightNovel);
    }
  };

  const fetchChapters = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'chapters'), 
        where('novel_id', '==', id),
        orderBy('order', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Chapter[];
      setChapters(docs);
    } catch (err) {
      console.error('Error fetching chapters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addContentItem = (type: 'video' | 'dialogue') => {
    if (type === 'video') {
      setFormData({
        ...formData,
        content: [...formData.content, { type: 'video', youtube_url: '' }]
      });
    } else {
      setFormData({
        ...formData,
        content: [...formData.content, { type: 'dialogue', character_name: '', text: '', is_thinking: false }]
      });
    }
  };

  const removeContentItem = (index: number) => {
    const newContent = [...formData.content];
    newContent.splice(index, 1);
    setFormData({ ...formData, content: newContent });
  };

  const updateContentItem = (index: number, data: any) => {
    const newContent = [...formData.content];
    newContent[index] = { ...newContent[index], ...data };
    setFormData({ ...formData, content: newContent });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await addDoc(collection(db, 'chapters'), {
        ...formData,
        novel_id: id,
        created_at: serverTimestamp()
      });
      fetchChapters();
      setIsModalOpen(false);
      setFormData({ title: '', order: chapters.length + 1, content: [] });
    } catch (err) {
      console.error('Error saving chapter:', err);
    }
  };

  const handleDeleteChapter = async (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Seguro que quieres eliminar este capítulo?')) return;
    try {
      await deleteDoc(doc(db, 'chapters', chapterId));
      fetchChapters();
    } catch (err) {
      console.error('Error deleting chapter:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  if (!novel && !isLoading) {
    return <Layout title="No Encontrado"><div className="text-center py-20">Novela no encontrada.</div></Layout>;
  }

  return (
    <Layout title={novel?.title || 'Cargando...'}>
      <div className="max-w-4xl mx-auto space-y-8">
        <button 
          onClick={() => navigate('/novels')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black tracking-widest text-[10px]"
        >
          <ChevronLeft size={16} />
          VOLVER A BIBLIOTECA
        </button>

        {novel && (
          <div className="flex flex-col md:flex-row gap-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
             <div className="w-full md:w-48 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
               <img src={novel.photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
             </div>
             <div className="flex-1 space-y-4">
               <div className="space-y-2">
                 <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">{novel.title}</h2>
                 <div className="flex gap-2">
                   <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest rounded-full">SPECTRA ORIGINAL</span>
                   <span className="px-2 py-0.5 bg-white/10 text-white/60 border border-white/5 text-[8px] font-black uppercase tracking-widest rounded-full">{chapters.length} CAPÍTULOS</span>
                 </div>
               </div>
               <div className="relative">
                 <p className={cn(
                   "text-white/60 text-sm leading-relaxed transition-all duration-300",
                   isDescriptionExpanded ? "" : "line-clamp-4 md:line-clamp-none"
                 )}>
                   {novel.description}
                 </p>
                 {novel.description && novel.description.length > 300 && (
                   <button 
                     onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                     className="md:hidden text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors"
                   >
                     {isDescriptionExpanded ? 'VER MENOS' : 'VER MÁS'}
                   </button>
                 )}
               </div>
             </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              LISTA DE CAPÍTULOS
            </h3>
            {user?.is_admin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Plus size={20} />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : chapters.length > 0 ? (
            <div className="grid gap-3">
              {chapters.map((chapter) => (
                <motion.div 
                  key={chapter.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => navigate(`/novels/${id}/chapters/${chapter.id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between group hover:bg-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-emerald-500 font-black italic">
                      #{chapter.order}
                    </div>
                    <div>
                      <h4 className="font-bold uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{chapter.title}</h4>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Añadido: {new Date(chapter.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {user?.is_admin && (
                      <button 
                        onClick={(e) => handleDeleteChapter(chapter.id, e)}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/20 group-hover:text-emerald-500 group-hover:border-emerald-500/50 transition-all bg-white/5">
                      <Play size={14} fill="currentColor" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
              <BookOpen size={48} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40 font-medium tracking-wide uppercase text-xs">Aún no hay capítulos publicados.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden relative shadow-2xl max-h-[90vh] flex flex-col"
            >
               <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase tracking-tight">LANZAR CAPÍTULO</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
               </div>
               
               <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                       <div className="col-span-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">TÍTULO DEL CAPÍTULO</label>
                          <input 
                            type="text" 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-emerald-500/50" 
                            required 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 mb-1 block">ORDEN</label>
                          <input 
                            type="number" 
                            value={formData.order} 
                            onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-emerald-500/50" 
                            required 
                          />
                       </div>
                    </div>

                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1 block">CONTENIDO SECUENCIAL</label>
                       {formData.content.map((item, idx) => (
                         <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 gap-4 flex flex-col relative group/item">
                            <button 
                              type="button" 
                              onClick={() => removeContentItem(idx)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-opacity"
                            >
                              <X size={14} />
                            </button>
                            
                            {item.type === 'video' ? (
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-emerald-500 uppercase text-[10px] font-black">
                                     <Play size={12} /> VIDEO YOUTUBE
                                  </div>
                                  <input 
                                    type="url" 
                                    placeholder="https://youtube.com/..." 
                                    value={item.youtube_url}
                                    onChange={e => updateContentItem(idx, { youtube_url: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm outline-none focus:border-emerald-500/50"
                                  />
                               </div>
                            ) : (
                               <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-indigo-400 uppercase text-[10px] font-black">
                                     <FileText size={12} /> DIÁLOGO / PENSAMIENTO
                                  </div>
                                  <div className="flex gap-2">
                                     <input 
                                       placeholder="Personaje (opcional)" 
                                       value={item.character_name}
                                       onChange={e => updateContentItem(idx, { character_name: e.target.value })}
                                       className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm outline-none focus:border-indigo-500/50"
                                     />
                                     <button 
                                       type="button"
                                       onClick={() => updateContentItem(idx, { is_thinking: !item.is_thinking })}
                                       className={`px-3 rounded-xl border text-[8px] font-black uppercase tracking-tighter transition-all ${item.is_thinking ? 'bg-indigo-500 border-indigo-400' : 'bg-white/5 border-white/10 text-white/40'}`}
                                     >
                                       PENSAR
                                     </button>
                                  </div>
                                  <textarea 
                                    placeholder="Escribe el diálogo..."
                                    value={item.text}
                                    onChange={e => updateContentItem(idx, { text: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-3 text-sm outline-none focus:border-indigo-500/50 h-24 resize-none"
                                  />
                               </div>
                            )}
                         </div>
                       ))}
                       
                       <div className="flex gap-3 pt-2">
                          <button 
                            type="button" 
                            onClick={() => addContentItem('video')}
                            className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-emerald-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                          >
                            <PlusCircle size={16} className="text-emerald-500" /> + VIDEO
                          </button>
                          <button 
                            type="button" 
                            onClick={() => addContentItem('dialogue')}
                            className="flex-1 py-3 bg-white/5 border border-white/10 hover:border-indigo-500/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                          >
                            <PlusCircle size={16} className="text-indigo-400" /> + DIÁLOGO
                          </button>
                       </div>
                    </div>

                    <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-[0.2em] uppercase">
                       PUBLICAR CAPÍTULO
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
