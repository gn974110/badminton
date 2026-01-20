
import React from 'react';
import { cn } from '../utils';
import { Crown, Star } from 'lucide-react';

interface LevelBadgeProps {
  level: number; // 1 to 18
  className?: string;
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, className }) => {
  
  // Custom Shuttlecock Icon (Simplified Feather Shape)
  const ShuttlecockIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.0002 15.5C12.0002 15.5 14.5002 18 16.5002 19.5C18.5002 21 21.0002 22 21.0002 22C21.0002 22 20.0002 18.5 18.0002 16C16.0002 13.5 13.5002 12 13.5002 12L12.0002 15.5Z" />
      <path d="M11.9998 15.5C11.9998 15.5 9.49981 18 7.49981 19.5C5.49981 21 2.99981 22 2.99981 22C2.99981 22 3.99981 18.5 5.99981 16C7.99981 13.5 10.4998 12 10.4998 12L11.9998 15.5Z" />
      <path d="M12 15.5V2L10.5 12C10.5 12 12 15.5 12 15.5Z" />
      <path d="M12 15.5V2L13.5 12C13.5 12 12 15.5 12 15.5Z" />
      <circle cx="12" cy="18" r="2.5" />
    </svg>
  );

  const getStyle = () => {
    // Tier 1: Levels 1-3 (Green - Beginner)
    if (level <= 3) {
        return { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200", icon: <ShuttlecockIcon className="w-3 h-3" /> };
    }
    // Tier 2: Levels 4-6 (Cyan - Novice)
    if (level <= 6) {
        return { bg: "bg-cyan-100", text: "text-cyan-700", border: "border-cyan-200", icon: <ShuttlecockIcon className="w-3 h-3" /> };
    }
    // Tier 3: Levels 7-9 (Blue - Intermediate)
    if (level <= 9) {
        return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: <ShuttlecockIcon className="w-3 h-3" /> };
    }
    // Tier 4: Levels 10-12 (Purple - Advanced)
    if (level <= 12) {
        return { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200", icon: <Star size={10} fill="currentColor" /> };
    }
    // Tier 5: Levels 13-15 (Red - Expert)
    if (level <= 15) {
        return { bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-200", icon: <Star size={10} fill="currentColor" /> };
    }
    // Tier 6: Levels 16-18 (Gold - Master)
    return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: <Crown size={11} fill="currentColor" /> };
  };

  const style = getStyle();

  return (
    <div className={cn(
      "flex items-center gap-1 px-1.5 py-0.5 rounded-md border shadow-sm transition-all",
      style.bg,
      style.text,
      style.border,
      level >= 16 && "shadow-amber-100 ring-1 ring-amber-400/30", // Extra glow for max tier
      className
    )}>
      {style.icon}
      <span className="text-[10px] font-black leading-none mt-[1px]">{level}</span>
    </div>
  );
};
