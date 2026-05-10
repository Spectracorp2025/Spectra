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
      className="fixed inset-0 -z-10 bg-[#050505] bg-cover bg-center transition-all duration-500"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/40" /> {/* Dark overlay for readability */}
    </div>
  );
}
