import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../App';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ShoppingBag, Plus, Trash2, Edit2, ExternalLink, X, DollarSign, Image as ImageIcon, Link as LinkIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Store() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    photo_url: '',
    online_url: '',
    price_cop: ''
  });

  const WHATSAPP_NUMBER = '3009555880';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'products'), orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Product[];
      
      setProducts(docs);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      price_cop: parseInt(formData.price_cop)
    };

    try {
      if (editingProduct) {
        const docRef = doc(db, 'products', editingProduct.id);
        await updateDoc(docRef, payload);
      } else {
        await addDoc(collection(db, 'products'), {
          ...payload,
          created_at: serverTimestamp()
        });
      }
      fetchProducts();
      closeModal();
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Error al eliminar: ' + (err instanceof Error ? err.message : 'No tienes permisos'));
    }
  };

  const openModal = (e: React.MouseEvent | null, product: Product | null = null) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        photo_url: product.photo_url,
        online_url: product.online_url,
        price_cop: product.price_cop.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', photo_url: '', online_url: '', price_cop: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const buyProduct = (product: Product) => {
    const text = `Hola, quiero comprar el producto: ${product.name} (Precio: $${product.price_cop} COP)`;
    window.open(`https://wa.me/57${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-white/60 font-bold uppercase tracking-[0.2em] text-sm mb-2">Sección de Compras</h2>
            <h1 className="text-4xl font-black tracking-tighter">TIENDA</h1>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group min-w-[280px]">
              <input 
                type="text"
                placeholder="BUSCAR PRODUCTO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest placeholder:text-white/40 focus:outline-none focus:border-indigo-500 transition-all shadow-2xl"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40">
                <ShoppingBag size={18} />
              </div>
            </div>

            {user?.is_admin && (
              <button 
                onClick={(e) => openModal(e)}
                className="bg-white text-black font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-white/10 h-12"
              >
                <Plus size={20} />
                <span className="md:inline">Añadir Producto</span>
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] h-96 animate-pulse" />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <motion.div 
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col relative"
              >
                <div className="aspect-square w-full overflow-hidden relative">
                   <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full font-black text-sm text-indigo-400">
                     ${product.price_cop.toLocaleString('es-CO')} COP
                   </div>
                   {user?.is_admin && (
                      <div className="absolute top-4 left-4 flex gap-2">
                        <button onClick={(e) => openModal(e, product)} className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all text-white border border-white/10">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={(e) => handleDelete(e, product.id)} className="p-2 bg-red-500/20 backdrop-blur-md rounded-xl hover:bg-red-500/40 transition-all text-red-400 border border-red-500/20">
                          <Trash2 size={16} />
                        </button>
                      </div>
                   )}
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-black mb-2 uppercase tracking-tight">{product.name}</h3>
                  <div className="relative">
                    <p className={cn(
                      "text-white/60 text-sm font-medium mb-4 transition-all duration-300",
                      expandedId === product.id ? "" : "line-clamp-3"
                    )}>
                      {product.description}
                    </p>
                    {product.description.length > 100 && (
                      <button 
                        onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                        className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 hover:text-white transition-colors"
                      >
                        {expandedId === product.id ? 'VER MENOS' : 'VER MÁS'}
                      </button>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 flex gap-3">
                    <button 
                      onClick={() => buyProduct(product)}
                      className="flex-1 bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-400 hover:text-white transition-all shadow-lg active:scale-95"
                    >
                      <ShoppingBag size={18} />
                      COMPRAR AHORA
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <ShoppingBag size={64} className="mx-auto text-white/10 mb-4" />
              <p className="text-white/40 font-bold uppercase tracking-widest">No hay productos disponibles</p>
            </div>
          )}
        </div>

        {/* Admin Modal */}
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
                className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
              >
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tighter">{editingProduct ? 'Editar' : 'Nuevo'} Producto</h2>
                  <button onClick={closeModal} className="text-white/40 hover:text-white transition-all"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Nombre</label>
                       <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center text-white/20"><FileText size={16} /></div>
                          <input required name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 transition-all text-sm font-medium" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Precio (COP)</label>
                       <div className="relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center text-white/20"><DollarSign size={16} /></div>
                          <input required type="number" name="price_cop" value={formData.price_cop} onChange={(e) => setFormData({...formData, price_cop: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 transition-all text-sm font-medium" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">Descripción</label>
                     <textarea required name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 outline-none focus:border-indigo-500/50 transition-all text-sm font-medium resize-none" />
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">URL de Foto</label>
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center text-white/20"><ImageIcon size={16} /></div>
                        <input required name="photo_url" value={formData.photo_url} onChange={(e) => setFormData({...formData, photo_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 transition-all text-sm font-medium" />
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase text-white/40 px-2 tracking-widest">URL Online (Opcional)</label>
                     <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center text-white/20"><LinkIcon size={16} /></div>
                        <input name="online_url" value={formData.online_url} onChange={(e) => setFormData({...formData, online_url: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 outline-none focus:border-indigo-500/50 transition-all text-sm font-medium" />
                     </div>
                  </div>

                  <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4 uppercase">
                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
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
