import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { ForumPost, ForumComment } from '../types';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, increment, serverTimestamp, getDoc, setDoc, deleteDoc, where } from 'firebase/firestore';
import { MessageSquare, ThumbsUp, ChevronLeft, Send, Trash2, User, Clock, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [hasLiked, setHasLiked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      if (user) checkLikeStatus();
    }
  }, [id, user]);

  const fetchPost = async () => {
    if (!id) return;
    const docSnap = await getDoc(doc(db, 'forums', id));
    if (docSnap.exists()) {
      setPost({ id: docSnap.id, ...docSnap.data() } as ForumPost);
    }
  };

  const fetchComments = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'forums', id, 'comments'),
        orderBy('created_at', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as ForumComment[];
      setComments(docs);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLikeStatus = async () => {
    if (!id || !user) return;
    const likeDoc = await getDoc(doc(db, 'forums', id, 'likes', user.id));
    setHasLiked(likeDoc.exists());
  };

  const handleLike = async () => {
    if (!id || !user || !post) return;
    const likeRef = doc(db, 'forums', id, 'likes', user.id);
    const postRef = doc(db, 'forums', id);

    try {
      if (hasLiked) {
        await deleteDoc(likeRef);
        await updateDoc(postRef, { likes_count: increment(-1) });
        setHasLiked(false);
        setPost({ ...post, likes_count: post.likes_count - 1 });
      } else {
        await setDoc(likeRef, { created_at: serverTimestamp() });
        await updateDoc(postRef, { likes_count: increment(1) });
        setHasLiked(true);
        setPost({ ...post, likes_count: post.likes_count + 1 });
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !newComment.trim()) return;

    try {
      await addDoc(collection(db, 'forums', id, 'comments'), {
        post_id: id,
        user_id: user.id,
        user_name: user.name,
        content: newComment,
        created_at: serverTimestamp()
      });
      await updateDoc(doc(db, 'forums', id), {
        comments_count: increment(1)
      });
      setNewComment('');
      fetchComments();
      if (post) setPost({ ...post, comments_count: post.comments_count + 1 });
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  const handleDeleteComment = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    if (!id || !confirm('¿Eliminar comentario?')) return;
    try {
      await deleteDoc(doc(db, 'forums', id, 'comments', commentId));
      await updateDoc(doc(db, 'forums', id), {
        comments_count: increment(-1)
      });
      fetchComments();
      if (post) setPost({ ...post, comments_count: post.comments_count - 1 });
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  if (!post && !isLoading) {
    return <Layout title="No Encontrado"><div className="text-center py-20">Post no encontrado.</div></Layout>;
  }

  return (
    <Layout title={post?.title || 'Cargando...'}>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <button 
          onClick={() => navigate('/forums')}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-black tracking-widest text-[10px]"
        >
          <ChevronLeft size={16} />
          VOLVER AL FORO
        </button>

        {post && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white/60">
                   <User size={24} />
                 </div>
                 <div>
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-black uppercase text-white tracking-widest">{post.user_name}</span>
                     {user?.is_admin && <ShieldCheck size={14} className="text-indigo-400" />}
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">
                     <Clock size={12} /> {new Date(post.created_at).toLocaleString()}
                   </div>
                 </div>
               </div>
            </div>

            <h1 className="text-4xl font-black tracking-tighter uppercase mb-6 leading-none text-white">{post.title}</h1>
            <p className="text-xl text-white/70 leading-relaxed font-medium whitespace-pre-wrap mb-10">{post.content}</p>

            <div className="flex items-center gap-4 pt-8 border-t border-white/5">
               <button 
                 onClick={handleLike}
                 className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black transition-all text-xs tracking-widest uppercase ${
                   hasLiked 
                   ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                   : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/5'
                 }`}
               >
                 <ThumbsUp size={18} fill={hasLiked ? "white" : "none"} />
                 {post.likes_count} ME GUSTA
               </button>
               <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white/30 text-xs font-black uppercase tracking-widest">
                 <MessageSquare size={18} />
                 {post.comments_count} COMENTARIOS
               </div>
            </div>
          </motion.div>
        )}

        <div className="space-y-6">
           <h3 className="text-lg font-black uppercase tracking-tight ml-4 flex items-center gap-2">
             COMENTARIOS <span className="text-white/20">({comments.length})</span>
           </h3>

           <form onSubmit={handleComment} className="relative group">
              <textarea 
                placeholder="Escribe lo que piensas..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-6 px-8 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium min-h-[120px] resize-none text-white pr-20"
                required
              />
              <button 
                type="submit"
                className="absolute right-6 bottom-6 p-4 bg-white text-black rounded-[1.5rem] shadow-xl hover:scale-110 active:scale-90 transition-all"
              >
                <Send size={24} />
              </button>
           </form>

           {isLoading ? (
             <div className="flex justify-center py-10">
               <div className="w-8 h-8 border-3 border-white/5 border-t-indigo-500 rounded-full animate-spin"></div>
             </div>
           ) : comments.length > 0 ? (
             <div className="space-y-4">
                {comments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-black/30 border border-white/10 rounded-3xl p-6 hover:border-indigo-500/20 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                       <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/20 mt-1">
                           <User size={20} />
                         </div>
                         <div>
                           <div className="flex items-center gap-3 mb-2">
                             <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{comment.user_name}</span>
                             <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">{new Date(comment.created_at).toLocaleDateString()}</span>
                           </div>
                           <p className="text-white/60 text-sm leading-relaxed">{comment.content}</p>
                         </div>
                       </div>
                       {(user?.is_admin || user?.id === comment.user_id) && (
                         <button 
                           onClick={(e) => handleDeleteComment(e, comment.id)}
                           className="p-2 text-white/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/5">
                <MessageSquare size={32} className="mx-auto text-white/10 mb-2" />
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Aún no hay comentarios aquí.</p>
             </div>
           )}
        </div>
      </div>
    </Layout>
  );
}
