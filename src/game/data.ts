import type {
  BadgeDefinition,
  DesignActionType,
  FacilityAsset,
  FacilityAssetId,
  LocationDefinition,
  LocationId,
  LogicChallenge,
  PlacedFacility,
} from './types.ts';

export const PROFESOR_CITRA_WELCOME =
  'Selamat datang, Ejen! Saya Profesor Nurin. Sekolah Seri Bestari sedang menghadapi beberapa masalah yang memerlukan penyiasatan anda. Saya telah menemui beberapa petunjuk awal. Bersediakah anda menerima operasi ini?';

export const LOCATIONS: LocationDefinition[] = [
  {
    id: 'kantin',
    name: 'Kantin Ceria',
    shortName: 'Kantin',
    zoneLabel: 'Zon Utara · Blok Makan',
    briefing:
      'Kantin kelihatan sesak selepas waktu rehat. Perhatikan lantai, meja makan dan sudut pembuangan sisa.',
    hints: [
      'Tahap 1 (Umum): Lihat kawasan sekitar tempat murid makan dan membuang bungkusan makanan.',
      'Tahap 2 (Khusus): Periksa permukaan meja, lantai berhampiran kaunter dan tong sampah di penjuru kanan.',
      'Tahap 3 (Sorotan Visual): Perhatikan lingkaran amaran pada objek yang belum diperiksa dalam gambar.',
    ],
    clues: [
      {
        id: 'kantin_sampah',
        label: 'Sampah Bertaburan di Lantai',
        issueSummary: 'Bungkusan plastik dan tisu makanan bertaburan di bawah meja makan.',
        profesorReaction:
          'Pemerhatian tajam, Ejen! Lantai yang kotor bukan sahaja mencacatkan pemandangan, malah boleh mengundang serangga perosak.',
      },
      {
        id: 'kantin_meja',
        label: 'Sisa Makanan di Atas Meja',
        issueSummary: 'Pinggan, cawan dan sisa makanan ditinggalkan tanpa dibersihkan oleh pengguna.',
        profesorReaction:
          'Tepat sekali. Apabila sisa makanan dibiarkan di atas meja, murid lain tidak dapat makan dengan selesa.',
      },
      {
        id: 'kantin_tong',
        label: 'Tong Sampah Penuh Melimpah',
        issueSummary: 'Satu tong sampah kecil tidak mencukupi dan telah penuh hingga melimpah keluar.',
        profesorReaction:
          'Petunjuk penting! Kekurangan tong sampah yang mencukupi sering menyebabkan sampah tidak dibuang dengan betul.',
      },
    ],
  },
  {
    id: 'kelas',
    name: 'Kelas Harmoni',
    shortName: 'Kelas',
    zoneLabel: 'Zon Barat · Blok Akademik',
    briefing:
      'Kelas Harmoni sepatutnya menjadi ruang pembelajaran yang kondusif. Teliti susunan perabot dan sudut ilmu.',
    hints: [
      'Tahap 1 (Umum): Imbas susunan ruang belajar murid serta dinding dan rak di bahagian belakang kelas.',
      'Tahap 2 (Khusus): Perhatikan barisan meja dan kerusi, papan sudut pembelajaran dan rak bahan bantu belajar.',
      'Tahap 3 (Sorotan Visual): Sorotan visual telah diaktifkan pada objek bermasalah yang masih belum diklik.',
    ],
    clues: [
      {
        id: 'kelas_meja',
        label: 'Meja & Kerusi Tidak Tersusun',
        issueSummary: 'Meja belajar berselerak dan menghalang laluan pergerakan di dalam kelas.',
        profesorReaction:
          'Bagus, Ejen! Susunan meja yang tidak teratur menyukarkan pergerakan dan mengurangkan tumpuan belajar.',
      },
      {
        id: 'kelas_sudut',
        label: 'Sudut Pembelajaran Kurang Menarik',
        issueSummary: 'Papan sudut pembelajaran kosong, pudar dan tiada bahan visual terkini.',
        profesorReaction:
          'Benar sekali. Sudut pembelajaran yang ceria mampu merangsang minat dan kreativiti murid.',
      },
      {
        id: 'kelas_bahan',
        label: 'Bahan Pembelajaran Bersepah',
        issueSummary: 'Buku latihan, alat tulis dan kad bacaan bertimbun tanpa label pada rak.',
        profesorReaction:
          'Catatan yang baik! Bahan pembelajaran yang tersusun memudahkan murid mencarinya ketika aktiviti kumpulan.',
      },
    ],
  },
  {
    id: 'perpustakaan',
    name: 'Perpustakaan Ilmu',
    shortName: 'Perpustakaan',
    zoneLabel: 'Zon Timur · Gedung Ilmu',
    briefing:
      'Suasana di perpustakaan agak sunyi tetapi kelihatan tidak terurus. Periksa rak buku dan ruang bacaan.',
    hints: [
      'Tahap 1 (Umum): Perhatikan bagaimana buku disimpan dan bagaimana ruang membaca disediakan untuk murid.',
      'Tahap 2 (Khusus): Semak susunan buku di rak utama, jenis tempat duduk dan sudut bacaan santai di sebelah tingkap.',
      'Tahap 3 (Sorotan Visual): Ikuti penanda berdenyut untuk mengenal pasti baki petunjuk di Perpustakaan Ilmu.',
    ],
    clues: [
      {
        id: 'perpus_buku',
        label: 'Buku Tidak Mengikut Kategori',
        issueSummary: 'Buku cerita, rujukan dan majalah bercampur aduk tanpa label kategori.',
        profesorReaction:
          'Tepat! Apabila buku tidak disusun mengikut kategori, murid mengambil masa yang lama untuk mencari bahan bacaan.',
      },
      {
        id: 'perpus_selesa',
        label: 'Ruang Membaca Kurang Selesa',
        issueSummary: 'Kerusi kayu keras, meja sempit dan pencahayaan sudut membaca agak malap.',
        profesorReaction:
          'Pemerhatian yang teliti. Keselesaan tempat duduk dan pencahayaan yang baik amat penting untuk pembaca.',
      },
      {
        id: 'perpus_sudut',
        label: 'Sudut Bacaan Tidak Dimanfaatkan',
        issueSummary: 'Ruang santai berkarpet dipenuhi kotak lama dan tiada aktiviti galakan membaca.',
        profesorReaction:
          'Betul, Ejen! Sudut bacaan yang lapang dan mesra murid dapat memupuk budaya membaca setiap hari.',
      },
    ],
  },
  {
    id: 'taman',
    name: 'Taman Rekreasi',
    shortName: 'Taman',
    zoneLabel: 'Zon Selatan · Laman Hijau',
    briefing:
      'Taman Rekreasi ialah nadi kehijauan sekolah. Periksa keadaan flora, keceriaan laman dan kemudahan berehat.',
    hints: [
      'Tahap 1 (Umum): Tinjau keadaan pokok bunga, suasana keseluruhan laman dan kemudahan untuk murid duduk.',
      'Tahap 2 (Khusus): Perhatikan batas tumbuhan yang kering, laluan laman yang suram dan ketiadaan tempat duduk.',
      'Tahap 3 (Sorotan Visual): Gunakan sorotan pada lokasi taman untuk mengesan baki petunjuk tersembunyi.',
    ],
    clues: [
      {
        id: 'taman_tumbuhan',
        label: 'Tumbuhan Layu & Kurang Dijaga',
        issueSummary: 'Batas pokok bunga kering dan ditumbuhi rumput liar tanpa penjagaan berkala.',
        profesorReaction:
          'Bagus, Ejen! Tumbuhan yang subur dan terjaga dapat menceriakan suasana serta mendidik murid menghargai alam.',
      },
      {
        id: 'taman_kawasan',
        label: 'Kawasan Rekreasi Kurang Menarik',
        issueSummary: 'Laman kelihatan kosong, berlopak dan tiada papan info herba atau hiasan lanskap.',
        profesorReaction:
          'Pemerhatian yang bernas. Laman yang berinformasi dan menarik boleh dijadikan ruang pembelajaran luar bilik darjah.',
      },
      {
        id: 'taman_duduk',
        label: 'Kekurangan Tempat Duduk',
        issueSummary: 'Tiada bangku yang mencukupi di bawah teduhan pokok untuk murid berehat atau berbincang.',
        profesorReaction:
          'Tepat sekali! Tempat duduk yang selesa membolehkan murid berehat, membaca dan berinteraksi dengan selamat.',
      },
    ],
  },
];

