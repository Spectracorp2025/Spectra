import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  ShoppingBag, 
  Gamepad2, 
  Monitor, 
  Wrench, 
  Share2, 
  UserCircle, 
  CreditCard,
  Megaphone,
  ClipboardList,
  BookOpen,
  Radio,
  MessageSquare,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import React from 'react';
import { useAuth } from '../App';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/store', label: 'Tienda', icon: ShoppingBag },
  { path: '/games', label: 'Juegos Movil', icon: Gamepad2 },
  { path: '/videogames', label: 'Videojuegos', icon: Monitor },
  { path: '/tools', label: 'Herramientas', icon: Wrench },
  { path: '/announcements', label: 'Anuncios', icon: Megaphone },
  { path: '/novels', label: 'Novelas', icon: BookOpen },
  { path: '/transmissions', label: 'En Vivo', icon: Radio },
  { path: '/forums', label: 'Foro', icon: MessageSquare },
  { path: '/networks', label: 'Redes', icon: Share2 },
  { path: '/accounts', label: 'Cuentas', icon: UserCircle },
  { path: '/reports', label: 'Reportes', icon: ClipboardList },
  { path: '/plans', label: 'Planes', icon: CreditCard },
];

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 fixed h-full z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-black/50 border border-white/10 group">
              <img 
                src="/logo.png" 
                alt="S" 
                className="w-full h-full object-contain scale-150 transition-transform duration-500 group-hover:scale-[1.7]" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerText = 'S';
                  }
                }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-wider italic">SPECTRA</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 space-y-2 custom-scrollbar pb-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                location.pathname === item.path 
                  ? "bg-white/10 text-white shadow-lg shadow-white/5 border border-white/10" 
                  : "text-white/80 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={18} className={cn(location.pathname === item.path ? "text-indigo-400" : "text-white/40 group-hover:text-indigo-400")} />
              <span className="font-bold text-sm tracking-tight">{item.label.toUpperCase()}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <div className="mb-4">
            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-3">ID Usuario</p>
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-sm font-black text-indigo-400 border border-indigo-500/10">
                {user?.name[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black truncate text-white">{user?.name.toUpperCase()}</p>
                <div className={cn(
                  "text-[8px] font-black px-2 py-0.5 rounded-full inline-block uppercase tracking-tighter mt-1",
                  user?.rank === 'Plus' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                  user?.rank === 'Premium' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/10 text-white/40'
                )}>
                  {user?.rank}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            id="logout-button"
            className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-xs tracking-widest uppercase border border-red-500/20"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-[60] bg-black/60 backdrop-blur-2xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
            <img 
              src="/logo.png" 
              alt="S" 
              className="w-full h-full object-contain scale-150" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  target.parentElement.innerText = 'S';
                }
              }}
            />
          </div>
          <h1 className="text-xl font-black tracking-wider italic">SPECTRA</h1>
        </div>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[58] md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[80%] z-[59] bg-[#050505] border-r border-white/10 pt-24 pb-8 flex flex-col shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto px-6 space-y-2 custom-scrollbar">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all",
                      location.pathname === item.path 
                        ? "bg-white/10 text-white border border-white/10" 
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className={cn(location.pathname === item.path ? "text-indigo-400" : "text-white/20")} />
                    <span className="font-bold text-sm tracking-widest uppercase">{item.label}</span>
                  </Link>
                ))}
              </div>
              
              <div className="px-6 pt-6 border-t border-white/5 mt-auto">
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-4 w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black text-xs tracking-[0.2em] uppercase border border-red-500/20"
                >
                  <LogOut size={20} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 pt-20 md:pt-0">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
