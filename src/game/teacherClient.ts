import { getClientAuthToken } from './authClient';
import type {
  AuthUser,
  ClassRecord,
  GameState,
  TeacherDashboardPayload,
  TeacherFeedbackRecord,
  TeacherStudentDossier,
  TeacherStudentSummary,
} from './types';

async function apiRequest<T>(
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const token = getClientAuthToken();
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return { ok: res.ok, status: res.status, data };
}

// ============================================================================
// STUDENT PERSISTENT STATE SYNC
// ============================================================================

export async function fetchStudentState(): Promise<{
  ok: boolean;
  gameState?: GameState;
  teacherFeedback?: TeacherFeedbackRecord[];
  error?: string;
}> {
  try {
    const res = await apiRequest<{
      ok?: boolean;
      gameState?: GameState;
      teacherFeedback?: TeacherFeedbackRecord[];
    }>('/api/student/state');
    if (res.ok && res.data.gameState) {
      return {
        ok: true,
        gameState: res.data.gameState,
        teacherFeedback: res.data.teacherFeedback || [],
      };
    }
    return { ok: false, error: res.data.error || 'Gagal memuat turun rekod ejen.' };
  } catch {
    return { ok: false, error: 'Pelayan tidak dapat dicapai.' };
  }
}

export async function saveStudentState(
  gameState: GameState
): Promise<{ ok: boolean; gameState?: GameState; updatedAt?: string; error?: string }> {
  try {
    const res = await apiRequest<{
      ok?: boolean;
      gameState?: GameState;
      updatedAt?: string;
    }>('/api/student/state', {
      method: 'PUT',
      body: JSON.stringify({ gameState }),
    });
    if (res.ok && res.data.gameState) {
      return {
        ok: true,
        gameState: res.data.gameState,
        updatedAt: res.data.updatedAt,
      };
    }
    return { ok: false, error: res.data.error || 'Gagal menyimpan rekod ke pangkalan data.' };
  } catch {
    return { ok: false, error: 'Sambungan pelayan terganggu.' };
  }
}

export async function resetStudentState(): Promise<{
  ok: boolean;
  gameState?: GameState;
  error?: string;
}> {
  try {
    const res = await apiRequest<{ ok?: boolean; gameState?: GameState }>('/api/student/reset', {
      method: 'POST',
    });
    if (res.ok && res.data.gameState) {
      return { ok: true, gameState: res.data.gameState };
    }
    return { ok: false, error: res.data.error || 'Gagal menetapkan semula rekod pelayan.' };
  } catch {
    return { ok: false, error: 'Sambungan pelayan terganggu.' };
  }
}

// ============================================================================
// TEACHER COMMAND CENTER API CLIENT
// ============================================================================

export interface TeacherDashboardFilters {
  session?: string;
  year?: string;
  className?: string;
  student?: string;
  dateFrom?: string;
  dateTo?: string;
  includeDemo?: boolean;
}

export async function fetchTeacherDashboard(
  filters: TeacherDashboardFilters = {}
): Promise<{ ok: boolean; status: number; payload?: TeacherDashboardPayload; error?: string }> {
  const params = new URLSearchParams();
  if (filters.session && filters.session !== 'semua') params.set('session', filters.session);
  if (filters.year && filters.year !== 'semua') params.set('year', filters.year);
  if (filters.className && filters.className !== 'semua') params.set('className', filters.className);
  if (filters.student && filters.student !== 'semua') params.set('student', filters.student);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.includeDemo) params.set('includeDemo', '1');

  const query = params.toString();
  const url = `/api/teacher/dashboard${query ? `?${query}` : ''}`;

  try {
    const res = await apiRequest<TeacherDashboardPayload>(url);
    if (res.ok) {
      return { ok: true, status: res.status, payload: res.data };
    }
    return {
      ok: false,
      status: res.status,
      error: res.data.error || 'Gagal memuatkan data analitik guru.',
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'Gagal menghubungi pelayan analitik guru.',
    };
  }
}

