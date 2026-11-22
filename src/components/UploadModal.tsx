import React, { useState } from 'react';
import { X, Upload, Sparkles, Folder, FileCode, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { FolderItem, UserProfile } from '../types';
import { formatFileSize } from '../utils';
import { GoogleSignInButton } from './GoogleSignInButton';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApk: any) => void;
  folders: FolderItem[];
  currentUser: UserProfile | null;
  onLogin: () => void;
  darkMode: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  folders,
  currentUser,
  onLogin,
  darkMode,
}) => {
  const [apkFile, setApkFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  const [appName, setAppName] = useState('');
  const [packageName, setPackageName] = useState('');
  const [description, setDescription] = useState('');
  const [license, setLicense] = useState('MIT');
  const [version, setVersion] = useState('1.0.0');
  const [whatsNew, setWhatsNew] = useState('Initial release');
  const [folderId, setFolderId] = useState('none');
  const [appKey, setAppKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!isOpen) return null;

  // If not signed in with Gmail, prompt user to sign in
  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 border text-center ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/20 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
            <Upload className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-bold mb-2">Sign in Required to Publish</h3>
          <p className="text-sm text-slate-400 mb-6">
            You can download APKs freely, but to publish and save your own APKs to PLAYAPK, please sign in with your Gmail account.
          </p>

          <div className="flex justify-center">
            <GoogleSignInButton onClick={onLogin} label="Sign in with Gmail to Continue" />
          </div>
        </div>
      </div>
    );
  }

  const handleApkDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.name.toLowerCase().endsWith('.apk')) {
        setError('Only .apk files are accepted.');
        return;
      }
      setError(null);
      setApkFile(file);
      if (!appName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setAppName(nameWithoutExt);
        setAppKey(nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        setPackageName(`com.${nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`);
      }
    }
  };

  const handleApkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.apk')) {
        setError('Only .apk files are accepted.');
        return;
      }
      setError(null);
      setApkFile(file);
      if (!appName) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setAppName(nameWithoutExt);
        setAppKey(nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        setPackageName(`com.${nameWithoutExt.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`);
      }
    }
  };

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleScreenshotsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setScreenshotFiles(prev => [...prev, ...files].slice(0, 5));
      const newPreviews = files.map(f => URL.createObjectURL(f));
      setScreenshotPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  // AI Assistant generator
  const handleAiGenerate = async (type: 'description' | 'whatsNew') => {
    if (!appName) {
      setError('Please enter an App Name first to generate content.');
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const promptText = type === 'description' ? appName + (description ? ` - ${description}` : '') : whatsNew;
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI generation failed');
      
      if (type === 'description') {
        setDescription(data.result);
      } else {
        setWhatsNew(data.result);
      }
    } catch (err: any) {
      setError(err.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apkFile) {
      setError('Please upload an APK file.');
      return;
    }
    if (!appName) {
      setError('App name is required.');
      return;
    }

    setLoading(true);
    setUploadProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('apk', apkFile);
    if (iconFile) formData.append('icon', iconFile);
    screenshotFiles.forEach(f => formData.append('screenshots', f));
    formData.append('appName', appName);
    formData.append('appKey', appKey || appName.toLowerCase().replace(/[^a-z0-9]/g, '-'));
    formData.append('packageName', packageName || `com.${appName.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`);
    formData.append('description', description);
    formData.append('license', license);
    formData.append('version', version);
    formData.append('whatsNew', whatsNew);
    formData.append('folderId', folderId);
    formData.append('userId', currentUser.id);
    formData.append('userName', currentUser.name);

    try {
      setUploadProgress(40);
      const res = await fetch('/api/apks', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload APK');

      setUploadProgress(100);
      setTimeout(() => {
        setLoading(false);
        onSuccess(data);
        onClose();
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Upload failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className={`relative w-full max-w-2xl rounded-2xl shadow-2xl p-6 border my-8 transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700/20 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Upload Android APK</h2>
            <p className="text-xs text-slate-400">Publishing as <strong className="text-emerald-400">{currentUser.name}</strong> ({currentUser.email})</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* APK File Drag & Drop */}
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-300">APK File * (Max 100MB)</label>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={handleApkDrop}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                apkFile 
                  ? 'border-emerald-500/50 bg-emerald-500/5' 
                  : darkMode ? 'border-slate-700 hover:border-emerald-500 bg-slate-800/40' : 'border-slate-300 hover:border-emerald-500 bg-slate-50'
              }`}
            >
              {apkFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold truncate max-w-xs">{apkFile.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(apkFile.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApkFile(null)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium">Drag & drop your .apk file here, or <label className="text-emerald-400 underline cursor-pointer">browse<input type="file" accept=".apk" onChange={handleApkSelect} className="hidden" /></label></p>
                  <p className="text-[11px] text-slate-400">Only valid Android APK packages allowed</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* App Name */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">App Name *</label>
              <input
                type="text"
                required
                value={appName}
                onChange={e => {
                  setAppName(e.target.value);
                  if (!appKey) setAppKey(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                }}
                placeholder="e.g. CyberCraft RPG"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>

            {/* Version Number */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Version Number *</label>
              <input
                type="text"
                required
                value={version}
                onChange={e => setVersion(e.target.value)}
                placeholder="e.g. 1.0.3"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* License Dropdown */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">License</label>
              <select
                value={license}
                onChange={e => setLicense(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              >
                <option value="MIT">MIT License</option>
                <option value="Apache 2.0">Apache 2.0</option>
                <option value="GPL">GPL</option>
                <option value="Freeware">Freeware</option>
                <option value="Proprietary">Proprietary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Folder Selection */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Folder</label>
              <select
                value={folderId}
                onChange={e => setFolderId(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                }`}
              >
                <option value="none">No Folder (Root)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">Description</label>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiGenerate('description')}
                className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'Generating...' : 'AI Enhance'}</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe your app features, gameplay, or utilities..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* What's New */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">What's New in this Version</label>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiGenerate('whatsNew')}
                className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Notes</span>
              </button>
            </div>
            <input
              type="text"
              value={whatsNew}
              onChange={e => setWhatsNew(e.target.value)}
              placeholder="e.g. Bug fixes, performance improvements, new dark mode theme"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* App Icon & Screenshots Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">App Icon / Logo</label>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {iconPreview ? (
                    <img src={iconPreview} alt="Icon" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <label className="cursor-pointer text-xs font-medium px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                  Choose Icon
                  <input type="file" accept="image/*" onChange={handleIconSelect} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-300">Screenshots (Up to 5)</label>
              <div className="flex items-center space-x-2 overflow-x-auto py-1">
                {screenshotPreviews.map((p, idx) => (
                  <img key={idx} src={p} alt="Shot" className="w-12 h-12 rounded-lg object-cover border border-slate-700 shrink-0" />
                ))}
                {screenshotPreviews.length < 5 && (
                  <label className="cursor-pointer w-12 h-12 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-400 hover:text-white shrink-0">
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotsSelect} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Uploading APK & assets...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all"
            >
              {loading ? 'Uploading...' : 'Publish APK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
