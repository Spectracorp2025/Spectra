import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { Chapter, LightNovel } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, MessageSquare, User, SkipForward, SkipBack } from 'lucide-react';
import { motion } from 'motion/react';

export default function ChapterReader() {
  const { novelId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [novel, setNovel] = useState<LightNovel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!novelId || !chapterId) return;
      setIsLoading(true);
      try {
        const novelSnap = await getDoc(doc(db, 'novels', novelId));
        const chapterSnap = await getDoc(doc(db, 'chapters', chapterId));
        
        if (novelSnap.exists() && chapterSnap.exists()) {
          setNovel({ id: novelSnap.id, ...novelSnap.data() } as LightNovel);
          setChapter({ id: chapterSnap.id, ...chapterSnap.data() } as Chapter);
        }
      } catch (err) {
        console.error('Error loading chapter:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [novelId, chapterId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!chapter || !novel) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white p-6">
        <h2 className="text-2xl font-black uppercase">Capítulo no encontrado</h2>
        <button onClick={() => navigate(`/novels/${novelId}`)} className="text-emerald-400 font-bold flex items-center gap-2">
          <ChevronLeft size={20} /> VOLVER A LA NOVELA
        </button>
      </div>
    );
  }

  const getYoutubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30">
      {/* Top Bar */}
      <header className="sticky top-0 z-[50] bg-black/60 backdrop-blur-2xl border-b border-white/5 py-4 px-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(`/novels/${novelId}`)} 
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center flex-1 mx-4 min-w-0">
          <h1 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-0.5 truncate">{novel.title}</h1>
          <h2 className="text-xs font-bold uppercase tracking-tight truncate">{chapter.title}</h2>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Reader Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        {chapter.content.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full"
          >
            {item.type === 'video' ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
                <iframe 
                   src={getYoutubeEmbedUrl(item.youtube_url)}
                   className="w-full h-full"
                   frameBorder="0"
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                   allowFullScreen
                />
              </div>
            ) : (
              <div className="relative px-6 py-2">
                 {item.character_name && (
                   <div className="flex items-center gap-1.5 mb-2 ml-2">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                     <span className="text-[11px] font-black uppercase tracking-[0.15em] text-emerald-500">
                       {item.character_name}
                     </span>
                   </div>
                 )}
                 <div className={`relative p-6 rounded-2xl ${item.is_thinking ? 'bg-indigo-500/5 italic border-indigo-500/20' : 'bg-white/5 border-white/10'} border backdrop-blur-sm group`}>
                    <div className="absolute -left-2 top-6 w-4 h-4 bg-inherit border-l border-t border-inherit rotate-[-45deg]" />
                    <p className={`text-lg leading-relaxed ${item.is_thinking ? 'text-white/60 font-medium' : 'text-white/90 font-bold'}`}>
                      {item.is_thinking && <span className="mr-2 text-indigo-400/60 font-black not-italic opacity-50">"</span>}
                      {item.text}
                      {item.is_thinking && <span className="ml-1 text-indigo-400/60 font-black not-italic opacity-50">"</span>}
                    </p>
                    <div className="mt-4 flex justify-end">
                       <MessageSquare size={12} className={item.is_thinking ? 'text-indigo-500' : 'text-emerald-500'} />
                    </div>
                 </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Ending / Next Chapter */}
        <div className="pt-20 pb-40 text-center space-y-8 border-t border-white/5">
           <div className="space-y-2">
             <h3 className="text-2xl font-black uppercase tracking-tighter italic">FIN DEL CAPÍTULO</h3>
             <p className="text-white/30 text-xs font-bold tracking-[0.3em] uppercase">SPECTRA LIGHT NOVELS</p>
           </div>
           <button 
             onClick={() => navigate(`/novels/${novelId}`)}
             className="inline-flex items-center gap-2 bg-white text-black font-black px-10 py-5 rounded-full hover:scale-110 active:scale-95 transition-all text-xs tracking-widest uppercase shadow-2xl"
           >
              VOLVER AL MENÚ
           </button>
        </div>
      </div>
    </div>
  );
}