export async function fetchTeacherStudentDossier(
  username: string
): Promise<{ ok: boolean; status: number; dossier?: TeacherStudentDossier; error?: string }> {
  try {
    const res = await apiRequest<TeacherStudentDossier>(
      `/api/teacher/students/${encodeURIComponent(username)}`
    );
    if (res.ok) {
      return { ok: true, status: res.status, dossier: res.data };
    }
    return {
      ok: false,
      status: res.status,
      error: res.data.error || 'Gagal memuatkan fail akademik murid.',
    };
  } catch {
    return {
      ok: false,
      status: 0,
      error: 'Ralat rangkaian semasa memuatkan fail akademik murid.',
    };
  }
}

export async function saveTeacherFeedback(payload: {
  studentUsername: string;
  phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5';
  itemKey: string;
  comment: string;
  assessmentDecision?: 'cemerlang' | 'memuaskan' | 'perlu_bimbingan' | '';
}): Promise<{ ok: boolean; feedback?: TeacherFeedbackRecord; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; feedback?: TeacherFeedbackRecord }>(
      '/api/teacher/feedback',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (res.ok && res.data.feedback) {
      return { ok: true, feedback: res.data.feedback };
    }
    return { ok: false, error: res.data.error || 'Gagal menyimpan ulasan guru.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan untuk menyimpan ulasan.' };
  }
}

export async function createTeacherClass(payload: {
  name: string;
  yearLevel: string;
  sessionYear: string;
}): Promise<{ ok: boolean; classRecord?: ClassRecord; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; classRecord?: ClassRecord }>(
      '/api/teacher/classes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (res.ok && res.data.classRecord) {
      return { ok: true, classRecord: res.data.classRecord };
    }
    return { ok: false, error: res.data.error || 'Gagal mencipta kelas baharu.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan.' };
  }
}

export async function createStudentByTeacher(payload: {
  username: string;
  fullName: string;
  className: string;
  password?: string;
}): Promise<{ ok: boolean; student?: TeacherStudentSummary; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; student?: TeacherStudentSummary }>(
      '/api/teacher/students',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    if (res.ok && res.data.student) {
      return { ok: true, student: res.data.student };
    }
    return { ok: false, error: res.data.error || 'Gagal mendaftar murid baharu.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan.' };
  }
}

export async function assignStudentClass(
  username: string,
  className: string
): Promise<{ ok: boolean; student?: TeacherStudentSummary; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; student?: TeacherStudentSummary }>(
      `/api/teacher/students/${encodeURIComponent(username)}/class`,
      {
        method: 'PATCH',
        body: JSON.stringify({ className }),
      }
    );
    if (res.ok && res.data.student) {
      return { ok: true, student: res.data.student };
    }
    return { ok: false, error: res.data.error || 'Gagal mengemas kini kelas murid.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan.' };
  }
}

export async function updateTeacherSettings(payload: {
  name?: string;
  designation?: string;
  photoUrl?: string;
}): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; user?: AuthUser }>('/api/teacher/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    if (res.ok && res.data.user) {
      return { ok: true, user: res.data.user };
    }
    return { ok: false, error: res.data.error || 'Gagal mengemas kini profil guru.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan.' };
  }
}

export async function toggleDemoPreviewData(
  enable: boolean
): Promise<{ ok: boolean; message?: string; error?: string }> {
  try {
    const res = await apiRequest<{ ok?: boolean; message?: string }>('/api/teacher/demo-data', {
      method: enable ? 'POST' : 'DELETE',
    });
    if (res.ok) {
      return { ok: true, message: res.data.message };
    }
    return { ok: false, error: res.data.error || 'Operasi data pratonton gagal.' };
  } catch {
    return { ok: false, error: 'Gagal menghubungi pelayan.' };
  }
}
