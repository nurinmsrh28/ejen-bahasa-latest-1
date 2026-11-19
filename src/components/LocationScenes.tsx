import React from 'react';
import { Check, Search } from 'lucide-react';
import type { LocationId } from '../game/types';
import { LOCATION_MAP } from '../game/data';
import kantinPhotoUrl from '../assets/images/kantin_ceria_realistik_1794831646132.jpg';
import kelasPhotoUrl from '../assets/images/kelas_harmoni_realistik_1794831926269.jpg';
import perpustakaanPhotoUrl from '../assets/images/perpustakaan_ilmu_realistik_1794832156528.jpg';
import tamanPhotoUrl from '../assets/images/taman_rekreasi_realistik_1794832375203.jpg';

export interface HotspotCoord {
  clueId: string;
  xPercent: number;
  yPercent: number;
  zoneWidthPercent?: number;
  zoneHeightPercent?: number;
}

export const LOCATION_PHOTO_URLS: Record<LocationId, string> = {
  kantin: kantinPhotoUrl,
  kelas: kelasPhotoUrl,
  perpustakaan: perpustakaanPhotoUrl,
  taman: tamanPhotoUrl,
};

export const LOCATION_HOTSPOTS: Record<LocationId, HotspotCoord[]> = {
  kantin: [
    {
      clueId: 'kantin_sampah',
      xPercent: 22,
      yPercent: 80,
      zoneWidthPercent: 22,
      zoneHeightPercent: 22,
    },
    {
      clueId: 'kantin_meja',
      xPercent: 46,
      yPercent: 53,
      zoneWidthPercent: 22,
      zoneHeightPercent: 18,
    },
    {
      clueId: 'kantin_tong',
      xPercent: 86,
      yPercent: 58,
      zoneWidthPercent: 20,
      zoneHeightPercent: 34,
    },
  ],
  kelas: [
    {
      clueId: 'kelas_meja',
      xPercent: 21,
      yPercent: 66,
      zoneWidthPercent: 28,
      zoneHeightPercent: 30,
    },
    {
      clueId: 'kelas_sudut',
      xPercent: 83,
      yPercent: 35,
      zoneWidthPercent: 20,
      zoneHeightPercent: 38,
    },
    {
      clueId: 'kelas_bahan',
      xPercent: 67,
      yPercent: 80,
      zoneWidthPercent: 36,
      zoneHeightPercent: 26,
    },
  ],
  perpustakaan: [
    {
      clueId: 'perpus_buku',
      xPercent: 20,
      yPercent: 60,
      zoneWidthPercent: 30,
      zoneHeightPercent: 56,
    },
    {
      clueId: 'perpus_selesa',
      xPercent: 51,
      yPercent: 64,
      zoneWidthPercent: 22,
      zoneHeightPercent: 34,
    },
    {
      clueId: 'perpus_sudut',
      xPercent: 81,
      yPercent: 75,
      zoneWidthPercent: 30,
      zoneHeightPercent: 38,
    },
  ],
  taman: [
    {
      clueId: 'taman_tumbuhan',
      xPercent: 24,
      yPercent: 60,
      zoneWidthPercent: 32,
      zoneHeightPercent: 52,
    },
    {
      clueId: 'taman_kawasan',
      xPercent: 52,
      yPercent: 45,
      zoneWidthPercent: 22,
      zoneHeightPercent: 38,
    },
    {
      clueId: 'taman_duduk',
      xPercent: 83,
      yPercent: 67,
      zoneWidthPercent: 28,
      zoneHeightPercent: 36,
    },
  ],
};

function KantinRealisticPhoto() {
  return (
    <img
      src={kantinPhotoUrl}
      alt="Gambar sebenar Kantin Ceria sekolah rendah di Malaysia selepas waktu rehat yang menunjukkan sampah bertaburan di lantai, sisa makanan di atas meja dan tong sampah penuh melimpah"
      referrerPolicy="no-referrer"
      draggable={false}
      className="w-full h-full object-cover object-center block"
    />
  );
}

function KelasRealisticPhoto() {
  return (
    <img
      src={kelasPhotoUrl}
      alt="Gambar sebenar bilik darjah Kelas Harmoni sekolah rendah di Malaysia yang menunjukkan meja dan kerusi tidak tersusun, sudut pembelajaran kurang menarik dan bahan pembelajaran bersepah"
      referrerPolicy="no-referrer"
      draggable={false}
      className="w-full h-full object-cover object-center block"
    />
  );
}

function PerpustakaanRealisticPhoto() {
  return (
    <img
      src={perpustakaanPhotoUrl}
      alt="Gambar sebenar Perpustakaan Ilmu sekolah rendah di Malaysia yang menunjukkan buku bersepah tidak mengikut kategori, ruang membaca kurang selesa dan sudut bacaan terbiar tidak dimanfaatkan"
      referrerPolicy="no-referrer"
      draggable={false}
      className="w-full h-full object-cover object-center block"
    />
  );
}

