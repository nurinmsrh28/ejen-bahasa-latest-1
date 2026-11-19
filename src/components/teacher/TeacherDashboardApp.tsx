import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  fetchTeacherDashboard,
  fetchTeacherStudentDossier,
  type TeacherDashboardFilters,
} from '../../game/teacherClient';
import type {
  AuthUser,
  LocationId,
  TeacherDashboardPayload,
  TeacherFeedbackRecord,
  TeacherStudentDossier,
} from '../../game/types';
import { TeacherAchievementsView } from './TeacherAchievementsView';
import { TeacherAnalyticsView } from './TeacherAnalyticsView';
import { TeacherClassManagementView } from './TeacherClassManagementView';
import { TeacherExportView } from './TeacherExportView';
import { TeacherOverviewView } from './TeacherOverviewView';
import { TeacherResponseModal } from './TeacherResponseModal';
import { TeacherSettingsView } from './TeacherSettingsView';
import { TeacherSidebar } from './TeacherSidebar';
import { TeacherStudentDirectoryView } from './TeacherStudentDirectoryView';
import { TeacherStudentFileView } from './TeacherStudentFileView';
import { TeacherSubmissionsView } from './TeacherSubmissionsView';
import { TeacherTopBar } from './TeacherTopBar';
import type { InspectableSubmissionItem, TeacherNavSection } from './teacherUtils';

interface TeacherDashboardAppProps {
  teacher: AuthUser;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onTeacherUpdated: (user: AuthUser) => void;
  onLogout: () => void;
  onShowToast: (msg: string) => void;
}