export const LOCATION_MAP: Record<LocationId, LocationDefinition> = LOCATIONS.reduce(
  (acc, loc) => {
    acc[loc.id] = loc;
    return acc;
  },
  {} as Record<LocationId, LocationDefinition>
);

export const LOGIC_CHALLENGES: LogicChallenge[] = [
  {
    id: 'logic_kantin',
    contextTitle: 'Kes 1 · Kebersihan Kantin Ceria',
    opinion:
      'Pada pendapat saya, pihak sekolah perlu menyediakan lebih banyak tong sampah di kantin.',
    options: [
      {
        id: 'A',
        text: 'Murid dapat membuang sampah dengan mudah dan persekitaran kantin menjadi lebih bersih.',
        isRelevant: true,
        explanation:
          'Tepat sekali! Pilihan A ialah alasan yang relevan kerana ia menerangkan kesan langsung dan manfaat daripada tindakan menambah tong sampah.',
      },
      {
        id: 'B',
        text: 'Kantin merupakan tempat murid membeli makanan dan minuman pada waktu rehat.',
        isRelevant: false,
        explanation:
          'Pilihan B hanya menyatakan fakta umum tentang fungsi kantin, bukannya sebab mengapa lebih banyak tong sampah perlu disediakan.',
      },
    ],
  },
  {
    id: 'logic_kelas',
    contextTitle: 'Kes 2 · Susunan & Sudut Kelas Harmoni',
    opinion:
      'Pada pendapat saya, susunan meja di Kelas Harmoni wajar dikemaskan dan sudut pembelajaran perlu diceriakan.',
    options: [
      {
        id: 'A',
        text: 'Kelas Harmoni mempunyai tingkap kaca dan pintu kayu di bahagian hadapan.',
        isRelevant: false,
        explanation:
          'Pilihan A sekadar huraian fizikal bilik darjah dan tidak menyokong pendapat tentang pengemasan meja serta penceriaan sudut pembelajaran.',
      },
      {
        id: 'B',
        text: 'Ruang yang kemas dan ceria melancarkan pergerakan serta meningkatkan tumpuan murid semasa belajar.',
        isRelevant: true,
        explanation:
          'Syabas, Ejen! Pilihan B menghubungkan cadangan penambahbaikan dengan kesannya terhadap keselesaan dan fokus murid.',
      },
    ],
  },
  {
    id: 'logic_taman',
    contextTitle: 'Kes 3 · Laman Taman Rekreasi',
    opinion:
      'Pada pendapat saya, kita wajar menanam semula pokok bunga dan menambah bangku di Taman Rekreasi.',
    options: [
      {
        id: 'A',
        text: 'Kawasan yang hijau dan dilengkapi bangku memberi peluang murid berehat dengan selesa sambil menghargai alam.',
        isRelevant: true,
        explanation:
          'Cemerlang! Pilihan A ialah alasan yang kukuh kerana menyokong terus tujuan penambahbaikan taman rekreasi sekolah.',
      },
      {
        id: 'B',
        text: 'Rumput dan daun pokok di taman berwarna hijau apabila terkena cahaya matahari.',
        isRelevant: false,
        explanation:
          'Pilihan B hanya menyebut warna tumbuhan, tidak menjelaskan mengapa taman perlu dibaik pulih dan ditambah bangku.',
      },
    ],
  },
];

