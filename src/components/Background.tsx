import { useEffect, useState } from 'react';

export default function Background() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const bgImage = isMobile ? '/bg/background.png' : '/bg/pc.png';

  return (
    <div 
      className="fixed inset-0 -z-10 bg-[#050505] transition-all duration-500 overflow-hidden"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ 
          backgroundImage: `url(${bgImage})`,
          transform: 'translateZ(0)', // Force GPU acceleration
        }}
      />
      <div className="absolute inset-0 bg-black/70" /> {/* Increased overlay opacity for better contrast */}
    </div>
  );
}
