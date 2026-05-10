import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Plan } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { 
  CreditCard, Plus, Trash2, Edit2, ShoppingCart, 
  X, Image as ImageIcon, FileText, Infinity, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    photo_url: '',
    price_cop: '',
    duration: 'monthly' as any
  });

  const WHATSAPP_NUMBER = '3009555880';

  useEffect(() => { fetchPlans(); }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'plans'), orderBy('price_cop', 'asc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Plan[];
      
      setPlans(docs);
    } catch (err) { 
      console.error('Error fetching plans:', err); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, price_cop: parseInt(formData.price_cop) };
    try {
      if (editingPlan) {
        await updateDoc(doc(db, 'plans', editingPlan.id), payload);
      } else {
        await addDoc(collection(db, 'plans'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      fetchPlans();
      closeModal();
    } catch (err) { console.error('Error saving plan:', err); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar plan?')) return;
    try { 
      await deleteDoc(doc(db, 'plans', id));
      fetchPlans(); 
    } catch (err) { 
        console.error('Error deleting plan:', err);
        alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, p: Plan | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (p) {
      setEditingPlan(p);
      setFormData({
        title: p.title,
        description: p.description,
        photo_url: p.photo_url,
        price_cop: p.price_cop.toString(),
        duration: p.duration
      });
    } else {
      setEditingPlan(null);
      setFormData({ title: '', description: '', photo_url: '', price_cop: '', duration: 'monthly' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingPlan(null); };

  const buyPlan = (plan: Plan) => {
    const text = `Hola, quiero adquirir el plan: ${plan.title} (${plan.duration}) - Precio: $${plan.price_cop} COP`;
    window.open(`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Upgrade Your Status</h2>
            <h1 className="text-4xl font-black tracking-tighter">PLANES</h1>
          </div>
          {user?.is_admin && (
            <button onClick={(e) => openModal(e)} className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all">
              <Plus size={20} />
              <span className="hidden md:inline">Nuevo Plan</span>
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {isLoading ? Array(2).fill(0).map((_, i) => <div key={i} className="bg-white/5 rounded-[2.5rem] h-96 animate-pulse" />) : plans.map(plan => (
               <motion.div 
                 key={plan.id}
                 layout
                 className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] p-4 flex flex-col relative"
               >
                  <div className="aspect-video w-full rounded-[2rem] overflow-hidden mb-6">
                     <img src={plan.photo_url} alt={plan.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  
                  <div className="px-4 pb-6 flex-1 flex flex-col">
                     <div className="flex items-baseline gap-2 mb-2">
                        <h3 className="text-2xl font-black uppercase tracking-tight">{plan.title}</h3>
                     </div>
                     
                     <div className="flex items-center gap-2 mb-4 bg-indigo-500/10 border border-indigo-500/20 self-start px-3 py-1 rounded-full">
                        <span className="text-indigo-400 font-black text-lg">${plan.price_cop.toLocaleString('es-CO')}</span>
                        <span className="text-white/40 text-[10px] font-bold uppercase uppercase">/ {plan.duration === 'lifetime' ? 'VITALICIO' : plan.duration === 'monthly' ? 'MES' : plan.duration === 'quarterly' ? 'TRIMESTRE' : 'AÑO'}</span>
                     </div>

                     <div className="relative">
                       <p className={cn(
                         "text-white/60 text-sm font-medium mb-8 leading-relaxed transition-all duration-300",
                         expandedId === plan.id ? "" : "line-clamp-3"
                       )}>
                         {plan.description}
                       </p>
                       {plan.description.length > 150 && (
                         <button 
                           onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                           className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-white transition-colors"
                         >
                           {expandedId === plan.id ? 'VER MENOS' : 'VER MÁS'}
                         </button>
                       )}
                     </div>
                     
                     <button 
                       onClick={() => buyPlan(plan)}
                       className="w-full mt-auto bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-white/5"
                     >
                       <ShoppingCart size={18} />
                       ADQUIRIR AHORA
                     </button>
                  </div>

                  {user?.is_admin && (
                    <div className="absolute top-6 right-6 flex gap-2">
                       <button onClick={(e) => openModal(e, plan)} className="p-2 bg-black/40 rounded-xl text-white hover:text-indigo-400 border border-white/5"><Edit2 size={16} /></button>
                       <button onClick={(e) => handleDelete(e, plan.id)} className="p-2 bg-black/40 rounded-xl text-red-500 hover:text-red-400 border border-white/5"><Trash2 size={16} /></button>
                    </div>
                  )}
               </motion.div>
           ))}
        </div>

        <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black uppercase mb-6">{editingPlan ? 'Editar' : 'Nuevo'} Plan</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input required placeholder="Título del Plan" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            <textarea required placeholder="Descripción de Beneficios" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium resize-none" />
                            <input required type="number" placeholder="Precio (COP)" value={formData.price_cop} onChange={e => setFormData({...formData, price_cop: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Duración</label>
                                <select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium text-white/60">
                                   <option value="monthly">Mensual</option>
                                   <option value="quarterly">Trimestral</option>
                                   <option value="annual">Anual</option>
                                   <option value="lifetime">Vitalicio</option>
                                </select>
                            </div>

                            <input required placeholder="URL Foto" value={formData.photo_url} onChange={e => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all font-medium" />
                            
                            <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                                Guardar Plan
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
