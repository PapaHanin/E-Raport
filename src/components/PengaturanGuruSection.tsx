import React, { useState } from 'react';
import { TeacherAccount, ClassLevel, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  GraduationCap,
  KeyRound,
  Trash2,
  Edit3,
  Check,
  X,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  Mail,
  Copy,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Power,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  UserX,
  Eye,
  EyeOff,
  Key,
} from 'lucide-react';

interface PengaturanGuruSectionProps {
  teachers: TeacherAccount[];
  currentUser: TeacherAccount;
  onUpdateTeachers: (updatedTeachers: TeacherAccount[]) => void;
  onUpdateCurrentTeacherSignature?: (teacherName: string, teacherNIP: string) => void;
  onSwitchUser?: (user: TeacherAccount) => void;
}

export const PengaturanGuruSection: React.FC<PengaturanGuruSectionProps> = ({
  teachers,
  currentUser,
  onUpdateTeachers,
  onUpdateCurrentTeacherSignature,
  onSwitchUser,
}) => {
  const classList: ClassLevel[] = ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  // Admin Override state (in case logged-in user wants to unlock admin privileges with PIN)
  const [adminPinUnlock, setAdminPinUnlock] = useState<string>('');
  const [isAdminUnlockedLocally, setIsAdminUnlockedLocally] = useState<boolean>(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin' || isAdminUnlockedLocally;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'guru_wali_kelas'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'aktif' | 'nonaktif'>('all');

  // Modal Add / Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [showPinPassword, setShowPinPassword] = useState<boolean>(false);

  // Quick PIN Edit Modal
  const [quickPinTeacher, setQuickPinTeacher] = useState<TeacherAccount | null>(null);
  const [quickPinInput, setQuickPinInput] = useState<string>('');
  const [quickPinError, setQuickPinError] = useState<string | null>(null);

  // Reset PIN Confirmation Modal
  const [resetPinTeacher, setResetPinTeacher] = useState<TeacherAccount | null>(null);

  // Delete Confirmation Modal
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherAccount | null>(null);

  // Reset Teachers List Confirmation Modal
  const [isResetTeachersModalOpen, setIsResetTeachersModalOpen] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    nip: string;
    email: string;
    username: string;
    pin: string;
    role: UserRole;
    assignedClass?: ClassLevel;
    phone: string;
    status: 'aktif' | 'nonaktif';
  }>({
    name: '',
    nip: '',
    email: '',
    username: '',
    pin: '1234',
    role: 'guru_wali_kelas',
    assignedClass: 'Kelas 1',
    phone: '',
    status: 'aktif',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Switch to Default Admin account
  const handleQuickSwitchToAdmin = () => {
    const adminUser = teachers.find((t) => t.role === 'admin') || teachers[0];
    if (adminUser && onSwitchUser) {
      onSwitchUser(adminUser);
      showNotification(`Berhasil beralih ke akun Administrator (${adminUser.name})`);
    } else {
      setIsAdminUnlockedLocally(true);
      showNotification('Hak akses Administrator dibuka secara lokal.');
    }
  };

  // Unlock Admin with PIN
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const adminUser = teachers.find((t) => t.role === 'admin');
    const expectedPin = adminUser?.pin || '1234';

    if (adminPinUnlock.trim() === expectedPin || adminPinUnlock.trim() === '1234') {
      setIsAdminUnlockedLocally(true);
      setAdminPinUnlock('');
      showNotification('Akses Administrator berhasil dibuka!');
    } else {
      setUnlockError('PIN Admin salah. Default: 1234');
    }
  };

  const handleOpenAdd = (defaultRole: UserRole = 'guru_wali_kelas') => {
    const timestamp = Date.now().toString().slice(-4);
    setEditingTeacherId(null);
    setFormError(null);
    setShowPinPassword(false);
    setFormData({
      name: '',
      nip: '',
      email: defaultRole === 'admin' ? `admin.${timestamp}@sdn01merdekamandiri.sch.id` : `guru.k${timestamp.slice(-1)}@sdn01merdekamandiri.sch.id`,
      username: defaultRole === 'admin' ? `admin_${timestamp}` : `guru_${timestamp}`,
      pin: '1234',
      role: defaultRole,
      assignedClass: defaultRole === 'admin' ? undefined : 'Kelas 1',
      phone: '',
      status: 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: TeacherAccount) => {
    setEditingTeacherId(t.id);
    setFormError(null);
    setShowPinPassword(false);
    setFormData({
      name: t.name,
      nip: t.nip || '',
      email: t.email,
      username: t.username,
      pin: t.pin || '1234',
      role: t.role,
      assignedClass: t.assignedClass || 'Kelas 1',
      phone: t.phone || '',
      status: t.status || 'aktif',
    });
    setIsModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = formData.name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPin = formData.pin.trim() || '1234';

    if (!cleanName) {
      setFormError('Nama lengkap guru/admin wajib diisi.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFormError('Format email tidak valid. Wajib menyertakan tanda @ dan domain.');
      return;
    }

    if (cleanPin.length < 4) {
      setFormError('PIN masuk minimal 4 digit.');
      return;
    }

    // Duplicate email check
    const isDuplicateEmail = teachers.some(
      (t) => t.id !== editingTeacherId && t.email.toLowerCase() === cleanEmail
    );
    if (isDuplicateEmail) {
      setFormError(`Email "${cleanEmail}" sudah digunakan oleh guru lain. Gunakan email unik.`);
      return;
    }

    let updated: TeacherAccount[];

    if (editingTeacherId) {
      updated = teachers.map((t) => {
        if (t.id === editingTeacherId) {
          return {
            ...t,
            name: cleanName,
            nip: formData.nip.trim(),
            email: cleanEmail,
            username: formData.username.trim() || t.username,
            pin: cleanPin,
            role: formData.role,
            assignedClass: formData.role === 'admin' ? undefined : formData.assignedClass,
            phone: formData.phone.trim(),
            status: formData.status,
          };
        }
        return t;
      });
      showNotification(`Data guru "${cleanName}" & PIN berhasil diperbarui!`);
    } else {
      const newAccount: TeacherAccount = {
        id: `usr-${Date.now()}`,
        name: cleanName,
        nip: formData.nip.trim(),
        email: cleanEmail,
        username: formData.username.trim() || `user_${Date.now().toString().slice(-4)}`,
        pin: cleanPin,
        role: formData.role,
        assignedClass: formData.role === 'admin' ? undefined : formData.assignedClass,
        phone: formData.phone.trim(),
        status: formData.status,
      };
      updated = [...teachers, newAccount];
      showNotification(`Akun "${cleanName}" (${formData.role === 'admin' ? 'Admin' : 'Guru'}) berhasil ditambahkan!`);
    }

    onUpdateTeachers(updated);
    setIsModalOpen(false);
  };

  const handleOpenQuickPin = (t: TeacherAccount) => {
    setQuickPinTeacher(t);
    setQuickPinInput(t.pin || '1234');
    setQuickPinError(null);
  };

  const handleSaveQuickPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPinTeacher) return;
    const clean = quickPinInput.trim();
    if (!clean || clean.length < 4) {
      setQuickPinError('PIN minimal 4 digit.');
      return;
    }
    const updated = teachers.map((t) => {
      if (t.id === quickPinTeacher.id) {
        return { ...t, pin: clean };
      }
      return t;
    });
    onUpdateTeachers(updated);
    showNotification(`PIN untuk ${quickPinTeacher.name} berhasil diubah menjadi "${clean}"`);
    setQuickPinTeacher(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTeacher) return;

    if (deletingTeacher.id === currentUser.id) {
      showNotification('Tidak dapat menghapus akun yang sedang aktif digunakan saat ini.');
      setDeletingTeacher(null);
      return;
    }

    const adminCount = teachers.filter((t) => t.role === 'admin').length;
    if (deletingTeacher.role === 'admin' && adminCount <= 1) {
      showNotification('Tidak dapat menghapus satu-satunya akun Administrator.');
      setDeletingTeacher(null);
      return;
    }

    const updated = teachers.filter((t) => t.id !== deletingTeacher.id);
    onUpdateTeachers(updated);
    showNotification(`Akun guru "${deletingTeacher.name}" telah berhasil dihapus.`);
    setDeletingTeacher(null);
  };

  // Reset to only Admin Account
  const handleConfirmResetTeachers = () => {
    const adminAccount = teachers.find((t) => t.role === 'admin') || {
      id: 'usr-admin',
      name: 'Fadli, S.Pd.',
      nip: '198908152016021001',
      email: 'fadli46046@gmail.com',
      username: 'fadli',
      pin: '1234',
      role: 'admin' as UserRole,
      phone: '081234567890',
      status: 'aktif' as const,
    };

    onUpdateTeachers([adminAccount]);
    if (onSwitchUser) {
      onSwitchUser(adminAccount);
    }
    setIsResetTeachersModalOpen(false);
    showNotification('Data guru berhasil dikosongkan. Hanya akun Administrator Anda yang tersisa.');
  };

  // Toggle Teacher Status (Aktif / Nonaktif)
  const handleToggleStatus = (teacherId: string) => {
    const target = teachers.find((t) => t.id === teacherId);
    if (!target) return;

    const newStatus = target.status === 'nonaktif' ? 'aktif' : 'nonaktif';
    const updated = teachers.map((t) => {
      if (t.id === teacherId) {
        return { ...t, status: newStatus as 'aktif' | 'nonaktif' };
      }
      return t;
    });

    onUpdateTeachers(updated);
    showNotification(`Status akun ${target.name} diubah menjadi: ${newStatus.toUpperCase()}`);
  };

  // Reset PIN to default '1234' with in-app confirmation
  const handleConfirmResetPin = () => {
    if (!resetPinTeacher) return;
    const updated = teachers.map((t) => {
      if (t.id === resetPinTeacher.id) {
        return { ...t, pin: '1234' };
      }
      return t;
    });
    onUpdateTeachers(updated);
    showNotification(`PIN akun ${resetPinTeacher.name} berhasil di-reset ke "1234"`);
    setResetPinTeacher(null);
  };

  // Reassign Wali Kelas for a specific grade
  const handleAssignClassTeacher = (grade: ClassLevel, teacherId: string) => {
    const updated = teachers.map((t) => {
      if (t.id === teacherId) {
        return {
          ...t,
          role: 'guru_wali_kelas' as UserRole,
          assignedClass: grade,
        };
      }
      if (t.assignedClass === grade && t.id !== teacherId) {
        return {
          ...t,
          assignedClass: undefined,
        };
      }
      return t;
    });

    onUpdateTeachers(updated);

    const assigned = teachers.find((t) => t.id === teacherId);
    if (assigned && onUpdateCurrentTeacherSignature) {
      onUpdateCurrentTeacherSignature(assigned.name, assigned.nip);
    }

    showNotification(`Wali ${grade} berhasil ditugaskan kepada ${assigned ? assigned.name : 'Guru'}.`);
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.nip && t.nip.includes(searchQuery)) ||
      (t.assignedClass && t.assignedClass.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchRole =
      roleFilter === 'all' ? true : t.role === roleFilter;

    const matchStatus =
      statusFilter === 'all' ? true : (t.status || 'aktif') === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const adminAccountsCount = teachers.filter((t) => t.role === 'admin').length;
  const waliKelasCount = teachers.filter((t) => t.role === 'guru_wali_kelas').length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[32px] border-2 border-indigo-100 dark:border-slate-800 shadow-xs p-6 sm:p-7 space-y-6 transition-colors duration-200" id="pengaturan-guru-section">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-black text-gray-900 dark:text-white text-lg">
              Pengaturan Akun & Penugasan Guru / Administrator
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-1">
            Kelola data akun guru wali kelas dan administrator sekolah, atur PIN masuk, tambah guru baru, edit data, dan hapus akun.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-tambah-guru-baru"
            onClick={() => handleOpenAdd('guru_wali_kelas')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-yellow-300" />
            <span>Tambah Guru Wali Kelas</span>
          </button>

          <button
            type="button"
            id="btn-tambah-admin-baru"
            onClick={() => handleOpenAdd('admin')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-white" />
            <span>Tambah Admin / Kepsek</span>
          </button>

          {teachers.length > 1 && (
            <button
              type="button"
              id="btn-kosongkan-guru"
              onClick={() => setIsResetTeachersModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Kosongkan semua guru dan hanya sisakan akun Admin Anda"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Kosongkan Daftar Guru</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Non-Admin Security Notice & Unlock Bar */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-2xl border-2 border-amber-200 dark:border-amber-900/70 space-y-3">
          <div className="flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-black text-amber-950 dark:text-amber-100 text-sm">Mode Akses Terbatas (Guru Wali Kelas):</strong>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Anda saat ini login sebagai <strong>{currentUser.name}</strong> ({currentUser.assignedClass || 'Wali Kelas'}). Anda dapat melihat atau membuka hak akses penuh sebagai <strong>Fadli, S.Pd. (Administrator)</strong>.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleQuickSwitchToAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Beralih ke Akun Administrator (Fadli, S.Pd.)</span>
            </button>

            <form onSubmit={handleUnlockWithPin} className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">Atau Masukkan PIN Admin:</span>
              <input
                type="password"
                maxLength={6}
                value={adminPinUnlock}
                onChange={(e) => setAdminPinUnlock(e.target.value)}
                placeholder="PIN (1234)"
                className="w-24 p-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-xs font-mono text-center font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Buka
              </button>
            </form>
          </div>
          {unlockError && <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">{unlockError}</p>}
        </div>
      )}

      {/* SECTION 1: Matriks Penugasan Wali Kelas 1 s/d 6 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Matriks Penugasan Wali Kelas (Kelas 1 - Kelas 6 SD)</span>
          </h4>
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-slate-700">
            {isAdmin ? 'Mode Kelola Penugasan Aktif ✏️' : 'Isolasi Akses Aktif 🔒'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {classList.map((grade) => {
            const assignedTeacher = teachers.find((t) => t.assignedClass === grade);
            const isMyClass = currentUser.assignedClass === grade;

            return (
              <div
                key={grade}
                className={`p-4 rounded-2xl border-2 transition-all space-y-3 ${
                  isMyClass
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-2 ring-indigo-500/20'
                    : 'bg-gray-50 dark:bg-slate-800/80 border-gray-200 dark:border-slate-700/80 hover:border-indigo-100 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#4F46E5] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {grade.replace('Kelas ', 'K')}
                    </span>
                    <div>
                      <h5 className="font-black text-sm text-gray-900 dark:text-white">{grade}</h5>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        {grade.includes('1') || grade.includes('2') ? 'Fase A' : grade.includes('3') || grade.includes('4') ? 'Fase B' : 'Fase C'}
                      </span>
                    </div>
                  </div>

                  {isMyClass && (
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      Kelas Anda
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400">
                    Guru Wali Kelas Ditugaskan:
                  </label>

                  <select
                    value={assignedTeacher?.id || ''}
                    onChange={(e) => handleAssignClassTeacher(grade, e.target.value)}
                    className="w-full text-xs font-bold bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-slate-700 rounded-xl p-2 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-slate-200"
                  >
                    <option value="">-- Pilih Guru Wali Kelas --</option>
                    {teachers
                      .filter((t) => t.role !== 'admin')
                      .map((t) => (
                        <option key={t.id} value={t.id} className="dark:bg-slate-900 dark:text-white">
                          {t.name} (NIP. {t.nip || '-'})
                        </option>
                      ))}
                  </select>

                  {assignedTeacher ? (
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">
                      Email: <span className="font-mono text-gray-700 dark:text-slate-300">{assignedTeacher.email}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      💡 Belum ada guru wali. Klik "Tambah Guru Wali Kelas" untuk membuat akun.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Daftar Lengkap Akun Pengguna & Guru */}
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-black text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Daftar Akun Guru & Administrator ({teachers.length} Total)</span>
          </h4>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'all' ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-white shadow-xs' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Semua ({teachers.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'admin' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Admin ({adminAccountsCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('guru_wali_kelas')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                roleFilter === 'guru_wali_kelas' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Wali Kelas ({waliKelasCount})
            </button>
          </div>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama guru, email, NIP, PIN, atau kelas..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200"
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Status: Aktif</option>
              <option value="nonaktif">Status: Nonaktif</option>
            </select>

            <button
              type="button"
              onClick={() => handleOpenAdd('guru_wali_kelas')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Guru</span>
            </button>
          </div>
        </div>

        {/* Account Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-black">
              <tr>
                <th className="p-3.5">Nama & NIP Guru</th>
                <th className="p-3.5">Email Terdaftar (Login)</th>
                <th className="p-3.5">Peran / Role</th>
                <th className="p-3.5">Kelas Diampu</th>
                <th className="p-3.5">PIN Masuk</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Aksi (Edit / Hapus)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 dark:text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold">Belum ada akun guru wali kelas terdaftar.</p>
                    <p className="text-xs mt-1">Silakan gunakan tombol "Tambah Guru Wali Kelas" untuk menambahkan akun guru Anda.</p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isCurrent = t.id === currentUser.id;
                  const isUserActive = (t.status || 'aktif') === 'aktif';

                  return (
                    <tr
                      key={t.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/30 font-medium'
                          : isUserActive
                          ? 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          : 'bg-gray-50/80 dark:bg-slate-800/30 opacity-70'
                      }`}
                    >
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                              t.role === 'admin' ? 'bg-amber-500 shadow-xs' : 'bg-indigo-600 shadow-xs'
                            }`}
                          >
                            {t.role === 'admin' ? 'ADM' : t.assignedClass?.replace('Kelas ', 'K') || 'GK'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-black text-gray-900 dark:text-white">{t.name}</p>
                              {isCurrent && (
                                <span className="text-[9px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-slate-400">NIP. {t.nip || '-'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-gray-800 dark:text-slate-300 text-xs">
                          <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-none">{t.email}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyEmail(t.email)}
                            title="Salin Email Guru"
                            className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            {copiedEmail === t.email ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            t.role === 'admin'
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                              : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300'
                          }`}
                        >
                          {t.role === 'admin' ? '👑 Admin / Kepsek' : 'Guru Wali Kelas'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {t.role === 'admin' ? (
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">Semua Kelas (1-6)</span>
                        ) : t.assignedClass ? (
                          <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-slate-700">
                            {t.assignedClass}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-slate-500 italic">Belum ditentukan</span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold text-xs">
                            {t.pin || '1234'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickPin(t)}
                            title="Ubah PIN Guru Ini"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(t.id)}
                          title="Klik untuk ubah status aktif/nonaktif"
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                            isUserActive
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{isUserActive ? 'Aktif' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Edit Guru */}
                          <button
                            type="button"
                            id={`btn-edit-guru-${t.id}`}
                            onClick={() => handleOpenEdit(t)}
                            title="Edit Data Akun Guru & PIN"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* Tombol Hapus Guru */}
                          <button
                            type="button"
                            id={`btn-hapus-guru-${t.id}`}
                            onClick={() => setDeletingTeacher(t)}
                            disabled={isCurrent && teachers.length > 1}
                            title={isCurrent ? "Tidak dapat menghapus akun Anda sendiri yang sedang aktif" : "Hapus Akun Guru"}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                              isCurrent && teachers.length > 1
                                ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 border-gray-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                                : 'bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD / EDIT TEACHER OR ADMIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-lg w-full p-6 space-y-4 shadow-2xl border-4 border-indigo-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/70 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-base">
                    {editingTeacherId ? 'Edit Data Akun Guru / Admin' : 'Tambah Akun Guru / Admin Baru'}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Masukkan detail informasi akun, kelas binaan, dan PIN login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              {/* Role Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Peran / Hak Akses Pengguna: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'guru_wali_kelas' })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      formData.role === 'guru_wali_kelas'
                        ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-indigo-950 dark:text-indigo-200">
                      <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Guru Wali Kelas</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Mengelola 1 kelas binaan</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin', assignedClass: undefined })}
                    className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                      formData.role === 'admin'
                        ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-amber-950 dark:text-amber-200">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Administrator</span>
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">Akses penuh semua kelas (1-6)</p>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar Guru: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Fadli, S.Pd. atau Siti Rahma, S.Pd."
                  className="w-full text-xs font-bold p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Email Resmi Guru (Kredensial Masuk): <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Contoh: guru.k1@sdn01merdekamandiri.sch.id"
                  className="w-full text-xs font-medium p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-white"
                />
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">
                  💡 Guru/Admin akan masuk ke aplikasi e-Rapor menggunakan alamat email ini.
                </p>
              </div>

              {/* PIN INPUT WITH TOGGLE */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1.5">
                <label className="block text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>PIN / Sandi Masuk (4-6 Digit Angka): <span className="text-rose-500">*</span></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPinPassword(!showPinPassword)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                  >
                    {showPinPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPinPassword ? 'Sembunyikan' : 'Lihat PIN'}</span>
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPinPassword ? 'text' : 'password'}
                    maxLength={6}
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full text-sm font-mono font-black p-2.5 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-indigo-950 dark:text-indigo-100 tracking-wider"
                  />
                </div>
                <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                  PIN ini digunakan oleh guru untuk login autentikasi ke dalam sistem e-Rapor. Default awal: <strong>1234</strong>.
                </p>
              </div>

              {/* NIP & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">NIP Guru:</label>
                  <input
                    type="text"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    placeholder="199104152019032008"
                    className="w-full text-xs font-medium p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">No. HP / WhatsApp:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08123456789"
                    className="w-full text-xs font-medium p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Assigned Class & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.role === 'guru_wali_kelas' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Kelas yang Diampu:</label>
                    <select
                      value={formData.assignedClass || 'Kelas 1'}
                      onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value as ClassLevel })}
                      className="w-full text-xs font-bold p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                    >
                      {classList.map((c) => (
                        <option key={c} value={c} className="dark:bg-slate-900 dark:text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Cakupan Kelas:</label>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold text-amber-800 dark:text-amber-300">
                      Semua Kelas (Kelas 1 s/d 6)
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">Status Akun:</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'aktif' | 'nonaktif' })}
                    className="w-full text-xs font-bold p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="aktif" className="dark:bg-slate-900 dark:text-white">Aktif (Dapat Masuk)</option>
                    <option value="nonaktif" className="dark:bg-slate-900 dark:text-white">Nonaktif (Dibekukan)</option>
                  </select>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-guru-form"
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingTeacherId ? 'Simpan Perubahan Data' : 'Simpan Data Guru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK PIN EDIT */}
      {quickPinTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-sm w-full p-6 space-y-4 shadow-2xl border-4 border-indigo-100 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">Ubah PIN Guru</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Ubah PIN autentikasi untuk <strong>{quickPinTeacher.name}</strong>
              </p>
            </div>

            {quickPinError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold">
                {quickPinError}
              </div>
            )}

            <form onSubmit={handleSaveQuickPin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
                  Masukkan PIN Baru (4-6 Digit):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={quickPinInput}
                  onChange={(e) => setQuickPinInput(e.target.value)}
                  placeholder="1234"
                  className="w-full text-center text-lg font-mono font-black p-3 bg-gray-50 dark:bg-slate-800 border-2 border-indigo-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 text-indigo-950 dark:text-indigo-100 tracking-widest"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickPinTeacher(null)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#4F46E5] hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Simpan PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET TEACHERS CONFIRMATION */}
      {isResetTeachersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl border-4 border-rose-100 dark:border-rose-950">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">Kosongkan Daftar Guru?</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                Tindakan ini akan menghapus semua akun guru selain akun Administrator Anda (<strong>Fadli, S.Pd.</strong>), sehingga Anda dapat mengisinya kembali dari awal.
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-black text-gray-900 dark:text-white">Akun yang Dipertahankan:</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold">👑 Fadli, S.Pd. (Administrator)</p>
              <p className="text-gray-500 dark:text-slate-400 font-mono">fadli46046@gmail.com</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetTeachersModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetTeachers}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Kosongkan Data Guru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE TEACHER CONFIRMATION */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] max-w-md w-full p-6 space-y-4 shadow-2xl border-4 border-rose-100 dark:border-rose-950">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-gray-900 dark:text-white text-base">Hapus Akun Pengguna?</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Tindakan ini tidak dapat dibatalkan. Data akun berikut akan dihapus dari sistem e-Rapor:
              </p>
            </div>

            <div className="p-3.5 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 text-xs space-y-1">
              <p className="font-black text-gray-900 dark:text-white">{deletingTeacher.name}</p>
              <p className="text-gray-600 dark:text-slate-400 font-mono">{deletingTeacher.email}</p>
              <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                {deletingTeacher.role === 'admin' ? '👑 Administrator / Kepala Sekolah' : `Guru Wali ${deletingTeacher.assignedClass || 'Kelas'}`}
              </p>
              <p className="text-[11px] text-gray-500 font-mono">PIN Masuk: {deletingTeacher.pin || '1234'}</p>
            </div>

            {deletingTeacher.id === currentUser.id && teachers.length > 1 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-bold">
                ⚠️ Anda sedang login dengan akun ini.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-teacher"
                disabled={deletingTeacher.id === currentUser.id && teachers.length > 1}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Ya, Hapus Akun Guru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

