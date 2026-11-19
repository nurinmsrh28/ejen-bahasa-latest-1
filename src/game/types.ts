export type AppScreen =
  | 'title'
  | 'login'
  | 'profile'
  | 'hq'
  | 'phase1'
  | 'phase2'
  | 'phase3'
  | 'phase4'
  | 'phase5'
  | 'teacher';

export type AccountRole = 'student' | 'teacher';

export type LocationId = 'kantin' | 'kelas' | 'perpustakaan' | 'taman';

export interface ClueItem {
  id: string;
  label: string;
  issueSummary: string;
  profesorReaction: string;
}

export interface LocationDefinition {
  id: LocationId;
  name: string;
  shortName: string;
  zoneLabel: string;
  briefing: string;
  hints: [string, string, string];
  clues: ClueItem[];
}

export interface LocationInvestigation {
  discoveredClueIds: string[];
  hintLevelUsed: 0 | 1 | 2 | 3;
  notes: string;
  initialProposal: string;
  completed: boolean;
  completedAt?: string;
}

export interface OpinionEntry {
  locationId: LocationId;
  opinionText: string;
  reasonText: string;
}

export interface LogicChallenge {
  id: string;
  contextTitle: string;
  opinion: string;
  options: {
    id: 'A' | 'B';
    text: string;
    isRelevant: boolean;
    explanation: string;
  }[];
}

export type FacilityAssetId =
  | 'kantin'
  | 'bilik_darjah'
  | 'perpustakaan'
  | 'taman_herba'
  | 'taman_permainan'
  | 'padang'
  | 'tong_sampah'
  | 'cuci_tangan'
  | 'bangku'
  | 'pokok'
  | 'bunga'
  | 'laluan';

export type DesignActionType =
  | 'kekalkan'
  | 'ubah_suai'
  | 'gantikan'
  | 'tambah_baharu'
  | 'susun_semula';

export interface FacilityAsset {
  id: FacilityAssetId;
  name: string;
  category: 'bangunan' | 'alam' | 'kemudahan';
  description: string;
}

export interface PlacedFacility {
  uid: string;
  assetId: FacilityAssetId;
  row: number;
  col: number;
  actionType?: DesignActionType;
  linkedLocationId?: LocationId;
  justification?: string;
  isOriginal?: boolean;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
}

export interface AgentProfile {
  name: string;
  className: string;
  codenameBadge: string;
  agentId?: string;
  verifiedAt?: string;
  photoUrl?: string;
  designation?: string;
}

export interface AuthUser {
  username: string;
  accountRole: AccountRole;
  role: string;
  referenceNo: string;
  accessStatus: string;
  organization: string;
  assignedClasses?: string[];
  profile: AgentProfile | null;
}

export interface GameState {
  version: number;
  profile: AgentProfile | null;
  xp: number;
  awardedMilestones: string[];
  investigations: Record<LocationId, LocationInvestigation>;
  selectedEvidenceIds: LocationId[];
  opinions: Record<LocationId, OpinionEntry>;
  logicChallengeAnswers: Record<string, 'A' | 'B'>;
  builderPlan: PlacedFacility[];
  builderSaved: boolean;
  finalReportText: string;
  finalReportSaved: boolean;
  soundEnabled: boolean;
  lastUpdated: string;
}

export interface OpinionCriterionResult {
  met: boolean;
  message: string;
}

export interface OpinionEvaluationResult {
  completeness: OpinionCriterionResult;
  evidenceLink: OpinionCriterionResult;
  clarity: OpinionCriterionResult;
  criteriaMetCount: number;
  scorePercent: number;
}

export interface ReasoningEvaluationResult {
  completeness: OpinionCriterionResult;
  reasoningCue: OpinionCriterionResult;
  relevanceLink: OpinionCriterionResult;
  criteriaMetCount: number;
  scorePercent: number;
}

export type PhaseStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed';

export interface StudentAcademicMetrics {
  phase1Status: PhaseStatus;
  phase2Status: PhaseStatus;
  phase3Status: PhaseStatus;
  phase4Status: PhaseStatus;
  phase5Status: PhaseStatus;
  phase1Score: number | null;
  phase2Score: number | null;
  phase3Score: number | null;
  phase4Score: number | null;
  phase5Score: number | null;
  overallAcademicScore: number | null;
  missionCompletionPercent: number;
  completedPhasesCount: number;
  totalTasksCompleted: number;
  totalTasksPending: number;
  hasAnySubmission: boolean;
  improvementDelta: number | null;
}

