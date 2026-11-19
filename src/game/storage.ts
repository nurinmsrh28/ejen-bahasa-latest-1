import { LOCATIONS } from './data';
import { createInitialGameState } from './rules';
import type { GameState, LocationId } from './types';

export const STORAGE_KEY = 'ejen_bahasa_operasi_v1';

export function getUserStorageKey(username?: string | null): string {
  const clean = (username || '').trim().toLowerCase();
  return clean ? `${STORAGE_KEY}:${clean}` : STORAGE_KEY;
}

export function normalizeClientGameState(parsed?: Partial<GameState> | null): GameState {
  const base = createInitialGameState();
  if (!parsed) return base;

  const validLocationIds = new Set<LocationId>(LOCATIONS.map((l) => l.id));
  const rawInvestigations =
    parsed.investigations && typeof parsed.investigations === 'object' ? parsed.investigations : {};
  const investigations = { ...base.investigations };
  for (const loc of LOCATIONS) {
    const baseInv = base.investigations[loc.id];
    const incomingInv = (rawInvestigations as Partial<GameState['investigations']>)[loc.id];
    const hintLevel = Number(incomingInv?.hintLevelUsed);
    investigations[loc.id] = {
      discoveredClueIds: Array.isArray(incomingInv?.discoveredClueIds)
        ? incomingInv.discoveredClueIds.filter((cid): cid is string => typeof cid === 'string')
        : [],
      hintLevelUsed:
        hintLevel === 1 || hintLevel === 2 || hintLevel === 3 ? hintLevel : baseInv.hintLevelUsed,
      notes: typeof incomingInv?.notes === 'string' ? incomingInv.notes : '',
      initialProposal:
        typeof incomingInv?.initialProposal === 'string' ? incomingInv.initialProposal : '',
      completed: Boolean(incomingInv?.completed),
      completedAt:
        typeof incomingInv?.completedAt === 'string' ? incomingInv.completedAt : undefined,
    };
  }

  const rawOpinions = parsed.opinions && typeof parsed.opinions === 'object' ? parsed.opinions : {};
  const opinions = { ...base.opinions };
  for (const loc of LOCATIONS) {
    const incomingOp = (rawOpinions as Partial<GameState['opinions']>)[loc.id];
    opinions[loc.id] = {
      locationId: loc.id,
      opinionText: typeof incomingOp?.opinionText === 'string' ? incomingOp.opinionText : '',
      reasonText: typeof incomingOp?.reasonText === 'string' ? incomingOp.reasonText : '',
    };
  }

  return {
    ...base,
    ...parsed,
    xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : base.xp,
    soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : base.soundEnabled,
    finalReportText:
      typeof parsed.finalReportText === 'string' ? parsed.finalReportText : base.finalReportText,
    finalReportSaved: Boolean(parsed.finalReportSaved),
    builderSaved: Boolean(parsed.builderSaved),
    investigations,
    opinions,
    selectedEvidenceIds: Array.isArray(parsed.selectedEvidenceIds)
      ? parsed.selectedEvidenceIds.filter((id): id is LocationId => validLocationIds.has(id))
      : [],
    awardedMilestones: Array.isArray(parsed.awardedMilestones)
      ? parsed.awardedMilestones.filter((m): m is string => typeof m === 'string')
      : [],
    logicChallengeAnswers:
      parsed.logicChallengeAnswers &&
      typeof parsed.logicChallengeAnswers === 'object' &&
      !Array.isArray(parsed.logicChallengeAnswers)
        ? parsed.logicChallengeAnswers
        : {},
    builderPlan:
      Array.isArray(parsed.builderPlan) && parsed.builderPlan.length > 0
        ? parsed.builderPlan.filter(
            (item) =>
              Boolean(item) &&
              typeof item === 'object' &&
              typeof item.uid === 'string' &&
              typeof item.assetId === 'string'
          )
        : base.builderPlan,
  };
}

export function loadDraftForUser(username?: string | null): GameState {
  try {
    const raw = window.localStorage.getItem(getUserStorageKey(username));
    if (!raw) return createInitialGameState();
    return normalizeClientGameState(JSON.parse(raw) as Partial<GameState>);
  } catch {
    return createInitialGameState();
  }
}

export function saveDraftForUser(username: string | null | undefined, state: GameState): void {
  try {
    window.localStorage.setItem(
      getUserStorageKey(username),
      JSON.stringify({
        ...state,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore quota errors gracefully
  }
}

export function clearDraftForUser(username?: string | null): GameState {
  try {
    window.localStorage.removeItem(getUserStorageKey(username));
  } catch {
    // Ignore storage access errors
  }
  return createInitialGameState();
}

/**
 * Adapter pattern so localStorage can be swapped or synced with backend
 * without changing UI components.
 */
export interface StorageAdapter {
  load(): GameState;
  save(state: GameState): void;
  clear(): GameState;
}

export const localStorageAdapter: StorageAdapter = {
  load(): GameState {
    return loadDraftForUser(null);
  },

  save(state: GameState): void {
    saveDraftForUser(null, state);
  },

  clear(): GameState {
    return clearDraftForUser(null);
  },
};

export function exportAgentRecordJson(state: GameState): void {
  const safeName = (state.profile?.name || 'ejen')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const payload = {
    aplikasi: 'Ejen Bahasa: Operasi Sekolah Impian',
    eksportPada: new Date().toISOString(),
    notaPenyimpanan: 'Rekod ini dieksport daripada penyimpanan setempat pelayar (localStorage).',
    dataEjen: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `rekod_${safeName || 'ejen'}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
