import React from 'react';
import { Sparkles, Play, Dumbbell, Clock, Award, Plus } from 'lucide-react';

export default function HomeDashboardView({ workouts, onStartRoutine }) {
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
          type: s === 0 ? "WarmUp" : "Normal",
          weight: blue.defaultWeight,
          reps: blue.defaultReps,
          completed: false,
          restTimer: 90
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

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col space-y-6">
      
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">Ready to Train?</h1>
          <p className="text-xs text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">{formattedDate} • SELECT TEMPLATE TO BEGIN</p>
        </div>
        
        <button 
          onClick={handleStartEmpty}
          className="py-2.5 px-5 bg-zinc-950 hover:bg-zinc-900 text-brand-accent border border-brand-accent/40 hover:border-brand-accent font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-brand-accent/5 active:scale-95 transition-premium flex items-center space-x-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Empty Session</span>
        </button>
      </div>

      {/* Quick Stats references */}
      <div className="grid grid-cols-3 gap-3 bg-[#0a0a0c]/60 border border-dark-border p-4 rounded-3xl">
        <div className="text-center">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Total Vol Lifted</span>
          <span className="text-xs sm:text-base font-bold font-mono text-white mt-1 block">{(totalVolume).toLocaleString()} kg</span>
        </div>
        <div className="text-center border-x border-dark-border/40">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Total active duration</span>
          <span className="text-xs sm:text-base font-bold font-mono text-brand-secondary mt-1 block">{(totalDurationMin / 60).toFixed(1)} hrs</span>
        </div>
        <div className="text-center">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block truncate">Logged sessions</span>
          <span className="text-xs sm:text-base font-bold font-mono text-brand-accent mt-1 block">{workouts.length} runs</span>
        </div>
      </div>

      {/* Routines Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Select workout blueprint</h3>
          <span className="text-[10px] text-zinc-500 font-mono">{routinesList.length} routines available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routinesList.map(routine => (
            <div key={routine.id} className="bg-[#0a0a0c]/60 border border-dark-border rounded-3xl p-5 flex flex-col justify-between space-y-5 hover-card-glow">
              <div>
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-black text-white">{routine.name}</h4>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">BLUEPRINT</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">{routine.description}</p>
                
                <ul className="mt-4 space-y-2">
                  {routine.exercises.map((ex, idx) => (
                    <li key={idx} className="text-[10px] text-zinc-500 flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-accent/60" />
                      <span className="text-zinc-300 font-medium">{ex.name}</span>
                      <span className="text-zinc-500">({ex.setsCount} sets)</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleStart(routine)}
                className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-brand-accent/30 rounded-xl text-[10px] uppercase font-bold text-zinc-300 hover:text-brand-accent tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer"
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
