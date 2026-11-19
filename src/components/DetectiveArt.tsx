import React, { useState } from 'react';
import { Compass, Feather, PenTool, Search } from 'lucide-react';
import { generateQrMatrix } from '../game/rules';
import type { FacilityAssetId } from '../game/types';

export function AcademyEmblem({ className = 'w-14 h-14' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 112 112"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="crestGold" x1="14" y1="6" x2="98" y2="104" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF0B8" />
          <stop offset="45%" stopColor="#E7C878" />
          <stop offset="100%" stopColor="#AD8129" />
        </linearGradient>
        <radialGradient id="crestCoreBg" cx="0.5" cy="0.38" r="0.6">
          <stop offset="0%" stopColor="#26634B" />
          <stop offset="100%" stopColor="#103D30" />
        </radialGradient>
      </defs>

      {/* Gold Laurel Wreath */}
      <g fill="url(#crestGold)" stroke="#78561A" strokeWidth="0.9">
        <ellipse cx="14" cy="54" rx="4.5" ry="7.8" transform="rotate(-24 14 54)" />
        <ellipse cx="12.5" cy="40" rx="4.2" ry="7.4" transform="rotate(-8 12.5 40)" />
        <ellipse cx="16.5" cy="26" rx="4" ry="7" transform="rotate(14 16.5 26)" />
        <ellipse cx="20" cy="68" rx="4.6" ry="7.8" transform="rotate(-44 20 68)" />
        <ellipse cx="98" cy="54" rx="4.5" ry="7.8" transform="rotate(24 98 54)" />
        <ellipse cx="99.5" cy="40" rx="4.2" ry="7.4" transform="rotate(8 99.5 40)" />
        <ellipse cx="95.5" cy="26" rx="4" ry="7" transform="rotate(-14 95.5 26)" />
        <ellipse cx="92" cy="68" rx="4.6" ry="7.8" transform="rotate(44 92 68)" />
      </g>

      {/* Outer Shield Crest */}
      <path
        d="M56 12L89 23V50C89 72 74 87 56 96C38 87 23 72 23 50V23L56 12Z"
        fill="url(#crestCoreBg)"
        stroke="url(#crestGold)"
        strokeWidth="3.2"
      />
      <path
        d="M56 18L83 27V50C83 68 70 81 56 89C42 81 29 68 29 50V27L56 18Z"
        fill="none"
        stroke="#E7C878"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />

      {/* Detective Fedora Hat */}
      <path
        d="M36 42L41 24C43 20 49 18.5 56 20.5C63 18.5 69 20 71 24L76 42H36Z"
        fill="#2A3138"
        stroke="#E7C878"
        strokeWidth="1.6"
      />
      <path d="M37.5 36.5H74.5L76 42H36L37.5 36.5Z" fill="url(#crestGold)" />
      <ellipse cx="56" cy="43.5" rx="28" ry="6.2" fill="#1C2228" stroke="url(#crestGold)" strokeWidth="1.6" />

      {/* Magnifying Glass */}
      <circle cx="63" cy="54" r="10.5" fill="#A8E6CF" fillOpacity="0.24" stroke="url(#crestGold)" strokeWidth="2.8" />
      <path d="M58 50C60 47.8 63 47.2 66 48" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="70.5" y1="61.5" x2="78.5" y2="69.5" stroke="url(#crestGold)" strokeWidth="4" strokeLinecap="round" />

      {/* Curved Gold Ribbon Banner */}
      <path
        d="M15 69C27 77 41 80 56 80C71 80 85 77 97 69L93 85C81 92 69 95 56 95C43 95 31 92 19 85L15 69Z"
        fill="url(#crestGold)"
        stroke="#78561A"
        strokeWidth="1.5"
      />
      <text
        x="56"
        y="83"
        textAnchor="middle"
        fill="#103D30"
        fontSize="8.8"
        fontWeight="900"
        fontFamily="serif"
        letterSpacing="0.5"
      >
        DETECTIVE
      </text>
      <text
        x="56"
        y="92.2"
        textAnchor="middle"
        fill="#103D30"
        fontSize="7.4"
        fontWeight="800"
        fontFamily="sans-serif"
        letterSpacing="0.6"
      >
        ACADEMY
      </text>
    </svg>
  );
}

