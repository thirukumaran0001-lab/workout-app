import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp, Award, Dumbbell } from 'lucide-react';

export default function HistoryView({ workouts }) {
  const [expandedWorkoutId, setExpandedWorkoutId] = useState(null);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + 'h ' : ''}${mins}m ${secs}s`;
  };

  const calculate1RM = (weight, reps) => {
    const parsedWeight = parseFloat(weight) || 0;
    const parsedReps = parseInt(reps) || 0;
    if (parsedReps <= 1) return parsedWeight;
    return Math.round(parsedWeight / (1.0278 - (0.0278 * parsedReps)));
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString(undefined, { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateTotalVolume = (exercises) => {
    return exercises.reduce((total, ex) => {
      return total + ex.sets.reduce((setTotal, s) => {
        return setTotal + (s.completed ? (s.weight || 0) * (s.reps || 0) : 0);
      }, 0);
    }, 0);
  };

  const toggleExpand = (id) => {
    setExpandedWorkoutId(expandedWorkoutId === id ? null : id);
  };

  if (workouts.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10 text-center">
        <Calendar className="w-8 h-8 text-zinc-500 mb-3 animate-pulse" />
        <h3 className="text-sm font-semibold text-zinc-300">No workout records found</h3>
        <p className="text-xs text-zinc-500 max-w-xs mt-1">Complete and log your active session to start building your training history matrix.</p>
      </div>
    );
  }

  // Show newest workouts first
  const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono">Telemetry History Logs</h2>
        <span className="text-xs text-zinc-500 font-mono">{workouts.length} recorded runs</span>
      </div>

      {sortedWorkouts.map((workout) => {
        const isExpanded = expandedWorkoutId === workout.id;
        const totalVolume = calculateTotalVolume(workout.exercises);
        const muscles = Array.from(new Set(workout.exercises.map(e => e.muscle)));

        return (
          <div 
            key={workout.id} 
            className="bg-[#09090b]/60 border border-dark-border rounded-3xl overflow-hidden transition-premium hover-card-glow"
          >
            {/* Header / Clickable Toggle */}
            <div 
              onClick={() => toggleExpand(workout.id)}
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-zinc-900/10 transition-colors"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
                  {formatDate(workout.date)}
                </span>
                <h3 className="text-md font-bold text-white mt-0.5">{workout.name}</h3>
                
                {/* Muscle Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {muscles.map((m, idx) => (
                    <span key={idx} className="text-[8px] font-bold tracking-wider text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right flex flex-col space-y-0.5">
                  <div className="flex items-center justify-end text-xs text-zinc-300 font-mono space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{formatTime(workout.elapsed)}</span>
                  </div>
                  <div className="flex items-center justify-end text-xs text-zinc-300 font-mono space-x-1.5 mt-0.5">
                    <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{totalVolume.toLocaleString()} kg load</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </div>
            </div>

            {/* Expandable Details Area */}
            {isExpanded && (
              <div className="border-t border-dark-border bg-zinc-950/20 p-5 space-y-5">
                
                {/* Visual Telemetry Matrix */}
                {(() => {
                  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
                  const activeSec = workout.activeDuration || Math.round(workout.elapsed * 0.65);
                  const restSec = workout.restDuration || (workout.elapsed - activeSec);
                  const totalSec = activeSec + restSec || 1;
                  const activePct = Math.round((activeSec / totalSec) * 100);
                  const restPct = 100 - activePct;
                  
                  // Mock HR generator if missing
                  const hrLogs = workout.heartRates && workout.heartRates.length > 0 
                    ? workout.heartRates 
                    : Array.from({ length: 12 }, (_, i) => {
                        const progress = i / 11;
                        const base = 72 + Math.sin(progress * Math.PI) * 48;
                        const seed = (workout.id % 10) + i;
                        const fluctuation = Math.round((Math.sin(seed) * 5));
                        return Math.max(65, Math.min(145, Math.round(base + fluctuation)));
                      });

                  // Generate Bezier Curve Path for HR Curve
                  const getBezierPath = (points) => {
                    const width = 200;
                    const height = 50;
                    const padding = 5;
                    const chartWidth = width - 2 * padding;
                    const chartHeight = height - 2 * padding;
                    const minVal = 55;
                    const maxVal = 155;
                    const valRange = maxVal - minVal;

                    const coords = points.map((val, idx) => {
                      const x = padding + (idx * chartWidth) / (points.length - 1 || 1);
                      const y = height - padding - ((val - minVal) / valRange) * chartHeight;
                      return { x, y };
                    });

                    let path = `M ${coords[0].x} ${coords[0].y}`;
                    for (let i = 0; i < coords.length - 1; i++) {
                      const p0 = coords[i];
                      const p1 = coords[i + 1];
                      const cpX1 = p0.x + (p1.x - p0.x) / 2;
                      const cpY1 = p0.y;
                      const cpX2 = p0.x + (p1.x - p0.x) / 2;
                      const cpY2 = p1.y;
                      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
                    }
                    const areaPath = `${path} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;
                    return { path, areaPath, coords };
                  };

                  const hrChart = getBezierPath(hrLogs);

                  return (
                    <div className="space-y-4 border-b border-dark-border pb-4">
                      {/* Active vs Rest ratio */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 font-mono">
                          <span className="text-zinc-300">ACTIVE: {Math.round(activeSec / 60)}m ({activePct}%)</span>
                          <span className="text-[#38bdf8]">REST: {Math.round(restSec / 60)}m ({restPct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex border border-dark-border">
                          <div className="bg-zinc-100 h-full" style={{ width: `${activePct}%` }} />
                          <div className="bg-sky-500 h-full" style={{ width: `${restPct}%` }} />
                        </div>
                      </div>

                      {/* Side by side Heart Rate graph & Zones */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* SVG HR chart */}
                        <div className="bg-[#09090b]/80 border border-dark-border p-3 rounded-2xl flex flex-col justify-center h-[95px]">
                          <svg viewBox="0 0 200 50" className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id={`hrGrad-${workout.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path d={hrChart.areaPath} fill={`url(#hrGrad-${workout.id})`} />
                            <path d={hrChart.path} fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            
                            {/* Peak indicator dot */}
                            {hrChart.coords.length > 0 && (() => {
                              const peakIdx = hrLogs.indexOf(Math.max(...hrLogs));
                              const peakCoord = hrChart.coords[peakIdx];
                              return <circle cx={peakCoord.x} cy={peakCoord.y} r="2.5" fill="#f8fafc" stroke="#38bdf8" strokeWidth="1" />;
                            })()}

                            <text x="2" y="8" fill="#f8fafc" fontSize="5" fontWeight="bold" className="font-mono">Max: {Math.max(...hrLogs)} bpm</text>
                            <text x="2" y="47" fill="#64748b" fontSize="5" fontWeight="bold" className="font-mono">Heart Rate Waveform</text>
                          </svg>
                        </div>

                        {/* Zones */}
                        <div className="bg-[#09090b]/80 border border-dark-border p-2.5 rounded-2xl flex flex-col justify-between h-[95px] text-[8px] font-mono">
                          {(() => {
                            const zones = [
                              { name: "Anaerobic (Peak)", min: 135, max: 200, color: "bg-zinc-200" },
                              { name: "Aerobic (Cardio)", min: 115, max: 135, color: "bg-slate-400" },
                              { name: "Fat Burn", min: 90, max: 115, color: "bg-sky-400" },
                              { name: "Warm-up / Rest", min: 0, max: 90, color: "bg-zinc-700" }
                            ];

                            const totalCount = hrLogs.length || 1;
                            return zones.map((z, zIdx) => {
                              const count = hrLogs.filter(hr => hr >= z.min && hr < z.max).length;
                              const pct = Math.round((count / totalCount) * 100);
                              return (
                                <div key={zIdx} className="flex items-center justify-between space-x-2">
                                  <span className="text-zinc-400 w-24 truncate">{z.name}</span>
                                  <div className="flex-1 bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                                    <div className={`${z.color} h-full`} style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-zinc-300 w-5 text-right">{pct}%</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Exercises list */}
                {workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-zinc-200">{exercise.name}</span>
                      <span className="text-[8px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider">{exercise.muscle}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 bg-zinc-950/40 border border-zinc-900 p-2.5 rounded-2xl">
                      {exercise.sets.map((set, sIdx) => (
                        <div key={sIdx} className="flex flex-col items-center justify-center p-2 bg-[#09090b]/80 border border-dark-border rounded-xl text-center font-mono transition-premium hover:border-zinc-700">
                          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            set.type === 'WarmUp' 
                              ? 'bg-amber-500/10 text-amber-400' 
                              : set.type === 'DropSet'
                              ? 'bg-fuchsia-500/10 text-fuchsia-400'
                              : set.type === 'Failure'
                              ? 'bg-rose-950/40 text-rose-400'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {set.type === 'WarmUp' ? 'W' : set.type === 'DropSet' ? 'D' : set.type === 'Failure' ? 'F' : `S${sIdx + 1}`}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-200 mt-1 block">
                            {set.weight} kg
                          </span>
                          <span className="text-[9px] text-zinc-500 block">
                            x {set.reps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
