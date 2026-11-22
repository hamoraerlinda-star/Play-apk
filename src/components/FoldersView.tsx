import React, { useState, useEffect } from 'react';
import { Folder, Plus, Trash2, Edit2, Search, ArrowRight, Download, Eye, FileCode, Check, X } from 'lucide-react';
import { FolderItem, ApkItem, UserProfile } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface FoldersViewProps {
  currentUser: UserProfile;
  darkMode: boolean;
  onSelectApp: (id: string) => void;
  onOpenUpload: () => void;
}

export const FoldersView: React.FC<FoldersViewProps> = ({
  currentUser,
  darkMode,
  onSelectApp,
  onOpenUpload,
}) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [apks, setApks] = useState<ApkItem[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [loading, setLoading] = useState(true);

  // New folder state
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Edit folder state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Search & sort inside folder
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'name' | 'size'>('newest');

  useEffect(() => {
    fetchFoldersAndApks();
  }, []);

  const fetchFoldersAndApks = async () => {
    setLoading(true);
    try {
      const [fRes, aRes] = await Promise.all([
        fetch(`/api/folders?userId=${currentUser.id}`),
        fetch(`/api/apks?userId=${currentUser.id}`),
      ]);
      const fData = await fRes.json();
      const aData = await aRes.json();
      if (fRes.ok) setFolders(fData);
      if (aRes.ok) setApks(aData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, userId: currentUser.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders(prev => [...prev, data]);
        setNewFolderName('');
        setIsCreating(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameFolder = async (id: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName }),
      });
      const data = await res.json();
      if (res.ok) {
        setFolders(prev => prev.map(f => f.id === id ? data : f));
        if (selectedFolder?.id === id) setSelectedFolder(data);
        setEditingFolderId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder? APKs inside will be moved to root.')) return;
    try {
      const res = await fetch(`/api/folders/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFolders(prev => prev.filter(f => f.id !== id));
        if (selectedFolder?.id === id) setSelectedFolder(null);
        fetchFoldersAndApks();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // If a folder is selected, show its contents
  if (selectedFolder) {
    let folderApks = apks.filter(a => a.folderId === selectedFolder.id);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      folderApks = folderApks.filter(a => a.appName.toLowerCase().includes(q) || a.packageName.toLowerCase().includes(q));
    }

    if (sortBy === 'name') {
      folderApks.sort((a, b) => a.appName.localeCompare(b.appName));
    } else if (sortBy === 'size') {
      folderApks.sort((a, b) => b.apkSize - a.apkSize);
    } else {
      folderApks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`p-2 rounded-xl border transition-colors ${
                darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              <Folder className="w-5 h-5 text-emerald-400" />
            </button>
            <div>
              <h1 className="text-2xl font-black">{selectedFolder.name}</h1>
              <p className="text-xs text-slate-400">{folderApks.length} APK files inside</p>
            </div>
          </div>
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-500/20"
          >
            Upload to Folder
          </button>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search in folder..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className={`px-3 py-2 rounded-xl border text-sm outline-none ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="newest">Sort: Newest</option>
              <option value="name">Sort: Name</option>
              <option value="size">Sort: Size</option>
            </select>
          </div>
        </div>

        {/* Folder APKs Grid */}
        {folderApks.length === 0 ? (
          <div className={`p-12 rounded-3xl border text-center ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
          }`}>
            <FileCode className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
            <p className="font-semibold">No APKs in this folder yet</p>
            <p className="text-xs mt-1">Upload an APK and assign it to {selectedFolder.name}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {folderApks.map(apk => (
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
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      v{apk.version}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors truncate">{apk.appName}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{apk.description || 'No description'}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatFileSize(apk.apkSize)}</span>
                  <span className="flex items-center space-x-1 text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform">
                    <span>View App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black">My Folders</h1>
          <p className="text-xs text-slate-400">Organize your Android APKs into structured folders</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Folder</span>
        </button>
      </div>

      {/* New Folder Modal / Form */}
      {isCreating && (
        <form onSubmit={handleCreateFolder} className={`p-5 rounded-2xl border mb-6 flex items-center space-x-3 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <Folder className="w-6 h-6 text-emerald-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="Folder name (e.g. Games, Utilities, Betas)..."
            className={`flex-1 px-3.5 py-2 rounded-xl border text-sm outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
            }`}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-2 rounded-xl hover:bg-slate-700/20 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </form>
      )}

      {/* Folders Grid */}
      {folders.length === 0 ? (
        <div className={`p-12 rounded-3xl border text-center ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <Folder className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
          <p className="font-semibold">No folders created yet</p>
          <p className="text-xs mt-1">Create folders to organize your APK uploads</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map(folder => {
            const count = apks.filter(a => a.folderId === folder.id).length;
            const isEditing = editingFolderId === folder.id;

            return (
              <div
                key={folder.id}
                onClick={() => !isEditing && setSelectedFolder(folder)}
                className={`p-6 rounded-3xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50' : 'bg-white border-slate-200 hover:border-emerald-500/50'
                } shadow-md hover:shadow-xl`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                      <Folder className="w-6 h-6" />
                    </div>
                    <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditName(folder.name);
                        }}
                        className="p-1.5 rounded-lg hover:bg-slate-700/20 text-slate-400 hover:text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center space-x-2 my-2" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className={`w-full px-2.5 py-1 text-sm rounded-lg border ${
                          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                      <button
                        onClick={() => handleRenameFolder(folder.id)}
                        className="p-1 bg-emerald-500 text-white rounded-lg"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingFolderId(null)}
                        className="p-1 bg-slate-700 text-slate-300 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-bold text-lg mb-1 group-hover:text-emerald-400 transition-colors">{folder.name}</h3>
                  )}

                  <p className="text-xs text-slate-400">{count} APK files • Created {formatDate(folder.createdAt)}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span>Open Folder</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
