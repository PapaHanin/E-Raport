import React, { useState } from 'react';
import {
  AuditLogItem,
  BackupSnapshot,
  Student,
  MataPelajaran,
  NilaiSiswaMapel,
  SchoolProfile,
  ClassLevel,
  SystemBackupData,
} from '../types';
import {
  History,
  RotateCcw,
  Save,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  BookOpen,
  ArrowRight,
  Download,
  Upload,
  ShieldCheck,
  X,
} from 'lucide-react';

interface AuditTrailViewProps {
  auditLogs: AuditLogItem[];
  snapshots: BackupSnapshot[];
  currentData: SystemBackupData;
  activeClassLevel: ClassLevel;
  onRestoreSnapshot: (snapshotData: SystemBackupData) => void;
  onCreateSnapshot: (title: string, desc: string) => void;
  onDeleteSnapshot?: (snapshotId: string) => void;
  onClearLogs: () => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  auditLogs,
  snapshots,
  currentData,
  activeClassLevel,
  onRestoreSnapshot,
  onCreateSnapshot,
  onDeleteSnapshot,
  onClearLogs,
}) => {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [snapshotTitle, setSnapshotTitle] = useState<string>('');
  const [snapshotDesc, setSnapshotDesc] = useState<string>('');
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [showSnapshotModal, setShowSnapshotModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Confirmation Modals
  const [showClearLogsModal, setShowClearLogsModal] = useState<boolean>(false);
  const [restoringSnapshot, setRestoringSnapshot] = useState<BackupSnapshot | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<BackupSnapshot | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.studentName.toLowerCase().includes(q) ||
        (log.subjectName && log.subjectName.toLowerCase().includes(q)) ||
        log.detail.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSnapshotSubmit = () => {
    setSnapshotError(null);
    if (!snapshotTitle.trim()) {
      setSnapshotError('Mohon masukkan judul atau keterangan titik snapshot pemulihan.');
      return;
    }
    onCreateSnapshot(
      snapshotTitle.trim(),
      snapshotDesc.trim() || `Snapshot cadangan saat kelas ${activeClassLevel}`
    );
    setSnapshotTitle('');
    setSnapshotDesc('');
    setShowSnapshotModal(false);
    showToast('Titik pemulihan (Snapshot) berhasil dibuat dan tersimpan!');
  };

  const handleConfirmClearLogs = () => {
    onClearLogs();
    setShowClearLogsModal(false);
    showToast('Seluruh riwayat log aktivitas audit berhasil dibersihkan.');
  };

  const handleConfirmRestore = () => {
    if (!restoringSnapshot) return;
    onRestoreSnapshot(restoringSnapshot.data);
    const restoredTitle = restoringSnapshot.title;
    setRestoringSnapshot(null);
    showToast(`Berhasil memulihkan data dari snapshot: "${restoredTitle}"!`);
  };

  const handleConfirmDeleteSnapshot = () => {
    if (!deletingSnapshot) return;
    if (onDeleteSnapshot) {
      onDeleteSnapshot(deletingSnapshot.id);
    }
    const delTitle = deletingSnapshot.title;
    setDeletingSnapshot(null);
    showToast(`Snapshot "${delTitle}" berhasil dihapus.`);
  };

  return (
    <div className="space-y-6" id="audit-trail-container">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-slate-950/20 border-2 border-indigo-500/30 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider border border-indigo-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audit Trail & Titik Pemulihan (Undo/Redo)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Riwayat Perubahan Nilai & Snapshot Pemulihan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
              Memantau setiap riwayat perubahan nilai siswa (siapa yang mengubah, nilai lama vs nilai baru, dan waktu pengubahan), serta membuat titik pemulihan data untuk mencegah salah ketik nilai rapor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="btn-buat-snapshot"
              onClick={() => {
                setSnapshotError(null);
                setSnapshotTitle(`Snapshot ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);
                setShowSnapshotModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Buat Titik Pemulihan (Snapshot)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2-Column: Saved Snapshots & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Saved Snapshots (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-black text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Titik Pemulihan ({snapshots.length})</span>
              </h3>
            </div>

            {snapshots.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                Belum ada snapshot pemulihan yang tersimpan. Klik "Buat Titik Pemulihan" sebelum melakukan pengisian nilai massal.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 space-y-2 hover:border-indigo-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-black text-xs text-indigo-950 dark:text-indigo-200">
                        {snap.title}
                      </h4>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {snap.createdAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 dark:text-slate-400">
                      {snap.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-indigo-100/60 dark:border-slate-700/60">
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {snap.studentCount} Siswa • {snap.gradesCount} Nilai
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onDeleteSnapshot && (
                          <button
                            type="button"
                            onClick={() => setDeletingSnapshot(snap)}
                            title="Hapus Snapshot Ini"
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRestoringSnapshot(snap)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black shadow-xs cursor-pointer active:scale-95 transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Pulihkan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Audit Activity Logs (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="font-black text-gray-900 dark:text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Log Riwayat Aktivitas & Perubahan Nilai ({filteredLogs.length})</span>
              </h3>

              {auditLogs.length > 0 && (
                <button
                  type="button"
                  id="btn-bersihkan-log-audit"
                  onClick={() => setShowClearLogsModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bersihkan Log Audit</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari siswa, mata pelajaran, atau detail perubahan..."
                className="flex-1 p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200"
              />

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300"
              >
                <option value="all">Semua Jenis Aksi</option>
                <option value="Ubah Nilai LM">Ubah Nilai LM</option>
                <option value="Ubah Nilai SAS">Ubah Nilai SAS</option>
                <option value="Batch Fill">Batch Fill Cepat</option>
                <option value="Generate AI Narasi">Generate AI Narasi</option>
                <option value="Impor Excel">Impor Excel / CSV</option>
                <option value="Kenaikan Kelas">Kenaikan Kelas</option>
              </select>
            </div>

            {/* Activity Table */}
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-slate-700 rounded-2xl">
                Belum ada catatan aktivitas yang sesuai filter.
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold sticky top-0">
                    <tr>
                      <th className="p-3 w-28">Waktu</th>
                      <th className="p-3">Siswa & Mapel</th>
                      <th className="p-3">Jenis Aksi</th>
                      <th className="p-3">Perubahan Nilai</th>
                      <th className="p-3">Pengguna</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-gray-900 dark:text-slate-200">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 text-[11px] font-mono text-gray-400">
                          {log.timestamp}
                        </td>
                        <td className="p-3">
                          <div className="font-bold">{log.studentName}</div>
                          {log.subjectName && (
                            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                              {log.subjectName}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold border border-indigo-200 dark:border-slate-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-[11px] text-gray-700 dark:text-slate-300">
                            {log.detail}
                          </div>
                          {log.oldValue !== undefined && log.newValue !== undefined && (
                            <div className="flex items-center gap-1.5 text-[10px] font-mono mt-0.5">
                              <span className="line-through text-rose-500">{log.oldValue}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-gray-400" />
                              <span className="font-bold text-emerald-600">{log.newValue}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-gray-600 dark:text-slate-400">
                          {log.userName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Snapshot Creation Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-lg w-full p-6 sm:p-8 space-y-5 border border-indigo-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-indigo-600" />
                <span>Simpan Titik Pemulihan (Snapshot)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-lg font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {snapshotError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold">
                {snapshotError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Nama / Judul Snapshot: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={snapshotTitle}
                  onChange={(e) => setSnapshotTitle(e.target.value)}
                  placeholder="Contoh: Sebelum Input Nilai SAS Semester 1"
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Catatan Keterangan (Opsional):
                </label>
                <textarea
                  value={snapshotDesc}
                  onChange={(e) => setSnapshotDesc(e.target.value)}
                  rows={3}
                  placeholder="Deskripsi singkat kondisi nilai saat snapshot diambil..."
                  className="w-full p-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSnapshotModal(false)}
                className="px-5 py-2.5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateSnapshotSubmit}
                className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Simpan Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clear Logs Confirmation */}
      {showClearLogsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 border-4 border-rose-100 dark:border-rose-950 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">
                Bersihkan Seluruh Log Audit?
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan menghapus semua riwayat catatan aktivitas perubahan nilai ({auditLogs.length} catatan log).
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClearLogsModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-clear-logs"
                onClick={handleConfirmClearLogs}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Bersihkan Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Restore Snapshot Confirmation */}
      {restoringSnapshot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 border-4 border-indigo-100 dark:border-indigo-950 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">
                Pulihkan Data ke Titik Snapshot Ini?
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Data nilai dan siswa saat ini akan digantikan dengan data yang tersimpan pada snapshot:
              </p>
            </div>
            <div className="p-3.5 bg-indigo-50/70 dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 text-xs space-y-1">
              <p className="font-black text-indigo-950 dark:text-indigo-200">{restoringSnapshot.title}</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400">{restoringSnapshot.description}</p>
              <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 pt-1">
                Waktu: {restoringSnapshot.createdAt} • {restoringSnapshot.studentCount} Siswa
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRestoringSnapshot(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Pulihkan Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Snapshot Confirmation */}
      {deletingSnapshot && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 border-4 border-rose-100 dark:border-rose-950 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">
                Hapus Titik Pemulihan (Snapshot)?
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Snapshot <strong>"{deletingSnapshot.title}"</strong> akan dihapus secara permanen.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingSnapshot(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSnapshot}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

