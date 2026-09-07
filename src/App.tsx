import React, { useState, useEffect } from 'react';
import {
  MataPelajaran,
  NilaiSiswaMapel,
  RaporSiswaDetail,
  SchoolProfile,
  Student,
  ClassLevel,
  SystemBackupData,
  TeacherAccount,
  P5Project,
  P5StudentScore,
  AuditLogItem,
  BackupSnapshot,
} from './types';
import {
  initialSchoolProfile,
  initialStudents,
  initialSubjects,
  initialGrades,
  initialRaporDetails,
  initialTeachers,
  initialP5Projects,
  initialP5Scores,
} from './data/initialData';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { GradebookView } from './components/GradebookView';
import { AINarasiView } from './components/AINarasiView';
import { P5ProjectView } from './components/P5ProjectView';
import { CetakRaporView } from './components/CetakRaporView';
import { TarikDataSiswaView } from './components/TarikDataSiswaView';
import { WhatsAppGatewayView } from './components/WhatsAppGatewayView';
import { DapodikSyncView } from './components/DapodikSyncView';
import { BankTPView } from './components/BankTPView';
import { AuditTrailView } from './components/AuditTrailView';
import { CloudSyncView } from './components/CloudSyncView';
import { KomparasiKurikulumView } from './components/KomparasiKurikulumView';
import { PengaturanView } from './components/PengaturanView';
import { AccountModal } from './components/AccountModal';
import { LoginView } from './components/LoginView';

