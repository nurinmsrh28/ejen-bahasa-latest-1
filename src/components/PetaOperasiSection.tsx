import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Headphones,
  Lock,
  MapPin,
  Maximize2,
  Megaphone,
  Minimize2,
  RotateCcw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import professorNurinStandingUrl from '../assets/images/professor_nurin_standing_1794998233968.jpg';
import { gameAudio } from '../game/audio';
import { LOCATIONS } from '../game/data';
import { getUnlockedPhaseLevel } from '../game/rules';
import type { AppScreen, GameState, LocationId } from '../game/types';
import type { IntroScenePhase } from './CinematicRevealIntro';
import { ErrorBoundary } from './ErrorBoundary';
import { Phase1Campus3D, type CampusCameraMode } from './Phase1Campus3D';

export interface NextMissionSummary {
  level: number;
  screen: AppScreen;
  shortTag: string;
  title: string;
  desc: string;
  status: string;
}

interface PetaOperasiSectionProps {
  state: GameState;
  completedCount: number;
  selectedLocId: LocationId;
  introPhase?: IntroScenePhase | null;
  nurinGuidanceText: string;
  isSpeaking?: boolean;
  speechSupported?: boolean;
  onToggleVoiceBrief?: () => void;
  onSelectLocId: (locId: LocationId) => void;
  onNavigatePhase: (screen: AppScreen, locationId?: LocationId) => void;
  nextMission?: NextMissionSummary;
}

const COMPLETION_SPARKLES = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 54 + ((i * 23) % 72);
  return {
    id: i,
    tx: `${Math.round(Math.cos(angle) * dist)}px`,
    ty: `${Math.round(Math.sin(angle) * dist - 14)}px`,
    delay: `${(i % 5) * 0.08}s`,
    dur: `${1.2 + (i % 3) * 0.25}s`,
    size: i % 2 === 0 ? 7 : 5,
  };
});

