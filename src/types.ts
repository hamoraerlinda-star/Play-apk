export interface ApkItem {
  id: string;
  appKey: string;
  appName: string;
  packageName: string;
  description: string;
  license: string;
  version: string;
  whatsNew: string;
  iconUrl: string;
  screenshots: string[];
  apkUrl: string;
  apkFileName: string;
  apkSize: number;
  folderId?: string;
  downloads: number;
  views: number;
  createdAt: string;
  userId: string;
  userName: string;
}

export interface FolderItem {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}
