import { LOCATIONS, LOGIC_CHALLENGES } from './data.ts';
import {
  areLogicChallengesComplete,
  countSentences,
  countWords,
  getCompletedLocationsCount,
  getJustifiedFacilityCount,
  getOverallProgressPercent,
  isPhase1Complete,
  isPhase2Complete,
  isPhase3Complete,
  isPhase4Complete,
} from './rules.ts';
import type {
  GameState,
  LocationId,
  OpinionEvaluationResult,
  PhaseStatus,
  ReasoningEvaluationResult,
  StudentAcademicMetrics,
} from './types.ts';

export const CASE_META_TEXT: Record<
  LocationId,
  {
    orderCode: string;
    caseNumber: string;
    stimulatingQuestion: string;
    domainKeywords: string[];
  }
> = {
  kantin: {
    orderCode: '01',
    caseNumber: 'FAIL KES #01',
    stimulatingQuestion:
      'Apakah isu paling ketara daripada bukti di Kantin Ceria, dan bagaimanakah keadaan ini dapat diperbaiki demi keselesaan murid?',
    domainKeywords: ['kantin', 'makan', 'sampah', 'meja', 'lantai', 'tong', 'sisa', 'bersih', 'bungkusan'],
  },
  kelas: {
    orderCode: '02',
    caseNumber: 'FAIL KES #02',
    stimulatingQuestion:
      'Mengapakah situasi yang anda kesan di Kelas Harmoni perlu diberi perhatian, dan apakah perubahan yang dapat membantu pembelajaran murid?',
    domainKeywords: ['kelas', 'meja', 'kerusi', 'sudut', 'bahan', 'buku', 'belajar', 'susun', 'kemas', 'laluan'],
  },
  perpustakaan: {
    orderCode: '03',
    caseNumber: 'FAIL KES #03',
    stimulatingQuestion:
      'Apakah halangan yang menjejaskan keselesaan murid di Perpustakaan Ilmu, dan apakah pendapat anda untuk menggalakkan budaya membaca?',
    domainKeywords: ['perpustakaan', 'buku', 'baca', 'rak', 'kerusi', 'meja', 'sudut', 'selesa', 'kategori'],
  },
  taman: {
    orderCode: '04',
    caseNumber: 'FAIL KES #04',
    stimulatingQuestion:
      'Apakah kekurangan yang anda temui di Taman Rekreasi, dan bagaimanakah kawasan ini boleh dimanfaatkan oleh warga sekolah?',
    domainKeywords: ['taman', 'pokok', 'bunga', 'tumbuhan', 'bangku', 'duduk', 'laman', 'hijau', 'rehat'],
  },
};

const OPINION_MARKERS = [
  'pendapat',
  'berpendapat',
  'mengatasi',
  'perlu',
  'wajar',
  'patut',
  'sepatutnya',
  'harus',
  'supaya',
  'agar',
  'kerana',
  'bagi',
  'untuk',
  'cadang',
];

const REASON_CONNECTORS = [
  'kerana',
  'supaya',
  'agar',
  'untuk',
  'bagi',
  'dapat',
  'boleh',
  'membantu',
  'membolehkan',
  'meningkatkan',
  'mengelakkan',
  'menjadikan',
  'sebab',
  'kesannya',
];

