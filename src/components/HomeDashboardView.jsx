import React, { useState } from 'react';
import { Sparkles, Play, Dumbbell, Clock, Award, Plus, Moon, Activity, Apple } from 'lucide-react';

export default function HomeDashboardView({ workouts, onStartRoutine }) {
  // Biometric Vitals states
  const [sleep, setSleep] = useState(8);
  const [recovery, setRecovery] = useState(80);
  const [nutrition, setNutrition] = useState(80);

  // Quick Start Routines Data
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
    recommendation = "PR state! Neuromuscular efficiency is high. Ideal for progression testing and heavy loads.";
    recommendationColor = "text-brand-secondary border-brand-secondary/20 bg-brand-secondary/5";
  } else if (readinessScore < 60) {
    recommendation = "Fatigue detected. Sub-optimal recovery telemetry. Consider a deload or active mobility focus.";
    recommendationColor = "text-brand-accent border-brand-accent/20 bg-brand-accent/5";
  }

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
          className="py-2.5 px-5 bg-zinc-950 hover:bg-zinc-900 text-brand-secondary border border-brand-secondary/40 hover:border-brand-secondary font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-secondary/5 active:scale-95 transition-premium flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Empty Session</span>
        </button>
      </div>

      {/* Main Grid: Biometric Sliders + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sliders Card */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 flex flex-col space-y-5 hover-card-glow relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-dark-border pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4.5 h-4.5 text-brand-secondary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Biometric Readiness Sliders</h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">SYS-CALIBRATION</span>
          </div>

          <div className="space-y-4">
            {/* Sleep Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
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
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
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
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
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

        {/* Readiness Gauge Dashboard Card */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 flex flex-col items-center justify-between hover-card-glow relative overflow-hidden text-center">
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-brand-secondary/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full flex justify-between items-center border-b border-dark-border pb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Readiness Score</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">TELEMETRY</span>
          </div>

          <div className="my-4 relative flex items-center justify-center">
            {/* SVG Readiness Arc */}
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="45" stroke="rgba(255,255,255,0.015)" strokeWidth="6" fill="transparent" />
              <circle 
                cx="64" cy="64" r="45" 
                stroke="url(#readinessGrad)" 
                strokeWidth="6" fill="transparent" 
                strokeDasharray={282.7} 
                strokeDashoffset={282.7 - (readinessScore / 100) * 282.7} 
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="readinessGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-display font-black text-white tracking-tighter">{readinessScore}%</span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-mono font-bold mt-0.5">READY STATE</span>
            </div>
          </div>

          <div className={`w-full p-3 border rounded-2xl text-[10px] leading-relaxed text-center font-mono ${recommendationColor}`}>
            {recommendation}
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
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-brand-secondary/30 rounded-xl text-[10px] uppercase font-bold text-zinc-300 hover:text-brand-secondary tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
