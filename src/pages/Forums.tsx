import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { ForumPost } from '../types';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { MessageSquare, ThumbsUp, Plus, Trash2, X, Send, User, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Forums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'forums'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ForumPost[];
      setPosts(docs);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'forums'), {
        user_id: user.id,
        user_name: user.name,
        title: formData.title,
        content: formData.content,
        likes_count: 0,
        comments_count: 0,
        created_at: serverTimestamp()
      });
      fetchPosts();
      setIsModalOpen(false);
      setFormData({ title: '', content: '' });
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar foro?')) return;
    try {
      await deleteDoc(doc(db, 'forums', postId));
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  return (
    <Layout title="Foros">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/20 p-6 rounded-[2rem] backdrop-blur-xl shadow-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-grow">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 flex-shrink-0">
              <MessageSquare size={28} />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-black tracking-tight uppercase">COMUNIDAD SPECTRA</h2>
              <p className="text-white/80 font-medium tracking-wide">Comparte, debate y comenta con otros usuarios.</p>
            </div>
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR TEMA..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-all shadow-lg"
              />
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-black font-black py-3 px-6 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
          >
            <Plus size={20} />
            <span>NUEVO TEMA</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/forums/${post.id}`)}
                className="bg-black/30 border border-white/10 rounded-2xl p-6 hover:bg-white/5 hover:border-indigo-500/30 transition-all cursor-pointer group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{post.title}</h3>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                        <span className="flex items-center gap-1.5"><User size={12} className="text-indigo-500" /> {post.user_name}</span>
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(post.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {user?.is_admin && (
                      <button 
                        onClick={(e) => handleDelete(post.id, e)}
                        className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="relative">
                    <p className={cn(
                      "text-white/60 text-sm leading-relaxed transition-all duration-300",
                      expandedId === post.id ? "" : "line-clamp-2"
                    )}>
                      {post.content}
                    </p>
                    {post.content.length > 150 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === post.id ? null : post.id); }}
                        className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors"
                      >
                        {expandedId === post.id ? 'VER MENOS' : 'VER MÁS'}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-white/40 group-hover:text-indigo-400 transition-colors">
                      <ThumbsUp size={16} />
                      <span className="text-xs font-black">{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/40">
                      <MessageSquare size={16} />
                      <span className="text-xs font-black">{post.comments_count || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10">
            <MessageSquare size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-medium">No hay temas de discusión todavía. ¡Sé el primero!</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden relative shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight">NUEVO TEMA</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <input 
                      type="text" placeholder="Título del tema" value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-5 outline-none focus:border-indigo-500/50 transition-all font-bold" 
                      required 
                    />
                    <textarea 
                      placeholder="¿Qué tienes en mente?" value={formData.content} 
                      onChange={e => setFormData({...formData, content: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-indigo-500/50 h-32 resize-none transition-all" 
                      required 
                    />
                  </div>
                  <button className="w-full bg-white text-black font-black py-4 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs tracking-widest uppercase">
                    PUBLICAR TEMA
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
