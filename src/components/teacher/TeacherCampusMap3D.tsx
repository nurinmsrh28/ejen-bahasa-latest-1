import React, { useMemo, useState } from 'react';
import { BookOpen, Compass, ExternalLink, Library, RotateCcw, Trees, UtensilsCrossed } from 'lucide-react';
import { LOCATIONS } from '../../game/data';
import { createInitialGameState } from '../../game/rules';
import type { GameState, LocationAggregateStats, LocationId } from '../../game/types';
import { Phase1Campus3D, type CampusCameraMode } from '../Phase1Campus3D';
import { ErrorBoundary } from '../ErrorBoundary';

interface TeacherCampusMap3DProps {
  locationAggregates: LocationAggregateStats[];
  onInspectLocationSubmissions: (locId: LocationId) => void;
}

export function TeacherCampusMap3D({
  locationAggregates,
  onInspectLocationSubmissions,
}: TeacherCampusMap3DProps) {
  const [selectedLocId, setSelectedLocId] = useState<LocationId>('kantin');
  const [cameraMode, setCameraMode] = useState<CampusCameraMode>('overview');
  const [resetSignal, setResetSignal] = useState(0);

  // Build an aggregated-only synthetic GameState (contains ZERO student PII)
  // purely to drive the 3D campus building completion markers accurately.
  const aggregateMapState: GameState = useMemo(() => {
    const base = createInitialGameState();
    for (const loc of LOCATIONS) {
      const agg = locationAggregates.find((a) => a.locationId === loc.id);
      const pct = agg?.completionPercent ?? 0;
      const clueMarkersCount =
        pct >= 100 ? 3 : pct >= 50 ? 2 : pct > 0 ? 1 : 0;
      base.investigations[loc.id] = {
        discoveredClueIds: loc.clues.slice(0, clueMarkersCount).map((c) => c.id),
        hintLevelUsed: 0,
        notes: '',
        initialProposal: '',
        completed: pct >= 100 && (agg?.totalStudents ?? 0) > 0,
      };
    }
    return base;
  }, [locationAggregates]);

  const activeAgg =
    locationAggregates.find((a) => a.locationId === selectedLocId) || locationAggregates[0];

  return (
    <section className="teacher-holo-panel rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#36D9FF]/20 pb-3">
        <div>
          <p className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
            PEMANTAUAN LOKASI BERSEPADU · TANPA PII MURID
          </p>
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#F5F0E5] mt-0.5">
            Peta Penyiasatan Sekolah 3D — Sekolah Seri Bestari
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {cameraMode === 'focus' && (
            <button
              type="button"
              onClick={() => {
                setCameraMode('overview');
                setResetSignal((s) => s + 1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#123E34] border border-[#36D9FF]/45 text-xs font-semibold text-[#F5F0E5] hover:border-[#36D9FF] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#36D9FF]" />
              <span>Pandangan Penuh</span>
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] text-[#DCE9DF]/85">
            <Compass className="w-3.5 h-3.5 text-[#D9B45B]" />
            <span>Klik bangunan untuk fokus & analisis lokasi</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* 3D Interactive Campus Canvas */}
        <div className="xl:col-span-7 rounded-xl overflow-hidden border border-[#36D9FF]/30 bg-[#07221B] h-[340px] sm:h-[380px] relative">
          <ErrorBoundary
            compact
            fallbackTitle="Peta 3D Tidak Tersedia"
            fallbackMessage="Paparan WebGL 3D tidak disokong oleh pelayar ini. Anda masih boleh memilih lokasi di panel sebelah kanan untuk menyemak tugasan murid."
          >
            <Phase1Campus3D
              state={aggregateMapState}
              activeLocationId={selectedLocId}
              cameraMode={cameraMode}
              activeClueId={null}
              resetSignal={resetSignal}
              mode="dashboard"
              onSelectLocation={(locId, enterFocus) => {
                setSelectedLocId(locId);
                if (enterFocus) setCameraMode('focus');
              }}
              onSelectClue={(locId) => {
                setSelectedLocId(locId);
                onInspectLocationSubmissions(locId);
              }}
              onReturnOverview={() => {
                setCameraMode('overview');
                setResetSignal((s) => s + 1);
              }}
            />
          </ErrorBoundary>
        </div>

        {/* Aggregated Sector Telemetry Panel */}
        <div className="xl:col-span-5 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2.5">
            {locationAggregates.map((agg) => {
              const isSelected = agg.locationId === selectedLocId;
              const Icon =
                agg.locationId === 'kantin'
                  ? UtensilsCrossed
                  : agg.locationId === 'kelas'
                    ? BookOpen
                    : agg.locationId === 'perpustakaan'
                      ? Library
                      : Trees;

              return (
                <button
                  key={agg.locationId}
                  type="button"
                  onClick={() => {
                    setSelectedLocId(agg.locationId);
                    setCameraMode('focus');
                  }}
                  className={`w-full text-left rounded-xl p-3 border transition-all ${
                    isSelected
                      ? 'bg-[#1D6652]/90 border-[#36D9FF] shadow-[0_0_16px_rgba(54,217,255,0.2)]'
                      : 'bg-[#092D27]/85 border-[#36D9FF]/20 hover:border-[#00BFA6]/55'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#36D9FF]/20 text-[#36D9FF]'
                            : 'bg-[#123E34] text-[#D9B45B]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#F5F0E5] truncate">{agg.name}</p>
                        <p className="text-[11px] text-[#DCE9DF]/70 truncate">{agg.zoneLabel}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono-tabular">
                      <p className="text-sm font-extrabold text-[#5BFFCA]">
                        {agg.completionPercent}%
                      </p>
                      <p className="text-[10px] text-[#DCE9DF]/75">
                        {agg.completedStudents}/{agg.totalStudents} selesai
                      </p>
                    </div>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00BFA6] to-[#36D9FF] transition-all duration-500"
                      style={{ width: `${agg.completionPercent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Location Detail Callout & Drill-Down */}
          {activeAgg && (
            <div className="rounded-xl bg-[#F5F0E5] text-[#26382F] border border-[#D9B45B]/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5 text-xs">
                <p className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#1D6652]">
                  STATISTIK AGREGAT · {activeAgg.shortName.toUpperCase()}
                </p>
                <p className="font-bold text-sm text-[#26382F]">{activeAgg.name}</p>
                <p className="font-mono-tabular text-[11px] text-[#4B6357]">
                  Purata Skor: <strong>{activeAgg.averageAcademicScore !== null ? `${activeAgg.averageAcademicScore}%` : 'Belum ada'}</strong> · Bukti Ditemui: <strong>{activeAgg.cluesDiscoveredTotal}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onInspectLocationSubmissions(activeAgg.locationId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#092D27] hover:bg-[#123E34] text-[#F5F0E5] text-xs font-bold transition-colors"
              >
                <span>Lihat Tugasan Lokasi</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#36D9FF]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
