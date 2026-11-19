import {
  GRID_COLS,
  GRID_ROWS,
  INITIAL_BLUEPRINT_PLAN,
  LOCATIONS,
  LOCATION_MAP,
  LOGIC_CHALLENGES,
} from './data.ts';
import type {
  DesignActionType,
  FacilityAssetId,
  GameState,
  LocationId,
  PlacedFacility,
} from './types.ts';

export function createInitialGameState(): GameState {
  return {
    version: 1,
    profile: null,
    xp: 0,
    awardedMilestones: [],
    investigations: {
      kantin: {
        discoveredClueIds: [],
        hintLevelUsed: 0,
        notes: '',
        initialProposal: '',
        completed: false,
      },
      kelas: {
        discoveredClueIds: [],
        hintLevelUsed: 0,
        notes: '',
        initialProposal: '',
        completed: false,
      },
      perpustakaan: {
        discoveredClueIds: [],
        hintLevelUsed: 0,
        notes: '',
        initialProposal: '',
        completed: false,
      },
      taman: {
        discoveredClueIds: [],
        hintLevelUsed: 0,
        notes: '',
        initialProposal: '',
        completed: false,
      },
    },
    selectedEvidenceIds: [],
    opinions: {
      kantin: { locationId: 'kantin', opinionText: '', reasonText: '' },
      kelas: { locationId: 'kelas', opinionText: '', reasonText: '' },
      perpustakaan: { locationId: 'perpustakaan', opinionText: '', reasonText: '' },
      taman: { locationId: 'taman', opinionText: '', reasonText: '' },
    },
    logicChallengeAnswers: {},
    builderPlan: INITIAL_BLUEPRINT_PLAN.map((item) => ({ ...item })),
    builderSaved: false,
    finalReportText: '',
    finalReportSaved: false,
    soundEnabled: true,
    lastUpdated: new Date().toISOString(),
  };
}

export function getAgentRank(xp: number, finalReportSaved: boolean): string {
  if (finalReportSaved || xp >= 1000) return 'Arkitek Sekolah Impian';
  if (xp >= 600) return 'Ejen Pakar';
  if (xp >= 250) return 'Ejen Penyiasat';
  return 'Ejen Pelatih';
}

export function grantMilestoneXp(
  state: GameState,
  milestoneKey: string,
  amount: number
): { state: GameState; addedXp: number } {
  if (state.awardedMilestones.includes(milestoneKey)) {
    return { state, addedXp: 0 };
  }
  return {
    state: {
      ...state,
      xp: state.xp + amount,
      awardedMilestones: [...state.awardedMilestones, milestoneKey],
      lastUpdated: new Date().toISOString(),
    },
    addedXp: amount,
  };
}

export function getCompletedLocationsCount(state: GameState): number {
  return LOCATIONS.filter((loc) => state.investigations[loc.id]?.completed).length;
}

export function isPhase1Complete(state: GameState): boolean {
  return getCompletedLocationsCount(state) === LOCATIONS.length;
}

export function isPhase2Complete(state: GameState): boolean {
  if (state.selectedEvidenceIds.length < 2 || state.selectedEvidenceIds.length > 3) {
    return false;
  }
  return state.selectedEvidenceIds.every(
    (locId) => (state.opinions[locId]?.opinionText || '').trim().length >= 10
  );
}

export function areLogicChallengesComplete(state: GameState): boolean {
  return LOGIC_CHALLENGES.every((challenge) => {
    const answer = state.logicChallengeAnswers[challenge.id];
    const selectedOption = challenge.options.find((opt) => opt.id === answer);
    return Boolean(selectedOption?.isRelevant);
  });
}

export function isPhase3Complete(state: GameState): boolean {
  if (!isPhase2Complete(state)) return false;
  if (!areLogicChallengesComplete(state)) return false;
  return state.selectedEvidenceIds.every(
    (locId) => (state.opinions[locId]?.reasonText || '').trim().length >= 10
  );
}

export function getJustifiedFacilityCount(plan: PlacedFacility[]): number {
  return plan.filter((item) => (item.justification || '').trim().length >= 8).length;
}

export function isPhase4Complete(state: GameState): boolean {
  return state.builderSaved && getJustifiedFacilityCount(state.builderPlan) >= 2;
}

export function getUnlockedPhaseLevel(state: GameState): 1 | 2 | 3 | 4 | 5 {
  if (!isPhase1Complete(state)) return 1;
  if (!isPhase2Complete(state)) return 2;
  if (!isPhase3Complete(state)) return 3;
  if (!isPhase4Complete(state)) return 4;
  return 5;
}

export function getEarnedBadgeIds(state: GameState): string[] {
  const badges: string[] = [];
  if (isPhase1Complete(state)) badges.push('mata_helang');
  if (isPhase2Complete(state)) badges.push('penganalisis_kes');
  if (isPhase3Complete(state)) badges.push('ahli_logik');
  if (isPhase4Complete(state)) badges.push('pereka_bestari');
  if (state.finalReportSaved) badges.push('arkitek_impian');
  return badges;
}

export function getOverallProgressPercent(state: GameState): number {
  let points = 0;
  const maxPoints = 9;
  points += getCompletedLocationsCount(state); // max 4
  if (isPhase2Complete(state)) points += 1;
  if (areLogicChallengesComplete(state)) points += 1;
  if (isPhase3Complete(state)) points += 1;
  if (isPhase4Complete(state)) points += 1;
  if (state.finalReportSaved) points += 1;
  return Math.round((points / maxPoints) * 100);
}

