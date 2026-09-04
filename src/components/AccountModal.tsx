import React, { useState, useEffect } from 'react';
import { TeacherAccount, ClassLevel } from '../types';
import {
  UserCheck,
  Shield,
  ShieldAlert,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  CheckCircle2,
  X,
  LogIn,
  Users,
  Settings,
  AlertCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: TeacherAccount | null;
  teachers: TeacherAccount[];
  onSelectUser: (user: TeacherAccount) => void;
  onLogout?: () => void;
  onOpenAdminSettings?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  teachers,
  onSelectUser,
  onLogout,
  onOpenAdminSettings,
}) => {
  // Login form state
  const [emailInput, setEmailInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Mode: 'profile' (if logged in) or 'login' (manual email input)
  const [viewMode, setViewMode] = useState<'profile' | 'login'>(currentUser ? 'profile' : 'login');
  const [showEmailDirectory, setShowEmailDirectory] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setViewMode(currentUser ? 'profile' : 'login');
      setEmailInput('');
      setPinInput('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Manual Email & PIN Authentication
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPin = pinInput.trim();

    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email yang telah didaftarkan oleh admin.');
      return;
    }

    setIsSubmitting(true);

    // Search in registered teachers by email or username
    const foundTeacher = teachers.find(
      (t) =>
        t.email?.trim().toLowerCase() === cleanEmail ||
        t.username?.trim().toLowerCase() === cleanEmail
    );

    if (!foundTeacher) {
      setIsSubmitting(false);
      setErrorMessage(
        `Email "${emailInput.trim()}" belum didaftarkan oleh Admin Sekolah. Silakan hubungi Administrator untuk mendaftarkan akun guru Anda.`
      );
      return;
    }

    if (foundTeacher.status === 'nonaktif') {
      setIsSubmitting(false);
      setErrorMessage('Akun ini sedang dinonaktifkan oleh Admin Sekolah.');
      return;
    }

    // Verify PIN if teacher has a PIN set
    if (foundTeacher.pin && foundTeacher.pin.trim() !== '') {
      if (cleanPin !== foundTeacher.pin.trim()) {
        setIsSubmitting(false);
        setErrorMessage('PIN / Kata Sandi yang Anda masukkan salah. Silakan periksa kembali.');
        return;
      }
    }

    // Authentication Success
    setIsSubmitting(false);
    setSuccessMessage(`Berhasil masuk sebagai ${foundTeacher.name}!`);

    setTimeout(() => {
      onSelectUser(foundTeacher);
      onClose();
    }, 700);
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleFillEmail = (teacher: TeacherAccount) => {
    setEmailInput(teacher.email);
    setPinInput(teacher.pin || '1234');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl border-4 border-indigo-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#4F46E5] text-white p-6 sm:p-7 relative overflow-hidden shrink-0">
          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Dialog"
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-yellow-400 text-black rounded-2xl shadow-md rotate-2 shrink-0">
              <Lock className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-700/80 text-yellow-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <Shield className="w-3 h-3" />
                <span>Autentikasi Email Guru e-Rapor</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {viewMode === 'login' ? 'Masuk dengan Email Terdaftar' : 'Profil & Hak Akses Guru'}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-1">
          {/* VIEW MODE: PROFILE SUMMARY (If user is currently logged in) */}
          {viewMode === 'profile' && currentUser && (
            <div className="space-y-5 animate-fadeIn">
              {/* Active Profile Card */}
              <div className="p-5 bg-gradient-to-br from-indigo-50/90 to-blue-50/70 border-2 border-indigo-200 rounded-3xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${
                        currentUser.role === 'admin' ? 'bg-amber-500' : 'bg-[#4F46E5]'
                      }`}
                    >
                      {currentUser.role === 'admin'
                        ? 'ADM'
                        : currentUser.assignedClass?.replace('Kelas ', 'K') || 'GK'}
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          currentUser.role === 'admin'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                        }`}
                      >
                        {currentUser.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3 text-amber-700" />
                            <span>Administrator / Kepala Sekolah</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3 text-indigo-700" />
                            <span>Wali {currentUser.assignedClass}</span>
                          </>
                        )}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                        {currentUser.name}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-mono text-gray-800">{currentUser.email}</span>
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aktif</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-indigo-100 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">NIP</span>
                    <strong className="text-gray-900 font-mono">{currentUser.nip || '-'}</strong>
                  </div>
                  <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Akses Kelas</span>
                    <strong className="text-indigo-900 font-bold">
                      {currentUser.role === 'admin' ? 'Semua Kelas (1-6)' : `Terkunci di ${currentUser.assignedClass}`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  id="btn-switch-account-email"
                  onClick={() => {
                    setViewMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 p-3.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
                >
                  <Mail className="w-4 h-4 text-yellow-300" />
                  <span>Masuk dengan Email Guru Lain</span>
                </button>

                {currentUser.role === 'admin' && onOpenAdminSettings && (
                  <button
                    type="button"
                    id="btn-manage-teachers-admin"
                    onClick={() => {
                      onClose();
                      onOpenAdminSettings();
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-2 border-indigo-200 rounded-2xl text-xs font-bold transition-all"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Kelola & Daftarkan Email Guru Baru (Admin)</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    type="button"
                    id="btn-logout-session"
                    onClick={() => {
                      onLogout();
                      setViewMode('login');
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 p-3 text-rose-700 hover:bg-rose-50 border-2 border-rose-200 rounded-2xl text-xs font-bold transition-all"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Keluar (Logout) dari Akun Ini</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW MODE: MANUAL EMAIL LOGIN FORM */}
          {viewMode === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-4 animate-fadeIn">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed font-medium">
                <p>
                  🔐 <strong>Masuk Resmi e-Rapor:</strong> Masukkan alamat <strong>email manual</strong> yang telah didaftarkan oleh Administrator sekolah beserta PIN pengaman.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border-2 border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900 font-bold animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-900 font-bold animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Email Input Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Alamat Email Guru Terdaftar:</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  id="input-manual-teacher-email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Contoh: siti.aisyah@sdn01merdekamandiri.sch.id"
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-300 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden transition-all"
                  autoFocus
                />
              </div>

              {/* PIN / Password Input Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-gray-800 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    <span>PIN / Kata Sandi (4-6 Digit):</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-gray-500 font-medium">PIN Bawaan: 1234</span>
                </div>
                <input
                  type="password"
                  required
                  maxLength={10}
                  id="input-manual-teacher-pin"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Ketik PIN akun..."
                  className="w-full p-3.5 bg-gray-50 border-2 border-gray-300 rounded-2xl text-xs sm:text-sm font-mono font-bold tracking-widest text-gray-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 outline-hidden transition-all text-center sm:text-left"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-manual-login"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 p-3.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-yellow-300" />
                  <span>{isSubmitting ? 'Memverifikasi Email...' : 'Masuk ke Sistem e-Rapor'}</span>
                </button>
              </div>

              {/* Back to active user if user clicked 'ganti akun' by mistake */}
              {currentUser && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('profile')}
                    className="text-xs text-gray-500 hover:text-indigo-600 font-bold underline"
                  >
                    Kembali ke Profil Aktif ({currentUser.name})
                  </button>
                </div>
              )}

              {/* Collapsible Registered Email Reference (For School Teachers & Testing) */}
              <div className="pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowEmailDirectory(!showEmailDirectory)}
                  className="w-full flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-[11px] font-bold text-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-indigo-700">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Lihat Daftar Email Guru Terdaftar di SDN 01 Merdeka Mandiri ({teachers.length} Akun)</span>
                  </span>
                  {showEmailDirectory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showEmailDirectory && (
                  <div className="mt-2.5 space-y-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 text-xs animate-fadeIn max-h-52 overflow-y-auto">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">
                      Klik salah satu untuk mengisi form email secara otomatis:
                    </p>
                    {teachers.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleFillEmail(t)}
                        className="p-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-gray-900 truncate">{t.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                t.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {t.role === 'admin' ? 'Admin' : t.assignedClass}
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-gray-600 truncate">{t.email}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-1 rounded-lg">
                            Pilih
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 p-4 px-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <span>Hak Akses Terisolasi Per Kelas 🔒</span>
          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-xl shadow-xs"
            >
              Tutup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
