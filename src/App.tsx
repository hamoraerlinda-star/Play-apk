import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeFeed } from './components/HomeFeed';
import { FoldersView } from './components/FoldersView';
import { ProfileView } from './components/ProfileView';
import { AppDetailPage } from './components/AppDetailPage';
import { UploadModal } from './components/UploadModal';
import { SafetyModal } from './components/SafetyModal';
import { UserProfile, FolderItem } from './types';
import { initAuth, googleSignIn, logout } from './firebaseAuth';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  useEffect(() => {
    // Initialize Firebase Auth listener
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Developer',
          email: user.email || '',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      },
      () => {
        setCurrentUser(null);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Check URL hash for direct app link (e.g. #a=abc123)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#a=')) {
        const id = hash.replace('#a=', '');
        setSelectedAppId(id);
        setCurrentTab('detail');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchFolders();
    } else {
      setFolders([]);
    }
  }, [currentUser]);

  const fetchFolders = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/folders?userId=${currentUser.id}`);
      const data = await res.json();
      if (res.ok) setFolders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser({
          id: result.user.uid,
          name: result.user.displayName || result.user.email?.split('@')[0] || 'Developer',
          email: result.user.email || '',
          avatar: result.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      if (currentTab === 'profile') setCurrentTab('home');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleSelectApp = (id: string) => {
    setSelectedAppId(id);
    setCurrentTab('detail');
    window.location.hash = `a=${id}`;
  };

  const handleBackToHome = () => {
    setSelectedAppId(null);
    setCurrentTab('home');
    window.location.hash = '';
  };

  const handleUploadSuccess = (newApk: any) => {
    handleSelectApp(newApk.id);
  };

  const handleDeleteApp = async (id: string) => {
    try {
      await fetch(`/api/apks/${id}`, { method: 'DELETE' });
      handleBackToHome();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          if (tab === 'home') handleBackToHome();
          else {
            setSelectedAppId(null);
            setCurrentTab(tab);
            window.location.hash = '';
          }
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSafety={() => setIsSafetyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="pb-24 md:pb-12">
        {currentTab === 'home' && (
          <HomeFeed
            darkMode={darkMode}
            onSelectApp={handleSelectApp}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {currentTab === 'folders' && currentUser && (
          <FoldersView
            currentUser={currentUser}
            darkMode={darkMode}
            onSelectApp={handleSelectApp}
            onOpenUpload={() => setIsUploadOpen(true)}
          />
        )}

        {currentTab === 'folders' && !currentUser && (
          <div className="max-w-md mx-auto px-4 py-20 text-center">
            <h2 className="text-xl font-bold mb-2">Sign in to view your folders</h2>
            <p className="text-xs text-slate-400 mb-6">Please sign in with Gmail to organize and manage your app folders.</p>
            <button onClick={handleLogin} className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl text-sm">
              Sign in with Gmail
            </button>
          </div>
        )}

        {currentTab === 'profile' && currentUser && (
          <ProfileView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            darkMode={darkMode}
            onSelectApp={handleSelectApp}
            onOpenUpload={() => setIsUploadOpen(true)}
            onDeleteApp={handleDeleteApp}
          />
        )}

        {currentTab === 'detail' && selectedAppId && (
          <AppDetailPage
            appId={selectedAppId}
            onBack={handleBackToHome}
            currentUser={currentUser || { id: 'guest', name: 'Guest', email: '', avatar: '' }}
            darkMode={darkMode}
            onOpenUploadNewVersion={(appKey, appName) => {
              setIsUploadOpen(true);
            }}
            onDeleteApp={handleDeleteApp}
          />
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        folders={folders}
        currentUser={currentUser}
        onLogin={handleLogin}
        darkMode={darkMode}
      />

      <SafetyModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
