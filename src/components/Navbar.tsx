import React from 'react';
import { Play, UploadCloud, Folder, User, Sun, Moon, ShieldAlert, LogOut } from 'lucide-react';
import { UserProfile } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: UserProfile | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenSafety: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  darkMode,
  setDarkMode,
  currentUser,
  onLogin,
  onLogout,
  onOpenUpload,
  onOpenSafety,
}) => {
  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
      darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white/80 border-slate-200 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('home')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Play className="w-5 h-5 fill-white ml-0.5" />
            <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[9px] font-extrabold px-1 rounded border border-emerald-400 text-emerald-300">
              APK
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-xl tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                PLAYAPK
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold border border-emerald-500/20">
                v2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Upload. Share. Play.</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setCurrentTab('home')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'home'
                ? 'bg-emerald-500/10 text-emerald-500 font-semibold'
                : darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Explore
          </button>
          <button
            onClick={() => setCurrentTab('folders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
              currentTab === 'folders'
                ? 'bg-emerald-500/10 text-emerald-500 font-semibold'
                : darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Folders</span>
          </button>
          {currentUser && (
            <button
              onClick={() => setCurrentTab('profile')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${
                currentTab === 'profile'
                  ? 'bg-emerald-500/10 text-emerald-500 font-semibold'
                  : darkMode ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>My Apps</span>
            </button>
          )}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSafety}
            title="Safety Guidelines"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-amber-600'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </button>

          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Theme"
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-slate-700'
            }`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">Upload APK</span>
          </button>

          {/* User Authentication / Gmail Sign-In */}
          {currentUser ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-700/50">
              <div 
                onClick={() => setCurrentTab('profile')}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/50"
                />
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-700/50">
              <GoogleSignInButton onClick={onLogin} label="Sign in with Gmail" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-lg px-6 py-2 flex justify-around items-center transition-colors ${
        darkMode ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={() => setCurrentTab('home')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            currentTab === 'home' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Play className="w-5 h-5 mb-1" />
          Explore
        </button>
        <button
          onClick={() => setCurrentTab('folders')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
            currentTab === 'folders' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-5 h-5 mb-1" />
          Folders
        </button>
        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center -mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-3.5 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
        >
          <UploadCloud className="w-6 h-6" />
        </button>
        {currentUser && (
          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium ${
              currentTab === 'profile' ? 'text-emerald-500 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            My Apps
          </button>
        )}
      </div>
    </header>
  );
};
