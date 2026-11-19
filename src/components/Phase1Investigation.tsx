import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Backpack,
  BookOpen,
  CheckCircle2,
  Compass,
  Film,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { gameAudio } from '../game/audio';
import { BADGES, LOCATIONS, LOCATION_MAP } from '../game/data';
import {
  getAgentRank,
  getEarnedBadgeIds,
  isPhase1Complete,
  validateLocationSave,
} from '../game/rules';
import type { GameState, LocationId } from '../game/types';
import { CinematicRevealIntro, type IntroScenePhase } from './CinematicRevealIntro';
import { CsiInvestigationModal } from './CsiInvestigationModal';
import { CollectibleBadgeShield, ProfesorCitraPortrait } from './DetectiveArt';
import { ErrorBoundary } from './ErrorBoundary';
import {
  CampusThirdPersonViewport,
  type CampusSimulatorHandle,
} from './simulator3d/CampusThirdPersonViewport';
import { SimulatorHud } from './simulator3d/SimulatorHud';
import type { SimulatorTelemetry } from './simulator3d/types';

interface Phase1InvestigationProps {
  state: GameState;
  activeLocationId: LocationId;
  onSelectLocation: (locId: LocationId) => void;
  onDiscoverClue: (locId: LocationId, clueId: string) => void;
  onRequestHint: (locId: LocationId, nextLevel: 1 | 2 | 3) => void;
  onSaveLocation: (locId: LocationId, notes: string, initialProposal: string) => void;
  onBackToHq: () => void;
  onProceedToPhase2: () => void;
  onToggleSound?: () => void;
}

type SimulatorModalType = 'none' | 'journal' | 'badges' | 'inventory' | 'pause';

const INTRO_SEEN_KEY = 'ejen_3d_intro_seen_v1';

