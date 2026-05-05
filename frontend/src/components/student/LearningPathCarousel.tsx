import React from 'react';
import { PlayCircle, Clock, Star } from 'lucide-react';

const RECOMMENDATIONS = [
  {
    id: 1,
    title: 'Mastering the Chain Rule',
    duration: '14 min',
    reason: 'To improve your upcoming Calculus Midterm',
    imageColor: 'bg-indigo-500',
    matchScore: 98
  },
  {
    id: 2,
    title: 'Understanding Implicit Differentiation',
    duration: '22 min',
    reason: 'You missed a similar question on Quiz 2',
    imageColor: 'bg-emerald-500',
    matchScore: 92
  },
  {
    id: 3,
    title: 'Limits and Continuity Review',
    duration: '18 min',
    reason: 'Strengthen core foundations',
    imageColor: 'bg-amber-500',
    matchScore: 85
  },
  {
    id: 4,
    title: 'Applications of Derivatives',
    duration: '35 min',
    reason: 'Prep for next week\'s topic',
    imageColor: 'bg-rose-500',
    matchScore: 78
  }
];

export default function LearningPathCarousel() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold text-brand-navy tracking-tight">Up Next For You</h2>
        <button className="text-sm font-semibold text-brand-indigo hover:text-brand-navy transition-colors">
          View all
        </button>
      </div>
      
      {/* Netflix-style horizontal scroll */}
      <div className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory hide-scrollbar">
        {RECOMMENDATIONS.map((video) => (
          <div key={video.id} className="min-w-[280px] sm:min-w-[320px] snap-start group cursor-pointer">
            {/* Thumbnail */}
            <div className={`w-full h-40 ${video.imageColor} rounded-xl shadow-sm relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]`}>
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-xs font-bold text-white uppercase tracking-wider">
                {video.matchScore}% Match
              </div>
              <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md flex items-center gap-1 text-xs font-semibold text-white">
                <Clock size={12} />
                {video.duration}
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlayCircle size={48} className="text-white drop-shadow-lg" />
              </div>
            </div>
            
            {/* Meta */}
            <div className="mt-3 space-y-1">
              <span className="inline-block px-2 py-0.5 bg-brand-slate text-brand-indigo text-[10px] font-bold uppercase tracking-wider rounded border border-brand-indigo/10 mb-1">
                {video.reason}
              </span>
              <h3 className="text-md font-bold text-brand-navy leading-tight group-hover:text-brand-indigo transition-colors">
                {video.title}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
