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
            className="bg-dark-card/45 border border-dark-border rounded-3xl overflow-hidden transition-premium hover-card-glow"
          >
            {/* Header / Clickable Toggle */}
            <div 
              onClick={() => toggleExpand(workout.id)}
              className="p-5 flex justify-between items-center cursor-pointer hover:bg-brand-primary/5 transition-colors"
            >
              <div className="flex flex-col space-y-1">
                <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-wider">
                  {formatDate(workout.date)}
                </span>
                <h3 className="text-md font-bold text-white mt-0.5">{workout.name}</h3>
                
                {/* Muscle Tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {muscles.map((m, idx) => (
                    <span key={idx} className="text-[8px] font-bold tracking-wider text-zinc-400 bg-zinc-950 border border-dark-border px-2 py-0.5 rounded uppercase">
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
                
                {/* Visual Ratio breakdown */}
                {(() => {
                  const activeSec = workout.activeDuration || Math.round(workout.elapsed * 0.65);
                  const restSec = workout.restDuration || (workout.elapsed - activeSec);
                  const totalSec = activeSec + restSec || 1;
                  const activePct = Math.round((activeSec / totalSec) * 100);
                  const restPct = 100 - activePct;

                  return (
                    <div className="space-y-4 border-b border-dark-border pb-4">
                      {/* Active vs Rest ratio */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-zinc-400 font-mono">
                          <span className="text-brand-primary">ACTIVE: {Math.round(activeSec / 60)}m ({activePct}%)</span>
                          <span className="text-brand-secondary">REST: {Math.round(restSec / 60)}m ({restPct}%)</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden flex border border-dark-border">
                          <div className="bg-brand-primary h-full" style={{ width: `${activePct}%` }} />
                          <div className="bg-brand-secondary h-full" style={{ width: `${restPct}%` }} />
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
                      <span className="text-[8px] text-zinc-400 bg-zinc-950 border border-dark-border px-2 py-0.5 rounded font-mono uppercase tracking-wider">{exercise.muscle}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 bg-dark-card/30 border border-dark-border p-2.5 rounded-2xl">
                      {exercise.sets.map((set, sIdx) => (
                        <div key={sIdx} className="flex flex-col items-center justify-center p-2 bg-dark-card/70 border border-dark-border rounded-xl text-center font-mono transition-premium hover-border-zinc-700">
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                            S{sIdx + 1}
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
