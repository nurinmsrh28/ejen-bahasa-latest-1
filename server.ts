import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  BADGES,
  DESIGN_ACTIONS,
  FACILITY_ASSET_MAP,
  LOCATIONS,
  LOCATION_MAP,
  LOGIC_CHALLENGES,
} from './src/game/data.ts';
import {
  CASE_META_TEXT,
  computeStudentAcademicMetrics,
  evaluateOpinionCriteria,
  evaluateReasoningCriteria,
} from './src/game/evaluation.ts';
import {
  createInitialGameState,
  getAgentRank,
  getEarnedBadgeIds,
  getJustifiedFacilityCount,
} from './src/game/rules.ts';
import type {
  AccountRole,
  ActivityLogRecord,
  AuthUser,
  ClassRecord,
  GameState,
  LocationId,
  OpinionEvaluationResult,
  ReasoningEvaluationResult,
  SubmissionHistoryEntry,
  TeacherDashboardPayload,
  TeacherFeedbackRecord,
  TeacherInsightItem,
  TeacherStudentDossier,
  TeacherStudentSummary,
} from './src/game/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || process.env.DEFAULT_APP_PORT || 3000);
const DIST_DIR = path.resolve(__dirname, 'dist');
const IS_TSX_DEV = process.execArgv.some((arg) => arg.includes('tsx'));
const HAS_BUILT_DIST = fs.existsSync(path.join(DIST_DIR, 'index.html'));
const IS_PROD =
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.K_SERVICE) ||
  (!IS_TSX_DEV && HAS_BUILT_DIST);
const DATA_DIR = path.resolve(__dirname, '.data');
const STORE_PATH = path.join(DATA_DIR, 'academy-store.json');
const SESSION_COOKIE_NAME = 'ejen_session';
const RECOVERY_SECRET_CODE = 'BESTARI2026';
const TEACHER_REGISTRATION_CODE = 'GURU2026';
const DEFAULT_TEACHER_PHOTO =
  '/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png';

interface StoredProfile {
  name: string;
  className: string;
  codenameBadge: string;
  agentId: string;
  verifiedAt: string;
  photoUrl?: string;
  designation?: string;
}

interface StoredAccount {
  username: string;
  passwordSalt: string;
  passwordHash: string;
  accountRole?: AccountRole;
  role: string;
  referenceNo: string;
  assignedClasses?: string[];
  isDemo?: boolean;
  createdAt: string;
  profile: StoredProfile | null;
}

interface EnrollmentRecord {
  studentUsername: string;
  classId: string;
  className: string;
  sessionYear: string;
  enrolledAt: string;
}

interface PersistedStudentRecord {
  username: string;
  gameState: GameState;
  badgeUnlockDates: Record<string, string>;
  submissionHistory: SubmissionHistoryEntry[];
  updatedAt: string;
}

interface AcademyStore {
  version?: number;
  secretKey: string;
  accounts: Record<string, StoredAccount>;
  classes?: Record<string, ClassRecord>;
  enrollments?: EnrollmentRecord[];
  studentRecords?: Record<string, PersistedStudentRecord>;
  teacherFeedback?: TeacherFeedbackRecord[];
  activityLogs?: ActivityLogRecord[];
}

interface SessionPayload {
  username: string;
  exp: number;
}

function hashPassword(password: string, saltHex?: string): { salt: string; hash: string } {
  const salt = saltHex || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

function inferAccountRole(account: StoredAccount): AccountRole {
  if (account.accountRole === 'teacher' || account.accountRole === 'student') {
    return account.accountRole;
  }
  if (
    account.username === 'profesor.nurin' ||
    account.role.toLowerCase().includes('pembimbing') ||
    account.role.toLowerCase().includes('guru')
  ) {
    return 'teacher';
  }
  return 'student';
}

function createDefaultClasses(teacherUsername = 'profesor.nurin'): Record<string, ClassRecord> {
  const now = new Date().toISOString();
  const defs = [
    { id: 'cls_5_bestari', name: '5 Bestari', yearLevel: 'Tahun 5', sessionYear: '2026/2027' },
    { id: 'cls_5_cemerlang', name: '5 Cemerlang', yearLevel: 'Tahun 5', sessionYear: '2026/2027' },
    { id: 'cls_6_bestari', name: '6 Bestari', yearLevel: 'Tahun 6', sessionYear: '2026/2027' },
    { id: 'cls_6_harmoni', name: '6 Harmoni', yearLevel: 'Tahun 6', sessionYear: '2026/2027' },
  ];
  const out: Record<string, ClassRecord> = {};
  for (const d of defs) {
    out[d.id] = {
      ...d,
      teacherUsername,
      createdAt: now,
    };
  }
  return out;
}

function createSeedStore(): AcademyStore {
  const ejenCreds = hashPassword('Bestari#2026');
  const mentorCreds = hashPassword('Akademi#2026');
  const now = new Date().toISOString();
  const classes = createDefaultClasses('profesor.nurin');
  return {
    version: 2,
    secretKey: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    accounts: {
      'ejen.bestari': {
        username: 'ejen.bestari',
        passwordSalt: ejenCreds.salt,
        passwordHash: ejenCreds.hash,
        accountRole: 'student',
        role: 'Anggota Penyiasat · Sekolah Seri Bestari',
        referenceNo: 'REF-SB-001',
        createdAt: now,
        profile: null,
      },
      'profesor.nurin': {
        username: 'profesor.nurin',
        passwordSalt: mentorCreds.salt,
        passwordHash: mentorCreds.hash,
        accountRole: 'teacher',
        role: 'Guru Pembimbing Operasi · Akademi Ejen Rahsia',
        referenceNo: 'REF-SB-000',
        assignedClasses: ['5 Bestari', '5 Cemerlang', '6 Bestari', '6 Harmoni'],
        createdAt: now,
        profile: {
          name: 'Profesor Nurin',
          className: '6 Bestari',
          codenameBadge: 'Kanta Ilmu',
          agentId: 'GURU-SB-0001',
          verifiedAt: now,
          photoUrl: DEFAULT_TEACHER_PHOTO,
          designation: 'Guru Bahasa Melayu · Ketua Pembimbing Akademi',
        },
      },
    },
    classes,
    enrollments: [
      {
        studentUsername: 'ejen.bestari',
        classId: 'cls_6_bestari',
        className: '6 Bestari',
        sessionYear: '2026/2027',
        enrolledAt: now,
      },
    ],
    studentRecords: {},
    teacherFeedback: [],
    activityLogs: [],
  };
}

function normalizeStore(rawStore: AcademyStore): AcademyStore {
  const store: AcademyStore = {
    version: 2,
    secretKey: rawStore.secretKey || process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    accounts: rawStore.accounts || {},
    classes: rawStore.classes && Object.keys(rawStore.classes).length > 0
      ? rawStore.classes
      : createDefaultClasses('profesor.nurin'),
    enrollments: Array.isArray(rawStore.enrollments) ? rawStore.enrollments : [],
    studentRecords: rawStore.studentRecords || {},
    teacherFeedback: Array.isArray(rawStore.teacherFeedback) ? rawStore.teacherFeedback : [],
    activityLogs: Array.isArray(rawStore.activityLogs) ? rawStore.activityLogs : [],
  };

  for (const [uname, acc] of Object.entries(store.accounts)) {
    const role = inferAccountRole(acc);
    acc.accountRole = role;
    if (role === 'teacher') {
      if (!acc.assignedClasses || acc.assignedClasses.length === 0) {
        acc.assignedClasses = Object.values(store.classes!).map((c) => c.name);
      }
      if (acc.profile && !acc.profile.photoUrl) {
        acc.profile.photoUrl = DEFAULT_TEACHER_PHOTO;
      }
      if (acc.profile && !acc.profile.designation) {
        acc.profile.designation = 'Guru Bahasa Melayu · Pembimbing Operasi';
      }
    } else {
      // Ensure student has an enrollment record
      const className = acc.profile?.className || '6 Bestari';
      const existingEnrollment = store.enrollments!.find((e) => e.studentUsername === uname);
      if (!existingEnrollment) {
        const matchedClass =
          Object.values(store.classes!).find((c) => c.name === className) ||
          Object.values(store.classes!)[0];
        if (matchedClass) {
          store.enrollments!.push({
            studentUsername: uname,
            classId: matchedClass.id,
            className: acc.profile?.className || matchedClass.name,
            sessionYear: matchedClass.sessionYear,
            enrolledAt: acc.createdAt || new Date().toISOString(),
          });
        }
      }
    }
  }

  return store;
}

let memoryStore!: AcademyStore;

function loadStore(): AcademyStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as AcademyStore;
      if (parsed && parsed.secretKey && parsed.accounts) {
        const normalized = normalizeStore(parsed);
        return normalized;
      }
    }
  } catch {
    // Fallback to seed store
  }
  const seeded = createSeedStore();
  saveStore(seeded);
  return seeded;
}

function saveStore(store: AcademyStore): void {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Graceful fallback to in-memory store if disk write is restricted
  }
}

memoryStore = loadStore();
saveStore(memoryStore);

function signSession(payload: SessionPayload, secretKey: string): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secretKey).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySession(token: string, secretKey: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', secretKey).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.username || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(headerValue: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headerValue) return out;
  for (const part of headerValue.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) out[key] = val;
  }
  return out;
}

function isRequestHttps(req: Request): boolean {
  if (req.secure) return true;
  const fwdProtoRaw = req.headers['x-forwarded-proto'];
  const fwdProto = Array.isArray(fwdProtoRaw) ? fwdProtoRaw.join(',') : String(fwdProtoRaw || '');
  if (
    fwdProto
      .split(',')
      .some((part) => part.trim().toLowerCase() === 'https')
  ) {
    return true;
  }
  if (String(req.headers['x-forwarded-ssl'] || '').toLowerCase() === 'on') {
    return true;
  }
  const origin = String(req.headers.origin || req.headers.referer || '');
  return origin.startsWith('https://');
}

function extractSessionToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME];
}

function setSessionCookie(res: Response, req: Request, token: string, maxAgeMs: number): void {
  const isHttps = isRequestHttps(req);
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: maxAgeMs,
    ...(isHttps ? { partitioned: true } : {}),
  } as express.CookieOptions);
}

function clearSessionCookie(res: Response, req: Request): void {
  const isHttps = isRequestHttps(req);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    ...(isHttps ? { partitioned: true } : {}),
  } as express.CookieOptions);
}