function TamanRealisticPhoto() {
  return (
    <img
      src={tamanPhotoUrl}
      alt="Gambar sebenar Taman Rekreasi sekolah rendah di Malaysia pada waktu siang yang menunjukkan tumbuhan layu kurang dijaga, kawasan rekreasi kurang menarik dan kekurangan tempat duduk"
      referrerPolicy="no-referrer"
      draggable={false}
      className="w-full h-full object-cover object-center block"
    />
  );
}

export function InteractiveLocationScene({
  locationId,
  discoveredClueIds,
  hintLevelUsed,
  activeClueId,
  onSelectClue,
}: {
  locationId: LocationId;
  discoveredClueIds: string[];
  hintLevelUsed: number;
  activeClueId: string | null;
  onSelectClue: (clueId: string) => void;
}) {
  const loc = LOCATION_MAP[locationId];
  const coords = LOCATION_HOTSPOTS[locationId];

  return (
    <div className="relative w-full aspect-[5/3] rounded-xl overflow-hidden border-2 border-[#A8C5A0] bg-[#F5F0E5] shadow-sm select-none">
      {locationId === 'kantin' && <KantinRealisticPhoto />}
      {locationId === 'kelas' && <KelasRealisticPhoto />}
      {locationId === 'perpustakaan' && <PerpustakaanRealisticPhoto />}
      {locationId === 'taman' && <TamanRealisticPhoto />}

      {coords.map((coord, idx) => {
        const clue = loc.clues.find((c) => c.id === coord.clueId);
        if (!clue) return null;
        const discovered = discoveredClueIds.includes(clue.id);
        const isSelected = activeClueId === clue.id;
        const showSpotlight = hintLevelUsed >= 3 && !discovered;
        const hasZoneBox =
          typeof coord.zoneWidthPercent === 'number' &&
          typeof coord.zoneHeightPercent === 'number';

        const badgeClasses = discovered
          ? isSelected
            ? 'bg-[#315C48] text-[#FFFFFF] border-2 border-[#E7C878] scale-105 shadow-[0_0_18px_rgba(231,200,120,0.45)]'
            : 'bg-[#315C48] text-[#FFFFFF] border-2 border-[#A8C5A0] group-hover:scale-105 shadow-lg'
          : showSpotlight
          ? 'bg-[#A63A24] text-[#FFFFFF] border-2 border-[#E7C878] shadow-[0_0_20px_rgba(231,200,120,0.55)]'
          : 'bg-[#FFFFFF] text-[#315C48] border-2 border-[#E7C878] group-hover:bg-[#E7C878] group-hover:text-[#26382F] group-hover:scale-110 shadow-[0_8px_20px_rgba(38,56,47,0.28)]';

        if (hasZoneBox) {
          return (
            <button
              key={clue.id}
              type="button"
              onClick={() => onSelectClue(clue.id)}
              aria-label={`Periksa petunjuk ${idx + 1}: ${clue.label}`}
              style={{
                left: `${coord.xPercent}%`,
                top: `${coord.yPercent}%`,
                width: `${coord.zoneWidthPercent}%`,
                height: `${coord.zoneHeightPercent}%`,
              }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-2xl flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7C878] ${
                discovered
                  ? isSelected
                    ? 'border-2 border-[#E7C878] bg-[#315C48]/15'
                    : 'border border-dashed border-[#A8C5A0] hover:bg-[#315C48]/10'
                  : showSpotlight
                  ? 'border-2 border-dashed border-[#E7C878] bg-[#C2593F]/20'
                  : 'border border-transparent hover:border-2 hover:border-dashed hover:border-[#E7C878] hover:bg-[#E7C878]/15'
              }`}
            >
              <span
                className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-150 ${badgeClasses}`}
              >
                {!discovered && (
                  <span
                    aria-hidden="true"
                    className={`clue-beacon-ring absolute inset-[-7px] rounded-full ${
                      showSpotlight ? 'border-3 border-[#E7C878]' : 'border border-[#E7C878]/75'
                    }`}
                  />
                )}
                {discovered ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </span>
            </button>
          );
        }

        return (
          <button
            key={clue.id}
            type="button"
            onClick={() => onSelectClue(clue.id)}
            aria-label={`Periksa petunjuk ${idx + 1}: ${clue.label}`}
            style={{
              left: `${coord.xPercent}%`,
              top: `${coord.yPercent}%`,
            }}
            className={`group absolute -translate-x-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-transform duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E7B94F] ${badgeClasses}`}
          >
            {showSpotlight && (
              <span
                aria-hidden="true"
                className="clue-beacon-ring absolute inset-[-8px] rounded-full border-3 border-[#C2593F]"
              />
            )}
            {discovered ? (
              <Check className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        );
      })}
    </div>
  );
}
