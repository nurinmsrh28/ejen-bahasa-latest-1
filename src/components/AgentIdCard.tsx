import React, { useState } from 'react';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { generateQrMatrix } from '../game/rules';
import type { AgentProfile } from '../game/types';
import { AcademyEmblem, ProfesorCitraPortrait, QrCodeVisual, TeamInsigniaIcon } from './DetectiveArt';

interface AgentIdCardProps {
  profile: AgentProfile;
  rankLabel?: string;
}

export function AgentIdCard({ profile, rankLabel = 'Anggota Rasmi' }: AgentIdCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [holoPos, setHoloPos] = useState({ x: 50, y: 50, active: false });
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const agentId = profile.agentId || 'SB-26-0001';
  const qrSeed = `${agentId}|${profile.name}|${profile.className}|${profile.codenameBadge}`;

  const handleCardPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    const ry = ((x - 50) / 50) * 4;
    const rx = -((y - 50) / 50) * 3.5;
    setHoloPos({ x, y, active: true });
    setTilt({ rx, ry });
  };

  const handleCardPointerLeave = () => {
    setHoloPos({ x: 50, y: 50, active: false });
    setTilt({ rx: 0, ry: 0 });
  };

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1040;
      canvas.height = 620;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Classic Forest Green Gradient Base (#315C48 -> #264938)
      const grad = ctx.createLinearGradient(0, 0, 1040, 620);
      grad.addColorStop(0, '#315C48');
      grad.addColorStop(0.6, '#2B5240');
      grad.addColorStop(1, '#264938');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1040, 620);

      // Subtle technical grid lines
      ctx.strokeStyle = 'rgba(231, 200, 120, 0.12)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1040; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 620);
        ctx.stroke();
      }
      for (let y = 0; y < 620; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1040, y);
        ctx.stroke();
      }

      // Outer Champagne Gold Frame
      ctx.strokeStyle = '#E7C878';
      ctx.lineWidth = 5;
      ctx.strokeRect(20, 20, 1000, 580);

      // Header Strip
      ctx.fillStyle = '#264938';
      ctx.fillRect(22, 22, 996, 98);
      ctx.strokeStyle = 'rgba(231, 200, 120, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(22, 120);
      ctx.lineTo(1018, 120);
      ctx.stroke();

      ctx.fillStyle = '#E7C878';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SEKOLAH SERI BESTARI · PORTAL OPERASI SULIT', 52, 58);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px serif';
      ctx.fillText('KAD IDENTITI RASMI EJEN', 52, 96);

      ctx.fillStyle = '#E7C878';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`ID: ${agentId}`, 800, 78);

      // Load Portrait Image
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = 'anonymous';
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = src;
        });

      try {
        const portrait = await loadImg(
          '/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png'
        );
        ctx.save();
        ctx.beginPath();
        ctx.arc(165, 295, 102, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(portrait, 55, 185, 220, 220);
        ctx.restore();
      } catch {
        ctx.fillStyle = '#264938';
        ctx.beginPath();
        ctx.arc(165, 295, 102, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = '#E7C878';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(165, 295, 102, 0, Math.PI * 2);
      ctx.stroke();

      // Agent Text Info
      const drawField = (label: string, val: string, y: number) => {
        ctx.fillStyle = '#E7C878';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(label, 315, y);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px serif';
        ctx.fillText(val, 315, y + 34);
      };

      drawField('NAMA PENUH EJEN', profile.name, 195);
      drawField('KELAS', profile.className, 285);
      drawField('GELARAN PASUKAN', `${profile.codenameBadge} · ${rankLabel}`, 375);

      // Verified Official Stamp
      ctx.save();
      ctx.translate(450, 495);
      ctx.rotate(-0.07);
      ctx.strokeStyle = '#E7C878';
      ctx.lineWidth = 3;
      ctx.strokeRect(-130, -26, 260, 52);
      ctx.fillStyle = 'rgba(231, 200, 120, 0.16)';
      ctx.fillRect(-130, -26, 260, 52);
      ctx.fillStyle = '#E7C878';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('IDENTITI DISAHKAN', 0, 7);
      ctx.restore();

      // Deterministic QR Matrix on bottom-right
      const matrix = generateQrMatrix(qrSeed);
      const qrX = 815;
      const qrY = 365;
      const cell = 7;
      ctx.fillStyle = '#F5F0E5';
      ctx.fillRect(qrX - 10, qrY - 10, matrix.length * cell + 20, matrix.length * cell + 20);
      ctx.fillStyle = '#26382F';
      matrix.forEach((row, r) =>
        row.forEach((filled, c) => {
          if (filled) ctx.fillRect(qrX + c * cell, qrY + r * cell, cell, cell);
        })
      );

      ctx.fillStyle = '#DCE9D9';
      ctx.font = '14px monospace';
      ctx.fillText('AKSES DIBENARKAN · FAIL KES SEKOLAH SERI BESTARI', 52, 568);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `Kad_Identiti_${agentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <article
        onPointerMove={handleCardPointerMove}
        onPointerLeave={handleCardPointerLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition: holoPos.active ? 'transform 120ms ease-out' : 'transform 380ms ease-out',
        }}
        className="print-only-full relative rounded-2xl bg-gradient-to-br from-[#315C48] via-[#2B5240] to-[#264938] border-2 border-[#E7C878] shadow-[0_20px_48px_rgba(38,56,47,0.22)] overflow-hidden text-[#FFFFFF] touch-manipulation"
      >
        {/* Interactive Holographic Shimmer Overlay (pointer-reactive, non-print) */}
        <div
          aria-hidden="true"
          className={`no-print pointer-events-none absolute inset-0 z-20 hq-holo-foil ${
            holoPos.active ? 'opacity-100' : 'opacity-35'
          }`}
          style={
            {
              '--holo-x': `${holoPos.x}%`,
              '--holo-y': `${holoPos.y}%`,
            } as React.CSSProperties
          }
        />

        {/* Technical Pattern Overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(231,200,120,0.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(231,200,120,0.24) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Card Header Strip */}
        <div className="relative z-10 bg-[#264938] px-5 sm:px-7 py-4 border-b border-[#E7C878]/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AcademyEmblem className="w-11 h-11 shrink-0" />
            <div>
              <p className="font-mono-tabular text-[11px] font-bold tracking-[0.18em] uppercase text-[#E7C878]">
                Akademi Ejen Rahsia · Sekolah Seri Bestari
              </p>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#FFFFFF]">
                Kad Identiti Rasmi Ejen
              </h2>
            </div>
          </div>

          <div className="text-right">
            <p className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#DCE9D9]">
              No. ID Ejen Rasmi
            </p>
            <p className="font-mono-tabular text-base sm:text-lg font-bold text-[#E7C878]">
              {agentId}
            </p>
          </div>
        </div>

        {/* Card Body */}
        <div className="relative z-10 p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Portrait */}
          <div className="sm:col-span-4 flex flex-col items-center gap-2.5">
            <ProfesorCitraPortrait
              realistic
              className="w-32 h-32 sm:w-36 sm:h-36 shadow-[0_12px_28px_rgba(38,56,47,0.28)]"
            />
            <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[11px] font-bold tracking-[0.18em] uppercase px-3 py-1 rounded border border-[#E7C878] bg-[#E7C878]/15 text-[#E7C878] -rotate-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              IDENTITI DISAHKAN
            </span>
          </div>

          {/* Agent Credentials */}
          <div className="sm:col-span-5 space-y-3.5">
            <div className="border-b border-[#E7C878]/35 pb-2.5">
              <p className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#E7C878]">
                Nama Penuh Ejen
              </p>
              <p className="font-display text-2xl font-bold text-[#FFFFFF] leading-snug">
                {profile.name}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#264938]/90 border border-[#E7C878]/40 p-3">
                <p className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#DCE9D9]">
                  Kelas
                </p>
                <p className="text-sm font-bold text-[#FFFFFF] mt-0.5">{profile.className}</p>
              </div>
              <div className="rounded-xl bg-[#264938]/90 border border-[#E7C878]/40 p-3">
                <p className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#DCE9D9]">
                  Gelaran Pasukan
                </p>
                <p className="text-sm font-bold text-[#E7C878] mt-0.5 inline-flex items-center gap-1.5">
                  <TeamInsigniaIcon badgeName={profile.codenameBadge} className="w-4 h-4 shrink-0" />
                  <span>{profile.codenameBadge}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#A8C5A0]/20 border border-[#A8C5A0]/50 px-3.5 py-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#F5F0E5]">Status Akses:</span>
              <span className="font-mono-tabular font-bold text-[#E7C878]">AKSES DIBENARKAN</span>
            </div>
          </div>

          {/* QR Code Visual */}
          <div className="sm:col-span-3 flex flex-col items-center gap-2 bg-[#264938]/90 rounded-xl p-3.5 border border-[#E7C878]/45">
            <div className="p-2 rounded-lg bg-[#FFFFFF] shadow-inner">
              <QrCodeVisual seed={qrSeed} className="w-24 h-24" />
            </div>
            <p className="font-mono-tabular text-[10px] tracking-widest uppercase text-[#E7C878] text-center">
              Imbasan Kod Rasmi
            </p>
          </div>
        </div>
      </article>

      {/* Print & Download Controls */}
      <div className="no-print flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#315C48] hover:bg-[#264938] text-[#FFFFFF] border border-[#E7C878] text-xs font-semibold transition-colors"
        >
          <Printer className="w-4 h-4 text-[#E7C878]" />
          Cetak Kad Identiti
        </button>

        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E7C878] hover:bg-[#F0D68C] text-[#26382F] border border-[#315C48]/25 text-xs font-bold transition-colors"
        >
          <Download className="w-4 h-4 text-[#26382F]" />
          {downloading ? 'Menjana Kad PNG...' : 'Muat Turun Kad Identiti (PNG)'}
        </button>
      </div>
    </div>
  );
}
