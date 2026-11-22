import React, { useState, useEffect } from 'react';
import { Download, Share2, Copy, Check, ArrowLeft, Eye, Calendar, Tag, Smartphone, Layers, Sparkles, Trash2 } from 'lucide-react';
import { ApkItem, UserProfile } from '../types';
import { formatFileSize, formatDate } from '../utils';

interface AppDetailPageProps {
  appId: string;
  onBack: () => void;
  currentUser: UserProfile;
  darkMode: boolean;
  onOpenUploadNewVersion: (appKey: string, appName: string) => void;
  onDeleteApp: (id: string) => void;
}

export const AppDetailPage: React.FC<AppDetailPageProps> = ({
  appId,
  onBack,
  currentUser,
  darkMode,
  onOpenUploadNewVersion,
  onDeleteApp,
}) => {
  const [apk, setApk] = useState<ApkItem | null>(null);
  const [versionHistory, setVersionHistory] = useState<ApkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchAppDetails();
  }, [appId]);

  const fetchAppDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apks/${appId}`);
      const data = await res.json();
      if (res.ok) {
        setApk(data);
        // Fetch all APKs to find version history for same appKey
        const listRes = await fetch('/api/apks');
        const listData = await listRes.json();
        if (listRes.ok) {
          const sameAppVersions = listData.filter((a: ApkItem) => a.appKey === data.appKey);
          setVersionHistory(sameAppVersions);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (targetApk: ApkItem) => {
    setDownloading(true);
    try {
      await fetch(`/api/apks/${targetApk.id}/download`, { method: 'POST' });
      // trigger file download
      const link = document.createElement('a');
      link.href = targetApk.apkUrl;
      link.download = targetApk.apkFileName || `${targetApk.appName}-${targetApk.version}.apk`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // update local state
      setApk(prev => prev ? { ...prev, downloads: prev.downloads + 1 } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTikTok = () => {
    const shareText = `Check out ${apk?.appName} (v${apk?.version}) on PLAYAPK! Download here: ${window.location.href}`;
    if (navigator.share) {
      navigator.share({
        title: apk?.appName,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Link copied! Open TikTok or paste into your caption.');
      window.open('https://www.tiktok.com', '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!apk) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">App not found</h2>
        <button onClick={onBack} className="px-4 py-2 bg-emerald-500 text-white rounded-xl">
          Back to Explore
        </button>
      </div>
    );
  }

  const isOwner = currentUser.id === apk.userId;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fadeIn">
      {/* Back button */}
      <button
        onClick={onBack}
        className={`flex items-center space-x-2 mb-6 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Main App Header Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl mb-8 transition-colors ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <img
              src={apk.iconUrl}
              alt={apk.appName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-lg border border-slate-700/50 shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black">{apk.appName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v{apk.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {apk.license}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2 font-mono">{apk.packageName}</p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(apk.createdAt)}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Download className="w-3.5 h-3.5" />
                  <span>{apk.downloads} downloads</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{apk.views} views</span>
                </span>
                <span>By <strong className="text-emerald-400">{apk.userName}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                darkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-300 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleShareTikTok}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-cyan-400 border border-[#00f2fe]/30 text-sm font-semibold transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to TikTok</span>
            </button>

            <button
              onClick={() => handleDownload(apk)}
              disabled={downloading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : `Download APK (${formatFileSize(apk.apkSize)})`}</span>
            </button>
          </div>
        </div>

        {/* Owner controls */}
        {isOwner && (
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenUploadNewVersion(apk.appKey, apk.appName)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upload New Version</span>
              </button>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this app and its APK files?')) {
                  onDeleteApp(apk.id);
                  onBack();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete App</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Description & Screenshots */}
        <div className="md:col-span-2 space-y-8">
          {/* Description */}
          <div className={`p-6 rounded-3xl border transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-3">About this app</h3>
            <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
              {apk.description || 'No description provided.'}
            </p>
          </div>

          {/* What's New */}
          <div className={`p-6 rounded-3xl border transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-2 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>What's New in v{apk.version}</span>
            </h3>
            <p className="text-sm text-slate-300 whitespace-pre-line">
              {apk.whatsNew || 'Initial release'}
            </p>
          </div>

          {/* Screenshots Gallery */}
          {apk.screenshots && apk.screenshots.length > 0 && (
            <div className={`p-6 rounded-3xl border transition-colors ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <h3 className="text-lg font-bold mb-4">Screenshots</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {apk.screenshots.map((shot, idx) => (
                  <img
                    key={idx}
                    src={shot}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-48 object-cover rounded-2xl border border-slate-700/50 shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
                    onClick={() => window.open(shot, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Version History & APK Details */}
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Version History</span>
            </h3>
            <div className="space-y-3">
              {versionHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setApk(item)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    item.id === apk.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : darkMode ? 'border-slate-800 hover:bg-slate-800/60' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm">v{item.version}</span>
                      {item.id === apk.id && (
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-semibold">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatDate(item.createdAt)} • {formatFileSize(item.apkSize)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Specs */}
          <div className={`p-6 rounded-3xl border transition-colors ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold mb-3">Technical Information</h3>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">File Name</span>
                <span className="font-mono truncate max-w-[180px]">{apk.apkFileName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Package</span>
                <span className="font-mono truncate max-w-[180px]">{apk.packageName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">File Size</span>
                <span>{formatFileSize(apk.apkSize)}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">License</span>
                <span className="font-semibold text-emerald-400">{apk.license}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
