import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Award } from 'lucide-react';
import { DecisionCardModal, EvidenceDossierModal } from './components/DossierModals';
import { GameHud } from './components/GameHud';
import { HqDashboard } from './components/HqDashboard';
import { LandingScreen } from './components/LandingScreen';
import { LoginScreen } from './components/LoginScreen';
import { Phase1Investigation } from './components/Phase1Investigation';
import { Phase2Analysis } from './components/Phase2Analysis';
import { Phase3LogicLab } from './components/Phase3LogicLab';
import { Phase4Architect } from './components/Phase4Architect';
import { Phase5Report } from './components/Phase5Report';
import { ProfileScreen } from './components/ProfileScreen';
import { TeacherDashboardApp } from './components/teacher/TeacherDashboardApp';
import { gameAudio } from './game/audio';
import {
  fetchAuthSession,
  logoutAgent,
  saveServerAgentIdentity,
} from './game/authClient';
import { LOGIC_CHALLENGES } from './game/data';
import {
  areLogicChallengesComplete,
  createInitialGameState,
  getAgentRank,
  getJustifiedFacilityCount,
  grantMilestoneXp,
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
} from './game/rules';
import {
  clearDraftForUser,
  exportAgentRecordJson,
  normalizeClientGameState,
  saveDraftForUser,
} from './game/storage';
import {
  fetchStudentState,
  resetStudentState,
  saveStudentState,
} from './game/teacherClient';
import type {
  AgentProfile,
  AppScreen,
  AuthUser,
  GameState,
  LocationId,
  PlacedFacility,
} from './game/types';

