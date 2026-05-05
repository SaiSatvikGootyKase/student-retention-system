import React, { useMemo } from 'react';

export default function EngagementHeatmap() {
  const weeks = 12;
  const days = 7;
  
  const heatmapData = useMemo(() => {
    return Array.from({ length: weeks }).map((_, weekIndex) =>
      Array.from({ length: days }).map((_, dayIndex) => {
        const isFuture = weekIndex === weeks - 1 && dayIndex > 2;
        return isFuture ? 0 : Math.floor(Math.random() * 5);
      })
    );
  }, []);

  const getIntensityColor = (level: number) => {
    switch(level) {
      case 1: return 'bg-brand-emerald/20';
      case 2: return 'bg-brand-emerald/40';
      case 3: return 'bg-brand-emerald/70';
      case 4: return 'bg-brand-emerald';
      default: return 'bg-slate-100'; // level 0
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-lg font-bold text-brand-navy tracking-tight">Engagement Streak</h2>
          <p className="text-sm font-medium text-slate-500">You've interacted with learning materials 14 days in a row!</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-100 mix-blend-multiply"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-emerald/20"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-emerald/40"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-emerald/70"></div>
          <div className="w-3 h-3 rounded-sm bg-brand-emerald"></div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-1.5 min-w-max">
          {heatmapData.map((weekData, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1.5">
              {weekData.map((intensity, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`w-4 h-4 rounded-sm ${getIntensityColor(intensity)} transition-transform hover:scale-125 hover:ring-2 ring-brand-navy cursor-pointer`}
                  title={`Activity Level: ${intensity}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
