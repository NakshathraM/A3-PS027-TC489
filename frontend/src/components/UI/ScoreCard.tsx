import React from 'react';
import { HelpCircle, Sparkles, Activity, ShieldCheck, AlertCircle } from 'lucide-react';

interface ScoreCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: string;
  tooltip: string;
  trend?: string;
  colorTheme?: 'peach' | 'yellow' | 'sky' | 'mint' | 'coral' | 'blue' | 'cyan' | 'amber';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  tooltip,
  colorTheme = 'peach',
}) => {
  // Normalize color themes to cartoon pastel palette
  const theme =
    colorTheme === 'mint'
      ? {
          cardBg: 'bg-white',
          iconBg: 'bg-status-mint text-status-mintText border border-status-mintBorder',
          valColor: 'text-[#1C6B38]',
          shadow: 'shadow-[3px_4px_0px_#B8E6C4]',
          accentBorder: 'border-[#C2E8CE]',
          icon: <ShieldCheck className="w-4 h-4" />,
        }
      : colorTheme === 'yellow' || colorTheme === 'amber'
      ? {
          cardBg: 'bg-white',
          iconBg: 'bg-status-amber text-status-amberText border border-status-amberBorder',
          valColor: 'text-[#8A5600]',
          shadow: 'shadow-[3px_4px_0px_#F6DE8A]',
          accentBorder: 'border-[#F6E3A6]',
          icon: <Activity className="w-4 h-4" />,
        }
      : colorTheme === 'sky' || colorTheme === 'cyan' || colorTheme === 'blue'
      ? {
          cardBg: 'bg-white',
          iconBg: 'bg-status-sky text-status-skyText border border-status-skyBorder',
          valColor: 'text-[#1E5385]',
          shadow: 'shadow-[3px_4px_0px_#BADBFC]',
          accentBorder: 'border-[#CEE4FD]',
          icon: <Sparkles className="w-4 h-4" />,
        }
      : colorTheme === 'coral'
      ? {
          cardBg: 'bg-white',
          iconBg: 'bg-status-coral text-status-coralText border border-status-coralBorder',
          valColor: 'text-[#A82E1E]',
          shadow: 'shadow-[3px_4px_0px_#F7B8AC]',
          accentBorder: 'border-[#F8C8BF]',
          icon: <AlertCircle className="w-4 h-4" />,
        }
      : {
          // Default peach
          cardBg: 'bg-white',
          iconBg: 'bg-brand-peach text-brand-terracotta border border-brand-borderStrong',
          valColor: 'text-[#D97550]',
          shadow: 'shadow-[3px_4px_0px_#F1D8C3]',
          accentBorder: 'border-brand-border',
          icon: <Sparkles className="w-4 h-4" />,
        };

  return (
    <div
      className={`rounded-2xl p-5 border-[1.5px] ${theme.accentBorder} ${theme.cardBg} ${theme.shadow} hover:-translate-y-0.5 transition-all duration-200 relative group`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${theme.iconBg} shadow-sm`}>
            {theme.icon}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary">
            {title}
          </span>
        </div>
        <div className="relative group/tooltip cursor-help text-brand-muted hover:text-brand-terracotta transition-colors">
          <HelpCircle className="w-4 h-4" />
          <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block z-30 w-64 p-3 bg-brand-heading text-white text-xs rounded-xl shadow-lg leading-relaxed border border-[#4A3B34]">
            {tooltip}
          </div>
        </div>
      </div>

      <div className="flex items-baseline space-x-2">
        <span className={`text-3xl font-extrabold tracking-tight ${theme.valColor}`}>
          {value}
        </span>
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-cream text-brand-secondary border border-brand-border">
            {badge}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-brand-secondary mt-1.5 font-medium leading-snug">
          {subtitle}
        </p>
      )}
    </div>
  );
};

