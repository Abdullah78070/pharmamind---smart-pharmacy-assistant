import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Settings, 
  PieChart, 
  Menu, 
  X,
  Pill,
  Truck,
  Users
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
    { label: 'حاسبة الفواتير', path: '/calculator', icon: Calculator },
    { label: 'الموردين', path: '/suppliers', icon: Truck },
    { label: 'العملاء والديون', path: '/clients', icon: Users },
    { label: 'سجل الفواتير', path: '/invoices', icon: FileText },
    { label: 'التقارير الذكية', path: '/reports', icon: PieChart },
    { label: 'الإعدادات', path: '/settings', icon: Settings },
  ];

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white">
      {/* Mobile Header */}
      <div className="bg-primary-600 text-white p-4 flex justify-between items-center md:hidden no-print">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Pill className="w-6 h-6" /> PharmaMind
        </h1>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden no-print"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 right-0 z-30 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none border-l border-gray-200 no-print
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-100 hidden md:flex items-center gap-3 text-primary-600">
             <Pill className="w-8 h-8" />
             <span className="text-2xl font-bold tracking-tight">PharmaMind</span>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-primary-50 text-primary-700 font-bold shadow-sm' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            نسخة تجريبية 1.0.0
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;