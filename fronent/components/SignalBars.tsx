import React from 'react';
import { cn } from '../utils';

interface SignalBarsProps {
  level: number; // 1 to 5
  className?: string;
}

export const SignalBars: React.FC<SignalBarsProps> = ({ level, className }) => {
  // Determine color based on level
  const getColor = () => {
    if (level <= 2) return "bg-emerald-400"; // Beginner
    if (level <= 3) return "bg-blue-400";    // Intermediate
    if (level <= 4) return "bg-purple-400";  // Advanced
    return "bg-amber-400";                   // Pro
  };

  const activeColor = getColor();
  const inactiveColor = "bg-slate-200";

  return (
    <div className={cn("flex items-end gap-[2px]", className)}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <div
          key={bar}
          className={cn(
            "w-[3px] rounded-full transition-all",
            level >= bar ? activeColor : inactiveColor
          )}
          style={{ height: `${4 + bar * 2}px` }} // Ascending heights: 6, 8, 10, 12, 14px
        />
      ))}
    </div>
  );
};