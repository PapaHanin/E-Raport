export type ClassLevel = 'Kelas 1' | 'Kelas 2' | 'Kelas 3' | 'Kelas 4' | 'Kelas 5' | 'Kelas 6';

export type Fase = 'Fase A (Kelas 1-2)' | 'Fase B (Kelas 3-4)' | 'Fase C (Kelas 5-6)';

export function getFaseByClass(gradeLevel: string): Fase {
  if (gradeLevel.includes('1') || gradeLevel.includes('2')) {
    return 'Fase A (Kelas 1-2)';
  }
  if (gradeLevel.includes('3') || gradeLevel.includes('4')) {
    return 'Fase B (Kelas 3-4)';
  }
  return 'Fase C (Kelas 5-6)';
}

export function isIPASActiveForClass(gradeLevel: string): boolean {
  // Kurikulum Merdeka: IPAS only exists in Fase B (Kelas 3-4) and Fase C (Kelas 5-6)
  // For Kelas 1 & 2 (Fase A), IPAS is NOT taught / excluded.
  if (gradeLevel.includes('1') || gradeLevel.includes('2') || gradeLevel === 'Kelas 1' || gradeLevel === 'Kelas 2') {
    return false;
  }
  return true;
}

export type JenisKelamin = 'L' | 'P';

export type Predikat = 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Bimbingan';

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  gender: JenisKelamin;
  gradeLevel: ClassLevel | string; // e.g. "Kelas 4", "Kelas 1"
  fase: Fase;
  parentName: string;
  parentPhone: string; // e.g. "6281234567890"
  address: string;
  birthDate?: string;
  birthPlace?: string;
  nik?: string;
  religion?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
  previousSchool?: string;
  rtRw?: string;
  village?: string;
  district?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
  parentAddress?: string;
  guardianName?: string;
  guardianJob?: string;
  avatar?: string;
}

export interface TujuanPembelajaran {
  id: string;
  code: string; // e.g. "TP 1", "TP 2"
  description: string; // e.g. "Memahami konsep pecahan senilai dan operasi hitung dasar"
  subjectId: string;
  lingkupMateri: string; // e.g. "Pecahan dan Operasi Hitung"
  fase?: Fase;
}

export interface MataPelajaran {
  id: string;
  code: string;
  name: string;
  category: 'Wajib' | 'Muatan Lokal' | 'Pilihan';
  fase: Fase;
  isOnlyFaseBC?: boolean; // True for IPAS (only Kelas 3-6)
  tujuanPembelajaran: TujuanPembelajaran[];
  customLmCount?: number; // Optional custom LM count (default 4)
}

export interface GradeConfig {
  lmWeightPercent: number; // e.g. 60
  sasWeightPercent: number; // e.g. 40
  defaultLmCount: number; // e.g. 4
  kkmThreshold: number; // e.g. 75
}

export interface NilaiSiswaMapel {
  studentId: string;
  subjectId: string;
  // Formatif (Assessment as/for learning)
  formatifScores: number[]; // e.g. [85, 88, 90]
  formatifNotes?: string;
  
  // Sumatif Lingkup Materi (LM)
  sumatifLM: {
    tpId: string;
    tpCode: string;
    tpDescription: string;
    score: number;
  }[];
  
  // Sumatif Akhir Semester (SAS)
  sumatifSAS: number;
  
  // Computed values
  rataRataLM: number; // Average of LM scores
  nilaiAkhir: number; // (rataRataLM * (lmWeight/100)) + (sumatifSAS * (sasWeight/100))
  predikat: Predikat;
  
  // TP references
  highestTPId?: string;
  highestTPDescription?: string;
  lowestTPId?: string;
  lowestTPDescription?: string;
  
  // Deskripsi Narasi Rapor (Kemdikbudristek)
  narasiRapor: string;
  isAIGenerated?: boolean;
  lastGeneratedAt?: string;
}

export interface EkstrakurikulerItem {
  id: string;
  name: string;
  predicate: 'Sangat Baik' | 'Baik' | 'Cukup';
  description: string;
}

export interface PresensiSiswa {
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
}

export interface RaporSiswaDetail {
  studentId: string;
  catatanWaliKelas: string;
  statusKenaikan: 'Naik ke Kelas Berikutnya' | 'Melanjutkan di Fase Ini' | 'Lulus';
  ekstrakurikuler: EkstrakurikulerItem[];
  presensi: PresensiSiswa;
  tinggiBadan?: number; // cm
  beratBadan?: number; // kg
  kondisiKesehatan?: string;
}

export type SignatureMode = 'manual' | 'qr_code' | 'digital_image';

export interface ClassTeacherSignature {
  teacherSignImage?: string;
  customTeacherQrImage?: string;
}

export interface SignatureSettings {
  mode: SignatureMode; // 'manual' = ruang kosong pulpen, 'qr_code' = QR barcode BSRE e-Sign, 'digital_image' = scan TTD & Cap
  teacherSignImage?: string;
  headmasterSignImage?: string;
  customTeacherQrImage?: string;
  customHeadmasterQrImage?: string;
  teacherSignatureImage?: string;
  headmasterSignatureImage?: string;
  schoolStampImage?: string;
  showSchoolStamp?: boolean;
  qrValidationText?: string;
  // Per-class teacher signatures map (e.g. { 'Kelas 1': { teacherSignImage: '...' }, 'Kelas 4': { ... } })
  classTeacherSignatures?: Partial<Record<ClassLevel, ClassTeacherSignature>>;
}

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  nss: string;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  website: string;
  email: string;
  headmasterName: string;
  headmasterNIP: string;
  teacherName: string;
  teacherNIP: string;
  academicYear: string; // e.g. "2024/2025"
  semester: '1 (Ganjil)' | '2 (Genap)';
  reportDate: string; // e.g. "20 Desember 2024"
  placeDate: string; // e.g. "Jakarta, 20 Desember 2024"
  activeClassLevel?: ClassLevel;
  signatureSettings?: SignatureSettings;
}

