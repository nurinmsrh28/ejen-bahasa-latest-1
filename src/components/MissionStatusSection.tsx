import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Compass,
  Gift,
  Lock,
  Sparkles,
  Trophy,
  Unlock,
} from 'lucide-react';
import { LOCATIONS } from '../game/data';
import { gameAudio } from '../game/audio';
import type { AppScreen, LocationId } from '../game/types';

export interface MissionPhaseItem {
  level: number;
  screen: AppScreen;
  shortTag: string;
  title: string;
  desc: string;
  status: string;
  unlocked: boolean;
  done: boolean;
}

interface MissionStatusSectionProps {
  phases: MissionPhaseItem[];
  unlockedLevel: number;
  xp: number;
  soundEnabled: boolean;
  onNavigatePhase: (screen: AppScreen, locationId?: LocationId) => void;
}

export function MissionStatusSection({
  phases,
  unlockedLevel,
  soundEnabled,
  onNavigatePhase,
}: MissionStatusSectionProps) {
  const [newlyUnlockedLevel, setNewlyUnlockedLevel] = useState<number | null>(null);
  const [missionToast, setMissionToast] = useState<string | null>(null);

  const prevDoneCountRef = useRef<number>(phases.filter((p) => p.done).length);
  const prevUnlockedRef = useRef<number>(unlockedLevel);

  const completedPhasesCount = phases.filter((p) => p.done).length;
  const allFiveDone = completedPhasesCount === phases.length;

  useEffect(() => {
    const prevDone = prevDoneCountRef.current;
    const prevUnlocked = prevUnlockedRef.current;

    if (completedPhasesCount > prevDone || unlockedLevel > prevUnlocked) {
      if (unlockedLevel > prevUnlocked) {
        setNewlyUnlockedLevel(unlockedLevel);
      }
      const newlyUnlockedPhase = phases.find((p) => p.level === unlockedLevel);
      setMissionToast(
        allFiveDone
          ? 'Kesemua 5 Fasa Selesai! Status Ejen Tertinggi dibuka.'
          : newlyUnlockedPhase
            ? `Fasa Baharu Dibuka: ${newlyUnlockedPhase.title}`
            : 'Kemajuan misi dikemas kini!'
      );
      if (soundEnabled) {
        gameAudio.playSuccess();
      }

      const timer = window.setTimeout(() => {
        setNewlyUnlockedLevel(null);
        setMissionToast(null);
      }, 3600);

      prevDoneCountRef.current = completedPhasesCount;
      prevUnlockedRef.current = unlockedLevel;
      return () => window.clearTimeout(timer);
    }

    prevDoneCountRef.current = completedPhasesCount;
    prevUnlockedRef.current = unlockedLevel;
  }, [allFiveDone, completedPhasesCount, phases, soundEnabled, unlockedLevel]);

  const handleActionClick = (p: MissionPhaseItem) => {
    if (!p.unlocked) return;
    if (soundEnabled) {
      gameAudio.playClick();
    }
    onNavigatePhase(p.screen, p.level === 1 ? LOCATIONS[0].id : undefined);
  };

  return (
    <section
      aria-label="Timeline Misi"
      className="relative h-full flex flex-col pt-3"
    >
      {/* Overhanging Left Header Ribbon with Gold Compass Emblem */}
      <div className="relative z-20 flex items-center justify-between gap-2 -mb-3.5 pl-1 pr-2">
        <div className="inline-flex items-center gap-2.5 pl-1.5 pr-5 py-1.5 rounded-r-full rounded-l-full bg-gradient-to-r from-[#103D30] via-[#174C39] to-[#103D30] border-2 border-[#E7C878] shadow-lg">
          <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#B68222] border border-[#FFFFFF]/80 flex items-center justify-center shadow shrink-0">
            <Compass className="w-4 h-4 text-[#103D30] stroke-[2.4]" />
          </span>
          <h2 className="font-display text-sm sm:text-base font-extrabold tracking-wide text-[#FFFFFF] uppercase whitespace-nowrap">
            TIMELINE MISI
          </h2>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#103D30] border border-[#E7C878]/80 font-mono-tabular text-[11px] font-bold text-[#E7C878] shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
          {completedPhasesCount}/5 Selesai
        </span>
      </div>

      {/* Cream Aged-Parchment Main Container */}
      <div className="hq-cream-scroll flex-1 rounded-2xl border-2 border-[#E7C878] p-4 sm:p-5 pt-7 flex flex-col justify-between gap-3 text-[#26382F]">
        {missionToast && (
          <div
            role="status"
            aria-live="polite"
            className="p1-toast-enter rounded-xl bg-[#FFFFFF] border-2 border-[#E7C878] px-3 py-2 flex items-center gap-2 text-xs font-bold text-[#174C39] shadow-sm"
          >
            <Unlock className="w-3.5 h-3.5 text-[#174C39] shrink-0" />
            <span>{missionToast}</span>
          </div>
        )}

        {/* DESKTOP / TABLET HORIZONTAL 5-NODE TIMELINE (sm+) */}
        <div className="hidden sm:grid grid-cols-5 gap-2 items-start pt-1">
          {phases.map((p, idx) => {
            const isCurrent = p.unlocked && !p.done;
            const isLocked = !p.unlocked;
            const justUnlocked = newlyUnlockedLevel === p.level;
            const nextPhase = phases[idx + 1];
            const connectorDone = p.done && nextPhase?.done;
            const connectorActive = p.done && nextPhase && !nextPhase.done && nextPhase.unlocked;

            const shortStageLabel =
              p.level <= 3 ? `Fasa ${p.level}` : p.level === 4 ? 'Cabaran' : 'Produk';
            const subLabel =
              p.level <= 3
                ? p.title
                : p.level === 4
                  ? 'Cabaran Akhir'
                  : 'Produk Akhir';

            return (
              <div
                key={p.level}
                className={`relative flex flex-col items-center text-center px-1 py-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-[#FFFFFF]/65 border border-[#E7C878] shadow-sm'
                    : justUnlocked
                      ? 'misi-unlock-burst'
                      : ''
                }`}
              >
                {/* Connecting Progression Arrow Line to Next Node */}
                {idx < phases.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[26px] left-[calc(50%+20px)] right-[calc(-50%+20px)] h-1.5 rounded-full overflow-hidden z-0"
                  >
                    <div
                      className={`w-full h-full ${
                        connectorDone
                          ? 'bg-gradient-to-r from-[#16A34A] to-[#22C55E]'
                          : connectorActive
                            ? 'bg-gradient-to-r from-[#22C55E] to-[#E7C878]'
                            : 'bg-[#C7B79A]'
                      }`}
                    />
                  </div>
                )}

                {/* Node Emblem Circle */}
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => handleActionClick(p)}
                  title={`${p.shortTag}: ${p.title} (${p.status})`}
                  aria-label={`${p.shortTag} ${p.title} - ${p.status}`}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 font-display text-base font-extrabold transition-transform ${
                    p.done
                      ? 'bg-gradient-to-b from-[#22C55E] to-[#15803D] border-[#FFFFFF] text-[#FFFFFF] shadow-[0_0_12px_rgba(34,197,94,0.45)] hover:scale-105 cursor-pointer'
                      : isCurrent
                        ? 'bg-gradient-to-b from-[#FFF1B8] via-[#E7C878] to-[#C69324] border-[#FFFFFF] text-[#103D30] hq-node-pulse hover:scale-105 cursor-pointer'
                        : p.level >= 4
                          ? 'bg-gradient-to-b from-[#E5DEC9] to-[#BEB49F] border-[#A89A82] text-[#4B5563] cursor-not-allowed'
                          : 'bg-gradient-to-b from-[#9CA3AF] to-[#6B7280] border-[#E5E7EB] text-[#FFFFFF] cursor-not-allowed'
                  }`}
                >
                  {p.level === 4 ? (
                    <Trophy className={`w-4 h-4 ${p.done || isCurrent ? '' : 'text-[#78561A]'}`} />
                  ) : p.level === 5 ? (
                    <Gift className={`w-4 h-4 ${p.done || isCurrent ? '' : 'text-[#4B5563]'}`} />
                  ) : (
                    <span>{p.level}</span>
                  )}

                  {p.done && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-[#16A34A] border border-[#FFFFFF] flex items-center justify-center shadow"
                    >
                      <Check className="w-2.5 h-2.5 text-[#FFFFFF] stroke-[3]" />
                    </span>
                  )}
                </button>

                {/* Title & Sub-title */}
                <div className="mt-2 min-h-[46px] flex flex-col justify-start">
                  {p.level <= 3 && (
                    <p className="font-display text-xs font-extrabold text-[#103D30] leading-tight">
                      {shortStageLabel}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-[#26382F] leading-tight mt-0.5 line-clamp-2">
                    {subLabel}
                  </p>
                </div>

                {/* Action Button / Status Badge */}
                <div className="mt-2 w-full">
                  {p.done ? (
                    <button
                      type="button"
                      onClick={() => handleActionClick(p)}
                      className="w-full min-h-[30px] px-2 py-1 rounded-full bg-gradient-to-b from-[#1E7E45] to-[#14532D] hover:brightness-110 border border-[#86EFAC]/70 text-[#FFFFFF] text-[11px] font-bold inline-flex items-center justify-center gap-1 shadow-sm transition-transform active:scale-95 whitespace-nowrap"
                    >
                      <span>Selesai</span>
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                  ) : isCurrent ? (
                    <button
                      type="button"
                      onClick={() => handleActionClick(p)}
                      className="w-full min-h-[30px] px-2 py-1 rounded-full bg-gradient-to-b from-[#FFF0B5] via-[#E7C878] to-[#C89426] hover:brightness-105 border border-[#8A6114] text-[#103D30] text-[11px] font-extrabold inline-flex items-center justify-center gap-1 shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Aktif</span>
                    </button>
                  ) : (
                    <div
                      aria-label={`${p.shortTag} terkunci`}
                      className="w-full min-h-[30px] flex items-center justify-center text-[#6B7280]"
                    >
                      <Lock className="w-4 h-4 misi-padlock-sway" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* MOBILE VERTICAL TIMELINE (< sm) */}
        <div className="sm:hidden space-y-2.5">
          {phases.map((p) => {
            const isCurrent = p.unlocked && !p.done;
            return (
              <div
                key={p.level}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border ${
                  p.done
                    ? 'bg-[#DCE9D9]/80 border-[#174C39]/40'
                    : isCurrent
                      ? 'bg-[#FFFFFF] border-[#E7C878] shadow-sm'
                      : 'bg-[#EFE3C8]/75 border-[#C7A972]/50 opacity-85'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center border font-display text-sm font-bold shrink-0 ${
                      p.done
                        ? 'bg-[#16A34A] border-[#FFFFFF] text-[#FFFFFF]'
                        : isCurrent
                          ? 'bg-[#E7C878] border-[#103D30] text-[#103D30]'
                          : 'bg-[#9CA3AF] border-[#E5E7EB] text-[#FFFFFF]'
                    }`}
                  >
                    {p.done ? <Check className="w-4 h-4" /> : p.level}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono-tabular text-[10px] font-bold text-[#174C39]">
                      {p.shortTag}
                    </p>
                    <p className="font-display text-xs font-bold text-[#26382F] truncate">
                      {p.title}
                    </p>
                  </div>
                </div>

                {p.unlocked ? (
                  <button
                    type="button"
                    onClick={() => handleActionClick(p)}
                    className={`px-3 min-h-[34px] rounded-full text-xs font-bold shrink-0 ${
                      p.done
                        ? 'bg-[#174C39] text-[#FFFFFF]'
                        : 'bg-[#E7C878] text-[#103D30] border border-[#8A6114]'
                    }`}
                  >
                    {p.done ? 'Selesai ✓' : 'Aktif'}
                  </button>
                ) : (
                  <Lock className="w-4 h-4 text-[#6B7280] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
