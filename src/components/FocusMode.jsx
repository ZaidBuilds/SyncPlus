import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, X, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { dataClient } from '@/lib/dataClient';

export default function FocusMode({ task, onClose, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a sound when timer finishes if sound is enabled
      if (soundEnabled) {
        try {
          const audio = new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'); // A pleasant bell sound
          audio.play();
        } catch {
          // ignore
        }
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, soundEnabled]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setSessionCount((c) => c + 1);
  };

  const handleComplete = async () => {
    if (task) {
      await dataClient.entities.Task.update(task.id, { status: 'done' });
      onComplete?.(task.id);
    }
    onClose();
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Calculate progress circle stroke
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / (25 * 60)) * circumference;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center font-sans text-white"
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center w-full max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Focus Mode</span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Task Info */}
        <div className="text-center max-w-2xl px-6 mb-12">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-3">
            Session {sessionCount}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            {task?.title || 'Deep Work Session'}
          </h1>
          {task?.project_id && (
            <p className="mt-4 text-slate-500 text-sm">Focusing deeply on this task</p>
          )}
        </div>

        {/* Timer UI */}
        <div className="relative flex items-center justify-center mb-16">
          <svg className="transform -rotate-90 w-[300px] h-[300px]">
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-slate-800"
            />
            <circle
              cx="150"
              cy="150"
              r={radius}
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-emerald-500 transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-7xl font-light tabular-nums tracking-tight">
              {timeString}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={resetTimer}
            className="p-4 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset Timer"
          >
            <RefreshCw size={24} />
          </button>

          <button
            onClick={toggleTimer}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isActive
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>

          <button
            onClick={handleComplete}
            className="p-4 rounded-full text-slate-400 hover:text-emerald-400 hover:bg-emerald-900/30 transition-colors"
            title="Complete Task"
          >
            <CheckCircle2 size={24} />
          </button>
        </div>

        {/* Ambient Footer */}
        <div className="absolute bottom-8 text-center text-slate-600 text-xs">
          Eliminate distractions. Do deep work.
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