export type UserRole = 'admin' | 'guru_wali_kelas' | 'guru_mapel';

export interface TeacherAccount {
  id: string;
  name: string;
  nip: string;
  email: string;
  username: string;
  pin?: string;
  role: UserRole;
  assignedClass?: ClassLevel; // e.g. 'Kelas 1', 'Kelas 2', etc. Only for guru_wali_kelas
  assignedSubjectId?: string; // For guru_mapel (e.g. 'mapel-7' for PJOK, 'mapel-1' for PAI, 'mapel-8' for Bahasa Inggris)
  assignedSubjectName?: string; // e.g. 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)'
  assignedClasses?: ClassLevel[]; // Multi-class teaching capability (e.g. Kelas 1-6)
  phone?: string;
  avatar?: string;
  status: 'aktif' | 'nonaktif';
  lastLogin?: string;
}

// Audit Trail & Activity Log
export interface AuditLogItem {
  id: string;
  timestamp: string;
  studentId: string;
  studentName: string;
  subjectName?: string;
  action: 'Ubah Nilai LM' | 'Ubah Nilai SAS' | 'Batch Fill' | 'Generate AI Narasi' | 'Impor Excel' | 'Kenaikan Kelas' | 'Sinkron Dapodik' | 'Sinkron Ogomojolo';
  detail: string;
  oldValue?: string | number;
  newValue?: string | number;
  userName: string;
}

export type AuditLog = AuditLogItem;

export interface BackupSnapshot {
  id: string;
  createdAt: string;
  title: string;
  description: string;
  studentCount: number;
  gradesCount: number;
  data: SystemBackupData;
}

// P5 (Projek Penguatan Profil Pelajar Pancasila)
export type P5Predikat = 'MB' | 'SB' | 'BSH' | 'SAB'; // Mulai Berkembang, Sedang Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang

export interface P5SubElement {
  id: string;
  code: string;
  name: string;
  targetFase: string;
}

export interface P5Dimension {
  id: string;
  name: 'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia'
    | 'Berkebinekaan Global'
    | 'Bergotong Royong'
    | 'Mandiri'
    | 'Bernalar Kritis'
    | 'Kreatif';
  elements: {
    id: string;
    name: string;
    subElements: P5SubElement[];
  }[];
}

export interface P5Project {
  id: string;
  title: string;
  theme: 'Gaya Hidup Berkelanjutan'
    | 'Kearifan Lokal'
    | 'Bhinneka Tunggal Ika'
    | 'Bangunlah Jiwa dan Raganya'
    | 'Rekayasa dan Teknologi'
    | 'Kewirausahaan';
  description: string;
  academicYear: string;
  semester: '1 (Ganjil)' | '2 (Genap)';
  classLevel: ClassLevel;
  dimensions: {
    dimensionName: string;
    subElements: {
      id: string;
      code: string;
      title: string;
      targetCapai: string;
    }[];
  }[];
}

export interface P5StudentScore {
  studentId: string;
  projectId: string;
  scores: Record<string, P5Predikat>; // subElementId -> MB|SB|BSH|SAB
  catatanProses: string;
}

export interface CloudSyncState {
  isConfigured: boolean;
  lastSyncedAt?: string;
  isSyncing: boolean;
  syncStatus: 'synced' | 'pending' | 'offline' | 'error';
  autoSyncEnabled: boolean;
  cloudSyncId: string;
}

export interface SystemBackupData {
  appVersion?: string;
  version?: string;
  timestamp?: string;
  exportDate?: string;
  exportedAt?: string;
  updatedAt?: string;
  schoolProfile: SchoolProfile;
  activeClassLevel: ClassLevel;
  students: Student[];
  subjects: MataPelajaran[];
  grades: NilaiSiswaMapel[];
  raporDetails: Record<string, RaporSiswaDetail>;
  gradeConfig?: GradeConfig;
  p5Projects?: P5Project[];
  p5Scores?: P5StudentScore[];
  teachers?: TeacherAccount[];
  currentUser?: TeacherAccount;
  auditLogs?: AuditLogItem[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'gradebook'
  | 'ai-narasi'
  | 'projek-p5'
  | 'tarik-data'
  | 'cetak-rapor'
  | 'whatsapp-gateway'
  | 'dapodik-sync'
  | 'bank-tp'
  | 'audit-log'
  | 'cloud-sync'
  | 'komparasi-kurikulum'
  | 'pengaturan';

export interface OgomojoloAttendanceRecord {
  id?: string;
  nisn: string;
  namaSiswa: string;
  kelas: string; // e.g. "Kelas 4", "4"
  semester?: number | string;
  tahunAjaran?: string;
  sakit: number;
  izin: number;
  tanpaKeterangan: number;
  updatedAt?: string;
  catatan?: string;

  // Data Profil Siswa Lengkap yang Disalin dari SDK Ogomojolo
  nis?: string;
  gender?: 'L' | 'P';
  jenisKelamin?: 'L' | 'P' | string;
  jk?: 'L' | 'P' | string;
  parentName?: string;
  namaOrtu?: string;
  namaAyah?: string;
  namaIbu?: string;
  parentPhone?: string;
  noHp?: string;
  telepon?: string;
  address?: string;
  alamat?: string;
  birthDate?: string;
  tanggalLahir?: string;
  birthPlace?: string;
  tempatLahir?: string;
  nik?: string;
  religion?: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | string;
  agama?: string;
  avatar?: string;
  fatherJob?: string;
  motherJob?: string;
  guardianName?: string;
}

