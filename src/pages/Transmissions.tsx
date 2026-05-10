import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Stream } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Radio, Plus, Trash2, Edit2, Play, X, Image as ImageIcon, Video, Calendar, Link as LinkIcon, Smartphone, Apple, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Transmissions() {
  const { user } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: '',
    video_url: '',
    stream_url: '',
    start_time: '',
    duration_hours: 3
  });

  useEffect(() => {
    fetchStreams();
    // Auto cleanup interval
    const interval = setInterval(cleanupExpiredStreams, 60000); // check every min
    return () => clearInterval(interval);
  }, []);

  const fetchStreams = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'streams'), orderBy('start_time', 'asc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Stream[];
      setStreams(docs);
    } catch (err) {
      console.error('Error fetching streams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupExpiredStreams = async () => {
    const q = query(collection(db, 'streams'));
    const querySnapshot = await getDocs(q);
    const now = new Date().getTime();
    const batch = writeBatch(db);
    let hasDeletions = false;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const startTime = new Date(data.start_time).getTime();
      const durationMs = (data.duration_hours || 3) * 60 * 60 * 1000;
      
      if (now > startTime + durationMs) {
        batch.delete(doc.ref);
        hasDeletions = true;
      }
    });

    if (hasDeletions) {
      await batch.commit();
      fetchStreams();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStream) {
        await updateDoc(doc(db, 'streams', editingStream.id), formData);
      } else {
        await addDoc(collection(db, 'streams'), {
          ...formData,
          created_at: serverTimestamp()
        });
      }
      fetchStreams();
      closeModal();
    } catch (err) {
      console.error('Error saving stream:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar transmisión?')) return;
    try {
      await deleteDoc(doc(db, 'streams', id));
      fetchStreams();
    } catch (err) {
      console.error('Error deleting stream:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, stream: Stream | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (stream) {
      setEditingStream(stream);
      setFormData({
        title: stream.title,
        description: stream.description,
        photo_url: stream.photo_url,
        video_url: stream.video_url || '',
        stream_url: stream.stream_url,
        start_time: stream.start_time,
        duration_hours: stream.duration_hours || 3
      });
    } else {
      setEditingStream(null);
      setFormData({ title: '', description: '', photo_url: '', video_url: '', stream_url: '', start_time: '', duration_hours: 3 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStream(null);
  };

  const getCountdown = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = start - now;

    if (diff <= 0) return 'EN VIVO';

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newCountdowns: Record<string, string> = {};
      streams.forEach(s => {
        newCountdowns[s.id] = getCountdown(s.start_time);
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(timer);
  }, [streams]);

  return (
    <Layout title="Transmisiones">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* App Download Notification */}
        <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-indigo-600/20 border border-indigo-500/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-5 relative">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white">
              <Smartphone size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight">EXPERIENCIA MÓVIL RV</h3>
              <p className="text-indigo-200/60 font-medium text-sm">Para disfrutar al máximo, descarga la aplicación RV para Android o iPhone.</p>
            </div>
          </div>
          <div className="flex gap-3 relative">
            <button className="flex items-center gap-2 bg-white text-black py-2.5 px-5 rounded-xl font-black text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95">
              <Smartphone size={16} /> ANDROID
            </button>
            <button className="flex items-center gap-2 bg-white/10 border border-white/5 text-white py-2.5 px-5 rounded-xl font-black text-[10px] tracking-widest transition-all hover:bg-white/20">
              <Apple size={16} /> IPHONE
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-500 animate-pulse">
              <Radio size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">SALA DE TRANSMISIÓN</h2>
              <p className="text-white/60 font-medium tracking-wide">No te pierdas de los mejores eventos en vivo.</p>
            </div>
          </div>
          {user?.is_admin && (
            <button 
              onClick={(e) => openModal(e)}
              className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-red-500/20"
            >
              <Plus size={20} />
              <span>NUEVA TRANSMISIÓN</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
          </div>
        ) : streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {streams.map((stream) => (
              <motion.div 
                key={stream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 border border-white/10 rounded-3xl overflow-hidden group hover:border-red-500/30 transition-all flex flex-col"
              >
                <div className="relative aspect-video">
                  <img src={stream.photo_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase rounded-full shadow-lg">
                      <Radio size={12} className={countdowns[stream.id] === 'EN VIVO' ? 'animate-pulse' : ''} />
                      {countdowns[stream.id] === 'EN VIVO' ? 'EN VIVO' : 'PROGRAMADO'}
                    </div>
                  </div>

                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] min-w-[200px] text-center shadow-2xl">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2 block">COMIENZA EN</span>
                        <div className="text-4xl font-black tabular-nums tracking-tighter text-white">
                           {countdowns[stream.id] || '00:00:00'}
                        </div>
                     </div>
                  </div>

                  {user?.is_admin && (
                    <div className="absolute top-4 right-4 flex gap-2">
                       <button onClick={(e) => openModal(e, stream)} className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-black transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={(e) => handleDelete(e, stream.id)} className="p-2 bg-red-500/80 backdrop-blur-md rounded-xl text-white hover:bg-red-600 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-6 flex-grow flex flex-col">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2 group-hover:text-red-500 transition-colors">{stream.title}</h3>
                    <div className="relative">
                      <p className={cn(
                        "text-white/60 text-sm font-medium leading-relaxed transition-all duration-300",
                        expandedId === stream.id ? "" : "line-clamp-2"
                      )}>
                        {stream.description}
                      </p>
                      {stream.description.length > 150 && (
                        <button 
                          onClick={() => setExpandedId(expandedId === stream.id ? null : stream.id)}
                          className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors"
                        >
                          {expandedId === stream.id ? 'VER MENOS' : 'VER MÁS'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-white/30 border-t border-white/5 pt-6">
                     <span className="flex items-center gap-2"><Calendar size={14} /> {new Date(stream.start_time).toLocaleString()}</span>
                     <span className="flex items-center gap-2"><Play size={14} /> {stream.duration_hours} HORAS</span>
                  </div>

                  <button 
                    onClick={() => window.open(stream.stream_url, '_blank')}
                    disabled={countdowns[stream.id] !== 'EN VIVO'}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black tracking-[0.2em] transition-all uppercase shadow-xl ${
                      countdowns[stream.id] === 'EN VIVO' 
                      ? 'bg-white text-black hover:scale-105 active:scale-95' 
                      : 'bg-white/5 text-white/20 border border-white/5 grayscale cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink size={20} />
                    {countdowns[stream.id] === 'EN VIVO' ? 'INGRESAR AL VIVO' : 'TRANSMISIÓN NO INICIADA'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
            <Radio size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-medium uppercase tracking-widest text-[10px]">No hay transmisiones programadas.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] w-full max-w-xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight">DATOS DE TRANSMISIÓN</h3>
                  <button onClick={closeModal} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <input 
                      type="text" placeholder="Título del evento" value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50" 
                      required 
                    />
                    <textarea 
                      placeholder="Descripción" value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50 h-24" 
                      required 
                    />
                    <div className="grid grid-cols-2 gap-4">
                       <input 
                         type="url" placeholder="URL de Portada" value={formData.photo_url} 
                         onChange={e => setFormData({...formData, photo_url: e.target.value})}
                         className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50" 
                         required 
                       />
                       <input 
                         type="url" placeholder="Link de Transmisión" value={formData.stream_url} 
                         onChange={e => setFormData({...formData, stream_url: e.target.value})}
                         className="bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50" 
                         required 
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black text-white/40 uppercase mb-1 ml-1 block">INICIO (LOCAL)</label>
                          <input 
                            type="datetime-local" value={formData.start_time} 
                            onChange={e => setFormData({...formData, start_time: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50" 
                            required 
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-white/40 uppercase mb-1 ml-1 block">DURACIÓN (HORAS)</label>
                          <input 
                            type="number" value={formData.duration_hours} 
                            onChange={e => setFormData({...formData, duration_hours: parseInt(e.target.value)})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-red-500/50" 
                            required 
                          />
                       </div>
                    </div>
                  </div>

                  <button className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest uppercase">
                    {editingStream ? 'ACTUALIZAR TRANSMISIÓN' : 'VOLVER PÚBLICO'}
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