export function ProfesorCitraPortrait({
  className = 'w-20 h-20',
  realistic = true,
}: {
  className?: string;
  realistic?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  if (realistic && !imgFailed) {
    return (
      <div
        className={`relative rounded-full overflow-hidden border-[3px] border-[#E7C878] bg-[#F5F0E5] ring-2 ring-[#315C48]/25 ${className}`}
      >
        <img
          src="/assets/aistudio/Professor_Detective_in_the_Investigation_Office_54081002.png"
          alt="Potret Profesor Nurin"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover object-center scale-[1.04]"
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Ilustrasi Profesor Nurin"
    >
      <defs>
        <radialGradient id="citraHalo" cx="0.5" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#FAF6EE" />
          <stop offset="100%" stopColor="#DFD1B4" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="56" fill="#172B25" stroke="#C6A15B" strokeWidth="3.5" />
      <circle cx="60" cy="60" r="50" fill="url(#citraHalo)" />
      <circle cx="60" cy="23" r="14" fill="#2A231E" />
      <path d="M48 22C52 17 68 17 72 22" stroke="#C6A15B" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 107C25 82 41 75 60 75C79 75 95 82 97 107" fill="#172B25" />
      <path d="M45 76L38 106M75 76L82 106" stroke="#795A40" strokeWidth="2.5" />
      <path d="M47 75L60 94L73 75H47Z" fill="#FAF6EE" />
      <path d="M53 77L60 88L67 77" stroke="#C2593F" strokeWidth="3" strokeLinecap="round" />
      <rect x="53" y="64" width="14" height="14" rx="5" fill="#E4B497" />
      <ellipse cx="60" cy="50" rx="20" ry="22" fill="#ECC0A4" />
      <path
        d="M39 48C39 33 50 25 60 25C70 25 81 33 81 48C77 37 68 34 60 35C52 34 43 37 39 48Z"
        fill="#2A231E"
      />
      <circle cx="51" cy="50" r="6.8" fill="#FAF6EE" fillOpacity="0.35" stroke="#C6A15B" strokeWidth="2.2" />
      <circle cx="69" cy="50" r="6.8" fill="#FAF6EE" fillOpacity="0.35" stroke="#C6A15B" strokeWidth="2.2" />
      <line x1="57.8" y1="50" x2="62.2" y2="50" stroke="#C6A15B" strokeWidth="2" />
      <circle cx="51" cy="50" r="2.1" fill="#1B241E" />
      <circle cx="69" cy="50" r="2.1" fill="#1B241E" />
      <path d="M53 60C56 64 64 64 67 60" stroke="#9F432C" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="77" cy="92" r="4.2" fill="#C6A15B" stroke="#172B25" strokeWidth="1.3" />
    </svg>
  );
}

export function TeamInsigniaIcon({
  badgeName,
  className = 'w-5 h-5',
}: {
  badgeName: string;
  className?: string;
}) {
  switch (badgeName) {
    case 'Helang Bestari':
      return <Feather className={className} />;
    case 'Kanta Ilmu':
      return <Search className={className} />;
    case 'Pena Emas':
      return <PenTool className={className} />;
    case 'Arkitek Muda':
    default:
      return <Compass className={className} />;
  }
}

export function QrCodeVisual({
  seed,
  className = 'w-20 h-20',
}: {
  seed: string;
  className?: string;
}) {
  const matrix = generateQrMatrix(seed);
  return (
    <svg
      viewBox="0 0 21 21"
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kod QR Pengesahan Identiti Ejen"
    >
      <rect width="21" height="21" fill="#FAF6EE" rx="1" />
      {matrix.map((row, rIdx) =>
        row.map((filled, cIdx) =>
          filled ? (
            <rect key={`${rIdx}-${cIdx}`} x={cIdx} y={rIdx} width="1" height="1" fill="#172B25" />
          ) : null
        )
      )}
    </svg>
  );
}

export function SchoolBackdropArt() {
  return (
    <svg
      viewBox="0 0 1200 640"
      className="w-full h-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyTwilight" x1="600" y1="0" x2="600" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#12281D" />
          <stop offset="55%" stopColor="#234936" />
          <stop offset="100%" stopColor="#4A6B57" />
        </linearGradient>
        <radialGradient id="lanternGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F5C76B" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#F5C76B" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="640" fill="url(#skyTwilight)" />

      {/* Crescent moon & subtle stars */}
      <circle cx="960" cy="110" r="34" fill="#FAF6EE" fillOpacity="0.9" />
      <circle cx="974" cy="102" r="30" fill="#1A3527" />
      <circle cx="210" cy="95" r="2" fill="#FAF6EE" fillOpacity="0.7" />
      <circle cx="340" cy="135" r="2.5" fill="#D49B27" fillOpacity="0.8" />
      <circle cx="780" cy="82" r="2" fill="#FAF6EE" fillOpacity="0.65" />
      <circle cx="1070" cy="160" r="2" fill="#FAF6EE" fillOpacity="0.6" />

      {/* Rolling hills */}
      <path d="M0 440C200 370 420 410 640 390C860 370 1050 400 1200 375V640H0V440Z" fill="#1B392A" />

      {/* Main School Silhouette: Sekolah Seri Bestari */}
      <g transform="translate(240, 175)">
        {/* Left & Right Wings */}
        <rect x="20" y="130" width="220" height="165" fill="#2A4838" stroke="#14291F" strokeWidth="2" />
        <rect x="480" y="130" width="220" height="165" fill="#2A4838" stroke="#14291F" strokeWidth="2" />
        {/* Terracotta Roofs */}
        <polygon points="8,130 130,68 250,130" fill="#9F432C" />
        <polygon points="470,130 590,68 712,130" fill="#9F432C" />

        {/* Central Clock Tower & Hall */}
        <rect x="235" y="95" width="250" height="200" fill="#325542" stroke="#14291F" strokeWidth="2" />
        <rect x="315" y="18" width="90" height="90" fill="#39604B" stroke="#14291F" strokeWidth="2" />
        <polygon points="303,20 360,-24 417,20" fill="#C2593F" />
        {/* Clock face */}
        <circle cx="360" cy="56" r="22" fill="#FAF6EE" stroke="#D49B27" strokeWidth="3" />
        <line x1="360" y1="56" x2="360" y2="43" stroke="#183426" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="360" y1="56" x2="371" y2="56" stroke="#C2593F" strokeWidth="2.5" strokeLinecap="round" />

        {/* Warm Lit Windows */}
        {[55, 115, 175, 520, 580, 640].map((wx) => (
          <g key={wx}>
            <rect x={wx} y="155" width="32" height="44" rx="4" fill="#E8B857" fillOpacity="0.82" />
            <rect x={wx} y="220" width="32" height="44" rx="4" fill="#E8B857" fillOpacity="0.6" />
          </g>
        ))}
        {[265, 425].map((wx) => (
          <g key={wx}>
            <rect x={wx} y="135" width="34" height="52" rx="17" fill="#F2CA6B" fillOpacity="0.88" />
          </g>
        ))}
        {/* Archway entrance */}
        <path d="M325 295V235C325 215 395 215 395 235V295H325Z" fill="#162A20" />
        <circle cx="360" cy="245" r="46" fill="url(#lanternGlow)" />
      </g>

      {/* Foreground Trees & Courtyard */}
      <rect x="0" y="470" width="1200" height="170" fill="#13271D" />
      <path d="M520 470L430 640H770L680 470H520Z" fill="#2A4032" />
      <circle cx="130" cy="435" r="78" fill="#183627" />
      <circle cx="195" cy="455" r="60" fill="#214634" />
      <circle cx="1070" cy="430" r="82" fill="#183627" />
      <circle cx="995" cy="460" r="58" fill="#214634" />
    </svg>
  );
}

export function FacilityIconSvg({
  assetId,
  className = 'w-8 h-8',
}: {
  assetId: FacilityAssetId;
  className?: string;
}) {
  switch (assetId) {
    case 'kantin':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="5" y="16" width="30" height="18" rx="3" fill="#FAF6EE" stroke="#183426" strokeWidth="2" />
          <path d="M3 16L8 8H32L37 16H3Z" fill="#C2593F" stroke="#183426" strokeWidth="2" />
          <rect x="13" y="21" width="14" height="7" rx="1.5" fill="#D49B27" />
        </svg>
      );
    case 'bilik_darjah':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="12" width="28" height="22" rx="2.5" fill="#F2EAD8" stroke="#183426" strokeWidth="2" />
          <rect x="10" y="16" width="20" height="10" rx="1.5" fill="#234936" />
          <rect x="16" y="28" width="8" height="6" fill="#C2593F" />
          <path d="M4 12L20 5L36 12" stroke="#183426" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case 'perpustakaan':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="7" y="9" width="26" height="24" rx="3" fill="#FAF6EE" stroke="#183426" strokeWidth="2" />
          <rect x="11" y="13" width="4" height="15" rx="1" fill="#C2593F" />
          <rect x="18" y="13" width="4" height="15" rx="1" fill="#D49B27" />
          <rect x="25" y="13" width="4" height="15" rx="1" fill="#234936" />
        </svg>
      );
    case 'taman_herba':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="24" width="28" height="9" rx="2" fill="#8C5A3C" stroke="#183426" strokeWidth="2" />
          <path d="M14 24C14 17 10 14 10 14C10 14 17 13 18 24" fill="#6F8F78" stroke="#183426" strokeWidth="1.6" />
          <path d="M24 24C24 15 29 11 29 11C29 11 20 11 20 24" fill="#2F5E47" stroke="#183426" strokeWidth="1.6" />
        </svg>
      );
    case 'taman_permainan':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <path d="M8 31L16 11H24L32 31" stroke="#183426" strokeWidth="2.4" strokeLinecap="round" />
          <line x1="20" y1="11" x2="20" y2="23" stroke="#C2593F" strokeWidth="2" />
          <rect x="15" y="23" width="10" height="4" rx="1.5" fill="#D49B27" stroke="#183426" strokeWidth="1.5" />
        </svg>
      );
    case 'padang':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="5" y="9" width="30" height="22" rx="3" fill="#4E7D5B" stroke="#183426" strokeWidth="2" />
          <line x1="20" y1="9" x2="20" y2="31" stroke="#FAF6EE" strokeWidth="1.6" />
          <circle cx="20" cy="20" r="4.5" stroke="#FAF6EE" strokeWidth="1.6" />
        </svg>
      );
    case 'tong_sampah':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="11" y="13" width="18" height="21" rx="2.5" fill="#2F5E47" stroke="#183426" strokeWidth="2" />
          <path d="M9 13H31" stroke="#183426" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M16 13V9H24V13" stroke="#183426" strokeWidth="2" />
          <circle cx="20" cy="23" r="4" fill="#D49B27" />
        </svg>
      );
    case 'cuci_tangan':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="9" y="21" width="22" height="8" rx="3" fill="#FAF6EE" stroke="#183426" strokeWidth="2" />
          <path d="M20 21V13C20 10 24 10 24 13" stroke="#183426" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 29V34M24 29V34" stroke="#183426" strokeWidth="2" strokeLinecap="round" />
          <circle cx="15" cy="17" r="2.2" fill="#5BA4B5" />
        </svg>
      );
    case 'bangku':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="7" y="16" width="26" height="5" rx="1.5" fill="#B87D14" stroke="#183426" strokeWidth="1.8" />
          <rect x="6" y="23" width="28" height="4" rx="1.5" fill="#D49B27" stroke="#183426" strokeWidth="1.8" />
          <path d="M10 27V33M30 27V33" stroke="#183426" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'pokok':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="17.5" y="23" width="5" height="11" rx="1.5" fill="#7D4E32" stroke="#183426" strokeWidth="1.5" />
          <circle cx="20" cy="17" r="10" fill="#2F5E47" stroke="#183426" strokeWidth="2" />
          <circle cx="15" cy="19" r="6" fill="#6F8F78" />
        </svg>
      );
    case 'bunga':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <path d="M20 33V20" stroke="#234936" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="20" cy="13" r="4" fill="#C2593F" />
          <circle cx="14" cy="17" r="4" fill="#C2593F" />
          <circle cx="26" cy="17" r="4" fill="#C2593F" />
          <circle cx="16" cy="22" r="4" fill="#C2593F" />
          <circle cx="24" cy="22" r="4" fill="#C2593F" />
          <circle cx="20" cy="18" r="3.5" fill="#D49B27" />
        </svg>
      );
    case 'laluan':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
          <rect x="6" y="13" width="28" height="14" rx="2" fill="#E5D8BD" stroke="#183426" strokeWidth="2" />
          <line x1="11" y1="20" x2="17" y2="20" stroke="#9F432C" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="23" y1="20" x2="29" y2="20" stroke="#9F432C" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
  }
}