export function evaluateOpinionCriteria(
  text: string,
  locId: LocationId,
  studentNotes: string,
  studentProposal: string
): OpinionEvaluationResult {
  const trimmed = (text || '').trim();
  const lower = trimmed.toLowerCase();
  const words = countWords(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);

  const completenessMet = words >= 7 && endsWithPunctuation;
  const completenessMsg = completenessMet
    ? `Ayat lengkap (${words} perkataan) dan diakhiri dengan tanda baca yang betul.`
    : words < 7
      ? `Ayat masih agak ringkas (${words} perkataan). Perlu dikembangkan lagi supaya idea lebih lengkap.`
      : 'Struktur ayat baik, tetapi perlu diakhiri dengan tanda noktah (.) supaya lebih lengkap.';

  const meta = CASE_META_TEXT[locId];
  const noteTokens = `${studentNotes || ''} ${studentProposal || ''}`
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F]+/)
    .filter((w) => w.length >= 4);
  const combinedKeywords = Array.from(new Set([...meta.domainKeywords, ...noteTokens]));
  const hasEvidenceConnection = combinedKeywords.some((kw) => lower.includes(kw));

  const evidenceMsg = hasEvidenceConnection
    ? 'Pendapat menunjukkan perkaitan yang jelas dengan lokasi dan bukti siasatan yang dipilih.'
    : 'Perkaitan dengan bukti masih umum dan perlu dikaitkan terus dengan penemuan kes ini.';

  const hasOpinionCue = OPINION_MARKERS.some((m) => lower.includes(m));
  const clarityMet = words >= 8 && hasOpinionCue;
  const clarityMsg = clarityMet
    ? 'Pendirian dan pendapat dinyatakan dengan jelas serta mudah difahami.'
    : 'Pendapat boleh diperjelaskan lagi dengan menyatakan pendirian serta tujuan atau kesan cadangan.';

  const criteriaMetCount = [completenessMet, hasEvidenceConnection, clarityMet].filter(Boolean).length;
  const scorePercent =
    trimmed.length === 0 ? 0 : Math.round((criteriaMetCount / 3) * 100);

  return {
    completeness: { met: completenessMet, message: completenessMsg },
    evidenceLink: { met: hasEvidenceConnection, message: evidenceMsg },
    clarity: { met: clarityMet, message: clarityMsg },
    criteriaMetCount,
    scorePercent,
  };
}

export function evaluateReasoningCriteria(
  reasonText: string,
  opinionText: string,
  locId: LocationId
): ReasoningEvaluationResult {
  const trimmed = (reasonText || '').trim();
  const lower = trimmed.toLowerCase();
  const words = countWords(trimmed);
  const endsWithPunctuation = /[.!?]$/.test(trimmed);

  const completenessMet = trimmed.length >= 10 && words >= 6 && endsWithPunctuation;
  const completenessMsg = completenessMet
    ? `Alasan lengkap (${words} patah perkataan) dan diakhiri dengan tanda baca yang tepat.`
    : words < 6
      ? `Alasan masih ringkas (${words} patah perkataan). Perlu huraian sebab dan kesan yang lebih jelas.`
      : 'Struktur alasan baik, tetapi pastikan ayat diakhiri dengan tanda noktah (.).';

  const hasConnector = REASON_CONNECTORS.some((c) => lower.includes(c));
  const reasoningCueMet = hasConnector && words >= 6;
  const reasoningCueMsg = reasoningCueMet
    ? 'Penggunaan kata hubung sebab dan kesan amat jelas serta teratur.'
    : 'Perlu sertakan kata hubung sebab atau kesan seperti "kerana", "supaya" atau "agar".';

  const opinionTokens = (opinionText || '')
    .toLowerCase()
    .split(/[^a-z0-9\u00C0-\u024F]+/)
    .filter((w) => w.length >= 4);
  const combined = Array.from(
    new Set([...(CASE_META_TEXT[locId]?.domainKeywords || []), ...opinionTokens])
  );
  const relevanceMet = combined.some((kw) => lower.includes(kw));
  const relevanceMsg = relevanceMet
    ? `Alasan berkait rapat dengan pernyataan pendapat dan situasi kes.`
    : `Perlu kaitkan alasan secara langsung dengan isu lokasi agar hujah lebih meyakinkan.`;

  const criteriaMetCount = [completenessMet, reasoningCueMet, relevanceMet].filter(Boolean).length;
  const scorePercent =
    trimmed.length === 0 ? 0 : Math.round((criteriaMetCount / 3) * 100);

  return {
    completeness: { met: completenessMet, message: completenessMsg },
    reasoningCue: { met: reasoningCueMet, message: reasoningCueMsg },
    relevanceLink: { met: relevanceMet, message: relevanceMsg },
    criteriaMetCount,
    scorePercent,
  };
}

