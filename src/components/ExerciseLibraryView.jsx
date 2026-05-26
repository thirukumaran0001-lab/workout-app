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
      <div className="md:col-span-1 bg-[#121214] border border-[#1f1f23] rounded-3xl p-6 shadow-2xl h-fit">
        <div className="flex items-center space-x-2 border-b border-[#1f1f23] pb-3 mb-4">
          <Dumbbell className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">Register Exercise</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Exercise Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Incline Dumbbell Press"
              required
              className="w-full bg-[#161619] border border-[#27272a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Target Muscle Group</label>
            <select
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              className="w-full bg-[#161619] border border-[#27272a] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-500"
            >
              {musclesList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSuccess}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
              isSuccess 
                ? 'bg-emerald-500 text-black' 
                : 'bg-cyan-500 hover:bg-cyan-600 text-black shadow-lg shadow-cyan-500/10 active:scale-95'
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
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Exercise Catalog Database</h2>
          <span className="text-xs text-zinc-500">{exercises.length} available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {musclesList.map(muscleGroup => {
            const list = groupedExercises[muscleGroup] || [];
            if (list.length === 0) return null;

            return (
              <div 
                key={muscleGroup} 
                className="bg-[#121214] border border-[#1f1f23] rounded-3xl p-5 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between border-b border-[#1f1f23]/60 pb-2">
                  <span className="text-xs font-bold text-zinc-200 uppercase tracking-wide">{muscleGroup}</span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 border border-[#1f1f23] px-2 py-0.5 rounded-full">
                    {list.length}
                  </span>
                </div>
                <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {list.map(ex => (
                    <li 
                      key={ex.id} 
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center space-x-2 py-1 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/80" />
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
