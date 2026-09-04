import React from 'react';
import { HelpCircle, CheckCircle2, Award, BookOpen, Calculator, Sparkles } from 'lucide-react';

export const KomparasiKurikulumView: React.FC = () => {
  return (
    <div className="space-y-6" id="komparasi-kurikulum-container">
      {/* Top Banner */}
      <div className="bg-[#4F46E5] text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 relative overflow-hidden">
        <div className="space-y-2 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-black" />
            <span>Modul E-Rapor & Panduan Penilaian Kelas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Paradigma & Komparasi Penilaian Kurikulum Merdeka
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
            Perbandingan mendasar antara Kurikulum 2013 (K-13) dan Kurikulum Merdeka Sekolah Dasar serta panduan integrasi asesmen formatif dan sumatif.
          </p>
        </div>
      </div>

      {/* Comparison Table from PDF Page 6 */}
      <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-black text-gray-900 text-base sm:text-lg">
            Komparasi Komponen Penilaian Rapor (PDF Halaman 6)
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Perubahan paradigma evaluasi pembelajaran menuju asesmen yang bermakna
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-indigo-50/70 text-indigo-950 font-black uppercase text-xs">
              <tr>
                <th className="p-4 w-1/4">Komponen Penilaian</th>
                <th className="p-4 w-3/8 bg-gray-100 text-gray-800">Kurikulum Sebelumnya (K-13)</th>
                <th className="p-4 w-3/8 bg-teal-50 text-teal-950">Kurikulum Merdeka (Sistem Baru)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="p-4 font-bold text-gray-900">Bentuk Nilai</td>
                <td className="p-4 text-gray-600 bg-gray-50/40 font-medium">
                  Angka kuantitatif mutlak (Skala 0–100) murni dengan predikat huruf A/B/C/D.
                </td>
                <td className="p-4 font-bold text-teal-900 bg-teal-50/40">
                  Kombinasi Nilai Angka & Deskripsi Kualitatif Kompetensi (Narasi 2 Kalimat Positif).
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-900">Cakupan Evaluasi</td>
                <td className="p-4 text-gray-600 bg-gray-50/40 font-medium">
                  Ulangan Harian, UTS, UAS berbasis kognitif ketat terpisah per aspek sikap, pengetahuan, keterampilan.
                </td>
                <td className="p-4 font-bold text-teal-900 bg-teal-50/40">
                  Formatif berkelanjutan (as/for learning) & Sumatif Lingkup Materi / Akhir Semester.
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-900">Pencapaian Siswa</td>
                <td className="p-4 text-gray-600 bg-gray-50/40 font-medium">
                  Berdasarkan Kriteria Ketuntasan Minimal (KKM tunggal kaku angka).
                </td>
                <td className="p-4 font-bold text-teal-900 bg-teal-50/40">
                  Berdasarkan Ketercapaian Tujuan Pembelajaran (KTP) per fase (Fase A, B, atau C).
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-gray-900">Rumus Penilaian Akhir</td>
                <td className="p-4 text-gray-600 bg-gray-50/40 font-medium">
                  Pembobotan beragam (2 UH + 1 UTS + 1 UAS) / 4.
                </td>
                <td className="p-4 font-black text-teal-900 bg-teal-50/40 font-mono text-xs">
                  NA = (Rata-rata Sumatif LM × 60%) + (Nilai SAS × 40%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Paradigm Deep Dive from PDF Page 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Asesmen Formatif */}
        <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">Asesmen Formatif</h3>
              <p className="text-xs text-gray-400 font-medium">Memantau kemajuan belajar berkala</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Dilakukan di dalam proses pembelajaran untuk memantau kemajuan belajar peserta didik secara berkala dan tidak dimasukkan ke dalam penentu angka kenaikan rapor.
          </p>
          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 block mb-0.5 font-black">• Assessment as Learning:</strong>
              <span className="text-gray-600 font-medium">Penilaian sebagai proses belajar (refleksi mandiri & penilaian antarteman).</span>
            </div>
            <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <strong className="text-indigo-900 block mb-0.5 font-black">• Assessment for Learning:</strong>
              <span className="text-gray-600 font-medium">Penilaian untuk perbaikan pembelajaran berkelanjutan oleh guru.</span>
            </div>
          </div>
        </div>

        {/* Asesmen Sumatif */}
        <div className="bg-white rounded-[32px] border-2 border-indigo-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base">Asesmen Sumatif</h3>
              <p className="text-xs text-gray-400 font-medium">Ketercapaian TP di akhir materi/semester</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed font-medium">
            Dilakukan untuk memastikan ketercapaian Tujuan Pembelajaran (TP) pada akhir lingkup materi atau akhir semester.
          </p>
          <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
              <strong className="text-teal-900 block mb-0.5 font-black">• Sumatif Lingkup Materi (LM):</strong>
              <span className="text-gray-600 font-medium">Evaluasi per Bab / Unit Kompetensi dasar (Bobot 60%).</span>
            </div>
            <div className="p-3 bg-teal-50/60 rounded-2xl border border-teal-100">
              <strong className="text-teal-900 block mb-0.5 font-black">• Sumatif Akhir Semester (SAS):</strong>
              <span className="text-gray-600 font-medium">Evaluasi komprehensif penentu kenaikan kelas/fase (Bobot 40%).</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