export function Phase1Investigation({
  state,
  activeLocationId,
  onSelectLocation,
  onDiscoverClue,
  onRequestHint,
  onSaveLocation,
  onBackToHq,
  onProceedToPhase2,
  onToggleSound,
}: Phase1InvestigationProps) {
  const loc = LOCATION_MAP[activeLocationId];
  const inv = state.investigations[activeLocationId];

  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [notes, setNotes] = useState(inv.notes);
  const [proposal, setProposal] = useState(inv.initialProposal);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  // Simulator States
  const [activeModal, setActiveModal] = useState<SimulatorModalType>('none');
  const [sprintLocked, setSprintLocked] = useState(false);
  const [toastClueId, setToastClueId] = useState<string | null>(null);
  const [toastClueLocationId, setToastClueLocationId] = useState<LocationId>(activeLocationId);
  const [customDialogue, setCustomDialogue] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [telemetry, setTelemetry] = useState<SimulatorTelemetry>({
    playerX: 0,
    playerZ: 15.8,
    playerYaw: Math.PI,
    isMoving: false,
    isRunning: false,
    isGrounded: true,
    nearbyZoneId: null,
    nearbyClueId: null,
    nearbyClueLocationId: null,
    currentAreaName: 'Dataran Utama Sekolah',
  });

  // Cinematic Reveal Intro state (plays once per session unless replayed)
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.sessionStorage.getItem(INTRO_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [introPhase, setIntroPhase] = useState<IntroScenePhase | null>(() =>
    showIntro ? 'darkness' : null
  );

  const simRef = useRef<CampusSimulatorHandle | null>(null);
  const minimapArrowRef = useRef<HTMLDivElement | null>(null);
  const minimapPlayerDotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNotes(inv.notes);
    setProposal(inv.initialProposal);
    setActiveClueId(inv.discoveredClueIds[inv.discoveredClueIds.length - 1] || null);
    setError('');
    setSavedNotice(false);
  }, [activeLocationId, inv.notes, inv.initialProposal]);

  const handleCompleteIntro = () => {
    try {
      window.sessionStorage.setItem(INTRO_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    setShowIntro(false);
    setIntroPhase(null);
    simRef.current?.resetToPlaza();
  };

  const handleReplayIntro = () => {
    if (state.soundEnabled) gameAudio.playTransition();
    setActiveModal('none');
    setIntroPhase('darkness');
    setShowIntro(true);
  };

  const handleClueClick = useCallback(
    (clueId: string, targetLocationId: LocationId = activeLocationId) => {
      if (targetLocationId !== activeLocationId) {
        onSelectLocation(targetLocationId);
      }
      setActiveClueId(clueId);
      setToastClueId(clueId);
      setToastClueLocationId(targetLocationId);
      setError('');
      onDiscoverClue(targetLocationId, clueId);

      const discoveredObj = LOCATION_MAP[targetLocationId].clues.find((c) => c.id === clueId);
      if (discoveredObj) {
        setCustomDialogue(discoveredObj.profesorReaction);
      }
    },
    [activeLocationId, onDiscoverClue, onSelectLocation]
  );

  const handleEnterLocation = useCallback(
    (locId: LocationId) => {
      if (locId !== activeLocationId) {
        onSelectLocation(locId);
      }
      if (state.soundEnabled) gameAudio.playTransition();
      setCustomDialogue(null);
      setActiveModal('journal');
    },
    [activeLocationId, onSelectLocation, state.soundEnabled]
  );

  const handleTeleportZone = useCallback(
    (locId: LocationId) => {
      if (locId !== activeLocationId) {
        onSelectLocation(locId);
      }
      if (state.soundEnabled) gameAudio.playTransition();
      setActiveModal('none');
      setCustomDialogue(
        `Kita sudah tiba di ${LOCATION_MAP[locId].name}. Periksa objek berkilau atau tekan [E] untuk siasatan!`
      );
      simRef.current?.teleportToZone(locId);
    },
    [activeLocationId, onSelectLocation, state.soundEnabled]
  );

  const handleHintClick = () => {
    const nextLevel = Math.min(3, inv.hintLevelUsed + 1) as 1 | 2 | 3;
    onRequestHint(activeLocationId, nextLevel);
    const hintText = loc.hints[nextLevel - 1] || loc.hints[0];
    setCustomDialogue(hintText);
  };

  const handleTogglePause = useCallback(() => {
    setActiveModal((prev) => (prev === 'none' ? 'pause' : 'none'));
  }, []);

  const handleInteractPrompt = useCallback(() => {
    if (telemetry.nearbyClueId && telemetry.nearbyClueLocationId) {
      handleClueClick(telemetry.nearbyClueId, telemetry.nearbyClueLocationId);
    } else if (telemetry.nearbyZoneId) {
      handleEnterLocation(telemetry.nearbyZoneId);
    }
  }, [handleClueClick, handleEnterLocation, telemetry.nearbyClueId, telemetry.nearbyClueLocationId, telemetry.nearbyZoneId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateLocationSave(state, activeLocationId, notes, proposal);
    if (!check.valid) {
      if (state.soundEnabled) gameAudio.playError();
      setError(check.error || 'Sila lengkapkan maklumat lokasi.');
      return;
    }
    setError('');
    onSaveLocation(activeLocationId, notes.trim(), proposal.trim());
    setSavedNotice(true);
    setCustomDialogue(
      `Syabas, Ejen! Fail laporan ${loc.name} telah disimpan. Teruskan meneroka lokasi seterusnya.`
    );
  };

  const all4Done = isPhase1Complete(state);
  const earnedBadgeIds = getEarnedBadgeIds(state);
  const rank = getAgentRank(state.xp, state.finalReportSaved);

  const nearbyZone = telemetry.nearbyZoneId ? LOCATION_MAP[telemetry.nearbyZoneId] : null;
  const hudDialogueText =
    customDialogue ||
    (nearbyZone
      ? `Anda berada di ${nearbyZone.name}. Tekan [E] untuk siasat fail lokasi atau cari objek berkilau.`
      : all4Done
        ? 'Syabas, Ejen! Kesemua 4 lokasi lengkap. Klik butang Fasa 2 atau semak Jurnal Detektif.'
        : 'Bagus, Ejen! Teruskan penerokaan dan kumpul bukti di setiap lokasi sekolah.');

  const isPaused = activeModal !== 'none';

  return (
    <div className="relative w-full h-[calc(100vh-4.1rem)] min-h-[600px] overflow-hidden bg-[#103D30] text-[#26382F]">
      {/* =====================================================================
          FULL-VIEWPORT 3D THIRD-PERSON DETECTIVE SCHOOL SIMULATOR
         ===================================================================== */}
      <ErrorBoundary
        compact
        fallbackTitle="Simulator 3D Tergendala"
        fallbackMessage="Paparan 3D kampus mengalami gangguan WebGL sementara. Anda masih boleh meneruskan siasatan melalui Jurnal Detektif atau memuatkan semula paparan."
      >
        <CampusThirdPersonViewport
          ref={simRef}
          state={state}
          activeLocationId={activeLocationId}
          activeClueId={activeClueId}
          paused={isPaused}
          sprintLocked={sprintLocked}
          reducedMotion={reducedMotion}
          introPhase={showIntro ? introPhase : null}
          minimapArrowRef={minimapArrowRef}
          minimapPlayerDotRef={minimapPlayerDotRef}
          onTelemetry={(next) => {
            setTelemetry(next);
            if (next.nearbyZoneId && next.nearbyZoneId !== activeLocationId) {
              onSelectLocation(next.nearbyZoneId);
            }
          }}
          onEnterLocation={handleEnterLocation}
          onInteractClue={(locId, clueId) => handleClueClick(clueId, locId)}
          onTogglePause={handleTogglePause}
          onToggleSprint={() => setSprintLocked((s) => !s)}
        />
      </ErrorBoundary>

      {/* Cinematic Reveal Intro Overlay */}
      {showIntro && (
        <CinematicRevealIntro
          soundEnabled={state.soundEnabled}
          reducedMotion={reducedMotion}
          onSceneChange={setIntroPhase}
          onComplete={handleCompleteIntro}
          onToggleSound={() => onToggleSound?.()}
        />
      )}

      {/* =====================================================================
          IN-GAME DETECTIVE HUD OVERLAY
         ===================================================================== */}
      {!showIntro && (
        <SimulatorHud
          state={state}
          activeLocationId={activeLocationId}
          telemetry={telemetry}
          sprintLocked={sprintLocked}
          dialogueText={hudDialogueText}
          toastClueId={toastClueId}
          toastClueLocationId={toastClueLocationId}
          minimapArrowRef={minimapArrowRef}
          minimapPlayerDotRef={minimapPlayerDotRef}
          onToggleSprint={() => {
            if (state.soundEnabled) gameAudio.playClick();
            setSprintLocked((s) => !s);
          }}
          onAdvanceHint={handleHintClick}
          onOpenJournal={() => {
            if (state.soundEnabled) gameAudio.playClick();
            setActiveModal('journal');
          }}
          onOpenBadges={() => {
            if (state.soundEnabled) gameAudio.playClick();
            setActiveModal('badges');
          }}
          onOpenInventory={() => {
            if (state.soundEnabled) gameAudio.playClick();
            setActiveModal('inventory');
          }}
          onOpenPauseMenu={() => {
            if (state.soundEnabled) gameAudio.playClick();
            setActiveModal('pause');
          }}
          onBackToHq={onBackToHq}
          onProceedToPhase2={onProceedToPhase2}
          onTeleportZone={handleTeleportZone}
          onInteractPrompt={handleInteractPrompt}
          onDismissToast={() => setToastClueId(null)}
        />
      )}

      {/* =====================================================================
          MODAL 1: DETECTIVE ECO-RESCUE — CSI SCANNER INVESTIGATION WORKSPACE
         ===================================================================== */}
      {activeModal === 'journal' && (
        <CsiInvestigationModal
          state={state}
          activeLocationId={activeLocationId}
          activeClueId={activeClueId}
          notes={notes}
          proposal={proposal}
          error={error}
          savedNotice={savedNotice}
          dialogueOverride={customDialogue}
          onSelectLocation={(locId) => {
            if (state.soundEnabled) gameAudio.playClick();
            setCustomDialogue(null);
            onSelectLocation(locId);
          }}
          onCollectClue={(clueId) => handleClueClick(clueId, activeLocationId)}
          onAdvanceHint={handleHintClick}
          onNotesChange={(val) => {
            setNotes(val);
            setSavedNotice(false);
            if (error) setError('');
          }}
          onProposalChange={(val) => {
            setProposal(val);
            setSavedNotice(false);
            if (error) setError('');
          }}
          onSave={handleSave}
          onTeleportZone={handleTeleportZone}
          onProceedToPhase2={onProceedToPhase2}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* =====================================================================
          MODAL 2: LENCANA EJEN & PANGKAT
         ===================================================================== */}
      {activeModal === 'badges' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Lencana Ejen"
          className="absolute inset-0 z-40 bg-[#0B261E]/85 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[#F5E8CF] border-[3px] border-[#E7C878] shadow-2xl overflow-hidden">
            <div className="bg-[#103D30] text-[#FFF4CC] px-5 py-3.5 border-b-2 border-[#E7C878] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-[#E7C878]" />
                <div>
                  <h2 className="font-display text-lg font-bold text-[#FFFFFF]">
                    Galeri Lencana Ejen
                  </h2>
                  <p className="text-xs text-[#E7C878] font-mono-tabular">
                    Pangkat: {rank} · {state.xp} XP · {earnedBadgeIds.length}/{BADGES.length}{' '}
                    Lencana
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="px-3 py-1.5 rounded-lg bg-[#E7C878] text-[#103D30] text-xs font-extrabold"
              >
                Tutup
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto">
              {BADGES.map((badge) => {
                const earned = earnedBadgeIds.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-3.5 border-2 flex items-center gap-3 ${
                      earned
                        ? 'bg-[#FFFFFF] border-[#E7C878] shadow'
                        : 'bg-[#EADBC0]/70 border-[#A8C5A0]/60 opacity-80'
                    }`}
                  >
                    <CollectibleBadgeShield
                      badgeId={badge.id}
                      earned={earned}
                      className="w-12 h-14 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-[#103D30]">{badge.name}</p>
                      <p className="text-xs text-[#4A6358] leading-snug mt-0.5">
                        {badge.description}
                      </p>
                      <span
                        className={`inline-block mt-1.5 text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded ${
                          earned ? 'bg-[#174C39] text-[#E7C878]' : 'bg-[#CBD5E1] text-[#334155]'
                        }`}
                      >
                        {earned ? 'TERBUKA' : 'TERKUNCI'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: INVENTORI BUKTI & PETA PANTAS
         ===================================================================== */}
      {activeModal === 'inventory' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inventori Bukti Sekolah"
          className="absolute inset-0 z-40 bg-[#0B261E]/85 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-[#F5E8CF] border-[3px] border-[#E7C878] shadow-2xl overflow-hidden">
            <div className="bg-[#103D30] text-[#FFF4CC] px-5 py-3.5 border-b-2 border-[#E7C878] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Backpack className="w-5 h-5 text-[#E7C878]" />
                <div>
                  <h2 className="font-display text-lg font-bold text-[#FFFFFF]">
                    Inventori Bukti &amp; Navigasi Kampus
                  </h2>
                  <p className="text-xs text-[#E7C878]">
                    Pilih lokasi untuk bergerak pantas atau semak senarai bukti ditemui
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="px-3 py-1.5 rounded-lg bg-[#E7C878] text-[#103D30] text-xs font-extrabold"
              >
                Tutup
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[72vh] overflow-y-auto">
              {LOCATIONS.map((item) => {
                const itemInv = state.investigations[item.id];
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-[#FFFFFF] border-2 border-[#A8C5A0] p-4 shadow-sm flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-base font-bold text-[#103D30]">
                          {item.name}
                        </h3>
                        <span
                          className={`text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded ${
                            itemInv.completed
                              ? 'bg-[#22C55E] text-[#FFFFFF]'
                              : 'bg-[#DCE9D9] text-[#174C39]'
                          }`}
                        >
                          {itemInv.completed
                            ? 'Selesai'
                            : `${itemInv.discoveredClueIds.length}/${item.clues.length} Bukti`}
                        </span>
                      </div>

                      <ul className="space-y-1">
                        {item.clues.map((c) => {
                          const found = itemInv.discoveredClueIds.includes(c.id);
                          return (
                            <li
                              key={c.id}
                              className="text-xs flex items-center gap-1.5 text-[#26382F]"
                            >
                              <CheckCircle2
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  found ? 'text-[#22C55E]' : 'text-[#94A3B8]'
                                }`}
                              />
                              <span className={found ? 'font-semibold' : 'text-[#64748B]'}>
                                {found ? c.label : 'Petunjuk belum ditemui'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#DCE9D9]">
                      <button
                        type="button"
                        onClick={() => handleTeleportZone(item.id)}
                        className="flex-1 py-2 px-3 rounded-lg bg-[#174C39] hover:bg-[#103D30] text-[#FFF4CC] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <Compass className="w-3.5 h-3.5 text-[#E7C878]" />
                        <span>Pergi Lokasi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLocation(item.id);
                          setActiveModal('journal');
                        }}
                        className="py-2 px-3 rounded-lg bg-[#E7C878] hover:bg-[#f0d68c] text-[#103D30] text-xs font-extrabold"
                      >
                        Jurnal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: ESCAPE / PAUSE MENU
         ===================================================================== */}
      {activeModal === 'pause' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Jeda Simulator"
          className="absolute inset-0 z-40 bg-[#0B261E]/85 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#103D30] border-[3px] border-[#E7C878] text-[#FFF4CC] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E7C878]/40 pb-3">
              <div>
                <p className="text-[10px] font-mono-tabular font-bold uppercase tracking-widest text-[#E7C878]">
                  SIMULATOR PENYIASATAN 3D
                </p>
                <h2 className="font-display text-xl font-bold text-[#FFFFFF]">Menu Operasi</h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                aria-label="Teruskan permainan"
                className="p-1.5 rounded-lg bg-[#174C39] hover:bg-[#1E5C45] text-[#E7C878]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveModal('none')}
                className="w-full min-h-[44px] rounded-xl bg-[#E7C878] hover:bg-[#f0d68c] text-[#103D30] font-extrabold text-sm inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Teruskan Penerokaan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('journal')}
                className="w-full min-h-[42px] rounded-xl bg-[#174C39] hover:bg-[#1E5C45] border border-[#E7C878]/60 text-[#FFF4CC] font-bold text-sm inline-flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#E7C878]" />
                <span>Buka Jurnal Detektif ({loc.shortName})</span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    simRef.current?.resetToPlaza();
                    setActiveModal('none');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#174C39] hover:bg-[#1E5C45] border border-[#E7C878]/40 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#E7C878]" />
                  <span>Dataran Utama</span>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleSound?.()}
                  className="py-2.5 px-3 rounded-xl bg-[#174C39] hover:bg-[#1E5C45] border border-[#E7C878]/40 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  {state.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[#E7C878]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-[#E7C878]" />
                  )}
                  <span>{state.soundEnabled ? 'Bunyi: Hidup' : 'Bunyi: Senyap'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReducedMotion((r) => !r)}
                  className="py-2.5 px-3 rounded-xl bg-[#174C39] hover:bg-[#1E5C45] border border-[#E7C878]/40 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Wind className="w-3.5 h-3.5 text-[#E7C878]" />
                  <span>{reducedMotion ? 'Gerak Minimum' : 'Animasi Penuh'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReplayIntro}
                  className="py-2.5 px-3 rounded-xl bg-[#174C39] hover:bg-[#1E5C45] border border-[#E7C878]/40 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5 text-[#E7C878]" />
                  <span>Main Intro</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#E7C878]/35">
                <p className="text-[11px] font-bold text-[#E7C878] mb-1.5">
                  Pergerakan Pantas ke Lokasi:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {LOCATIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTeleportZone(item.id)}
                      className="py-2 px-2.5 rounded-lg bg-[#0B2C22] hover:bg-[#174C39] border border-[#E7C878]/40 text-xs font-semibold text-left truncate flex items-center justify-between"
                    >
                      <span className="truncate">{item.name}</span>
                      {state.investigations[item.id].completed && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onBackToHq}
                className="w-full min-h-[42px] mt-2 rounded-xl bg-[#0B2C22] hover:bg-[#174C39] border border-[#E7C878]/50 text-[#F5E8CF] font-bold text-xs inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4 text-[#E7C878]" />
                <span>Kembali ke Pusat Operasi (HQ)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