export function validateLocationSave(
  state: GameState,
  locationId: LocationId,
  notes: string,
  initialProposal: string
): { valid: boolean; error?: string } {
  const locDef = LOCATION_MAP[locationId];
  const inv = state.investigations[locationId];
  if (inv.discoveredClueIds.length < locDef.clues.length) {
    return {
      valid: false,
      error: `Sila temui kesemua ${locDef.clues.length} petunjuk pada gambar sebelum menyimpan bukti.`,
    };
  }
  if (notes.trim().length < 8) {
    return {
      valid: false,
      error: 'Sila tulis catatan pemerhatian anda dengan lebih jelas (sekurang-kurangnya 8 aksara).',
    };
  }
  if (initialProposal.trim().length < 8) {
    return {
      valid: false,
      error: 'Sila tulis cadangan penyelesaian awal anda (sekurang-kurangnya 8 aksara).',
    };
  }
  return { valid: true };
}

export function validateEvidenceSelection(selectedIds: LocationId[]): {
  valid: boolean;
  error?: string;
} {
  if (selectedIds.length < 2) {
    return {
      valid: false,
      error: 'Sila pilih sekurang-kurangnya 2 bukti lokasi untuk dianalisis.',
    };
  }
  if (selectedIds.length > 3) {
    return {
      valid: false,
      error: 'Anda hanya perlu memilih 2 hingga 3 bukti lokasi sahaja.',
    };
  }
  return { valid: true };
}

export function countSentences(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  const segments = cleaned
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3);
  return segments.length;
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function validateFinalReport(text: string): {
  valid: boolean;
  sentenceCount: number;
  error?: string;
} {
  const sentenceCount = countSentences(text);
  if (text.trim().length < 20) {
    return {
      valid: false,
      sentenceCount,
      error: 'Sila tulis laporan pendapat anda dengan lebih lengkap.',
    };
  }
  if (sentenceCount < 3 || sentenceCount > 5) {
    return {
      valid: false,
      sentenceCount,
      error: `Laporan perlu mengandungi antara 3 hingga 5 ayat (kini: ${sentenceCount} ayat). Pastikan setiap ayat diakhiri dengan tanda noktah (.).`,
    };
  }
  return { valid: true, sentenceCount };
}

export function placeFacilityOnGrid(
  plan: PlacedFacility[],
  assetId: FacilityAssetId,
  row: number,
  col: number,
  uid: string
): PlacedFacility[] {
  if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) {
    return plan;
  }
  const filtered = plan.filter((item) => !(item.row === row && item.col === col));
  const defaultAction: DesignActionType = 'tambah_baharu';
  return [
    ...filtered,
    {
      uid,
      assetId,
      row,
      col,
      actionType: defaultAction,
      isOriginal: false,
    },
  ];
}

export function moveFacilityOnGrid(
  plan: PlacedFacility[],
  uid: string,
  targetRow: number,
  targetCol: number
): PlacedFacility[] {
  if (targetRow < 0 || targetRow >= GRID_ROWS || targetCol < 0 || targetCol >= GRID_COLS) {
    return plan;
  }
  const movingItem = plan.find((item) => item.uid === uid);
  if (!movingItem) return plan;

  const occupant = plan.find((item) => item.row === targetRow && item.col === targetCol);
  if (occupant && occupant.uid === uid) return plan;

  return plan.map((item) => {
    if (item.uid === uid) {
      return {
        ...item,
        row: targetRow,
        col: targetCol,
        actionType: item.actionType || 'susun_semula',
      };
    }
    if (occupant && item.uid === occupant.uid) {
      return {
        ...item,
        row: movingItem.row,
        col: movingItem.col,
      };
    }
    return item;
  });
}

export function removeFacilityFromGrid(plan: PlacedFacility[], uid: string): PlacedFacility[] {
  return plan.filter((item) => item.uid !== uid);
}

export function validateLoginInput(
  username: string,
  password: string
): { valid: boolean; error?: string } {
  if (username.trim().length < 3) {
    return {
      valid: false,
      error: 'Sila masukkan Nama Pengguna / ID Ejen (sekurang-kurangnya 3 aksara).',
    };
  }
  if (password.length < 4) {
    return {
      valid: false,
      error: 'Sila masukkan Kata Laluan anda (sekurang-kurangnya 4 aksara).',
    };
  }
  return { valid: true };
}

export function validateAgentIdentity(
  name: string,
  className: string,
  codenameBadge: string
): { valid: boolean; error?: string } {
  if (name.trim().length < 2) {
    return {
      valid: false,
      error: 'Sila masukkan Nama Penuh Ejen anda (sekurang-kurangnya 2 huruf).',
    };
  }
  if (className.trim().length < 2) {
    return {
      valid: false,
      error: 'Sila pilih atau masukkan Kelas anda terlebih dahulu.',
    };
  }
  if (!['Helang Bestari', 'Kanta Ilmu', 'Pena Emas', 'Arkitek Muda'].includes(codenameBadge)) {
    return {
      valid: false,
      error: 'Sila pilih salah satu daripada 4 gelaran pasukan rasmi.',
    };
  }
  return { valid: true };
}

/**
 * Generates a deterministic 21x21 visual QR matrix with 3 authentic finder squares
 * seeded by the agent's unique ID + full name for the Digital Agent Identity Card.
 */
export function generateQrMatrix(seed: string): boolean[][] {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const placeFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startRow + r][startCol + c] = isBorder || isCore;
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        grid[r][c] = (r + c) % 2 === 0;
        continue;
      }

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r][c] = (hash >>> 24) % 100 < 52;
    }
  }

  return grid;
}

