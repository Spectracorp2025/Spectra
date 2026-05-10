import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, createContext, useContext } from 'react';
import { UserProfile } from './types';
import Background from './components/Background';
import AudioPlayer from './components/AudioPlayer';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Store from './pages/Store';
import Games from './pages/Games';
import VideoGames from './pages/VideoGames';
import Tools from './pages/Tools';
import Networks from './pages/Networks';
import Accounts from './pages/Accounts';
import Plans from './pages/Plans';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import Novels from './pages/Novels';
import NovelDetail from './pages/NovelDetail';
import ChapterReader from './pages/ChapterReader';
import Transmissions from './pages/Transmissions';
import Forums from './pages/Forums';
import ForumDetail from './pages/ForumDetail';

interface AuthContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Set persistence to session before setting up the listener
    setPersistence(auth, browserSessionPersistence).catch(err => console.error("Persistence error:", err));

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsSyncing(true);
      if (firebaseUser) {
        try {
          const docRef = doc(db, 'profiles', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            console.error('No profile found for authenticated user');
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsSyncing(false);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // User rank expiration check
  useEffect(() => {
    if (user && user.rank !== 'Normal' && user.rank_expiration) {
        const now = new Date();
        const expiration = new Date(user.rank_expiration);
        if (now > expiration) {
            // Rank expired, revert to Normal
            // In a real app, you'd update Firestore here too
            setUser({
                ...user,
                rank: 'Normal',
                rank_expiration: undefined
            });
        }
    }
  }, [user]);

  if (isLoading || (auth.currentUser && !user && isSyncing)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
      <BrowserRouter basename="/Spectra/">
        <div className="min-h-screen text-white font-sans selection:bg-white/30">
          <Background />
          <AudioPlayer />
          
          <main className="relative z-10">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
              
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/store" element={user ? <Store /> : <Navigate to="/login" />} />
              <Route path="/games" element={user ? <Games /> : <Navigate to="/login" />} />
              <Route path="/videogames" element={user ? <VideoGames /> : <Navigate to="/login" />} />
              <Route path="/tools" element={user ? <Tools /> : <Navigate to="/login" />} />
              <Route path="/networks" element={user ? <Networks /> : <Navigate to="/login" />} />
              <Route path="/accounts" element={user ? <Accounts /> : <Navigate to="/login" />} />
              <Route path="/plans" element={user ? <Plans /> : <Navigate to="/login" />} />
              <Route path="/announcements" element={user ? <Announcements /> : <Navigate to="/login" />} />
              <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
              <Route path="/novels" element={user ? <Novels /> : <Navigate to="/login" />} />
              <Route path="/novels/:id" element={user ? <NovelDetail /> : <Navigate to="/login" />} />
              <Route path="/novels/:novelId/chapters/:chapterId" element={user ? <ChapterReader /> : <Navigate to="/login" />} />
              <Route path="/transmissions" element={user ? <Transmissions /> : <Navigate to="/login" />} />
              <Route path="/forums" element={user ? <Forums /> : <Navigate to="/login" />} />
              <Route path="/forums/:id" element={user ? <ForumDetail /> : <Navigate to="/login" />} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