export function BadgeIconSvg({
  badgeId,
  earned,
  className = 'w-14 h-14',
}: {
  badgeId: string;
  earned: boolean;
  className?: string;
}) {
  const gradId = `medalGold-${badgeId}-${earned ? 'on' : 'off'}`;
  const rim = earned ? '#315C48' : '#A8C5A0';
  const inner = earned ? '#315C48' : '#DCE9D9';
  const accent = earned ? '#F5F0E5' : '#4B6357';
  const emblemFill = earned ? '#C2593F' : '#8BA693';

  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          {earned ? (
            <>
              <stop offset="0%" stopColor="#FAF0CB" />
              <stop offset="45%" stopColor="#E7C878" />
              <stop offset="100%" stopColor="#B8903D" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#D4E2CF" />
              <stop offset="50%" stopColor="#A8C5A0" />
              <stop offset="100%" stopColor="#7A9A78" />
            </>
          )}
        </linearGradient>
      </defs>

      {/* Outer Laurel Wreath Leaves */}
      <g stroke={`url(#${gradId})`} strokeWidth="1.8" strokeLinecap="round">
        <path d="M13 46C8 39 7 29 11 20" fill="none" />
        <path d="M51 46C56 39 57 29 53 20" fill="none" />
        <ellipse cx="9" cy="36" rx="2.4" ry="4.2" transform="rotate(-22 9 36)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="9" cy="27" rx="2.3" ry="4" transform="rotate(-8 9 27)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="13" cy="19" rx="2.2" ry="3.8" transform="rotate(14 13 19)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="15" cy="44" rx="2.4" ry="4.1" transform="rotate(-44 15 44)" fill={`url(#${gradId})`} stroke="none" />

        <ellipse cx="55" cy="36" rx="2.4" ry="4.2" transform="rotate(22 55 36)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="55" cy="27" rx="2.3" ry="4" transform="rotate(8 55 27)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="51" cy="19" rx="2.2" ry="3.8" transform="rotate(-14 51 19)" fill={`url(#${gradId})`} stroke="none" />
        <ellipse cx="49" cy="44" rx="2.4" ry="4.1" transform="rotate(44 49 44)" fill={`url(#${gradId})`} stroke="none" />
      </g>

      {/* Metallic Medal Disc */}
      <circle cx="32" cy="32" r="20" fill={`url(#${gradId})`} stroke={rim} strokeWidth="2.2" />
      <circle cx="32" cy="32" r="16" fill={inner} stroke={accent} strokeWidth="1.2" strokeOpacity={earned ? 0.85 : 0.3} />
      <circle cx="32" cy="32" r="13.5" stroke={accent} strokeWidth="0.9" strokeDasharray="2.5 2.5" strokeOpacity={earned ? 0.65 : 0.25} />

      {/* Embossed Achievement Icon */}
      {badgeId === 'mata_helang' && (
        <g>
          <circle cx="31" cy="31" r="6.5" fill={emblemFill} stroke={accent} strokeWidth="1.8" />
          <path d="M35.8 35.8L40.5 40.5" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="29" cy="29" r="1.5" fill={accent} />
        </g>
      )}
      {badgeId === 'penganalisis_kes' && (
        <g>
          <rect x="24" y="23" width="16" height="18" rx="2.2" fill={emblemFill} stroke={accent} strokeWidth="1.7" />
          <line x1="27.5" y1="28.5" x2="36.5" y2="28.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="27.5" y1="32.5" x2="36.5" y2="32.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="27.5" y1="36.5" x2="33" y2="36.5" stroke={accent} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}
      {badgeId === 'ahli_logik' && (
        <g>
          <path d="M32 21V41M24 27H40" stroke={accent} strokeWidth="2" strokeLinecap="round" />
          <path d="M22 33L25 27L28 33H22Z" fill={emblemFill} stroke={accent} strokeWidth="1.3" />
          <path d="M36 33L39 27L42 33H36Z" fill={emblemFill} stroke={accent} strokeWidth="1.3" />
          <rect x="27" y="40" width="10" height="2.5" rx="1" fill={accent} />
        </g>
      )}
      {badgeId === 'pereka_bestari' && (
        <g>
          <polygon points="32,20 42,36 22,36" fill={emblemFill} stroke={accent} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="32" cy="31" r="2.2" fill={accent} />
          <rect x="24" y="38.5" width="16" height="2.5" rx="1" fill={accent} />
        </g>
      )}
      {badgeId === 'arkitek_impian' && (
        <polygon
          points="32,19 35.4,26.8 43.8,27.7 37.5,33.4 39.2,41.6 32,37.4 24.8,41.6 26.5,33.4 20.2,27.7 28.6,26.8"
          fill={`url(#${gradId})`}
          stroke={accent}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function CollectibleBadgeShield({
  badgeId,
  earned,
  className = 'w-14 h-16',
}: {
  badgeId: string;
  earned: boolean;
  className?: string;
}) {
  const rimGrad = `shieldRim-${badgeId}-${earned ? 'on' : 'off'}`;
  const coreGrad = `shieldCore-${badgeId}-${earned ? 'on' : 'off'}`;

  const palette = !earned
    ? {
        rimTop: '#94A3B8',
        rimMid: '#64748B',
        rimBot: '#334155',
        coreTop: '#475569',
        coreBot: '#1E293B',
        iconStroke: '#CBD5E1',
        iconFill: '#64748B',
      }
    : badgeId === 'mata_helang'
      ? {
          rimTop: '#FFF2B2',
          rimMid: '#E7C878',
          rimBot: '#A67822',
          coreTop: '#FCE38A',
          coreBot: '#C98A1C',
          iconStroke: '#26382F',
          iconFill: '#8EE3C6',
        }
      : badgeId === 'penganalisis_kes'
        ? {
            rimTop: '#FFF2B2',
            rimMid: '#E7C878',
            rimBot: '#A67822',
            coreTop: '#8B5CF6',
            coreBot: '#4C1D95',
            iconStroke: '#FFF3C4',
            iconFill: '#FACC15',
          }
        : badgeId === 'ahli_logik'
          ? {
              rimTop: '#F8FAFC',
              rimMid: '#CBD5E1',
              rimBot: '#64748B',
              coreTop: '#E2E8F0',
              coreBot: '#64748B',
              iconStroke: '#1E293B',
              iconFill: '#F5E8CF',
            }
          : badgeId === 'pereka_bestari'
            ? {
                rimTop: '#FFF2B2',
                rimMid: '#E7C878',
                rimBot: '#A67822',
                coreTop: '#2E8B63',
                coreBot: '#103D30',
                iconStroke: '#FFF2B2',
                iconFill: '#E7C878',
              }
            : {
                rimTop: '#FFF2B2',
                rimMid: '#E7C878',
                rimBot: '#996515',
                coreTop: '#B91C1C',
                coreBot: '#7F1D1D',
                iconStroke: '#FFF2B2',
                iconFill: '#FACC15',
              };

  return (
    <svg viewBox="0 0 72 82" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={rimGrad} x1="8" y1="6" x2="64" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.rimTop} />
          <stop offset="50%" stopColor={palette.rimMid} />
          <stop offset="100%" stopColor={palette.rimBot} />
        </linearGradient>
        <linearGradient id={coreGrad} x1="36" y1="12" x2="36" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={palette.coreTop} />
          <stop offset="100%" stopColor={palette.coreBot} />
        </linearGradient>
      </defs>

      {/* Outer Metallic Shield */}
      <path
        d="M36 5L64 15V41C64 59 52 71 36 78C20 71 8 59 8 41V15L36 5Z"
        fill={`url(#${rimGrad})`}
        stroke={earned ? '#FFF6D1' : '#334155'}
        strokeWidth="2"
      />
      {/* Inner Beveled Shield */}
      <path
        d="M36 11L58 19V41C58 55 48 65 36 71C24 65 14 55 14 41V19L36 11Z"
        fill={`url(#${coreGrad})`}
        stroke={earned ? '#FFF2B2' : '#475569'}
        strokeOpacity="0.65"
        strokeWidth="1.5"
      />

      {!earned ? (
        <g>
          <path
            d="M28 38V32C28 27.6 31.6 24 36 24C40.4 24 44 27.6 44 32V38"
            stroke="#CBD5E1"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <rect
            x="24"
            y="37"
            width="24"
            height="19"
            rx="4"
            fill="#1E293B"
            stroke="#94A3B8"
            strokeWidth="2.2"
          />
          <circle cx="36" cy="45" r="2.6" fill="#CBD5E1" />
          <path d="M36 47V51" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      ) : badgeId === 'mata_helang' ? (
        <g>
          <circle
            cx="33"
            cy="37"
            r="10"
            fill={palette.iconFill}
            fillOpacity="0.45"
            stroke={palette.iconStroke}
            strokeWidth="3.2"
          />
          <path d="M28.5 33C30 31 32.5 30.2 35.5 31" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line
            x1="40.5"
            y1="44.5"
            x2="49"
            y2="53"
            stroke={palette.iconStroke}
            strokeWidth="4.8"
            strokeLinecap="round"
          />
        </g>
      ) : badgeId === 'penganalisis_kes' ? (
        <g>
          <polygon
            points="36,21 40.3,30.5 50.8,31.7 43,38.9 45.1,49.2 36,44 26.9,49.2 29,38.9 21.2,31.7 31.7,30.5"
            fill={palette.iconFill}
            stroke={palette.iconStroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="24" r="1.6" fill="#FFF3C4" />
          <circle cx="48" cy="24" r="1.6" fill="#FFF3C4" />
        </g>
      ) : badgeId === 'ahli_logik' ? (
        <g>
          <polygon
            points="36,23 40,32 50,33 42.5,39.5 44.5,49 36,44.2 27.5,49 29.5,39.5 22,33 32,32"
            fill={palette.iconStroke}
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="37" r="4" fill="#E7C878" />
        </g>
      ) : badgeId === 'pereka_bestari' ? (
        <g>
          <polygon
            points="36,21 49,47 23,47"
            fill={palette.iconFill}
            stroke={palette.iconStroke}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <circle cx="36" cy="39" r="3" fill="#103D30" />
          <rect x="25" y="50" width="22" height="3.5" rx="1.5" fill={palette.iconStroke} />
        </g>
      ) : (
        <g>
          <path
            d="M22 47L26 29L36 37L46 29L50 47H22Z"
            fill={palette.iconFill}
            stroke={palette.iconStroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="26" cy="27" r="2.5" fill="#FFF6D1" />
          <circle cx="36" cy="23" r="2.8" fill="#FFF6D1" />
          <circle cx="46" cy="27" r="2.5" fill="#FFF6D1" />
          <rect x="23" y="49" width="26" height="4" rx="1.5" fill="#FFF6D1" />
        </g>
      )}
    </svg>
  );
}

export function TeacherBooksStackArt({ className = 'w-28 h-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 96" className={className} fill="none" aria-hidden="true">
      {/* Shelf Shadow */}
      <ellipse cx="70" cy="86" rx="56" ry="6" fill="#26382F" fillOpacity="0.18" />

      {/* Standing Books Left-to-Right */}
      <rect x="24" y="22" width="16" height="60" rx="2.5" fill="#174C39" stroke="#103D30" strokeWidth="1.6" />
      <rect x="27" y="30" width="10" height="3" rx="1" fill="#E7C878" />
      <rect x="27" y="70" width="10" height="3" rx="1" fill="#E7C878" />

      <rect x="42" y="16" width="18" height="66" rx="2.5" fill="#8C3B2B" stroke="#5A2218" strokeWidth="1.6" />
      <rect x="45" y="25" width="12" height="4" rx="1" fill="#E7C878" />
      <rect x="45" y="69" width="12" height="3" rx="1" fill="#F5E8CF" />

      <rect x="62" y="26" width="15" height="56" rx="2.5" fill="#245D47" stroke="#103D30" strokeWidth="1.6" />
      <rect x="65" y="34" width="9" height="12" rx="1" fill="#F5E8CF" />

      <rect x="79" y="19" width="16" height="63" rx="2.5" fill="#6E5035" stroke="#47321E" strokeWidth="1.6" />
      <rect x="82" y="28" width="10" height="3" rx="1" fill="#E7C878" />
      <rect x="82" y="70" width="10" height="3" rx="1" fill="#E7C878" />

      {/* Leaning Book on Right */}
      <g transform="rotate(-11 108 55)">
        <rect x="98" y="24" width="16" height="58" rx="2.5" fill="#1F4035" stroke="#0E261E" strokeWidth="1.6" />
        <rect x="101" y="32" width="10" height="4" rx="1" fill="#E7C878" />
        <rect x="101" y="68" width="10" height="3" rx="1" fill="#E7C878" />
      </g>
    </svg>
  );
}
