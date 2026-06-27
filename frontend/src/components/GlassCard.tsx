import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
}) => {
  const baseStyle = "rounded-2xl border transition-all duration-300 p-6 glass-card dark:border-white/5 border-slate-200/50 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl shadow-glass-light dark:shadow-glass-dark";
  const hoverStyle = hoverEffect ? "hover:scale-[1.01] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-indigo-500/5 cursor-pointer" : "";
  const clickStyle = onClick ? "cursor-pointer" : "";

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${hoverStyle} ${clickStyle} ${className}`}
    >
      {children}
    </div>
  );
};
