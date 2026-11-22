import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const uploadDir = path.resolve(__dirname, 'uploads');
const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbFile = path.join(dataDir, 'db.json');

// Initial DB structure
interface ApkItem {
  id: string;
  appKey: string; // group key for version history (slug or unique id)
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
  apkSize: number; // in bytes
  folderId?: string;
  downloads: number;
  views: number;
  createdAt: string;
  userId: string;
  userName: string;
}

interface FolderItem {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

interface DB {
  apks: ApkItem[];
  folders: FolderItem[];
}

const readDB = (): DB => {
  try {
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading DB:', e);
  }
  return { apks: [], folders: [] };
};

const writeDB = (db: DB) => {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error writing DB:', e);
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'apk') {
      if (!file.originalname.toLowerCase().endsWith('.apk') && file.mimetype !== 'application/vnd.android.package-archive') {
        return cb(new Error('Only .apk files are allowed!'));
      }
    }
    cb(null, true);
  },
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all APKs
app.get('/api/apks', (req, res) => {
  const db = readDB();
  const { userId, folderId, search, sort } = req.query;

  let results = [...db.apks];

  if (userId) {
    results = results.filter(a => a.userId === userId);
  }
  if (folderId) {
    results = results.filter(a => a.folderId === folderId);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    results = results.filter(a => 
      a.appName.toLowerCase().includes(q) || 
      a.description.toLowerCase().includes(q) ||
      a.packageName.toLowerCase().includes(q)
    );
  }

  if (sort === 'name') {
    results.sort((a, b) => a.appName.localeCompare(b.appName));
  } else if (sort === 'size') {
    results.sort((a, b) => b.apkSize - a.apkSize);
  } else {
    // default newest
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json(results);
});

// Get single APK
app.get('/api/apks/:id', (req, res) => {
  const db = readDB();
  const apk = db.apks.find(a => a.id === req.params.id);
  if (!apk) {
    return res.status(404).json({ error: 'APK not found' });
  }
  // increment views
  apk.views = (apk.views || 0) + 1;
  writeDB(db);
  res.json(apk);
});

// Increment download count
app.post('/api/apks/:id/download', (req, res) => {
  const db = readDB();
  const apk = db.apks.find(a => a.id === req.params.id);
  if (!apk) {
    return res.status(404).json({ error: 'APK not found' });
  }
  apk.downloads = (apk.downloads || 0) + 1;
  writeDB(db);
  res.json({ success: true, downloads: apk.downloads });
});

// Upload new APK or new version
app.post('/api/apks', upload.fields([
  { name: 'apk', maxCount: 1 },
  { name: 'icon', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 }
]), (req, res) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const body = req.body;

    if (!files || !files.apk || files.apk.length === 0) {
      return res.status(400).json({ error: 'APK file is required' });
    }

    const apkFile = files.apk[0];
    const iconFile = files.icon && files.icon[0];
    const screenshotFiles = files.screenshots || [];

    const iconUrl = iconFile ? `/uploads/${iconFile.filename}` : (body.iconUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80');
    const screenshots = screenshotFiles.length > 0 
      ? screenshotFiles.map(f => `/uploads/${f.filename}`)
      : (body.screenshots ? JSON.parse(body.screenshots) : []);

    const db = readDB();

    const id = Math.random().toString(36).substring(2, 9);
    const appKey = body.appKey || body.appName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const packageName = body.packageName || `com.${body.appName.toLowerCase().replace(/[^a-z0-9]/g, '')}.app`;

    const newApk: ApkItem = {
      id,
      appKey,
      appName: body.appName || 'Untitled App',
      packageName,
      description: body.description || '',
      license: body.license || 'MIT',
      version: body.version || '1.0.0',
      whatsNew: body.whatsNew || 'Initial release',
      iconUrl,
      screenshots,
      apkUrl: `/uploads/${apkFile.filename}`,
      apkFileName: apkFile.originalname,
      apkSize: apkFile.size,
      folderId: body.folderId && body.folderId !== 'none' ? body.folderId : undefined,
      downloads: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      userId: body.userId || 'user_demo',
      userName: body.userName || 'Demo Developer',
    };

    db.apks.unshift(newApk);
    writeDB(db);

    res.status(201).json(newApk);
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// Delete APK
app.delete('/api/apks/:id', (req, res) => {
  const db = readDB();
  const index = db.apks.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'APK not found' });
  }
  const removed = db.apks.splice(index, 1)[0];
  writeDB(db);
  res.json({ success: true, removed });
});

// Folders API
app.get('/api/folders', (req, res) => {
  const db = readDB();
  const { userId } = req.query;
  let results = db.folders;
  if (userId) {
    results = results.filter(f => f.userId === userId);
  }
  res.json(results);
});

app.post('/api/folders', (req, res) => {
  const { name, userId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  const db = readDB();
  const newFolder: FolderItem = {
    id: Math.random().toString(36).substring(2, 9),
    name,
    userId: userId || 'user_demo',
    createdAt: new Date().toISOString(),
  };
  db.folders.push(newFolder);
  writeDB(db);
  res.status(201).json(newFolder);
});

app.put('/api/folders/:id', (req, res) => {
  const { name } = req.body;
  const db = readDB();
  const folder = db.folders.find(f => f.id === req.params.id);
  if (!folder) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  if (name) folder.name = name;
  writeDB(db);
  res.json(folder);
});

app.delete('/api/folders/:id', (req, res) => {
  const db = readDB();
  const index = db.folders.findIndex(f => f.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Folder not found' });
  }
  db.folders.splice(index, 1);
  // Also unset folderId on any APKs in this folder
  db.apks.forEach(a => {
    if (a.folderId === req.params.id) {
      delete a.folderId;
    }
  });
  writeDB(db);
  res.json({ success: true });
});

// AI Description / Release Notes generator using Gemini API
app.post('/api/ai/generate', async (req, res) => {
  try {
    const { prompt, type } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    let systemInstruction = 'You are an expert Android app marketer and developer assistant. Write engaging, professional content for Android apps.';
    let fullPrompt = prompt;

    if (type === 'description') {
      fullPrompt = `Write an engaging, feature-rich, professional Android app description (around 100-150 words) for an app described as: "${prompt}". Include catchy bullet points for key features.`;
    } else if (type === 'whatsNew') {
      fullPrompt = `Write concise, punchy release notes (What's New) for an Android app update based on: "${prompt}". Use bullet points with emojis.`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ result: response.text });
  } catch (err: any) {
    console.error('AI generation error:', err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
});

// Setup Vite middleware for development
async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
