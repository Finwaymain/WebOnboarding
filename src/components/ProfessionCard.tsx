'use client';

import { useState } from 'react';
import { getProfessionEmoji, isValidProfessionImage } from '@/lib/professionIcons';

type ProfessionCardProps = {
  label: string;
  image?: string | null;
  groupEmoji?: string;
  selected?: boolean;
  onClick: () => void;
};

export function ProfessionCard({
  label,
  image,
  groupEmoji,
  selected = false,
  onClick,
}: ProfessionCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const emoji = getProfessionEmoji(label, groupEmoji);
  const showImage = isValidProfessionImage(image) && !imageFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full min-h-[7.75rem] rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all active:scale-[0.98] touch-manipulation ${
        selected
          ? 'bg-emerald-50 border-2 border-emerald-600 shadow-md shadow-emerald-100'
          : 'bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-2.5 overflow-hidden ${
          showImage ? 'bg-slate-50' : 'bg-gradient-to-br from-emerald-50 to-teal-100'
        }`}
      >
        {showImage ? (
          <img
            src={image!}
            alt=""
            className="w-full h-full object-contain p-1"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="text-3xl leading-none" aria-hidden>
            {emoji}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-slate-800 leading-snug line-clamp-3 px-1">
        {label}
      </span>
      {selected && (
        <span className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

export function ServiceGroupCard({
  emoji,
  title,
  count,
  selected,
  onClick,
}: {
  emoji: string;
  title: string;
  count: number;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[7.75rem] rounded-2xl border p-4 flex flex-col items-center justify-center text-center transition-all active:scale-[0.98] touch-manipulation ${
        selected
          ? 'border-emerald-600 bg-emerald-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40'
      }`}
    >
      <span className="text-4xl block mb-2" aria-hidden>
        {emoji}
      </span>
      <p className="text-sm font-bold text-slate-900 leading-tight">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{count} professions</p>
    </button>
  );
}
