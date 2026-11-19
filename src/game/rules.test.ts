import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countSentences,
  createInitialGameState,
  getAgentRank,
  getEarnedBadgeIds,
  getOverallProgressPercent,
  getUnlockedPhaseLevel,
  grantMilestoneXp,
  moveFacilityOnGrid,
  placeFacilityOnGrid,
  removeFacilityFromGrid,
  validateAgentIdentity,
  validateEvidenceSelection,
  validateFinalReport,
  validateLocationSave,
  validateLoginInput,
  generateQrMatrix,
} from './rules';
import { LOCATIONS, LOGIC_CHALLENGES } from './data';

test('grantMilestoneXp awards XP only once per milestone', () => {
  const initial = createInitialGameState();
  const first = grantMilestoneXp(initial, 'profile_created', 50);
  assert.equal(first.addedXp, 50);
  assert.equal(first.state.xp, 50);

  const duplicate = grantMilestoneXp(first.state, 'profile_created', 50);
  assert.equal(duplicate.addedXp, 0);
  assert.equal(duplicate.state.xp, 50);
});

test('getAgentRank returns expected ranks by XP and completion', () => {
  assert.equal(getAgentRank(0, false), 'Ejen Pelatih');
  assert.equal(getAgentRank(250, false), 'Ejen Penyiasat');
  assert.equal(getAgentRank(600, false), 'Ejen Pakar');
  assert.equal(getAgentRank(1000, false), 'Arkitek Sekolah Impian');
  assert.equal(getAgentRank(400, true), 'Arkitek Sekolah Impian');
});

test('validateLocationSave requires all clues and substantive notes & proposal', () => {
  const state = createInitialGameState();
  const missingClues = validateLocationSave(state, 'kantin', 'Lantai sangat kotor', 'Tambah tong sampah');
  assert.equal(missingClues.valid, false);

  state.investigations.kantin.discoveredClueIds = LOCATIONS[0].clues.map((c) => c.id);
  const shortNotes = validateLocationSave(state, 'kantin', 'Kotor', 'Tambah tong sampah');
  assert.equal(shortNotes.valid, false);

  const valid = validateLocationSave(
    state,
    'kantin',
    'Banyak sampah bertaburan di lantai kantin selepas rehat.',
    'Sediakan lebih banyak tong sampah berlabel di setiap sudut.'
  );
  assert.equal(valid.valid, true);
});

test('validateEvidenceSelection enforces 2 to 3 selections', () => {
  assert.equal(validateEvidenceSelection(['kantin']).valid, false);
  assert.equal(validateEvidenceSelection(['kantin', 'kelas']).valid, true);
  assert.equal(validateEvidenceSelection(['kantin', 'kelas', 'taman']).valid, true);
  assert.equal(
    validateEvidenceSelection(['kantin', 'kelas', 'perpustakaan', 'taman']).valid,
    false
  );
});

test('countSentences and validateFinalReport enforce 3 to 5 sentences', () => {
  assert.equal(countSentences('Ayat pertama. Ayat kedua.'), 2);
  assert.equal(
    countSentences(
      'Kantin sekolah perlu dibersihkan setiap masa. Pihak sekolah wajar menambah tong sampah kitar semula. Murid akan lebih selesa makan di kawasan yang bersih! Taman rekreasi juga patut ditanam pokok bunga.'
    ),
    4
  );

  const tooShort = validateFinalReport('Sekolah perlu bersih. Murid akan gembira.');
  assert.equal(tooShort.valid, false);
  assert.equal(tooShort.sentenceCount, 2);

  const validReport = validateFinalReport(
    'Pada pendapat saya, pihak sekolah perlu menambah tong sampah di Kantin Ceria. Hal ini membolehkan murid membuang sisa dengan mudah supaya persekitaran sentiasa bersih. Selain itu, Taman Rekreasi patut dilengkapi bangku dan pokok bunga yang terjaga agar murid dapat berehat dengan selesa.'
  );
  assert.equal(validReport.valid, true);
  assert.equal(validReport.sentenceCount, 3);
});