export const OPINION_STARTERS: string[] = [
  'Pada pendapat saya, pihak sekolah perlu ',
  'Saya berpendapat bahawa pihak sekolah wajar ',
  'Bagi mengatasi masalah ini, warga sekolah sepatutnya ',
];

export const FACILITY_ASSETS: FacilityAsset[] = [
  {
    id: 'kantin',
    name: 'Kantin',
    category: 'bangunan',
    description: 'Ruang makan yang bersih, teratur dan mempunyai pengudaraan baik.',
  },
  {
    id: 'bilik_darjah',
    name: 'Bilik Darjah',
    category: 'bangunan',
    description: 'Kelas kondusif dengan meja tersusun dan sudut pembelajaran interaktif.',
  },
  {
    id: 'perpustakaan',
    name: 'Perpustakaan',
    category: 'bangunan',
    description: 'Gedung ilmu berlabel kategori dengan ruang bacaan yang selesa.',
  },
  {
    id: 'taman_herba',
    name: 'Taman Herba',
    category: 'alam',
    description: 'Plot tanaman berinformasi untuk pembelajaran sains dan kelestarian.',
  },
  {
    id: 'taman_permainan',
    name: 'Taman Permainan',
    category: 'kemudahan',
    description: 'Ruang rekreasi ceria dan selamat untuk aktiviti riadah murid.',
  },
  {
    id: 'padang',
    name: 'Padang',
    category: 'kemudahan',
    description: 'Kawasan lapang untuk sukan, perhimpunan luar dan aktiviti kokurikulum.',
  },
  {
    id: 'tong_sampah',
    name: 'Tong Sampah',
    category: 'kemudahan',
    description: 'Tong kitar semula dan sisa makanan yang mencukupi di lokasi strategik.',
  },
  {
    id: 'cuci_tangan',
    name: 'Tempat Mencuci Tangan',
    category: 'kemudahan',
    description: 'Sinki kebersihan berhampiran kantin dan taman untuk amalan hidup sihat.',
  },
  {
    id: 'bangku',
    name: 'Bangku',
    category: 'kemudahan',
    description: 'Tempat duduk selesa di bawah teduhan untuk membaca dan berbincang.',
  },
  {
    id: 'pokok',
    name: 'Pokok',
    category: 'alam',
    description: 'Pokok rendang peneduh yang menyejukkan persekitaran sekolah.',
  },
  {
    id: 'bunga',
    name: 'Bunga',
    category: 'alam',
    description: 'Batas bunga berwarna-warni yang menceriakan laluan dan taman sekolah.',
  },
  {
    id: 'laluan',
    name: 'Laluan Pejalan Kaki',
    category: 'kemudahan',
    description: 'Laluan berbumbung dan selamat yang menghubungkan setiap blok utama.',
  },
];

