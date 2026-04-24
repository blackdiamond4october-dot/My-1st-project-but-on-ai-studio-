import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus, 
  History, 
  Settings as SettingsIcon, 
  Download, 
  Trash2, 
  Menu, 
  X, 
  Plus,
  ArrowRight,
  Receipt,
  Package,
  ClipboardList,
  LogIn,
  LogOut,
  AlertCircle,
  Moon,
  Sun,
  Cloud,
  MapPin,
  Phone,
  Mail,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import DocumentForm from './components/DocumentForm';
import DocumentHistory from './components/DocumentHistory';
import Settings from './components/Settings';
import { AppSettings, BillingDocument } from './types';
import { ZALogo } from './components/DocumentPreview';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged, 
  User,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  deleteDoc,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';

const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'ZA Precision Engineering Co.',
  address: 'Nadeem Park, Bund Road, Daroghawala, Lahore.',
  phone1: '+92 333 7227025',
  phone2: '+92 321 9240587',
  email: 'Zali7139@gmail.com',
  billCounter: 1,
  challanCounter: 1,
  quoteCounter: 1,
  chargeCounter: 1,
  paymentCounter: 1,
  currency: 'Rs.',
  theme: 'dark',
  defaultTerms: '1 : 50% Advance, 50% at the time of Delivery.\n2 :Inspection will be made by our workshop.\n3 :Delivery dates must be conceded after confirm order.\n4 :Exclusive sale tax',
  backupEmail: 'workspaceforsystem@gmail.com'
};

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong.";
      try {
        const errInfo = JSON.parse(this.state.error?.message || "");
        if (errInfo.error) message = `Firestore Error: ${errInfo.error} during ${errInfo.operationType}`;
      } catch (e) {
        message = this.state.error?.message || message;
      }

      return (
        <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#1a1a2e] border border-red-500/30 rounded-2xl p-8 space-y-4">
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h2 className="text-xl font-bold text-white">Application Error</h2>
            <p className="text-white/60 text-sm">{message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-600 transition-all"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [documents, setDocuments] = useState<BillingDocument[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(localStorage.getItem('driveToken'));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem('refreshToken'));
  const [tokenExpiry, setTokenExpiry] = useState<number>(Number(localStorage.getItem('tokenExpiry')) || 0);

  // Auto-refresh token if expired
  useEffect(() => {
    const checkToken = async () => {
      if (refreshToken && driveToken && Date.now() > tokenExpiry - 300000) { // 5 mins buffer
        try {
          const res = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          if (res.ok) {
            const data = await res.json();
            const expiryTime = Date.now() + (data.expiresIn * 1000);
            setDriveToken(data.token);
            setTokenExpiry(expiryTime);
            localStorage.setItem('driveToken', data.token);
            localStorage.setItem('tokenExpiry', String(expiryTime));
          }
        } catch (e) {
          console.error("Auto refresh failed", e);
        }
      }
    };
    const interval = setInterval(checkToken, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [refreshToken, driveToken, tokenExpiry]);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);

  // Theme effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const [authError, setAuthError] = useState<string | null>(null);

  const login = async () => {
    setAuthError(null);
    try {
      // We are moving to 100% Popup-based login. 
      // Redirects are failing on modern mobile browsers due to "Storage Partitioning".
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login attempt failed:", error);
      
      if (error.code === 'auth/popup-blocked') {
        setAuthError("Your phone blocked the Login window. Please check your address bar and tap 'Always Allow' or 'Open'.");
      } else if (error.message?.includes('missing initial state')) {
        setAuthError("Device Security Conflict: Please try using Chrome incognito mode or ensure 'Prevent Cross-Site Tracking' is disabled.");
      } else {
        setAuthError("Login issue. Please try again or check your internet connection.");
      }
    }
  };

  const logout = () => {
    signOut(auth)
      .then(() => {
        setDriveToken(null);
        localStorage.removeItem('driveToken');
      })
      .catch(console.error);
  };

  const connectGoogleDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const response = await fetch('/api/auth/google-url');
      const { url } = await response.json();
      
      // Open in a new tab instead of window.open to be more reliable in some environments
      const authWindow = window.open(url, '_blank');
      
      if (!authWindow) {
        alert("Popup blocked! Please allow popups for this site to connect to Google Drive.");
        setIsConnectingDrive(false);
        return;
      }
      
      const handleMessage = (event: MessageEvent) => {
        // Accept messages from our own origin
        if (event.origin !== window.location.origin) {
          console.warn(`[SYSTEM] Ignoring message from unknown origin: ${event.origin}. Expected: ${window.location.origin}`);
          return;
        }

        if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
          const { token, refreshToken: newRefresh, expiresIn } = event.data;
          const expiryTime = Date.now() + (expiresIn * 1000);
          
          setDriveToken(token);
          if (newRefresh) {
            setRefreshToken(newRefresh);
            localStorage.setItem('refreshToken', newRefresh);
          }
          setTokenExpiry(expiryTime);
          
          localStorage.setItem('driveToken', token);
          localStorage.setItem('tokenExpiry', String(expiryTime));
          
          window.removeEventListener('message', handleMessage);
          setIsConnectingDrive(false);
        }
      };
      window.addEventListener('message', handleMessage);

      // Fallback if window is closed without message
      const checkWindow = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindow);
          setIsConnectingDrive(false);
        }
      }, 1000);

    } catch (err) {
      console.error("Drive connection failed", err);
      setIsConnectingDrive(false);
    }
  };

  const uploadToDrive = async (docData: BillingDocument) => {
    if (!driveToken) {
      console.warn("No Google Drive token found, skipping upload.");
      return;
    }
    
    try {
      console.log("Starting Google Drive upload for:", docData.refNo);
      const headers = ["Ref No", "Type", "Date", "Customer", "Total", "Items"];
      const row = [
        docData.refNo,
        docData.type,
        docData.date,
        docData.customer,
        docData.total,
        docData.items.map(i => `${i.desc} (x${i.qty})`).join('; ')
      ];
      const csvContent = [headers, row].map(e => e.join(",")).join("\n");
      
      const metadata = {
        name: `${docData.refNo}-${docData.customer}.csv`,
        mimeType: 'text/csv',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const body = 
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/csv\r\n\r\n' +
        csvContent +
        close_delim;

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${driveToken}`,
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Drive upload failed with status:", response.status, errorData);
        if (response.status === 401) {
          setDriveToken(null);
          localStorage.removeItem('driveToken');
          alert("Google Drive session expired. Please reconnect in Settings.");
        }
        throw new Error(`Drive upload failed: ${response.statusText}`);
      }
      console.log("Uploaded to Google Drive successfully");
    } catch (err) {
      console.error("Drive upload error:", err);
    }
  };

  useEffect(() => {
    // Safety timeout: if auth hasn't signaled ready in 5 seconds, force it.
    // This prevents the "Infinite White Screen" on strict mobile browsers (Safari/Chrome Mobile)
    const safetyTimeout = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("Auth took too long; forcing ready state for mobile.");
        setIsAuthReady(true);
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      clearTimeout(safetyTimeout);
    });

    // Handle mobile redirect login results
    if (window.innerWidth < 768) {
      getRedirectResult(auth).then(() => {
        // Successful redirect login
      }).catch((error) => {
        console.error("Redirect login error:", error);
      });
    }

    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [isAuthReady]);

  // Sync Settings
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const settingsRef = doc(db, `users/${user.uid}/settings/app`);
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as AppSettings);
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsRef, DEFAULT_SETTINGS).catch(err => 
          handleFirestoreError(err, OperationType.WRITE, settingsRef.path)
        );
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, settingsRef.path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  // Sync Documents
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const docsRef = collection(db, `users/${user.uid}/documents`);
    const q = query(docsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as BillingDocument[];
      setDocuments(docs);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, docsRef.path);
    });

    return () => unsubscribe();
  }, [user, isAuthReady]);

  const addDocument = async (docData: BillingDocument) => {
    if (!user) return;
    const isNew = !docData.id;
    const docId = docData.id || Date.now().toString();
    const docRef = doc(db, `users/${user.uid}/documents/${docId}`);
    
    try {
      let finalDoc = { ...docData };
      
      if (isNew) {
        // [FIX] Ref Number Sync Error: Fetch LATEST settings from server to avoid race conditions
        const settingsRef = doc(db, 'users', user.uid, 'settings', 'app');
        const settingsSnap = await getDocFromServer(settingsRef);
        const latestSettings = settingsSnap.data() as AppSettings;

        let prefix = docData.type === 'bill' ? 'BILL-' : 
                     docData.type === 'challan' ? 'DC-' : 
                     docData.type === 'charge' ? 'CH-' :
                     docData.type === 'payment' ? 'PM-' : 'QT-';
        let counterKey = docData.type === 'bill' ? 'billCounter' : 
                         docData.type === 'challan' ? 'challanCounter' : 
                         docData.type === 'charge' ? 'chargeCounter' :
                         docData.type === 'payment' ? 'paymentCounter' : 'quoteCounter';
        let counter = latestSettings[counterKey] || 1;
        
        finalDoc.refNo = prefix + String(counter).padStart(4, '0');

        // Increment counters in settings
        const nextSettings = { ...latestSettings };
        nextSettings[counterKey]++;
        
        // Update settings first
        await updateSettings(nextSettings);
      }

      await setDoc(docRef, { ...finalDoc, id: docId });

      // Auto-export to server
      try {
        const headers = ["Ref No", "Type", "Date", "Customer", "Total", "Items"];
        const row = [
          docData.refNo,
          docData.type,
          docData.date,
          docData.customer,
          docData.total,
          docData.items.map(i => `${i.desc} (x${i.qty})`).join('; ')
        ];
        const csvContent = [headers, row].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const formData = new FormData();
        formData.append('file', blob, `${docData.refNo}-${Date.now()}.csv`);
        formData.append('backupEmail', settings.backupEmail);

        await fetch('/api/store-excel', {
          method: 'POST',
          body: formData,
        });
      } catch (exportErr) {
        console.error("Auto-export failed", exportErr);
      }

      // Upload to Google Drive if connected
      if (driveToken) {
        await uploadToDrive(docData);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docRef.path);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!user) return;
    const docRef = doc(db, `users/${user.uid}/documents/${id}`);
    try {
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docRef.path);
    }
  };

  const updateSettings = async (newSettings: AppSettings) => {
    if (!user) return;
    const settingsRef = doc(db, `users/${user.uid}/settings/app`);
    try {
      await setDoc(settingsRef, newSettings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, settingsRef.path);
    }
  };

  const importData = async (docs: BillingDocument[], newSettings: AppSettings) => {
    if (!user) return;
    try {
      // Update settings
      await updateSettings(newSettings);
      
      // Add all documents
      for (const docData of docs) {
        const docId = docData.id || Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const docRef = doc(db, `users/${user.uid}/documents/${docId}`);
        await setDoc(docRef, { ...docData, id: docId });
      }
      console.log('Import successful!');
    } catch (err) {
      console.error("Import failed", err);
    }
  };

  const clearAllDocuments = async () => {
    if (!user) return;
    try {
      const deletePromises = documents.map(d => {
        if (d.id) {
          const docRef = doc(db, `users/${user.uid}/documents/${d.id}`);
          return deleteDoc(docRef);
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      
      // Also reset settings to default
      await updateSettings(DEFAULT_SETTINGS);
      
      console.log('All documents and settings cleared.');
    } catch (err) {
      console.error("Clear failed", err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#07070d] flex flex-col items-center justify-center gap-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            repeat: Infinity, 
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          className="w-32 h-32 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500 p-6 shadow-[0_0_50px_rgba(249,115,22,0.1)]"
        >
          <ZALogo size={100} />
        </motion.div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="space-y-1 text-center">
            <h2 className="text-white font-black tracking-[0.3em] uppercase text-sm">ZA Precision</h2>
            <p className="text-white/20 text-[10px] tracking-widest uppercase">Initializing Secure System</p>
          </div>
          
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ left: "-100%" }}
              animate={{ left: "100%" }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#1a1a2e] border border-white/5 rounded-3xl p-10 text-center space-y-8 shadow-2xl">
          <div className="space-y-2">
            <div className="w-24 h-24 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto text-orange-500 p-4">
              <ZALogo size={80} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">ZA Precision</h1>
            <p className="text-white/40 text-sm">Professional Billing & Document Management</p>
          </div>
          
          {authError && (
            <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-[11px] text-center font-medium animate-pulse">
              {authError}
            </div>
          )}

          <button 
            onClick={login}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all transform active:scale-95"
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
          
          <p className="text-[10px] text-white/20 uppercase tracking-widest">
            Secure Cloud Storage Powered by Firebase
          </p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className={cn(
          "flex min-h-screen font-sans selection:bg-orange-500 selection:text-white transition-colors duration-500",
          settings.theme === 'dark' ? "bg-[#07070d] text-[#f0f0ff]" : "bg-[#f8f9fa] text-[#1a1a1a]"
        )}>
          {/* Sidebar Overlay */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={cn(
            "fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-300 transform lg:translate-x-0 flex flex-col",
            settings.theme === 'dark' ? "bg-[#0e0e1a] border-r border-white/5" : "bg-white border-r border-black/5",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <div className={cn("p-6 border-b text-center flex flex-col items-center relative", settings.theme === 'dark' ? "border-white/5" : "border-black/5")}>
              <ZALogo size={60} className="mb-4" />
              <motion.div 
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-[10px] tracking-[3px] text-orange-500 uppercase font-bold mb-1"
              >
                ZA PRECISION
              </motion.div>
              <div className={cn("text-base font-extrabold leading-tight", settings.theme === 'dark' ? "text-white" : "text-black")}>Engineering Co.<br />Billing System</div>
            </div>

            <nav className="flex-1 py-6 overflow-y-auto">
              <div className={cn("px-6 mb-4 text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Main</div>
              <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              
              <div className={cn("px-6 mt-8 mb-4 text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Create</div>
              <SidebarLink to="/new?type=bill" icon={<Receipt size={18} />} label="New Bill" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              <SidebarLink to="/new?type=charge" icon={<Receipt size={18} />} label="New Charge" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              <SidebarLink to="/new?type=payment" icon={<Receipt size={18} />} label="New Payment" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              <SidebarLink to="/new?type=challan" icon={<Package size={18} />} label="New Challan" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              <SidebarLink to="/new?type=quotation" icon={<ClipboardList size={18} />} label="New Quotation" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
              
              <div className={cn("px-6 mt-8 mb-4 text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>Records</div>
              <SidebarLink to="/history" icon={<History size={18} />} label="History" theme={settings.theme} badge={documents.length} onClick={() => setIsSidebarOpen(false)} />
              
              <div className={cn("px-6 mt-8 mb-4 text-[10px] tracking-widest uppercase font-bold", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>System</div>
              <SidebarLink to="/settings" icon={<SettingsIcon size={18} />} label="Settings" theme={settings.theme} onClick={() => setIsSidebarOpen(false)} />
            </nav>

            <div className={cn("p-4 border-t space-y-4", settings.theme === 'dark' ? "border-white/5" : "border-black/5")}>
              <div className="flex items-center gap-3 px-2">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className={cn("w-8 h-8 rounded-full border", settings.theme === 'dark' ? "border-white/10" : "border-black/10")} />
                <div className="flex-1 min-w-0 text-[11px]">
                  <div className={cn("font-bold truncate", settings.theme === 'dark' ? "text-white" : "text-black")}>{user.displayName}</div>
                  <div className={cn("truncate", settings.theme === 'dark' ? "text-white/30" : "text-black/30")}>{user.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={logout}
                  className="flex-1 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-all"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
            {/* Topbar */}
            <header className={cn(
              "h-16 backdrop-blur-xl border-b sticky top-0 z-30 px-6 flex items-center justify-between",
              settings.theme === 'dark' ? "bg-[#0e0e1a]/80 border-white/5" : "bg-white/80 border-black/5"
            )}>
              <div className="flex items-center gap-4">
                <button 
                  className={cn("lg:hidden p-2", settings.theme === 'dark' ? "text-white/70 hover:text-white" : "text-black/70 hover:text-black")}
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={24} />
                </button>
                <h1 className="text-lg font-bold tracking-tight">
                  <Routes>
                    <Route path="/" element={<span>Dashboard</span>} />
                    <Route path="/new" element={<span>New Document</span>} />
                    <Route path="/history" element={<span>Document History</span>} />
                    <Route path="/settings" element={<span>Settings</span>} />
                  </Routes>
                </h1>
              </div>

              <div className="flex items-center gap-4">
                {driveToken && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                    <Cloud size={14} /> DRIVE CONNECTED
                  </div>
                )}
                <Link 
                  to="/new" 
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Plus size={16} />
                  NEW DOCUMENT
                </Link>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 p-6 lg:p-8">
              <Routes>
                <Route path="/" element={<Dashboard documents={documents} settings={settings} />} />
                <Route path="/new" element={<DocumentForm settings={settings} onSave={addDocument} />} />
                <Route path="/history" element={<DocumentHistory documents={documents} onDelete={deleteDocument} settings={settings} />} />
                <Route path="/settings" element={<Settings settings={settings} documents={documents} onSave={updateSettings} onImport={importData} onClear={clearAllDocuments} onConnectDrive={connectGoogleDrive} driveToken={driveToken} isConnectingDrive={isConnectingDrive} />} />
              </Routes>
            </div>
          </main>

          {/* Floating Action Button (Wow Factor) */}
          <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  className="flex flex-col gap-2 mb-2"
                >
                  {!location.search.includes('type=bill') && <QuickFab to="/new?type=bill" icon={<Receipt size={18} />} label="New Bill" color="bg-orange-500" onClick={() => setIsSidebarOpen(false)} />}
                  {!location.search.includes('type=charge') && <QuickFab to="/new?type=charge" icon={<Receipt size={18} />} label="New Charge" color="bg-orange-600" onClick={() => setIsSidebarOpen(false)} />}
                  {!location.search.includes('type=payment') && <QuickFab to="/new?type=payment" icon={<Receipt size={18} />} label="New Payment" color="bg-emerald-600" onClick={() => setIsSidebarOpen(false)} />}
                  {!location.search.includes('type=challan') && <QuickFab to="/new?type=challan" icon={<Package size={18} />} label="New Challan" color="bg-blue-500" onClick={() => setIsSidebarOpen(false)} />}
                  {!location.search.includes('type=quotation') && <QuickFab to="/new?type=quotation" icon={<ClipboardList size={18} />} label="New Quote" color="bg-emerald-500" onClick={() => setIsSidebarOpen(false)} />}
                </motion.div>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="w-14 h-14 rounded-2xl bg-orange-500 text-black shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            >
              <Plus className={cn("transition-transform duration-500", isSidebarOpen ? "rotate-45" : "")} size={28} />
              <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-black/80 text-white text-[10px] font-bold uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Quick Actions
              </div>
            </button>
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

function QuickFab({ to, icon, label, color, onClick }: { to: string, icon: React.ReactNode, label: string, color: string, onClick?: () => void }) {
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-black font-bold text-xs shadow-xl hover:scale-105 transition-all",
        color
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function SidebarLink({ to, icon, label, badge, theme, onClick }: { to: string, icon: React.ReactNode, label: string, badge?: number, theme: 'dark' | 'light', onClick: () => void }) {
  const location = useLocation();
  const isActive = (location.pathname + location.search) === to || (location.pathname === to && location.search === '');

  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all border-l-2",
        isActive 
          ? "bg-orange-500/10 text-orange-500 border-orange-500" 
          : cn(
              "border-transparent hover:bg-orange-500/5 hover:text-orange-500",
              theme === 'dark' ? "text-white/50" : "text-black/50"
            )
      )}
    >
      <span className={cn("transition-colors", isActive ? "text-orange-500" : (theme === 'dark' ? "text-white/30" : "text-black/30"))}>
        {icon}
      </span>
      {label}
      {badge !== undefined && (
        <span className="ml-auto px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
          {badge}
        </span>
      )}
    </Link>
  );
}

