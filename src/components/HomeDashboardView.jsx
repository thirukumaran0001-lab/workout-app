import React, { useState } from 'react';
import { Sparkles, Play, Dumbbell, Clock, Award, Plus, Moon, Activity, Apple } from 'lucide-react';

export default function HomeDashboardView({ workouts, onStartRoutine }) {
  // Biometric Vitals states
  const [sleep, setSleep] = useState(8);
  const [recovery, setRecovery] = useState(80);
  const [nutrition, setNutrition] = useState(80);

  // Quick Start Routines Data (All weights and reps default to 0)
  const routinesList = [
    {
      id: 'routine-push',
      name: "Flat push",
      description: "Chest, Shoulders, Triceps, Abs",
      exercises: [
        { id: 1, name: "Bench Press", muscle: "Chest", setsCount: 4, defaultWeight: 0, defaultReps: 0 },
        { id: 5, name: "Overhead Press", muscle: "Shoulders", setsCount: 3, defaultWeight: 0, defaultReps: 0 },
        { id: 7, name: "Lateral Raise", muscle: "Shoulders", setsCount: 3, defaultWeight: 0, defaultReps: 0 },
        { id: 8, name: "Tricep Pushdown", muscle: "Arms", setsCount: 3, defaultWeight: 0, defaultReps: 0 }
      ]
    },
    {
      id: 'routine-pull',
      name: "Pull Low Row",
      description: "Back, Shoulders, Biceps",
      exercises: [
        { id: 2, name: "Pull-up", muscle: "Back", setsCount: 4, defaultWeight: 0, defaultReps: 0 },
        { id: 3, name: "Barbell Deadlift", muscle: "Back", setsCount: 3, defaultWeight: 0, defaultReps: 0 },
        { id: 6, name: "Bicep Curl", muscle: "Arms", setsCount: 3, defaultWeight: 0, defaultReps: 0 }
      ]
    },
    {
      id: 'routine-legs',
      name: "Leg Day v2",
      description: "Quads, Hamstrings, Calves",
      exercises: [
        { id: 4, name: "Barbell Squat", muscle: "Legs", setsCount: 4, defaultWeight: 0, defaultReps: 0 }
      ]
    }
  ];

  // Aggregated workout stats
  const totalVolume = workouts.reduce((total, w) => {
    return total + w.exercises.reduce((exTotal, ex) => {
      return exTotal + ex.sets.reduce((sTotal, s) => {
        return sTotal + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0);
      }, 0);
    }, 0);
  }, 0);

  const totalDurationMin = Math.round(workouts.reduce((total, w) => total + w.elapsed, 0) / 60);

  const handleStart = (routine) => {
    const sessionExs = routine.exercises.map((blue, idx) => {
      const sets = [];
      for (let s = 0; s < blue.setsCount; s++) {
        sets.push({
          id: Date.now() + idx * 100 + s,
          weight: blue.defaultWeight,
          reps: blue.defaultReps,
          completed: false
        });
      }
      return {
        id: blue.id,
        name: blue.name,
        muscle: blue.muscle,
        sets
      };
    });
    onStartRoutine(routine.name, sessionExs);
  };

  const handleStartEmpty = () => {
    onStartRoutine("Custom Workout", []);
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });

  // Calculate Readiness
  const readinessScore = Math.round((sleep / 10) * 40 + recovery * 0.4 + nutrition * 0.2);

  let recommendation = "Stable recovery. Proceed with standard routine progression.";
  let recommendationColor = "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5";
  if (readinessScore >= 85) {
    recommendation = "PR state! Neuromuscular efficiency is high. Ideal for progression testing.";
    recommendationColor = "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5";
  } else if (readinessScore < 60) {
    recommendation = "Fatigue detected. Sub-optimal recovery telemetry. Consider active recovery.";
    recommendationColor = "text-brand-accent border-brand-accent/20 bg-brand-accent/5";
  }

  // Calculate 7-Day Muscle Load Counts
  const muscleLoadCounts = { Chest: 0, Back: 0, Legs: 0, Shoulders: 0, Arms: 0, Core: 0 };
  workouts.forEach(w => {
    const diffDays = Math.ceil(Math.abs(new Date() - new Date(w.date)) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      w.exercises.forEach(ex => {
        if (muscleLoadCounts[ex.muscle] !== undefined) {
          muscleLoadCounts[ex.muscle] += ex.sets.length;
        }
      });
    }
  });

  const getMuscleColor = (muscleName) => {
    const count = muscleLoadCounts[muscleName] || 0;
    if (count === 0) return 'rgba(255, 255, 255, 0.03)';
    if (count <= 3) return 'rgba(6, 182, 212, 0.35)'; // cyan medium glow
    if (count <= 8) return 'rgba(6, 182, 212, 0.8)'; // cyan bright
    return 'rgba(244, 63, 94, 0.85)'; // sunset pink/rose heavy load
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-6">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">Ready to Train?</h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">{formattedDate} • TELEMETRY ACTIVE</p>
        </div>
        
        <button 
          onClick={handleStartEmpty}
          className="py-2.5 px-5 bg-zinc-950 hover:bg-zinc-900 text-brand-secondary border border-brand-secondary/40 hover:border-brand-secondary font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-secondary/5 active:scale-95 transition-premium flex items-center space-x-2 cursor-pointer animate-pulse"
        >
          <Plus className="w-4 h-4" />
          <span>Empty Session</span>
        </button>
      </div>

      {/* Symmetric 3-Card Dashboard Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Card */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col justify-between hover-card-glow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-dark-border pb-3 mb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-brand-secondary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">System Vitals</h3>
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">SYS-CAL</span>
          </div>

          <div className="space-y-4">
            {/* Sleep Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400 flex items-center space-x-1.5">
                  <Moon className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Sleep Duration</span>
                </span>
                <span className="text-zinc-200 font-bold">{sleep} hrs</span>
              </div>
              <input 
                type="range" 
                min="4" 
                max="10" 
                step="0.5" 
                value={sleep}
                onChange={(e) => setSleep(parseFloat(e.target.value))}
                className="slider-sleep"
              />
            </div>

            {/* Recovery Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-brand-secondary" />
                  <span>Recovery State</span>
                </span>
                <span className="text-zinc-200 font-bold">{recovery}%</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                value={recovery}
                onChange={(e) => setRecovery(parseInt(e.target.value))}
                className="slider-recovery"
              />
            </div>

            {/* Nutrition Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-zinc-400 flex items-center space-x-1.5">
                  <Apple className="w-3.5 h-3.5 text-brand-accent" />
                  <span>Nutrition Intake</span>
                </span>
                <span className="text-zinc-200 font-bold">{nutrition}%</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                value={nutrition}
                onChange={(e) => setNutrition(parseInt(e.target.value))}
                className="slider-nutrition"
              />
            </div>
          </div>
        </div>

        {/* Readiness Circular Score */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col items-center justify-between hover-card-glow relative overflow-hidden text-center">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center border-b border-dark-border pb-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Readiness Score</span>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">SYS-STATS</span>
          </div>

          <div className="my-2.5 relative flex items-center justify-center">
            <svg className="w-28 h-28 transform -rotate-90">
              <circle cx="56" cy="56" r="40" stroke="rgba(255,255,255,0.015)" strokeWidth="5" fill="transparent" />
              <circle 
                cx="56" cy="56" r="40" 
                stroke="url(#readinessGrad)" 
                strokeWidth="5" fill="transparent" 
                strokeDasharray={251.2} 
                strokeDashoffset={251.2 - (readinessScore / 100) * 251.2} 
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
                style={{ filter: 'drop-shadow(0 0 6px rgba(6, 182, 212, 0.25))' }}
              />
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-display font-black text-white tracking-tighter">{readinessScore}%</span>
              <span className="text-[7px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-0.5">READY</span>
            </div>
          </div>

          <div className={`w-full p-2.5 border rounded-2xl text-[9px] leading-relaxed text-center font-mono ${recommendationColor}`}>
            {recommendation}
          </div>
        </div>

        {/* Biomechanical Heatmap */}
        <div className="glass-panel rounded-3xl p-5 flex flex-col items-center justify-between hover-card-glow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center border-b border-dark-border pb-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Biomechanics Heatmap</span>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">7D-LOAD STATE</span>
          </div>

          <div className="flex items-center justify-center py-1">
            <svg viewBox="0 0 160 200" className="w-24 h-auto overflow-visible">
              {/* Head */}
              <circle cx="80" cy="18" r="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              
              {/* Center neck line */}
              <line x1="80" y1="26" x2="80" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              
              {/* Back / Lat Wings (Back) */}
              <path d="M 66,42 L 54,70 L 68,82 Z" fill={getMuscleColor('Back')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <path d="M 94,42 L 106,70 L 92,82 Z" fill={getMuscleColor('Back')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />

              {/* Shoulders (Shoulders) */}
              <rect x="52" y="34" width="10" height="10" rx="2.5" fill={getMuscleColor('Shoulders')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="98" y="34" width="10" height="10" rx="2.5" fill={getMuscleColor('Shoulders')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />

              {/* Chest (Chest) */}
              <rect x="64" y="36" width="15" height="16" rx="2" fill={getMuscleColor('Chest')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="81" y="36" width="15" height="16" rx="2" fill={getMuscleColor('Chest')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />

              {/* Arms (Arms) */}
              {/* Left arm */}
              <rect x="46" y="46" width="7" height="22" rx="1.5" fill={getMuscleColor('Arms')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="43" y="70" width="6" height="20" rx="1.5" fill={getMuscleColor('Arms')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              {/* Right arm */}
              <rect x="107" y="46" width="7" height="22" rx="1.5" fill={getMuscleColor('Arms')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="111" y="70" width="6" height="20" rx="1.5" fill={getMuscleColor('Arms')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />

              {/* Core (Core) */}
              <polygon points="65,54 95,54 91,82 69,82" fill={getMuscleColor('Core')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />

              {/* Legs (Legs) */}
              {/* Left leg */}
              <rect x="64" y="86" width="14" height="42" rx="2.5" fill={getMuscleColor('Legs')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="66" y="132" width="10" height="38" rx="2" fill={getMuscleColor('Legs')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              {/* Right leg */}
              <rect x="82" y="86" width="14" height="42" rx="2.5" fill={getMuscleColor('Legs')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
              <rect x="84" y="132" width="10" height="38" rx="2" fill={getMuscleColor('Legs')} stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" className="transition-all duration-300" />
            </svg>
          </div>

          <div className="w-full flex justify-between items-center text-[8px] text-zinc-500 font-mono mt-1 border-t border-dark-border/40 pt-2 px-1">
            <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#06b6d4]" /><span>Active</span></span>
            <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" /><span>Heavy Load</span></span>
          </div>
        </div>

      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-3 gap-3 bg-[#0c0d19]/40 border border-dark-border p-4 rounded-3xl">
        <div className="text-center">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Total Vol Lifted</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-white mt-1 block">{(totalVolume).toLocaleString()} kg</span>
        </div>
        <div className="text-center border-x border-dark-border/40">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Total active duration</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-brand-secondary mt-1 block">{(totalDurationMin / 60).toFixed(1)} hrs</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Logged sessions</span>
          <span className="text-xs sm:text-sm font-bold font-mono text-brand-accent mt-1 block">{workouts.length} runs</span>
        </div>
      </div>

      {/* Routines Blueprints Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select workout blueprint</h3>
          <span className="text-[10px] text-zinc-500 font-mono">{routinesList.length} routines available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routinesList.map(routine => (
            <div key={routine.id} className="bg-[#0c0d19]/55 border border-dark-border rounded-3xl p-5 flex flex-col justify-between space-y-5 hover-card-glow relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-black text-white">{routine.name}</h4>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider">BLUEPRINT</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{routine.description}</p>
                
                <ul className="mt-4 space-y-2">
                  {routine.exercises.map((ex, idx) => (
                    <li key={idx} className="text-[10px] text-zinc-500 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary/60" />
                      <span className="text-zinc-300 font-medium">{ex.name}</span>
                      <span className="text-zinc-500">({ex.setsCount} sets)</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleStart(routine)}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-brand-secondary/30 rounded-xl text-[10px] uppercase font-bold text-zinc-300 hover:text-brand-secondary tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer animate-pulse"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Initialize Workout</span>
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
