

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Player, Match, View, FeeStatus, Withdrawal } from './types';
import { MOCK_PLAYERS, MOCK_MATCHES } from './constants';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { PlayerDetailsModal } from './components/PlayerDetailsModal';
import { PlayerEditModal } from './components/PlayerEditModal';
import { Scheduling } from './components/Scheduling';
import { Fees } from './components/Fees';
import { Finance } from './components/Finance';
import { ImportExport } from './components/ImportExport';
import { Profile } from './components/Profile';
import { LiveMatch } from './components/LiveMatch';
import { ScorecardModal } from './components/ScorecardModal';
import { CricketRules } from './components/CricketRules';
import { FieldingPositions } from './components/FieldingPositions';
import { Toast } from './components/Toast';
import { DashboardIcon, CalendarIcon, FeeIcon, ImportExportIcon, RulesIcon, LogoutIcon, UserCircleIcon, MenuIcon, XIcon, FielderIcon, RupeeIcon } from './components/Icons';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}>
        {icon}
        <span className="ml-4 font-medium">{label}</span>
    </button>
);

const Sidebar: React.FC<{ currentView: View; setView: (view: View) => void; onLogout: () => void; onClose?: () => void; }> = ({ currentView, setView, onLogout, onClose }) => {
    const navItems: { id: View; icon: React.ReactNode; label: string }[] = [
        { id: 'dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
        { id: 'scheduling', icon: <CalendarIcon />, label: 'Scheduling' },
        { id: 'fees', icon: <FeeIcon />, label: 'Match Fees' },
        { id: 'finance', icon: <RupeeIcon />, label: 'BCC Finance' },
        { id: 'rules', icon: <RulesIcon />, label: 'Cricket Rules' },
        { id: 'fielding-positions', icon: <FielderIcon />, label: 'Fielding Positions' },
        { id: 'import-export', icon: <ImportExportIcon />, label: 'Import/Export' },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-800 text-white">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center">
                    <img src="https://img.icons8.com/color/48/000000/cricket.png" alt="Cricket Logo" className="h-10 w-10"/>
                    <h1 className="text-xl font-bold ml-3">BCC Pune</h1>
                </div>
                 {onClose && (
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors" aria-label="Close menu">
                        <XIcon />
                    </button>
                )}
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentView === item.id}
                        onClick={() => setView(item.id)}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-slate-700 space-y-2">
                <NavItem
                    key="profile"
                    icon={<UserCircleIcon />}
                    label="My Profile"
                    isActive={currentView === 'profile'}
                    onClick={() => setView('profile')}
                />
                <button onClick={onLogout} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-rose-600 hover:text-white transition-colors duration-200">
                    <LogoutIcon />
                    <span className="ml-4 font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    scheduling: 'Match Management',
    fees: 'Fee Management',
    'import-export': 'Data Management',
    rules: 'Cricket Rules',
    'fielding-positions': 'Fielding Positions',
    finance: 'BCC Finance',
    profile: 'My Profile',
};

const STORAGE_KEY = 'bccPuneAppData';

interface StoredData {
    players: Player[];
    matches: Match[];
    withdrawals: Withdrawal[];
}

const loadInitialState = (): StoredData => {
    try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
             const data = JSON.parse(item);
            return {
                players: data.players || MOCK_PLAYERS,
                matches: data.matches || MOCK_MATCHES,
                withdrawals: data.withdrawals || [],
            };
        }
    } catch (error) {
        console.error("Error reading from localStorage", error);
    }
    return { players: MOCK_PLAYERS, matches: MOCK_MATCHES, withdrawals: [] };
};


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [initialState] = useState(loadInitialState);
  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [matches, setMatches] = useState<Match[]>(initialState.matches);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialState.withdrawals);

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [liveMatchId, setLiveMatchId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [viewingScorecardMatch, setViewingScorecardMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    try {
        const data: StoredData = { players, matches, withdrawals };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
  }, [players, matches, withdrawals]);
  
  const visibleMatches = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return matches.filter(match => {
        if (match.status !== 'Completed' || !match.completionDate) {
            return true; // Always show non-completed or live matches
        }
        return new Date(match.completionDate) >= sevenDaysAgo;
    });
  }, [matches]);


  const handleLogin = (email: string) => {
    const user = players.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
  };
  
  const handleRegister = (newPlayer: Omit<Player, 'id' | 'registrationDate'>) => {
      const player: Player = {
          ...newPlayer,
          id: `p${players.length + 1}`,
          registrationDate: new Date().toISOString().split('T')[0]
      };
      setPlayers(prev => [...prev, player]);
      setCurrentUser(player);
      setIsAuthenticated(true); // Auto-login after registration
  };
  
  const handleUpdatePlayer = (updatedPlayer: Player) => {
    setPlayers(prevPlayers => prevPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p));
    if (currentUser && currentUser.id === updatedPlayer.id) {
        setCurrentUser(updatedPlayer);
    }
    setPlayerToEdit(null); // Close edit modal
    showToast('Player details updated successfully!', 'success');
  };

  const handleAddMatch = (newMatch: Omit<Match, 'id'>) => {
      const match: Match = {
          ...newMatch,
          id: `m${matches.length + 1}`,
      }
      setMatches(prev => [match, ...prev]);
      setCurrentView('scheduling');
      showToast("Match scheduled successfully!", 'success');
  };

  const handleAddWithdrawal = (newWithdrawal: Omit<Withdrawal, 'id'>) => {
      const withdrawal: Withdrawal = {
          ...newWithdrawal,
          id: `w${withdrawals.length + 1}_${Date.now()}`
      };
      setWithdrawals(prev => [withdrawal, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      showToast("Withdrawal recorded successfully!", 'success');
  };

  const handleImportPlayers = (importedPlayers: Player[]) => {
    setPlayers(currentPlayers => {
        const playersMap = new Map(currentPlayers.map(p => [p.id, p]));
        
        importedPlayers.forEach(importedPlayer => {
            // Basic validation
            if (importedPlayer.id && importedPlayer.fullName) {
                playersMap.set(importedPlayer.id, importedPlayer);
            }
        });
        
        return Array.from(playersMap.values());
    });
  }

  const handleStartMatch = (matchId: string) => {
    setMatches(prevMatches => prevMatches.map(m => 
        m.id === matchId ? { ...m, status: 'Live' as const } : m
    ));
    setLiveMatchId(matchId);
  }
  
  const handleUpdateMatch = (updatedMatch: Match) => {
      setMatches(prevMatches => prevMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m));
  };
  
  const handleExitMatch = () => {
      setLiveMatchId(null);
  }
  
  const liveMatch = matches.find(m => m.id === liveMatchId);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard players={players} matches={visibleMatches} onPlayerSelect={setSelectedPlayer} onEditPlayer={setPlayerToEdit} />;
      case 'scheduling':
        return <Scheduling players={players} matches={matches} onAddMatch={handleAddMatch} onStartMatch={handleStartMatch} onViewScorecard={setViewingScorecardMatch} />;
      case 'fees':
        return <Fees players={players} matches={visibleMatches} onUpdateMatch={handleUpdateMatch} onShowToast={showToast} />;
      case 'finance':
        return <Finance matches={matches} withdrawals={withdrawals} onAddWithdrawal={handleAddWithdrawal} onShowToast={showToast} />;
      case 'import-export':
        return <ImportExport players={players} onImport={handleImportPlayers} onPlayerSelect={setSelectedPlayer} onShowToast={showToast} />;
      case 'rules':
        return <CricketRules />;
      case 'fielding-positions':
        return <FieldingPositions />;
      case 'profile':
        return currentUser ? <Profile user={currentUser} onUpdateProfile={handleUpdatePlayer} onClose={() => setCurrentView('dashboard')} /> : <div className="p-8">Please log in to see your profile.</div>;
      default:
        return <Dashboard players={players} matches={visibleMatches} onPlayerSelect={setSelectedPlayer} onEditPlayer={setPlayerToEdit} />;
    }
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} />;
  }
  
  if (liveMatch) {
      return <LiveMatch match={liveMatch} players={players} onUpdateMatch={handleUpdateMatch} onExit={handleExitMatch} onShowToast={showToast} />
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <div className="w-64 hidden md:block flex-shrink-0">
        <Sidebar currentView={currentView} setView={setCurrentView} onLogout={handleLogout} />
      </div>

       <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 flex justify-between items-center h-16 px-4 md:px-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-20">
            {/* Left side: Hamburger (mobile) and Page Title (desktop) */}
            <div className="flex items-center gap-4">
                 <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Open menu">
                    <MenuIcon />
                </button>
                <h1 className="hidden md:block text-2xl font-bold text-slate-800 dark:text-white">
                    {viewTitles[currentView]}
                </h1>
            </div>

            {/* Center: App Name (mobile) */}
            <div className="md:hidden absolute left-1/2 -translate-x-1/2">
                 <div className="flex items-center gap-2">
                    <img src="https://img.icons8.com/color/48/000000/cricket.png" alt="Cricket Logo" className="h-7 w-7"/>
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white">BCC Pune</h1>
                 </div>
            </div>

            {/* Right side: Profile */}
            {currentUser && (
                <button onClick={() => setCurrentView('profile')} className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="hidden sm:block text-right">
                        <p className="font-semibold text-sm text-slate-800 dark:text-white">{currentUser.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                    </div>
                    <img src={currentUser.photoUrl} alt={currentUser.fullName} className="h-10 w-10 rounded-full object-cover" />
                </button>
            )}
        </header>

        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>

      {/* Mobile Sidebar & Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity md:hidden ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />
      <div className={`fixed top-0 left-0 h-full w-64 bg-slate-800 text-white z-50 transform transition-transform duration-300 ease-in-out md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentView={currentView} 
          setView={(view) => {
            setCurrentView(view);
            setIsMobileSidebarOpen(false);
          }} 
          onLogout={() => {
            handleLogout();
            setIsMobileSidebarOpen(false);
          }}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <PlayerDetailsModal player={selectedPlayer} matches={visibleMatches} onClose={() => setSelectedPlayer(null)} />
      {playerToEdit && <PlayerEditModal player={playerToEdit} onUpdate={handleUpdatePlayer} onClose={() => setPlayerToEdit(null)} />}
      <ScorecardModal match={viewingScorecardMatch} players={players} onClose={() => setViewingScorecardMatch(null)} />
    </div>
  );
}

export default App;