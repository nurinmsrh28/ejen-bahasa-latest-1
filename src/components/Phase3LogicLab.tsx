import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  Search,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { gameAudio } from '../game/audio';
import { LOCATION_MAP, LOGIC_CHALLENGES } from '../game/data';
import { areLogicChallengesComplete, isPhase3Complete } from '../game/rules';
import type { GameState, LocationId } from '../game/types';
import { DetectiveEvidenceScanner } from './DetectiveEvidenceScanner';

interface Phase3LogicLabProps {
  state: GameState;
  onSelectLogicOption: (challengeId: string, optionId: 'A' | 'B') => void;
  onSaveReasons: (reasons: Record<LocationId, string>) => void;
  onBackToHq: () => void;
  onProceedToPhase4: () => void;
}

type CaseProgressStatus =
  | 'Belum bermula'
  | 'Sedang dianalisis'
  | 'Jawapan telah disimpan'
  | 'Selesai';

const PROGRESS_CASE_ITEMS: {
  challengeId: string;
  locId: LocationId;
  label: string;
}[] = [
  { challengeId: 'logic_kantin', locId: 'kantin', label: 'Kes 1: Kantin Ceria' },
  { challengeId: 'logic_kelas', locId: 'kelas', label: 'Kes 2: Kelas Harmoni' },
  { challengeId: 'logic_taman', locId: 'taman', label: 'Kes 3: Taman Rekreasi' },
];

