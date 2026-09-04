import { Predikat, TujuanPembelajaran } from '../types';

export function calculateGrade(
  lmScores: number[],
  sasScore: number,
  lmWeightPercent: number = 60,
  sasWeightPercent: number = 40,
  kkmThreshold: number = 75
): {
  rataRataLM: number;
  nilaiAkhir: number;
  predikat: Predikat;
} {
  const validLm = lmScores.filter((s) => typeof s === 'number' && !isNaN(s) && s >= 0);
  const rataRataLM = validLm.length > 0 ? Math.round(validLm.reduce((a, b) => a + b, 0) / validLm.length) : 0;
  const validSas = typeof sasScore === 'number' && !isNaN(sasScore) && sasScore >= 0 ? sasScore : 0;
  
  // Total weight normalization
  const totalWeight = (lmWeightPercent + sasWeightPercent) || 100;
  const normalizedLmWeight = lmWeightPercent / totalWeight;
  const normalizedSasWeight = sasWeightPercent / totalWeight;

  const nilaiAkhir = Math.round((rataRataLM * normalizedLmWeight) + (validSas * normalizedSasWeight));
  
  let predikat: Predikat = 'Perlu Bimbingan';
  if (nilaiAkhir >= 86) {
    predikat = 'Sangat Baik';
  } else if (nilaiAkhir >= kkmThreshold) {
    predikat = 'Baik';
  } else if (nilaiAkhir >= Math.max(50, kkmThreshold - 15)) {
    predikat = 'Cukup';
  } else {
    predikat = 'Perlu Bimbingan';
  }

  return {
    rataRataLM,
    nilaiAkhir,
    predikat,
  };
}

export function findExtremeTPs(
  lmItems: { tpId: string; tpDescription: string; score: number }[]
): {
  highest?: { id: string; desc: string; score: number };
  lowest?: { id: string; desc: string; score: number };
} {
  if (!lmItems || lmItems.length === 0) return {};

  const sorted = [...lmItems].sort((a, b) => b.score - a.score);
  const highest = sorted[0] ? { id: sorted[0].tpId, desc: sorted[0].tpDescription, score: sorted[0].score } : undefined;
  const lowest = sorted[sorted.length - 1] ? { id: sorted[sorted.length - 1].tpId, desc: sorted[sorted.length - 1].tpDescription, score: sorted[sorted.length - 1].score } : undefined;

  return { highest, lowest };
}

export function generateDefaultNarasi(
  studentName: string,
  highestDesc?: string,
  lowestDesc?: string
): string {
  const name = studentName.trim();
  const high = highestDesc ? highestDesc.trim().replace(/\.$/, '') : '';
  const low = lowestDesc ? lowestDesc.trim().replace(/\.$/, '') : '';

  if (high && low && high !== low) {
    return `Ananda ${name} menunjukkan penguasaan yang sangat baik dalam ${high.toLowerCase()}. Perlu peningkatan dan bimbingan lanjutan pada materi ${low.toLowerCase()}.`;
  } else if (high) {
    return `Ananda ${name} menunjukkan penguasaan yang sangat baik dan konsisten dalam ${high.toLowerCase()}. Pertahankan capaian belajar yang optimal ini.`;
  } else if (low) {
    return `Ananda ${name} telah mengikuti seluruh proses pembelajaran dengan aktif dan memerlukan bimbingan terpadu pada materi ${low.toLowerCase()}.`;
  }
  return `Ananda ${name} menunjukkan ketercapaian kompetensi pembelajaran yang baik dan berpartisipasi positif selama kegiatan belajar mengajar.`;
}
