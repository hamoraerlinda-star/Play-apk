import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Sparkles, Play, ArrowRight, Copy, Check, ShieldCheck, Flame, Layers } from 'lucide-react';
import { ApkItem } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface HomeFeedProps {
  darkMode: boolean;
  onSelectApp: (id: string) => void;
  onOpenUpload: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  darkMode,
  onSelectApp,
  onOpenUpload,
}) => {
  const [apks, setApks] = useState<ApkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLicense, setSelectedLicense] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size' | 'popular'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchApks();
  }, []);

  const fetchApks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/apks');
      const data = await res.json();
      if (res.ok) setApks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent, apk: ApkItem) => {
    e.stopPropagation();
    const url = `${window.location.origin}/a/${apk.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(apk.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & Sort
  let filtered = [...apks];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.appName.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.packageName.toLowerCase().includes(q) ||
      a.userName.toLowerCase().includes(q)
    );
  }

  if (selectedLicense !== 'All') {
    filtered = filtered.filter(a => a.license === selectedLicense);
  }

  if (sortBy === 'name') {
    filtered.sort((a, b) => a.appName.localeCompare(b.appName));
  } else if (sortBy === 'size') {
    filtered.sort((a, b) => b.apkSize - a.apkSize);
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  } else {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-8 sm:p-12 mb-10 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-4">
            <Flame className="w-4 h-4 text-yellow-300" />
            <span>Android APK Sharing Made Lightning Fast</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            Upload. Share. Play.
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 mb-6 leading-relaxed">
            Instantly upload your Android APKs, generate unique public share links, organize into folders, and track version history in one gorgeous place.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={onOpenUpload}
              className="px-6 py-3 bg-white text-emerald-900 font-bold rounded-2xl shadow-xl hover:bg-emerald-50 transition-all transform active:scale-95"
            >
              Upload APK Now
            </button>
            <div className="flex items-center space-x-2 text-xs text-emerald-100 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Verified APK parser & 100MB support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search apps, package name, developer..."
            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl border text-sm outline-none transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* License Filter */}
          <select
            value={selectedLicense}
            onChange={e => setSelectedLicense(e.target.value)}
            className={`px-3 py-2.5 rounded-2xl border text-sm outline-none ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="All">All Licenses</option>
            <option value="MIT">MIT</option>
            <option value="Apache 2.0">Apache 2.0</option>
            <option value="GPL">GPL</option>
            <option value="Freeware">Freeware</option>
            <option value="Proprietary">Proprietary</option>
            <option value="Other">Other</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className={`px-3 py-2.5 rounded-2xl border text-sm outline-none ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="newest">Sort: Newest Uploads</option>
            <option value="popular">Sort: Most Downloaded</option>
            <option value="name">Sort: App Name</option>
            <option value="size">Sort: File Size</option>
          </select>
        </div>
      </div>

      {/* Recent Uploads Feed */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-black flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span>Recent Uploads Feed</span>
        </h2>
        <span className="text-xs text-slate-400 font-medium">{filtered.length} apps available</span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`p-16 rounded-3xl border text-center ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Play className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-40 fill-slate-500" />
          <p className="text-lg font-bold">No APKs found</p>
          <p className="text-xs mt-1 mb-4">Be the first developer to upload an Android app to PLAYAPK!</p>
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-xl text-sm"
          >
            Upload APK
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(apk => (
            <div
              key={apk.id}
              onClick={() => onSelectApp(apk.id)}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50'
              } shadow-lg hover:shadow-2xl hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={apk.iconUrl}
                    alt={apk.appName}
                    className="w-16 h-16 rounded-2xl object-cover border border-slate-700/50 shadow-md group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col items-end space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v{apk.version}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{formatFileSize(apk.apkSize)}</span>
                  </div>
                </div>

                <h3 className="font-bold text-xl mb-1 group-hover:text-emerald-400 transition-colors truncate">{apk.appName}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">{apk.description || 'No description provided.'}</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 py-3 border-t border-slate-800/50 mb-3">
                  <span>By <strong className="text-emerald-400">{apk.userName}</strong></span>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center space-x-1"><Download className="w-3.5 h-3.5" /><span>{apk.downloads}</span></span>
                    <span className="flex items-center space-x-1"><Eye className="w-3.5 h-3.5" /><span>{apk.views}</span></span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleCopyLink(e, apk)}
                    className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      darkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {copiedId === apk.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === apk.id ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectApp(apk.id);
                    }}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold transition-all"
                  >
                    <span>View App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