export function PetaOperasiSection({
  state,
  completedCount,
  selectedLocId,
  introPhase = null,
  nurinGuidanceText,
  isSpeaking = false,
  speechSupported = false,
  onToggleVoiceBrief,
  onSelectLocId,
  onNavigatePhase,
  nextMission,
}: PetaOperasiSectionProps) {
  const [cameraMode, setCameraMode] = useState<CampusCameraMode>('overview');
  const [resetSignal, setResetSignal] = useState(0);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [nurinImgFailed, setNurinImgFailed] = useState(false);
  const [completionCelebrated, setCompletionCelebrated] = useState(false);
  const [showCompletionParticles, setShowCompletionParticles] = useState(false);

  const prevCompletedRef = useRef<number>(completedCount);
  const allLocationsComplete = completedCount >= LOCATIONS.length;
  const unlockedLevel = getUnlockedPhaseLevel(state);

  const inspectedLocation =
    LOCATIONS.find((loc) => loc.id === selectedLocId) || LOCATIONS[0];
  const inspectedInv = state.investigations[inspectedLocation.id];
  const inspectedCluesFound = inspectedInv.discoveredClueIds.length;
  const inspectedTotalClues = inspectedLocation.clues.length;
  const inspectedPct = inspectedInv.completed
    ? 100
    : Math.round((inspectedCluesFound / Math.max(1, inspectedTotalClues)) * 100);

  const activeMission: NextMissionSummary = nextMission || {
    level: unlockedLevel,
    screen: `phase${unlockedLevel}` as AppScreen,
    shortTag:
      unlockedLevel === 1
        ? 'FASA 1'
        : unlockedLevel === 2
          ? 'FASA 2'
          : unlockedLevel === 3
            ? 'FASA 3'
            : unlockedLevel === 4
              ? 'CABARAN AKHIR'
              : 'PRODUK AKHIR',
    title:
      unlockedLevel === 1
        ? `Siasat ${inspectedLocation.name}`
        : unlockedLevel === 2
          ? 'Makmal Analisis Kes'
          : unlockedLevel === 3
            ? 'Buktikan Teori Ejen'
            : unlockedLevel === 4
              ? 'Studio Arkitek'
              : 'Laporan Sekolah Impian',
    desc:
      unlockedLevel === 1
        ? inspectedLocation.briefing
        : unlockedLevel === 2
          ? 'Pilih 2–3 bukti utama di papan penyiasatan dan bina ayat pendapat anda.'
          : unlockedLevel === 3
            ? 'Kuasai cabaran alasan relevan dan tuliskan hujah sokongan bagi pendapat anda.'
            : unlockedLevel === 4
              ? 'Reka Pelan Sekolah Impian dengan School Builder dan pautkan justifikasi bukti.'
              : 'Tulis laporan pendapat 3–5 ayat, pratonton dan cetak hasil rasmi.',
    status: unlockedLevel === 1 ? `${completedCount}/4 Lokasi Selesai` : 'Sedia Dibuka',
  };

  useEffect(() => {
    if (allLocationsComplete && !completionCelebrated) {
      setCompletionCelebrated(true);
      setShowCompletionParticles(true);
      if (state.soundEnabled && prevCompletedRef.current < LOCATIONS.length) {
        gameAudio.playSuccess();
      }
      const timer = window.setTimeout(() => setShowCompletionParticles(false), 2600);
      return () => window.clearTimeout(timer);
    }
    prevCompletedRef.current = completedCount;
  }, [allLocationsComplete, completionCelebrated, completedCount, state.soundEnabled]);

  const handleSelectLocation = (locId: LocationId, zoomFocus = false) => {
    if (state.soundEnabled) {
      gameAudio.playClick();
    }
    onSelectLocId(locId);
    if (zoomFocus) {
      setCameraMode('focus');
    }
  };

  const handleOpenLocation = (locId: LocationId) => {
    if (state.soundEnabled) {
      gameAudio.playHint();
    }
    onNavigatePhase('phase1', locId);
  };

  const handleOpenNextMission = () => {
    if (state.soundEnabled) {
      gameAudio.playHint();
    }
    if (unlockedLevel === 1) {
      onNavigatePhase('phase1', inspectedLocation.id);
    } else {
      onNavigatePhase(activeMission.screen);
    }
  };

  const handleReturnOverview = () => {
    if (state.soundEnabled) {
      gameAudio.playClick();
    }
    setCameraMode('overview');
    setResetSignal((n) => n + 1);
  };

  const handleViewFullMap = () => {
    if (state.soundEnabled) {
      gameAudio.playClick();
    }
    if (cameraMode === 'focus') {
      setCameraMode('overview');
      setResetSignal((n) => n + 1);
      return;
    }
    setMapExpanded((prev) => !prev);
  };

  const handleDengarHint = () => {
    if (state.soundEnabled) {
      gameAudio.playHint();
    }
    setHintVisible((prev) => !prev);
    if (speechSupported && onToggleVoiceBrief) {
      onToggleVoiceBrief();
    }
  };

  const handleReplayCelebration = () => {
    if (state.soundEnabled) {
      gameAudio.playSuccess();
    }
    setShowCompletionParticles(false);
    window.setTimeout(() => setShowCompletionParticles(true), 20);
  };

  const hintDetail =
    unlockedLevel === 1
      ? inspectedLocation.hints[Math.min(2, inspectedInv.hintLevelUsed)]
      : activeMission.desc;

  return (
    <section
      aria-label="Peta Operasi Sekolah Seri Bestari dan Bimbingan Profesor Nurin"
      className="hq-stage-2 relative space-y-3"
    >
      {/* Special Operation Completion Banner (when 4/4 locations complete) */}
      {allLocationsComplete && (
        <div
          role="status"
          aria-live="polite"
          className="relative z-10 overflow-hidden rounded-xl border-2 border-[#E7C878] bg-[#FFFFFF] px-4 py-3 shadow-md"
        >
          {showCompletionParticles && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 z-10"
            >
              {COMPLETION_SPARKLES.map((p) => (
                <span
                  key={p.id}
                  className="hq-sparkle-piece absolute block rounded-full bg-[#E7C878] shadow-[0_0_8px_rgba(231,200,120,0.9)]"
                  style={
                    {
                      width: `${p.size}px`,
                      height: `${p.size}px`,
                      '--tx': p.tx,
                      '--ty': p.ty,
                      '--delay': p.delay,
                      '--dur': p.dur,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReplayCelebration}
                title="Mainkan semula kilauan kejayaan"
                className="relative w-10 h-10 rounded-full hq-brass-plaque border-2 border-[#315C48]/30 flex items-center justify-center text-[#26382F] shadow-sm transition-transform hover:scale-105 shrink-0"
              >
                <Award className="w-5 h-5" />
              </button>
              <div>
                <p className="font-mono-tabular text-[11px] font-extrabold tracking-wider text-[#174C39] uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C79329]" />
                  OPERASI JEJAK BUKTI SELESAI · 4/4 LOKASI DISAHKAN
                </p>
                <p className="font-display text-sm sm:text-base font-bold text-[#26382F]">
                  Kesemua zon Sekolah Seri Bestari telah berjaya disiasat!
                </p>
              </div>
            </div>

            {unlockedLevel >= 2 && (
              <button
                type="button"
                onClick={handleOpenNextMission}
                className="hq-brass-plaque min-h-[40px] inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[#26382F] font-bold text-xs sm:text-sm border border-[#315C48]/25 shadow-sm hover:brightness-105 whitespace-nowrap shrink-0"
              >
                <span>Buka {activeMission.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ROW 3 MAIN GRID: 9 COLS ISOMETRIC 3D SCHOOL MAP | 3 COLS PROFESSOR NURIN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* LEFT / CENTRE (9 cols): PETA OPERASI SEKOLAH SERI BESTARI */}
        <div
          className={`relative flex flex-col transition-all duration-300 ${
            mapExpanded ? 'lg:col-span-12' : 'lg:col-span-9'
          }`}
        >
          {/* Outer Gold-Trimmed Map Frame */}
          <div className="relative flex-1 flex flex-col rounded-2xl border-[3px] border-[#E7C878] bg-[#103D30] shadow-[0_20px_44px_rgba(10,28,20,0.5)] overflow-hidden">
            {/* TOP OVERHANGING MAP HEADER BAR */}
            <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#103D30] via-[#174C39] to-[#103D30] border-b-2 border-[#E7C878]/85">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-full bg-gradient-to-b from-[#FFF2B2] via-[#E7C878] to-[#B68222] border border-[#FFFFFF]/80 flex items-center justify-center shadow shrink-0">
                  <MapPin className="w-4 h-4 text-[#103D30] stroke-[2.5]" />
                </span>
                <div className="min-w-0">
                  <h2 className="font-display text-sm sm:text-lg lg:text-xl font-extrabold tracking-wide text-[#FFFFFF] uppercase truncate">
                    PETA OPERASI SEKOLAH SERI BESTARI
                  </h2>
                </div>
                <span className="hidden sm:inline-block font-mono-tabular text-[11px] font-bold text-[#E7C878] shrink-0">
                  · {completedCount}/4 Lokasi Selesai
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {cameraMode === 'focus' && (
                  <button
                    type="button"
                    onClick={handleReturnOverview}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0D3327] hover:bg-[#1E5E46] border border-[#E7C878]/80 text-xs font-bold text-[#F5E8CF] transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#E7C878]" />
                    <span>Set Semula Kamera</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleViewFullMap}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-[#1A5842] to-[#0D3327] hover:from-[#216D52] hover:to-[#174C39] border border-[#E7C878] text-xs font-bold text-[#FFFFFF] shadow-sm transition-colors whitespace-nowrap"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E7C878]" />
                  <span>
                    {cameraMode === 'focus'
                      ? 'Lihat Peta Penuh'
                      : mapExpanded
                        ? 'Papar Bersama Mentor'
                        : 'Lihat Peta Penuh'}
                  </span>
                  {mapExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5 text-[#E7C878]" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-[#E7C878]" />
                  )}
                </button>
              </div>
            </div>

            {/* INTERACTIVE 3D SCHOOL CAMPUS VIEWPORT */}
            <div
              className={`relative w-full bg-[#DCE9D9] transition-all duration-300 ${
                mapExpanded
                  ? 'h-[480px] sm:h-[580px] lg:h-[620px]'
                  : 'h-[400px] sm:h-[470px] lg:h-[505px]'
              }`}
            >
              <ErrorBoundary
                compact
                fallbackTitle="Peta Kampus 3D Tergendala"
                fallbackMessage="Paparan 3D peta sekolah mengalami ralat WebGL sementara. Klik Muat Semula Paparan atau teruskan dengan tab lokasi di bawah."
              >
                <Phase1Campus3D
                  state={state}
                  activeLocationId={selectedLocId}
                  cameraMode={cameraMode}
                  activeClueId={null}
                  resetSignal={resetSignal}
                  mode="dashboard"
                  introPhase={introPhase}
                  onSelectLocation={(locId) => {
                    handleSelectLocation(locId, true);
                  }}
                  onSelectClue={() => {}}
                  onReturnOverview={handleReturnOverview}
                />
              </ErrorBoundary>

              {/* Bottom Selected-Zone Inspection Bar (Solid Parchment & Forest Green, Zero Blur) */}
              {!introPhase && (
                <div className="pointer-events-none absolute bottom-3 inset-x-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-2.5">
                  {/* Location Quick Tabs + Active Clue Details */}
                  <div className="pointer-events-auto rounded-xl bg-[#F5E8CF] border-2 border-[#E7C878] px-3 py-2.5 shadow-[0_10px_24px_rgba(10,28,20,0.45)] max-w-xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <div className="flex flex-wrap items-center gap-1" role="tablist" aria-label="Pilih lokasi siasatan">
                        {LOCATIONS.map((loc) => {
                          const isTabSelected = selectedLocId === loc.id;
                          const isTabDone = state.investigations[loc.id].completed;
                          return (
                            <button
                              key={loc.id}
                              type="button"
                              role="tab"
                              aria-selected={isTabSelected}
                              onClick={() => handleSelectLocation(loc.id, true)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                                isTabSelected
                                  ? 'bg-[#174C39] text-[#E7C878] border border-[#E7C878]'
                                  : 'bg-[#FFFFFF] hover:bg-[#DCE9D9] text-[#26382F] border border-[#C7A972]/70'
                              }`}
                            >
                              <span>{loc.shortName}</span>
                              {isTabDone && (
                                <CheckCircle2
                                  className={`w-3 h-3 ${isTabSelected ? 'text-[#4ADE80]' : 'text-[#174C39]'}`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <span className="font-mono-tabular text-[11px] font-extrabold text-[#174C39]">
                        {inspectedPct}% · {inspectedCluesFound}/{inspectedTotalClues} Bukti
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {inspectedLocation.clues.map((clue, idx) => {
                        const found = inspectedInv.discoveredClueIds.includes(clue.id);
                        return (
                          <span
                            key={clue.id}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              found
                                ? 'bg-[#DCE9D9] border-[#174C39]/40 text-[#174C39]'
                                : 'bg-[#FFFFFF] border-[#C7A972]/60 text-[#4B6357]'
                            }`}
                          >
                            {found ? (
                              <CheckCircle2 className="w-3 h-3 text-[#174C39] shrink-0" />
                            ) : (
                              <Lock className="w-2.5 h-2.5 text-[#6E5338] shrink-0" />
                            )}
                            <span className="truncate max-w-[140px]">
                              {found ? clue.label : `Petunjuk #${idx + 1}`}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Primary Action CTA for Selected Location */}
                  <div className="pointer-events-auto flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenLocation(selectedLocId)}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-b from-[#F5E0A0] via-[#E7C878] to-[#D2A748] hover:brightness-105 text-[#103D30] border-2 border-[#FFFFFF]/80 font-display font-extrabold text-xs sm:text-sm shadow-[0_8px_20px_rgba(10,28,20,0.45)] transition-transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                      <MapPin className="w-4 h-4 text-[#103D30]" />
                      <span>
                        {inspectedInv.completed
                          ? `Semak ${inspectedLocation.shortName}`
                          : `Siasat ${inspectedLocation.shortName}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAR RIGHT (3 cols): PROFESSOR NURIN CHARACTER + DIALOGUE PANEL + DENGAR HINT */}
        {!mapExpanded && (
          <aside
            aria-label="Profesor Nurin"
            className="lg:col-span-3 flex flex-col justify-end relative"
          >
            {/* Standing Character Portrait Framed in Sunlit Academy Arch */}
            <div className="relative mx-auto w-56 sm:w-64 lg:w-full max-w-[260px] -mb-5 z-0 rounded-t-[2.25rem] overflow-hidden border-2 border-[#E7C878] shadow-[0_14px_30px_rgba(10,28,20,0.4)] bg-gradient-to-b from-[#F5E8CF] to-[#E8D4B0]">
              {!nurinImgFailed ? (
                <img
                  src={professorNurinStandingUrl}
                  alt="Profesor Nurin membimbing penyiasatan di Pusat Operasi"
                  referrerPolicy="no-referrer"
                  onError={() => setNurinImgFailed(true)}
                  className="w-full h-56 sm:h-64 lg:h-[268px] object-cover object-top"
                />
              ) : (
                <div className="w-full h-56 flex flex-col items-center justify-center bg-[#174C39] text-[#E7C878] font-display">
                  <span className="text-4xl font-bold">PN</span>
                  <span className="text-xs text-[#FFFFFF] mt-1">Profesor Nurin</span>
                </div>
              )}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#103D30]/45 to-transparent"
              />
            </div>

            {/* Cream Aged-Parchment Dialogue Box */}
            <div className="relative z-10 hq-cream-scroll rounded-2xl border-2 border-[#E7C878] p-4 sm:p-5 pt-6 text-[#26382F]">
              {/* Top Overlapping Ribbon Header */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-[#FFFFFF] border-2 border-[#E7C878] shadow-md whitespace-nowrap">
                <Megaphone className="w-4 h-4 text-[#C7831C]" />
                <span className="font-display text-sm sm:text-base font-extrabold text-[#174C39]">
                  Profesor Nurin
                </span>
              </div>

              <div className="space-y-3 text-center">
                <p className="text-xs sm:text-[13px] font-semibold leading-relaxed text-[#26382F]">
                  {unlockedLevel === 1
                    ? `Pilih lokasi untuk meneruskan siasatan atau semak perkembangan misi anda di sini. (${inspectedLocation.name}: ${inspectedCluesFound}/${inspectedTotalClues} bukti)`
                    : nurinGuidanceText}
                </p>

                {hintVisible && (
                  <div className="rounded-xl bg-[#FFFFFF]/90 border border-[#C7A972] p-2.5 text-left text-[11px] leading-snug text-[#174C39] lab-report-reveal">
                    <p className="font-bold flex items-center gap-1 mb-0.5 text-[#103D30]">
                      <Volume2 className="w-3.5 h-3.5 text-[#C7831C]" />
                      <span>Petunjuk ({inspectedLocation.shortName}):</span>
                    </p>
                    <p className="text-[#26382F]">{hintDetail}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDengarHint}
                  aria-pressed={isSpeaking || hintVisible}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-[#174C39] to-[#103D30] hover:from-[#1F6149] hover:to-[#174C39] text-[#FFFFFF] border-2 border-[#E7C878] font-display font-bold text-xs sm:text-sm shadow-lg transition-all active:scale-[0.98]"
                >
                  <Headphones className="w-4 h-4 text-[#E7C878]" />
                  <span>{isSpeaking ? 'Henti Suara Hint' : 'Dengar Hint'}</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
