import React, { useState, useEffect, useMemo } from 'react';
import {
  Student,
  RaporSiswaDetail,
  ClassLevel,
  OgomojoloAttendanceRecord,
  SchoolProfile,
  TeacherAccount,
} from '../types';
import {
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowDownToLine,
  UploadCloud,
  Layers,
  Database,
  UserCheck,
  ShieldCheck,
  Info,
  Trash2,
  Users,
  Search,
  Check,
  Printer,
  FileSpreadsheet,
  ArrowRight,
  X,
  Copy,
} from 'lucide-react';
import {
  fetchOgomojoloAttendanceRecords,
  pushBatchOgomojoloAttendance,
  syncOgomojoloToRaporDetails,
  syncAllOgomojoloData,
  parseGradeLevel,
  OGOMOJOLO_COLLECTION_NAME,
} from '../utils/firebase';

interface TarikDataSiswaViewProps {
  students: Student[];
  raporDetails: Record<string, RaporSiswaDetail>;
  activeClassLevel: ClassLevel;
  schoolProfile: SchoolProfile;
  currentUser?: TeacherAccount | null;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onRegisterStudentsFromOgomojolo?: (newStudents: Student[], newRaporDetails: Record<string, RaporSiswaDetail>) => void;
  onSyncAllFromOgomojolo?: (updatedStudents: Student[], updatedRaporDetails: Record<string, RaporSiswaDetail>, newStudentsAdded: Student[]) => void;
  onClearAllDummyData?: () => void;
  onNavigateToCetakRapor?: () => void;
  onNavigateToImporNilai?: () => void;
}