test('phase progression and badges unlock sequentially as milestones are completed', () => {
  let state = createInitialGameState();
  assert.equal(getUnlockedPhaseLevel(state), 1);
  assert.deepEqual(getEarnedBadgeIds(state), []);

  // Complete all 4 locations
  for (const loc of LOCATIONS) {
    state.investigations[loc.id].discoveredClueIds = loc.clues.map((c) => c.id);
    state.investigations[loc.id].notes = 'Pemerhatian lengkap telah direkodkan.';
    state.investigations[loc.id].initialProposal = 'Cadangan penambahbaikan awal disediakan.';
    state.investigations[loc.id].completed = true;
  }
  assert.equal(getUnlockedPhaseLevel(state), 2);
  assert.deepEqual(getEarnedBadgeIds(state), ['mata_helang']);

  // Complete Phase 2
  state.selectedEvidenceIds = ['kantin', 'taman'];
  state.opinions.kantin.opinionText = 'Pada pendapat saya, pihak sekolah perlu menambah tong sampah di kantin.';
  state.opinions.taman.opinionText = 'Saya berpendapat Taman Rekreasi perlu ditanam semula dengan pokok bunga.';
  assert.equal(getUnlockedPhaseLevel(state), 3);
  assert.ok(getEarnedBadgeIds(state).includes('penganalisis_kes'));

  // Complete Phase 3
  for (const ch of LOGIC_CHALLENGES) {
    const relevant = ch.options.find((o) => o.isRelevant)!;
    state.logicChallengeAnswers[ch.id] = relevant.id;
  }
  state.opinions.kantin.reasonText = 'Supaya sampah tidak bertaburan dan murid lebih selesa makan.';
  state.opinions.taman.reasonText = 'Kerana taman yang hijau menenangkan fikiran murid semasa berehat.';
  assert.equal(getUnlockedPhaseLevel(state), 4);
  assert.ok(getEarnedBadgeIds(state).includes('ahli_logik'));

  // Complete Phase 4
  state.builderPlan[0].justification = 'Menambah tong sampah di zon kantin berdasarkan bukti siasatan.';
  state.builderPlan[1].justification = 'Menyusun semula meja Kelas Harmoni supaya laluan lebih lapang.';
  state.builderSaved = true;
  assert.equal(getUnlockedPhaseLevel(state), 5);
  assert.ok(getEarnedBadgeIds(state).includes('pereka_bestari'));

  // Complete Phase 5
  state.finalReportSaved = true;
  assert.ok(getEarnedBadgeIds(state).includes('arkitek_impian'));
  assert.equal(getOverallProgressPercent(state), 100);
});

test('School Builder grid placement, swap/move, and removal work cleanly', () => {
  let plan = createInitialGameState().builderPlan;
  const initialCount = plan.length;

  plan = placeFacilityOnGrid(plan, 'tong_sampah', 1, 1, 'new_bin_1');
  assert.equal(plan.length, initialCount + 1);
  assert.equal(plan.find((p) => p.uid === 'new_bin_1')?.row, 1);

  plan = moveFacilityOnGrid(plan, 'new_bin_1', 2, 4);
  assert.equal(plan.find((p) => p.uid === 'new_bin_1')?.row, 2);
  assert.equal(plan.find((p) => p.uid === 'new_bin_1')?.col, 4);

  plan = removeFacilityFromGrid(plan, 'new_bin_1');
  assert.equal(plan.length, initialCount);
});

test('validateLoginInput and validateAgentIdentity enforce required agent fields', () => {
  assert.equal(validateLoginInput('ab', '1234').valid, false);
  assert.equal(validateLoginInput('ejen.bestari', '12').valid, false);
  assert.equal(validateLoginInput('ejen.bestari', 'Bestari#2026').valid, true);

  assert.equal(validateAgentIdentity('A', '5 Bestari', 'Helang Bestari').valid, false);
  assert.equal(validateAgentIdentity('Nurin Maisarah', '', 'Helang Bestari').valid, false);
  assert.equal(validateAgentIdentity('Nurin Maisarah', '6 Bestari', 'Suka Hati').valid, false);
  assert.equal(validateAgentIdentity('Nurin Maisarah', '6 Bestari', 'Kanta Ilmu').valid, true);
});

test('generateQrMatrix produces deterministic 21x21 QR grid with intact finder corners', () => {
  const m1 = generateQrMatrix('SB-26-1024|Nurin Maisarah');
  const m2 = generateQrMatrix('SB-26-1024|Nurin Maisarah');
  const m3 = generateQrMatrix('SB-26-9999|Ejen Hakim');

  assert.equal(m1.length, 21);
  assert.equal(m1[0].length, 21);
  assert.deepEqual(m1, m2);
  assert.notDeepEqual(m1, m3);
  // Top-left finder corners filled
  assert.equal(m1[0][0], true);
  assert.equal(m1[3][3], true);
  assert.equal(m1[1][1], false);
});