export interface TeacherFeedbackRecord {
  id: string;
  studentUsername: string;
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  itemKey: string;
  teacherUsername: string;
  teacherName: string;
  comment: string;
  assessmentDecision?: 'cemerlang' | 'memuaskan' | 'perlu_bimbingan' | '';
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionHistoryEntry {
  id: string;
  studentUsername: string;
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  itemKey: string;
  itemTitle: string;
  question: string;
  responseText: string;
  secondaryText?: string;
  selectedEvidence: string[];
  scorePercent: number | null;
  criteriaSummary?: string;
  submittedAt: string;
  version: number;
}

export interface ActivityLogRecord {
  id: string;
  studentUsername: string;
  studentName: string;
  className: string;
  eventType:
    | 'clue_discovered'
    | 'phase1_saved'
    | 'phase2_saved'
    | 'phase3_logic'
    | 'phase3_saved'
    | 'phase4_saved'
    | 'phase5_saved'
    | 'badge_unlocked'
    | 'teacher_feedback';
  description: string;
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  locationId?: LocationId;
  timestamp: string;
}

export interface ClassRecord {
  id: string;
  name: string;
  yearLevel: string;
  sessionYear: string;
  teacherUsername: string;
  createdAt: string;
}

export interface TeacherStudentSummary {
  username: string;
  studentId: string;
  name: string;
  className: string;
  codenameBadge: string;
  photoUrl?: string;
  isDemo: boolean;
  createdAt: string;
  lastUpdated: string;
  xp: number;
  rank: string;
  earnedBadges: string[];
  badgeUnlockDates: Record<string, string>;
  metrics: StudentAcademicMetrics;
  latestActivityText: string;
  latestActivityAt: string | null;
  feedbackCount: number;
  needsReview: boolean;
}

export interface TeacherStudentDossier {
  summary: TeacherStudentSummary;
  gameState: GameState;
  opinionEvaluations: Record<LocationId, OpinionEvaluationResult>;
  reasoningEvaluations: Record<LocationId, ReasoningEvaluationResult>;
  submissionHistory: SubmissionHistoryEntry[];
  teacherFeedback: TeacherFeedbackRecord[];
  activityLogs: ActivityLogRecord[];
}

export interface LocationAggregateStats {
  locationId: LocationId;
  name: string;
  shortName: string;
  zoneLabel: string;
  completedStudents: number;
  inProgressStudents: number;
  totalStudents: number;
  completionPercent: number;
  averageAcademicScore: number | null;
  cluesDiscoveredTotal: number;
}

export interface TeacherInsightItem {
  id: string;
  severity: 'info' | 'warning' | 'positive';
  title: string;
  description: string;
  affectedCount: number;
  targetPhase?: string;
}

export interface TeacherDashboardPayload {
  teacher: AuthUser;
  classes: ClassRecord[];
  sessions: string[];
  kpis: {
    totalStudents: number;
    activeStudents: number;
    studentsWithSubmissions: number;
    completedAssignments: number;
    pendingAssignments: number;
    completionPercent: number;
    averageAcademicScore: number | null;
    performanceDelta: number | null;
    topStudent: {
      username: string;
      name: string;
      className: string;
      scorePercent: number;
      badgeName: string;
      xp: number;
    } | null;
  };
  phaseSummary: {
    phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
    label: string;
    shortLabel: string;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    completionPercent: number;
    averageScore: number | null;
  }[];
  timelineSeries: {
    dateLabel: string;
    submissionsCount: number;
    averageScore: number | null;
  }[];
  locationAggregates: LocationAggregateStats[];
  students: TeacherStudentSummary[];
  recentActivities: ActivityLogRecord[];
  achievements: {
    badgeId: string;
    badgeName: string;
    description: string;
    studentUsername: string;
    studentName: string;
    className: string;
    unlockedAt: string;
  }[];
  insights: TeacherInsightItem[];
  hasDemoStudents: boolean;
}

