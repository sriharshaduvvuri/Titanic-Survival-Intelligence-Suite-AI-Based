import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  User, 
  BrainCircuit, 
  Layers, 
  BarChart4, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Menu, 
  ChevronLeft, 
  Sun, 
  Moon,
  Ship,
  Home
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  theme: string;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  theme,
  toggleTheme
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { id: 'landing', label: 'Landing Page', icon: <Home className="w-5 h-5" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, protected: true },
    { id: 'prediction', label: 'Prediction Center', icon: <BrainCircuit className="w-5 h-5" />, protected: true },
    { id: 'eai', label: 'Explainable AI', icon: <Layers className="w-5 h-5" />, protected: true },
    { id: 'batch', label: 'Batch Prediction', icon: <Ship className="w-5 h-5" />, protected: true },
    { id: 'analytics', label: 'Analytics Lab', icon: <BarChart4 className="w-5 h-5" />, protected: true },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" />, protected: true },
    { id: 'admin', label: 'Admin Panel', icon: <ShieldCheck className="w-5 h-5" />, protected: true, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, protected: true },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.protected) return true;
    if (!user) return false;
    if (item.adminOnly && user.role !== 'admin') return false;
    return true;
  });

  return (
    <div 
      className={`h-screen transition-all duration-300 relative flex flex-col border-r 
        ${isCollapsed ? 'w-20' : 'w-72'} 
        dark:border-white/5 border-slate-200 bg-white/30 dark:bg-slate-950/40 backdrop-blur-xl`}
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-between border-b dark:border-white/5 border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white flex-shrink-0">
            <Ship className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-md leading-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Titanic Suite
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-indigo-500 dark:text-cyan-400 uppercase">
                Intelligence
              </span>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg border dark:border-white/5 border-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 dark:text-slate-500 hover:text-indigo-500"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-grow py-6 px-4 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin">
        {filteredItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium group text-left
                ${isActive 
                  ? 'bg-gradient-to-r from-indigo-500/15 to-cyan-500/10 dark:from-indigo-500/10 dark:to-cyan-500/5 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-white/5 border border-transparent'
                }`}
            >
              <div className={`transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-indigo-500 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                {item.icon}
              </div>
              {!isCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* Theme Toggle & User Profile */}
      <div className="p-4 border-t dark:border-white/5 border-slate-200 flex flex-col gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full p-2.5 rounded-xl border dark:border-white/5 border-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 transition-all duration-300"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            {!isCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>}
          </div>
          {!isCollapsed && (
            <div className="w-8 h-4 rounded-full bg-slate-300 dark:bg-slate-800 relative flex items-center px-0.5">
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4 bg-indigo-500' : 'translate-x-0'}`} />
            </div>
          )}
        </button>

        {/* User Card */}
        {user ? (
          <div className={`flex items-center justify-between p-2 rounded-xl dark:bg-white/5 bg-slate-100/50 border dark:border-white/5 border-slate-200/50 overflow-hidden`}>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/10 flex-shrink-0">
                {getInitials(user.full_name)}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold truncate text-slate-800 dark:text-slate-200">
                    {user.full_name || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize font-semibold tracking-wider">
                    {user.role} Account
                  </span>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          !isCollapsed && (
            <button
              onClick={() => setCurrentTab('login')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-medium text-sm shadow-lg shadow-indigo-500/20 transition-all duration-300"
            >
              <User className="w-4 h-4" />
              <span>Sign In / Register</span>
            </button>
          )
        )}
      </div>
    </div>
  );
};
