import React, { useEffect, useState } from 'react';
import { ArrowRight, FastForward, FileCheck2, Shield, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { gameAudio } from '../game/audio';
import { AcademyEmblem } from './DetectiveArt';

export type IntroScenePhase = 'darkness' | 'school_reveal' | 'case_activation' | 'ready';

interface CinematicRevealIntroProps {
  soundEnabled: boolean;
  reducedMotion: boolean;
  onSceneChange: (phase: IntroScenePhase) => void;
  onComplete: () => void;
  onToggleSound: () => void;
}

const INTRO_MOTES = [
  { id: 0, left: '14%', top: '26%', size: 4, dur: '6.8s', delay: '0s' },
  { id: 1, left: '28%', top: '68%', size: 3, dur: '7.4s', delay: '0.8s' },
  { id: 2, left: '46%', top: '18%', size: 5, dur: '6.2s', delay: '0.4s' },
  { id: 3, left: '66%', top: '32%', size: 3, dur: '8.1s', delay: '1.1s' },
  { id: 4, left: '78%', top: '64%', size: 4, dur: '7.0s', delay: '0.3s' },
  { id: 5, left: '88%', top: '24%', size: 3, dur: '7.9s', delay: '1.4s' },
];

export function CinematicRevealIntro({
  soundEnabled,
  reducedMotion,
  onSceneChange,
  onComplete,
  onToggleSound,
}: CinematicRevealIntroProps) {
  const [scenePhase, setScenePhase] = useState<IntroScenePhase>(
    reducedMotion ? 'ready' : 'darkness'
  );

  useEffect(() => {
    onSceneChange(scenePhase);
  }, [scenePhase, onSceneChange]);

  useEffect(() => {
    if (reducedMotion) {
      setScenePhase('ready');
      return;
    }

    const t1 = window.setTimeout(() => {
      setScenePhase('school_reveal');
    }, 2500);

    const t2 = window.setTimeout(() => {
      setScenePhase('case_activation');
    }, 5600);

    const t3 = window.setTimeout(() => {
      setScenePhase('ready');
    }, 6900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      gameAudio.stopIntroAmbience();
    };
  }, []);

  const handleActivateAmbience = () => {
    if (soundEnabled) {
      gameAudio.playIntroAmbience();
    }
  };

  const handleEnter = () => {
    gameAudio.stopIntroAmbience();
    if (soundEnabled) {
      gameAudio.playTransition();
    }
    onComplete();
  };

  const handleSkip = () => {
    gameAudio.stopIntroAmbience();
    if (soundEnabled) {
      gameAudio.playClick();
    }
    onComplete();
  };

  const isDarkness = scenePhase === 'darkness';
  const isSchoolReveal = scenePhase === 'school_reveal';
  const isCaseStage = scenePhase === 'case_activation' || scenePhase === 'ready';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pembukaan Sinematik Siasatan Detektif"
      onPointerDown={handleActivateAmbience}
      className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Dynamic Backdrop: Prestigious Forest Green gradient in Scene 1, fading cleanly to reveal the bright sunlit 3D Campus in Scene 2-4 */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 transition-opacity duration-[1400ms] ease-out bg-gradient-to-br from-[#244737] via-[#315C48] to-[#1D3B2D] ${
          isDarkness ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Subtle Warm Ivory & Forest Atmospheric Frame over 3D Reveal */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDarkness
            ? 'radial-gradient(ellipse 70% 60% at 50% 45%, rgba(231, 200, 120, 0.16) 0%, rgba(36, 71, 55, 0.35) 60%, rgba(24, 51, 39, 0.65) 100%)'
            : 'radial-gradient(ellipse 84% 74% at 50% 45%, rgba(245, 240, 229, 0.04) 0%, rgba(49, 92, 72, 0.22) 72%, rgba(38, 56, 47, 0.42) 100%)',
        }}
      />

      {/* Subtle Champagne Gold Light Motes */}
      {!reducedMotion && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {INTRO_MOTES.map((m) => (
            <span
              key={m.id}
              className="float-mote absolute rounded-full bg-[#E7C878]/80 shadow-[0_0_10px_rgba(231,200,120,0.65)]"
              style={
                {
                  left: m.left,
                  top: m.top,
                  width: `${m.size}px`,
                  height: `${m.size}px`,
                  '--mote-dur': m.dur,
                  '--mote-delay': m.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Top Controls Bar: Stage Progress + Sound & Skip Intro */}
      <div className="relative z-20 px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#FFFFFF]/95 border border-[#E7C878] shadow-md text-xs font-mono-tabular tracking-wider uppercase text-[#26382F]">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#315C48] whitespace-nowrap">
            <Shield className="w-4 h-4 text-[#315C48]" />
            <span>AKADEMI EJEN RAHSIA</span>
          </span>
          <span aria-hidden="true" className="text-[#A8C5A0]">
            /
          </span>
          <span className="text-[#4B6357] font-semibold hidden sm:inline whitespace-nowrap">
            {isDarkness
              ? 'BAB 01 · PENGENALAN'
              : isSchoolReveal
              ? 'BAB 02 · PENDEDAHAN KAMPUS'
              : 'BAB 03 · PENGAKTIFAN KES'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) {
                window.setTimeout(() => gameAudio.playIntroAmbience(), 40);
              }
            }}
            aria-label={soundEnabled ? 'Bisukan bunyi intro' : 'Aktifkan bunyi intro'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F0E5] border border-[#315C48]/35 text-[#26382F] text-xs font-semibold transition-colors shadow-md"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#315C48]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#4B6357]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#F5F0E5] border-2 border-[#E7C878] text-xs font-mono-tabular font-bold tracking-wider uppercase text-[#26382F] transition-colors shadow-md whitespace-nowrap"
          >
            <span>SKIP INTRO</span>
            <FastForward className="w-3.5 h-3.5 text-[#315C48]" />
          </button>
        </div>
      </div>

      {/* Center Dramatic Stage */}
      <div className="relative z-20 flex-1 flex items-center justify-center px-4 py-6">
        {/* SCENE 1: PRESTIGIOUS EMBLEM REVEAL */}
        {isDarkness && (
          <div className="text-center space-y-6 max-w-2xl intro-stage-1">
            <div className="relative inline-flex items-center justify-center">
              <div
                aria-hidden="true"
                className="absolute -inset-6 rounded-full bg-[#E7C878]/25 blur-xl"
              />
              <div className="relative p-4 rounded-full border-2 border-[#E7C878] bg-[#FFFFFF] shadow-[0_16px_42px_rgba(24,51,39,0.45)]">
                <AcademyEmblem className="w-20 h-20 sm:w-24 sm:h-24" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="font-mono-tabular text-xs sm:text-sm tracking-[0.26em] uppercase text-[#E7C878] font-bold">
                SEKOLAH SERI BESTARI · OPERASI SEKOLAH IMPIAN
              </p>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FFFFFF]">
                DETECTIVE INVESTIGATION
              </h1>
              <p className="text-sm sm:text-base text-[#DCE9D9] max-w-lg mx-auto leading-relaxed">
                Membuka peta kampus 3D Sekolah Seri Bestari dan fail penyiasatan rasmi Ejen Bahasa...
              </p>
            </div>
          </div>
        )}

        {/* SCENE 2: SCHOOL REVEAL (Clean sunlit 3D campus with refined caption) */}
        {isSchoolReveal && (
          <div className="mt-auto mb-4 text-center max-w-xl px-6 py-4 rounded-2xl bg-[#FFFFFF]/95 border-2 border-[#E7C878] shadow-2xl intro-stage-1">
            <p className="font-mono-tabular text-[11px] uppercase tracking-[0.22em] text-[#315C48] font-bold">
              TINJAUAN UDARA KAMPUS 3D
            </p>
            <p className="font-display text-lg sm:text-xl font-bold text-[#26382F] mt-1">
              Sekolah Seri Bestari — 4 Zon Siasatan Dikesan
            </p>
          </div>
        )}

        {/* SCENE 3 & 4: CLASSIFIED CASE ACTIVATION DOSSIER + ENTER INVESTIGATION */}
        {isCaseStage && (
          <div className="w-full max-w-xl rounded-2xl bg-[#FFFFFF] border-2 border-[#E7C878] shadow-[0_24px_60px_rgba(38,56,47,0.32)] overflow-hidden dossier-unfold">
            {/* Forest Green Header Strip */}
            <div className="px-5 sm:px-7 py-3 bg-[#315C48] border-b border-[#E7C878]/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono-tabular font-bold tracking-widest uppercase text-[#F5F0E5]">
                <FileCheck2 className="w-4 h-4 text-[#E7C878]" />
                <span>CLASSIFIED INVESTIGATION FILE</span>
              </div>
              <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-widest text-[#E7C878]">
                ACTIVE
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#FFFFFF] to-[#F5F0E5]">
              <div className="flex items-start gap-4">
                <AcademyEmblem className="w-14 h-14 shrink-0" />
                <div className="space-y-1">
                  <p className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#315C48]">
                    DETECTIVE INVESTIGATION · SEKOLAH SERI BESTARI
                  </p>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#26382F]">
                    Pengaktifan Operasi Siasatan
                  </h2>
                </div>
              </div>

              {/* Structured Case Telemetry Block */}
              <div className="rounded-xl bg-[#DCE9D9]/55 border border-[#A8C5A0] divide-y divide-[#A8C5A0]/60 font-mono-tabular text-xs sm:text-sm">
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[#4B6357] uppercase tracking-wider font-semibold">CASE FILE:</span>
                  <span className="font-bold text-[#26382F]">001</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[#4B6357] uppercase tracking-wider font-semibold">MISSION STATUS:</span>
                  <span className="font-bold text-[#315C48]">ACTIVE</span>
                </div>
                <div className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-[#4B6357] uppercase tracking-wider font-semibold">LOCATION:</span>
                  <span className="font-bold text-[#26382F]">SCHOOL CAMPUS</span>
                </div>
                <div className="px-4 py-3.5 space-y-1 bg-[#FFFFFF]/70 rounded-b-xl">
                  <span className="block text-[#4B6357] uppercase tracking-wider font-semibold">OBJECTIVE:</span>
                  <span className="block font-bold text-[#26382F] leading-relaxed">
                    IDENTIFY THE ISSUES AND COLLECT EVIDENCE.
                  </span>
                </div>
              </div>

              {/* Scene 4 Interactive Entry Action */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  type="button"
                  onClick={handleEnter}
                  className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl hq-brass-plaque border-2 border-[#315C48]/30 text-[#26382F] font-display font-extrabold text-base sm:text-lg tracking-wide shadow-lg hover:brightness-105 transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315C48]"
                >
                  <Sparkles className="w-5 h-5 text-[#315C48]" />
                  <span>ENTER INVESTIGATION</span>
                  <ArrowRight className="w-5 h-5 text-[#315C48]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Subtle Timeline Bar */}
      <div className="relative z-20 px-6 pb-5 flex items-center justify-center gap-3">
        {(['darkness', 'school_reveal', 'case_activation'] as const).map((step, i) => {
          const active =
            (step === 'darkness' && isDarkness) ||
            (step === 'school_reveal' && isSchoolReveal) ||
            (step === 'case_activation' && isCaseStage);
          return (
            <span
              key={step}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                active ? 'w-12 bg-[#E7C878] shadow-sm' : 'w-6 bg-[#FFFFFF]/65'
              }`}
              aria-label={`Tahap intro ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