export function TeacherDashboardApp({
  teacher,
  soundEnabled,
  onToggleSound,
  onTeacherUpdated,
  onLogout,
  onShowToast,
}: TeacherDashboardAppProps) {
  const [activeSection, setActiveSection] = useState<TeacherNavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [filters, setFilters] = useState<TeacherDashboardFilters>({
    session: 'semua',
    year: 'semua',
    className: 'semua',
    student: 'semua',
    dateFrom: '',
    dateTo: '',
    includeDemo: false,
  });

  const [payload, setPayload] = useState<TeacherDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string>('');
  const [dossiersByUsername, setDossiersByUsername] = useState<
    Record<string, TeacherStudentDossier>
  >({});
  const dossiersRef = useRef(dossiersByUsername);
  dossiersRef.current = dossiersByUsername;
  const inFlightDossiersRef = useRef<Set<string>>(new Set());
  const [loadingSelectedDossier, setLoadingSelectedDossier] = useState(false);
  const [dossierError, setDossierError] = useState<string | null>(null);
  const [loadingBulkDossiers, setLoadingBulkDossiers] = useState(false);

  const [submissionPhaseInit, setSubmissionPhaseInit] = useState<string>('semua');
  const [submissionLocInit, setSubmissionLocInit] = useState<string>('semua');
  const [inspectItem, setInspectItem] = useState<InspectableSubmissionItem | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const res = await fetchTeacherDashboard(filters);
    setLoading(false);
    if (!res.ok || !res.payload) {
      setErrorMsg(res.error || 'Gagal memuatkan data papan pemuka guru.');
      return;
    }
    setPayload(res.payload);
    setSelectedStudentUsername((prev) => {
      if (prev && res.payload!.students.some((s) => s.username === prev)) return prev;
      return res.payload!.students[0]?.username || '';
    });
  }, [filters]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const loadSingleDossier = useCallback(async (username: string, force = false) => {
    if (!username) return;
    if (!force && (dossiersRef.current[username] || inFlightDossiersRef.current.has(username))) {
      setDossierError(null);
      return;
    }
    inFlightDossiersRef.current.add(username);
    setLoadingSelectedDossier(true);
    setDossierError(null);
    const res = await fetchTeacherStudentDossier(username);
    inFlightDossiersRef.current.delete(username);
    setLoadingSelectedDossier(false);
    if (res.ok && res.dossier) {
      setDossiersByUsername((prev) => ({ ...prev, [username]: res.dossier! }));
    } else {
      setDossierError(res.error || 'Gagal memuatkan fail akademik murid.');
    }
  }, []);

  const refreshAllDashboard = useCallback(async () => {
    setDossiersByUsername({});
    dossiersRef.current = {};
    setDossierError(null);
    await loadDashboard();
  }, [loadDashboard]);

  // Load selected student dossier when on Tab 05 or when inspecting a response
  useEffect(() => {
    if (activeSection === 'dossier' && selectedStudentUsername) {
      void loadSingleDossier(selectedStudentUsername);
    }
  }, [activeSection, selectedStudentUsername, loadSingleDossier]);

  // Preload dossiers for visible students when visiting Analytics (03) or Submissions (04)
  useEffect(() => {
    if (!payload) return;
    if (activeSection !== 'analytics' && activeSection !== 'submissions') return;
    const missing = payload.students
      .map((s) => s.username)
      .filter((u) => !dossiersRef.current[u]);
    if (missing.length === 0) return;

    let active = true;
    setLoadingBulkDossiers(true);
    Promise.all(missing.map((u) => fetchTeacherStudentDossier(u))).then((results) => {
      if (!active) return;
      const nextMap: Record<string, TeacherStudentDossier> = {};
      results.forEach((r) => {
        if (r.ok && r.dossier) {
          nextMap[r.dossier.summary.username] = r.dossier;
        }
      });
      setDossiersByUsername((prev) => ({ ...prev, ...nextMap }));
      setLoadingBulkDossiers(false);
    });
    return () => {
      active = false;
    };
  }, [activeSection, payload]);

  const handleOpenStudentDossier = (username: string) => {
    setSelectedStudentUsername(username);
    setActiveSection('dossier');
    void loadSingleDossier(username, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSubmissionsForPhase = (
    phaseId: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'phase5'
  ) => {
    setSubmissionPhaseInit(phaseId);
    setSubmissionLocInit('semua');
    setActiveSection('submissions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSubmissionsForLocation = (locId: LocationId) => {
    setSubmissionPhaseInit('semua');
    setSubmissionLocInit(locId);
    setActiveSection('submissions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeedbackSaved = (saved: TeacherFeedbackRecord) => {
    onShowToast('Ulasan guru disimpan ke pangkalan data.');
    // Update cached dossier & refresh summary metrics
    setDossiersByUsername((prev) => {
      const existing = prev[saved.studentUsername];
      if (!existing) return prev;
      const others = existing.teacherFeedback.filter((f) => f.id !== saved.id);
      return {
        ...prev,
        [saved.studentUsername]: {
          ...existing,
          teacherFeedback: [saved, ...others],
        },
      };
    });
    void loadDashboard();
  };

  if (teacher.accountRole !== 'teacher') {
    return (
      <div className="min-h-screen teacher-command-bg text-[#F5F0E5] flex items-center justify-center p-6">
        <div className="teacher-holo-panel rounded-2xl max-w-md w-full p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#F29C85] mx-auto" />
          <h1 className="font-display text-xl font-bold">Akses Ditolak (403)</h1>
          <p className="text-xs text-[#DCE9DF]/85">
            Papan pemuka ini dikhaskan untuk akaun Guru Pembimbing sahaja.
          </p>
        </div>
      </div>
    );
  }

  const pendingReviewCount = payload
    ? payload.students.filter((s) => s.needsReview).length
    : 0;

  const activeDossier = selectedStudentUsername
    ? dossiersByUsername[selectedStudentUsername] || null
    : null;

  const inspectExistingFeedback = inspectItem
    ? dossiersByUsername[inspectItem.studentUsername]?.teacherFeedback || []
    : [];

  return (
    <div className="min-h-screen teacher-command-bg text-[#F5F0E5] flex flex-col">
      <TeacherTopBar
        teacher={payload?.teacher || teacher}
        activeSection={activeSection}
        soundEnabled={soundEnabled}
        onSelectSection={(sec) => {
          if (sec === 'submissions') {
            setSubmissionPhaseInit('semua');
            setSubmissionLocInit('semua');
          }
          setActiveSection(sec);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onToggleSound={onToggleSound}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        onLogout={onLogout}
      />

      <div className="flex-1 flex">
        <TeacherSidebar
          activeSection={activeSection}
          mobileOpen={mobileMenuOpen}
          pendingReviewCount={pendingReviewCount}
          onSelectSection={(sec) => {
            if (sec === 'submissions') {
              setSubmissionPhaseInit('semua');
              setSubmissionLocInit('semua');
            }
            setActiveSection(sec);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-7 max-w-[1480px] mx-auto w-full">
          {loading && !payload && (
            <div className="teacher-holo-panel rounded-2xl p-10 text-center space-y-3">
              <RefreshCw className="w-7 h-7 text-[#36D9FF] animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#F5F0E5]">
                Menyegerakkan Pusat Kawalan Analitik Guru...
              </p>
            </div>
          )}

          {errorMsg && !loading && (
            <div className="teacher-holo-panel rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 border-[#E57B63]/50">
              <div className="flex items-center gap-3 text-sm text-[#FDEAE6]">
                <AlertCircle className="w-5 h-5 text-[#F29C85] shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="px-4 py-2 rounded-lg bg-[#D9B45B] text-[#092D27] text-xs font-extrabold"
              >
                Cuba Semula
              </button>
            </div>
          )}

          {payload && (
            <>
              {activeSection === 'overview' && (
                <TeacherOverviewView
                  payload={payload}
                  filters={filters}
                  onChangeFilters={setFilters}
                  onOpenExportModalOrTab={() => setActiveSection('export')}
                  onOpenStudentDossier={handleOpenStudentDossier}
                  onNavigateSubmissionsForPhase={handleNavigateSubmissionsForPhase}
                  onNavigateSubmissionsForLocation={handleNavigateSubmissionsForLocation}
                  onSelectSection={setActiveSection}
                />
              )}

              {activeSection === 'students' && (
                <TeacherStudentDirectoryView
                  students={payload.students}
                  classes={payload.classes.map((c) => c.name)}
                  onOpenStudentDossier={handleOpenStudentDossier}
                />
              )}

              {activeSection === 'analytics' && (
                <TeacherAnalyticsView
                  payload={payload}
                  dossiersByUsername={dossiersByUsername}
                  loadingDossiers={loadingBulkDossiers}
                  onOpenStudentDossier={handleOpenStudentDossier}
                />
              )}

              {activeSection === 'submissions' && (
                <TeacherSubmissionsView
                  payload={payload}
                  dossiersByUsername={dossiersByUsername}
                  loadingDossiers={loadingBulkDossiers}
                  initialPhaseFilter={submissionPhaseInit}
                  initialLocationFilter={submissionLocInit}
                  onInspectResponse={(item) => {
                    void loadSingleDossier(item.studentUsername);
                    setInspectItem(item);
                  }}
                  onOpenStudentDossier={handleOpenStudentDossier}
                />
              )}

              {activeSection === 'dossier' && (
                <TeacherStudentFileView
                  students={payload.students}
                  selectedUsername={selectedStudentUsername}
                  dossier={activeDossier}
                  loading={loadingSelectedDossier && !activeDossier}
                  error={dossierError}
                  onRetry={() => void loadSingleDossier(selectedStudentUsername, true)}
                  onSelectStudent={(uname) => {
                    setDossierError(null);
                    setSelectedStudentUsername(uname);
                  }}
                  onInspectResponse={(item) => setInspectItem(item)}
                />
              )}

              {activeSection === 'achievements' && (
                <TeacherAchievementsView
                  payload={payload}
                  onOpenStudentDossier={handleOpenStudentDossier}
                />
              )}

              {activeSection === 'classes' && (
                <TeacherClassManagementView
                  payload={payload}
                  onRefreshDashboard={refreshAllDashboard}
                  onOpenStudentDossier={handleOpenStudentDossier}
                />
              )}

              {activeSection === 'export' && <TeacherExportView payload={payload} />}

              {activeSection === 'settings' && (
                <TeacherSettingsView
                  teacher={payload.teacher || teacher}
                  hasDemoStudents={payload.hasDemoStudents}
                  includeDemo={Boolean(filters.includeDemo)}
                  soundEnabled={soundEnabled}
                  onToggleSound={onToggleSound}
                  onToggleIncludeDemo={(next) => {
                    setDossiersByUsername({});
                    dossiersRef.current = {};
                    setFilters((prev) => ({ ...prev, includeDemo: next }));
                  }}
                  onTeacherUpdated={onTeacherUpdated}
                  onRefreshDashboard={refreshAllDashboard}
                />
              )}
            </>
          )}
        </main>
      </div>

      {inspectItem && (
        <TeacherResponseModal
          item={inspectItem}
          existingFeedback={inspectExistingFeedback}
          onClose={() => setInspectItem(null)}
          onFeedbackSaved={handleFeedbackSaved}
        />
      )}
    </div>
  );
}