export function computeStudentAcademicMetrics(
  state: GameState,
  improvementDelta: number | null = null
): StudentAcademicMetrics {
  // Phase 1: 4 locations (clues + notes + initial proposal)
  const locProgressList = LOCATIONS.map((loc) => {
    const inv = state.investigations[loc.id];
    const cluesRatio =
      loc.clues.length > 0 ? inv.discoveredClueIds.length / loc.clues.length : 0;
    const hasNotes = (inv.notes || '').trim().length >= 8 ? 1 : 0;
    const hasProposal = (inv.initialProposal || '').trim().length >= 8 ? 1 : 0;
    const hasStarted =
      inv.discoveredClueIds.length > 0 ||
      (inv.notes || '').trim().length > 0 ||
      (inv.initialProposal || '').trim().length > 0 ||
      inv.completed;
    const score = inv.completed
      ? Math.round((cluesRatio * 0.5 + hasNotes * 0.25 + hasProposal * 0.25) * 100)
      : hasStarted
        ? Math.round((cluesRatio * 0.5 + hasNotes * 0.25 + hasProposal * 0.25) * 100)
        : null;
    return { completed: inv.completed, hasStarted, score };
  });

  const p1CompletedCount = getCompletedLocationsCount(state);
  const p1Started = locProgressList.some((x) => x.hasStarted);
  const phase1Status: PhaseStatus = isPhase1Complete(state)
    ? 'completed'
    : p1Started
      ? 'in_progress'
      : 'not_started';
  const phase1Scores = locProgressList
    .map((x) => x.score)
    .filter((s): s is number => s !== null);
  const phase1Score =
    phase1Scores.length > 0
      ? Math.round(phase1Scores.reduce((a, b) => a + b, 0) / LOCATIONS.length)
      : null;

  // Phase 2: Evidence selection + written opinions evaluated across 3 rubric criteria
  const selectedIds = state.selectedEvidenceIds || [];
  const writtenOpinionLocs = LOCATIONS.map((l) => l.id).filter(
    (id) => (state.opinions[id]?.opinionText || '').trim().length > 0
  );
  const phase2Started = selectedIds.length > 0 || writtenOpinionLocs.length > 0;
  const phase2Done = isPhase2Complete(state);
  const phase2Status: PhaseStatus = phase2Done
    ? 'completed'
    : phase2Started
      ? 'in_progress'
      : 'not_started';

  let phase2Score: number | null = null;
  const evalTargets = selectedIds.length > 0 ? selectedIds : writtenOpinionLocs;
  if (evalTargets.length > 0) {
    const scores = evalTargets
      .filter((id) => (state.opinions[id]?.opinionText || '').trim().length > 0)
      .map((id) => {
        const inv = state.investigations[id];
        return evaluateOpinionCriteria(
          state.opinions[id]?.opinionText || '',
          id,
          inv.notes,
          inv.initialProposal
        ).scorePercent;
      });
    if (scores.length > 0) {
      phase2Score = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  // Phase 3: Logic Challenges (50%) + Written Supporting Reasons (50%)
  const logicAnsweredCount = LOGIC_CHALLENGES.filter((c) =>
    Boolean(state.logicChallengeAnswers[c.id])
  ).length;
  const logicCorrectCount = LOGIC_CHALLENGES.filter((c) => {
    const ans = state.logicChallengeAnswers[c.id];
    return Boolean(c.options.find((o) => o.id === ans)?.isRelevant);
  }).length;
  const writtenReasonLocs = LOCATIONS.map((l) => l.id).filter(
    (id) => (state.opinions[id]?.reasonText || '').trim().length > 0
  );
  const phase3Started = logicAnsweredCount > 0 || writtenReasonLocs.length > 0;
  const phase3Done = isPhase3Complete(state);
  const phase3Status: PhaseStatus = phase3Done
    ? 'completed'
    : phase3Started
      ? 'in_progress'
      : 'not_started';

  let phase3Score: number | null = null;
  if (phase3Started) {
    const logicPct =
      logicAnsweredCount > 0
        ? Math.round((logicCorrectCount / LOGIC_CHALLENGES.length) * 100)
        : 0;
    const reasonTargets =
      selectedIds.length > 0
        ? selectedIds.filter((id) => (state.opinions[id]?.reasonText || '').trim().length > 0)
        : writtenReasonLocs;
    const reasonScores = reasonTargets.map((id) =>
      evaluateReasoningCriteria(
        state.opinions[id]?.reasonText || '',
        state.opinions[id]?.opinionText || '',
        id
      ).scorePercent
    );
    const reasonPct =
      reasonScores.length > 0
        ? Math.round(reasonScores.reduce((a, b) => a + b, 0) / reasonScores.length)
        : 0;

    if (logicAnsweredCount > 0 && reasonScores.length > 0) {
      phase3Score = Math.round(logicPct * 0.5 + reasonPct * 0.5);
    } else if (logicAnsweredCount > 0) {
      phase3Score = logicPct;
    } else if (reasonScores.length > 0) {
      phase3Score = reasonPct;
    }
  }

  // Phase 4: Studio Arkitek (justified facilities >= 2 & saved)
  const justifiedCount = getJustifiedFacilityCount(state.builderPlan || []);
  const phase4Started = state.builderSaved || justifiedCount > 0;
  const phase4Done = isPhase4Complete(state);
  const phase4Status: PhaseStatus = phase4Done
    ? 'completed'
    : phase4Started
      ? 'in_progress'
      : 'not_started';
  const phase4Score: number | null = phase4Started
    ? Math.min(100, Math.round((Math.min(justifiedCount, 2) / 2) * 80 + (state.builderSaved ? 20 : 0)))
    : null;

  // Phase 5: Final Report (3-5 sentences & saved)
  const reportTrimmed = (state.finalReportText || '').trim();
  const phase5Started = state.finalReportSaved || reportTrimmed.length > 0;
  const phase5Status: PhaseStatus = state.finalReportSaved
    ? 'completed'
    : phase5Started
      ? 'in_progress'
      : 'not_started';
  let phase5Score: number | null = null;
  if (phase5Started) {
    const sCount = countSentences(reportTrimmed);
    const sentenceOk = sCount >= 3 && sCount <= 5;
    const lengthOk = reportTrimmed.length >= 20;
    phase5Score =
      (sentenceOk ? 60 : sCount > 0 ? 30 : 0) +
      (lengthOk ? 20 : 0) +
      (state.finalReportSaved ? 20 : 0);
  }

  const availableScores = [
    phase1Score,
    phase2Score,
    phase3Score,
    phase4Score,
    phase5Score,
  ].filter((s): s is number => s !== null);

  const overallAcademicScore =
    availableScores.length > 0
      ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
      : null;

  const completedPhasesCount = [
    phase1Status === 'completed',
    phase2Status === 'completed',
    phase3Status === 'completed',
    phase4Status === 'completed',
    phase5Status === 'completed',
  ].filter(Boolean).length;

  // Tasks: 4 Phase1 locations + Phase2 + Phase3 Logic + Phase3 Reasons + Phase4 + Phase5 = 9 tasks
  const totalTasksCompleted =
    p1CompletedCount +
    (phase2Done ? 1 : 0) +
    (areLogicChallengesComplete(state) ? 1 : 0) +
    (phase3Done ? 1 : 0) +
    (phase4Done ? 1 : 0) +
    (state.finalReportSaved ? 1 : 0);
  const totalTasksPending = Math.max(0, 9 - totalTasksCompleted);

  return {
    phase1Status,
    phase2Status,
    phase3Status,
    phase4Status,
    phase5Status,
    phase1Score,
    phase2Score,
    phase3Score,
    phase4Score,
    phase5Score,
    overallAcademicScore,
    missionCompletionPercent: getOverallProgressPercent(state),
    completedPhasesCount,
    totalTasksCompleted,
    totalTasksPending,
    hasAnySubmission:
      p1CompletedCount > 0 ||
      phase2Started ||
      phase3Started ||
      phase4Started ||
      phase5Started,
    improvementDelta,
  };
}
