import React, { useEffect, useState } from 'react';
import { BookOpen, Compass, FileText, FolderOpen, Play, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { PROFESOR_CITRA_WELCOME } from '../game/data';
import secretAcademySchoolUrl from '../assets/images/secret_academy_school_1794825908324.jpg';
import { AcademyEmblem, ProfesorCitraPortrait, SchoolBackdropArt } from './DetectiveArt';

interface LandingScreenProps {
  hasSavedProfile: boolean;
  savedAgentName?: string;
  soundEnabled: boolean;
  musicPlaying: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onStartNewOrContinue: () => void;
  onResumeExisting: () => void;
}

const AMBIENT_MOTES = [
  { left: '14%', top: '26%', size: 4, dur: '6.5s', delay: '0s' },
  { left: '28%', top: '72%', size: 3, dur: '8.2s', delay: '1.1s' },
  { left: '42%', top: '18%', size: 5, dur: '7.4s', delay: '0.6s' },
  { left: '54%', top: '58%', size: 3, dur: '9.1s', delay: '2.2s' },
  { left: '68%', top: '32%', size: 4, dur: '6.8s', delay: '1.5s' },
  { left: '79%', top: '64%', size: 5, dur: '8.5s', delay: '0.3s' },
  { left: '88%', top: '24%', size: 3, dur: '7.8s', delay: '2.8s' },
  { left: '61%', top: '82%', size: 4, dur: '7.0s', delay: '1.9s' },
];

export function LandingScreen({
  hasSavedProfile,
  savedAgentName,
  soundEnabled,
  musicPlaying,
  onToggleSound,
  onToggleMusic,
  onStartNewOrContinue,
  onResumeExisting,
}: LandingScreenProps) {
  const [dossierOpen, setDossierOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [keyArtFailed, setKeyArtFailed] = useState(false);

  const handlePrimaryStart = () => {
    if (hasSavedProfile) {
      onResumeExisting();
    } else {
      onStartNewOrContinue();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (guideOpen && e.key === 'Escape') {
        setGuideOpen(false);
        return;
      }
      if (guideOpen || dossierOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const active = document.activeElement;
        if (active && active.tagName === 'BUTTON') return;
        e.preventDefault();
        handlePrimaryStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [guideOpen, dossierOpen, hasSavedProfile]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#315C4C] text-[#F8F5EC] flex flex-col justify-between">
      {/* Layer 1: Illustrated Cinematic School Key-Art Backdrop + SVG Fallback */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          <SchoolBackdropArt />
        </div>
        {!keyArtFailed && (
          <img
            src={secretAcademySchoolUrl}
            alt="Pemandangan Akademi Sekolah Seri Bestari pada waktu senja"
            referrerPolicy="no-referrer"
            onError={() => setKeyArtFailed(true)}
            className="ken-burns-slow relative z-10 w-full h-full object-cover object-right opacity-95"
          />
        )}

        {/* Layer 2: Classic Detective Academy Forest Scrim */}
        <div
          className="absolute inset-0 z-20"
          style={{
            background:
              'linear-gradient(96deg, rgba(49, 92, 76, 0.92) 0%, rgba(49, 92, 76, 0.78) 42%, rgba(49, 92, 76, 0.42) 72%, rgba(49, 92, 76, 0.5) 100%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-44 z-20"
          style={{
            background: 'linear-gradient(to top, rgba(36, 70, 57, 0.88), transparent)',
          }}
        />

        {/* Layer 3: Subtle Drifting Mist */}
        <div
          className="mist-drift absolute inset-x-[-10%] bottom-12 h-48 z-20 opacity-25"
          style={{
            background:
              'radial-gradient(ellipse at 65% 60%, rgba(232, 223, 201, 0.32) 0%, rgba(169, 197, 173, 0.16) 45%, transparent 72%)',
          }}
        />

        {/* Layer 4: Ambient Mustard Light Motes */}
        <div className="absolute inset-0 z-20" aria-hidden="true">
          {AMBIENT_MOTES.map((mote, i) => (
            <span
              key={i}
              className="float-mote absolute rounded-full bg-[#E7B94F]"
              style={
                {
                  left: mote.left,
                  top: mote.top,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  boxShadow: '0 0 10px rgba(231, 185, 79, 0.7)',
                  '--mote-dur': mote.dur,
                  '--mote-delay': mote.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      </div>

      {/* Minimalist Exclusive Academy Header */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 pt-5 pb-2 flex items-center justify-between gap-4 border-b border-[#E7B94F]/30">
        <div className="flex items-center gap-3.5 min-w-0">
          <AcademyEmblem className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]" />
          <div className="min-w-0">
            <p className="font-display text-sm sm:text-base font-bold tracking-[0.16em] uppercase text-[#F8F5EC] truncate">
              Akademi Ejen Bahasa
            </p>
            <p className="text-[11px] sm:text-xs tracking-wider text-[#E7B94F] truncate">
              Akademi Bahasa Rahsia · Projek Penyiasatan Sekolah
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMusic}
            aria-label={musicPlaying ? 'Hentikan muzik latar' : 'Mainkan muzik latar'}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B94F] ${
              musicPlaying
                ? 'bg-[#E7B94F] text-[#1F362D] border-[#F8F5EC] shadow-[0_0_16px_rgba(231,185,79,0.4)]'
                : 'bg-[#244639]/85 text-[#F8F5EC] border-[#E7B94F]/45 hover:border-[#E7B94F] hover:bg-[#315C4C]'
            }`}
          >
            {musicPlaying ? 'Muzik: Aktif' : 'Muzik: Senyap'}
          </button>
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Bisukan kesan bunyi' : 'Aktifkan kesan bunyi'}
            className="p-2.5 rounded-xl bg-[#244639]/85 border border-[#E7B94F]/45 text-[#F8F5EC] hover:border-[#E7B94F] hover:bg-[#315C4C] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B94F]"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Hero Composition */}
      <section className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left Zone: Poster Typography + Profesor Nurin Briefing + Primary CTAs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Staggered Display Title Lockup */}
          <div className="space-y-2.5">
            <p className="intro-stage-1 text-xs sm:text-sm font-semibold tracking-[0.24em] uppercase text-[#E7B94F]">
              Misi Penyiasatan Khas · Sekolah Seri Bestari
            </p>
            <h1
              className="intro-stage-1 font-display text-5xl sm:text-6xl lg:text-[4.5rem] font-bold tracking-tight text-[#F8F5EC] leading-[1.01]"
              style={{ textShadow: '0 6px 24px rgba(20, 42, 33, 0.45), 0 0 32px rgba(231, 185, 79, 0.16)' }}
            >
              EJEN BAHASA
            </h1>
            <p className="intro-stage-2 font-display text-2xl sm:text-3xl text-[#E7B94F] italic font-semibold tracking-wide">
              Operasi Sekolah Impian
            </p>
            <div className="intro-stage-2 flex items-center gap-3 pt-1">
              <span className="h-[1px] w-10 bg-[#E7B94F]/75" aria-hidden="true" />
              <p className="font-mono-tabular text-xs sm:text-sm tracking-[0.28em] uppercase text-[#A9C5AD]">
                Siasat • Fikir • Cipta
              </p>
              <span className="h-[1px] flex-1 max-w-[120px] bg-[#E7B94F]/40" aria-hidden="true" />
            </div>
          </div>

          {/* Profesor Nurin — Tactical Mission Briefing Panel */}
          <div className="intro-stage-3 relative w-full rounded-2xl bg-[#244639]/90 border-2 border-[#E7B94F]/60 p-5 sm:p-6 shadow-[0_18px_40px_rgba(20,42,33,0.38)]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative shrink-0">
                <ProfesorCitraPortrait
                  realistic
                  className="w-24 h-24 sm:w-28 sm:h-28 drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]"
                />
                <span className="block text-center font-mono-tabular text-[11px] tracking-widest uppercase text-[#E7B94F] mt-2">
                  Taklimat Misi
                </span>
              </div>

              {/* Parchment Speech Bubble (#F8F5EC) */}
              <div className="relative flex-1 bg-[#F8F5EC] text-[#1F362D] rounded-xl p-4 sm:p-6 border border-[#E7B94F]/80 shadow-inner">
                <div
                  aria-hidden="true"
                  className="hidden sm:block absolute -left-2 top-8 w-4 h-4 bg-[#F8F5EC] border-l border-b border-[#E7B94F]/80 rotate-45"
                />
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#795A40]">
                    Profesor Nurin · Pembimbing Operasi
                  </p>
                  <span className="font-mono-tabular text-[11px] text-[#315C4C] font-semibold">
                    Saluran Sulit
                  </span>
                </div>
                <p className="text-[15px] sm:text-base leading-relaxed text-[#1F362D]">
                  “{PROFESOR_CITRA_WELCOME}”
                </p>
              </div>
            </div>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="intro-stage-4 flex flex-wrap items-center gap-3.5 pt-1">
            <button
              type="button"
              data-start="true"
              onClick={handlePrimaryStart}
              className="group relative inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-[#E7B94F] hover:bg-[#F2CE74] text-[#1F362D] font-bold text-sm sm:text-base tracking-wide uppercase border-2 border-[#F8F5EC]/75 shadow-[0_12px_28px_rgba(231,185,79,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.985] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F8F5EC]"
            >
              <Play className="w-5 h-5 fill-current transition-transform duration-200 group-hover:translate-x-0.5" />
              <span>Sambung Pengembaraan</span>
            </button>

            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="inline-flex items-center gap-2.5 px-5 py-4 rounded-xl bg-[#244639]/90 hover:bg-[#315C4C] text-[#F8F5EC] border border-[#E7B94F]/65 hover:border-[#E7B94F] font-semibold text-sm tracking-wide uppercase hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-200 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B94F]"
            >
              <BookOpen className="w-4 h-4 text-[#E7B94F]" />
              <span>Panduan Permainan</span>
            </button>

            {hasSavedProfile && (
              <button
                type="button"
                onClick={onStartNewOrContinue}
                className="text-xs font-medium text-[#A9C5AD] hover:text-[#E7B94F] underline underline-offset-4 px-2 py-2 transition-colors whitespace-nowrap"
              >
                Tukar / Daftar Ejen Baharu ({savedAgentName})
              </button>
            )}
          </div>
        </div>

        {/* Right Zone: Fail Sulit — Realistic Layered Mission Dossier (#E8DFC9 / #F8F5EC) */}
        <div className="lg:col-span-5 intro-stage-4">
          <div className="relative mx-auto max-w-md lg:max-w-none pt-3 pb-2">
            {/* Stacked Overlapping Paper Sheets Underneath */}
            <div
              aria-hidden="true"
              className="absolute inset-x-3 top-1 bottom-0 rounded-2xl bg-[#D8CCA9] border border-[#795A40]/40 -rotate-2 shadow-xl"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-1.5 top-2 bottom-0 rounded-2xl bg-[#E8DFC9] border border-[#795A40]/45 rotate-1 shadow-xl"
            />

            {/* Main Classified Dossier Folder */}
            <div className="relative rounded-2xl bg-[#E8DFC9] text-[#1F362D] border-2 border-[#E7B94F] shadow-[0_24px_48px_rgba(20,42,33,0.42)] transition-transform duration-300 hover:-translate-y-1">
              {/* Top Manila Tab */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#315C4C]/15 bg-[#A9C5AD]/65 rounded-t-[14px]">
                <div className="space-y-0.5">
                  <p className="font-mono-tabular text-[11px] font-bold tracking-[0.16em] uppercase text-[#795A40]">
                    Kod Operasi: OP-SB // 001
                  </p>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#315C4C]">
                    Fail Sulit · Sekolah Seri Bestari
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDossierOpen((prev) => !prev)}
                  aria-expanded={dossierOpen}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#315C4C] hover:bg-[#3D6E5C] text-[#F8F5EC] text-xs font-semibold border border-[#E7B94F]/70 shadow transition-all duration-150 active:scale-[0.98] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B94F]"
                >
                  <FolderOpen className="w-4 h-4 text-[#E7B94F]" />
                  {dossierOpen ? 'Tutup Fail' : 'Buka Fail'}
                </button>
              </div>

              {/* Dossier Body */}
              <div className="p-5 space-y-4">
                {/* Rubber Stamp & Metadata Strip */}
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-block font-mono-tabular text-[11px] font-bold tracking-[0.2em] uppercase text-[#795A40] border-2 border-[#795A40] px-2.5 py-1 rounded-sm -rotate-2 bg-[#F8F5EC]/80">
                    SULIT AKADEMI
                  </span>
                  <span className="font-mono-tabular text-xs font-medium text-[#315C4C]">
                    4 Lokasi · 5 Fasa Misi
                  </span>
                </div>

                {!dossierOpen ? (
                  <button
                    type="button"
                    onClick={() => setDossierOpen(true)}
                    className="w-full text-left bg-[#F8F5EC] hover:bg-white rounded-xl p-4 border border-[#315C4C]/15 shadow-sm transition-colors space-y-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7B94F]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-[#315C4C]">
                      <span className="inline-flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#795A40]" />
                        Dokumen Taklimat Awal
                      </span>
                      <span className="text-[#795A40] group-hover:translate-x-0.5 transition-transform">
                        Klik untuk buka →
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A6358] leading-relaxed">
                      Fail ini menyimpan maklumat empat kawasan sekolah yang dilaporkan bermasalah.
                      Buka fail untuk memeriksa objektif sebelum memulakan penyiasatan.
                    </p>
                  </button>
                ) : (
                  <div className="dossier-unfold bg-[#F8F5EC] rounded-xl p-4 sm:p-5 border border-[#315C4C]/20 shadow-inner space-y-3">
                    <div className="flex items-center justify-between border-b border-[#315C4C]/12 pb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#315C4C]">
                        <Compass className="w-4 h-4 text-[#795A40]" />
                        Ringkasan Misi Rahsia
                      </span>
                      <span className="font-mono-tabular text-[11px] text-[#315C4C] font-semibold">
                        STATUS: AKTIF
                      </span>
                    </div>

                    <ul className="space-y-2.5 text-xs sm:text-sm text-[#1F362D]">
                      <li className="flex items-start gap-2.5">
                        <span className="font-mono-tabular font-bold text-[#795A40]">01.</span>
                        <span>
                          <strong>Jejak Bukti:</strong> Siasat Kantin Ceria, Kelas Harmoni,
                          Perpustakaan Ilmu dan Taman Rekreasi.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-mono-tabular font-bold text-[#795A40]">02.</span>
                        <span>
                          <strong>Analisis & Teori:</strong> Bina ayat pendapat bernas dan sokong
                          dengan alasan yang relevan.
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <span className="font-mono-tabular font-bold text-[#795A40]">03.</span>
                        <span>
                          <strong>Studio Arkitek:</strong> Reka Pelan Sekolah Impian dan tulis
                          laporan akhir ejen.
                        </span>
                      </li>
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#4A6358] pt-1 border-t border-[#315C4C]/12">
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#E7B94F]" />
                    Tahap 3 · Pembelajaran Berasaskan Pengembaraan
                  </span>
                  <span className="font-mono-tabular">Seri Bestari</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Safe Margin Control Hint */}
      <footer className="relative z-30 w-full max-w-7xl mx-auto px-5 sm:px-8 pb-4 pt-1 text-xs text-[#F8F5EC]/90 flex flex-wrap items-center justify-between gap-3">
        <span>Tekan Enter atau klik Sambung Pengembaraan untuk memasuki operasi</span>
        <span>Penyimpanan setempat automatik pada pelayar peranti ini</span>
      </footer>

      {/* Panduan Permainan Modal */}
      {guideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-title"
          className="fixed inset-0 z-50 bg-[#315C4C]/60 backdrop-blur-[2px] flex items-center justify-center p-4"
        >
          <div className="dossier-unfold bg-[#F8F5EC] text-[#1F362D] rounded-2xl max-w-2xl w-full p-6 border-2 border-[#E7B94F] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#315C4C]/15 pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#795A40]">
                  Taklimat Akademi Ejen Bahasa
                </p>
                <h2 id="guide-title" className="font-display text-2xl font-bold text-[#315C4C]">
                  Panduan Permainan
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                aria-label="Tutup panduan permainan"
                className="p-2 rounded-lg text-[#315C4C] hover:bg-[#E8DFC9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-[#1F362D]">
              <p>
                <strong>Fasa 1 — Operasi Jejak Bukti:</strong> Pilih mana-mana lokasi daripada 4
                kawasan sekolah, klik objek bermasalah pada gambar, gunakan bantuan 3 tahap Profesor
                Nurin jika perlu, dan catatkan pemerhatian serta cadangan awal anda.
              </p>
              <p>
                <strong>Fasa 2 — Makmal Analisis Kes:</strong> Pilih 2 hingga 3 bukti terbaik dan
                tuliskan ayat pendapat anda sendiri secara bebas dan kreatif.
              </p>
              <p>
                <strong>Fasa 3 — Buktikan Teori Ejen:</strong> Bezakan alasan yang relevan dengan
                alasan yang tidak berkaitan, kemudian tulis alasan penyokong bagi pendapat anda.
              </p>
              <p>
                <strong>Cabaran Akhir — Studio Arkitek:</strong> Seret dan lepas (atau ketik)
                kemudahan ke atas pelan sekolah dan berikan justifikasi reka bentuk berdasarkan
                bukti siasatan.
              </p>
              <p>
                <strong>Produk Akhir — Laporan Sekolah Impian:</strong> Hasilkan laporan pendapat
                sepanjang 3 hingga 5 ayat yang boleh dipratonton dan dicetak.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-[#315C4C] hover:bg-[#3D6E5C] text-[#F8F5EC] border border-[#E7B94F] text-sm font-semibold transition-colors"
              >
                Faham, Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
