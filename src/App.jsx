import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Plus, Minus, CheckCircle, Trash2,
  Flame, TrendingUp, Award, Clock, Calendar, BarChart2,
  ListPlus, ChevronRight, X, Sparkles, Volume2, Shield,
  Dumbbell, Moon, Zap, Apple, BookOpen, RotateCcw
} from 'lucide-react';
import HomeDashboardView from './components/HomeDashboardView';
import AnalyticsView from './components/AnalyticsView';
import HistoryView from './components/HistoryView';
import ExerciseLibraryView from './components/ExerciseLibraryView';

export default function App() {

  // Navigation and active UI tabs
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'history', 'analytics', 'exercises', 'active-session'

  // Catalog & History
  const [exercisesCatalog, setExercisesCatalog] = useState([]);
  const [workoutsHistory, setWorkoutsHistory] = useState([]);

  // Active workout state
  const [sessionName, setSessionName] = useState("PULL DAY v2");
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [exerciseSubTabs, setExerciseSubTabs] = useState({});
  const [collapsedExercises, setCollapsedExercises] = useState({});

  // Rest Timer
  const [restTimer, setRestTimer] = useState(90);
  const [initialRestDuration, setInitialRestDuration] = useState(90);
  const [isResting, setIsResting] = useState(false);

  // Modals & Celebrations
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedWorkoutSummary, setCompletedWorkoutSummary] = useState(null);

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

  // Load Initial Session State from Backend or LocalStorage
  useEffect(() => {
    async function loadInitialData() {
      // 1. Load exercises
      let exercisesLoaded = false;
      try {
        const exRes = await fetch('/api/exercises');
        if (exRes.ok) {
          const exData = await exRes.json();
          const localExRaw = localStorage.getItem('telemetry_exercises');
          const localEx = localExRaw ? JSON.parse(localExRaw) : [];
          const merged = [...exData];
          let syncedAny = false;
          for (const le of localEx) {
            if (!merged.some(me => me.id === le.id)) {
              merged.push(le);
              syncedAny = true;
              try {
                await fetch('/api/exercises', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(le)
                });
              } catch (e) {
                console.warn("Failed to sync local exercise to API:", e);
              }
            }
          }
          setExercisesCatalog(merged);
          localStorage.setItem('telemetry_exercises', JSON.stringify(merged));
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
          const localHistRaw = localStorage.getItem('telemetry_workouts');
          const localHist = localHistRaw ? JSON.parse(localHistRaw) : [];
          const merged = [...histData];
          for (const lw of localHist) {
            if (!merged.some(mw => mw.id === lw.id)) {
              merged.push(lw);
              try {
                await fetch('/api/workouts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(lw)
                });
              } catch (e) {
                console.warn("Failed to sync local workout to API:", e);
              }
            }
          }
          merged.sort((a, b) => a.id - b.id);
          setWorkoutsHistory(merged);
          localStorage.setItem('telemetry_workouts', JSON.stringify(merged));
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
          const localSessionRaw = localStorage.getItem('telemetry_session');
          const localSession = localSessionRaw ? JSON.parse(localSessionRaw) : null;
          if (!sessionData && localSession && localSession.isActive) {
            sessionData = localSession;
            try {
              await fetch('/api/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
              });
            } catch (e) {
              console.warn("Failed to sync local session to API:", e);
            }
          } else if (sessionData) {
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
        const localElapsed = localStorage.getItem('telemetry_elapsed');
        setSessionElapsed(localElapsed ? Number(localElapsed) : (sessionData.elapsed || 0));
        setSessionActive(sessionData.isActive);
        setSessionExercises(sessionData.exercises || []);
        if (sessionData.isActive) {
          setCurrentTab('active-session');
        }
        if (sessionData.isResting) {
          setIsResting(true);
          setRestTimer(sessionData.restTimer);
          setInitialRestDuration(sessionData.initialRestDuration || 90);
        }
      } else {
        setSessionExercises([
          {
            id: 1,
            name: "Bench Press",
            muscle: "Chest",
            sets: [
              { id: 101, weight: 0, reps: 0, completed: false },
              { id: 102, weight: 0, reps: 0, completed: false },
              { id: 103, weight: 0, reps: 0, completed: false }
            ]
          }
        ]);
      }
    }
    loadInitialData();
  }, []);

  // Debounced session saves to backend
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
      elapsed: sessionElapsed,
      isActive: sessionActive,
      exercises: sessionExercises,
      isResting,
      restTimer,
      initialRestDuration
    };

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

  // Stopwatch ticking logic
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

  const calculate1RM = (weight, reps) => {
    const parsedWeight = parseFloat(weight) || 0;
    const parsedReps = parseInt(reps) || 0;
    if (parsedReps <= 1) return parsedWeight;
    const cappedReps = Math.min(36, parsedReps);
    return Math.round(parsedWeight / (1.0278 - (0.0278 * cappedReps)));
  };

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

  const handleInputKeyDown = (e, exerciseId, setId, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'weight') {
        const repsInput = document.getElementById(`reps-${exerciseId}-${setId}`);
        if (repsInput) repsInput.focus();
      } else if (field === 'reps') {
        toggleSetComplete(exerciseId, setId);
        e.target.blur();
      }
    }
  };

  const toggleExerciseCollapse = (exId) => {
    setCollapsedExercises(prev => ({ ...prev, [exId]: !prev[exId] }));
  };

  const addSetToExercise = (exerciseId) => {
    setSessionExercises(prev => prev.map(ex => {
      if (ex.id !== exerciseId) return ex;
      const lastSet = ex.sets[ex.sets.length - 1];
      const weight = lastSet ? lastSet.weight : 0;
      const reps = lastSet ? lastSet.reps : 0;
      return {
        ...ex,
        sets: [...ex.sets, { id: Date.now(), weight, reps, completed: false }]
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
        sets: [{ id: Date.now(), weight: 0, reps: 0, completed: false }]
      }
    ]);
    setShowAddExModal(false);
  };

  const removeExerciseFromLiveSession = (exId) => {
    setSessionExercises(prev => prev.filter(e => e.id !== exId));
  };

  const handleStartRoutine = (routineName, exercises) => {
    setSessionName(routineName);
    setSessionExercises(exercises);
    setSessionActive(true);
    setCurrentTab('active-session');
    setSessionElapsed(0);
    localStorage.removeItem('telemetry_elapsed');
    
    const payload = {
      name: routineName,
      elapsed: 0,
      isActive: true,
      exercises: exercises,
      isResting: false,
      restTimer: 90,
      initialRestDuration: 90
    };

    localStorage.setItem('telemetry_session', JSON.stringify(payload));

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.warn(err));
  };

  const finishSession = async () => {
    if (sessionExercises.length === 0) return;

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

    const estimatedRestSec = totalSets * initialRestDuration;
    const restDuration = Math.min(sessionElapsed, estimatedRestSec);
    const activeDuration = sessionElapsed - restDuration;

    const workoutPayload = {
      id: Date.now(),
      name: sessionName,
      date: new Date().toISOString(),
      elapsed: sessionElapsed,
      exercises: completedExs,
      heartRates: [],
      activeDuration,
      restDuration
    };

    setWorkoutsHistory(prev => {
      const updated = [...prev, workoutPayload];
      localStorage.setItem('telemetry_workouts', JSON.stringify(updated));
      return updated;
    });

    localStorage.removeItem('telemetry_session');
    localStorage.removeItem('telemetry_elapsed');

    setSessionActive(false);
    setCurrentTab('dashboard');
    setSessionElapsed(0);
    setIsResting(false);
    setSessionExercises([
      {
        id: 1,
        name: "Bench Press",
        muscle: "Chest",
        sets: [
          { id: 101, weight: 0, reps: 0, completed: false },
          { id: 102, weight: 0, reps: 0, completed: false },
          { id: 103, weight: 0, reps: 0, completed: false }
        ]
      }
    ]);

    setCompletedWorkoutSummary({
      name: sessionName,
      sets: totalSets,
      volume: totalVolume,
      duration: Math.round(sessionElapsed / 60),
      heartRates: [],
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
        setWorkoutsHistory(prev => {
          const updated = prev.map(w => w.id === workoutPayload.id ? data : w);
          localStorage.setItem('telemetry_workouts', JSON.stringify(updated));
          return updated;
        });
      }

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

  const strokeDash = 251.2;
  const strokeOffset = isResting 
    ? strokeDash - (restTimer / initialRestDuration) * strokeDash 
    : strokeDash;

  return (
    <div className="min-h-screen bg-dark-bg text-zinc-100 font-sans bg-stealth-grid flex flex-col pb-16 relative overflow-hidden">

      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-4 border-b border-dark-border mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4 z-10 relative">
        <div className="flex items-center justify-between md:justify-start space-x-4">
          <div className="flex items-center space-x-2.5 text-white">
            <div className="p-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-widest bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                APEX
              </span>
              <p className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase mt-0.5">WORKOUT TRACKER</p>
            </div>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            {sessionActive && (
              <span className="font-mono font-bold text-[10px] text-brand-accent animate-pulse bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-lg">
                {formatTimeHHMMSS(sessionElapsed)}
              </span>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 p-1 bg-zinc-950/60 border border-dark-border rounded-xl self-center">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'history', label: 'History' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'exercises', label: 'Library' },
            ...(sessionActive ? [{ id: 'active-session', label: 'Workout ⚡' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-premium cursor-pointer ${
                currentTab === tab.id
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/15'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right Status */}
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
            {sessionActive ? "TRACKING ACTIVE SESSION" : "SYSTEM CALIBRATED"}
          </span>
          {sessionActive && (
            <span className="font-mono font-bold text-xs text-brand-accent animate-pulse bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-xl">
              {formatTimeHHMMSS(sessionElapsed)}
            </span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 z-10 relative">
        
        {currentTab === 'dashboard' && (
          <HomeDashboardView 
            workouts={workoutsHistory} 
            onStartRoutine={handleStartRoutine} 
          />
        )}

        {currentTab === 'history' && (
          <HistoryView 
            workouts={workoutsHistory} 
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView 
            workouts={workoutsHistory} 
            exercises={exercisesCatalog} 
          />
        )}

        {currentTab === 'exercises' && (
          <ExerciseLibraryView 
            exercises={exercisesCatalog} 
            onAddExercise={handleRegisterExercise} 
          />
        )}
        
        {currentTab === 'active-session' && (
          (!sessionActive) ? (
            <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto">
              <Sparkles className="w-8 h-8 text-zinc-500 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-zinc-300">No active workout session</h3>
              <p className="text-xs text-zinc-500 mt-1">Please go to the Dashboard to initialize a routine template.</p>
              <button 
                onClick={() => setCurrentTab('dashboard')} 
                className="mt-4 py-2 px-4 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
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
                      <div className="bg-dark-card/45 border border-dark-border px-4 py-2.5 rounded-2xl text-center">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block tracking-wider font-mono">ELAPSED TIME</span>
                        <span className="font-mono font-black text-sm text-white tracking-wider">{formatTimeHHMMSS(sessionElapsed)}</span>
                      </div>
                      
                      <button 
                        onClick={() => setSessionActive(prev => !prev)}
                        className={`py-2.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-premium cursor-pointer ${
                          sessionActive 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-200' 
                            : 'bg-zinc-950 hover:bg-zinc-900 text-brand-secondary border border-brand-secondary/40 hover:border-brand-secondary font-bold shadow-lg shadow-brand-secondary/5 active:scale-95'
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
                            className="bg-gradient-to-r from-brand-primary via-brand-secondary to-[#ffffff] h-full transition-premium duration-500 ease-out"
                            style={{ width: `${pctDone}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono mt-1.5 px-1 uppercase tracking-wider">
                          <span>Workout Progress</span>
                          <span>{pctDone}% done ({completedSetsInActiveSession}/{totalSetsInActiveSession} sets)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Workout Exercises */}
                {sessionExercises.map((exercise) => {
                  const activeSubTab = exerciseSubTabs[exercise.id] || 'sets';
                  const isCollapsed = collapsedExercises[exercise.id];
                  
                  const setSubTab = (tab) => {
                    setExerciseSubTabs(prev => ({ ...prev, [exercise.id]: tab }));
                  };

                  let maxHistorical1RM = 0;
                  const historicalDataPoints = [];
                  
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

                  if (maxHistorical1RM === 0) {
                    exercise.sets.forEach(s => {
                      const val = calculate1RM(s.weight, s.reps);
                      if (val > maxHistorical1RM) maxHistorical1RM = val;
                    });
                  }
                  if (maxHistorical1RM === 0) maxHistorical1RM = 100;

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
                      
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

                      {/* Exercise Header */}
                      <div className="flex justify-between items-start border-b border-dark-border pb-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleExerciseCollapse(exercise.id)}
                            className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-0.5 hover:bg-zinc-800/40 rounded-lg"
                            title={isCollapsed ? "Expand Details" : "Collapse Details"}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform duration-200 text-brand-secondary ${isCollapsed ? '' : 'rotate-90'}`} />
                          </button>
                          <div>
                            <h3 className="text-md font-bold text-zinc-200 font-sans tracking-wide inline-block">{exercise.name}</h3>
                            <span className="inline-block text-[9px] font-bold tracking-wider text-brand-secondary bg-brand-secondary/10 border border-brand-secondary/20 px-2 py-0.5 rounded ml-2.5 uppercase font-mono">
                              {exercise.muscle}
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => removeExerciseFromLiveSession(exercise.id)}
                          className="text-zinc-500 hover:text-brand-accent transition-colors p-1.5 hover:bg-brand-accent/10 rounded-xl cursor-pointer"
                          title="Eject Exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isCollapsed ? (
                        <div className="p-3.5 bg-dark-card/30 border border-dark-border rounded-2xl flex items-center justify-between text-xs font-mono text-zinc-400">
                          <span className="flex items-center space-x-1.5">
                            <Dumbbell className="w-4 h-4 text-brand-primary animate-pulse" />
                            <span>{exercise.sets.length} sets logged ({exercise.sets.filter(s => s.completed).length} completed)</span>
                          </span>
                          <span className="text-zinc-200 font-bold">
                            Total Vol: {Math.round(exercise.sets.reduce((sum, s) => sum + (s.completed ? (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0) : 0), 0))} kg
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Exercise Sub-Tabs */}
                          <div className="flex space-x-1 border-b border-dark-border pb-2 text-[10px] font-bold uppercase tracking-wider">
                            {['sets', 'insights', 'guide', 'history'].map((tab) => (
                              <button
                                key={tab}
                                onClick={() => setSubTab(tab)}
                                className={`py-1.5 px-3 rounded-lg transition-premium cursor-pointer ${
                                  activeSubTab === tab 
                                    ? 'bg-zinc-950 border border-dark-border text-brand-secondary font-bold' 
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
                                  <div className="col-span-2 text-center">Set</div>
                                  <div className="col-span-4 text-center">Weight (kg)</div>
                                  <div className="col-span-4 text-center">Reps</div>
                                  <div className="col-span-1 text-center">Done</div>
                                  <div className="col-span-1"></div>
                                </div>

                                {exercise.sets.map((set, index) => (
                                  <div 
                                    key={set.id} 
                                    className={`grid grid-cols-12 gap-y-3 gap-x-2 items-center p-3 sm:p-1.5 rounded-2xl border transition-premium cursor-pointer ${
                                      set.completed 
                                        ? 'bg-brand-primary/5 border-brand-primary/10' 
                                        : 'hover:bg-zinc-900/40 border-transparent hover:border-zinc-800'
                                    }`}
                                    onClick={(e) => {
                                      if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;
                                      toggleSetComplete(exercise.id, set.id);
                                    }}
                                  >
                                    {/* Set Index */}
                                    <div className="col-span-2 sm:col-span-2 text-left sm:text-center px-1">
                                      <span className="text-[10px] font-bold font-mono text-zinc-400">
                                        Set {index + 1}
                                      </span>
                                    </div>

                                    {/* Weight Input with +/- Buttons */}
                                    <div className="col-span-4 sm:col-span-4 flex items-center justify-start sm:justify-center space-x-1">
                                      <button
                                        type="button"
                                        disabled={set.completed}
                                        onClick={() => handleSetChange(exercise.id, set.id, 'weight', Math.max(0, (set.weight || 0) - 2.5))}
                                        className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input 
                                        id={`weight-${exercise.id}-${set.id}`}
                                        type="number"
                                        value={set.weight || ''}
                                        onChange={(e) => handleSetChange(exercise.id, set.id, 'weight', parseFloat(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleInputKeyDown(e, exercise.id, set.id, 'weight')}
                                        disabled={set.completed}
                                        className="w-14 bg-zinc-950 border border-zinc-900 rounded-lg py-1 font-mono text-xs text-white text-center focus:outline-none focus:border-brand-primary disabled:opacity-60"
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
                                    <div className="col-span-3 sm:col-span-4 flex items-center justify-start sm:justify-center space-x-1">
                                      <button
                                        type="button"
                                        disabled={set.completed}
                                        onClick={() => handleSetChange(exercise.id, set.id, 'reps', Math.max(0, (set.reps || 0) - 1))}
                                        className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input 
                                        id={`reps-${exercise.id}-${set.id}`}
                                        type="number"
                                        value={set.reps || ''}
                                        onChange={(e) => handleSetChange(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleInputKeyDown(e, exercise.id, set.id, 'reps')}
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
                                            ? 'bg-brand-primary/20 border-brand-primary text-brand-primary shadow-[0_0_12px_rgba(139,92,246,0.25)]' 
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
                                        className="text-zinc-600 hover:text-brand-accent transition-colors cursor-pointer"
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
                              <div className="bg-dark-card/45 border border-dark-border rounded-2xl p-4 flex justify-between items-center">
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
                                   <div className="bg-[#0c0d19]/40 border border-dark-border p-3 rounded-2xl">
                                     <svg viewBox="0 0 400 100" className="w-full h-auto overflow-visible">
                                       <path
                                         d={historicalDataPoints.map((pt, i) => {
                                           const x = 30 + (i * 340) / (historicalDataPoints.length - 1);
                                           const y = 80 - ((pt.val - 40) / 160) * 60;
                                           return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                                         }).join(' ')}
                                         fill="none"
                                         stroke="#cbd5e1"
                                         strokeWidth="2.5"
                                         strokeLinecap="round"
                                       />
                                       {historicalDataPoints.map((pt, i) => {
                                         const x = 30 + (i * 340) / (historicalDataPoints.length - 1);
                                         const y = 80 - ((pt.val - 40) / 160) * 60;
                                         return (
                                           <g key={i}>
                                             <circle cx={x} cy={y} r="3.5" fill="#020202" stroke="#cbd5e1" strokeWidth="2" />
                                             <text x={x} y={y - 8} textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold" className="font-mono">{pt.val}kg</text>
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
                            <div className="p-4 bg-dark-card/80 border border-dark-border rounded-2xl flex items-start space-x-3">
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
                                      No past logs found. Complete this workout to log your history.
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
                        </>
                      )}

                    </div>
                  );
                })}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowAddExModal(true)}
                    className="flex-1 py-4 border border-dashed border-brand-primary/20 hover:border-brand-primary/40 rounded-3xl flex items-center justify-center space-x-2 text-xs font-bold uppercase tracking-wider text-brand-primary hover:text-white transition-colors bg-zinc-950/5 cursor-pointer"
                  >
                    <ListPlus className="w-4.5 h-4.5" />
                    <span>Append Exercise to session</span>
                  </button>

                  <button 
                    onClick={finishSession}
                    className="py-4 px-8 bg-zinc-950 hover:bg-zinc-900 text-brand-accent border border-brand-accent/40 hover:border-brand-accent font-bold text-xs uppercase tracking-wider rounded-3xl shadow-lg shadow-brand-accent/5 active:scale-95 transition-premium flex items-center space-x-2 cursor-pointer"
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
                      <circle cx="72" cy="72" r="40" stroke="rgba(255,255,255,0.02)" strokeWidth="6" fill="transparent" />
                      <circle 
                        cx="72" cy="72" r="40" 
                        stroke={isResting ? '#e0a98c' : 'rgba(255,255,255,0.06)'} 
                        strokeWidth="6" fill="transparent" 
                        strokeDasharray={strokeDash} 
                        strokeDashoffset={strokeOffset} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-linear"
                        style={{ filter: isResting ? 'drop-shadow(0 0 8px rgba(224, 169, 140, 0.35))' : 'none' }}
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
                              ? 'bg-brand-primary/15 border-brand-primary/30 text-brand-primary'
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
                            ? 'bg-brand-primary/15 border border-brand-primary/30 text-brand-primary' 
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

                {/* Session Stats Card */}
                <div className="glass-panel rounded-3xl p-5 flex flex-col space-y-4 hover-card-glow">
                  <div className="flex justify-between items-center border-b border-dark-border pb-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Session Stats</span>
                    <span className="text-[9px] text-brand-primary font-mono">ACTIVE</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-950/20 rounded-2xl border border-dark-border">
                    <div className="flex items-center space-x-2">
                      <Flame className="w-4 h-4 text-brand-secondary" />
                      <span className="text-xs font-bold text-zinc-300">Est. Burned Energy</span>
                    </div>
                    <span className="font-display font-bold text-sm text-brand-secondary">
                      {sessionExercises.length > 0
                        ? Math.round(sessionExercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0) * 1.5 + 50)
                        : 0} kcal
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-950/20 rounded-2xl border border-dark-border">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-brand-primary" />
                      <span className="text-xs font-bold text-zinc-300">Muscle Groups</span>
                    </div>
                    <span className="font-display font-bold text-sm text-brand-primary">
                      {Array.from(new Set(sessionExercises.map(e => e.muscle))).length} areas
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )
        )}
      </main>

      {/* Floating Active Session Dock (visible when active but on another tab) */}
      {sessionActive && currentTab !== 'active-session' && (
        <div 
          onClick={() => setCurrentTab('active-session')}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-11/12 max-w-lg glass-panel-glow border-brand-primary/40 rounded-2xl p-4 flex items-center justify-between z-40 shadow-2xl hover:border-brand-primary transition-all duration-300 cursor-pointer animate-float"
        >
          <div className="flex items-center space-x-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent"></span>
            </span>
            <div>
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">ACTIVE WORKOUT TRACKING</span>
              <span className="text-xs font-bold text-white truncate max-w-[200px] block">{sessionName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3.5">
            <span className="font-mono font-bold text-sm text-brand-secondary">
              {formatTimeHHMMSS(sessionElapsed)}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentTab('active-session');
              }}
              className="py-1.5 px-3.5 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-premium cursor-pointer"
            >
              Resume
            </button>
          </div>
        </div>
      )}



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
              <h3 className="text-md font-bold text-zinc-100 font-sans">Add Exercise</h3>
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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans">
          
          <div className="glass-panel-glow rounded-3xl w-full max-w-xl p-6 flex flex-col space-y-5 my-8">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-dark-border pb-3">
              <div>
              <span className="text-[9px] text-brand-secondary font-mono font-bold tracking-widest block uppercase mb-1">SESSION COMPLETE</span>
              <h2 className="text-lg font-display font-black text-white tracking-wide">WORKOUT SUMMARY</h2>
            </div>
              <div className="p-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full">
                <Award className="w-6 h-6 text-brand-accent drop-shadow-[0_0_8px_rgba(244,63,94,0.25)]" />
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
                    <span className="text-zinc-200 font-semibold">ACTIVE: {activeMin}m ({activePct}%)</span>
                    <span className="text-brand-accent font-semibold">REST: {restMin}m ({restPct}%)</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex border border-dark-border">
                    <div className="bg-brand-primary h-full" style={{ width: `${activePct}%` }} />
                    <div className="bg-brand-accent h-full" style={{ width: `${restPct}%` }} />
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
                  <div className="space-y-1.5 bg-dark-card/60 border border-dark-border p-3 rounded-2xl">
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

            {/* Close button */}
            <button 
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-900 text-brand-secondary border border-brand-secondary/40 hover:border-brand-secondary font-bold text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-brand-secondary/5 active:scale-95 transition-premium"
            >
              CLOSE WORKOUT SUMMARY
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
