import React, { useState, useEffect, useRef } from 'react';
import {
  SystemBackupData,
  TeacherAccount,
  ClassLevel,
  SchoolProfile,
} from '../types';
import {
  Cloud,
  CloudCheck,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  Clock,
  Sparkles,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import {
  saveWorkspaceToFirestore,
  loadWorkspaceFromFirestore,
  subscribeToWorkspace,
  testFirestoreConnection,
  OGOMOJOLO_COLLECTION_NAME,
} from '../utils/firebase';
import { OgomojoloSyncModal } from './OgomojoloSyncModal';

interface CloudSyncViewProps {
  currentData: SystemBackupData;
  currentUser: TeacherAccount | null;
  activeClassLevel: ClassLevel;
  schoolProfile: SchoolProfile;
  onApplyCloudData: (cloudData: SystemBackupData) => void;
  onRegisterStudentsFromOgomojolo?: (students: any[], raporDetails: Record<string, any>) => void;
  onSyncAllFromOgomojolo?: (students: any[], raporDetails: Record<string, any>, newStudentsAdded: any[]) => void;
  onClearAllDummyData?: () => void;
}

export const CloudSyncView: React.FC<CloudSyncViewProps> = ({
  currentData,
  currentUser,
  activeClassLevel,
  schoolProfile,
  onApplyCloudData,
  onRegisterStudentsFromOgomojolo,
  onSyncAllFromOgomojolo,
  onClearAllDummyData,
}) => {
  const [workspaceId, setWorkspaceId] = useState<string>(() => {
    return localStorage.getItem('iihh_cloud_workspace_id') || 'SDN-01-MERDEKA-2025';
  });

  const [syncKey, setSyncKey] = useState<string>(() => {
    return localStorage.getItem('iihh_cloud_sync_key') || 'sync-sec-7728';
  });

  const [isAutoSync, setIsAutoSync] = useState<boolean>(() => {
    return localStorage.getItem('iihh_cloud_auto_sync') === 'true';
  });

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('iihh_cloud_last_sync') || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  });
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string>('Sistem');
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isOgomojoloModalOpen, setIsOgomojoloModalOpen] = useState<boolean>(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Test Firestore connection on mount
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setIsCloudConnected(connected);
    });
  }, []);

  // Real-time subscriber when isAutoSync is enabled
  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (isAutoSync && workspaceId.trim()) {
      try {
        const unsub = subscribeToWorkspace(
          workspaceId.trim(),
          (cloudData, updatedAt, updatedBy) => {
            // Apply updates from other users
            const formattedTime = new Date(updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            setLastSyncedTime(formattedTime);
            setLastUpdatedBy(updatedBy);
            setSyncStatus('synced');
            onApplyCloudData(cloudData);
            showToast(`Data diselaraskan secara real-time dari Cloud (oleh: ${updatedBy})`, 'info');
          },
          (err) => {
            console.warn("Real-time sync notice:", err);
          }
        );
        unsubscribeRef.current = unsub;
      } catch (err) {
        console.error("Failed to start subscriber:", err);
      }
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isAutoSync, workspaceId]);

  const handleSaveConfig = () => {
    const cleanWorkspace = workspaceId.trim() || 'SDN-01-MERDEKA-2025';
    localStorage.setItem('iihh_cloud_workspace_id', cleanWorkspace);
    localStorage.setItem('iihh_cloud_sync_key', syncKey);
    localStorage.setItem('iihh_cloud_auto_sync', String(isAutoSync));
    showToast('Konfigurasi Cloud Firebase Berhasil Disimpan!');
  };

  const handlePushToCloud = async () => {
    setSyncStatus('syncing');
    showToast('Mengunggah database e-Rapor ke Firebase Firestore Cloud...', 'info');

    try {
      const updatedByName = currentUser?.name ? `${currentUser.name} (${currentUser.role})` : 'Administrator';
      const timestamp = await saveWorkspaceToFirestore(workspaceId, currentData, updatedByName);
      
      const nowStr = new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowStr);
      setLastUpdatedBy(updatedByName);
      localStorage.setItem('iihh_cloud_last_sync', nowStr);
      setSyncStatus('synced');
      showToast('Database berhasil dipublikasikan & tersimpan aman di Google Firebase Firestore!', 'success');
    } catch (err: any) {
      console.error("Firestore push error:", err);
      setSyncStatus('error');
      showToast(`Gagal mengunggah ke Cloud: ${err.message || 'Periksa koneksi internet'}`, 'error');
    }
  };

  const handlePullFromCloud = async () => {
    setSyncStatus('syncing');
    showToast('Mengunduh data e-Rapor terbaru dari Firebase Firestore Cloud...', 'info');

    try {
      const result = await loadWorkspaceFromFirestore(workspaceId);
      if (result) {
        onApplyCloudData(result.data);
        const nowStr = new Date(result.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setLastSyncedTime(nowStr);
        setLastUpdatedBy(result.updatedBy);
        setSyncStatus('synced');
        showToast(`Data berhasil ditarik dari Cloud! Diperbarui oleh: ${result.updatedBy}`, 'success');
      } else {
        setSyncStatus('synced');
        showToast('Workspace cloud ini belum memiliki data tersimpan. Silakan klik "Unggah ke Cloud (Push)" terlebih dahulu.', 'info');
      }
    } catch (err: any) {
      console.error("Firestore pull error:", err);
      setSyncStatus('error');
      showToast(`Gagal menarik data dari Cloud: ${err.message || 'Periksa koneksi internet'}`, 'error');
    }
  };

  const handleCopyShareLink = () => {
    const shareText = `Workspace Cloud e-Rapor Merdeka (Firebase):
ID Workspace: ${workspaceId}
Kunci Akses: ${syncKey}
Sekolah: ${schoolProfile.schoolName}`;
    navigator.clipboard.writeText(shareText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 animate-fadeIn ${
          toastMessage.type === 'error'
            ? 'bg-rose-950 text-white border-rose-500'
            : toastMessage.type === 'info'
            ? 'bg-sky-950 text-white border-sky-400'
            : 'bg-emerald-950 text-white border-emerald-400'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="rounded-[32px] bg-gradient-to-r from-blue-900 via-indigo-900 to-teal-900 text-white p-6 sm:p-8 shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-black backdrop-blur-xs">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Firebase Firestore Real-Time Cloud Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Sinkronisasi Cloud & Multi-User Terpusat
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Semua guru dan kepala sekolah kini dapat menginput nilai dan mencetak rapor dari laptop masing-masing secara bersamaan dengan penyimpanan cloud permanen Google Firebase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePushToCloud}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/25 transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>{syncStatus === 'syncing' ? 'Memproses...' : 'Unggah ke Cloud (Push)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromCloud}
              disabled={syncStatus === 'syncing'}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer backdrop-blur-xs disabled:opacity-50"
            >
              <ArrowDownToLine className="w-4 h-4 text-teal-300" />
              <span>Tarik dari Cloud (Pull)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status & Workspace Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Status Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Database Engine</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Online Cloud</span>
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CloudCheck className="w-5 h-5 text-teal-600 shrink-0" />
              <span>Firebase Firestore</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Terakhir Sinkron: <strong>{lastSyncedTime} WIB</strong></span>
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Oleh: <span className="font-semibold text-gray-700 dark:text-slate-300">{lastUpdatedBy}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Sesi Login:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUser?.name} ({currentUser?.role})</span>
          </div>
        </div>

        {/* Workspace Code Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">ID Ruang Kolaborasi</span>
            <button
              type="button"
              onClick={handleCopyShareLink}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Tersalin!' : 'Bagikan'}</span>
            </button>
          </div>
          <div className="space-y-1">
            <span className="font-mono text-base font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 block truncate">
              {workspaceId}
            </span>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Kunci Akses: <strong className="font-mono">{syncKey}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Project ID:</span>
            <span className="font-mono font-bold text-gray-600 dark:text-slate-400">reliable-enigma-s1ttq</span>
          </div>
        </div>

        {/* Cloud Collection Stats */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-gray-500 dark:text-slate-400">Ringkasan Dataset</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
              <Layers className="w-3.5 h-3.5" />
              <span>Terintegrasi</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Peserta Didik</span>
              <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{currentData.students?.length || 0} Siswa</span>
            </div>
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/60">
              <span className="text-gray-400 block text-[10px] font-bold uppercase">Entri Nilai</span>
              <span className="text-base font-black text-teal-600 dark:text-teal-400">{currentData.grades?.length || 0} Nilai</span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">Auto-Sync Listener:</span>
            <span className={`font-bold ${isAutoSync ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'}`}>
              {isAutoSync ? '● Aktif (Real-Time)' : '○ Manual (Tombol)'}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base">
              Pengaturan Workspace Kolaborasi Cloud
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Tentukan ID ruang sinkronisasi agar seluruh dewan guru mengakses database Firebase yang sama.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveConfig}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
              Workspace ID (Kode Sekolah / Ruang):
            </label>
            <input
              type="text"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-400">
              Gunakan kode unik sekolah Anda (misal: SDN01-JAKARTA-2025). Guru lain tinggal memasukkan ID yang sama untuk terhubung.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
              Kunci Akses Enkripsi (Sync Secret Key):
            </label>
            <input
              type="password"
              value={syncKey}
              onChange={(e) => setSyncKey(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-gray-400">
              Kunci pengaman untuk memvalidasi akses sinkronisasi dewan guru sekolah.
            </p>
          </div>
        </div>

        {/* Auto Sync Toggle */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-700 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sinkronisasi Otomatis Real-Time (Live Cloud Listener)</span>
            </span>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Menyerap pembaruan nilai secara langsung tanpa perlu klik tombol Tarik (Pull) setiap kali ada rekan guru yang menginput nilai dari perangkat lain.
            </p>
          </div>
          <input
            type="checkbox"
            checked={isAutoSync}
            onChange={(e) => {
              setIsAutoSync(e.target.checked);
              localStorage.setItem('iihh_cloud_auto_sync', String(e.target.checked));
            }}
            className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* Cross-App Integration: SDK Ogomojolo */}
      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-sky-500/10 dark:from-amber-950/20 dark:via-indigo-950/20 dark:to-sky-950/20 rounded-3xl p-6 sm:p-8 border-2 border-amber-200 dark:border-amber-900/40 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20 shrink-0 mt-0.5">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Integrasi Antar-Aplikasi: SDK Ogomojolo (Presensi & Absensi)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Opsi B Aktif
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Aplikasi e-Rapor ini telah terhubung ke basis data bersama Firestore pada koleksi <strong>"{OGOMOJOLO_COLLECTION_NAME}"</strong>. Anda dapat menarik rekapitulasi kehadiran (Sakit, Izin, Alpa) siswa dari aplikasi SDK Ogomojolo langsung ke lembar nilai rapor tanpa input manual berulang.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOgomojoloModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Buka Panel Sinkron Ogomojolo</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-amber-200/60 dark:border-amber-900/40">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Jalur Sinkronisasi:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Koleksi Shared Firestore</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Pencocokan Siswa:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Nomor Induk Siswa Nasional (NISN)</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Data yang Disinkronkan:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">Sakit, Izin, Tanpa Keterangan (Hari)</span>
          </div>
        </div>
      </div>

      {/* Ogomojolo Sync Modal */}
      {isOgomojoloModalOpen && (
        <OgomojoloSyncModal
          students={currentData.students}
          raporDetails={currentData.raporDetails}
          activeClassLevel={activeClassLevel}
          schoolProfile={schoolProfile}
          isOpen={isOgomojoloModalOpen}
          onClose={() => setIsOgomojoloModalOpen(false)}
          onRegisterStudentsFromOgomojolo={onRegisterStudentsFromOgomojolo}
          onSyncAllFromOgomojolo={(updatedStudents, newDetails, newStudentsAdded) => {
            if (onSyncAllFromOgomojolo) {
              onSyncAllFromOgomojolo(updatedStudents, newDetails, newStudentsAdded);
            } else if (onRegisterStudentsFromOgomojolo) {
              onRegisterStudentsFromOgomojolo(updatedStudents, newDetails);
            }
            showToast(`Berhasil menyalin ${updatedStudents.length} seluruh data siswa & kehadiran dari SDK Ogomojolo!`, 'success');
          }}
          onClearAllDummyData={onClearAllDummyData}
          onApplyRaporDetails={(newDetails, count) => {
            onApplyCloudData({
              ...currentData,
              raporDetails: newDetails,
            });
            showToast(`Berhasil menyelaraskan ${count} data kehadiran siswa dari SDK Ogomojolo!`, 'success');
          }}
        />
      )}
    </div>
  );
};

