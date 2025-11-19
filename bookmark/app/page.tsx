import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { 
  Folder as FolderIcon, Plus, Lock, Unlock, ExternalLink, Trash2, X, Shield, 
  Search, Menu, LogOut, Mic, Image as ImageIcon, Video, 
  MoreHorizontal, Play, Square, Film, AlertCircle, Sparkles, 
  MessageSquare, Send, Bot, Loader, LucideIcon
} from 'lucide-react';

// --- Types & Interfaces ---

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'voice';
  content: string;
  createdAt: string;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  createdAt: string;
  media: MediaItem[];
}

interface Folder {
  id: string;
  name: string;
  password: string;
  bookmarks: Bookmark[];
}

interface ToastState {
  msg: string;
  type: 'success' | 'error';
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// --- API CONFIGURATION ---
const apiKey: string = ""; // API Key injected by environment

const callGemini = async (prompt: string, systemInstruction: string = ""): Promise<string> => {
  if (!apiKey) {
    console.error("API Key missing");
    return "Error: API Key is missing.";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "The spirits were silent...";
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "The connection to the ether was severed. Please try again.";
  }
};

// --- Utility Components ---

interface ButtonProps {
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gold' | 'magic' | 'icon';
  className?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  size?: 'small' | 'normal';
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled = false, size = 'normal', loading = false }) => {
  const baseStyle = "flex items-center justify-center rounded-lg transition-all duration-300 font-medium tracking-wide disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    small: "px-3 py-1.5 text-xs",
    normal: "px-4 py-2 text-sm"
  };
  
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-900/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700",
    danger: "bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/30",
    ghost: "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200",
    gold: "bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 hover:shadow-amber-400/20 shadow-xl",
    magic: "bg-indigo-600 hover:bg-indigo-500 text-indigo-100 shadow-lg shadow-indigo-900/20 border border-indigo-500/30",
    icon: "p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800"
  };

  return (
    <button disabled={disabled || loading} onClick={onClick} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}>
      {loading ? <Loader size={16} className="animate-spin mr-2"/> : (Icon && <Icon size={size === 'small' ? 14 : 16} className={children ? "mr-2" : ""} />)}
      {children}
    </button>
  );
};

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  icon?: LucideIcon;
  actionButton?: ReactNode;
}

const Input: React.FC<InputProps> = ({ label, type = "text", placeholder, value, onChange, autoFocus, onKeyDown, icon: Icon, actionButton }) => (
  <div className="mb-4">
    {label && <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">{label}</label>}
    <div className="relative">
      <input
        autoFocus={autoFocus}
        type={type}
        onKeyDown={onKeyDown}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-sans pr-12"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {actionButton && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {actionButton}
        </div>
      )}
    </div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className={`bg-slate-900 border border-slate-700 rounded-xl shadow-2xl ${maxWidth} w-full flex flex-col max-h-[90vh] animate-slide-up`}>
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <h3 className="text-lg font-serif text-amber-100 font-medium flex items-center gap-2">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AudioRecorderProps {
  onSave: (data: string) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSave }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => { if (typeof reader.result === 'string') onSave(reader.result); };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev: number) => prev + 1), 1000);
    } catch (err) {
      console.error(err);
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => { return () => clearInterval(timerRef.current); }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
      <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
      <span className="font-mono text-sm text-slate-300 w-12">{formatTime(recordingTime)}</span>
      {!isRecording ? (
        <Button size="small" variant="primary" onClick={startRecording} icon={Mic}>Rec</Button>
      ) : (
        <Button size="small" variant="danger" onClick={stopRecording} icon={Square}>Stop</Button>
      )}
    </div>
  );
};

// --- Main Application ---

