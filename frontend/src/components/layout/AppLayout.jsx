import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import TopBar from './TopBar';

export default function AppLayout() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? <MobileNav /> : <Sidebar />}
      <div className={isMobile ? 'pt-16' : 'ml-[250px]'}>
        <TopBar />
        <main className={isMobile ? 'px-4 pb-6 pt-4' : 'p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
