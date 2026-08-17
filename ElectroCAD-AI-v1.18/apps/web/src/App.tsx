import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import AppRoutes from './routes/AppRoutes';

const publicPaths = ['/', '/login', '/register'];

export default function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isPublicLayout = useMemo(() => publicPaths.includes(location.pathname), [location.pathname]);

  if (isPublicLayout) {
    return <div className="min-h-screen bg-slate-100"><main className="min-h-screen"><AppRoutes /></main></div>;
  }

  return (
    <div className="app-shell flex min-h-screen bg-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-6"><AppRoutes /></main>
      </div>
    </div>
  );
}