export default function App() {
  const [state, setState] = useState<GameState>(() => createInitialGameState());
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [stateHydrated, setStateHydrated] = useState(false);

  const [screen, setScreen] = useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        return 'login';
      }
    }
    return 'title';
  });

  const [activeLocationId, setActiveLocationId] = useState<LocationId>('kantin');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [decisionDrawerOpen, setDecisionDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const hydrateAuthenticatedUser = useCallback(async (user: AuthUser) => {
    setAuthUser(user);
    if (user.accountRole === 'teacher') {
      setStateHydrated(true);
      setScreen('teacher');
      return;
    }
    const res = await fetchStudentState();
    if (res.ok && res.gameState) {
      const normalized = normalizeClientGameState(res.gameState);
      normalized.profile = user.profile || normalized.profile;
      setState(normalized);
      saveDraftForUser(user.username, normalized);
    } else {
      const fallback = createInitialGameState();
      fallback.profile = user.profile || null;
      setState(fallback);
    }
    setStateHydrated(true);
  }, []);

  useEffect(() => {
    let active = true;
    fetchAuthSession().then(async (res) => {
      if (!active) return;
      if (res.authenticated && res.user) {
        await hydrateAuthenticatedUser(res.user);
        if (!active) return;
        const params = new URLSearchParams(window.location.search);
        if (res.user.accountRole === 'teacher') {
          setScreen('teacher');
        } else if (params.get('autostart') === '1') {
          setScreen('hq');
        }
      } else {
        setAuthUser(null);
        setStateHydrated(false);
      }
    });
    return () => {
      active = false;
    };
  }, [hydrateAuthenticatedUser]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    gameAudio.setEnabled(state.soundEnabled);
    if (!authUser || authUser.accountRole !== 'student' || !stateHydrated) return;

    saveDraftForUser(authUser.username, state);
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
    }
    syncTimerRef.current = window.setTimeout(() => {
      void saveStudentState(state);
    }, 300);

    return () => {
      if (syncTimerRef.current) {
        window.clearTimeout(syncTimerRef.current);
      }
    };
  }, [state, authUser, stateHydrated]);

  useEffect(() => {
    document.body.dataset.state =
      screen === 'title' ? 'title' : screen === 'login' ? 'login' : 'playing';
  }, [screen]);

  const handleToggleSound = () => {
    setState((prev) => {
      const nextSound = !prev.soundEnabled;
      gameAudio.setEnabled(nextSound);
      if (!nextSound) setMusicPlaying(false);
      return { ...prev, soundEnabled: nextSound };
    });
  };

  const handleToggleMusic = () => {
    if (!state.soundEnabled) {
      setState((prev) => ({ ...prev, soundEnabled: true }));
      gameAudio.setEnabled(true);
    }
    const playing = gameAudio.toggleAmbient();
    setMusicPlaying(playing);
  };

  const handleLoginSuccess = async (user: AuthUser) => {
    gameAudio.playSuccess();
    setStateHydrated(false);
    await hydrateAuthenticatedUser(user);
    if (user.accountRole === 'teacher') {
      showToast(`Selamat kembali, ${user.profile?.name || user.username}. Membuka Pusat Kawalan Guru.`);
      setScreen('teacher');
    } else {
      showToast(`Akses dibenarkan! Selamat kembali, ${user.profile?.name || user.username}.`);
      setScreen('hq');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    gameAudio.playClick();
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    if (authUser?.accountRole === 'student' && stateHydrated) {
      await saveStudentState(state);
    }
    await logoutAgent();
    setAuthUser(null);
    setStateHydrated(false);
    setState(createInitialGameState());
    setEvidenceDrawerOpen(false);
    setDecisionDrawerOpen(false);
    setScreen('login');
    showToast('Anda telah log keluar daripada Portal Akademi Ejen Rahsia.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmProfile = async (
    name: string,
    className: string,
    codenameBadge: string
  ): Promise<AgentProfile | null> => {
    const res = await saveServerAgentIdentity({ name, className, codenameBadge });
    if (!res.ok || !res.profile) {
      throw new Error(res.error || 'Pengesahan identiti gagal.');
    }

    gameAudio.playSuccess();
    const verifiedProfile = res.profile;
    if (res.user) {
      setAuthUser(res.user);
    }

    setState((prev) => {
      const base: GameState = {
        ...prev,
        profile: verifiedProfile,
      };
      const xpRes = grantMilestoneXp(base, 'profile_created', 50);
      if (xpRes.addedXp > 0) {
        showToast(
          `Identiti disahkan (${verifiedProfile.agentId})! +${xpRes.addedXp} XP Ejen`
        );
      } else {
        showToast(`Rekod identiti (${verifiedProfile.agentId}) dikemas kini.`);
      }
      return xpRes.state;
    });

    return verifiedProfile;
  };

  const handleNavigatePhase = (targetScreen: AppScreen, locId?: LocationId) => {
    gameAudio.playClick();
    if (!authUser && targetScreen !== 'title' && targetScreen !== 'login') {
      setScreen('login');
      showToast('Sila log masuk terlebih dahulu untuk mengakses sistem operasi.');
      return;
    }
    if (targetScreen === 'teacher' && authUser?.accountRole !== 'teacher') {
      showToast('Akses ditolak: Papan pemuka guru hanya untuk akaun Guru Pembimbing.');
      return;
    }
    if (locId) setActiveLocationId(locId);
    setScreen(targetScreen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDiscoverClue = (locId: LocationId, clueId: string) => {
    setState((prev) => {
      const inv = prev.investigations[locId];
      if (inv.discoveredClueIds.includes(clueId)) {
        gameAudio.playClick();
        return prev;
      }
      gameAudio.playClueFound();
      const updated: GameState = {
        ...prev,
        investigations: {
          ...prev.investigations,
          [locId]: {
            ...inv,
            discoveredClueIds: [...inv.discoveredClueIds, clueId],
          },
        },
      };
      const res = grantMilestoneXp(updated, `clue_${clueId}`, 20);
      if (res.addedXp > 0) {
        showToast(`Bukti ditemui! +${res.addedXp} XP`);
      }
      return res.state;
    });
  };

  const handleRequestHint = (locId: LocationId, nextLevel: 1 | 2 | 3) => {
    gameAudio.playHint();
    setState((prev) => ({
      ...prev,
      investigations: {
        ...prev.investigations,
        [locId]: {
          ...prev.investigations[locId],
          hintLevelUsed: nextLevel,
        },
      },
    }));
  };

  const handleSaveLocation = (locId: LocationId, notes: string, initialProposal: string) => {
    gameAudio.playSuccess();
    setState((prev) => {
      const inv = prev.investigations[locId];
      let next: GameState = {
        ...prev,
        investigations: {
          ...prev.investigations,
          [locId]: {
            ...inv,
            notes,
            initialProposal,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
      };
      const resLoc = grantMilestoneXp(next, `loc_done_${locId}`, 80);
      next = resLoc.state;
      let gained = resLoc.addedXp;

      if (isPhase1Complete(next)) {
        const resBadge = grantMilestoneXp(next, 'badge_mata_helang', 60);
        next = resBadge.state;
        gained += resBadge.addedXp;
        if (resBadge.addedXp > 0) {
          showToast(`Lencana Mata Helang diperoleh! +${gained} XP`);
          return next;
        }
      }
      if (gained > 0) {
        showToast(`Bukti lokasi disimpan! +${gained} XP`);
      } else {
        showToast('Kemaskini bukti lokasi berjaya disimpan.');
      }
      return next;
    });
  };

  const handleSaveAnalysis = (
    selectedIds: LocationId[],
    opinionsByLoc: Record<LocationId, string>
  ) => {
    gameAudio.playSuccess();
    setState((prev) => {
      let next: GameState = {
        ...prev,
        selectedEvidenceIds: selectedIds,
        opinions: {
          kantin: { ...prev.opinions.kantin, opinionText: opinionsByLoc.kantin || '' },
          kelas: { ...prev.opinions.kelas, opinionText: opinionsByLoc.kelas || '' },
          perpustakaan: {
            ...prev.opinions.perpustakaan,
            opinionText: opinionsByLoc.perpustakaan || '',
          },
          taman: { ...prev.opinions.taman, opinionText: opinionsByLoc.taman || '' },
        },
      };

      if (isPhase2Complete(next)) {
        const res = grantMilestoneXp(next, 'phase2_complete', 150);
        next = res.state;
        if (res.addedXp > 0) {
          showToast(`Lencana Penganalisis Kes diperoleh! +${res.addedXp} XP`);
          return next;
        }
      }
      showToast('Ayat pendapat disimpan dalam Kad Keputusan Ejen.');
      return next;
    });
  };

  const handleSelectLogicOption = (challengeId: string, optionId: 'A' | 'B') => {
    const challenge = LOGIC_CHALLENGES.find((c) => c.id === challengeId);
    const chosen = challenge?.options.find((o) => o.id === optionId);
    if (chosen?.isRelevant) {
      gameAudio.playClueFound();
    } else {
      gameAudio.playError();
    }

    setState((prev) => {
      let next: GameState = {
        ...prev,
        logicChallengeAnswers: {
          ...prev.logicChallengeAnswers,
          [challengeId]: optionId,
        },
      };
      if (areLogicChallengesComplete(next)) {
        const res = grantMilestoneXp(next, 'logic_challenges_complete', 120);
        next = res.state;
        if (res.addedXp > 0) {
          showToast(`Semua cabaran Makmal Bukti lulus! +${res.addedXp} XP`);
        }
      }
      return next;
    });
  };

  const handleSaveReasons = (reasons: Record<LocationId, string>) => {
    gameAudio.playSuccess();
    setState((prev) => {
      let next: GameState = {
        ...prev,
        opinions: {
          kantin: { ...prev.opinions.kantin, reasonText: reasons.kantin || '' },
          kelas: { ...prev.opinions.kelas, reasonText: reasons.kelas || '' },
          perpustakaan: { ...prev.opinions.perpustakaan, reasonText: reasons.perpustakaan || '' },
          taman: { ...prev.opinions.taman, reasonText: reasons.taman || '' },
        },
      };
      if (isPhase3Complete(next)) {
        const res = grantMilestoneXp(next, 'phase3_complete', 130);
        next = res.state;
        if (res.addedXp > 0) {
          showToast(`Lencana Ahli Logik diperoleh! +${res.addedXp} XP`);
          return next;
        }
      }
      showToast('Alasan penyokong berjaya disimpan.');
      return next;
    });
  };

  const handleUpdateBuilderPlan = (plan: PlacedFacility[], markSaved: boolean) => {
    if (markSaved) gameAudio.playSuccess();
    setState((prev) => {
      let next: GameState = {
        ...prev,
        builderPlan: plan,
        builderSaved: markSaved ? true : prev.builderSaved,
      };
      if (markSaved && getJustifiedFacilityCount(plan) >= 2) {
        const res = grantMilestoneXp(next, 'phase4_complete', 200);
        next = res.state;
        if (res.addedXp > 0) {
          showToast(`Lencana Pereka Bestari diperoleh! +${res.addedXp} XP`);
        }
      }
      return next;
    });
  };

  const handleSaveFinalReport = (reportText: string) => {
    gameAudio.playSuccess();
    setState((prev) => {
      let next: GameState = {
        ...prev,
        finalReportText: reportText,
        finalReportSaved: true,
      };
      const res = grantMilestoneXp(next, 'phase5_complete', 250);
      next = res.state;
      if (res.addedXp > 0) {
        showToast(`Tahniah! Lencana Arkitek Sekolah Impian diperoleh! +${res.addedXp} XP`);
      } else {
        showToast('Laporan Sekolah Impian berjaya dikemas kini.');
      }
      return next;
    });
  };

  const handleResetGame = async () => {
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    const fresh = clearDraftForUser(authUser?.username);
    const serverRes = await resetStudentState();
    const nextState =
      serverRes.ok && serverRes.gameState
        ? normalizeClientGameState(serverRes.gameState)
        : {
            ...fresh,
            profile: authUser?.profile || null,
          };
    setState(nextState);
    setScreen('hq');
    showToast('Semua kemajuan operasi telah ditetapkan semula.');
  };

  // Strict Authentication & Role-Based Access Gate
  const effectiveScreen: AppScreen = (() => {
    if (screen !== 'title' && screen !== 'login' && !authUser) {
      return 'login';
    }
    if (authUser?.accountRole === 'teacher' && screen !== 'title' && screen !== 'login') {
      return 'teacher';
    }
    if (screen === 'teacher' && authUser?.accountRole !== 'teacher') {
      return authUser ? 'hq' : 'login';
    }
    return screen;
  })();

  const showHud =
    effectiveScreen !== 'title' &&
    effectiveScreen !== 'login' &&
    effectiveScreen !== 'profile' &&
    effectiveScreen !== 'teacher';

  const currentRank = getAgentRank(state.xp, state.finalReportSaved);

  if (effectiveScreen === 'teacher' && authUser && authUser.accountRole === 'teacher') {
    return (
      <>
        <TeacherDashboardApp
          teacher={authUser}
          soundEnabled={state.soundEnabled}
          onToggleSound={handleToggleSound}
          onTeacherUpdated={(updatedUser) => setAuthUser(updatedUser)}
          onLogout={handleLogout}
          onShowToast={showToast}
        />
        {toastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="no-print pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#123E34] text-[#FFFFFF] px-5 py-3 rounded-xl border-2 border-[#D9B45B] shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-[90vw]"
          >
            <Award className="w-5 h-5 text-[#D9B45B] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen paper-canvas flex flex-col">
      {showHud && (
        <GameHud
          state={state}
          authUser={authUser}
          currentScreen={effectiveScreen}
          musicPlaying={musicPlaying}
          onNavigate={(s) => handleNavigatePhase(s)}
          onOpenEvidenceDrawer={() => setEvidenceDrawerOpen(true)}
          onOpenDecisionDrawer={() => setDecisionDrawerOpen(true)}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1">
        {effectiveScreen === 'title' && (
          <LandingScreen
            hasSavedProfile={Boolean(authUser)}
            savedAgentName={authUser?.profile?.name || authUser?.username}
            soundEnabled={state.soundEnabled}
            musicPlaying={musicPlaying}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onStartNewOrContinue={() => {
              gameAudio.playClick();
              if (!authUser) {
                setScreen('login');
              } else if (authUser.accountRole === 'teacher') {
                setScreen('teacher');
              } else {
                setScreen('profile');
              }
            }}
            onResumeExisting={() => {
              gameAudio.playClick();
              if (!authUser) {
                setScreen('login');
              } else if (authUser.accountRole === 'teacher') {
                setScreen('teacher');
              } else {
                setScreen('hq');
              }
            }}
          />
        )}

        {effectiveScreen === 'login' && (
          <LoginScreen
            soundEnabled={state.soundEnabled}
            musicPlaying={musicPlaying}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onBack={() => {
              gameAudio.playClick();
              setScreen('title');
            }}
            onAuthenticated={handleLoginSuccess}
          />
        )}

        {effectiveScreen === 'profile' && authUser && (
          <ProfileScreen
            initialProfile={state.profile || authUser.profile}
            rankLabel={currentRank}
            onBack={() => handleNavigatePhase('hq')}
            onConfirmProfile={handleConfirmProfile}
            onProceedToHq={() => handleNavigatePhase('hq')}
          />
        )}

        {effectiveScreen === 'hq' && authUser && (
          <HqDashboard
            state={state}
            authUser={authUser}
            onNavigatePhase={handleNavigatePhase}
            onOpenEvidenceDrawer={() => setEvidenceDrawerOpen(true)}
            onOpenDecisionDrawer={() => setDecisionDrawerOpen(true)}
            onExportJson={() => exportAgentRecordJson(state)}
            onResetGame={handleResetGame}
            onLogout={handleLogout}
            onToggleSound={handleToggleSound}
          />
        )}

        {effectiveScreen === 'phase1' && authUser && (
          <Phase1Investigation
            state={state}
            activeLocationId={activeLocationId}
            onSelectLocation={(locId) => {
              gameAudio.playClick();
              setActiveLocationId(locId);
            }}
            onDiscoverClue={handleDiscoverClue}
            onRequestHint={handleRequestHint}
            onSaveLocation={handleSaveLocation}
            onBackToHq={() => handleNavigatePhase('hq')}
            onProceedToPhase2={() => handleNavigatePhase('phase2')}
            onToggleSound={handleToggleSound}
          />
        )}

        {effectiveScreen === 'phase2' && authUser && (
          <Phase2Analysis
            state={state}
            onSaveAnalysis={handleSaveAnalysis}
            onBackToHq={() => handleNavigatePhase('hq')}
            onProceedToPhase3={() => handleNavigatePhase('phase3')}
          />
        )}

        {effectiveScreen === 'phase3' && authUser && (
          <Phase3LogicLab
            state={state}
            onSelectLogicOption={handleSelectLogicOption}
            onSaveReasons={handleSaveReasons}
            onBackToHq={() => handleNavigatePhase('hq')}
            onProceedToPhase4={() => handleNavigatePhase('phase4')}
          />
        )}

        {effectiveScreen === 'phase4' && authUser && (
          <Phase4Architect
            state={state}
            onUpdatePlan={handleUpdateBuilderPlan}
            onBackToHq={() => handleNavigatePhase('hq')}
            onProceedToPhase5={() => handleNavigatePhase('phase5')}
            onPlayPlaceSound={() => gameAudio.playPlace()}
          />
        )}

        {effectiveScreen === 'phase5' && authUser && (
          <Phase5Report
            state={state}
            onSaveReport={handleSaveFinalReport}
            onBackToHq={() => handleNavigatePhase('hq')}
            onExportJson={() => exportAgentRecordJson(state)}
          />
        )}
      </main>

      {evidenceDrawerOpen && (
        <EvidenceDossierModal state={state} onClose={() => setEvidenceDrawerOpen(false)} />
      )}

      {decisionDrawerOpen && (
        <DecisionCardModal state={state} onClose={() => setDecisionDrawerOpen(false)} />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="no-print pointer-events-none fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-[#315C48] text-[#FFFFFF] px-5 py-3 rounded-xl border-2 border-[#E7C878] shadow-2xl flex items-center gap-3 text-sm font-semibold max-w-[90vw]"
        >
          <Award className="w-5 h-5 text-[#E7C878] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