export function App() {
  // Main Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pengaturanSubTab, setPengaturanSubTab] = useState<'identitas' | 'guru' | 'backup'>('identitas');

  // Sidebar Layout State (Pinned / Locked Sidebar)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('iihh_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('iihh_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Teachers State & User Authentication
  const [teachers, setTeachers] = useState<TeacherAccount[]>(() => {
    const saved = localStorage.getItem('iihh_teachers');
    return saved ? JSON.parse(saved) : initialTeachers;
  });

  const [currentUser, setCurrentUser] = useState<TeacherAccount | null>(() => {
    const saved = localStorage.getItem('iihh_current_user');
    return saved ? JSON.parse(saved) : initialTeachers[0]; // Default: Admin
  });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('iihh_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  // Sync Dark Mode class with documentElement
  useEffect(() => {
    localStorage.setItem('iihh_dark_mode', String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Active Class Level for multi-class support across all 6 grades
  const [activeClassLevel, setActiveClassLevel] = useState<ClassLevel>(() => {
    const saved = localStorage.getItem('iihh_active_class');
    return (saved as ClassLevel) || 'Kelas 4';
  });

  // School profile state
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('iihh_school_profile');
    return saved ? JSON.parse(saved) : initialSchoolProfile;
  });

  // Students roster state
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('iihh_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  // Subjects state
  const [subjects, setSubjects] = useState<MataPelajaran[]>(() => {
    const saved = localStorage.getItem('iihh_subjects');
    return saved ? JSON.parse(saved) : initialSubjects;
  });

  // Grades database state
  const [grades, setGrades] = useState<NilaiSiswaMapel[]>(() => {
    const saved = localStorage.getItem('iihh_grades');
    return saved ? JSON.parse(saved) : initialGrades;
  });

  // Rapor extra details (attendance, extracurricular, notes)
  const [raporDetails, setRaporDetails] = useState<Record<string, RaporSiswaDetail>>(() => {
    const saved = localStorage.getItem('iihh_rapor_details');
    return saved ? JSON.parse(saved) : initialRaporDetails;
  });

  // P5 Projects & Scores State
  const [p5Projects, setP5Projects] = useState<P5Project[]>(() => {
    const saved = localStorage.getItem('iihh_p5_projects');
    return saved ? JSON.parse(saved) : initialP5Projects;
  });

  const [p5Scores, setP5Scores] = useState<P5StudentScore[]>(() => {
    const saved = localStorage.getItem('iihh_p5_scores');
    return saved ? JSON.parse(saved) : initialP5Scores;
  });

  // Audit Logs & Snapshots State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('iihh_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'log-init-1',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentId: 'std-1',
        studentName: 'Ahmad Fauzan',
        subjectName: 'Matematika',
        action: 'Ubah Nilai LM',
        detail: 'Memperbarui skor Sumatif LM 1 dari 85 menjadi 95',
        oldValue: 85,
        newValue: 95,
        userName: 'Fadli, S.Pd (Wali Kelas)',
      },
      {
        id: 'log-init-2',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        studentId: 'std-1',
        studentName: 'Ahmad Fauzan',
        subjectName: 'Semua Mapel',
        action: 'Generate AI Narasi',
        detail: 'Menghasilkan capaian narasi rapor otomatis dengan Gemini AI',
        userName: 'Fadli, S.Pd (Wali Kelas)',
      },
    ];
  });

  const [snapshots, setSnapshots] = useState<BackupSnapshot[]>(() => {
    const saved = localStorage.getItem('iihh_snapshots');
    return saved ? JSON.parse(saved) : [];
  });

  // Active student & subject pointer for deep-linking across views
  const [activeTargetStudentId, setActiveTargetStudentId] = useState<string>(students[0]?.id || 'std-1');
  const [activeTargetSubjectId, setActiveTargetSubjectId] = useState<string>(subjects[3]?.id || 'mapel-4');

  // Persist states to local storage
  useEffect(() => {
    localStorage.setItem('iihh_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('iihh_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('iihh_active_class', activeClassLevel);
  }, [activeClassLevel]);

  useEffect(() => {
    localStorage.setItem('iihh_school_profile', JSON.stringify(schoolProfile));
  }, [schoolProfile]);

  useEffect(() => {
    localStorage.setItem('iihh_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('iihh_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('iihh_grades', JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem('iihh_rapor_details', JSON.stringify(raporDetails));
  }, [raporDetails]);

  useEffect(() => {
    localStorage.setItem('iihh_p5_projects', JSON.stringify(p5Projects));
  }, [p5Projects]);

  useEffect(() => {
    localStorage.setItem('iihh_p5_scores', JSON.stringify(p5Scores));
  }, [p5Scores]);

  useEffect(() => {
    localStorage.setItem('iihh_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('iihh_snapshots', JSON.stringify(snapshots));
  }, [snapshots]);

  // Audit Logger Helper
  const logAudit = (action: AuditLogItem['action'], detail: string, studentName = 'Sistem', subjectName = '-', oldValue?: any, newValue?: any) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      studentId: 'std-sys',
      studentName,
      subjectName,
      action,
      detail,
      oldValue,
      newValue,
      userName: currentUser?.name || 'Administrator',
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 199)]);
  };

  // Role Access Guard: Ensure class switching respects Guru Wali Kelas restriction
  const handleSelectClassLevel = (classLevel: ClassLevel) => {
    if (currentUser && currentUser.role === 'guru_wali_kelas' && currentUser.assignedClass) {
      if (classLevel !== currentUser.assignedClass) {
        alert(
          `🔒 Akses Terbatas:\nAnda saat ini login sebagai ${currentUser.name} (Wali ${currentUser.assignedClass}).\n\nDemi menjaga keamanan, kerahasiaan, dan privasi data rapor antar kelas, Anda hanya dapat mengelola data ${currentUser.assignedClass}.`
        );
        return;
      }
    }
    setActiveClassLevel(classLevel);
  };

  // Update teachers list and sync current user if updated
  const handleUpdateTeachers = (updatedTeachers: TeacherAccount[]) => {
    setTeachers(updatedTeachers);
    if (currentUser) {
      const updatedSelf = updatedTeachers.find((t) => t.id === currentUser.id);
      if (updatedSelf) {
        setCurrentUser(updatedSelf);
      }
    }
  };

  // Switch Active User Account
  const handleSwitchUser = (user: TeacherAccount) => {
    setCurrentUser(user);
    if (user.role === 'guru_wali_kelas' && user.assignedClass) {
      setActiveClassLevel(user.assignedClass);
      setSchoolProfile((prev) => ({
        ...prev,
        teacherName: user.name,
        teacherNIP: user.nip,
      }));
    }
  };

  // User Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('iihh_current_user');
  };

  // Handlers for Grade Updates
  const handleUpdateGrade = (updatedGrade: NilaiSiswaMapel) => {
    setGrades((prev) => {
      const idx = prev.findIndex(
        (g) => g.studentId === updatedGrade.studentId && g.subjectId === updatedGrade.subjectId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedGrade;
        return next;
      }
      return [...prev, updatedGrade];
    });
  };

  const handleBatchUpdateGrades = (updatedList: NilaiSiswaMapel[]) => {
    setGrades(updatedList);
    logAudit('Batch Fill', `Memperbarui ${updatedList.length} entri nilai siswa`);
  };

  // Student details update in roster
  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
    logAudit('Ubah Nilai LM', `Memperbarui biodata siswa ${updatedStudent.name}`, updatedStudent.name);
  };

  // Quick jump from Gradebook to AI Generator for a specific student/subject
  const handleOpenAIGenerator = (studentId: string, subjectId: string) => {
    setActiveTargetStudentId(studentId);
    setActiveTargetSubjectId(subjectId);
    setActiveTab('ai-narasi');
  };

  // Update Rapor Student Extra Details
  const handleUpdateRaporDetail = (studentId: string, detail: RaporSiswaDetail) => {
    setRaporDetails((prev) => ({
      ...prev,
      [studentId]: detail,
    }));
  };

  const handleUpdateAllRaporDetails = (newDetails: Record<string, RaporSiswaDetail>) => {
    setRaporDetails(newDetails);
    logAudit('Sinkron Dapodik', 'Menyelaraskan data presensi siswa dari SDK Ogomojolo ke e-Rapor');
  };

  // Register students imported directly from Ogomojolo Attendance SDK
  const handleRegisterStudentsFromOgomojolo = (
    newStudents: Student[],
    newDetails: Record<string, RaporSiswaDetail>
  ) => {
    setStudents((prev) => {
      const existingMap = new Map(prev.map((s) => [s.nisn || s.id, s]));
      newStudents.forEach((ns) => {
        existingMap.set(ns.nisn || ns.id, ns);
      });
      return Array.from(existingMap.values());
    });

    setRaporDetails((prev) => ({
      ...prev,
      ...newDetails,
    }));

    // Auto-create empty grade entries for these students for all active subjects
    setGrades((prev) => {
      const existingGradeKeys = new Set(prev.map((g) => `${g.studentId}_${g.subjectId}`));
      const newGradeEntries: NilaiSiswaMapel[] = [];
      newStudents.forEach((std) => {
        subjects.forEach((subj) => {
          const key = `${std.id}_${subj.id}`;
          if (!existingGradeKeys.has(key)) {
            newGradeEntries.push({
              studentId: std.id,
              subjectId: subj.id,
              formatifScores: [],
              sumatifLM: (subj.tujuanPembelajaran || []).map((tp) => ({
                tpId: tp.id,
                tpCode: tp.code || 'TP',
                tpDescription: tp.description,
                score: 0,
              })),
              sumatifSAS: 0,
              rataRataLM: 0,
              nilaiAkhir: 0,
              predikat: 'Perlu Bimbingan',
              narasiRapor: '',
            });
          }
        });
      });
      return [...prev, ...newGradeEntries];
    });

    logAudit('Sinkron Ogomojolo', `Mendaftarkan ${newStudents.length} siswa dan menyelaraskan absensi dari SDK Ogomojolo`);
  };

  // Synchronize ALL student profile data AND attendance records from Ogomojolo SDK
  const handleSyncAllFromOgomojolo = (
    updatedStudents: Student[],
    updatedDetails: Record<string, RaporSiswaDetail>,
    newStudentsAdded: Student[]
  ) => {
    setStudents(updatedStudents);
    setRaporDetails(updatedDetails);

    if (newStudentsAdded.length > 0) {
      setGrades((prev) => {
        const existingGradeKeys = new Set(prev.map((g) => `${g.studentId}_${g.subjectId}`));
        const newGradeEntries: NilaiSiswaMapel[] = [];
        newStudentsAdded.forEach((std) => {
          subjects.forEach((subj) => {
            const key = `${std.id}_${subj.id}`;
            if (!existingGradeKeys.has(key)) {
              newGradeEntries.push({
                studentId: std.id,
                subjectId: subj.id,
                formatifScores: [80, 85],
                formatifNotes: 'Pengamatan harian dan keaktifan',
                sumatifLM: (subj.tujuanPembelajaran || []).map((tp) => ({
                  tpId: tp.id,
                  tpCode: tp.code || 'TP',
                  tpDescription: tp.description,
                  score: 80,
                })),
                sumatifSAS: 80,
                rataRataLM: 80,
                nilaiAkhir: 80,
                predikat: 'Baik',
                narasiRapor: `Ananda ${std.name} menunjukkan penguasaan yang baik pada mata pelajaran ${subj.name}.`,
                isAIGenerated: false,
              });
            }
          });
        });
        return [...prev, ...newGradeEntries];
      });
    }

    logAudit(
      'Sinkron Ogomojolo',
      `Menyalin seluruh data siswa (${updatedStudents.length} siswa) dan kehadiran dari SDK Ogomojolo`
    );
  };

  // Completely wipe all dummy/local data for a fresh clean start
  const handleClearAllData = () => {
    localStorage.removeItem('iihh_students');
    localStorage.removeItem('iihh_grades');
    localStorage.removeItem('iihh_rapor_details');
    localStorage.removeItem('iihh_p5_scores');
    setStudents([]);
    setGrades([]);
    setRaporDetails({});
    setP5Scores([]);
    logAudit('Sinkron Ogomojolo', 'Membersihkan semua data dummy siswa dan nilai lokal untuk persiapan transfer data baru');
  };

  // Snapshot Creation Handler
  const handleCreateSnapshot = (title: string, description: string) => {
    const currentBackup: SystemBackupData = {
      version: '2.5',
      exportDate: new Date().toISOString(),
      schoolProfile,
      activeClassLevel,
      students,
      subjects,
      grades,
      raporDetails,
      p5Projects,
      p5Scores,
      teachers,
      currentUser: currentUser || undefined,
    };

    const newSnapshot: BackupSnapshot = {
      id: `snap-${Date.now()}`,
      createdAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      title,
      description,
      studentCount: students.length,
      gradesCount: grades.length,
      data: currentBackup,
    };

    setSnapshots((prev) => [newSnapshot, ...prev]);
    logAudit('Impor Excel', `Membuat titik pemulihan Snapshot: ${title}`);
  };

  // Restore Snapshot / Full Backup
  const handleImportFullBackup = (backup: SystemBackupData) => {
    if (backup.schoolProfile) setSchoolProfile(backup.schoolProfile);
    if (backup.students && Array.isArray(backup.students)) setStudents(backup.students);
    if (backup.subjects && Array.isArray(backup.subjects)) setSubjects(backup.subjects);
    if (backup.grades && Array.isArray(backup.grades)) setGrades(backup.grades);
    if (backup.raporDetails) setRaporDetails(backup.raporDetails);
    if (backup.activeClassLevel) setActiveClassLevel(backup.activeClassLevel);
    if (backup.teachers && Array.isArray(backup.teachers)) setTeachers(backup.teachers);
    if (backup.currentUser) setCurrentUser(backup.currentUser);
    if (backup.p5Projects && Array.isArray(backup.p5Projects)) setP5Projects(backup.p5Projects);
    if (backup.p5Scores && Array.isArray(backup.p5Scores)) setP5Scores(backup.p5Scores);
    logAudit('Impor Excel', 'Memulihkan cadangan data sistem (Restore Full)');
  };

  // Reset to default sample dataset
  const handleResetToDefault = () => {
    setSchoolProfile(initialSchoolProfile);
    setStudents(initialStudents);
    setSubjects(initialSubjects);
    setGrades(initialGrades);
    setRaporDetails(initialRaporDetails);
    setP5Projects(initialP5Projects);
    setP5Scores(initialP5Scores);
    setTeachers(initialTeachers);
    setCurrentUser(initialTeachers[0]);
    setActiveClassLevel('Kelas 4');
    localStorage.clear();
    logAudit('Impor Excel', 'Mereset sistem ke pengaturan awal');
  };

  const completedNarrativesCount = grades.filter((g) => g.narasiRapor && g.narasiRapor.trim().length > 10).length;

  const currentBackupData: SystemBackupData = {
    version: '2.5',
    exportDate: new Date().toISOString(),
    schoolProfile,
    activeClassLevel,
    students,
    subjects,
    grades,
    raporDetails,
    p5Projects,
    p5Scores,
    teachers,
    currentUser: currentUser || undefined,
  };

  // Show dedicated Login Screen if no active user session
  if (!currentUser) {
    return (
      <LoginView
        schoolProfile={schoolProfile}
        teachers={teachers}
        onLoginSuccess={handleSwitchUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] dark:bg-[#060913] text-gray-900 dark:text-slate-100 flex flex-row font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200" id="iihh-app-root">
      {/* Pinned Left Sidebar Navigation (Locked & Sticky) */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSelectTab={(tab) => setActiveTab(tab)}
        totalStudents={students.length}
        schoolProfile={schoolProfile}
        activeClassLevel={activeClassLevel}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="print:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-fadeIn"
        />
      )}

      {/* Main Right Content Body */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <Header
          schoolProfile={schoolProfile}
          completedNarrativesCount={completedNarrativesCount}
          totalStudents={students.length}
          totalSubjects={subjects.length}
          activeClassLevel={activeClassLevel}
          onSelectClassLevel={handleSelectClassLevel}
          currentUser={currentUser}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onToggleCollapseSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              schoolProfile={schoolProfile}
              students={students}
              subjects={subjects}
              grades={grades}
              activeClassLevel={activeClassLevel}
              currentUser={currentUser}
              onSelectClassLevel={handleSelectClassLevel}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {(activeTab === 'buku-nilai' || activeTab === 'gradebook') && (
            <GradebookView
              students={students}
              subjects={subjects}
              grades={grades}
              activeClassLevel={activeClassLevel}
              currentUser={currentUser}
              onSelectClassLevel={handleSelectClassLevel}
              onUpdateGrade={handleUpdateGrade}
              onBatchUpdateGrades={handleBatchUpdateGrades}
              onOpenAIGenerator={handleOpenAIGenerator}
            />
          )}

          {activeTab === 'ai-narasi' && (
            <AINarasiView
              students={students}
              subjects={subjects}
              grades={grades}
              schoolProfile={schoolProfile}
              activeClassLevel={activeClassLevel}
              currentUser={currentUser}
              onSelectClassLevel={handleSelectClassLevel}
              initialStudentId={activeTargetStudentId}
              initialSubjectId={activeTargetSubjectId}
              onUpdateGrade={handleUpdateGrade}
              onBatchUpdateGrades={handleBatchUpdateGrades}
            />
          )}

          {(activeTab === 'projek-p5' || activeTab === 'p5-project') && (
            <P5ProjectView
              students={students}
              projects={p5Projects}
              scores={p5Scores}
              activeClassLevel={activeClassLevel}
              schoolProfile={schoolProfile}
              onUpdateProjects={setP5Projects}
              onUpdateScores={setP5Scores}
              onSelectClassLevel={handleSelectClassLevel}
              onNavigateToPrint={() => setActiveTab('cetak-rapor')}
            />
          )}

          {(activeTab === 'tarik-data' || activeTab === 'tarik-data-siswa' || activeTab === 'ogomojolo-sync' || activeTab === 'tarik') && (
            <TarikDataSiswaView
              students={students}
              raporDetails={raporDetails}
              activeClassLevel={activeClassLevel}
              schoolProfile={schoolProfile}
              currentUser={currentUser}
              onSelectClassLevel={handleSelectClassLevel}
              onRegisterStudentsFromOgomojolo={handleRegisterStudentsFromOgomojolo}
              onSyncAllFromOgomojolo={handleSyncAllFromOgomojolo}
              onClearAllDummyData={handleClearAllData}
              onNavigateToCetakRapor={() => setActiveTab('cetak-rapor')}
              onNavigateToImporNilai={() => setActiveTab('dapodik-sync')}
            />
          )}

          {activeTab === 'cetak-rapor' && (
            <CetakRaporView
              students={students}
              subjects={subjects}
              grades={grades}
              schoolProfile={schoolProfile}
              raporDetails={raporDetails}
              p5Projects={p5Projects}
              p5Scores={p5Scores}
              activeClassLevel={activeClassLevel}
              currentUser={currentUser}
              initialStudentId={activeTargetStudentId}
              onSelectClassLevel={handleSelectClassLevel}
              onUpdateRaporDetail={handleUpdateRaporDetail}
              onUpdateAllRaporDetails={handleUpdateAllRaporDetails}
              onUpdateStudent={handleUpdateStudent}
              onUpdateSchoolProfile={setSchoolProfile}
              onRegisterStudentsFromOgomojolo={handleRegisterStudentsFromOgomojolo}
              onSyncAllFromOgomojolo={handleSyncAllFromOgomojolo}
              onClearAllDummyData={handleClearAllData}
            />
          )}

          {(activeTab === 'whatsapp' || activeTab === 'whatsapp-gateway') && (
            <WhatsAppGatewayView
              students={students}
              subjects={subjects}
              grades={grades}
              schoolProfile={schoolProfile}
              raporDetails={raporDetails}
              activeClassLevel={activeClassLevel}
              onSelectClassLevel={handleSelectClassLevel}
              currentUser={currentUser}
              teachers={teachers}
              onUpdateSchoolProfile={setSchoolProfile}
            />
          )}

          {(activeTab === 'dapodik' || activeTab === 'dapodik-sync' || activeTab === 'impor-nilai') && (
            <DapodikSyncView
              students={students}
              subjects={subjects}
              grades={grades}
              raporDetails={raporDetails}
              schoolProfile={schoolProfile}
              activeClassLevel={activeClassLevel}
              onSelectClassLevel={handleSelectClassLevel}
              onImportStudents={(newStudents) => {
                setStudents(newStudents);
              }}
              onUpdateGrades={(newGrades) => {
                setGrades((prev) => {
                  const updated = [...prev];
                  newGrades.forEach((ng) => {
                    const idx = updated.findIndex((g) => g.studentId === ng.studentId && g.subjectId === ng.subjectId);
                    if (idx >= 0) {
                      updated[idx] = { ...updated[idx], ...ng };
                    } else {
                      updated.push(ng);
                    }
                  });
                  return updated;
                });
                logAudit('Impor Excel', `Mengimpor nilai mata pelajaran untuk ${newGrades.length} baris nilai`);
              }}
              onNavigateToTarikData={() => setActiveTab('tarik-data')}
            />
          )}

          {activeTab === 'bank-tp' && (
            <BankTPView
              subjects={subjects}
              activeClassLevel={activeClassLevel}
              currentUser={currentUser}
              onSelectClassLevel={handleSelectClassLevel}
              onUpdateSubjects={setSubjects}
            />
          )}

          {(activeTab === 'audit-log' || activeTab === 'audit-trail') && (
            <AuditTrailView
              auditLogs={auditLogs}
              snapshots={snapshots}
              currentData={currentBackupData}
              activeClassLevel={activeClassLevel}
              onRestoreSnapshot={handleImportFullBackup}
              onCreateSnapshot={handleCreateSnapshot}
              onDeleteSnapshot={(snapshotId) => {
                setSnapshots((prev) => prev.filter((s) => s.id !== snapshotId));
              }}
              onClearLogs={() => setAuditLogs([])}
            />
          )}

          {(activeTab === 'cloud-sync' || activeTab === 'cloud') && (
            <CloudSyncView
              currentData={currentBackupData}
              currentUser={currentUser}
              activeClassLevel={activeClassLevel}
              schoolProfile={schoolProfile}
              onApplyCloudData={handleImportFullBackup}
              onRegisterStudentsFromOgomojolo={handleRegisterStudentsFromOgomojolo}
              onSyncAllFromOgomojolo={handleSyncAllFromOgomojolo}
              onClearAllDummyData={handleClearAllData}
            />
          )}

          {(activeTab === 'komparasi' || activeTab === 'komparasi-kurikulum') && (
            <KomparasiKurikulumView />
          )}

          {activeTab === 'pengaturan' && (
            <PengaturanView
              schoolProfile={schoolProfile}
              students={students}
              subjects={subjects}
              grades={grades}
              raporDetails={raporDetails}
              activeClassLevel={activeClassLevel}
              teachers={teachers}
              currentUser={currentUser}
              onUpdateSchoolProfile={setSchoolProfile}
              onUpdateTeachers={handleUpdateTeachers}
              onImportFullBackup={handleImportFullBackup}
              onResetToDefault={handleResetToDefault}
              onSelectClassLevel={handleSelectClassLevel}
              onSwitchUser={handleSwitchUser}
              initialSubTab={pengaturanSubTab}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-900 border-t-2 border-indigo-100 dark:border-slate-800 py-5 px-6 text-center text-xs text-gray-500 dark:text-slate-400 print:hidden mt-8 transition-colors">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-yellow-400 rounded-md flex items-center justify-center font-black text-black text-xs">
                i
              </div>
              <p className="font-bold text-gray-800 dark:text-slate-200">
                iihh Beres • Sistem Penilaian & e-Rapor Kurikulum Merdeka Sekolah Dasar
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500 dark:text-slate-400">
              <span>Login: <strong className="text-indigo-600 dark:text-indigo-400">{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Admin' : currentUser.assignedClass})</span>
              <span>•</span>
              <span>Hak Akses Terisolasi 🔒</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Account Switcher & Security Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        teachers={teachers}
        currentUser={currentUser}
        onSelectUser={handleSwitchUser}
        onLogout={handleLogout}
        onOpenAdminSettings={() => {
          setActiveTab('pengaturan');
          setPengaturanSubTab('guru');
        }}
      />
    </div>
  );
}
export default App;