export const FACILITY_ASSET_MAP: Record<FacilityAssetId, FacilityAsset> = FACILITY_ASSETS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<FacilityAssetId, FacilityAsset>
);

export const DESIGN_ACTIONS: { id: DesignActionType; label: string }[] = [
  { id: 'kekalkan', label: 'Kekalkan' },
  { id: 'ubah_suai', label: 'Ubah Suai' },
  { id: 'gantikan', label: 'Gantikan' },
  { id: 'tambah_baharu', label: 'Tambah Baharu' },
  { id: 'susun_semula', label: 'Susun Semula' },
];

export const GRID_ROWS = 5;
export const GRID_COLS = 8;

export const INITIAL_BLUEPRINT_PLAN: PlacedFacility[] = [
  {
    uid: 'base_kantin',
    assetId: 'kantin',
    row: 0,
    col: 1,
    isOriginal: true,
    actionType: 'ubah_suai',
    linkedLocationId: 'kantin',
  },
  {
    uid: 'base_kelas',
    assetId: 'bilik_darjah',
    row: 0,
    col: 5,
    isOriginal: true,
    actionType: 'ubah_suai',
    linkedLocationId: 'kelas',
  },
  {
    uid: 'base_perpus',
    assetId: 'perpustakaan',
    row: 3,
    col: 5,
    isOriginal: true,
    actionType: 'ubah_suai',
    linkedLocationId: 'perpustakaan',
  },
  {
    uid: 'base_taman',
    assetId: 'taman_herba',
    row: 3,
    col: 1,
    isOriginal: true,
    actionType: 'ubah_suai',
    linkedLocationId: 'taman',
  },
  {
    uid: 'base_laluan_1',
    assetId: 'laluan',
    row: 2,
    col: 2,
    isOriginal: true,
    actionType: 'kekalkan',
  },
  {
    uid: 'base_laluan_2',
    assetId: 'laluan',
    row: 2,
    col: 3,
    isOriginal: true,
    actionType: 'kekalkan',
  },
];

export const BADGES: BadgeDefinition[] = [
  {
    id: 'mata_helang',
    name: 'Mata Helang',
    description: 'Menyelesaikan penyiasatan di kesemua empat lokasi Sekolah Seri Bestari.',
  },
  {
    id: 'penganalisis_kes',
    name: 'Penganalisis Kes',
    description: 'Memilih bukti utama dan membina ayat pendapat dalam Makmal Analisis Kes.',
  },
  {
    id: 'ahli_logik',
    name: 'Ahli Logik',
    description: 'Menguasai cabaran alasan relevan dan menulis hujah penyokong sendiri.',
  },
  {
    id: 'pereka_bestari',
    name: 'Pereka Bestari',
    description: 'Menyusun Pelan Sekolah Impian berserta justifikasi reka bentuk.',
  },
  {
    id: 'arkitek_impian',
    name: 'Arkitek Sekolah Impian',
    description: 'Menyiapkan Laporan Sekolah Impian lengkap pada tahap akhir operasi.',
  },
];