function SecretFileOpeningArt({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative w-44 h-36 mx-auto flex items-center justify-center">
      <svg
        viewBox="0 0 180 140"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Folder Back */}
        <path
          d="M22 36C22 30.4772 26.4772 26 32 26H68L78 36H148C153.523 36 158 40.4772 158 46V114C158 119.523 153.523 124 148 124H32C26.4772 124 22 119.523 22 114V36Z"
          fill="#795A40"
          stroke="#5C422D"
          strokeWidth="2.5"
        />

        {/* Emerging Secret Document Sheet */}
        <motion.g
          initial={{ y: 18, opacity: 0.5 }}
          animate={{ y: isOpen ? -14 : 8, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect
            x="38"
            y="24"
            width="104"
            height="76"
            rx="6"
            fill="#F5F0E5"
            stroke="#E7C878"
            strokeWidth="2.2"
          />
          <line x1="50" y1="40" x2="108" y2="40" stroke="#315C48" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="50" y1="52" x2="128" y2="52" stroke="#A8C5A0" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="62" x2="118" y2="62" stroke="#A8C5A0" strokeWidth="3" strokeLinecap="round" />
          <rect x="50" y="72" width="44" height="14" rx="3" fill="#E7C878" fillOpacity="0.32" stroke="#E7C878" strokeWidth="1.5" />
          <text
            x="72"
            y="82"
            textAnchor="middle"
            fill="#6E5338"
            fontSize="7.5"
            fontWeight="bold"
            fontFamily="monospace"
          >
            SULIT
          </text>
        </motion.g>

        {/* Folder Front Flap */}
        <path
          d="M22 58C22 53.5817 25.5817 50 30 50H150C154.418 50 158 53.5817 158 58V114C158 119.523 153.523 124 148 124H32C26.4772 124 22 119.523 22 114V58Z"
          fill="#DCE9D9"
          stroke="#6E5338"
          strokeWidth="2.5"
        />
        {/* Academy Gold Seal */}
        <circle cx="90" cy="88" r="14" fill="#315C48" stroke="#E7C878" strokeWidth="2.5" />
        <path d="M84 88L88 92L97 83" stroke="#E7C878" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Moving Magnifying Glass Scanner */}
      <motion.div
        aria-hidden="true"
        className="absolute pointer-events-none"
        animate={{
          x: [-24, 24, -10, -24],
          y: [-8, 6, -12, -8],
          rotate: [-6, 8, -4, -6],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div className="w-12 h-12 rounded-full bg-[#DCE9D9]/85 border-[3px] border-[#E7C878] shadow-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-[#315C48]" />
        </div>
      </motion.div>
    </div>
  );
}

export function Phase3LogicLab({
  state,
  onSelectLogicOption,
  onSaveReasons,
  onBackToHq,
  onProceedToPhase4,
}: Phase3LogicLabProps) {
  const [missionStarted, setMissionStarted] = useState<boolean>(true);
  const [fileOpened, setFileOpened] = useState<boolean>(false);
  const [labSoundEnabled, setLabSoundEnabled] = useState<boolean>(state.soundEnabled);

  // Pending selections allow students to switch between A & B before confirming
  const [pendingSelections, setPendingSelections] = useState<Record<string, 'A' | 'B' | undefined>>(() => ({
    ...state.logicChallengeAnswers,
  }));

  // Track which challenges have been confirmed (reveals feedback only AFTER confirming)
  const [confirmedChallenges, setConfirmedChallenges] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const ch of LOGIC_CHALLENGES) {
      if (state.logicChallengeAnswers[ch.id]) {
        initial[ch.id] = true;
      }
    }
    return initial;
  });

  const [draftReasons, setDraftReasons] = useState<Record<LocationId, string>>({
    kantin: state.opinions.kantin.reasonText,
    kelas: state.opinions.kelas.reasonText,
    perpustakaan: state.opinions.perpustakaan.reasonText,
    taman: state.opinions.taman.reasonText,
  });

  const [typingLoc, setTypingLoc] = useState<LocationId | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [celebrationVisible, setCelebrationVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFileOpened(true), 220);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    setLabSoundEnabled(state.soundEnabled);
  }, [state.soundEnabled]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  const handleToggleLabSound = () => {
    const next = !labSoundEnabled;
    setLabSoundEnabled(next);
    gameAudio.setEnabled(next);
    if (next) {
      gameAudio.playClick();
    }
  };

  const handleStartMission = () => {
    if (labSoundEnabled) {
      gameAudio.playHint();
    }
    setMissionStarted(true);
  };

  const handlePickOption = (challengeId: string, optId: 'A' | 'B') => {
    if (labSoundEnabled) {
      gameAudio.playClick();
    }
    setError('');
    setPendingSelections((prev) => ({ ...prev, [challengeId]: optId }));
    // Switching option resets confirmation until scanned
    setConfirmedChallenges((prev) => ({ ...prev, [challengeId]: false }));
  };

  const handleConfirmOption = (challengeId: string) => {
    const chosenId = pendingSelections[challengeId];
    if (!chosenId) return;
    setError('');
    setConfirmedChallenges((prev) => ({ ...prev, [challengeId]: true }));
    onSelectLogicOption(challengeId, chosenId);
  };

  const handleReasonChange = (locId: LocationId, value: string) => {
    setDraftReasons((prev) => ({ ...prev, [locId]: value }));
    setSavedNotice(false);
    if (error) setError('');

    setTypingLoc(locId);
    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      setTypingLoc((curr) => (curr === locId ? null : curr));
    }, 650);
  };

  const challengesPassed = areLogicChallengesComplete(state);
  const phase3Done = isPhase3Complete(state);

  const handleClearReason = (locId: LocationId) => {
    setDraftReasons((prev) => ({ ...prev, [locId]: '' }));
    setSavedNotice(false);
    if (error) setError('');
  };

  const handleSaveSingleReason = (locId: LocationId): boolean => {
    if ((draftReasons[locId] || '').trim().length < 10) {
      setError(
        `Sila tulis alasan yang relevan bagi menyokong pendapat anda untuk ${LOCATION_MAP[locId].name} (sekurang-kurangnya 10 aksara).`
      );
      return false;
    }

    setError('');
    onSaveReasons(draftReasons);

    const allSelectedValid =
      state.selectedEvidenceIds.length >= 2 &&
      state.selectedEvidenceIds.every((id) => (draftReasons[id] || '').trim().length >= 10);

    if (challengesPassed && allSelectedValid) {
      setSavedNotice(true);
      setCelebrationVisible(true);
    }

    return true;
  };

  const handleSubmitReasons = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengesPassed) {
      setError(
        'Sila imbas dan sahkan jawapan relevan bagi kesemua 3 kes dalam Pengimbas Bukti dahulu.'
      );
      return;
    }

    for (const locId of state.selectedEvidenceIds) {
      if ((draftReasons[locId] || '').trim().length < 10) {
        setError(
          `Sila tulis alasan yang relevan bagi menyokong pendapat anda untuk ${LOCATION_MAP[locId].name} (sekurang-kurangnya 10 aksara).`
        );
        return;
      }
    }

    setError('');
    onSaveReasons(draftReasons);
    setSavedNotice(true);
    setCelebrationVisible(true);
  };

  // Compute progress status for KEMAJUAN PENYIASATAN panel
  const getCaseProgressStatus = (
    challengeId: string,
    locId: LocationId
  ): CaseProgressStatus => {
    const ch = LOGIC_CHALLENGES.find((c) => c.id === challengeId);
    const savedAns = state.logicChallengeAnswers[challengeId];
    const pendingAns = pendingSelections[challengeId];
    const isPartAConfirmed = Boolean(confirmedChallenges[challengeId] && savedAns);
    const isPartACorrect = Boolean(
      isPartAConfirmed && ch?.options.find((o) => o.id === savedAns)?.isRelevant
    );

    const isSelectedInPhase2 = state.selectedEvidenceIds.includes(locId);
    const savedReason = (state.opinions[locId]?.reasonText || '').trim();
    const draftReason = (draftReasons[locId] || '').trim();

    if (isSelectedInPhase2) {
      if (isPartACorrect && savedReason.length >= 10) {
        return 'Selesai';
      }
      if (savedReason.length >= 10) {
        return 'Jawapan telah disimpan';
      }
      if (isPartACorrect || isPartAConfirmed || Boolean(pendingAns) || draftReason.length > 0) {
        return 'Sedang dianalisis';
      }
      return 'Belum bermula';
    }

    // If this location wasn't selected in Phase 2, its completion tracks Part A + overall Phase 3 reasons
    const allSelectedReasonsSaved =
      state.selectedEvidenceIds.length >= 2 &&
      state.selectedEvidenceIds.every(
        (id) => (state.opinions[id]?.reasonText || '').trim().length >= 10
      );

    if (isPartACorrect && allSelectedReasonsSaved) {
      return 'Selesai';
    }
    if (isPartACorrect) {
      return 'Jawapan telah disimpan';
    }
    if (isPartAConfirmed || Boolean(pendingAns)) {
      return 'Sedang dianalisis';
    }
    return 'Belum bermula';
  };

  const progressStatuses = PROGRESS_CASE_ITEMS.map((item) => ({
    ...item,
    status: getCaseProgressStatus(item.challengeId, item.locId),
  }));

  const completedCaseCount = progressStatuses.filter((p) => p.status === 'Selesai').length;
  const savedOrDoneScore = progressStatuses.reduce((acc, p) => {
    if (p.status === 'Selesai') return acc + 1;
    if (p.status === 'Jawapan telah disimpan') return acc + 0.7;
    if (p.status === 'Sedang dianalisis') return acc + 0.35;
    return acc;
  }, 0);
  const progressRatio = Math.min(1, savedOrDoneScore / PROGRESS_CASE_ITEMS.length);

  // 1. ANIMASI PEMBUKAAN MISI
  if (!missionStarted) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 text-[#26382F]">
        <div className="flex items-center justify-between gap-4 mb-5">
          <button
            type="button"
            onClick={onBackToHq}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#6E5338] hover:text-[#315C48] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Pusat Operasi
          </button>

          <button
            type="button"
            onClick={handleToggleLabSound}
            aria-label={labSoundEnabled ? 'Matikan bunyi makmal' : 'Hidupkan bunyi makmal'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#A8C5A0] text-xs font-semibold text-[#315C48] hover:bg-[#DCE9D9] transition-colors shadow-sm"
          >
            {labSoundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-[#315C48]" />
                Bunyi Aktif
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-[#6E5338]" />
                Bunyi Dimatikan
              </>
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#315C48] text-[#FFFFFF] rounded-3xl p-7 sm:p-10 border-4 border-[#E7C878] shadow-xl text-center space-y-6 relative overflow-hidden"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#264938] border border-[#E7C878]/70 text-xs font-mono-tabular font-bold text-[#E7C878]">
            <FlaskConical className="w-4 h-4" />
            <span>FORENSIC LAB · MAKMAL ANALISIS BUKTI</span>
          </div>

          <SecretFileOpeningArt isOpen={fileOpened} />

          <div className="space-y-3 max-w-2xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="font-display text-3xl sm:text-4xl font-bold text-[#E7C878] tracking-tight"
            >
              FASA 3 – BUKTIKAN TEORI EJEN
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.38 }}
              className="text-base sm:text-lg text-[#F5F0E5] font-medium"
            >
              “Teliti bukti, analisis pendapat dan buktikan alasan anda!”
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.55 }}
            className="pt-2 flex flex-col items-center gap-3"
          >
            <button
              type="button"
              onClick={handleStartMission}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#E7C878] hover:bg-[#F0D68C] text-[#26382F] font-bold text-base shadow-xl border-2 border-[#FFFFFF]/80 transition-transform active:scale-95"
            >
              <Search className="w-5 h-5" />
              MULA PENYIASATAN
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-xs text-[#DCE9D9]">
              Fail kes Profesor Nurin sedia untuk diimbas dan dianalisis.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <DetectiveEvidenceScanner
      state={state}
      pendingSelections={pendingSelections}
      confirmedChallenges={confirmedChallenges}
      draftReasons={draftReasons}
      labSoundEnabled={labSoundEnabled}
      error={error}
      savedNotice={savedNotice}
      celebrationVisible={celebrationVisible}
      onPickOption={handlePickOption}
      onConfirmOption={handleConfirmOption}
      onReasonChange={handleReasonChange}
      onClearReason={handleClearReason}
      onSaveSingleReason={handleSaveSingleReason}
      onSubmitReasons={handleSubmitReasons}
      onBackToHq={onBackToHq}
      onProceedToPhase4={onProceedToPhase4}
    />
  );
}
