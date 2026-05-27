import React, { useState } from 'react';
import { TrendingUp, BarChart2, Calendar, Dumbbell, Clock } from 'lucide-react';

export default function AnalyticsView({ workouts, exercises }) {
  const [selectedExerciseId, setSelectedExerciseId] = useState(1);
  const [hovered1RMPoint, setHovered1RMPoint] = useState(null);
  const [hoveredVolumeBar, setHoveredVolumeBar] = useState(null);

  const calculate1RM = (weight, reps) => {
    if (reps === 1) return weight;
    return Math.round(weight / (1.0278 - (0.0278 * reps)));
  };

  const totalWorkouts = workouts.length;

  const exerciseProgress = workouts
    .map(w => {
      const matchEx = w.exercises.find(e => e.id === Number(selectedExerciseId));
      if (!matchEx) return null;
      const completedSets = matchEx.sets.filter(s => s.completed && s.weight > 0 && s.reps > 0);
      if (completedSets.length === 0) return null;
      
      let max1RM = 0;
      let bestSet = null;
      completedSets.forEach(s => {
        const est1RM = calculate1RM(s.weight, s.reps);
        if (est1RM > max1RM) {
          max1RM = est1RM;
          bestSet = s;
        }
      });

      return {
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(w.date),
        val: max1RM,
        weight: bestSet ? bestSet.weight : 0,
        reps: bestSet ? bestSet.reps : 0
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rawDate - b.rawDate);

  const volumeData = workouts
    .map(w => {
      let sessionVolume = 0;
      let totalSets = 0;
      w.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          if (s.completed) {
            sessionVolume += (s.weight || 0) * (s.reps || 0);
            totalSets += 1;
          }
        });
      });
      return {
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        rawDate: new Date(w.date),
        val: sessionVolume,
        totalSets
      };
    })
    .filter(d => d.val > 0)
    .sort((a, b) => a.rawDate - b.rawDate);

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

  const renderLineChart = (data) => {
    if (data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl text-xs text-zinc-500 bg-zinc-900/10">
          No sufficient completed set data found for this exercise.
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const padding = 35;
    
    const minVal = Math.min(...data.map(d => d.val)) * 0.95;
    const maxVal = Math.max(...data.map(d => d.val)) * 1.05;
    const valRange = maxVal - minVal || 10;

    const points = data.map((d, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = height - padding - ((d.val - minVal) * (height - 2 * padding)) / valRange;
      return { x, y, label: d.date, value: d.val, weight: d.weight, reps: d.reps };
    });

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

    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative bg-[#0c0d19]/40 border border-dark-border rounded-3xl p-4 shadow-2xl hover-card-glow">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {areaPathData && <path d={areaPathData} fill="url(#chartGradient)" />}

          {pathData && <path d={pathData} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          {points.map((p, i) => (
            <g 
              key={i} 
              className="group cursor-pointer"
              onMouseEnter={() => setHovered1RMPoint(p)}
              onMouseLeave={() => setHovered1RMPoint(null)}
            >
              <circle cx={p.x} cy={p.y} r="4.5" fill="#03030b" stroke="#06b6d4" strokeWidth="2" className="transition-transform group-hover:scale-125" />
              
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#e4e4e7" fontSize="9" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity font-mono pointer-events-none">
                {p.value} kg
              </text>
              <text x={p.x} y={height - padding + 15} textAnchor="middle" fill="#52525b" fontSize="8" fontWeight="500" className="font-mono">
                {p.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Floating Glassmorphic Tooltip Capsule */}
        <div className="absolute inset-4 pointer-events-none overflow-visible">
          {hovered1RMPoint && (
            <div 
              className="absolute z-30 pointer-events-none bg-zinc-950/95 backdrop-blur-md border border-brand-primary/30 rounded-2xl p-3 shadow-2xl transition-all duration-150 -translate-x-1/2 -translate-y-[110%] w-40"
              style={{
                left: `${(hovered1RMPoint.x / width) * 100}%`,
                top: `${(hovered1RMPoint.y / height) * 100}%`
              }}
            >
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
                {hovered1RMPoint.label}
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {hovered1RMPoint.value} kg
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Estimated 1RM
              </div>
              {hovered1RMPoint.weight > 0 && (
                <div className="border-t border-zinc-800/60 mt-1.5 pt-1.5 flex justify-between items-center text-[10px] text-brand-secondary font-mono">
                  <span>Best Set:</span>
                  <span>{hovered1RMPoint.weight}kg × {hovered1RMPoint.reps}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBarChart = (data) => {
    if (data.length === 0) {
      return (
        <div className="h-48 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl text-xs text-zinc-500 bg-zinc-900/10">
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
      <div className="relative bg-[#0c0d19]/40 border border-dark-border rounded-3xl p-4 shadow-2xl hover-card-glow">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#1a1c35" />
            </linearGradient>
          </defs>

          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {data.map((d, index) => {
            const barWidth = Math.min(26, (width - 2 * padding) / data.length - 8);
            const x = padding + (index * (width - 2 * padding)) / data.length + (width - 2 * padding) / (data.length * 2) - barWidth / 2;
            const barHeight = (d.val / maxVal) * chartHeight;
            const y = height - padding - barHeight;

            return (
              <g 
                key={index} 
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredVolumeBar({
                  x: x + barWidth / 2,
                  y: y,
                  label: d.date,
                  value: d.val,
                  totalSets: d.totalSets
                })}
                onMouseLeave={() => setHoveredVolumeBar(null)}
              >
                <rect x={x} y={y} width={barWidth} height={barHeight} rx="3" fill="url(#barGradient)" className="transition-all hover:opacity-80" />
                <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="#e4e4e7" fontSize="9" fontWeight="bold" className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                  {d.val} kg
                </text>
                <text x={x + barWidth / 2} y={height - padding + 15} textAnchor="middle" fill="#52525b" fontSize="8" fontWeight="500" className="font-mono">
                  {d.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Glassmorphic Tooltip Capsule */}
        <div className="absolute inset-4 pointer-events-none overflow-visible">
          {hoveredVolumeBar && (
            <div 
              className="absolute z-30 pointer-events-none bg-zinc-950/95 backdrop-blur-md border border-brand-secondary/30 rounded-2xl p-3 shadow-2xl transition-all duration-150 -translate-x-1/2 -translate-y-[110%] w-40"
              style={{
                left: `${(hoveredVolumeBar.x / width) * 100}%`,
                top: `${(hoveredVolumeBar.y / height) * 100}%`
              }}
            >
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">
                {hoveredVolumeBar.label}
              </div>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {hoveredVolumeBar.value.toLocaleString()} kg
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                Load Volume
              </div>
              {hoveredVolumeBar.totalSets > 0 && (
                <div className="border-t border-zinc-800/60 mt-1.5 pt-1.5 flex justify-between items-center text-[10px] text-brand-accent font-mono">
                  <span>Logged Sets:</span>
                  <span>{hoveredVolumeBar.totalSets}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* Vitals Telemetry Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#0c0d19]/40 border border-dark-border p-4 rounded-3xl flex items-center space-x-3 hover-card-glow">
          <div className="p-3 bg-zinc-950 border border-dark-border rounded-2xl text-brand-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Total Sessions</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{totalWorkouts}</h3>
          </div>
        </div>

        <div className="bg-[#0c0d19]/40 border border-dark-border p-4 rounded-3xl flex items-center space-x-3 hover-card-glow">
          <div className="p-3 bg-zinc-950 border border-dark-border rounded-2xl text-brand-secondary">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Total Weight</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{totalVolumeLifted.toLocaleString()} kg</h3>
          </div>
        </div>

        <div className="bg-[#0c0d19]/40 border border-dark-border p-4 rounded-3xl flex items-center space-x-3 hover-card-glow">
          <div className="p-3 bg-zinc-950 border border-dark-border rounded-2xl text-brand-accent">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Avg. Duration</p>
            <h3 className="text-xl font-bold font-mono text-white mt-0.5">{averageDuration} mins</h3>
          </div>
        </div>

        <div className="bg-[#0c0d19]/40 border border-dark-border p-4 rounded-3xl flex items-center space-x-3 hover-card-glow">
          <div className="p-3 bg-zinc-950 border border-dark-border rounded-2xl text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold font-mono">Progress State</p>
            <h3 className="text-xl font-bold text-emerald-400 mt-0.5">Optimal</h3>
          </div>
        </div>

      </div>

      {/* Main Charts Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart: 1RM Progress */}
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-200">1RM Progression Matrix</h2>
            </div>
            <select 
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
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
            <BarChart2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200">Session Load Volume (kg)</h2>
          </div>
          {renderBarChart(volumeData)}
        </div>

      </div>

    </div>
  );
}
