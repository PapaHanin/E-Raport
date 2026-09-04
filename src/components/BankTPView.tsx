import React, { useState } from 'react';
import {
  MataPelajaran,
  TujuanPembelajaran,
  Fase,
  ClassLevel,
  getFaseByClass,
  isIPASActiveForClass,
} from '../types';
import { getSubjectsForClass } from '../data/initialData';
import {
  BookMarked,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Layers,
  Sparkles,
  GraduationCap,
  Info,
} from 'lucide-react';

interface BankTPViewProps {
  subjects: MataPelajaran[];
  activeClassLevel?: ClassLevel;
  onSelectClassLevel?: (classLevel: ClassLevel) => void;
  onUpdateSubjects: (updatedSubjects: MataPelajaran[]) => void;
}

export const BankTPView: React.FC<BankTPViewProps> = ({
  subjects,
  activeClassLevel = 'Kelas 4',
  onSelectClassLevel,
  onUpdateSubjects,
}) => {
  const classLevels: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];
  const currentFase = getFaseByClass(activeClassLevel);
  const isIPASVisible = isIPASActiveForClass(activeClassLevel);

  const activeSubjects = getSubjectsForClass(subjects, activeClassLevel);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    return activeSubjects[0]?.id || subjects[0]?.id || 'mapel-1';
  });

  React.useEffect(() => {
    if (activeSubjects.length > 0 && !activeSubjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(activeSubjects[0].id);
    }
  }, [activeClassLevel, activeSubjects, selectedSubjectId]);

  const [isAddingTP, setIsAddingTP] = useState<boolean>(false);
  const [newTPCode, setNewTPCode] = useState<string>('');
  const [newTPDesc, setNewTPDesc] = useState<string>('');
  const [newTPLingkup, setNewTPLingkup] = useState<string>('');

  // Editing TP state
  const [editingTP, setEditingTP] = useState<TujuanPembelajaran | null>(null);
  const [deletingTP, setDeletingTP] = useState<TujuanPembelajaran | null>(null);

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || activeSubjects[0] || subjects[0];

  const handleAddTP = () => {
    if (!newTPDesc.trim() || !currentSubject) return;

    const nextCode = newTPCode.trim() || `TP ${currentSubject.tujuanPembelajaran.length + 1}`;
    const newTP: TujuanPembelajaran = {
      id: `tp-${Date.now()}`,
      code: nextCode,
      description: newTPDesc.trim(),
      subjectId: currentSubject.id,
      lingkupMateri: newTPLingkup.trim() || 'Lingkup Materi Umum',
    };

    const updated = subjects.map((s) => {
      if (s.id === currentSubject.id) {
        return {
          ...s,
          tujuanPembelajaran: [...s.tujuanPembelajaran, newTP],
        };
      }
      return s;
    });

    onUpdateSubjects(updated);
    setIsAddingTP(false);
    setNewTPCode('');
    setNewTPDesc('');
    setNewTPLingkup('');
  };

  const handleSaveEditTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTP || !currentSubject) return;

    const updated = subjects.map((s) => {
      if (s.id === currentSubject.id) {
        return {
          ...s,
          tujuanPembelajaran: s.tujuanPembelajaran.map((t) => (t.id === editingTP.id ? editingTP : t)),
        };
      }
      return s;
    });

    onUpdateSubjects(updated);
    setEditingTP(null);
  };

  const handleConfirmDeleteTP = () => {
    if (!deletingTP || !currentSubject) return;
    const updated = subjects.map((s) => {
      if (s.id === currentSubject.id) {
        return {
          ...s,
          tujuanPembelajaran: s.tujuanPembelajaran.filter((t) => t.id !== deletingTP.id),
        };
      }
      return s;
    });
    onUpdateSubjects(updated);
    setDeletingTP(null);
  };

  return (
    <div className="space-y-6" id="bank-tp-container">
      {/* Top Banner */}
      <div className="bg-[#4F46E5] text-white rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 shadow-xl shadow-indigo-500/20 border-2 border-indigo-400/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-black uppercase tracking-wider shadow-xs">
              <BookMarked className="w-3.5 h-3.5 text-black" />
              <span>Master Kurikulum Merdeka</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bank Tujuan Pembelajaran (TP) & Lingkup Materi
            </h2>
            <p className="text-indigo-100 text-xs sm:text-sm font-medium leading-relaxed">
              Daftar capaian TP per mata pelajaran yang menjadi rujukan asesmen sumatif lingkup materi (LM) dan penyusunan narasi rapor otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Class Level Selector Bar */}
      {onSelectClassLevel && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border-2 border-indigo-100 dark:border-slate-800 shadow-xs flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">
              Pilih Kelas:
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
              {currentFase}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl overflow-x-auto">
            {classLevels.map((lvl) => {
              const isActive = lvl === activeClassLevel;
              return (
                <button
                  key={lvl}
                  onClick={() => onSelectClassLevel(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4F46E5] text-white shadow-xs scale-[1.02]'
                      : 'text-gray-700 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isIPASVisible && (
        <div className="flex items-center gap-2 p-3.5 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-medium">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Pada <strong>{activeClassLevel} (Fase A)</strong>, mata pelajaran <strong>IPAS</strong> tidak terdaftar dalam kurikulum dasar.
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 Cols: Subjects List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-5 space-y-2">
            <h3 className="font-black text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Daftar Mata Pelajaran ({activeSubjects.length} Mapel)
            </h3>
            <div className="space-y-2">
              {activeSubjects.map((subj) => {
                const isSelected = subj.id === selectedSubjectId;
                return (
                  <button
                    key={subj.id}
                    onClick={() => setSelectedSubjectId(subj.id)}
                    className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between text-xs font-bold cursor-pointer ${
                      isSelected
                        ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-500/20'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-black text-sm">{subj.name}</p>
                      <p
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-indigo-200' : 'text-gray-400 dark:text-slate-400'
                        }`}
                      >
                        {subj.category} • {currentFase}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-black ${
                        isSelected ? 'bg-yellow-400 text-black' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      {subj.tujuanPembelajaran.length} TP
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 8 Cols: TP Details & Add TP */}
        <div className="lg:col-span-8 space-y-4">
          {currentSubject ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-lg">{currentSubject.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                    {currentFase} • Total {currentSubject.tujuanPembelajaran.length} Tujuan Pembelajaran
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingTP(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-yellow-300" />
                  <span>Tambah TP Baru</span>
                </button>
              </div>

              {/* Form Add TP Modal/Block */}
              {isAddingTP && (
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 space-y-3">
                  <h4 className="font-black text-indigo-950 dark:text-indigo-200 text-xs">Tambah Tujuan Pembelajaran (TP) Baru</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">Kode TP (e.g. TP 5):</label>
                      <input
                        type="text"
                        value={newTPCode}
                        onChange={(e) => setNewTPCode(e.target.value)}
                        placeholder={`TP ${currentSubject.tujuanPembelajaran.length + 1}`}
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl font-medium text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">Lingkup Materi / Bab:</label>
                      <input
                        type="text"
                        value={newTPLingkup}
                        onChange={(e) => setNewTPLingkup(e.target.value)}
                        placeholder="Contoh: Pengukuran dan Geometri"
                        className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl font-medium text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-slate-300 mb-1">Deskripsi Tujuan Pembelajaran (Kompetensi):</label>
                    <textarea
                      rows={2}
                      value={newTPDesc}
                      onChange={(e) => setNewTPDesc(e.target.value)}
                      placeholder="Contoh: Menghitung volume kubus dan balok dengan satuan kubus..."
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-xl font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingTP(false)}
                      className="px-4 py-2 text-xs text-gray-600 dark:text-slate-400 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTP}
                      className="px-5 py-2 text-xs font-black text-white bg-[#4F46E5] hover:bg-indigo-700 rounded-xl shadow-xs cursor-pointer"
                    >
                      Simpan TP
                    </button>
                  </div>
                </div>
              )}

              {/* List of TPs in Subject */}
              <div className="space-y-3">
                {currentSubject.tujuanPembelajaran.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-6">Belum ada TP untuk mata pelajaran ini.</p>
                ) : (
                  currentSubject.tujuanPembelajaran.map((tp, idx) => (
                    <div
                      key={tp.id}
                      className="p-4 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border-2 border-gray-100 dark:border-slate-700/80 hover:border-indigo-200 dark:hover:border-slate-600 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 font-black text-[11px]">
                            LM {idx + 1} ({tp.code})
                          </span>
                          <span className="text-xs font-semibold text-gray-300 dark:text-slate-600">•</span>
                          <span className="text-xs font-bold text-gray-700 dark:text-slate-300">{tp.lingkupMateri}</span>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-slate-200 leading-relaxed font-medium">
                          {tp.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingTP(tp)}
                          title="Edit TP"
                          className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTP(tp)}
                          title="Hapus TP"
                          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 p-8 text-center text-gray-400 text-xs">
              Pilih mata pelajaran untuk melihat daftar Tujuan Pembelajaran.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: EDIT TP */}
      {editingTP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-lg w-full p-6 space-y-4 shadow-2xl border-4 border-indigo-100 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base">Edit Tujuan Pembelajaran (TP)</h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">{currentSubject?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTP(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTP} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Kode TP:</label>
                  <input
                    type="text"
                    required
                    value={editingTP.code}
                    onChange={(e) => setEditingTP({ ...editingTP, code: e.target.value })}
                    className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Lingkup Materi / Bab:</label>
                  <input
                    type="text"
                    required
                    value={editingTP.lingkupMateri}
                    onChange={(e) => setEditingTP({ ...editingTP, lingkupMateri: e.target.value })}
                    className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Deskripsi Tujuan Pembelajaran:</label>
                <textarea
                  rows={3}
                  required
                  value={editingTP.description}
                  onChange={(e) => setEditingTP({ ...editingTP, description: e.target.value })}
                  className="w-full text-xs p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium text-gray-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTP(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Simpan Perubahan TP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TP CONFIRMATION */}
      {deletingTP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl border-4 border-rose-100 dark:border-rose-950">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">Hapus Tujuan Pembelajaran (TP)?</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Tindakan ini akan menghapus TP berikut dari bank data capaian:
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs space-y-1">
              <span className="inline-block px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 font-bold rounded-md">
                {deletingTP.code} • {deletingTP.lingkupMateri}
              </span>
              <p className="text-gray-800 dark:text-slate-200 font-medium">{deletingTP.description}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTP(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTP}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus TP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

