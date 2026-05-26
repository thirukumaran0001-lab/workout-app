import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Plus, Minus, CheckCircle, Trash2, Heart,
  Flame, TrendingUp, Award, Clock, Calendar, BarChart2,
  ListPlus, ChevronRight, X, Sparkles, Volume2, Shield,
  Dumbbell, Moon, Zap, Apple, BookOpen, RotateCcw
} from 'lucide-react';
import HomeDashboardView from './components/HomeDashboardView';
import AnalyticsView from './components/AnalyticsView';
import HistoryView from './components/HistoryView';
import ExerciseLibraryView from './components/ExerciseLibraryView';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('home'); // home, workout, analytics, history, exercises

  // Catalog & History
  const [exercisesCatalog, setExercisesCatalog] = useState([]);
  const [workoutsHistory, setWorkoutsHistory] = useState([]);

  // Active workout state
  const [sessionName, setSessionName] = useState("PULL DAY v2");
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [exerciseSubTabs, setExerciseSubTabs] = useState({});

  // Rest Timer
  const [restTimer, setRestTimer] = useState(90);
  const [initialRestDuration, setInitialRestDuration] = useState(90);
  const [isResting, setIsResting] = useState(false);

  // Modals & Celebrations
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState(null);

  // Telemetry simulation variables
  const [simulatedHR, setSimulatedHR] = useState(78);
  const [sessionHeartRates, setSessionHeartRates] = useState([]);

  // Log simulated heart rate telemetry during active session
  useEffect(() => {
    let hrLogInterval = null;
    if (sessionActive) {
      hrLogInterval = setInterval(() => {
        setSessionHeartRates(prev => [...prev, simulatedHR]);
      }, 10000); // every 10 seconds
    } else {
      setSessionHeartRates([]);
    }
    return () => clearInterval(hrLogInterval);
  }, [sessionActive, simulatedHR]);

  // Web Audio synth chime helper
  const playRestChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.type = 'sine';
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(987.77, now); // B5 note
      osc.frequency.setValueAtTime(1318.51, now + 0.12); // E6 note
      osc.frequency.setValueAtTime(1975.53, now + 0.24); // B6 note
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {
      console.warn("Audio Context failed: ", e);
    }
  };

  // Simulated Heartbeat Loop
  useEffect(() => {
    const hrInterval = setInterval(() => {
      setSimulatedHR(prev => {
        // HR ranges depending on active session state and rest timer
        const targetMin = isResting ? 68 : (sessionActive ? 115 : 72);
        const targetMax = isResting ? 82 : (sessionActive ? 138 : 88);
        const step = Math.random() > 0.5 ? 1 : -1;
        const next = prev + step;
        if (next < targetMin) return targetMin;
        if (next > targetMax) return targetMax;
        return next;
      });
    }, 1500);
    return () => clearInterval(hrInterval);
  }, [sessionActive, isResting]);

  // Load Initial Session State from Backend or LocalStorage
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load exercises
      let exercisesLoaded = false;
      try {
        const exRes = await fetch('/api/exercises');
        if (exRes.ok) {
          const exData = await exRes.json();
          setExercisesCatalog(exData);
          localStorage.setItem('telemetry_exercises', JSON.stringify(exData));
          exercisesLoaded = true;
        }
      } catch (err) {
        console.warn("Failed to load exercises from API, using localStorage:", err);
      }
      if (!exercisesLoaded) {
        const localEx = localStorage.getItem('telemetry_exercises');
        if (localEx) {
          setExercisesCatalog(JSON.parse(localEx));
        } else {
          // Hardcoded fallback list matching standard exercises
          const defaultEx = [
            { id: 1, name: "Bench Press", muscle: "Chest" },
            { id: 2, name: "Squats", muscle: "Legs" },
            { id: 3, name: "Deadlifts", muscle: "Back" },
            { id: 4, name: "Overhead Press", muscle: "Shoulders" },
            { id: 5, name: "Barbell Curls", muscle: "Arms" }
          ];
          setExercisesCatalog(defaultEx);
          localStorage.setItem('telemetry_exercises', JSON.stringify(defaultEx));
        }
      }

      // 2. Load workouts history
      let workoutsLoaded = false;
      try {
        const histRes = await fetch('/api/workouts');
        if (histRes.ok) {
          const histData = await histRes.json();
          setWorkoutsHistory(histData);
          localStorage.setItem('telemetry_workouts', JSON.stringify(histData));
          workoutsLoaded = true;
        }
      } catch (err) {
        console.warn("Failed to load workouts from API, using localStorage:", err);
      }
      if (!workoutsLoaded) {
        const localHist = localStorage.getItem('telemetry_workouts');
        setWorkoutsHistory(localHist ? JSON.parse(localHist) : []);
      }

      // 3. Load active session
      let sessionLoaded = false;
      let sessionData = null;
      try {
        const sessionRes = await fetch('/api/session');
        if (sessionRes.ok) {
          sessionData = await sessionRes.json();
          sessionLoaded = true;
          if (sessionData) {
            localStorage.setItem('telemetry_session', JSON.stringify(sessionData));
          } else {
            localStorage.removeItem('telemetry_session');
          }
        }
      } catch (err) {
        console.warn("Failed to load session from API, using localStorage:", err);
      }
      if (!sessionLoaded) {
        const localSession = localStorage.getItem('telemetry_session');
        sessionData = localSession ? JSON.parse(localSession) : null;
      }

      if (sessionData) {
        setSessionName(sessionData.name);
        
        // Re-hydrate elapsed timer from localStorage fallback or server state
        const localElapsed = localStorage.getItem('telemetry_elapsed');
        setSessionElapsed(localElapsed ? Number(localElapsed) : (sessionData.elapsed || 0));
        
        setSessionActive(sessionData.isActive);
        setSessionExercises(sessionData.exercises || []);
        if (sessionData.isResting) {
          setIsResting(true);
          setRestTimer(sessionData.restTimer);
          setInitialRestDuration(sessionData.initialRestDuration || 90);
        }
      } else {
        // Initialize default setup
        setSessionExercises([
          {
            id: 1,
            name: "Bench Press",
            muscle: "Chest",
            sets: [
              { id: 101, type: "WarmUp", weight: 0, reps: 0, completed: false },
              { id: 102, type: "Normal", weight: 0, reps: 0, completed: false },
              { id: 103, type: "Normal", weight: 0, reps: 0, completed: false }
            ]
          }
        ]);
      }
    }
    loadInitialData();
  }, []);

  // Performance Optimization: Debounced session saves to backend (excluding elapsed timer ticks)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      syncActiveSessionToBackend();
    }, 850);

    return () => clearTimeout(delayDebounceFn);
  }, [sessionName, sessionActive, sessionExercises, isResting]);

  const syncActiveSessionToBackend = async () => {
    const payload = {
      name: sessionName,
      elapsed: sessionElapsed, // current elapsed value
      isActive: sessionActive,
      exercises: sessionExercises,
      isResting,
      restTimer,
      initialRestDuration
    };

    // Save to localStorage immediately
    localStorage.setItem('telemetry_session', JSON.stringify(payload));

    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Backend save failed:", err);
    }
  };

  // Stopwatch ticking logic (persisted locally to eliminate network requests every second)
  useEffect(() => {
    let interval = null;
    if (sessionActive) {
      interval = setInterval(() => {
        setSessionElapsed(prev => {
          const next = prev + 1;
          localStorage.setItem('telemetry_elapsed', next);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive]);

  // Rest Timer countdown
  useEffect(() => {
    let interval = null;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else if (restTimer === 0 && isResting) {
      setIsResting(false);
      playRestChime();
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  const handleRegisterExercise = async (newEx) => {
    const fallbackNewEx = {
      id: Date.now(),
      ...newEx
    };

    // Optimistically update local state and save to localStorage
    setExercisesCatalog(prev => {
      const updated = [...prev, fallbackNewEx];
      localStorage.setItem('telemetry_exercises', JSON.stringify(updated));
      return updated;
    });

    try {
      const res = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEx)
      });
      if (res.ok) {
        const data = await res.json();
        // Replace optimistic entry with backend-generated entry if different
        setExercisesCatalog(prev => {
          const updated = prev.map(e => e.id === fallbackNewEx.id ? data : e);
          localStorage.setItem('telemetry_exercises', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn("Failed to register exercise on backend, using local copy:", err);
    }
  };

  // Safe 1RM potential calculator
  const calculate1RM = (weight, reps) => {
    const parsedWeight = parseFloat(weight) || 0;
    const parsedReps = parseInt(reps) || 0;
    if (parsedReps <= 1) return parsedWeight;
    const cappedReps = Math.min(36, parsedReps); // prevent divide by zero/negatives
    return Math.round(parsedWeight / (1.0278 - (0.0278 * cappedReps)));
  };

  // Live session modifications
  const handleSetChange = (exerciseId, setId, field, value) => {
    setSessionExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
      };
    }));
  };

  const toggleSetComplete = (exerciseId, setId) => {
    setSessionExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => {
          if (s.id === setId) {
            const nextState = !s.completed;
            if (nextState) {
              // Trigger rest timer
              setRestTimer(initialRestDuration);
              setIsResting(true);
            }
            return { ...s, completed: nextState };
          }
          return s;
        })
      };
    }));
  };

  const addSetToExercise = (exerciseId) => {
    setSessionExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const weight = lastSet ? lastSet.weight : 0;
      const reps = lastSet ? lastSet.reps : 0;
      return {
        ...ex,
        sets: [...ex.sets, { id: Date.now(), type: "Normal", weight, reps, completed: false }]
      };
    }));
  };

  const removeSetFromExercise = (exerciseId, setId) => {
    setSessionExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
    }));
  };

  const addExerciseToLiveSession = (exTemplate) => {
    if (sessionExercises.some(e => e.id === exTemplate.id)) return;
    setSessionExercises(prev => [
      ...prev,
      {
        id: exTemplate.id,
        name: exTemplate.name,
        muscle: exTemplate.muscle,
        sets: [{ id: Date.now(), type: "Normal", weight: 0, reps: 0, completed: false }]
      }
    ]);
    setShowAddExModal(false);
  };

  const removeExerciseFromLiveSession = (exId) => {
    setSessionExercises(prev => prev.filter(e => e.id !== exId));
  };

  // End workout log submission
  const handleStartRoutine = (routineName, exercises) => {
    setSessionName(routineName);
    setSessionExercises(exercises);
    setSessionActive(true);
    setSessionElapsed(0);
    localStorage.removeItem('telemetry_elapsed');
    setActiveTab('workout');
    
    const payload = {
      name: routineName,
      elapsed: 0,
      isActive: true,
      exercises: exercises,
      isResting: false,
      restTimer: 90,
      initialRestDuration: 90
    };

    // Always save active session to localStorage
    localStorage.setItem('telemetry_session', JSON.stringify(payload));

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn(err));
  };

  const finishSession = async () => {
    if (sessionExercises.length === 0) return;

    // Filter to only logged completed sets
    const completedExs = sessionExercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.completed)
    })).filter(ex => ex.sets.length > 0);

    if (completedExs.length === 0) {
      alert("Error: Log at least 1 completed set before completing workout.");
      return;
    }

    const totalSets = completedExs.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalVolume = completedExs.reduce((sum, ex) => {
      return sum + ex.sets.reduce((sSum, s) => sSum + ((parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0)), 0);
    }, 0);

    // Capture simulated heart rates or generate a telemetry array
    const finalHRLogs = sessionHeartRates.length >= 5
      ? sessionHeartRates
      : Array.from({ length: 15 }, (_, i) => {
          const progress = i / 14;
          const base = 75 + Math.sin(progress * Math.PI) * 45;
          const fluctuation = Math.round((Math.random() - 0.5) * 8);
          return Math.max(65, Math.min(150, Math.round(base + fluctuation)));
        });

    const estimatedRestSec = totalSets * initialRestDuration;
    const restDuration = Math.min(sessionElapsed, estimatedRestSec);
    const activeDuration = sessionElapsed - restDuration;

    const workoutPayload = {
      id: Date.now(),
      name: sessionName,
      date: new Date().toISOString(),
      elapsed: sessionElapsed,
      exercises: completedExs,
      heartRates: finalHRLogs,
      activeDuration,
      restDuration
    };

    // Save workout to local history immediately
    setWorkoutsHistory(prev => {
      const updated = [...prev, workoutPayload];
      localStorage.setItem('telemetry_workouts', JSON.stringify(updated));
      return updated;
    });

    // Clear active session in local storage
    localStorage.removeItem('telemetry_session');
    localStorage.removeItem('telemetry_elapsed');

    // Reset React states
    setSessionActive(false);
    setSessionElapsed(0);
    setIsResting(false);
    setSessionHeartRates([]);
    setSessionExercises([
      {
        id: 1,
        name: "Bench Press",
        muscle: "Chest",
        sets: [
          { id: 101, type: "WarmUp", weight: 0, reps: 0, completed: false },
          { id: 102, type: "Normal", weight: 0, reps: 0, completed: false },
          { id: 103, type: "Normal", weight: 0, reps: 0, completed: false }
        ]
      }
    ]);

    setCompletedWorkoutSummary({
      name: sessionName,
      sets: totalSets,
      volume: totalVolume,
      duration: Math.round(sessionElapsed / 60),
      heartRates: finalHRLogs,
      activeDuration,
      restDuration,
      exercises: completedExs
    });
    setShowCelebration(true);

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutPayload)
      });
      if (res.ok) {
        const data = await res.json();
        // Replace with server-generated entry if different
        setWorkoutsHistory(prev => {
          const updated = prev.map(w => w.id === workoutPayload.id ? data : w);
          localStorage.setItem('telemetry_workouts', JSON.stringify(updated));
          return updated;
        });
      }

      // Reset active session state on server
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(null)
      });
    } catch (err) {
      console.warn("Backend finish session save failed, kept local copy:", err);
    }
  };

  const formatTimeHHMMSS = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Rest dial percentage
  const strokeDash = 251.2;
  const strokeOffset = isResting 
    ? strokeDash - (restTimer / initialRestDuration) * strokeDash 
    : strokeDash;

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 font-sans flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-68 bg-[#09090b]/40 backdrop-blur-2xl border-r border-dark-border p-6 space-y-8 flex-shrink-0 z-10">
        <div>
          <div className="flex items-center space-x-2.5 text-white">
            <div className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-widest bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                STRONGSPLIT
              </span>
              <p className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">TELEMETRY PLATFORM</p>
            </div>
          </div>
        </div>

        <nav className="flex flex-col space-y-1.5">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-full py-3 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold uppercase tracking-wider transition-premium border ${
              activeTab === 'home' 
                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-md shadow-brand-primary/5' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            <span>Dashboard Grid</span>
          </button>
          <button 
            onClick={() => setActiveTab('workout')}
            className={`w-full py-3 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold uppercase tracking-wider transition-premium border ${
              activeTab === 'workout' 
                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-md shadow-brand-primary/5' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
            }`}
          >
            <Play className="w-4 h-4 text-brand-secondary" />
            <span>Telemetry Input</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full py-3 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold uppercase tracking-wider transition-premium border ${
              activeTab === 'analytics' 
                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-md shadow-brand-primary/5' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-brand-accent" />
            <span>Analysis Matrix</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full py-3 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold uppercase tracking-wider transition-premium border ${
              activeTab === 'history' 
                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-md shadow-brand-primary/5' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>Telemetry Logs</span>
          </button>

          <button 
            onClick={() => setActiveTab('exercises')}
            className={`w-full py-3 px-4 rounded-xl flex items-center space-x-3 text-xs font-bold uppercase tracking-wider transition-premium border ${
              activeTab === 'exercises' 
                ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary shadow-md shadow-brand-primary/5' 
                : 'border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200'
            }`}
          >
            <Dumbbell className="w-4 h-4 text-amber-400" />
            <span>Library Index</span>
          </button>
        </nav>

        {/* Global Live Session Telemetry Panel */}
        {sessionActive && (
          <div className="mt-auto glass-panel rounded-2xl p-4 flex flex-col space-y-2.5 border-brand-primary/10">
            <div className="flex justify-between items-center">
              <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider animate-pulse flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>LINK ACTIVE</span>
              </span>
              <span className="font-mono font-bold text-xs text-white">{formatTimeHHMMSS(sessionElapsed)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 font-bold truncate">{sessionName}</p>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full z-10">
        
        {/* Mobile Header */}
        <header className="flex md:hidden justify-between items-center pb-4 border-b border-dark-border mb-6">
          <div className="flex items-center space-x-2 text-brand-primary">
            <Sparkles className="w-4 h-4 text-brand-primary animate-pulse" />
            <span className="font-display font-black text-xs tracking-wider bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">STRONGSPLIT</span>
          </div>
          <span className="text-[9px] text-zinc-500 font-mono">STATUS: CALIBRATED</span>
        </header>

        {/* Tabs Router */}
        {activeTab === 'home' && (
          <HomeDashboardView 
            workouts={workoutsHistory} 
            onStartRoutine={handleStartRoutine} 
            setActiveTab={setActiveTab} 
          />
        )}

        {activeTab === 'workout' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Exercises Log Panel */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Dynamic Header */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col space-y-4 hover-card-glow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Active Core Session</span>
                    <input 
                      type="text" 
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      className="bg-transparent text-xl sm:text-2xl font-black text-white focus:outline-none border-b border-transparent focus:border-zinc-800 w-full"
                    />
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="bg-zinc-950/40 border border-dark-border px-4 py-2.5 rounded-2xl text-center">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block tracking-wider">ELAPSED TIME</span>
                      <span className="font-mono font-black text-sm text-white tracking-wider">{formatTimeHHMMSS(sessionElapsed)}</span>
                    </div>
                    
                    <button 
                      onClick={() => setSessionActive(prev => !prev)}
                      className={`py-2.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-premium cursor-pointer ${
                        sessionActive 
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-200' 
                          : 'bg-gradient-to-r from-brand-primary to-violet-600 text-white font-extrabold shadow-lg shadow-brand-primary/20 active:scale-95'
                      }`}
                    >
                      {sessionActive ? (
                        <>
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>Freeze</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Synchronize</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {(() => {
                  const totalSetsInActiveSession = sessionExercises.reduce((sum, ex) => sum + ex.sets.length, 0);
                  const completedSetsInActiveSession = sessionExercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
                  const pctDone = totalSetsInActiveSession > 0 ? Math.round((completedSetsInActiveSession / totalSetsInActiveSession) * 100) : 0;
                  return (
                    <div className="border-t border-dark-border pt-3">
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                        <div 
                          className="bg-gradient-to-r from-brand-primary via-brand-accent to-emerald-500 h-full transition-premium duration-500 ease-out"
                          style={{ width: `${pctDone}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono mt-1.5 px-1 uppercase tracking-wider">
                        <span>Telemetry Log Progress</span>
                        <span>{pctDone}% done ({completedSetsInActiveSession}/{totalSetsInActiveSession} sets)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Workout Exercises */}
              {sessionExercises.map((exercise) => {
                const activeSubTab = exerciseSubTabs[exercise.id] || 'sets';
                
                // Helper to change sub tab
                const setSubTab = (tab) => {
                  setExerciseSubTabs(prev => ({ ...prev, [exercise.id]: tab }));
                };

                // Calculate historical 1RM for this exercise
                let maxHistorical1RM = 0;
                const historicalDataPoints = [];
                
                // Read workouts in chronological order to plot history
                const sortedHistory = [...workoutsHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
                sortedHistory.forEach(w => {
                  const matchEx = w.exercises.find(e => e.id === exercise.id);
                  if (matchEx) {
                    const completedSets = matchEx.sets.filter(s => s.completed && s.weight > 0 && s.reps > 0);
                    if (completedSets.length > 0) {
                      const peak1RM = Math.max(...completedSets.map(s => calculate1RM(s.weight, s.reps)));
                      if (peak1RM > maxHistorical1RM) maxHistorical1RM = peak1RM;
                      
                      historicalDataPoints.push({
                         date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        val: peak1RM
                      });
                    }
                  }
                });

                // Fallback 1RM calculation if no history
                if (maxHistorical1RM === 0) {
                  exercise.sets.forEach(s => {
                    const val = calculate1RM(s.weight, s.reps);
                    if (val > maxHistorical1RM) maxHistorical1RM = val;
                  });
                }
                if (maxHistorical1RM === 0) maxHistorical1RM = 100; // default benchmark

                // Define Guide text dynamically
                let guideText = "Perform this exercise with proper control. Keep your core tight, maintain standard form, and focus on the mind-muscle connection. Exhale on the exertion phase.";
                if (exercise.name.toLowerCase().includes("bench press")) {
                  guideText = "Retract your shoulder blades and keep them pinned to the bench. Keep your feet flat on the floor. Lower the barbell to your mid-chest (nipple line) under control, touch lightly, then drive the weight up. Avoid flaring elbows out past 75 degrees.";
                } else if (exercise.name.toLowerCase().includes("squat")) {
                  guideText = "Place the bar on your upper traps. Stand with feet slightly wider than shoulder-width. Break at the hips and lower down as if sitting in a chair. Go deep until your thighs are parallel to the floor or lower. Keep your chest up and drive up through your heels.";
                } else if (exercise.name.toLowerCase().includes("deadlift")) {
                  guideText = "Stand with feet hip-width apart, shins 1 inch from the bar. Grip the bar outside your shins. Flatten your back completely and drop your hips slightly. Pull the slack out of the bar, drag it up your shins, and extend your hips to stand up straight.";
                } else if (exercise.name.toLowerCase().includes("pull-up")) {
                  guideText = "Grip the bar slightly wider than shoulder-width, palms facing away. Start from a dead hang. Pull yourself up by driving your elbows down toward your ribs until your chin clears the bar. Lower yourself slowly to the starting position.";
                } else if (exercise.name.toLowerCase().includes("overhead press")) {
                  guideText = "Rest the bar on your front shoulders, grip slightly wider than shoulder width. Squeeze your glutes and core to stabilize your spine. Press the bar straight up overhead, moving your face back slightly to clear the bar, then lock out.";
                } else if (exercise.name.toLowerCase().includes("curl")) {
                  guideText = "Stand tall, keep elbows pinned close to your torso. Flex at the elbows to curl the weights up toward shoulders. Avoid using momentum or swinging your back. Lower the weight slowly, extending elbows fully.";
                } else if (exercise.name.toLowerCase().includes("lateral raise")) {
                  guideText = "Grip dumbbells at your sides. Lean forward very slightly. Raise arms out to the sides, leading with the elbows. Raise until arms are parallel to the floor, then lower under control. Keep a slight bend in elbows.";
                } else if (exercise.name.toLowerCase().includes("pushdown")) {
                  guideText = "Face the cable stack. Pull elbows to your sides and lock them there. Push the bar/rope down until elbows are fully extended, squeezing triceps at the bottom. Return with control, keeping elbows stationary.";
                }

                return (
                  <div key={exercise.id} className="glass-panel rounded-3xl p-5 flex flex-col space-y-4 hover-card-glow relative overflow-hidden">
                    
                    {/* Subtle decorative background gradient node */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Exercise Header */}
                    <div className="flex justify-between items-start border-b border-dark-border pb-3">
                      <div>
                        <h3 className="text-md font-bold text-zinc-200 font-sans tracking-wide">{exercise.name}</h3>
                        <span className="inline-block text-[9px] font-bold tracking-wider text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 px-2 py-0.5 rounded mt-1.5 uppercase font-mono">
                          {exercise.muscle}
                        </span>
                      </div>

                      <button 
                        onClick={() => removeExerciseFromLiveSession(exercise.id)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-950/20 rounded-xl cursor-pointer"
                        title="Eject Exercise"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Exercise Sub-Tabs */}
                    <div className="flex space-x-1 border-b border-dark-border pb-2 text-[10px] font-bold uppercase tracking-wider">
                      {['sets', 'insights', 'guide', 'history'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setSubTab(tab)}
                          className={`py-1.5 px-3 rounded-lg transition-premium cursor-pointer ${
                            activeSubTab === tab 
                              ? 'bg-zinc-900 border border-zinc-800 text-brand-primary' 
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Sub-Tab Contents */}
                    {activeSubTab === 'sets' && (
                      <div className="space-y-4">
                        {/* Sets Table */}
                        <div className="space-y-2">
                          <div className="hidden sm:grid grid-cols-12 gap-2 text-[9px] font-bold text-zinc-500 tracking-wider uppercase px-2">
                            <div className="col-span-1 text-center">Set</div>
                            <div className="col-span-3 text-center">Type</div>
                            <div className="col-span-3 text-center">Weight (kg)</div>
                            <div className="col-span-3 text-center">Reps</div>
                            <div className="col-span-1 text-center">Done</div>
                            <div className="col-span-1"></div>
                          </div>

                          {exercise.sets.map((set, index) => (
                            <div 
                              key={set.id} 
                              className={`grid grid-cols-12 gap-y-3 gap-x-2 items-center p-3 sm:p-1 rounded-2xl border border-zinc-900/60 sm:border-transparent transition-premium ${
                                set.completed ? 'bg-emerald-500/5 border-emerald-500/10' : ''
                              }`}
                            >
                              {/* Set Index */}
                              <div className="col-span-2 sm:col-span-1 text-left sm:text-center px-1">
                                <span className="text-[10px] font-bold font-mono text-zinc-400">
                                  Set {index + 1}
                                </span>
                              </div>

                              {/* Set Type Segmented Control */}
                              <div className="col-span-10 sm:col-span-3 flex justify-start sm:justify-center space-x-1">
                                {['W', 'N', 'D', 'F'].map((tLetter) => {
                                  const tMap = { 'W': 'WarmUp', 'N': 'Normal', 'D': 'DropSet', 'F': 'Failure' };
                                  const tName = tMap[tLetter];
                                  const isSelected = (set.type || 'Normal') === tName;
                                  let btnColors = 'bg-zinc-950/20 border-zinc-900 text-zinc-500 hover:text-zinc-300';
                                  if (isSelected) {
                                    if (tLetter === 'W') btnColors = 'bg-amber-500/15 border-amber-500/30 text-amber-400 font-extrabold';
                                    if (tLetter === 'N') btnColors = 'bg-brand-primary/15 border-brand-primary/30 text-brand-primary font-extrabold';
                                    if (tLetter === 'D') btnColors = 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent font-extrabold';
                                    if (tLetter === 'F') btnColors = 'bg-rose-500/15 border-rose-500/30 text-rose-400 font-extrabold';
                                  }
                                  return (
                                    <button
                                      key={tLetter}
                                      type="button"
                                      disabled={set.completed}
                                      onClick={() => handleSetChange(exercise.id, set.id, 'type', tName)}
                                      className={`w-6 h-6 rounded-lg border text-[9px] font-bold flex items-center justify-center transition-premium cursor-pointer ${btnColors}`}
                                      title={tName}
                                    >
                                      {tLetter}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Weight Input with +/- Buttons */}
                              <div className="col-span-5 sm:col-span-3 flex items-center justify-start sm:justify-center space-x-1">
                                <button
                                  type="button"
                                  disabled={set.completed}
                                  onClick={() => handleSetChange(exercise.id, set.id, 'weight', Math.max(0, (set.weight || 0) - 2.5))}
                                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input 
                                  type="number"
                                  value={set.weight || ''}
                                  onChange={(e) => handleSetChange(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                  disabled={set.completed}
                                  className="w-12 bg-zinc-950 border border-zinc-900 rounded-lg py-1 font-mono text-xs text-white text-center focus:outline-none focus:border-brand-primary disabled:opacity-60"
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  disabled={set.completed}
                                  onClick={() => handleSetChange(exercise.id, set.id, 'weight', (set.weight || 0) + 2.5)}
                                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Reps Input with +/- Buttons */}
                              <div className="col-span-4 sm:col-span-3 flex items-center justify-start sm:justify-center space-x-1">
                                <button
                                  type="button"
                                  disabled={set.completed}
                                  onClick={() => handleSetChange(exercise.id, set.id, 'reps', Math.max(0, (set.reps || 0) - 1))}
                                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input 
                                  type="number"
                                  value={set.reps || ''}
                                  onChange={(e) => handleSetChange(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                  disabled={set.completed}
                                  className="w-10 bg-zinc-950 border border-zinc-900 rounded-lg py-1 font-mono text-xs text-white text-center focus:outline-none focus:border-brand-primary disabled:opacity-60"
                                  placeholder="0"
                                />
                                <button
                                  type="button"
                                  disabled={set.completed}
                                  onClick={() => handleSetChange(exercise.id, set.id, 'reps', (set.reps || 0) + 1)}
                                  className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Complete Button */}
                              <div className="col-span-2 sm:col-span-1 flex justify-end sm:justify-center">
                                <button 
                                  onClick={() => toggleSetComplete(exercise.id, set.id)}
                                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-premium active:scale-75 cursor-pointer ${
                                    set.completed 
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                      : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:text-zinc-400'
                                  }`}
                                >
                                  <CheckCircle className="w-3.5 h-3.5 fill-current" />
                                </button>
                              </div>

                              {/* Set Delete */}
                              <div className="col-span-1 flex justify-end sm:justify-center">
                                <button 
                                  onClick={() => removeSetFromExercise(exercise.id, set.id)}
                                  className="text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Set */}
                        <button 
                          onClick={() => addSetToExercise(exercise.id)}
                          className="w-full py-2.5 border border-dashed border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-premium bg-zinc-900/10 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Exercise Set</span>
                        </button>
                      </div>
                    )}

                    {activeSubTab === 'insights' && (
                      <div className="space-y-4">
                        <div className="bg-[#121214]/60 border border-dark-border rounded-2xl p-4 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Est. 1-Rep Max</span>
                            <span className="text-xl font-display font-black text-brand-secondary mt-1 block">{maxHistorical1RM} kg</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase block">Peak Session Vol</span>
                            <span className="text-sm font-mono font-bold text-white mt-1 block">
                              {Math.round(exercise.sets.reduce((sum, s) => sum + (s.completed ? s.weight * s.reps : 0), 0))} kg
                            </span>
                          </div>
                        </div>

                        {/* %1RM Progressive Overload Table */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Progressive Overload Target Table</h4>
                          <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                            {[100, 90, 85, 80, 75].map((pct) => (
                              <div key={pct} className="bg-zinc-950/40 border border-dark-border p-2 rounded-xl">
                                <span className="text-[9px] text-zinc-500 font-bold block">{pct}% 1RM</span>
                                <span className="text-xs font-bold text-zinc-200 mt-1 block">{Math.round(maxHistorical1RM * (pct / 100))} kg</span>
                                <span className="text-[8px] text-zinc-600 block mt-0.5">
                                  {pct === 100 ? '1 rep' : pct === 90 ? '4-5 reps' : pct === 85 ? '6-7 reps' : pct === 80 ? '8-10 reps' : '10-12 reps'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mini SVG progression chart */}
                        {historicalDataPoints.length > 1 && (
                          <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Historical Max progression</h4>
                            <div className="bg-[#121214]/60 border border-dark-border p-3 rounded-2xl">
                              <svg viewBox="0 0 400 100" className="w-full h-auto overflow-visible">
                                <path
                                  d={historicalDataPoints.map((pt, i) => {
                                    const x = 30 + (i * 340) / (historicalDataPoints.length - 1);
                                    const y = 80 - ((pt.val - 40) / 160) * 60; // scaled
                                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                  }).join(' ')}
                                  fill="none"
                                  stroke="#818cf8"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                                {historicalDataPoints.map((pt, i) => {
                                  const x = 30 + (i * 340) / (historicalDataPoints.length - 1);
                                  const y = 80 - ((pt.val - 40) / 160) * 60;
                                  return (
                                    <g key={i}>
                                      <circle cx={x} cy={y} r="3.5" fill="#030303" stroke="#818cf8" strokeWidth="2" />
                                      <text x={x} y={y - 8} textAnchor="middle" fill="#06b6d4" fontSize="7" fontWeight="bold" className="font-mono">{pt.val}kg</text>
                                      <text x={x} y="95" textAnchor="middle" fill="#71717a" fontSize="6" fontWeight="bold">{pt.date}</text>
                                    </g>
                                  );
                                })}
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeSubTab === 'guide' && (
                      <div className="p-4 bg-[#121214]/80 border border-dark-border rounded-2xl flex items-start space-x-3">
                        <BookOpen className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] text-brand-secondary uppercase font-bold block tracking-wider">EXECUTION INSTRUCTION</span>
                          <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{guideText}</p>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'history' && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Past Logs (Last 4 sessions)</h4>
                        
                        {(() => {
                          const specificHistory = workoutsHistory
                            .filter(w => w.exercises.some(e => e.id === exercise.id))
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .slice(0, 4);

                          if (specificHistory.length === 0) {
                            return (
                              <div className="py-6 border border-dashed border-zinc-800 rounded-2xl text-center text-xs text-zinc-600 bg-zinc-900/10">
                                No past logs found in database. Complete this workout to log telemetry.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1.5">
                              {specificHistory.map((hWorkout) => {
                                const hEx = hWorkout.exercises.find(e => e.id === exercise.id);
                                return (
                                  <div key={hWorkout.id} className="bg-zinc-950/40 border border-dark-border p-3 rounded-2xl flex justify-between items-center font-mono">
                                    <div>
                                      <span className="text-[9px] text-brand-secondary font-bold block uppercase">
                                        {new Date(hWorkout.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                      <span className="text-[10px] text-zinc-400 block mt-0.5">{hWorkout.name}</span>
                                    </div>
                                    <div className="flex space-x-2">
                                      {hEx.sets.map((s, sIdx) => (
                                        <span key={sIdx} className="text-[9px] bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">
                                          {s.weight}kg x{s.reps}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowAddExModal(true)}
                  className="flex-1 py-4 border border-dashed border-brand-primary/20 hover:border-brand-primary/40 rounded-3xl flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-indigo-300 transition-colors bg-indigo-950/5 cursor-pointer"
                >
                  <ListPlus className="w-4.5 h-4.5" />
                  <span>Append Exercise to session</span>
                </button>

                <button 
                  onClick={finishSession}
                  className="py-4 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-zinc-950 font-black text-xs uppercase tracking-wider rounded-3xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-premium flex items-center space-x-2 cursor-pointer"
                >
                  <Award className="w-4.5 h-4.5" />
                  <span>LOG SESSION DATA</span>
                </button>
              </div>

            </div>

            {/* Rest & Telemetry Sidebar Panel */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Dynamic Rest Countdown */}
              <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-6 hover-card-glow">
                <div>
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Rest Timer Interface</h3>
                  <p className="text-[9px] text-zinc-600 mt-0.5">ATP fiber reloading cycle</p>
                </div>

                {/* SVG Countdown */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="6" fill="transparent" />
                    <circle 
                      cx="72" cy="72" r="40" 
                      stroke={isResting ? '#f59e0b' : 'rgba(255,255,255,0.1)'} 
                      strokeWidth="6" fill="transparent" 
                      strokeDasharray={strokeDash} 
                      strokeDashoffset={strokeOffset} 
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                      style={{ filter: isResting ? 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.5))' : 'none' }}
                    />
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3.5xl font-display font-black text-white tracking-tighter">
                      {isResting ? restTimer : initialRestDuration}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider">SECONDS</span>
                  </div>
                </div>

                {/* Presets and sound test */}
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-4 gap-1.5">
                    {[30, 60, 90, 120].map(sec => (
                      <button
                        key={sec}
                        onClick={() => {
                          setInitialRestDuration(sec);
                          setRestTimer(sec);
                          setIsResting(true);
                        }}
                        className={`py-1.5 px-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                          initialRestDuration === sec && isResting
                            ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        if (isResting) {
                          setIsResting(false);
                        } else {
                          setRestTimer(initialRestDuration);
                          setIsResting(true);
                        }
                      }}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-[10px] uppercase font-bold tracking-wider cursor-pointer transition-premium ${
                        isResting 
                          ? 'bg-amber-950/40 border border-amber-500/40 text-amber-400' 
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {isResting ? "Suspend Rest" : "Start Interval"}
                    </button>

                    <button 
                      onClick={playRestChime}
                      className="p-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-xl cursor-pointer"
                      title="Test Audio Chime"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cyberpunk Live Stats Telemetry Card */}
              <div className="glass-panel rounded-3xl p-5 flex flex-col space-y-4 hover-card-glow">
                <div className="flex justify-between items-center border-b border-dark-border pb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">BIOMETRIC Telemetry</span>
                  <span className="text-[9px] text-brand-primary font-mono">SYS-LINK: ONLINE</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Heart className={`w-5 h-5 text-rose-500 ${sessionActive ? 'animate-[pulse_0.8s_infinite]' : 'animate-pulse'}`} />
                    <span className="text-xs font-bold text-zinc-300">Simulated Heart Rate</span>
                  </div>
                  <span className="font-display font-bold text-sm text-rose-400">{simulatedHR} bpm</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-zinc-300">Est. Intensity Rate</span>
                  </div>
                  <span className="font-display font-bold text-sm text-amber-500">
                    {sessionExercises.length > 0
                      ? Math.round(sessionExercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0) * 1.5 + 50)
                      : 0} kcal
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-brand-secondary" />
                    <span className="text-xs font-bold text-zinc-300">Target Muscle Load</span>
                  </div>
                  <span className="font-display font-bold text-sm text-brand-secondary">
                    {Array.from(new Set(sessionExercises.map(e => e.muscle))).length} areas
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView workouts={workoutsHistory} exercises={exercisesCatalog} />
        )}

        {activeTab === 'history' && (
          <HistoryView workouts={workoutsHistory} />
        )}

        {activeTab === 'exercises' && (
          <ExerciseLibraryView exercises={exercisesCatalog} onAddExercise={handleRegisterExercise} />
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#09090b]/95 backdrop-blur-xl border-t border-dark-border flex justify-around items-center px-4 z-50">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center space-y-0.5 transition-colors cursor-pointer ${activeTab === 'home' ? 'text-brand-primary' : 'text-zinc-500'}`}
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('workout')}
          className={`flex flex-col items-center space-y-0.5 transition-colors cursor-pointer ${activeTab === 'workout' ? 'text-brand-primary' : 'text-zinc-500'}`}
        >
          <Play className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Workout</span>
        </button>

        <button 
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center space-y-0.5 transition-colors cursor-pointer ${activeTab === 'analytics' ? 'text-brand-primary' : 'text-zinc-500'}`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Analytics</span>
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center space-y-0.5 transition-colors cursor-pointer ${activeTab === 'history' ? 'text-brand-primary' : 'text-zinc-500'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">History</span>
        </button>

        <button 
          onClick={() => setActiveTab('exercises')}
          className={`flex flex-col items-center space-y-0.5 transition-colors cursor-pointer ${activeTab === 'exercises' ? 'text-brand-primary' : 'text-zinc-500'}`}
        >
          <Dumbbell className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase tracking-wider">Library</span>
        </button>
      </nav>

      {/* Modal: Append Exercise */}
      {showAddExModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-panel-glow rounded-3xl w-full max-w-md p-6 relative flex flex-col space-y-4">
            <button 
              onClick={() => setShowAddExModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-md font-bold text-zinc-100 font-sans">Add Exercise Telemetry Node</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Select exercise to initialize in active stack</p>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {exercisesCatalog.map(ex => {
                const isAdded = sessionExercises.some(e => e.id === ex.id);
                return (
                  <button
                    key={ex.id}
                    onClick={() => addExerciseToLiveSession(ex)}
                    disabled={isAdded}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between transition-colors border text-left cursor-pointer ${
                      isAdded 
                        ? 'bg-zinc-950/40 border-[#1f1f23] text-zinc-600 cursor-not-allowed' 
                        : 'bg-[#121214]/60 border-dark-border hover:border-zinc-700 text-zinc-200'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{ex.name}</span>
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{ex.muscle}</span>
                    </div>
                    {!isAdded && <ChevronRight className="w-4 h-4 text-zinc-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Celebration */}
      {showCelebration && completedWorkoutSummary && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          
          <div className="glass-panel-glow rounded-3xl w-full max-w-xl p-6 flex flex-col space-y-5 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <div>
                <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-widest block uppercase">LINK SYNC SUCCESSFUL</span>
                <h2 className="text-lg font-display font-black text-white tracking-wide">WORKOUT TELEMETRY LOG</h2>
              </div>
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Award className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3 bg-zinc-950/40 border border-dark-border p-3.5 rounded-2xl font-mono text-center">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-semibold block">DURATION</span>
                <span className="text-sm font-bold text-white mt-1 block">{completedWorkoutSummary.duration}m</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-semibold block">VOLUME</span>
                <span className="text-sm font-bold text-white mt-1 block">{completedWorkoutSummary.volume.toLocaleString()} kg</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-semibold block">TOTAL SETS</span>
                <span className="text-sm font-bold text-white mt-1 block">{completedWorkoutSummary.sets}</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-500 uppercase font-semibold block">EXERCISES</span>
                <span className="text-sm font-bold text-white mt-1 block">{completedWorkoutSummary.exercises.length}</span>
              </div>
            </div>

            {/* Active vs Rest Split Bar */}
            {(() => {
              const totalSec = completedWorkoutSummary.activeDuration + completedWorkoutSummary.restDuration || 1;
              const activePct = Math.round((completedWorkoutSummary.activeDuration / totalSec) * 100);
              const restPct = 100 - activePct;
              const activeMin = Math.round(completedWorkoutSummary.activeDuration / 60);
              const restMin = Math.round(completedWorkoutSummary.restDuration / 60);

              return (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold text-zinc-400 font-mono">
                    <span className="text-emerald-400">ACTIVE: {activeMin}m ({activePct}%)</span>
                    <span className="text-amber-400">REST: {restMin}m ({restPct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex border border-dark-border">
                    <div className="bg-emerald-500 h-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" style={{ width: `${activePct}%` }} />
                    <div className="bg-amber-500 h-full shadow-[0_0_8px_rgba(245,158,11,0.4)]" style={{ width: `${restPct}%` }} />
                  </div>
                </div>
              );
            })()}

            {/* Muscle Load sets Breakdown */}
            {(() => {
              const setsPerMuscle = {};
              completedWorkoutSummary.exercises.forEach(ex => {
                setsPerMuscle[ex.muscle] = (setsPerMuscle[ex.muscle] || 0) + ex.sets.length;
              });
              const maxSets = Math.max(...Object.values(setsPerMuscle), 1);

              return (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Muscle Distribution</h3>
                  <div className="space-y-1.5 bg-[#121214]/60 border border-dark-border p-3 rounded-2xl">
                    {Object.entries(setsPerMuscle).map(([muscle, count]) => {
                      const pct = Math.round((count / maxSets) * 100);
                      return (
                        <div key={muscle} className="space-y-1">
                          <div className="flex justify-between text-[9px] text-zinc-300 font-mono">
                            <span>{muscle}</span>
                            <span>{count} sets</span>
                          </div>
                          <div className="w-full bg-[#1c1c1f] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Biometrics & Heart Rate Zone & Chart Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* SVG Heart Rate Graph */}
              {completedWorkoutSummary.heartRates && completedWorkoutSummary.heartRates.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">HR Telemetry Log</h3>
                  <div className="bg-[#121214]/60 border border-dark-border p-3.5 rounded-2xl flex flex-col justify-center h-[120px]">
                    <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Line */}
                      <line x1="0" y1="40" x2="200" y2="40" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="2 2" />
                      
                      {/* Path */}
                      <path
                        d={(() => {
                          const points = completedWorkoutSummary.heartRates;
                          return points.map((val, idx) => {
                            const x = (idx * 200) / (points.length - 1 || 1);
                            const y = 70 - ((val - 60) / 90) * 60; // scale 60 - 150 bpm
                            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ');
                        })()}
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Area Fill */}
                      <path
                        d={(() => {
                          const points = completedWorkoutSummary.heartRates;
                          const pathStr = points.map((val, idx) => {
                            const x = (idx * 200) / (points.length - 1 || 1);
                            const y = 70 - ((val - 60) / 90) * 60;
                            return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ');
                          return `${pathStr} L 200 75 L 0 75 Z`;
                        })()}
                        fill="url(#hrGrad)"
                      />
                      
                      {/* Labels */}
                      <text x="5" y="10" fill="#f43f5e" fontSize="6" fontWeight="bold" className="font-mono">
                        Max: {Math.max(...completedWorkoutSummary.heartRates)} bpm
                      </text>
                      <text x="5" y="76" fill="#71717a" fontSize="6" fontWeight="bold" className="font-mono">
                        Min: {Math.min(...completedWorkoutSummary.heartRates)} bpm
                      </text>
                    </svg>
                  </div>
                </div>
              )}

              {/* Heart Rate Zones Distribution */}
              {completedWorkoutSummary.heartRates && (
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">HR Training Zones</h3>
                  <div className="bg-[#121214]/60 border border-dark-border p-3 rounded-2xl flex flex-col justify-between h-[120px] text-[8px] font-mono">
                    {(() => {
                      const zones = [
                        { name: "Peak (Anaerobic)", min: 135, max: 200, color: "bg-rose-500" },
                        { name: "Cardio (Aerobic)", min: 115, max: 135, color: "bg-orange-500" },
                        { name: "Fat Burn", min: 90, max: 115, color: "bg-amber-500" },
                        { name: "Warm-up / Rest", min: 0, max: 90, color: "bg-emerald-500" }
                      ];

                      const totalLogs = completedWorkoutSummary.heartRates.length || 1;
                      const zoneCounts = zones.map(z => {
                        const count = completedWorkoutSummary.heartRates.filter(hr => hr >= z.min && hr < z.max).length;
                        return { ...z, pct: Math.round((count / totalLogs) * 100) };
                      });

                      return zoneCounts.map((z, idx) => (
                        <div key={idx} className="flex items-center justify-between space-x-2">
                          <span className="text-zinc-400 font-semibold w-24 truncate">{z.name}</span>
                          <div className="flex-1 bg-[#1a1a1d] h-2 rounded-full overflow-hidden flex">
                            <div className={`${z.color} h-full`} style={{ width: `${z.pct}%` }} />
                          </div>
                          <span className="text-zinc-300 font-bold w-6 text-right">{z.pct}%</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

            </div>

            {/* Close button */}
            <button 
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-brand-primary/10 active:scale-95 transition-premium"
            >
              CLOSE WORKOUT TELEMETRY MATRIX
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

