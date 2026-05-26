import React, { useState } from 'react';
import { TrendingUp, BarChart2, Calendar, Dumbbell, Clock } from 'lucide-react';

export default function AnalyticsView({ workouts, exercises }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(1); // Default to Bench Press (id 1)

  // Calculations
  const totalWorkouts = workouts.length;

  const calculate1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return Math.round(weight / (1.0278 - (0.0278 * reps)));
  };

  // Extract 1RM progress for selected exercise
  const exerciseProgress = workouts
    .map(w => {
      const matchEx = w.exercises.find(e => e.id === Number(selectedExerciseId));
      if (!matchEx) return null;
      const completedSets = matchEx.sets.filter(s => s.completed && s.weight > 0 && s.reps > 0);
      if (completedSets.length === 0) return null;
      const max1RM = Math.max(...completedSets.map(s => calculate1RM(s.weight, s.reps)));
      return {
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(w.date),
        val: max1RM
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rawDate - b.rawDate);

  // Extract total volume per workout (weight * reps for all completed sets)
  const volumeData = workouts
    .map(w => {
      let sessionVolume = 0;
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            sessionVolume += (s.weight || 0) * (s.reps || 0);
          }
        });
      });
      return {
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(w.date),
        val: sessionVolume
      };
    })
    .filter(d => d.val > 0)
    .sort((a, b) => a.rawDate - b.rawDate);

  // Compute stats
  const totalVolumeLifted = workouts.reduce((total, w) => {
    return total + w.exercises.reduce((exTotal, ex) => {
      return exTotal + ex.sets.reduce((sTotal, s) => {
        return sTotal + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0);
      }, 0);
    }, 0);
  }, 0);

  const averageDuration = totalWorkouts > 0 
    ? Math.round(workouts.reduce((sum, w) => sum + w.elapsed, 0) / totalWorkouts / 60)
    : 0;

  // Custom SVG Line Chart generator for 1RM Potential
  const renderLineChart = (data) => {
    if (data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-[#27272a] rounded-2xl text-xs text-zinc-500 bg-zinc-900/20">
          No sufficient completed set data found for this exercise.
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const padding = 35;
    
    const minVal = Math.min(...data.map(d => d.val)) * 0.9;
    const maxVal = Math.max(...data.map(d => d.val)) * 1.1;
    const valRange = maxVal - minVal || 10;

    const points = data.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = height - padding - ((d.val - minVal) * (height - 2 * padding)) / valRange;
      return { x, y, label: d.date, value: d.val };
    });

    const pathData = points.reduce((path, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`;
    }, "");

    const areaPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <div className="relative bg-[#121214] border border-[#1f1f23] rounded-3xl p-4 shadow-2xl">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="0.5" />

          {/* Area fill */}
          {areaPathData && <path d={areaPathData} fill="url(#chartGradient)" />}

          {/* Line path */}
          {pathData && <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Data points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="5" fill="#121214" stroke="#06b6d4" strokeWidth="3" className="transition-all duration-250 hover:r-7" />
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#06b6d4" fontSize="9" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black px-1">
                {p.value} kg
              </text>
              <text x={p.x} y={height - padding + 15} textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="500">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Custom SVG Bar Chart generator for Volume lifted
  const renderBarChart = (data) => {
    if (data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-[#27272a] rounded-2xl text-xs text-zinc-500 bg-zinc-900/20">
          No volume data available. Complete workouts to see stats.
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const padding = 35;

    const maxVal = Math.max(...data.map(d => d.val)) * 1.1;
    const chartHeight = height - 2 * padding;

    return (
      <div className="relative bg-[#121214] border border-[#1f1f23] rounded-3xl p-4 shadow-2xl">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#27272a" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#27272a" strokeWidth="0.5" />

          {/* Bars */}
          {data.map((d, index) => {
            const barWidth = Math.min(30, (width - 2 * padding) / data.length - 8);
            const x = padding + (index * (width - 2 * padding)) / data.length + (width - 2 * padding) / (data.length * 2) - barWidth / 2;
            const barHeight = (d.val / maxVal) * chartHeight;
            const y = height - padding - barHeight;

            return (
              <g key={index} className="group cursor-pointer">
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="url(#barGradient)" className="transition-all hover:opacity-85" />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#10b981" fontSize="9" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {d.val} kg
                </text>
                <text x={x + barWidth / 2} y={height - padding + 15} textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="500">
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* Vitals Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#121214] border border-[#1f1f23] p-4 rounded-3xl flex items-center space-x-3">
          <div className="p-3 bg-cyan-950/40 border border-cyan-900 rounded-2xl">
            <Calendar className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Sessions</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{totalWorkouts}</h3>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1f1f23] p-4 rounded-3xl flex items-center space-x-3">
          <div className="p-3 bg-emerald-950/40 border border-emerald-900 rounded-2xl">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Weight</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{totalVolumeLifted.toLocaleString()} kg</h3>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1f1f23] p-4 rounded-3xl flex items-center space-x-3 col-span-1">
          <div className="p-3 bg-amber-950/40 border border-amber-900 rounded-2xl">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Avg. Duration</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{averageDuration} mins</h3>
          </div>
        </div>

        <div className="bg-[#121214] border border-[#1f1f23] p-4 rounded-3xl flex items-center space-x-3 col-span-1">
          <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-2xl">
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Progress State</p>
            <h3 className="text-xl font-bold text-white mt-0.5">Active</h3>
          </div>
        </div>

      </div>

      {/* Main Charts Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: 1RM Progress */}
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-zinc-200">1RM Progression Matrix</h2>
            </div>
            <select 
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-[#161619] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>
          {renderLineChart(exerciseProgress)}
        </div>

        {/* Bar Chart: Session Volume */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2 px-1">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-200">Session Load Volume (kg)</h2>
          </div>
          {renderBarChart(volumeData)}
        </div>

      </div>

    </div>
  );
}
