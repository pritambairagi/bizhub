import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ChatPanel from './ChatPanel';
import { cn } from '@/lib/utils';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div
        className={cn(
          'flex flex-col transition-all duration-300 min-h-screen',
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        <Header
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onChatToggle={() => setChatOpen(!chatOpen)}
        />
        <main className="flex-1 p-4 md:p-6 bg-background"><Outlet /></main>
      </div>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}