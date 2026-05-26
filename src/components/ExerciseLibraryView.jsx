import React, { useState } from 'react';
import { Plus, Dumbbell, Tag, Check } from 'lucide-react';

export default function ExerciseLibraryView({ exercises, onAddExercise }) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('Chest');
  const [isSuccess, setIsSuccess] = useState(false);

  const musclesList = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAddExercise({ name: name.trim(), muscle });
    setName('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 2000);
  };

  // Group exercises by muscle group for neat layout
  const groupedExercises = exercises.reduce((acc, ex) => {
    if (!acc[ex.muscle]) acc[ex.muscle] = [];
    acc[ex.muscle].push(ex);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Add New Exercise Form */}
      <div className="md:col-span-1 bg-[#09090b]/60 border border-dark-border rounded-3xl p-6 shadow-2xl h-fit hover-card-glow">
        <div className="flex items-center space-x-2.5 border-b border-dark-border pb-3.5 mb-4">
          <Dumbbell className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">Register Exercise</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-0.5">Exercise Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Incline Dumbbell Press"
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 placeholder-zinc-700"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-1 px-0.5">Target Muscle Group</label>
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              {musclesList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-premium cursor-pointer ${
              isSuccess 
                ? 'bg-emerald-500 text-zinc-950' 
                : 'bg-gradient-to-r from-slate-200 via-zinc-100 to-slate-300 hover:from-white hover:to-white text-zinc-950 shadow-lg shadow-white/5 active:scale-95'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Registered Successfully</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Append to Catalog</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Exercises Library Catalog List */}
      <div className="md:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 font-mono">Exercise Catalog Database</h2>
          <span className="text-xs text-zinc-500 font-mono">{exercises.length} available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {musclesList.map(muscleGroup => {
            const list = groupedExercises[muscleGroup] || [];
            if (list.length === 0) return null;

            return (
              <div 
                key={muscleGroup} 
                className="bg-[#09090b]/60 border border-dark-border rounded-3xl p-5 flex flex-col space-y-3 hover-card-glow"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">{muscleGroup}</span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 rounded-xl font-mono">
                    {list.length}
                  </span>
                </div>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {list.map(ex => (
                    <li 
                      key={ex.id} 
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-2 py-1 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{ex.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