export default function VelvetVault() {
  // --- State ---
  const [folders, setFolders] = useState<Folder[]>(() => {
    try {
      const saved = localStorage.getItem('velvet_vault_data_v3');
      return saved ? JSON.parse(saved) : [
        { id: 'default', name: 'Inspiration', password: '123', bookmarks: [] } 
      ];
    } catch (e) { return []; }
  });
  
  const [unlockedFolders, setUnlockedFolders] = useState<Set<string>>(new Set());
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modal States
  const [isAddFolderModalOpen, setAddFolderModalOpen] = useState<boolean>(false);
  const [isAddBookmarkModalOpen, setAddBookmarkModalOpen] = useState<boolean>(false);
  const [isUnlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [isOracleOpen, setOracleOpen] = useState<boolean>(false);
  const [folderToUnlock, setFolderToUnlock] = useState<string | null>(null);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // Form States
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [newFolderPass, setNewFolderPass] = useState<string>('');
  const [newBookmarkTitle, setNewBookmarkTitle] = useState<string>('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState<string>('');
  const [newBookmarkDesc, setNewBookmarkDesc] = useState<string>('');
  const [newBookmarkImg, setNewBookmarkImg] = useState<string | null>(null);
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  
  // AI States
  const [isEnchanting, setIsEnchanting] = useState<boolean>(false);
  const [oracleHistory, setOracleHistory] = useState<ChatMessage[]>([{ role: 'model', text: "Greetings. I am the Oracle of the Vault. How may I assist you with your archives today?" }]);
  const [oracleInput, setOracleInput] = useState<string>('');
  const [isOracleThinking, setOracleThinking] = useState<boolean>(false);
  const oracleScrollRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    try { localStorage.setItem('velvet_vault_data_v3', JSON.stringify(folders)); } 
    catch (e) { showToast("Storage full! Cannot save new data.", "error"); }
  }, [folders]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (oracleScrollRef.current) {
        oracleScrollRef.current.scrollTop = oracleScrollRef.current.scrollHeight;
    }
  }, [oracleHistory, isOracleOpen]);

  // --- Helpers ---
  const activeFolder = folders.find(f => f.id === activeFolderId);
  const isUnlocked = activeFolderId && unlockedFolders.has(activeFolderId);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  // --- AI Actions ---
  
  const handleEnchant = async () => {
    if (!newBookmarkUrl) {
      showToast("Enter a URL first", "error");
      return;
    }
    setIsEnchanting(true);
    const prompt = `I am adding a bookmark for this URL: "${newBookmarkUrl}". Please generate a concise, classy Title and a 1-sentence sophisticated description for it. Output format: JSON { "title": "string", "description": "string" }.`;
    
    try {
      const result = await callGemini(prompt, "You are a helpful digital archivist. Return ONLY raw JSON.");
      const cleanResult = result.replace(/```json|```/g, '');
      const parsed = JSON.parse(cleanResult);
      if (parsed.title) setNewBookmarkTitle(parsed.title);
      if (parsed.description) setNewBookmarkDesc(parsed.description);
      showToast("✨ The link has been illuminated!");
    } catch (e) {
      console.error("Enchant failed", e);
      showToast("The spirits are confused. Try manual entry.", "error");
    } finally {
      setIsEnchanting(false);
    }
  };

  const handleOracleChat = async () => {
    if (!oracleInput.trim()) return;
    
    const userMsg = oracleInput;
    setOracleInput('');
    setOracleHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setOracleThinking(true);

    // Prepare context
    const vaultContext = folders.map(f => ({
      folder: f.name,
      bookmarks: f.bookmarks.map(b => ({ title: b.title, url: b.url, desc: b.description }))
    }));

    const systemPrompt = `You are The Oracle, a mystical and highly intelligent guardian of the user's digital library (VelvetVault). 
    User's Vault Content: ${JSON.stringify(vaultContext)}.
    
    Your personality: Sophisticated, slightly archaic but helpful, concise. 
    
    Capabilities:
    1. Answer questions about what links the user has.
    2. Suggest connections between folders.
    3. Summarize the collection.
    
    If the user asks something unrelated to the bookmarks, politely steer them back to the archive or answer briefly with wisdom.`;

    const response = await callGemini(userMsg, systemPrompt);
    
    setOracleHistory(prev => [...prev, { role: 'model', text: response }]);
    setOracleThinking(false);
  };

  // --- Standard Actions ---
  
  const handleCreateFolder = () => {
    if (!newFolderName.trim() || !newFolderPass.trim()) {
      showToast("Name and password required", "error");
      return;
    }
    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName,
      password: newFolderPass,
      bookmarks: []
    };
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setNewFolderPass('');
    setAddFolderModalOpen(false);
    showToast("Folder created successfully");
  };

  const handleAddBookmark = () => {
    if (!newBookmarkUrl.trim()) return;
    let url = newBookmarkUrl;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

    const initialMedia: MediaItem[] = [];
    if (newBookmarkImg) {
      initialMedia.push({
        id: Date.now().toString() + '_img',
        type: 'image',
        content: newBookmarkImg,
        createdAt: new Date().toISOString()
      });
    }

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      title: newBookmarkTitle || new URL(url).hostname,
      url: url,
      description: newBookmarkDesc || "A mysterious link...",
      createdAt: new Date().toISOString(),
      media: initialMedia 
    };

    const updatedFolders = folders.map(f => {
      if (f.id === activeFolderId) {
        return { ...f, bookmarks: [newBookmark, ...f.bookmarks] };
      }
      return f;
    });

    setFolders(updatedFolders);
    setNewBookmarkUrl('');
    setNewBookmarkTitle('');
    setNewBookmarkDesc('');
    setNewBookmarkImg(null);
    setAddBookmarkModalOpen(false);
    showToast("Bookmark added");
  };

  const handleCreationImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { showToast("Image too large. Max 500KB.", "error"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === 'string') setNewBookmarkImg(reader.result); };
    reader.readAsDataURL(file);
  };

  const handleAddMedia = (type: 'image' | 'video' | 'voice', content: string) => {
    if (!selectedBookmark || !activeFolderId) return;
    const newMedia: MediaItem = { id: Date.now().toString(), type, content, createdAt: new Date().toISOString() };
    const updatedFolders = folders.map(f => {
      if (f.id === activeFolderId) {
        const updatedBookmarks = f.bookmarks.map(b => {
          if (b.id === selectedBookmark.id) {
            const updatedB = { ...b, media: [...b.media, newMedia] };
            setSelectedBookmark(updatedB); 
            return updatedB;
          }
          return b;
        });
        return { ...f, bookmarks: updatedBookmarks };
      }
      return f;
    });
    setFolders(updatedFolders);
    showToast(`${type} added`);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { showToast("Image too large. Max 500KB.", "error"); return; }
    const reader = new FileReader();
    reader.onloadend = () => { if (typeof reader.result === 'string') handleAddMedia('image', reader.result); };
    reader.readAsDataURL(file);
  };

  const handleAddVideoLink = () => {
    if (!videoUrlInput) return;
    let embedUrl = videoUrlInput;
    if (videoUrlInput.includes('youtube.com/watch?v=')) embedUrl = videoUrlInput.replace('watch?v=', 'embed/');
    else if (videoUrlInput.includes('youtu.be/')) embedUrl = videoUrlInput.replace('youtu.be/', 'youtube.com/embed/');
    handleAddMedia('video', embedUrl);
    setVideoUrlInput('');
  };

  const deleteMedia = (mediaId: string) => {
    if (!selectedBookmark || !activeFolderId) return;
     const updatedFolders = folders.map(f => {
      if (f.id === activeFolderId) {
        const updatedBookmarks = f.bookmarks.map(b => {
          if (b.id === selectedBookmark.id) {
            const updatedB = { ...b, media: b.media.filter(m => m.id !== mediaId) };
            setSelectedBookmark(updatedB);
            return updatedB;
          }
          return b;
        });
        return { ...f, bookmarks: updatedBookmarks };
      }
      return f;
    });
    setFolders(updatedFolders);
  };

  const handleUnlock = () => {
    const folder = folders.find(f => f.id === folderToUnlock);
    if (folder && folder.password === unlockInput) {
      const newUnlocked = new Set(unlockedFolders);
      if (folderToUnlock) newUnlocked.add(folderToUnlock);
      setUnlockedFolders(newUnlocked);
      setActiveFolderId(folderToUnlock);
      setUnlockModalOpen(false);
      setUnlockInput('');
    } else {
      showToast("Incorrect password", "error");
    }
  };

  const selectFolder = (id: string) => {
    if (unlockedFolders.has(id)) {
      setActiveFolderId(id);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } else {
      setFolderToUnlock(id);
      setUnlockModalOpen(true);
    }
  };

  const deleteBookmark = (bookmarkId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Remove this bookmark?")) return;
    const updatedFolders = folders.map(f => {
      if (f.id === activeFolderId) {
        return { ...f, bookmarks: f.bookmarks.filter(b => b.id !== bookmarkId) };
      }
      return f;
    });
    setFolders(updatedFolders);
  };

  const handleDeleteFromModal = () => {
    if (selectedBookmark && activeFolderId) {
      if (!window.confirm("Remove this bookmark?")) return;
      const updatedFolders = folders.map(f => {
        if (f.id === activeFolderId) {
          return { ...f, bookmarks: f.bookmarks.filter(b => b.id !== selectedBookmark.id) };
        }
        return f;
      });
      setFolders(updatedFolders);
      setDetailModalOpen(false);
      setSelectedBookmark(null);
      showToast("Bookmark deleted");
    }
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-2 rounded shadow-lg animate-fade-in flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'}`}>
          {toast.type === 'error' ? <AlertCircle size={16}/> : <Shield size={16}/>}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay - Closes sidebar when clicked */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed md:relative z-30 w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-slate-800/50">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg shadow-lg shadow-amber-900/20">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xl text-slate-100 tracking-tight">VelvetVault</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Secure Bookmarks</p>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <Button variant="secondary" className="w-full justify-start border-dashed" icon={Plus} onClick={() => { setAddFolderModalOpen(true); if (window.innerWidth < 768) setSidebarOpen(false); }}>
            New Secured Folder
          </Button>
          <Button variant="magic" className="w-full justify-start" icon={Bot} onClick={() => { setOracleOpen(true); if (window.innerWidth < 768) setSidebarOpen(false); }}>
             Consult The Oracle
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {folders.map(folder => (
            <div key={folder.id} onClick={() => selectFolder(folder.id)} className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent ${activeFolderId === folder.id ? 'bg-slate-800 border-slate-700 shadow-md' : 'hover:bg-slate-800/50 hover:border-slate-800'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                {unlockedFolders.has(folder.id) ? <Unlock size={18} className="text-emerald-500 flex-shrink-0" /> : <Lock size={18} className="text-slate-500 group-hover:text-amber-500 transition-colors flex-shrink-0" />}
                <span className={`truncate font-medium ${activeFolderId === folder.id ? 'text-amber-100' : 'text-slate-400'}`}>{folder.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-slate-950 w-full relative">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden absolute top-4 left-4 z-20 p-2 bg-slate-800 rounded text-slate-400"><Menu size={20} /></button>

        {activeFolderId && isUnlocked && activeFolder ? (
          <>
            <div className="h-20 border-b border-slate-800/50 flex items-center justify-between px-6 md:px-10 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10 pl-16 md:pl-10">
              <div className="flex items-center gap-4">
                <h2 className="font-serif text-2xl text-slate-100 capitalize truncate max-w-[150px] md:max-w-none">{activeFolder.name}</h2>
                <span className="hidden md:flex px-2 py-0.5 bg-emerald-900/30 text-emerald-400 border border-emerald-900/50 rounded text-xs font-medium items-center gap-1"><Unlock size={10} /> Unlocked</span>
              </div>
              <Button variant="gold" icon={Plus} onClick={() => setAddBookmarkModalOpen(true)}>Add Link</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
              {activeFolder.bookmarks.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-60">
                  <FolderIcon size={48} strokeWidth={1} className="mb-4" />
                  <p className="font-serif">Folder is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activeFolder.bookmarks.map(bookmark => {
                    const coverImage = bookmark.media.find(m => m.type === 'image');
                    return (
                    <div key={bookmark.id} className="group bg-slate-900 border border-slate-800 rounded-xl hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-900/10 transition-all duration-300 flex flex-col h-48 cursor-pointer relative overflow-hidden" onClick={(e) => { e.preventDefault(); setSelectedBookmark(bookmark); setDetailModalOpen(true); }}>
                      {coverImage && (
                        <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110">
                           <img src={coverImage.content} alt="Cover" className="w-full h-full object-cover opacity-40 group-hover:opacity-30" />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent" />
                        </div>
                      )}
                      <div className="flex-1 p-5 relative z-10">
                        <div className="absolute top-3 right-3 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => deleteBookmark(bookmark.id, e)} className="p-1 hover:bg-slate-800 hover:text-red-400 rounded backdrop-blur-sm"><Trash2 size={14} /></button>
                        </div>
                        <h3 className="font-medium text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2 mb-2 drop-shadow-md">{bookmark.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3 italic opacity-80">{bookmark.description}</p>
                        <div className="flex gap-2 mt-auto">
                            {bookmark.media.some(m => m.type === 'voice') && <span className="p-1 bg-amber-900/30 rounded text-amber-500 backdrop-blur-md"><Mic size={12} /></span>}
                            {bookmark.media.some(m => m.type === 'image') && <span className="p-1 bg-blue-900/30 rounded text-blue-400 backdrop-blur-md"><ImageIcon size={12} /></span>}
                            {bookmark.media.some(m => m.type === 'video') && <span className="p-1 bg-purple-900/30 rounded text-purple-400 backdrop-blur-md"><Video size={12} /></span>}
                        </div>
                      </div>
                      <div className="h-8 border-t border-slate-800 bg-slate-800/80 backdrop-blur flex items-center justify-center text-xs text-slate-500 font-medium uppercase tracking-wider group-hover:bg-slate-800/90 transition-colors rounded-b-xl relative z-10">
                        <MoreHorizontal size={14} className="mr-1" /> View Details & Media
                      </div>
                    </div>
                  )})}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
             <Shield size={64} className="text-slate-800 mb-4" />
             <h2 className="text-2xl font-serif text-slate-500">Select a secure folder</h2>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      <Modal isOpen={isAddFolderModalOpen} onClose={() => setAddFolderModalOpen(false)} title="New Folder">
        <Input autoFocus label="Name" value={newFolderName} onChange={setNewFolderName} />
        <Input type="password" label="Password" value={newFolderPass} onChange={setNewFolderPass} />
        <div className="flex justify-end gap-2 pt-2"><Button onClick={handleCreateFolder}>Create</Button></div>
      </Modal>

      <Modal isOpen={isUnlockModalOpen} onClose={() => setUnlockModalOpen(false)} title="Unlock Folder">
        <div className="text-center mb-4"><Lock size={32} className="mx-auto text-amber-500 mb-2" /></div>
        <Input autoFocus type="password" placeholder="Password" value={unlockInput} onChange={setUnlockInput} />
        <Button className="w-full" onClick={handleUnlock}>Unlock</Button>
      </Modal>

      <Modal isOpen={isAddBookmarkModalOpen} onClose={() => setAddBookmarkModalOpen(false)} title="Add Link">
        <Input 
          autoFocus 
          label="URL" 
          value={newBookmarkUrl} 
          onChange={setNewBookmarkUrl} 
          actionButton={
            <button 
              onClick={handleEnchant} 
              disabled={isEnchanting}
              className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow-lg shadow-indigo-500/30 flex items-center gap-1 text-xs font-medium px-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Auto-fill with Gemini AI"
            >
               {isEnchanting ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
               <span>Enchant</span>
            </button>
          }
        />
        <Input label="Title" value={newBookmarkTitle} onChange={setNewBookmarkTitle} />
        <Input label="Description" value={newBookmarkDesc} onChange={setNewBookmarkDesc} placeholder="A brief note..." />
        
        <div className="mb-4">
            <label className="block text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Cover Image (Optional)</label>
            <div className="flex gap-2 items-center">
                <label className="cursor-pointer flex items-center justify-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 text-xs text-slate-300 transition-colors">
                    <ImageIcon size={14} className="mr-2"/> Upload Cover
                    <input type="file" accept="image/*" className="hidden" onChange={handleCreationImageUpload} />
                </label>
                {newBookmarkImg && (
                    <div className="flex items-center text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30">
                        <Sparkles size={12} className="mr-1"/> Image Attached
                        <button onClick={() => setNewBookmarkImg(null)} className="ml-2 text-slate-500 hover:text-red-400"><X size={12}/></button>
                    </div>
                )}
            </div>
        </div>

        <div className="flex justify-end gap-2"><Button onClick={handleAddBookmark}>Save</Button></div>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={() => setDetailModalOpen(false)} title="Bookmark Details" maxWidth="max-w-4xl">
        {selectedBookmark && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-serif text-amber-100 break-words mr-2">{selectedBookmark.title}</h2>
                        <Button variant="danger" size="small" icon={Trash2} onClick={handleDeleteFromModal} />
                    </div>
                    <p className="text-sm text-slate-400 mb-3 italic">{selectedBookmark.description}</p>
                    <a href={selectedBookmark.url} target="_blank" rel="noreferrer" className="text-xs text-amber-500 hover:underline break-all flex items-center gap-1 mb-4">
                        {selectedBookmark.url} <ExternalLink size={10} />
                    </a>
                    <div className="text-xs text-slate-500">Created: {new Date(selectedBookmark.createdAt).toLocaleDateString()}</div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Add Media</label>
                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-sm text-slate-300"><Mic size={14} /> Voice Note</div>
                        <AudioRecorder onSave={(data) => handleAddMedia('voice', data)} />
                    </div>
                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                         <div className="flex items-center gap-2 mb-2 text-sm text-slate-300"><ImageIcon size={14} /> Upload Image</div>
                         <input type="file" accept="image/*" id="img-upload" className="hidden" onChange={handleImageUpload} />
                         <label htmlFor="img-upload" className="cursor-pointer flex items-center justify-center w-full py-2 border border-dashed border-slate-600 rounded hover:bg-slate-800 text-xs text-slate-400 hover:text-amber-400 transition-colors">Select File</label>
                    </div>
                    <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800">
                         <div className="flex items-center gap-2 mb-2 text-sm text-slate-300"><Video size={14} /> Video Embed</div>
                         <div className="flex gap-2">
                            <input className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs" placeholder="YouTube URL..." value={videoUrlInput} onChange={(e) => setVideoUrlInput(e.target.value)} />
                            <button onClick={handleAddVideoLink} className="bg-slate-700 hover:bg-amber-600 text-white rounded px-2"><Plus size={14}/></button>
                         </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Film size={16} /> Attached Media ({selectedBookmark.media.length})</h3>
                <div className="space-y-4">
                    {selectedBookmark.media.length === 0 && <div className="text-center py-10 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">No media attached yet.</div>}
                    {selectedBookmark.media.map((item) => (
                        <div key={item.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative group">
                            <button onClick={() => deleteMedia(item.id)} className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-red-900 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                            {item.type === 'voice' && (
                                <div className="p-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-500"><Mic size={20}/></div>
                                    <audio controls src={item.content} className="flex-1 h-8 w-full" />
                                </div>
                            )}
                            {item.type === 'image' && <div className="relative"><img src={item.content} alt="Attachment" className="w-full h-auto max-h-64 object-contain bg-black/40" /></div>}
                            {item.type === 'video' && <div className="relative pt-[56.25%] bg-black"><iframe src={item.content} className="absolute inset-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>}
                            <div className="px-3 py-2 bg-slate-900/50 text-xs text-slate-500 font-mono border-t border-slate-800">Added {new Date(item.createdAt).toLocaleTimeString()}</div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ORACLE CHAT MODAL */}
      <Modal isOpen={isOracleOpen} onClose={() => setOracleOpen(false)} title={<><Bot className="text-indigo-400"/> The Oracle</>} maxWidth="max-w-2xl">
        <div className="flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 custom-scrollbar" ref={oracleScrollRef}>
            {oracleHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isOracleThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-lg rounded-bl-none border border-slate-700 flex items-center gap-2">
                  <Loader size={14} className="animate-spin text-indigo-400"/> <span className="text-xs text-slate-400">Consulting the archives...</span>
                </div>
              </div>
            )}
          </div>
          <div className="relative flex items-center gap-2 border-t border-slate-800 pt-4">
            <input 
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="Ask the Oracle..."
              value={oracleInput}
              onChange={(e) => setOracleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOracleChat()}
            />
            <Button onClick={handleOracleChat} variant="magic" disabled={isOracleThinking}><Send size={18}/></Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}