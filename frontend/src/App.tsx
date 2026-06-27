import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PredictionCenter } from './pages/PredictionCenter';
import { ExplainableAI } from './pages/ExplainableAI';
import { BatchPrediction } from './pages/BatchPrediction';
import { AnalyticsLab } from './pages/AnalyticsLab';
import { Reports } from './pages/Reports';
import { AdminPanel } from './pages/AdminPanel';
import { Settings } from './pages/Settings';
import { ToastProvider, useToast } from './components/NotificationToast';
import { authApi } from './utils/api';

const getExpiryFromToken = (token: string | null): number | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (e) {
    return null;
  }
};

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>('dark');
  const [activeXaiData, setActiveXaiData] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const { showToast } = useToast();

  // Session Expiration Countdown Warning
  useEffect(() => {
    if (!token) {
      setTimeRemaining(null);
      setShowWarningModal(false);
      return;
    }

    const checkExpiry = () => {
      const expiry = getExpiryFromToken(token);
      if (!expiry) return;

      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        handleLogout();
        showToast('Your session has expired. Please sign in again.', 'warning');
      } else if (diff <= 5 * 60 * 1000) {
        setTimeRemaining(diff);
        setShowWarningModal(true);
      } else {
        setTimeRemaining(null);
        setShowWarningModal(false);
      }
    };

    checkExpiry();
    const timer = setInterval(checkExpiry, 10000);
    return () => clearInterval(timer);
  }, [token]);

  // Load user & token from storage on boot
  useEffect(() => {
    const savedToken = localStorage.getItem('titanic_auth_token');
    const savedUser = localStorage.getItem('titanic_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setCurrentTab('dashboard');
    }
  }, []);

  // Theme Syncing
  useEffect(() => {
    const savedTheme = localStorage.getItem('titanic_theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('titanic_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      showToast('Dark mode activated.', 'info');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      showToast('Light mode activated.', 'info');
    }
  };

  // Auth Expired Listener
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
      setCurrentTab('login');
      showToast('Your session has expired. Please sign in again.', 'warning');
    };
    
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [showToast]);

  const handleAuthSuccess = (authUser: any, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    // Auto sync user preferences theme on login
    if (authUser.theme && authUser.theme !== theme) {
      setTheme(authUser.theme);
      localStorage.setItem('titanic_theme', authUser.theme);
      if (authUser.theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('titanic_auth_token');
    localStorage.removeItem('titanic_user');
    setUser(null);
    setToken(null);
    setCurrentTab('landing');
    showToast('Logged out successfully.', 'info');
  };

  const handleExtendSession = async () => {
    try {
      const res = await authApi.refresh();
      localStorage.setItem('titanic_auth_token', res.access_token);
      localStorage.setItem('titanic_user', JSON.stringify(res.user));
      setToken(res.access_token);
      setUser(res.user);
      setShowWarningModal(false);
      showToast('Your session has been successfully extended.', 'success');
    } catch (err) {
      showToast('Failed to extend session. Please login again.', 'error');
      handleLogout();
    }
  };

  const handleNavigateToEAI = (predictionData: any) => {
    setActiveXaiData(predictionData);
    setCurrentTab('eai');
  };

  // Main Page Router Switcher
  const renderPage = () => {
    if (currentTab === 'landing') {
      return <LandingPage onStart={() => setCurrentTab(user ? 'dashboard' : 'login')} user={user} />;
    }
    if (currentTab === 'login') {
      return <Login onAuthSuccess={handleAuthSuccess} onBack={() => setCurrentTab('landing')} />;
    }
    
    // Protected pages layout template
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={setCurrentTab} 
          user={user} 
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        <div className="flex-grow overflow-y-auto h-screen scrollbar-thin">
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'prediction' && <PredictionCenter onNavigateToEAI={handleNavigateToEAI} />}
          {currentTab === 'eai' && <ExplainableAI activePrediction={activeXaiData} />}
          {currentTab === 'batch' && <BatchPrediction />}
          {currentTab === 'analytics' && <AnalyticsLab />}
          {currentTab === 'reports' && <Reports />}
          {currentTab === 'admin' && <AdminPanel />}
          {currentTab === 'settings' && (
            <Settings 
              user={user} 
              onUpdateUser={setUser} 
              theme={theme} 
              toggleTheme={toggleTheme} 
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPage()}
      
      {showWarningModal && timeRemaining !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="max-w-md w-full rounded-2xl border dark:border-white/10 border-slate-200 bg-white dark:bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              🔒 Session Expiring
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
              Your active diagnostic session will expire in{' '}
              <span className="font-mono font-bold text-rose-500">
                {Math.floor(timeRemaining / 60000)}m {Math.floor((timeRemaining % 60000) / 1000)}s
              </span>{' '}
              due to inactivity. Would you like to extend it?
            </p>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl border dark:border-white/5 border-slate-200 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Log Out
              </button>
              <button
                onClick={handleExtendSession}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-300"
              >
                Extend Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