function sanitizeUserResponse(account: StoredAccount): AuthUser {
  const accountRole = inferAccountRole(account);
  return {
    username: account.username,
    accountRole,
    role: account.role,
    referenceNo: account.referenceNo,
    accessStatus: 'AKSES DIBENARKAN',
    organization: 'SEKOLAH SERI BESTARI',
    assignedClasses: accountRole === 'teacher' ? account.assignedClasses || [] : undefined,
    profile: account.profile,
  };
}

function generateUniqueAgentId(existingIds: Set<string>, prefix = 'SB-26'): string {
  for (let i = 0; i < 20; i++) {
    const code = crypto.randomInt(1000, 9999);
    const candidate = `${prefix}-${code}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }
  return `${prefix}-${String(Date.now()).slice(-4)}`;
}

function generateNextReferenceNo(accounts: Record<string, StoredAccount>): string {
  let maxNum = 0;
  for (const acc of Object.values(accounts)) {
    const match = String(acc.referenceNo || '').match(/^REF-SB-(\d+)$/i);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `REF-SB-${String(maxNum + 1).padStart(3, '0')}`;
}

function normalizeGameState(raw: Partial<GameState> | null | undefined, profile: StoredProfile | null): GameState {
  const base = createInitialGameState();
  if (!raw) {
    return {
      ...base,
      profile,
    };
  }

  const validLocationIds = new Set<LocationId>(LOCATIONS.map((l) => l.id));
  const rawInvestigations =
    raw.investigations && typeof raw.investigations === 'object' ? raw.investigations : {};
  const investigations = { ...base.investigations };
  for (const loc of LOCATIONS) {
    const baseInv = base.investigations[loc.id];
    const incomingInv = (rawInvestigations as Partial<GameState['investigations']>)[loc.id];
    const rawClues = Array.isArray(incomingInv?.discoveredClueIds)
      ? incomingInv.discoveredClueIds.filter((cid): cid is string => typeof cid === 'string')
      : [];
    const hintLevel = Number(incomingInv?.hintLevelUsed);
    investigations[loc.id] = {
      discoveredClueIds: rawClues,
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

  const rawOpinions = raw.opinions && typeof raw.opinions === 'object' ? raw.opinions : {};
  const opinions = { ...base.opinions };
  for (const loc of LOCATIONS) {
    const incomingOp = (rawOpinions as Partial<GameState['opinions']>)[loc.id];
    opinions[loc.id] = {
      locationId: loc.id,
      opinionText: typeof incomingOp?.opinionText === 'string' ? incomingOp.opinionText : '',
      reasonText: typeof incomingOp?.reasonText === 'string' ? incomingOp.reasonText : '',
    };
  }

  const selectedEvidenceIds = Array.isArray(raw.selectedEvidenceIds)
    ? raw.selectedEvidenceIds.filter((id): id is LocationId => validLocationIds.has(id))
    : [];

  const awardedMilestones = Array.isArray(raw.awardedMilestones)
    ? raw.awardedMilestones.filter((m): m is string => typeof m === 'string')
    : [];

  const logicChallengeAnswers =
    raw.logicChallengeAnswers &&
    typeof raw.logicChallengeAnswers === 'object' &&
    !Array.isArray(raw.logicChallengeAnswers)
      ? Object.entries(raw.logicChallengeAnswers).reduce(
          (acc, [k, v]) => {
            if (v === 'A' || v === 'B') acc[k] = v;
            return acc;
          },
          {} as Record<string, 'A' | 'B'>
        )
      : {};

  return {
    ...base,
    ...raw,
    xp: typeof raw.xp === 'number' && Number.isFinite(raw.xp) ? Math.max(0, raw.xp) : base.xp,
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : base.soundEnabled,
    finalReportText:
      typeof raw.finalReportText === 'string' ? raw.finalReportText : base.finalReportText,
    finalReportSaved: Boolean(raw.finalReportSaved),
    builderSaved: Boolean(raw.builderSaved),
    profile: raw.profile || profile,
    investigations,
    opinions,
    selectedEvidenceIds,
    awardedMilestones,
    logicChallengeAnswers,
    builderPlan:
      Array.isArray(raw.builderPlan) && raw.builderPlan.length > 0
        ? raw.builderPlan.filter(
            (item) =>
              Boolean(item) &&
              typeof item === 'object' &&
              typeof item.uid === 'string' &&
              typeof item.assetId === 'string'
          )
        : base.builderPlan,
    lastUpdated: typeof raw.lastUpdated === 'string' && raw.lastUpdated ? raw.lastUpdated : new Date().toISOString(),
  };
}

function getOrCreateStudentRecord(account: StoredAccount): PersistedStudentRecord {
  const records = memoryStore.studentRecords || (memoryStore.studentRecords = {});
  const existing = records[account.username];
  if (existing) {
    existing.gameState = normalizeGameState(existing.gameState, account.profile);
    return existing;
  }
  const initialState = normalizeGameState(null, account.profile);
  const created: PersistedStudentRecord = {
    username: account.username,
    gameState: initialState,
    badgeUnlockDates: {},
    submissionHistory: [],
    updatedAt: account.createdAt || new Date().toISOString(),
  };
  records[account.username] = created;
  return created;
}

function pushHistoryIfChanged(
  history: SubmissionHistoryEntry[],
  entry: Omit<SubmissionHistoryEntry, 'id' | 'version'>
): boolean {
  const sameKey = history.filter(
    (h) => h.phaseId === entry.phaseId && h.itemKey === entry.itemKey
  );
  const latest = sameKey[sameKey.length - 1];
  if (
    latest &&
    latest.responseText.trim() === entry.responseText.trim() &&
    (latest.secondaryText || '').trim() === (entry.secondaryText || '').trim() &&
    JSON.stringify(latest.selectedEvidence) === JSON.stringify(entry.selectedEvidence)
  ) {
    return false;
  }
  history.push({
    ...entry,
    id: `sub_${crypto.randomUUID().slice(0, 12)}`,
    version: sameKey.length + 1,
  });
  return true;
}

function appendActivityLog(log: Omit<ActivityLogRecord, 'id'>) {
  const logs = memoryStore.activityLogs || (memoryStore.activityLogs = []);
  logs.unshift({
    ...log,
    id: `act_${crypto.randomUUID().slice(0, 12)}`,
  });
  if (logs.length > 500) {
    logs.length = 500;
  }
}

function syncStudentSubmissionChanges(
  account: StoredAccount,
  prevRecord: PersistedStudentRecord,
  nextState: GameState
): PersistedStudentRecord {
  const now = new Date().toISOString();
  const prevState = prevRecord.gameState;
  const studentName = account.profile?.name || nextState.profile?.name || account.username;
  const className =
    account.profile?.className ||
    nextState.profile?.className ||
    memoryStore.enrollments?.find((e) => e.studentUsername === account.username)?.className ||
    '6 Bestari';

  const history = [...(prevRecord.submissionHistory || [])];
  const badgeUnlockDates = { ...(prevRecord.badgeUnlockDates || {}) };

  // 1. Track newly unlocked badges
  const prevBadges = getEarnedBadgeIds(prevState);
  const nextBadges = getEarnedBadgeIds(nextState);
  for (const badgeId of nextBadges) {
    if (!badgeUnlockDates[badgeId]) {
      badgeUnlockDates[badgeId] = now;
    }
    if (!prevBadges.includes(badgeId)) {
      const badgeDef = BADGES.find((b) => b.id === badgeId);
      const badgePhase =
        badgeId === 'mata_helang'
          ? 'phase1'
          : badgeId === 'penganalisis_kes'
            ? 'phase2'
            : badgeId === 'ahli_logik'
              ? 'phase3'
              : badgeId === 'pereka_bestari'
                ? 'phase4'
                : 'phase5';
      appendActivityLog({
        studentUsername: account.username,
        studentName,
        className,
        eventType: 'badge_unlocked',
        description: `Membuka lencana ${badgeDef?.name || badgeId}`,
        phaseId: badgePhase,
        timestamp: now,
      });
    }
  }

  // 2. Track Phase 1 clue discoveries & location saves
  for (const loc of LOCATIONS) {
    const prevInv = prevState.investigations[loc.id];
    const nextInv = nextState.investigations[loc.id];
    const newClues = nextInv.discoveredClueIds.filter(
      (cid) => !prevInv.discoveredClueIds.includes(cid)
    );
    for (const cid of newClues) {
      const clue = loc.clues.find((c) => c.id === cid);
      appendActivityLog({
        studentUsername: account.username,
        studentName,
        className,
        eventType: 'clue_discovered',
        description: `Menemui petunjuk "${clue?.label || cid}" di ${loc.name}`,
        phaseId: 'phase1',
        locationId: loc.id,
        timestamp: now,
      });
    }

    const notesChanged = (nextInv.notes || '').trim() !== (prevInv.notes || '').trim();
    const propChanged =
      (nextInv.initialProposal || '').trim() !== (prevInv.initialProposal || '').trim();
    if (
      nextInv.completed &&
      ((!prevInv.completed) || notesChanged || propChanged)
    ) {
      const discoveredLabels = nextInv.discoveredClueIds
        .map((cid) => loc.clues.find((c) => c.id === cid)?.label || cid);
      const cluesRatio =
        loc.clues.length > 0 ? nextInv.discoveredClueIds.length / loc.clues.length : 0;
      const p1Score = Math.round(
        (cluesRatio * 0.5 +
          ((nextInv.notes || '').trim().length >= 8 ? 0.25 : 0) +
          ((nextInv.initialProposal || '').trim().length >= 8 ? 0.25 : 0)) *
          100
      );

      const added = pushHistoryIfChanged(history, {
        studentUsername: account.username,
        phaseId: 'phase1',
        itemKey: `phase1_${loc.id}`,
        itemTitle: `Fasa 1 · ${loc.name}`,
        question: `Catatkan pemerhatian dan cadangan penyelesaian awal bagi lokasi ${loc.name}.`,
        responseText: nextInv.notes.trim(),
        secondaryText: nextInv.initialProposal.trim(),
        selectedEvidence: discoveredLabels,
        scorePercent: p1Score,
        criteriaSummary: `${nextInv.discoveredClueIds.length}/${loc.clues.length} bukti ditemui · Catatan & cadangan disimpan`,
        submittedAt: nextInv.completedAt || now,
      });

      if (added) {
        appendActivityLog({
          studentUsername: account.username,
          studentName,
          className,
          eventType: 'phase1_saved',
          description: `Menyimpan rekod siasatan lengkap di ${loc.name}`,
          phaseId: 'phase1',
          locationId: loc.id,
          timestamp: now,
        });
      }
    }
  }

  // 3. Track Phase 2 opinion submissions
  for (const loc of LOCATIONS) {
    const prevOp = (prevState.opinions[loc.id]?.opinionText || '').trim();
    const nextOp = (nextState.opinions[loc.id]?.opinionText || '').trim();
    if (nextOp.length >= 10 && nextOp !== prevOp) {
      const inv = nextState.investigations[loc.id];
      const evalRes = evaluateOpinionCriteria(
        nextOp,
        loc.id,
        inv.notes,
        inv.initialProposal
      );
      const added = pushHistoryIfChanged(history, {
        studentUsername: account.username,
        phaseId: 'phase2',
        itemKey: `phase2_${loc.id}`,
        itemTitle: `Fasa 2 · Pendapat ${loc.name}`,
        question: CASE_META_TEXT[loc.id].stimulatingQuestion,
        responseText: nextOp,
        selectedEvidence: inv.discoveredClueIds.map(
          (cid) => loc.clues.find((c) => c.id === cid)?.label || cid
        ),
        scorePercent: evalRes.scorePercent,
        criteriaSummary: `Kelengkapan: ${evalRes.completeness.met ? 'Lulus' : 'Perlu Baiki'} · Perkaitan Bukti: ${evalRes.evidenceLink.met ? 'Lulus' : 'Perlu Baiki'} · Kejelasan: ${evalRes.clarity.met ? 'Lulus' : 'Perlu Baiki'}`,
        submittedAt: now,
      });
      if (added) {
        appendActivityLog({
          studentUsername: account.username,
          studentName,
          className,
          eventType: 'phase2_saved',
          description: `Menyimpan ayat pendapat Kad Keputusan bagi ${loc.name}`,
          phaseId: 'phase2',
          locationId: loc.id,
          timestamp: now,
        });
      }
    }
  }

  // 4. Track Phase 3 Logic Challenges & Written Supporting Reasons
  for (const challenge of LOGIC_CHALLENGES) {
    const prevAns = prevState.logicChallengeAnswers[challenge.id];
    const nextAns = nextState.logicChallengeAnswers[challenge.id];
    if (nextAns && nextAns !== prevAns) {
      const opt = challenge.options.find((o) => o.id === nextAns);
      if (opt) {
        const added = pushHistoryIfChanged(history, {
          studentUsername: account.username,
          phaseId: 'phase3',
          itemKey: `phase3_logic_${challenge.id}`,
          itemTitle: `Fasa 3 · ${challenge.contextTitle}`,
          question: challenge.opinion,
          responseText: `Pilihan ${opt.id}: ${opt.text}`,
          secondaryText: opt.explanation,
          selectedEvidence: [opt.isRelevant ? 'Alasan Relevan (Tepat)' : 'Alasan Tidak Berkaitan'],
          scorePercent: opt.isRelevant ? 100 : 0,
          criteriaSummary: opt.isRelevant ? 'Jawapan Relevan (Betul)' : 'Jawapan Kurang Tepat',
          submittedAt: now,
        });
        if (added) {
          appendActivityLog({
            studentUsername: account.username,
            studentName,
            className,
            eventType: 'phase3_logic',
            description: `Menjawab ${challenge.contextTitle} (${opt.isRelevant ? 'Tepat' : 'Perlu Semakan'})`,
            phaseId: 'phase3',
            timestamp: now,
          });
        }
      }
    }
  }

  for (const loc of LOCATIONS) {
    const prevReason = (prevState.opinions[loc.id]?.reasonText || '').trim();
    const nextReason = (nextState.opinions[loc.id]?.reasonText || '').trim();
    if (nextReason.length >= 10 && nextReason !== prevReason) {
      const opinionText = nextState.opinions[loc.id]?.opinionText || '';
      const rEval = evaluateReasoningCriteria(nextReason, opinionText, loc.id);
      const added = pushHistoryIfChanged(history, {
        studentUsername: account.username,
        phaseId: 'phase3',
        itemKey: `phase3_reason_${loc.id}`,
        itemTitle: `Fasa 3 · Alasan Penyokong (${loc.name})`,
        question: `Tuliskan alasan relevan untuk menyokong pendapat anda bagi ${loc.name}: "${opinionText || '-'}"`,
        responseText: nextReason,
        selectedEvidence: [opinionText || loc.name],
        scorePercent: rEval.scorePercent,
        criteriaSummary: `Kelengkapan: ${rEval.completeness.met ? 'Lulus' : 'Perlu Baiki'} · Kata Hubung: ${rEval.reasoningCue.met ? 'Lulus' : 'Perlu Baiki'} · Perkaitan: ${rEval.relevanceLink.met ? 'Lulus' : 'Perlu Baiki'}`,
        submittedAt: now,
      });
      if (added) {
        appendActivityLog({
          studentUsername: account.username,
          studentName,
          className,
          eventType: 'phase3_saved',
          description: `Menyimpan alasan penyokong teori bagi ${loc.name}`,
          phaseId: 'phase3',
          locationId: loc.id,
          timestamp: now,
        });
      }
    }
  }

  // 5. Track Phase 4 Studio Arkitek
  const justifiedNow = nextState.builderPlan.filter(
    (f) => (f.justification || '').trim().length >= 8
  );
  const prevJustifiedSummary = prevState.builderPlan
    .filter((f) => (f.justification || '').trim().length >= 8)
    .map((f) => `${f.assetId}:${f.actionType}:${f.justification}`)
    .join('|');
  const nextJustifiedSummary = justifiedNow
    .map((f) => `${f.assetId}:${f.actionType}:${f.justification}`)
    .join('|');

  if (
    nextState.builderSaved &&
    (!prevState.builderSaved || prevJustifiedSummary !== nextJustifiedSummary)
  ) {
    const descLines = justifiedNow.map((f) => {
      const assetName = FACILITY_ASSET_MAP[f.assetId]?.name || f.assetId;
      const actionLabel =
        DESIGN_ACTIONS.find((a) => a.id === f.actionType)?.label || 'Ubah Suai';
      const locName = f.linkedLocationId
        ? LOCATION_MAP[f.linkedLocationId]?.shortName
        : 'Umum';
      return `${assetName} [${actionLabel} · ${locName}]: ${f.justification}`;
    });
    const jCount = getJustifiedFacilityCount(nextState.builderPlan);
    const p4Score = Math.min(100, Math.round((Math.min(jCount, 2) / 2) * 80 + 20));
    const added = pushHistoryIfChanged(history, {
      studentUsername: account.username,
      phaseId: 'phase4',
      itemKey: 'phase4_architect',
      itemTitle: 'Cabaran Akhir · Pelan Studio Arkitek',
      question:
        'Reka Pelan Sekolah Impian dan nyatakan justifikasi reka bentuk yang berpaut kepada bukti siasatan.',
      responseText: descLines.join('\n'),
      selectedEvidence: nextState.selectedEvidenceIds.map(
        (id) => LOCATION_MAP[id]?.name || id
      ),
      scorePercent: p4Score,
      criteriaSummary: `${jCount} kemudahan berjustifikasi · ${nextState.builderPlan.length} objek di pelan`,
      submittedAt: now,
    });
    if (added) {
      appendActivityLog({
        studentUsername: account.username,
        studentName,
        className,
        eventType: 'phase4_saved',
        description: `Menyimpan Pelan Sekolah Impian (${jCount} justifikasi)`,
        phaseId: 'phase4',
        timestamp: now,
      });
    }
  }

  // 6. Track Phase 5 Final Report
  const prevReport = (prevState.finalReportText || '').trim();
  const nextReport = (nextState.finalReportText || '').trim();
  if (nextState.finalReportSaved && nextReport.length >= 20 && nextReport !== prevReport) {
    const added = pushHistoryIfChanged(history, {
      studentUsername: account.username,
      phaseId: 'phase5',
      itemKey: 'phase5_report',
      itemTitle: 'Produk Akhir · Laporan Sekolah Impian',
      question:
        'Gabungkan pemerhatian, pendapat, alasan relevan dan cadangan Pelan Sekolah Impian dalam 3–5 ayat.',
      responseText: nextReport,
      selectedEvidence: nextState.selectedEvidenceIds.map(
        (id) => LOCATION_MAP[id]?.name || id
      ),
      scorePercent: 100,
      criteriaSummary: 'Laporan 3–5 ayat lengkap disahkan',
      submittedAt: now,
    });
    if (added) {
      appendActivityLog({
        studentUsername: account.username,
        studentName,
        className,
        eventType: 'phase5_saved',
        description: 'Menghantar Laporan Rasmi Sekolah Impian',
        phaseId: 'phase5',
        timestamp: now,
      });
    }
  }

  const updated: PersistedStudentRecord = {
    username: account.username,
    gameState: {
      ...nextState,
      lastUpdated: now,
    },
    badgeUnlockDates,
    submissionHistory: history,
    updatedAt: now,
  };
  memoryStore.studentRecords![account.username] = updated;
  return updated;
}

function buildStudentSummary(account: StoredAccount): TeacherStudentSummary {
  const record = getOrCreateStudentRecord(account);
  const gameState = record.gameState;
  const feedbackList = (memoryStore.teacherFeedback || []).filter(
    (f) => f.studentUsername === account.username
  );
  const studentLogs = (memoryStore.activityLogs || []).filter(
    (a) => a.studentUsername === account.username
  );

  // Compute attempt-to-attempt improvement delta from submissionHistory
  let improvementDelta: number | null = null;
  const historyWithScores = record.submissionHistory.filter(
    (h) => typeof h.scorePercent === 'number'
  );
  const groupedByItem = new Map<string, SubmissionHistoryEntry[]>();
  for (const h of historyWithScores) {
    const arr = groupedByItem.get(h.itemKey) || [];
    arr.push(h);
    groupedByItem.set(h.itemKey, arr);
  }
  const deltas: number[] = [];
  for (const entries of groupedByItem.values()) {
    if (entries.length >= 2) {
      const firstScore = entries[0].scorePercent ?? 0;
      const lastScore = entries[entries.length - 1].scorePercent ?? 0;
      deltas.push(lastScore - firstScore);
    }
  }
  if (deltas.length > 0) {
    improvementDelta = Math.round(
      deltas.reduce((a, b) => a + b, 0) / deltas.length
    );
  }

  const metrics = computeStudentAcademicMetrics(gameState, improvementDelta);
  const earnedBadges = getEarnedBadgeIds(gameState);
  const className =
    account.profile?.className ||
    gameState.profile?.className ||
    memoryStore.enrollments?.find((e) => e.studentUsername === account.username)?.className ||
    '6 Bestari';

  const latestLog = studentLogs[0];
  const needsReview =
    metrics.hasAnySubmission &&
    (feedbackList.length === 0 ||
      record.submissionHistory.some(
        (sub) =>
          !feedbackList.some(
            (fb) => fb.phaseId === sub.phaseId && fb.updatedAt >= sub.submittedAt
          )
      ));

  return {
    username: account.username,
    studentId: account.profile?.agentId || account.referenceNo || account.username.toUpperCase(),
    name: account.profile?.name || gameState.profile?.name || account.username,
    className,
    codenameBadge: account.profile?.codenameBadge || gameState.profile?.codenameBadge || 'Pelatih',
    photoUrl: account.profile?.photoUrl,
    isDemo: Boolean(account.isDemo),
    createdAt: account.createdAt,
    lastUpdated: record.updatedAt || gameState.lastUpdated,
    xp: gameState.xp,
    rank: getAgentRank(gameState.xp, gameState.finalReportSaved),
    earnedBadges,
    badgeUnlockDates: record.badgeUnlockDates || {},
    metrics,
    latestActivityText: latestLog
      ? latestLog.description
      : metrics.hasAnySubmission
        ? 'Tugasan disimpan dalam sistem'
        : 'Belum memulakan operasi',
    latestActivityAt: latestLog ? latestLog.timestamp : metrics.hasAnySubmission ? record.updatedAt : null,
    feedbackCount: feedbackList.length,
    needsReview,
  };
}

function buildStudentDossier(account: StoredAccount): TeacherStudentDossier {
  const summary = buildStudentSummary(account);
  const record = getOrCreateStudentRecord(account);
  const gameState = record.gameState;

  const opinionEvaluations = {} as Record<LocationId, OpinionEvaluationResult>;
  const reasoningEvaluations = {} as Record<LocationId, ReasoningEvaluationResult>;

  for (const loc of LOCATIONS) {
    const inv = gameState.investigations[loc.id];
    const opText = gameState.opinions[loc.id]?.opinionText || '';
    const rText = gameState.opinions[loc.id]?.reasonText || '';
    opinionEvaluations[loc.id] = evaluateOpinionCriteria(
      opText,
      loc.id,
      inv.notes,
      inv.initialProposal
    );
    reasoningEvaluations[loc.id] = evaluateReasoningCriteria(rText, opText, loc.id);
  }

  const teacherFeedback = (memoryStore.teacherFeedback || [])
    .filter((f) => f.studentUsername === account.username)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const activityLogs = (memoryStore.activityLogs || [])
    .filter((a) => a.studentUsername === account.username)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return {
    summary,
    gameState,
    opinionEvaluations,
    reasoningEvaluations,
    submissionHistory: [...record.submissionHistory].sort((a, b) =>
      b.submittedAt.localeCompare(a.submittedAt)
    ),
    teacherFeedback,
    activityLogs,
  };
}

function isTeacherAuthorisedForStudent(teacher: StoredAccount, student: StoredAccount): boolean {
  const assigned = teacher.assignedClasses || [];
  if (assigned.length === 0 || assigned.includes('*')) return true;
  const studentClass =
    student.profile?.className ||
    memoryStore.enrollments?.find((e) => e.studentUsername === student.username)?.className ||
    '6 Bestari';
  return assigned.includes(studentClass);
}

interface AuthedRequest extends Request {
  authAccount?: StoredAccount;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const rawToken = extractSessionToken(req);
  if (!rawToken) {
    res.status(401).json({
      authenticated: false,
      error: 'Akses disekat. Sila log masuk terlebih dahulu untuk memasuki sistem.',
    });
    return;
  }
  const verified = verifySession(rawToken, memoryStore.secretKey);
  if (!verified) {
    res.status(401).json({
      authenticated: false,
      error: 'Sesi anda telah tamat tempoh atau tidak sah. Sila log masuk semula.',
    });
    return;
  }
  const account = memoryStore.accounts[verified.username];
  if (!account) {
    res.status(401).json({
      authenticated: false,
      error: 'Akaun ejen tidak ditemui. Sila log masuk semula.',
    });
    return;
  }
  req.authAccount = account;
  next();
}

function requireTeacher(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.authAccount) {
    res.status(401).json({ error: 'Pengesahan diperlukan.' });
    return;
  }
  if (inferAccountRole(req.authAccount) !== 'teacher') {
    res.status(403).json({
      error: 'Akses ditolak. Papan pemuka guru hanya boleh diakses oleh akaun guru berdaftar.',
    });
    return;
  }
  next();
}

function createDemoPreviewAccounts(): void {
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
  const demoSpecs: {
    username: string;
    name: string;
    className: string;
    agentId: string;
    badge: string;
    scenario: 'complete' | 'mid' | 'early';
  }[] = [
    {
      username: 'demo.ahmad',
      name: '[DEMO] Ahmad Danial',
      className: '6 Bestari',
      agentId: 'DEMO-26-01',
      badge: 'Pena Emas',
      scenario: 'complete',
    },
    {
      username: 'demo.aisyah',
      name: '[DEMO] Siti Aisyah',
      className: '6 Bestari',
      agentId: 'DEMO-26-02',
      badge: 'Kanta Ilmu',
      scenario: 'mid',
    },
    {
      username: 'demo.hakim',
      name: '[DEMO] Hakim Zikri',
      className: '5 Bestari',
      agentId: 'DEMO-26-03',
      badge: 'Helang Bestari',
      scenario: 'early',
    },
  ];

  const pw = hashPassword('Demo#2026');
  for (const spec of demoSpecs) {
    const gs = createInitialGameState();
    const profile: StoredProfile = {
      name: spec.name,
      className: spec.className,
      codenameBadge: spec.badge,
      agentId: spec.agentId,
      verifiedAt: daysAgo(5),
    };
    gs.profile = profile;

    if (spec.scenario === 'complete' || spec.scenario === 'mid') {
      gs.investigations.kantin = {
        discoveredClueIds: ['kantin_sampah', 'kantin_meja', 'kantin_tong'],
        hintLevelUsed: 1,
        notes: 'Lantai kantin bersepah dengan plastik dan tong sampah melimpah selepas waktu rehat.',
        initialProposal: 'Tambah 3 tong sampah besar dan jadual bertugas kebersihan murid.',
        completed: true,
        completedAt: daysAgo(4),
      };
      gs.investigations.kelas = {
        discoveredClueIds: ['kelas_meja', 'kelas_sudut', 'kelas_bahan'],
        hintLevelUsed: 0,
        notes: 'Meja terselerak menghalang laluan dan sudut bacaan kosong tanpa bahan terkini.',
        initialProposal: 'Susun meja secara berkumpulan dan hias sudut ilmu dengan poster.',
        completed: true,
        completedAt: daysAgo(3),
      };
    }
    if (spec.scenario === 'complete') {
      gs.investigations.perpustakaan = {
        discoveredClueIds: ['perpus_buku', 'perpus_selesa', 'perpus_sudut'],
        hintLevelUsed: 0,
        notes: 'Buku tidak berlabel kategori dan ruang membaca kurang selesa kerana pencahayaan malap.',
        initialProposal: 'Label rak mengikut genre buku dan sediakan kusyen bacaan.',
        completed: true,
        completedAt: daysAgo(3),
      };
      gs.investigations.taman = {
        discoveredClueIds: ['taman_tumbuhan', 'taman_kawasan', 'taman_duduk'],
        hintLevelUsed: 1,
        notes: 'Pokok bunga layu dan tiada bangku untuk murid berehat di laman.',
        initialProposal: 'Tanam semula pokok bunga dan bina empat bangku kayu.',
        completed: true,
        completedAt: daysAgo(2),
      };
      gs.selectedEvidenceIds = ['kantin', 'kelas', 'taman'];
      gs.opinions.kantin = {
        locationId: 'kantin',
        opinionText:
          'Pada pendapat saya, pihak sekolah perlu menambah tong sampah bertutup di kantin supaya sisa makanan tidak bertaburan.',
        reasonText:
          'Hal ini kerana tong sampah yang mencukupi memudahkan murid membuang sampah serta mengelakkan bau busuk dan serangga perosak.',
      };
      gs.opinions.kelas = {
        locationId: 'kelas',
        opinionText:
          'Saya berpendapat bahawa susunan meja di Kelas Harmoni wajar dikemaskan agar laluan pergerakan lebih selamat.',
        reasonText:
          'Susunan yang teratur penting supaya murid dapat bergerak dengan lancar dan memberi tumpuan penuh semasa belajar.',
      };
      gs.opinions.taman = {
        locationId: 'taman',
        opinionText:
          'Bagi mengatasi masalah ini, warga sekolah sepatutnya menanam pokok bunga dan menyediakan bangku di Taman Rekreasi.',
        reasonText:
          'Taman yang ceria dan mempunyai tempat duduk membolehkan murid berehat serta membaca di luar bilik darjah.',
      };
      gs.logicChallengeAnswers = {
        logic_kantin: 'A',
        logic_kelas: 'B',
        logic_taman: 'A',
      };
      gs.builderPlan = [
        ...gs.builderPlan.map((item) =>
          item.linkedLocationId === 'kantin'
            ? {
                ...item,
                justification:
                  'Kantin diubah suai dengan ruang makan teratur dan sinki cuci tangan berhampiran pintu masuk.',
              }
            : item
        ),
        {
          uid: 'demo_tong_1',
          assetId: 'tong_sampah',
          row: 1,
          col: 2,
          actionType: 'tambah_baharu',
          linkedLocationId: 'kantin',
          justification: 'Menambah tong sampah kitar semula supaya sampah tidak melimpah di kantin.',
        },
      ];
      gs.builderSaved = true;
      gs.finalReportText =
        'Sekolah Seri Bestari memerlukan penambahbaikan segera di kantin, bilik darjah dan taman rekreasi. Pada pendapat saya, penambahan tong sampah di kantin wajar dilaksanakan supaya kebersihan terjaga. Selain itu, susunan meja kelas yang kemas dapat melancarkan pergerakan murid semasa belajar. Melalui Pelan Sekolah Impian, kawasan taman turut dilengkapkan dengan bangku dan pokok bunga agar murid lebih selesa.';
      gs.finalReportSaved = true;
      gs.xp = 1120;
    } else if (spec.scenario === 'mid') {
      gs.selectedEvidenceIds = ['kantin', 'kelas'];
      gs.opinions.kantin = {
        locationId: 'kantin',
        opinionText: 'Kantin perlu dibersihkan dan ditambah tong sampah.',
        reasonText: '',
      };
      gs.opinions.kelas = {
        locationId: 'kelas',
        opinionText: 'Pada pendapat saya, meja kelas patut disusun kemas supaya murid selesa belajar.',
        reasonText: '',
      };
      gs.logicChallengeAnswers = {
        logic_kantin: 'A',
        logic_kelas: 'A',
      };
      gs.xp = 420;
    } else {
      gs.investigations.kantin = {
        discoveredClueIds: ['kantin_sampah'],
        hintLevelUsed: 1,
        notes: '',
        initialProposal: '',
        completed: false,
      };
      gs.xp = 70;
    }

    const account: StoredAccount = {
      username: spec.username,
      passwordSalt: pw.salt,
      passwordHash: pw.hash,
      accountRole: 'student',
      role: 'Anggota Pelatih (Data Demo) · Sekolah Seri Bestari',
      referenceNo: spec.agentId,
      isDemo: true,
      createdAt: daysAgo(5),
      profile,
    };

    memoryStore.accounts[spec.username] = account;
    const prevRec: PersistedStudentRecord = {
      username: spec.username,
      gameState: createInitialGameState(),
      badgeUnlockDates: {},
      submissionHistory: [],
      updatedAt: daysAgo(5),
    };
    memoryStore.studentRecords![spec.username] = prevRec;
    syncStudentSubmissionChanges(account, prevRec, gs);

    const matchedClass = Object.values(memoryStore.classes!).find(
      (c) => c.name === spec.className
    );
    if (
      matchedClass &&
      !memoryStore.enrollments!.some((e) => e.studentUsername === spec.username)
    ) {
      memoryStore.enrollments!.push({
        studentUsername: spec.username,
        classId: matchedClass.id,
        className: spec.className,
        sessionYear: matchedClass.sessionYear,
        enrolledAt: daysAgo(5),
      });
    }
  }
  saveStore(memoryStore);
}

function clearDemoPreviewAccounts(): void {
  const demoUsernames = Object.values(memoryStore.accounts)
    .filter((a) => a.isDemo)
    .map((a) => a.username);
  for (const uname of demoUsernames) {
    delete memoryStore.accounts[uname];
    if (memoryStore.studentRecords) {
      delete memoryStore.studentRecords[uname];
    }
  }
  if (memoryStore.enrollments) {
    memoryStore.enrollments = memoryStore.enrollments.filter(
      (e) => !demoUsernames.includes(e.studentUsername)
    );
  }
  if (memoryStore.teacherFeedback) {
    memoryStore.teacherFeedback = memoryStore.teacherFeedback.filter(
      (f) => !demoUsernames.includes(f.studentUsername)
    );
  }
  if (memoryStore.activityLogs) {
    memoryStore.activityLogs = memoryStore.activityLogs.filter(
      (a) => !demoUsernames.includes(a.studentUsername)
    );
  }
  saveStore(memoryStore);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'akademi-ejen-rahsia-seri-bestari' });
  });

  // =========================================================================
  // AUTHENTICATION ENDPOINTS
  // =========================================================================
  app.get('/api/auth/session', (req: AuthedRequest, res: Response) => {
    const rawToken = extractSessionToken(req);
    if (!rawToken) {
      res.json({ authenticated: false });
      return;
    }
    const verified = verifySession(rawToken, memoryStore.secretKey);
    if (!verified) {
      res.json({ authenticated: false });
      return;
    }
    const account = memoryStore.accounts[verified.username];
    if (!account) {
      res.json({ authenticated: false });
      return;
    }
    res.json({
      authenticated: true,
      user: sanitizeUserResponse(account),
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const usernameRaw =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body?.rememberMe);

    if (usernameRaw.length < 3 || password.length < 4) {
      res.status(400).json({
        error: 'Sila masukkan Nama Pengguna / ID Ejen dan Kata Laluan yang lengkap.',
      });
      return;
    }

    const account = memoryStore.accounts[usernameRaw];
    if (!account || !verifyPassword(password, account.passwordSalt, account.passwordHash)) {
      res.status(401).json({
        error:
          'Nama pengguna / ID Ejen atau kata laluan tidak tepat. Sila semak dan cuba semula.',
      });
      return;
    }

    const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const token = signSession(
      { username: account.username, exp: Date.now() + ttlMs },
      memoryStore.secretKey
    );
    setSessionCookie(res, req, token, ttlMs);

    res.json({
      authenticated: true,
      token,
      user: sanitizeUserResponse(account),
    });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const usernameRaw =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const rememberMe = Boolean(req.body?.rememberMe);
    const requestedRole: AccountRole =
      req.body?.accountRole === 'teacher' ? 'teacher' : 'student';
    const teacherCode =
      typeof req.body?.teacherCode === 'string'
        ? req.body.teacherCode.trim().toUpperCase()
        : '';
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const className =
      typeof req.body?.className === 'string' && req.body.className.trim()
        ? req.body.className.trim()
        : '6 Bestari';

    if (!/^[a-z0-9._-]{3,32}$/.test(usernameRaw)) {
      res.status(400).json({
        error:
          'Nama pengguna mesti 3–32 aksara (huruf kecil, nombor, titik, sengkang atau garis bawah).',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        error: 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.',
      });
      return;
    }

    if (requestedRole === 'teacher' && teacherCode !== TEACHER_REGISTRATION_CODE) {
      res.status(403).json({
        error:
          'Kod pengesahan guru tidak sah. Sila masukkan kod rasmi guru akademi (GURU2026) untuk mendaftar sebagai guru.',
      });
      return;
    }

    if (memoryStore.accounts[usernameRaw]) {
      res.status(409).json({
        error: 'ID Ejen ini telah didaftarkan. Sila log masuk atau pilih ID lain.',
      });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const refNumber = generateNextReferenceNo(memoryStore.accounts);
    const now = new Date().toISOString();

    const existingIds = new Set(
      Object.values(memoryStore.accounts)
        .map((acc) => acc.profile?.agentId)
        .filter((id): id is string => Boolean(id))
    );

    const newAccount: StoredAccount = {
      username: usernameRaw,
      passwordSalt: salt,
      passwordHash: hash,
      accountRole: requestedRole,
      role:
        requestedRole === 'teacher'
          ? 'Guru Pembimbing Operasi · Akademi Ejen Rahsia'
          : 'Anggota Pelatih · Sekolah Seri Bestari',
      referenceNo: refNumber,
      assignedClasses:
        requestedRole === 'teacher'
          ? Object.values(memoryStore.classes || {}).map((c) => c.name)
          : undefined,
      createdAt: now,
      profile:
        requestedRole === 'teacher'
          ? {
              name: fullName || usernameRaw,
              className: '6 Bestari',
              codenameBadge: 'Kanta Ilmu',
              agentId: generateUniqueAgentId(existingIds, 'GURU-SB'),
              verifiedAt: now,
              photoUrl: DEFAULT_TEACHER_PHOTO,
              designation: 'Guru Bahasa Melayu · Sekolah Seri Bestari',
            }
          : fullName
            ? {
                name: fullName,
                className,
                codenameBadge: 'Helang Bestari',
                agentId: generateUniqueAgentId(existingIds),
                verifiedAt: now,
              }
            : null,
    };

    memoryStore.accounts[usernameRaw] = newAccount;
    if (requestedRole === 'student') {
      const matchedClass =
        Object.values(memoryStore.classes || {}).find((c) => c.name === className) ||
        Object.values(memoryStore.classes || {})[0];
      if (matchedClass) {
        memoryStore.enrollments!.push({
          studentUsername: usernameRaw,
          classId: matchedClass.id,
          className: matchedClass.name,
          sessionYear: matchedClass.sessionYear,
          enrolledAt: now,
        });
      }
      getOrCreateStudentRecord(newAccount);
    }
    saveStore(memoryStore);

    const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 12 * 60 * 60 * 1000;
    const token = signSession(
      { username: newAccount.username, exp: Date.now() + ttlMs },
      memoryStore.secretKey
    );
    setSessionCookie(res, req, token, ttlMs);

    res.status(201).json({
      authenticated: true,
      token,
      user: sanitizeUserResponse(newAccount),
    });
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const usernameRaw =
      typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const recoveryCode =
      typeof req.body?.recoveryCode === 'string'
        ? req.body.recoveryCode.trim().toUpperCase()
        : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    const account = memoryStore.accounts[usernameRaw];
    if (!account) {
      res.status(404).json({
        error: 'Nama pengguna / ID Ejen tidak ditemui dalam rekod akademi.',
      });
      return;
    }

    if (recoveryCode !== RECOVERY_SECRET_CODE) {
      res.status(403).json({
        error: 'Kod keselamatan akademi tidak sah. Sila rujuk Pembimbing Operasi.',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        error: 'Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.',
      });
      return;
    }

    const { salt, hash } = hashPassword(newPassword);
    account.passwordSalt = salt;
    account.passwordHash = hash;
    saveStore(memoryStore);

    res.json({
      ok: true,
      message:
        'Kata laluan berjaya ditetapkan semula. Anda kini boleh log masuk dengan kata laluan baharu.',
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(res, req);
    res.json({ ok: true });
  });

  // =========================================================================
  // STUDENT PROFILE & PERSISTENT LEARNING STATE ENDPOINTS
  // =========================================================================
  app.get('/api/agent/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({
      user: sanitizeUserResponse(req.authAccount!),
    });
  });

  app.post('/api/agent/profile', requireAuth, (req: AuthedRequest, res: Response) => {
    const account = req.authAccount!;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const className = typeof req.body?.className === 'string' ? req.body.className.trim() : '';
    const codenameBadge =
      typeof req.body?.codenameBadge === 'string' ? req.body.codenameBadge.trim() : '';

    if (name.length < 2) {
      res.status(400).json({
        error: 'Sila masukkan Nama Penuh Ejen (sekurang-kurangnya 2 huruf).',
      });
      return;
    }

    if (className.length < 2) {
      res.status(400).json({
        error: 'Sila pilih kelas yang sah.',
      });
      return;
    }

    const allowedBadges = ['Helang Bestari', 'Kanta Ilmu', 'Pena Emas', 'Arkitek Muda'];
    if (!allowedBadges.includes(codenameBadge)) {
      res.status(400).json({
        error: 'Sila pilih salah satu daripada 4 gelaran pasukan rasmi.',
      });
      return;
    }

    const existingIds = new Set(
      Object.values(memoryStore.accounts)
        .map((acc) => acc.profile?.agentId)
        .filter((id): id is string => Boolean(id))
    );

    const agentId = account.profile?.agentId || generateUniqueAgentId(existingIds);
    const verifiedAt = new Date().toISOString();

    account.profile = {
      ...account.profile,
      name,
      className,
      codenameBadge,
      agentId,
      verifiedAt,
    };

    if (inferAccountRole(account) === 'student') {
      const rec = getOrCreateStudentRecord(account);
      rec.gameState.profile = account.profile;
      const existingEnrollment = memoryStore.enrollments?.find(
        (e) => e.studentUsername === account.username
      );
      const matchedClass = Object.values(memoryStore.classes || {}).find(
        (c) => c.name === className
      );
      if (existingEnrollment) {
        existingEnrollment.className = className;
        if (matchedClass) existingEnrollment.classId = matchedClass.id;
      } else {
        memoryStore.enrollments!.push({
          studentUsername: account.username,
          classId: matchedClass?.id || `cls_${className.toLowerCase().replace(/\s+/g, '_')}`,
          className,
          sessionYear: matchedClass?.sessionYear || '2026/2027',
          enrolledAt: verifiedAt,
        });
      }
    }

    saveStore(memoryStore);

    res.json({
      user: sanitizeUserResponse(account),
      profile: account.profile,
    });
  });

  app.get('/api/student/state', requireAuth, (req: AuthedRequest, res: Response) => {
    const account = req.authAccount!;
    const hadRecord = Boolean(memoryStore.studentRecords?.[account.username]);
    const record = getOrCreateStudentRecord(account);
    const feedback = (memoryStore.teacherFeedback || []).filter(
      (f) => f.studentUsername === account.username
    );
    if (!hadRecord) {
      saveStore(memoryStore);
    }
    res.json({
      ok: true,
      gameState: record.gameState,
      teacherFeedback: feedback,
      updatedAt: record.updatedAt,
    });
  });

  app.put('/api/student/state', requireAuth, (req: AuthedRequest, res: Response) => {
    const account = req.authAccount!;
    const incoming = req.body?.gameState as Partial<GameState> | undefined;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Data keadaan permainan tidak sah.' });
      return;
    }

    const prevRecord = getOrCreateStudentRecord(account);
    const normalizedNext = normalizeGameState(incoming, account.profile);
    // Preserve server-verified profile identity
    if (account.profile) {
      normalizedNext.profile = account.profile;
    }

    const updated = syncStudentSubmissionChanges(account, prevRecord, normalizedNext);
    saveStore(memoryStore);

    res.json({
      ok: true,
      gameState: updated.gameState,
      updatedAt: updated.updatedAt,
    });
  });

  app.post('/api/student/reset', requireAuth, (req: AuthedRequest, res: Response) => {
    const account = req.authAccount!;
    const fresh = createInitialGameState();
    fresh.profile = account.profile;
    memoryStore.studentRecords![account.username] = {
      username: account.username,
      gameState: fresh,
      badgeUnlockDates: {},
      submissionHistory: [],
      updatedAt: new Date().toISOString(),
    };
    saveStore(memoryStore);
    res.json({ ok: true, gameState: fresh });
  });

  // =========================================================================
  // TEACHER COMMAND CENTER ENDPOINTS (RBAC PROTECTED)
  // =========================================================================
  app.get(
    '/api/teacher/dashboard',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const qSession = typeof req.query.session === 'string' ? req.query.session.trim() : '';
      const qYear = typeof req.query.year === 'string' ? req.query.year.trim() : '';
      const qClass = typeof req.query.className === 'string' ? req.query.className.trim() : '';
      const qStudent = typeof req.query.student === 'string' ? req.query.student.trim() : '';
      const qDateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom.trim() : '';
      const qDateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo.trim() : '';
      const includeDemo = req.query.includeDemo === '1' || req.query.includeDemo === 'true';

      const allClasses = Object.values(memoryStore.classes || {});
      const teacherClasses = allClasses.filter((c) => {
        const assigned = teacher.assignedClasses || [];
        return assigned.length === 0 || assigned.includes('*') || assigned.includes(c.name);
      });

      const allStudentAccounts = Object.values(memoryStore.accounts).filter(
        (acc) =>
          inferAccountRole(acc) === 'student' &&
          isTeacherAuthorisedForStudent(teacher, acc)
      );
      const hasDemoStudents = allStudentAccounts.some((a) => Boolean(a.isDemo));

      const visibleAccounts = allStudentAccounts.filter(
        (acc) => includeDemo || !acc.isDemo
      );

      let students = visibleAccounts.map(buildStudentSummary);

      // Apply filters: Session, Year, Class, Student, Date range
      if (qSession && qSession !== 'semua') {
        const matchingClassNames = new Set(
          teacherClasses.filter((c) => c.sessionYear === qSession).map((c) => c.name)
        );
        students = students.filter((s) => matchingClassNames.has(s.className));
      }
      if (qYear && qYear !== 'semua') {
        const matchingClassNames = new Set(
          teacherClasses.filter((c) => c.yearLevel === qYear).map((c) => c.name)
        );
        students = students.filter((s) => matchingClassNames.has(s.className));
      }
      if (qClass && qClass !== 'semua') {
        students = students.filter((s) => s.className === qClass);
      }
      if (qStudent && qStudent !== 'semua') {
        students = students.filter((s) => s.username === qStudent);
      }
      if (qDateFrom || qDateTo) {
        students = students.filter((s) => {
          const refDate = (s.latestActivityAt || s.lastUpdated || s.createdAt).slice(0, 10);
          if (qDateFrom && refDate < qDateFrom) return false;
          if (qDateTo && refDate > qDateTo) return false;
          return true;
        });
      }

      const studentUsernamesSet = new Set(students.map((s) => s.username));

      // KPIs computed strictly from filtered database students
      const totalStudents = students.length;
      const activeStudents = students.filter(
        (s) => s.metrics.hasAnySubmission || s.xp > 0
      ).length;
      const studentsWithSubmissions = students.filter((s) => s.metrics.hasAnySubmission).length;

      const completedAssignments = students.reduce(
        (sum, s) => sum + s.metrics.totalTasksCompleted,
        0
      );
      const pendingAssignments = students.reduce(
        (sum, s) => sum + s.metrics.totalTasksPending,
        0
      );
      const totalAssignments = completedAssignments + pendingAssignments;
      const completionPercent =
        totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

      const scoredStudents = students.filter(
        (s) => s.metrics.overallAcademicScore !== null
      );
      const averageAcademicScore =
        scoredStudents.length > 0
          ? Math.round(
              scoredStudents.reduce(
                (sum, s) => sum + (s.metrics.overallAcademicScore || 0),
                0
              ) / scoredStudents.length
            )
          : null;

      const studentsWithDelta = students.filter(
        (s) => s.metrics.improvementDelta !== null
      );
      const performanceDelta =
        studentsWithDelta.length > 0
          ? Math.round(
              studentsWithDelta.reduce(
                (sum, s) => sum + (s.metrics.improvementDelta || 0),
                0
              ) / studentsWithDelta.length
            )
          : null;

      const topCandidate = [...scoredStudents].sort((a, b) => {
        const diff = (b.metrics.overallAcademicScore || 0) - (a.metrics.overallAcademicScore || 0);
        if (diff !== 0) return diff;
        return b.metrics.missionCompletionPercent - a.metrics.missionCompletionPercent;
      })[0];

      const topStudent = topCandidate
        ? {
            username: topCandidate.username,
            name: topCandidate.name,
            className: topCandidate.className,
            scorePercent: topCandidate.metrics.overallAcademicScore || 0,
            badgeName:
              topCandidate.earnedBadges.length > 0
                ? BADGES.find(
                    (b) => b.id === topCandidate.earnedBadges[topCandidate.earnedBadges.length - 1]
                  )?.name || topCandidate.codenameBadge
                : topCandidate.codenameBadge,
            xp: topCandidate.xp,
          }
        : null;

      // Phase Summary across existing phases
      const phaseDefs: {
        phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
        label: string;
        shortLabel: string;
        statusKey: keyof TeacherStudentSummary['metrics'];
        scoreKey: keyof TeacherStudentSummary['metrics'];
      }[] = [
        {
          phaseId: 'phase1',
          label: 'Fasa 1 — Operasi Jejak Bukti',
          shortLabel: 'Fasa 1 · Cari Bukti',
          statusKey: 'phase1Status',
          scoreKey: 'phase1Score',
        },
        {
          phaseId: 'phase2',
          label: 'Fasa 2 — Makmal Analisis Kes',
          shortLabel: 'Fasa 2 · Analisis Kes',
          statusKey: 'phase2Status',
          scoreKey: 'phase2Score',
        },
        {
          phaseId: 'phase3',
          label: 'Fasa 3 — Buktikan Teori',
          shortLabel: 'Fasa 3 · Buktikan Teori',
          statusKey: 'phase3Status',
          scoreKey: 'phase3Score',
        },
        {
          phaseId: 'phase4',
          label: 'Cabaran Akhir — Studio Arkitek',
          shortLabel: 'Studio Arkitek',
          statusKey: 'phase4Status',
          scoreKey: 'phase4Score',
        },
        {
          phaseId: 'phase5',
          label: 'Produk Akhir — Laporan Sekolah Impian',
          shortLabel: 'Laporan Akhir',
          statusKey: 'phase5Status',
          scoreKey: 'phase5Score',
        },
      ];

      const phaseSummary = phaseDefs.map((p) => {
        const completedCount = students.filter(
          (s) => s.metrics[p.statusKey] === 'completed'
        ).length;
        const inProgressCount = students.filter(
          (s) =>
            s.metrics[p.statusKey] === 'in_progress' || s.metrics[p.statusKey] === 'submitted'
        ).length;
        const notStartedCount = Math.max(0, totalStudents - completedCount - inProgressCount);
        const phaseScores = students
          .map((s) => s.metrics[p.scoreKey] as number | null)
          .filter((v): v is number => v !== null);
        const averageScore =
          phaseScores.length > 0
            ? Math.round(phaseScores.reduce((a, b) => a + b, 0) / phaseScores.length)
            : null;
        return {
          phaseId: p.phaseId,
          label: p.label,
          shortLabel: p.shortLabel,
          completedCount,
          inProgressCount,
          notStartedCount,
          completionPercent:
            totalStudents > 0 ? Math.round((completedCount / totalStudents) * 100) : 0,
          averageScore,
        };
      });

      // Timeline series from actual submissionHistory timestamps
      const timelineMap = new Map<string, { count: number; scores: number[] }>();
      for (const s of students) {
        const rec = memoryStore.studentRecords?.[s.username];
        if (!rec) continue;
        for (const sub of rec.submissionHistory || []) {
          const day = sub.submittedAt.slice(0, 10);
          if (qDateFrom && day < qDateFrom) continue;
          if (qDateTo && day > qDateTo) continue;
          const bucket = timelineMap.get(day) || { count: 0, scores: [] };
          bucket.count += 1;
          if (typeof sub.scorePercent === 'number') {
            bucket.scores.push(sub.scorePercent);
          }
          timelineMap.set(day, bucket);
        }
      }
      const timelineSeries = Array.from(timelineMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-10)
        .map(([dateLabel, bucket]) => ({
          dateLabel,
          submissionsCount: bucket.count,
          averageScore:
            bucket.scores.length > 0
              ? Math.round(bucket.scores.reduce((a, b) => a + b, 0) / bucket.scores.length)
              : null,
        }));

      // Location Aggregates for 3D School Map (strictly aggregated, no student PII)
      const locationAggregates = LOCATIONS.map((loc) => {
        let completedStudents = 0;
        let inProgressStudents = 0;
        let cluesDiscoveredTotal = 0;
        const locScores: number[] = [];

        for (const s of students) {
          const rec = memoryStore.studentRecords?.[s.username];
          if (!rec) continue;
          const inv = rec.gameState.investigations[loc.id];
          cluesDiscoveredTotal += inv.discoveredClueIds.length;
          if (inv.completed) {
            completedStudents += 1;
          } else if (
            inv.discoveredClueIds.length > 0 ||
            inv.notes.trim().length > 0 ||
            inv.initialProposal.trim().length > 0
          ) {
            inProgressStudents += 1;
          }
          const opText = (rec.gameState.opinions[loc.id]?.opinionText || '').trim();
          if (opText.length > 0) {
            const evalRes = evaluateOpinionCriteria(
              opText,
              loc.id,
              inv.notes,
              inv.initialProposal
            );
            locScores.push(evalRes.scorePercent);
          }
        }

        return {
          locationId: loc.id,
          name: loc.name,
          shortName: loc.shortName,
          zoneLabel: loc.zoneLabel,
          completedStudents,
          inProgressStudents,
          totalStudents,
          completionPercent:
            totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0,
          averageAcademicScore:
            locScores.length > 0
              ? Math.round(locScores.reduce((a, b) => a + b, 0) / locScores.length)
              : null,
          cluesDiscoveredTotal,
        };
      });

      // Recent Activities (filtered by visible/filtered students and date range)
      const recentActivities = (memoryStore.activityLogs || [])
        .filter((log) => {
          if (!studentUsernamesSet.has(log.studentUsername)) return false;
          const day = log.timestamp.slice(0, 10);
          if (qDateFrom && day < qDateFrom) return false;
          if (qDateTo && day > qDateTo) return false;
          return true;
        })
        .slice(0, 30);

      // Unlocked achievements list
      const achievements: TeacherDashboardPayload['achievements'] = [];
      for (const s of students) {
        for (const badgeId of s.earnedBadges) {
          const def = BADGES.find((b) => b.id === badgeId);
          if (!def) continue;
          achievements.push({
            badgeId,
            badgeName: def.name,
            description: def.description,
            studentUsername: s.username,
            studentName: s.name,
            className: s.className,
            unlockedAt: s.badgeUnlockDates[badgeId] || s.lastUpdated,
          });
        }
      }
      achievements.sort((a, b) => b.unlockedAt.localeCompare(a.unlockedAt));

      // Data-Driven Teacher Insights (only when supported by real data!)
      const insights: TeacherInsightItem[] = [];
      if (students.length === 0) {
        insights.push({
          id: 'ins_empty_students',
          severity: 'info',
          title: 'Tiada Rekod Murid dalam Penapis Semasa',
          description:
            'Tiada murid ditemui bagi penapis kelas atau tarikh yang dipilih. Daftar murid atau ubah penapis untuk melihat analisis.',
          affectedCount: 0,
        });
      } else if (studentsWithSubmissions === 0) {
        insights.push({
          id: 'ins_no_submissions',
          severity: 'info',
          title: 'Menunggu Penghantaran Tugasan Pertama',
          description: `Seramai ${totalStudents} orang murid telah berdaftar, namun belum ada rekod tugasan dihantar. Petua pengajar akan dijana secara automatik sebaik sahaja murid menyimpan jawapan.`,
          affectedCount: totalStudents,
        });
      } else {
        const notCompletedPhase1 = students.filter(
          (s) => s.metrics.phase1Status !== 'completed'
        ).length;
        if (notCompletedPhase1 > 0) {
          insights.push({
            id: 'ins_p1_incomplete',
            severity: 'warning',
            title: 'Murid Belum Melengkapkan Fasa 1 — Operasi Jejak Bukti',
            description: `${notCompletedPhase1} daripada ${totalStudents} orang murid masih belum melengkapkan penyiasatan di keempat-empat lokasi Sekolah Seri Bestari.`,
            affectedCount: notCompletedPhase1,
            targetPhase: 'phase1',
          });
        }

        // Check Phase 2 evidence-linking difficulty from real evaluated criteria
        let weakEvidenceLinkCount = 0;
        let incompleteSentenceCount = 0;
        for (const s of students) {
          const rec = memoryStore.studentRecords?.[s.username];
          if (!rec) continue;
          const targets =
            rec.gameState.selectedEvidenceIds.length > 0
              ? rec.gameState.selectedEvidenceIds
              : LOCATIONS.map((l) => l.id).filter(
                  (id) => (rec.gameState.opinions[id]?.opinionText || '').trim().length > 0
                );
          let studentWeakLink = false;
          let studentIncomplete = false;
          for (const locId of targets) {
            const text = (rec.gameState.opinions[locId]?.opinionText || '').trim();
            if (!text) continue;
            const inv = rec.gameState.investigations[locId];
            const ev = evaluateOpinionCriteria(text, locId, inv.notes, inv.initialProposal);
            if (!ev.evidenceLink.met) studentWeakLink = true;
            if (!ev.completeness.met) studentIncomplete = true;
          }
          if (studentWeakLink) weakEvidenceLinkCount += 1;
          if (studentIncomplete) incompleteSentenceCount += 1;
        }

        if (weakEvidenceLinkCount > 0) {
          insights.push({
            id: 'ins_p2_evidence_link',
            severity: 'warning',
            title: 'Bimbingan Perkaitan Bukti & Pendapat Diperlukan',
            description: `${weakEvidenceLinkCount} orang murid masih memerlukan bimbingan untuk mengaitkan bukti lokasi secara langsung dalam ayat pendapat mereka.`,
            affectedCount: weakEvidenceLinkCount,
            targetPhase: 'phase2',
          });
        }

        if (incompleteSentenceCount > 0) {
          insights.push({
            id: 'ins_p2_incomplete_sentence',
            severity: 'warning',
            title: 'Struktur & Kelengkapan Ayat Pendapat',
            description: `${incompleteSentenceCount} orang murid menghantar ayat pendapat yang masih ringkas atau belum diakhiri dengan tanda noktah (.).`,
            affectedCount: incompleteSentenceCount,
            targetPhase: 'phase2',
          });
        }

        const improvedStudents = students.filter(
          (s) => (s.metrics.improvementDelta || 0) > 0
        ).length;
        if (improvedStudents > 0) {
          insights.push({
            id: 'ins_positive_growth',
            severity: 'positive',
            title: 'Peningkatan Prestasi Merentas Percubaan',
            description: `${improvedStudents} orang murid menunjukkan peningkatan markah penilaian antara percubaan awal dengan semakan terkini.`,
            affectedCount: improvedStudents,
          });
        }

        if (insights.length === 0) {
          insights.push({
            id: 'ins_all_good',
            severity: 'positive',
            title: 'Prestasi Kelas Berada pada Tahap Baik',
            description:
              'Murid yang menghantar tugasan telah memenuhi kriteria kelengkapan ayat, perkaitan bukti dan kejelasan pendapat.',
            affectedCount: studentsWithSubmissions,
          });
        }
      }

      const sessions = Array.from(
        new Set(teacherClasses.map((c) => c.sessionYear))
      ).sort();

      const payload: TeacherDashboardPayload = {
        teacher: sanitizeUserResponse(teacher),
        classes: teacherClasses,
        sessions,
        kpis: {
          totalStudents,
          activeStudents,
          studentsWithSubmissions,
          completedAssignments,
          pendingAssignments,
          completionPercent,
          averageAcademicScore,
          performanceDelta,
          topStudent,
        },
        phaseSummary,
        timelineSeries,
        locationAggregates,
        students,
        recentActivities,
        achievements,
        insights,
        hasDemoStudents,
      };

      res.json(payload);
    }
  );

  app.get(
    '/api/teacher/students/:username',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const targetUsername = String(req.params.username || '').trim().toLowerCase();
      const studentAccount = memoryStore.accounts[targetUsername];
      if (!studentAccount || inferAccountRole(studentAccount) !== 'student') {
        res.status(404).json({ error: 'Rekod murid tidak ditemui.' });
        return;
      }
      if (!isTeacherAuthorisedForStudent(teacher, studentAccount)) {
        res.status(403).json({
          error: 'Anda tidak mempunyai kebenaran untuk mengakses fail murid daripada kelas ini.',
        });
        return;
      }
      const dossier = buildStudentDossier(studentAccount);
      res.json(dossier);
    }
  );

  app.post(
    '/api/teacher/feedback',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const studentUsername =
        typeof req.body?.studentUsername === 'string'
          ? req.body.studentUsername.trim().toLowerCase()
          : '';
      const phaseId = req.body?.phaseId as TeacherFeedbackRecord['phaseId'];
      const itemKey = typeof req.body?.itemKey === 'string' ? req.body.itemKey.trim() : '';
      const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
      const rawDecision =
        typeof req.body?.assessmentDecision === 'string'
          ? req.body.assessmentDecision.trim()
          : '';
      const validDecisions = ['', 'cemerlang', 'memuaskan', 'perlu_bimbingan'] as const;
      if (!validDecisions.includes(rawDecision as (typeof validDecisions)[number])) {
        res.status(400).json({ error: 'Tahap penilaian guru tidak sah.' });
        return;
      }
      const assessmentDecision = rawDecision as TeacherFeedbackRecord['assessmentDecision'];

      if (!['phase1', 'phase2', 'phase3', 'phase4', 'phase5'].includes(phaseId)) {
        res.status(400).json({ error: 'Fasa tugasan tidak sah.' });
        return;
      }
      if (!itemKey || comment.length < 2) {
        res.status(400).json({
          error: 'Sila tulis komen atau bimbingan guru sekurang-kurangnya 2 aksara.',
        });
        return;
      }

      const studentAccount = memoryStore.accounts[studentUsername];
      if (!studentAccount || inferAccountRole(studentAccount) !== 'student') {
        res.status(404).json({ error: 'Murid tidak ditemui.' });
        return;
      }
      if (!isTeacherAuthorisedForStudent(teacher, studentAccount)) {
        res.status(403).json({ error: 'Tiada kebenaran bagi murid ini.' });
        return;
      }

      const now = new Date().toISOString();
      const feedbackList = memoryStore.teacherFeedback || (memoryStore.teacherFeedback = []);
      const existing = feedbackList.find(
        (f) =>
          f.studentUsername === studentUsername &&
          f.phaseId === phaseId &&
          f.itemKey === itemKey &&
          f.teacherUsername === teacher.username
      );

      let savedRecord: TeacherFeedbackRecord;
      if (existing) {
        existing.comment = comment;
        existing.assessmentDecision = assessmentDecision || '';
        existing.updatedAt = now;
        existing.teacherName = teacher.profile?.name || teacher.username;
        savedRecord = existing;
      } else {
        savedRecord = {
          id: `fb_${crypto.randomUUID().slice(0, 12)}`,
          studentUsername,
          phaseId,
          itemKey,
          teacherUsername: teacher.username,
          teacherName: teacher.profile?.name || teacher.username,
          comment,
          assessmentDecision: assessmentDecision || '',
          createdAt: now,
          updatedAt: now,
        };
        feedbackList.push(savedRecord);
      }

      appendActivityLog({
        studentUsername,
        studentName: studentAccount.profile?.name || studentAccount.username,
        className: studentAccount.profile?.className || '6 Bestari',
        eventType: 'teacher_feedback',
        description: `${teacher.profile?.name || teacher.username} menambah ulasan guru (${phaseId.toUpperCase()})`,
        phaseId,
        timestamp: now,
      });

      saveStore(memoryStore);
      res.json({ ok: true, feedback: savedRecord });
    }
  );

  app.post(
    '/api/teacher/classes',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const yearLevel =
        typeof req.body?.yearLevel === 'string' && req.body.yearLevel.trim()
          ? req.body.yearLevel.trim()
          : 'Tahun 6';
      const sessionYear =
        typeof req.body?.sessionYear === 'string' && req.body.sessionYear.trim()
          ? req.body.sessionYear.trim()
          : '2026/2027';

      if (name.length < 2) {
        res.status(400).json({ error: 'Nama kelas mestilah sekurang-kurangnya 2 aksara.' });
        return;
      }

      const classes = memoryStore.classes || (memoryStore.classes = {});
      const duplicate = Object.values(classes).find(
        (c) => c.name.toLowerCase() === name.toLowerCase() && c.sessionYear === sessionYear
      );
      if (duplicate) {
        res.status(409).json({ error: 'Kelas ini sudah wujud bagi sesi tersebut.' });
        return;
      }

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'kelas';
      let id = `cls_${baseSlug}_${Date.now().toString().slice(-4)}`;
      while (classes[id]) {
        id = `cls_${baseSlug}_${crypto.randomBytes(3).toString('hex')}`;
      }
      const created: ClassRecord = {
        id,
        name,
        yearLevel,
        sessionYear,
        teacherUsername: teacher.username,
        createdAt: new Date().toISOString(),
      };
      classes[id] = created;

      const assigned = new Set(teacher.assignedClasses || []);
      assigned.add(name);
      teacher.assignedClasses = Array.from(assigned);

      saveStore(memoryStore);
      res.status(201).json({ ok: true, classRecord: created });
    }
  );

  app.post(
    '/api/teacher/students',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const usernameRaw =
        typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
      const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
      const className = typeof req.body?.className === 'string' ? req.body.className.trim() : '';
      const password =
        typeof req.body?.password === 'string' && req.body.password.length >= 6
          ? req.body.password
          : 'Bestari#2026';

      if (!/^[a-z0-9._-]{3,32}$/.test(usernameRaw)) {
        res.status(400).json({
          error:
            'ID Murid / Nama pengguna mestilah 3–32 aksara (huruf kecil, nombor, titik atau sengkang).',
        });
        return;
      }
      if (fullName.length < 2) {
        res.status(400).json({ error: 'Nama penuh murid diperlukan.' });
        return;
      }
      if (!className) {
        res.status(400).json({ error: 'Sila pilih kelas murid.' });
        return;
      }
      if (memoryStore.accounts[usernameRaw]) {
        res.status(409).json({ error: 'ID pengguna murid ini telah wujud.' });
        return;
      }

      const now = new Date().toISOString();
      const { salt, hash } = hashPassword(password);
      const existingIds = new Set(
        Object.values(memoryStore.accounts)
          .map((acc) => acc.profile?.agentId)
          .filter((id): id is string => Boolean(id))
      );
      const refNumber = generateNextReferenceNo(memoryStore.accounts);
      const newStudent: StoredAccount = {
        username: usernameRaw,
        passwordSalt: salt,
        passwordHash: hash,
        accountRole: 'student',
        role: 'Anggota Penyiasat · Sekolah Seri Bestari',
        referenceNo: refNumber,
        createdAt: now,
        profile: {
          name: fullName,
          className,
          codenameBadge: 'Helang Bestari',
          agentId: generateUniqueAgentId(existingIds),
          verifiedAt: now,
        },
      };

      memoryStore.accounts[usernameRaw] = newStudent;
      const matchedClass = Object.values(memoryStore.classes || {}).find(
        (c) => c.name === className
      );
      memoryStore.enrollments!.push({
        studentUsername: usernameRaw,
        classId: matchedClass?.id || `cls_${className.toLowerCase().replace(/\s+/g, '_')}`,
        className,
        sessionYear: matchedClass?.sessionYear || '2026/2027',
        enrolledAt: now,
      });

      const assigned = new Set(teacher.assignedClasses || []);
      assigned.add(className);
      teacher.assignedClasses = Array.from(assigned);

      getOrCreateStudentRecord(newStudent);
      saveStore(memoryStore);

      res.status(201).json({
        ok: true,
        student: buildStudentSummary(newStudent),
      });
    }
  );

  app.patch(
    '/api/teacher/students/:username/class',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const targetUsername = String(req.params.username || '').trim().toLowerCase();
      const nextClassName =
        typeof req.body?.className === 'string' ? req.body.className.trim() : '';

      const student = memoryStore.accounts[targetUsername];
      if (!student || inferAccountRole(student) !== 'student') {
        res.status(404).json({ error: 'Murid tidak ditemui.' });
        return;
      }
      if (!isTeacherAuthorisedForStudent(teacher, student)) {
        res.status(403).json({ error: 'Tiada kebenaran mengubah kelas murid ini.' });
        return;
      }
      if (nextClassName.length < 2) {
        res.status(400).json({ error: 'Nama kelas tidak sah.' });
        return;
      }

      const now = new Date().toISOString();
      if (student.profile) {
        student.profile.className = nextClassName;
      } else {
        student.profile = {
          name: student.username,
          className: nextClassName,
          codenameBadge: 'Helang Bestari',
          agentId: student.referenceNo,
          verifiedAt: now,
        };
      }

      const rec = getOrCreateStudentRecord(student);
      if (rec.gameState.profile) {
        rec.gameState.profile.className = nextClassName;
      }

      const matchedClass = Object.values(memoryStore.classes || {}).find(
        (c) => c.name === nextClassName
      );
      const enr = memoryStore.enrollments?.find(
        (e) => e.studentUsername === targetUsername
      );
      if (enr) {
        enr.className = nextClassName;
        if (matchedClass) enr.classId = matchedClass.id;
      } else {
        memoryStore.enrollments!.push({
          studentUsername: targetUsername,
          classId: matchedClass?.id || `cls_${nextClassName.toLowerCase().replace(/\s+/g, '_')}`,
          className: nextClassName,
          sessionYear: matchedClass?.sessionYear || '2026/2027',
          enrolledAt: now,
        });
      }

      const assigned = new Set(teacher.assignedClasses || []);
      assigned.add(nextClassName);
      teacher.assignedClasses = Array.from(assigned);

      saveStore(memoryStore);
      res.json({ ok: true, student: buildStudentSummary(student) });
    }
  );

  app.patch(
    '/api/teacher/settings',
    requireAuth,
    requireTeacher,
    (req: AuthedRequest, res: Response) => {
      const teacher = req.authAccount!;
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const designation =
        typeof req.body?.designation === 'string' ? req.body.designation.trim() : '';
      const hasPhotoField = typeof req.body?.photoUrl === 'string';
      const photoUrl = hasPhotoField ? req.body.photoUrl.trim() : '';

      if (hasPhotoField && photoUrl.length > 0 && !/^(https?:\/\/|\/assets\/)/i.test(photoUrl)) {
        res.status(400).json({
          error: 'URL foto profil tidak sah. Gunakan laluan /assets/... atau pautan https:// atau http://.',
        });
        return;
      }

      if (name.length >= 2) {
        if (!teacher.profile) {
          teacher.profile = {
            name,
            className: '6 Bestari',
            codenameBadge: 'Kanta Ilmu',
            agentId: 'GURU-SB-0001',
            verifiedAt: new Date().toISOString(),
          };
        } else {
          teacher.profile.name = name;
        }
      }
      if (designation && teacher.profile) {
        teacher.profile.designation = designation;
        teacher.role = `${designation} · Akademi Ejen Rahsia`;
      }
      if (hasPhotoField && teacher.profile) {
        teacher.profile.photoUrl = photoUrl;
      }

      saveStore(memoryStore);
      res.json({ ok: true, user: sanitizeUserResponse(teacher) });
    }
  );

  app.post(
    '/api/teacher/demo-data',
    requireAuth,
    requireTeacher,
    (_req: AuthedRequest, res: Response) => {
      createDemoPreviewAccounts();
      res.json({ ok: true, message: 'Data pratonton demo berjaya dimuatkan secara berasingan.' });
    }
  );

  app.delete(
    '/api/teacher/demo-data',
    requireAuth,
    requireTeacher,
    (_req: AuthedRequest, res: Response) => {
      clearDemoPreviewAccounts();
      res.json({ ok: true, message: 'Semua rekod pratonton demo telah dibersihkan.' });
    }
  );

  if (IS_PROD) {
    app.use(express.static(DIST_DIR));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(DIST_DIR, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Akademi Ejen Rahsia server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
