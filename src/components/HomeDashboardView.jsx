import React, { useState, useEffect } from 'react';
  import { Sparkles, Play, Flame, Moon, Zap, Apple, Award, Clock } from 'lucide-react';
  
  export default function HomeDashboardView({ workouts, onStartRoutine, setActiveTab }) {
    // Body vitals states with localStorage persistence
    const [sleep, setSleep] = useState(() => Number(localStorage.getItem('vitals_sleep') || 85));
    const [recovery, setRecovery] = useState(() => Number(localStorage.getItem('vitals_recovery') || 78));
    const [nutrition, setNutrition] = useState(() => Number(localStorage.getItem('vitals_nutrition') || 2100));
  
    useEffect(() => {
      localStorage.setItem('vitals_sleep', sleep);
    }, [sleep]);
  
    useEffect(() => {
      localStorage.setItem('vitals_recovery', recovery);
    }, [recovery]);
  
    useEffect(() => {
      localStorage.setItem('vitals_nutrition', nutrition);
    }, [nutrition]);
  
    // Quick Start Routines Data
    const routinesList = [
      {
        id: 'routine-push',
        name: "Flat push",
        description: "Chest, Shoulders, Triceps, Abs",
        exercises: [
          { id: 1, name: "Bench Press", muscle: "Chest", setsCount: 4, defaultWeight: 100, defaultReps: 8 },
          { id: 5, name: "Overhead Press", muscle: "Shoulders", setsCount: 3, defaultWeight: 60, defaultReps: 8 },
          { id: 7, name: "Lateral Raise", muscle: "Shoulders", setsCount: 3, defaultWeight: 12, defaultReps: 12 },
          { id: 8, name: "Tricep Pushdown", muscle: "Arms", setsCount: 3, defaultWeight: 25, defaultReps: 10 }
        ]
      },
      {
        id: 'routine-pull',
        name: "Pull Low Row",
        description: "Back, Shoulders, Biceps",
        exercises: [
          { id: 2, name: "Pull-up", muscle: "Back", setsCount: 4, defaultWeight: 0, defaultReps: 8 },
          { id: 3, name: "Barbell Deadlift", muscle: "Back", setsCount: 3, defaultWeight: 140, defaultReps: 5 },
          { id: 6, name: "Bicep Curl", muscle: "Arms", setsCount: 3, defaultWeight: 16, defaultReps: 10 }
        ]
      },
      {
        id: 'routine-legs',
        name: "Leg Day v2",
        description: "Quads, Hamstrings, Calves",
        exercises: [
          { id: 4, name: "Barbell Squat", muscle: "Legs", setsCount: 4, defaultWeight: 120, defaultReps: 6 }
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
  
    const totalSets = workouts.reduce((total, w) => {
      return total + w.exercises.reduce((exTotal, ex) => exTotal + ex.sets.length, 0);
    }, 0);
  
    const totalDurationMin = Math.round(workouts.reduce((total, w) => total + w.elapsed, 0) / 60);
  
    // Weekly activities visual data (Mon - Sun)
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    const getWeekdayDurations = () => {
      const durations = [0, 0, 0, 0, 0, 0, 0];
      const now = new Date();
      
      workouts.forEach(w => {
        const wDate = new Date(w.date);
        const timeDiff = now.getTime() - wDate.getTime();
        const daysDiff = timeDiff / (1000 * 3600 * 24);
        if (daysDiff <= 7) {
          let dayIndex = wDate.getDay() - 1;
          if (dayIndex === -1) dayIndex = 6; // Sunday
          durations[dayIndex] += Math.round(w.elapsed / 60);
        }
      });
      
      const hasData = durations.some(d => d > 0);
      if (!hasData) {
        return [45, 15, 55, 20, 65, 40, 10]; // beautiful default progression curve
      }
      return durations;
    };
  
    const weekdayData = getWeekdayDurations();
    const maxDayDuration = Math.max(...weekdayData, 30);
  
    // Render a smooth cubic Bezier spline Weekly Activity chart
    const renderWeeklyActivityChart = () => {
      const width = 500;
      const height = 150;
      const padding = 20;
      const chartWidth = width - 2 * padding;
      const chartHeight = height - 2 * padding;
  
      const points = weekdayData.map((val, idx) => {
        const x = padding + (idx * chartWidth) / 6;
        const y = height - padding - (val / maxDayDuration) * chartHeight;
        return { x, y, val };
      });
  
      // Build smooth cubic bezier curve
      let pathData = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpX1 = p0.x + (p1.x - p0.x) / 2;
        const cpY1 = p0.y;
        const cpX2 = p0.x + (p1.x - p0.x) / 2;
        const cpY2 = p1.y;
        pathData += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
      }
  
      const areaData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  
      return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
  
          {/* Horizontal Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
  
          {/* Chart fill */}
          <path d={areaData} fill="url(#areaGrad)" />
          
          {/* Chart line */}
          <path d={pathData} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  
          {/* Data points & labels */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              {/* Vertical hover guide line */}
              <line x1={p.x} y1={padding} x2={p.x} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <circle cx={p.x} cy={p.y} r="4.5" fill="#030303" stroke="#cbd5e1" strokeWidth="2.5" className="transition-transform group-hover:scale-125" />
              <circle cx={p.x} cy={p.y} r="1.5" fill="#f8fafc" />
              
              {/* Value Indicator */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#cbd5e1" fontSize="8" fontWeight="bold" className="font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {p.val}m
              </text>
  
              {/* Weekday text */}
              <text x={p.x} y={height - 4} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600" className="font-mono">
                {weekdays[idx]}
              </text>
            </g>
          ))}
        </svg>
      );
    };
  
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning, Athlete';
      if (hour < 18) return 'Good Afternoon, Lifter';
      return 'Good Evening, Champion';
    };
  
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
  
    const formattedDate = new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });
  
    return (
      <div className="w-full flex flex-col space-y-6">
        
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">{getGreeting()}</h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5 uppercase tracking-wider">{formattedDate} • BIOMETRICS ONLINE</p>
          </div>
          
          <button 
            onClick={() => handleStart(routinesList[0])}
            className="py-2.5 px-5 bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:to-white text-zinc-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-white/5 active:scale-95 transition-premium flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Quick Start Session</span>
          </button>
        </div>
  
        {/* Overview Dashboard Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-zinc-950/40 border border-dark-border p-4 rounded-3xl text-center">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Total Volume</span>
            <span className="text-md sm:text-lg font-bold font-mono text-white mt-1 block">{(totalVolume).toLocaleString()} kg</span>
          </div>
          <div className="bg-zinc-950/40 border border-dark-border p-4 rounded-3xl text-center">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Active Hours</span>
            <span className="text-md sm:text-lg font-bold font-mono text-[#cbd5e1] mt-1 block">{(totalDurationMin / 60).toFixed(1)} hrs</span>
          </div>
          <div className="bg-zinc-950/40 border border-dark-border p-4 rounded-3xl text-center">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold block">Logs Completed</span>
            <span className="text-md sm:text-lg font-bold font-mono text-[#38bdf8] mt-1 block">{workouts.length}</span>
          </div>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left/Middle Column: Weekly Overview & Routines */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Weekly Activity Chart Container */}
            <div className="glass-panel rounded-3xl p-5 flex flex-col space-y-4 hover-card-glow">
              <div className="flex justify-between items-center border-b border-dark-border pb-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Activity Overview</h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Minutes trained per day (last 7 days)</p>
                </div>
                <span className="text-[10px] text-brand-secondary font-mono bg-zinc-950/80 border border-dark-border px-2.5 py-1 rounded-xl uppercase">WEEK PROGRESS</span>
              </div>
              
              <div className="w-full">
                {renderWeeklyActivityChart()}
              </div>
            </div>
  
            {/* Quick-Start Routines catalog */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Routines Blueprints</h3>
                <span className="text-[10px] text-zinc-500 font-mono">{routinesList.length} blueprinted loops</span>
              </div>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {routinesList.map(routine => (
                  <div key={routine.id} className="bg-[#09090b]/60 border border-dark-border rounded-3xl p-5 flex flex-col justify-between space-y-4 hover-card-glow">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-white">{routine.name}</h4>
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">BLUEPRINT</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{routine.description}</p>
                      
                      <ul className="mt-3.5 space-y-1.5">
                        {routine.exercises.map((ex, idx) => (
                          <li key={idx} className="text-[10px] text-zinc-500 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span className="text-zinc-300 font-medium">{ex.name}</span>
                            <span className="text-zinc-500">({ex.setsCount}x{ex.defaultReps})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
  
                    <button
                      onClick={() => handleStart(routine)}
                      className="w-full py-2.5 bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl text-[10px] uppercase font-bold text-white tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current text-white" />
                      <span>Initiate Routine</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
  
          </div>
  
          {/* Right Column: Vitals Telemetry logs */}
          <div className="lg:col-span-1 space-y-6">
            
            <div className="glass-panel rounded-3xl p-5 flex flex-col space-y-6 hover-card-glow">
              <div>
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Biometric Inputs</h3>
                <p className="text-[9px] text-zinc-500 mt-0.5">Calibrate body vitals before training</p>
              </div>
  
              {/* Sleep Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Moon className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold">Sleep Score</span>
                  </div>
                  <span className="font-mono font-bold text-white">{sleep}/100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={sleep}
                  onChange={(e) => setSleep(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[7px] text-zinc-600 font-mono uppercase">
                  <span>FATIGUED</span>
                  <span>OPTIMAL</span>
                </div>
              </div>
  
              {/* Recovery Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Zap className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold">CNS Recovery</span>
                  </div>
                  <span className="font-mono font-bold text-white">{recovery}/100</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={recovery}
                  onChange={(e) => setRecovery(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[7px] text-zinc-600 font-mono uppercase">
                  <span>FATIGUED</span>
                  <span>PRIME STATE</span>
                </div>
              </div>
  
              {/* Nutrition Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center space-x-2 text-zinc-300">
                    <Apple className="w-4 h-4 text-zinc-400" />
                    <span className="font-bold">Caloric Target</span>
                  </div>
                  <span className="font-mono font-bold text-white">{(nutrition / 1000).toFixed(1)}k kcal</span>
                </div>
                <input 
                  type="range" 
                  min="1000" 
                  max="4500" 
                  step="50"
                  value={nutrition}
                  onChange={(e) => setNutrition(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[7px] text-zinc-600 font-mono uppercase">
                  <span>DEFICIT</span>
                  <span>BULK LOAD</span>
                </div>
              </div>
  
              {/* Advice panel based on stats */}
              <div className="p-4 bg-zinc-950/60 border border-dark-border rounded-2xl flex items-start space-x-3">
                <Award className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase font-bold block tracking-wider">AI Coach Feedback</span>
                  <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
                    {recovery < 60 
                      ? "CNS fatigue is high. Rest structure prioritized. Keep load conservative (75-80% 1RM) and focus on slow tempo reps."
                      : recovery > 85 && sleep > 80
                      ? "PRIME training conditions! High recovery score. Excellent opportunity to push for progressive overload on compounds."
                      : "Balanced biometric load. Execute your routine. Ensure strict adherence to target rest intervals."
                    }
                  </p>
                </div>
              </div>
  
            </div>
  
          </div>
  
        </div>
  
      </div>
    );
  }
