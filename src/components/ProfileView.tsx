import React, { useState, useEffect } from 'react';
import { User, Download, Eye, FileCode, Trash2, ArrowRight, Sparkles, LogOut, Check } from 'lucide-react';
import { ApkItem, UserProfile } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface ProfileViewProps {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  darkMode: boolean;
  onSelectApp: (id: string) => void;
  onOpenUpload: () => void;
  onDeleteApp: (id: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  setCurrentUser,
  darkMode,
  onSelectApp,
  onOpenUpload,
  onDeleteApp,
}) => {
  const [myApks, setMyApks] = useState<ApkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser.name);

  useEffect(() => {
    fetchMyApks();
  }, [currentUser]);

  const fetchMyApks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apks?userId=${currentUser.id}`);
      const data = await res.json();
      if (res.ok) setMyApks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalDownloads = myApks.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
  const totalViews = myApks.reduce((acc, curr) => acc + (curr.views || 0), 0);

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    setCurrentUser({ ...currentUser, name: nameInput });
    setIsEditingName(false);
  };

  const switchAccount = (name: string, email: string, avatar: string) => {
    setCurrentUser({
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name,
      email,
      avatar,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Profile Header Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl mb-8 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-emerald-500/30 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-3 mb-1">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className={`px-3 py-1 rounded-xl border text-lg font-bold ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-300'
                      }`}
                    />
                    <button onClick={handleSaveName} className="p-2 bg-emerald-500 text-white rounded-xl">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl sm:text-3xl font-black">{currentUser.name}</h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-xs text-emerald-400 hover:underline font-semibold"
                    >
                      Edit Name
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mb-3">{currentUser.email}</p>
              
              <div className="flex items-center space-x-6 text-xs text-slate-300">
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                  {myApks.length} APK Uploads
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-semibold">
                  {totalDownloads} Total Downloads
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold">
                  {totalViews} Total Views
                </div>
              </div>
            </div>
          </div>

          {/* Account switcher presets */}
          <div className="flex flex-col items-end space-y-2">
            <span className="text-xs font-semibold text-slate-400">Switch Demo Account:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => switchAccount('Alex Developer', 'alex@playapk.app', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  currentUser.name === 'Alex Developer' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                Alex
              </button>
              <button
                onClick={() => switchAccount('CyberStudio', 'studio@playapk.app', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  currentUser.name === 'CyberStudio' ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-700 hover:bg-slate-800'
                }`}
              >
                CyberStudio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* My Uploads Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">My Uploaded APKs</h2>
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-500/20"
        >
          Upload New APK
        </button>
      </div>

      {/* My Uploads Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : myApks.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <FileCode className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
          <p className="font-semibold">You haven't uploaded any APKs yet</p>
          <p className="text-xs mt-1">Upload your first Android app to share with the world</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {myApks.map(apk => (
            <div
              key={apk.id}
              onClick={() => onSelectApp(apk.id)}
              className={`p-5 rounded-3xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50'
              } shadow-md hover:shadow-xl`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={apk.iconUrl}
                    alt={apk.appName}
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-700/50 group-hover:scale-105 transition-transform"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v{apk.version}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this app?')) onDeleteApp(apk.id);
                      }}
                      className="p-1.5 rounded-xl hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors truncate">{apk.appName}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{apk.description || 'No description'}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center space-x-1"><Download className="w-3.5 h-3.5" /><span>{apk.downloads}</span></span>
                  <span className="flex items-center space-x-1"><Eye className="w-3.5 h-3.5" /><span>{apk.views}</span></span>
                </div>
                <span className="flex items-center space-x-1 text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