export const TarikDataSiswaView: React.FC<TarikDataSiswaViewProps> = ({
  students,
  raporDetails,
  activeClassLevel,
  schoolProfile,
  currentUser,
  onSelectClassLevel,
  onRegisterStudentsFromOgomojolo,
  onSyncAllFromOgomojolo,
  onClearAllDummyData,
  onNavigateToCetakRapor,
  onNavigateToImporNilai,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [records, setRecords] = useState<OgomojoloAttendanceRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [selectedSyncScope, setSelectedSyncScope] = useState<ClassLevel | 'Semua Kelas'>('Semua Kelas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPromptGuide, setShowPromptGuide] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const classTabs: Array<{ id: ClassLevel | 'Semua Kelas'; label: string }> = [
    { id: 'Semua Kelas', label: 'Semua Kelas' },
    { id: 'Kelas 1', label: 'Kelas 1' },
    { id: 'Kelas 2', label: 'Kelas 2' },
    { id: 'Kelas 3', label: 'Kelas 3' },
    { id: 'Kelas 4', label: 'Kelas 4' },
    { id: 'Kelas 5', label: 'Kelas 5' },
    { id: 'Kelas 6', label: 'Kelas 6' },
  ];

  // Count cloud records per class
  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua Kelas': records.length,
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
      'Kelas 6': 0,
    };
    records.forEach((r) => {
      const gl = parseGradeLevel(r.kelas);
      counts[gl] = (counts[gl] || 0) + 1;
    });
    return counts;
  }, [records]);

  // Count local existing students per class
  const localClassCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Semua Kelas': students.length,
      'Kelas 1': 0,
      'Kelas 2': 0,
      'Kelas 3': 0,
      'Kelas 4': 0,
      'Kelas 5': 0,
      'Kelas 6': 0,
    };
    students.forEach((s) => {
      const gl = (s.gradeLevel as ClassLevel) || 'Kelas 4';
      if (counts[gl] !== undefined) {
        counts[gl]++;
      }
    });
    return counts;
  }, [students]);

  // Filter records by selected scope and search query
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedSyncScope !== 'Semua Kelas') {
        const gl = parseGradeLevel(r.kelas);
        if (gl !== selectedSyncScope) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.namaSiswa?.toLowerCase().includes(q);
        const matchNisn = r.nisn?.toLowerCase().includes(q);
        const matchNis = r.nis?.toLowerCase().includes(q);
        return matchName || matchNisn || matchNis;
      }
      return true;
    });
  }, [records, selectedSyncScope, searchQuery]);

  // Matching statistics for filtered records
  const matchingStats = useMemo(() => {
    return filteredRecords.reduce(
      (acc, r) => {
        const match = students.some(
          (s) =>
            (s.nisn && s.nisn.trim() === r.nisn.trim()) ||
            (s.nis && r.nis && s.nis.trim() === r.nis.trim()) ||
            s.name.trim().toLowerCase() === r.namaSiswa.trim().toLowerCase()
        );
        if (match) acc.matched++;
        else acc.unmatched++;
        return acc;
      },
      { matched: 0, unmatched: 0 }
    );
  }, [filteredRecords, students]);

  // Fetch Cloud Records
  const loadRecords = async (silent = false) => {
    if (!silent) setIsLoading(true);
    setStatusMessage(null);
    try {
      const data = await fetchOgomojoloAttendanceRecords();
      setRecords(data);
      if (!silent) {
        if (data.length === 0) {
          setStatusMessage({
            text: `Koleksi '${OGOMOJOLO_COLLECTION_NAME}' terhubung namun masih belum memiliki data siswa. Gunakan tombol 'Kirim Data Simulasi (132 Siswa)' di bawah untuk mengisi data contoh.`,
            type: 'info',
          });
        } else {
          setStatusMessage({
            text: `Berhasil memuat ${data.length} data profil siswa lengkap dan absensi dari Firestore.`,
            type: 'success',
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching records:', err);
      if (!silent) {
        setStatusMessage({
          text: `Gagal membaca koleksi: ${err.message || 'Periksa koneksi internet'}`,
          type: 'error',
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(true);
  }, []);

  // Primary Action: Pull All Students and Attendance
  const handleSyncAllStudentsAndAttendance = (targetScope: ClassLevel | 'Semua Kelas' = selectedSyncScope) => {
    if (records.length === 0) {
      setStatusMessage({ text: 'Tidak ada data siswa atau kehadiran di Cloud yang dapat disinkronkan.', type: 'error' });
      return;
    }

    const {
      updatedStudents,
      updatedRaporDetails,
      newStudents,
      updatedExistingCount,
      newStudentsCount,
      totalCount,
      syncedStudentNames,
    } = syncAllOgomojoloData(records, students, raporDetails, targetScope);

    if (totalCount === 0) {
      setStatusMessage({
        text: `Tidak ditemukan data siswa untuk ${targetScope} di koleksi Cloud.`,
        type: 'error',
      });
      return;
    }

    if (onSyncAllFromOgomojolo) {
      onSyncAllFromOgomojolo(updatedStudents, updatedRaporDetails, newStudents);
    } else if (onRegisterStudentsFromOgomojolo) {
      onRegisterStudentsFromOgomojolo(updatedStudents, updatedRaporDetails);
    }

    const namesSample = syncedStudentNames.slice(0, 3).join(', ') + (syncedStudentNames.length > 3 ? ` dan ${syncedStudentNames.length - 3} lainnya` : '');
    const scopeLabel = targetScope === 'Semua Kelas' ? 'Semua Kelas (Kelas 1 - 6)' : targetScope;

    setStatusMessage({
      text: `Alhamdulillah! Berhasil menyalin ${totalCount} data siswa lengkap untuk ${scopeLabel} (${newStudentsCount} siswa baru ditambahkan ke Data Siswa, ${updatedExistingCount} profil siswa & kehadiran diselaraskan). Contoh: ${namesSample}.`,
      type: 'success',
    });
  };

  // Seed sample records (132 students across all 6 classes)
  const handleSeedSampleCloudData = async () => {
    setIsSimulating(true);
    setStatusMessage(null);
    try {
      const sampleNamesByClass: Record<ClassLevel, string[]> = {
        'Kelas 1': [
          'Alifah Khairunnisa', 'Bilal Arkananta', 'Chandra Kirana', 'Dafian Maulana',
          'Elisa Ramadhani', 'Fathan Alghifari', 'Ghina Salsabila', 'Hafizh Pratama',
          'Irfan Setiawan', 'Jihan Talita', 'Keanu Rafandra', 'Lathifah Az-Zahra',
          'Mikael Jonathan', 'Nadia Syakirah', 'Oktavian Saputra', 'Putri Ayu Wandira',
          'Qori Nur Fatimah', 'Rizky Febriansyah', 'Siti Maryam', 'Taufiq Hidayat',
          'Umar Faruq', 'Zahra Amelia'
        ],
        'Kelas 2': [
          'Adnan Wijaya', 'Bunga Citra', 'Cakra Buana', 'Dini Anggraeni',
          'Eka Prasetya', 'Farhan Ramadhan', 'Gita Gutawa', 'Hanif Alamsyah',
          'Intan Permata', 'Julian Firmansyah', 'Karin Novilda', 'Luqman Hakim',
          'Maya Estianty', 'Naufal Abiyyu', 'Olivia Zalianty', 'Panji Gumilang',
          'Qomaruddin', 'Raden Mas Said', 'Salsabila Zahra', 'Tegar Septian',
          'Utami Suryaningsih', 'Zidan Zidane'
        ],
        'Kelas 3': [
          'Arkananta Putra', 'Bella Saphira', 'Cahya Kamila', 'Danial Assegaf',
          'Emir Mahira', 'Fiona Callahan', 'Gilang Dirga', 'Hany Budiarti',
          'Ihsan Tarore', 'Jessica Iskandar', 'Kiki Fatmala', 'Lesti Andryani',
          'Maudy Ayunda', 'Nicholas Saputra', 'Olla Ramlan', 'Pevita Pearce',
          'Quentin Stanislavski', 'Raffi Ahmad', 'Syahrini Fatimah', 'Titi Kamal',
          'Usman Harun', 'Zaskia Gotik'
        ],
        'Kelas 4': [
          'Ahmad Fauzan Pratama', 'Aisyah Putri Rahmadani', 'Bima Sakti Nugroho', 'Cantika Dewi Lestari',
          'Dimas Aditya Pratama', 'Fajar Ramadhan', 'Gita Permata Sari', 'Hafiz Al-Fathir',
          'Indah Cahyani', 'Joko Susilo', 'Kartika Sari', 'Lukman Hakim',
          'Maulana Malik', 'Nabila Syakieb', 'Oki Setiana', 'Putra Siregar',
          'Qonita Lutfia', 'Reza Rahadian', 'Siti Nurhaliza', 'Teuku Wisnu',
          'Ulya Salsabila', 'Vino Bastian'
        ],
        'Kelas 5': [
          'Agus Salim', 'Baharuddin Lopa', 'Cut Nyak Dien', 'Dewi Sartika',
          'Emil Salim', 'Fatmawati Soekarno', 'Gatot Soebroto', 'Hasanuddin Sultan',
          'I Gusti Ngurah Rai', 'Juanda Kartawidjaja', 'Ki Hajar Dewantara', 'Mohammad Hatta',
          'Natsir Mohammad', 'Oto Iskandar Di Nata', 'Pangeran Diponegoro', 'Raden Ajeng Kartini',
          'Soedirman Jenderal', 'Teuku Umar', 'Untung Suropati', 'Wahid Hasyim',
          'Yos Sudarso', 'Zainal Mustafa'
        ],
        'Kelas 6': [
          'Abdurrahman Wahid', 'B.J. Habibie', 'Chairil Anwar', 'Djamaluddin Adinegoro',
          'Ernest Douwes Dekker', 'Frans Kaisiepo', 'Hamka Buya', 'Idham Chalid',
          'Johannes Leimena', 'Kasman Singodimedjo', 'La Maddukelleng', 'Maria Walanda Maramis',
          'Nani Wartabone', 'Pattimura Kapitan', 'R.E. Martadinata', 'Sutan Sjahrir',
          'Tan Malaka', 'Usmar Ismail', 'Wage Rudolf Supratman', 'Yamin Mohammad',
          'Zainul Arifin', 'A.H. Nasution'
        ],
      };

      const generatedRecords: OgomojoloAttendanceRecord[] = [];
      const levels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

      levels.forEach((lvl, lvlIdx) => {
        const names = sampleNamesByClass[lvl] || [];
        names.forEach((nama, nameIdx) => {
          const nisnNum = 180000000 + (lvlIdx + 1) * 1000 + (nameIdx + 1);
          const nisNum = 24000 + (lvlIdx + 1) * 100 + (nameIdx + 1);
          const isFemale = nameIdx % 2 === 1;
          const s = Math.floor(Math.random() * 3);
          const i = Math.floor(Math.random() * 2);
          const a = Math.random() > 0.85 ? 1 : 0;

          generatedRecords.push({
            nisn: String(nisnNum),
            nis: String(nisNum),
            namaSiswa: nama,
            kelas: lvl,
            gender: isFemale ? 'P' : 'L',
            jenisKelamin: isFemale ? 'P' : 'L',
            parentName: `Orang Tua Ananda ${nama.split(' ')[0]}`,
            parentPhone: `62812${Math.floor(10000000 + Math.random() * 90000000)}`,
            address: `Jl. Pendidikan No. ${nameIdx + 1}, Kec. Ogomojolo`,
            sakit: s,
            izin: i,
            tanpaKeterangan: a,
            semester: 1,
            tahunAjaran: schoolProfile.academicYear || '2024/2025',
          });
        });
      });

      await pushBatchOgomojoloAttendance(generatedRecords);
      setRecords(generatedRecords);
      setStatusMessage({
        text: `Alhamdulillah! Berhasil mengunggah ${generatedRecords.length} data siswa lengkap (Kelas 1 s/d Kelas 6) ke Firestore. Klik tombol 'Salin Seluruh Siswa Semua Kelas Sekaligus' di bawah untuk memasukkan semuanya ke e-Rapor!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error seeding data:', err);
      setStatusMessage({
        text: `Gagal mengunggah data simulasi: ${err.message}`,
        type: 'error',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const copyPromptText = () => {
    const prompt = `Silakan kirimkan seluruh data siswa SD (Kelas 1 s/d 6) beserta rekap presensinya ke koleksi Firestore '${OGOMOJOLO_COLLECTION_NAME}' dengan format:
{
  nisn: string,
  nis: string,
  namaSiswa: string,
  kelas: "Kelas 1" | "Kelas 2" | "Kelas 3" | "Kelas 4" | "Kelas 5" | "Kelas 6",
  gender: "L" | "P",
  parentName: string,
  parentPhone: string,
  address: string,
  sakit: number,
  izin: number,
  tanpaKeterangan: number
}`;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="space-y-6" id="tarik-data-siswa-view">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-emerald-700/20 border-2 border-emerald-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wider shadow-xs">
              <UserCheck className="w-3.5 h-3.5 text-slate-950" />
              <span>Otomatisasi Data Siswa & Presensi</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tarik Data Siswa dari Cloud Firestore (SDK Ogomojolo)
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm font-medium leading-relaxed">
              Tarik seluruh profil biodata siswa (NISN, NIS, nama lengkap, jenis kelamin, nama orang tua, alamat) dan rekap absensi (Sakit, Izin, Alpa) untuk <strong>Kelas 1 s/d Kelas 6</strong> secara serentak ke dalam sistem e-Rapor dengan satu klik.
            </p>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap gap-2.5 shrink-0">
            {onNavigateToImporNilai && (
              <button
                type="button"
                onClick={onNavigateToImporNilai}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm border border-white/30 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-yellow-300" />
                <span>Impor Nilai Mapel</span>
              </button>
            )}

            {onNavigateToCetakRapor && (
              <button
                type="button"
                onClick={onNavigateToCetakRapor}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Cetak E-Rapor PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-emerald-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total di Cloud</span>
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {records.length} <span className="text-xs font-normal text-slate-500">siswa</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            Koleksi '{OGOMOJOLO_COLLECTION_NAME}'
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Terdaftar di e-Rapor</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {students.length} <span className="text-xs font-normal text-slate-500">siswa</span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
            Master Data Aktif
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-amber-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Filter Terpilih</span>
            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1 truncate">
            {selectedSyncScope}
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
            {filteredRecords.length} siswa ditemukan
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border-2 border-teal-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Siswa Siap Disalin</span>
            <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {matchingStats.unmatched} <span className="text-xs font-normal text-slate-500">baru</span>
          </div>
          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
            {matchingStats.matched} sudah cocok di sistem
          </p>
        </div>
      </div>

      {/* Notification / Status Message */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border-2 text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal to Clear Dummy Data */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 border-2 border-rose-300 dark:border-rose-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 dark:bg-rose-950 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">Kosongkan Data Siswa Lokal?</h3>
                <p className="text-xs text-slate-500">Tindakan ini akan menghapus siswa lokal saat ini.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Semua data siswa lokal (termasuk nilai lama) akan dibersihkan dari memori peramban Anda. Setelah itu, Anda dapat menarik seluruh data siswa segar dari Cloud secara bersih.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClearConfirm(false);
                  if (onClearAllDummyData) onClearAllDummyData();
                  setStatusMessage({
                    text: 'Data siswa lokal berhasil dibersihkan. Silakan klik tombol "Salin Seluruh Siswa Semua Kelas Sekaligus" untuk mengisi data baru dari Cloud.',
                    type: 'info',
                  });
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition cursor-pointer"
              >
                Ya, Bersihkan Data Lokal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Action & Filter Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border-2 border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {/* Action Buttons Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => loadRecords(false)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>Muat Ulang dari Cloud</span>
            </button>

            <button
              type="button"
              onClick={handleSeedSampleCloudData}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold text-xs transition cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSimulating ? 'Mengunggah...' : 'Kirim Data Simulasi (132 Siswa)'}</span>
            </button>

            {onClearAllDummyData && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-bold text-xs transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset Data Lokal</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPromptGuide(!showPromptGuide)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Format Schema Cloud</span>
            </button>
          </div>

          {/* Prominent Pull / Sync Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {selectedSyncScope !== 'Semua Kelas' && (
              <button
                type="button"
                onClick={() => handleSyncAllStudentsAndAttendance(selectedSyncScope)}
                disabled={filteredRecords.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Users className="w-4 h-4" />
                <span>Salin {selectedSyncScope} ({filteredRecords.length} Siswa)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSyncAllStudentsAndAttendance('Semua Kelas')}
              disabled={records.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4 text-emerald-200" />
              <span>Salin Seluruh Siswa Semua Kelas (1-6) Sekaligus ({records.length} Siswa)</span>
            </button>
          </div>
        </div>

        {/* Developer / Schema Guide Collapsible */}
        {showPromptGuide && (
          <div className="p-4 bg-indigo-50 dark:bg-slate-800/80 rounded-2xl border border-indigo-200 dark:border-slate-700 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Schema Firestore Koleksi: '{OGOMOJOLO_COLLECTION_NAME}'</span>
              </span>
              <button
                type="button"
                onClick={copyPromptText}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-700 rounded-lg text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 cursor-pointer border border-indigo-200"
              >
                {copiedPrompt ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPrompt ? 'Tersalin!' : 'Salin Petunjuk Schema'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Setiap dokumen di dalam koleksi ini dapat memuat field: <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">nisn</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">nis</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">namaSiswa</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">kelas</code> ('Kelas 1' s/d 'Kelas 6'), <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">gender</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">parentName</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">parentPhone</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">address</code>, serta <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">sakit</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">izin</code>, <code className="font-mono bg-white dark:bg-slate-900 px-1 py-0.5 rounded">tanpaKeterangan</code>.
            </p>
          </div>
        )}

        {/* Class Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Class Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {classTabs.map((tab) => {
              const isSelected = selectedSyncScope === tab.id;
              const count = classCounts[tab.id] || 0;
              const localCount = localClassCounts[tab.id] || 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedSyncScope(tab.id);
                    if (tab.id !== 'Semua Kelas' && onSelectClassLevel) {
                      onSelectClassLevel(tab.id);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs font-black'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    }`}
                    title={`${count} di Cloud • ${localCount} di e-Rapor`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama / NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-6 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-52 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-header status text */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            Menampilkan: <strong>{filteredRecords.length} siswa</strong> untuk <strong>{selectedSyncScope}</strong>
          </span>
          <span>
            Sudah di e-Rapor: <strong>{matchingStats.matched}</strong> • Siswa baru akan ditarik: <strong>{matchingStats.unmatched}</strong>
          </span>
        </div>

        {/* Scrollable Table of Cloud Students */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700 z-10">
                <tr>
                  <th className="p-2.5 pl-4">No</th>
                  <th className="p-2.5">NISN / NIS</th>
                  <th className="p-2.5">Nama Siswa & JK</th>
                  <th className="p-2.5">Kelas Terbaca</th>
                  <th className="p-2.5">Orang Tua & Alamat</th>
                  <th className="p-2.5 text-center">Sakit</th>
                  <th className="p-2.5 text-center">Izin</th>
                  <th className="p-2.5 text-center">Alpa</th>
                  <th className="p-2.5 pr-4 text-center">Status e-Rapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-slate-400">
                      <Layers className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="font-bold text-slate-600 dark:text-slate-400 text-sm">
                        Tidak ada data siswa untuk filter "{selectedSyncScope}"
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {records.length === 0
                          ? "Koleksi Firestore masih kosong. Gunakan tombol 'Kirim Data Simulasi (132 Siswa)' di atas."
                          : searchQuery
                          ? `Tidak ditemukan siswa yang cocok dengan kata kunci "${searchQuery}".`
                          : "Pilih tab kelas lain atau klik 'Semua Kelas'."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, i) => {
                    const existingStudent = students.find(
                      (s) =>
                        (s.nisn && s.nisn.trim() === r.nisn.trim()) ||
                        (s.nis && r.nis && s.nis.trim() === r.nis.trim()) ||
                        s.name.trim().toLowerCase() === r.namaSiswa.trim().toLowerCase()
                    );
                    const isMatch = Boolean(existingStudent);
                    const resolvedGrade = parseGradeLevel(r.kelas);
                    const genderShort = r.gender === 'P' || r.jenisKelamin === 'P' ? 'P' : 'L';

                    return (
                      <tr
                        key={r.id || `${r.nisn}-${i}`}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                          isMatch ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                        }`}
                      >
                        <td className="p-2.5 pl-4 text-slate-400 font-mono text-[11px]">
                          {i + 1}
                        </td>
                        <td className="p-2.5 font-mono font-semibold text-slate-900 dark:text-slate-100">
                          <div>{r.nisn || '-'}</div>
                          {r.nis && <div className="text-[10px] text-slate-400 font-sans">NIS: {r.nis}</div>}
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200 font-bold">
                          <div className="flex items-center gap-1.5">
                            <span>{r.namaSiswa}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                                genderShort === 'P'
                                  ? 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {genderShort}
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {resolvedGrade}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[180px] truncate text-[11px]">
                          <div>{r.parentName || r.namaOrtu || '-'}</div>
                          <div className="text-[10px] text-slate-400 truncate">{r.address || r.alamat || '-'}</div>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {r.sakit || 0}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {r.izin || 0}
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {r.tanpaKeterangan || 0}
                        </td>
                        <td className="p-2.5 pr-4 text-center whitespace-nowrap">
                          {isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Sudah di e-Rapor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800">
                              <ArrowDownToLine className="w-3 h-3 text-indigo-600" />
                              Siap Ditarik
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
