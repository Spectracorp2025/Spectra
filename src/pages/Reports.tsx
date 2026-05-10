import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Report } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { ClipboardList, Plus, CheckCircle, X, MessageSquare, AlertTriangle, Lightbulb, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'bug' as 'bug' | 'suggestion' | 'other',
    message: ''
  });

  useEffect(() => {
    fetchReports();
  }, [user]);

  const fetchReports = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let q;
      if (user.is_admin) {
        q = query(collection(db, 'reports'), orderBy('created_at', 'desc'));
      } else {
        q = query(
          collection(db, 'reports'), 
          where('user_id', '==', user.id),
          orderBy('created_at', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Report[];
      setReports(docs);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'reports'), {
        user_id: user.id,
        user_name: user.name,
        type: formData.type,
        message: formData.message,
        status: 'pending',
        created_at: serverTimestamp()
      });
      fetchReports();
      setIsModalOpen(false);
      setFormData({ type: 'bug', message: '' });
    } catch (err) {
      console.error('Error saving report:', err);
    }
  };

  const markResolved = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved'
      });
      fetchReports();
    } catch (err) {
      console.error('Error updating report:', err);
    }
  };

  const handleDelete = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar reporte?')) return;
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'resolved' ? 'text-green-400 bg-green-400/10 border-green-400/20' : 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <AlertTriangle size={18} />;
      case 'suggestion': return <Lightbulb size={18} />;
      default: return <MessageSquare size={18} />;
    }
  };

  return (
    <Layout title="Reportes y Sugerencias">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner">
              <ClipboardList size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight uppercase">SOPORTE SPECTRA</h2>
              <p className="text-white/60 font-medium tracking-wide">Reporta errores o envía sugerencias para mejorar.</p>
            </div>
          </div>
          {!user?.is_admin && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white text-black font-black py-4 px-8 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              <span>NUEVO REPORTE</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div 
                key={report.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black/30 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-xl border ${getTypeIcon(report.type) ? 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' : ''}`}>
                      {getTypeIcon(report.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {user?.is_admin && (
                        <div className="flex items-center gap-2 text-white/40 mb-1">
                          <User size={12} />
                          <span className="text-xs font-bold uppercase">{report.user_name}</span>
                        </div>
                      )}
                       <div className="relative">
                        <p className={cn(
                          "text-white/80 font-medium leading-relaxed transition-all duration-300",
                          expandedId === report.id ? "" : "line-clamp-2"
                        )}>
                          {report.message}
                        </p>
                        {report.message.length > 200 && (
                          <button 
                            onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                            className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-white transition-colors"
                          >
                            {expandedId === report.id ? 'VER MENOS' : 'VER MÁS'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {user?.is_admin && (
                    <div className="flex flex-col md:flex-row items-center gap-2">
                       {report.status === 'pending' && (
                         <button 
                           onClick={(e) => markResolved(report.id, e)}
                           className="flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 font-bold py-2 px-4 rounded-xl transition-all text-xs tracking-widest uppercase w-full md:w-auto"
                         >
                           <CheckCircle size={16} />
                           RESOLVER
                         </button>
                       )}
                       <button 
                         onClick={(e) => handleDelete(report.id, e)}
                         className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10">
            <ClipboardList size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-medium">No has enviado reportes todavía.</p>
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
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black uppercase tracking-tight">NUEVO REPORTE</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                      {['bug', 'suggestion', 'other'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({...formData, type: t as any})}
                          className={`flex-1 py-3 rounded-xl transition-all font-black text-[10px] tracking-widest uppercase ${
                            formData.type === t 
                            ? 'bg-white text-black shadow-lg shadow-white/10' 
                            : 'text-white/40 hover:text-white/60'
                          }`}
                        >
                          {t === 'bug' ? 'ERROR' : t === 'suggestion' ? 'SUGERENCIA' : 'OTRO'}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <textarea 
                        placeholder="Explica detalladamente..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all text-sm font-medium min-h-[160px] resize-none"
                        required
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                  >
                    ENVIAR REPORTE
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
