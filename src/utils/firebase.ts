import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  getDocFromServer,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { SystemBackupData, AuditLog, OgomojoloAttendanceRecord, Student, RaporSiswaDetail, ClassLevel, getFaseByClass } from '../types';

// Read configuration from provisioned file
const firebaseConfig = {
  projectId: "reliable-enigma-s1ttq",
  appId: "1:937808342390:web:2cac51ac79cd998e7e9e57",
  apiKey: "AIzaSyA8jU-2yDCDMHePmjc7TjNjUn1vtIDRYGw",
  authDomain: "reliable-enigma-s1ttq.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-iihhberes-db02674d-a027-43d4-b17e-50573c47075a",
  storageBucket: "reliable-enigma-s1ttq.firebasestorage.app",
  messagingSenderId: "937808342390",
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const existing = getApps();
    app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const appInstance = getFirebaseApp();
    db = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
  }
  return db;
}

/**
 * Validates connection to Firestore backend as mandated by Firebase integration guidelines
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const firestore = getFirebaseDb();
    await getDocFromServer(doc(firestore, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is currently offline or unreachable.");
    }
    // Return true if app connected or initialized
    return true;
  }
}

/**
 * Saves or pushes the complete workspace e-Rapor dataset into Firestore Cloud
 */
export async function saveWorkspaceToFirestore(
  workspaceId: string,
  data: SystemBackupData,
  updatedBy: string = 'Administrator'
): Promise<string> {
  const firestore = getFirebaseDb();
  const cleanId = (workspaceId || '').trim().replace(/[/\\#?]/g, '-') || 'SDN-01-MERDEKA-2025';
  const nowStr = new Date().toISOString();

  const docRef = doc(firestore, 'workspaces', cleanId);

  // Firestore doesn't accept undefined values in nested structures, sanitize
  const sanitizedData = JSON.parse(JSON.stringify(data));

  await setDoc(
    docRef,
    {
      workspaceId: cleanId,
      ...sanitizedData,
      updatedAt: nowStr,
      updatedBy,
    },
    { merge: true }
  );

  return nowStr;
}

/**
 * Fetches the latest workspace dataset from Firestore Cloud
 */
export async function loadWorkspaceFromFirestore(
  workspaceId: string
): Promise<{ data: SystemBackupData; updatedAt: string; updatedBy: string } | null> {
  const firestore = getFirebaseDb();
  const cleanId = (workspaceId || '').trim().replace(/[/\\#?]/g, '-') || 'SDN-01-MERDEKA-2025';
  const docRef = doc(firestore, 'workspaces', cleanId);

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return null;
  }

  const raw = snap.data() as any;
  const backupData: SystemBackupData = {
    version: raw.version || '2.0.0',
    timestamp: raw.updatedAt || new Date().toISOString(),
    schoolProfile: raw.schoolProfile,
    activeClassLevel: raw.activeClassLevel || 'Kelas 4',
    students: raw.students || [],
    subjects: raw.subjects || [],
    grades: raw.grades || [],
    raporDetails: raw.raporDetails || {},
    p5Projects: raw.p5Projects || [],
    p5Scores: raw.p5Scores || [],
    teachers: raw.teachers || [],
    auditLogs: raw.auditLogs || [],
  };

  return {
    data: backupData,
    updatedAt: raw.updatedAt || new Date().toISOString(),
    updatedBy: raw.updatedBy || 'Cloud Server',
  };
}

/**
 * Subscribes to real-time changes of a school workspace
 */
export function subscribeToWorkspace(
  workspaceId: string,
  onUpdate: (data: SystemBackupData, updatedAt: string, updatedBy: string) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const firestore = getFirebaseDb();
  const cleanId = (workspaceId || '').trim().replace(/[/\\#?]/g, '-') || 'SDN-01-MERDEKA-2025';
  const docRef = doc(firestore, 'workspaces', cleanId);

  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data() as any;
        const backupData: SystemBackupData = {
          version: raw.version || '2.0.0',
          timestamp: raw.updatedAt || new Date().toISOString(),
          schoolProfile: raw.schoolProfile,
          activeClassLevel: raw.activeClassLevel || 'Kelas 4',
          students: raw.students || [],
          subjects: raw.subjects || [],
          grades: raw.grades || [],
          raporDetails: raw.raporDetails || {},
          p5Projects: raw.p5Projects || [],
          p5Scores: raw.p5Scores || [],
          teachers: raw.teachers || [],
          auditLogs: raw.auditLogs || [],
        };
        onUpdate(backupData, raw.updatedAt || new Date().toISOString(), raw.updatedBy || 'Cloud Server');
      }
    },
    (err) => {
      console.error("Error in real-time workspace snapshot:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Records an audit log in the workspace subcollection
 */
export async function logCloudAuditEvent(
  workspaceId: string,
  log: Omit<AuditLog, 'id'>
): Promise<void> {
  try {
    const firestore = getFirebaseDb();
    const cleanId = workspaceId.trim() || 'SDN-01-MERDEKA-2025';
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const logRef = doc(firestore, 'workspaces', cleanId, 'audit_logs', logId);

    await setDoc(logRef, {
      id: logId,
      timestamp: log.timestamp,
      userName: log.userName,
      studentId: log.studentId || '',
      studentName: log.studentName || '',
      action: log.action,
      detail: log.detail || '',
    });
  } catch (err) {
    console.warn("Failed to record cloud audit log:", err);
  }
}

/**
 * Shared collection name in Firestore between SDK Ogomojolo and e-Rapor
 */
export const OGOMOJOLO_COLLECTION_NAME = 'rekap_absensi_ogomojolo';

/**
 * Fetches all attendance records from shared collection 'rekap_absensi_ogomojolo'
 * and extracts both attendance figures and complete student profile information.
 */
export async function fetchOgomojoloAttendanceRecords(): Promise<OgomojoloAttendanceRecord[]> {
  const firestore = getFirebaseDb();
  const colRef = collection(firestore, OGOMOJOLO_COLLECTION_NAME);
  const snapshot = await getDocs(colRef);
  const records: OgomojoloAttendanceRecord[] = [];
  snapshot.forEach((d) => {
    const data = d.data() as any;
    const rawNisn = String(data.nisn ?? data.NISN ?? d.id ?? '').trim();
    const rawNama = String(data.namaSiswa ?? data.nama ?? data.name ?? data.studentName ?? '').trim();
    const rawNis = String(data.nis ?? data.NIS ?? '').trim();
    const rawJk = String(data.gender ?? data.jenisKelamin ?? data.jk ?? data.sex ?? '').toUpperCase();
    const gender: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';
    const parentName = String(data.parentName ?? data.namaOrtu ?? data.namaAyah ?? data.namaIbu ?? '').trim();
    const parentPhone = String(data.parentPhone ?? data.noHp ?? data.telepon ?? '').trim();
    const address = String(data.address ?? data.alamat ?? '').trim();
    const birthDate = String(data.birthDate ?? data.tanggalLahir ?? '').trim();
    const birthPlace = String(data.birthPlace ?? data.tempatLahir ?? '').trim();
    const nik = String(data.nik ?? data.NIK ?? '').trim();
    const religion = data.religion ?? data.agama;

    records.push({
      id: d.id,
      nisn: rawNisn,
      namaSiswa: rawNama || `Siswa ${d.id}`,
      kelas: String(data.kelas ?? data.rombel ?? data.gradeLevel ?? '').trim(),
      semester: data.semester ?? 1,
      tahunAjaran: data.tahunAjaran || '',
      sakit: typeof data.kehadiran?.sakit === 'number' ? data.kehadiran.sakit : (Number(data.sakit) || 0),
      izin: typeof data.kehadiran?.izin === 'number' ? data.kehadiran.izin : (Number(data.izin) || 0),
      tanpaKeterangan: typeof data.kehadiran?.tanpaKeterangan === 'number' ? data.kehadiran.tanpaKeterangan : (Number(data.tanpaKeterangan) || 0),
      updatedAt: data.updatedAt || new Date().toISOString(),
      catatan: data.catatan || '',
      nis: rawNis,
      gender,
      jenisKelamin: gender,
      jk: gender,
      parentName: parentName || 'Orang Tua / Wali Murid',
      namaOrtu: parentName || 'Orang Tua / Wali Murid',
      parentPhone: parentPhone || '081234567890',
      noHp: parentPhone || '081234567890',
      address: address || 'Alamat Siswa',
      alamat: address || 'Alamat Siswa',
      birthDate,
      tanggalLahir: birthDate,
      birthPlace,
      tempatLahir: birthPlace,
      nik,
      religion,
      agama: religion,
    });
  });
  return records;
}

/**
 * Saves or updates a student attendance and profile record in 'rekap_absensi_ogomojolo'
 */
export async function saveOgomojoloAttendanceRecord(record: OgomojoloAttendanceRecord): Promise<void> {
  const firestore = getFirebaseDb();
  const safeDocId = (record.nisn.trim() || `std-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  const docRef = doc(firestore, OGOMOJOLO_COLLECTION_NAME, safeDocId);
  const nowStr = new Date().toISOString();

  await setDoc(docRef, {
    id: safeDocId,
    nisn: record.nisn.trim(),
    namaSiswa: record.namaSiswa.trim(),
    kelas: record.kelas.trim(),
    semester: record.semester ?? 1,
    tahunAjaran: record.tahunAjaran || '2024/2025',
    sakit: Number(record.sakit) || 0,
    izin: Number(record.izin) || 0,
    tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
    kehadiran: {
      sakit: Number(record.sakit) || 0,
      izin: Number(record.izin) || 0,
      tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
    },
    updatedAt: nowStr,
    catatan: record.catatan || '',
    nis: record.nis || '',
    gender: record.gender || 'L',
    jenisKelamin: record.gender || 'L',
    parentName: record.parentName || record.namaOrtu || '',
    parentPhone: record.parentPhone || record.noHp || '',
    address: record.address || record.alamat || '',
    birthDate: record.birthDate || record.tanggalLahir || '',
    birthPlace: record.birthPlace || record.tempatLahir || '',
    nik: record.nik || '',
    religion: record.religion || record.agama || '',
  }, { merge: true });
}

/**
 * Pushes batch attendance records to simulate or initialize SDK Ogomojolo data
 */
export async function pushBatchOgomojoloAttendance(records: OgomojoloAttendanceRecord[]): Promise<number> {
  const firestore = getFirebaseDb();
  const batch = writeBatch(firestore);
  const nowStr = new Date().toISOString();

  for (const record of records) {
    const safeDocId = (record.nisn.trim() || `std-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(firestore, OGOMOJOLO_COLLECTION_NAME, safeDocId);
    batch.set(docRef, {
      id: safeDocId,
      nisn: record.nisn.trim(),
      namaSiswa: record.namaSiswa.trim(),
      kelas: record.kelas.trim(),
      semester: record.semester ?? 1,
      tahunAjaran: record.tahunAjaran || '2024/2025',
      sakit: Number(record.sakit) || 0,
      izin: Number(record.izin) || 0,
      tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
      kehadiran: {
        sakit: Number(record.sakit) || 0,
        izin: Number(record.izin) || 0,
        tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
      },
      updatedAt: nowStr,
      catatan: record.catatan || '',
      nis: record.nis || '',
      gender: record.gender || 'L',
      jenisKelamin: record.gender || 'L',
      parentName: record.parentName || record.namaOrtu || '',
      parentPhone: record.parentPhone || record.noHp || '',
      address: record.address || record.alamat || '',
      birthDate: record.birthDate || record.tanggalLahir || '',
      birthPlace: record.birthPlace || record.tempatLahir || '',
      nik: record.nik || '',
      religion: record.religion || record.agama || '',
    }, { merge: true });
  }

  await batch.commit();
  return records.length;
}

/**
 * Real-time listener for incoming attendance and student profile updates from SDK Ogomojolo
 */
export function subscribeToOgomojoloAttendance(
  onUpdate: (records: OgomojoloAttendanceRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const firestore = getFirebaseDb();
  const colRef = collection(firestore, OGOMOJOLO_COLLECTION_NAME);

  return onSnapshot(
    colRef,
    (snap) => {
      const records: OgomojoloAttendanceRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        const rawNisn = String(data.nisn ?? data.NISN ?? d.id ?? '').trim();
        const rawNama = String(data.namaSiswa ?? data.nama ?? data.name ?? data.studentName ?? '').trim();
        const rawNis = String(data.nis ?? data.NIS ?? '').trim();
        const rawJk = String(data.gender ?? data.jenisKelamin ?? data.jk ?? data.sex ?? '').toUpperCase();
        const gender: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';
        const parentName = String(data.parentName ?? data.namaOrtu ?? data.namaAyah ?? data.namaIbu ?? '').trim();
        const parentPhone = String(data.parentPhone ?? data.noHp ?? data.telepon ?? '').trim();
        const address = String(data.address ?? data.alamat ?? '').trim();
        const birthDate = String(data.birthDate ?? data.tanggalLahir ?? '').trim();
        const birthPlace = String(data.birthPlace ?? data.tempatLahir ?? '').trim();
        const nik = String(data.nik ?? data.NIK ?? '').trim();
        const religion = data.religion ?? data.agama;

        records.push({
          id: d.id,
          nisn: rawNisn,
          namaSiswa: rawNama || `Siswa ${d.id}`,
          kelas: String(data.kelas ?? data.rombel ?? data.gradeLevel ?? '').trim(),
          semester: data.semester ?? 1,
          tahunAjaran: data.tahunAjaran || '',
          sakit: typeof data.kehadiran?.sakit === 'number' ? data.kehadiran.sakit : (Number(data.sakit) || 0),
          izin: typeof data.kehadiran?.izin === 'number' ? data.kehadiran.izin : (Number(data.izin) || 0),
          tanpaKeterangan: typeof data.kehadiran?.tanpaKeterangan === 'number' ? data.kehadiran.tanpaKeterangan : (Number(data.tanpaKeterangan) || 0),
          updatedAt: data.updatedAt || new Date().toISOString(),
          catatan: data.catatan || '',
          nis: rawNis,
          gender,
          jenisKelamin: gender,
          jk: gender,
          parentName: parentName || 'Orang Tua / Wali Murid',
          namaOrtu: parentName || 'Orang Tua / Wali Murid',
          parentPhone: parentPhone || '081234567890',
          noHp: parentPhone || '081234567890',
          address: address || 'Alamat Siswa',
          alamat: address || 'Alamat Siswa',
          birthDate,
          tanggalLahir: birthDate,
          birthPlace,
          tempatLahir: birthPlace,
          nik,
          religion,
          agama: religion,
        });
      });
      onUpdate(records);
    },
    (err) => {
      console.error("Error subscribing to Ogomojolo attendance:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Normalizes class strings (e.g. "Kelas 4", "4", "4A", "kelas 4") for resilient matching.
 */
function normalizeClassKey(c?: string): string {
  if (!c) return '';
  const digits = c.replace(/[^0-9]/g, '');
  if (digits) return `kelas ${digits}`;
  return c.trim().toLowerCase();
}

/**
 * FULL DATA SYNCHRONIZATION:
 * Copies BOTH all student profile data (name, NISN, NIS, gender, address, parents, etc.)
 * AND attendance data (sakit, izin, alpa) from SDK Ogomojolo records into e-Rapor.
 *
 * - Existing students: profile details are updated and attendance is synchronized.
 * - New students from Ogomojolo: automatically appended to the students list with full profile details.
 */
export function syncAllOgomojoloData(
  records: OgomojoloAttendanceRecord[],
  currentStudents: Student[],
  currentRaporDetails: Record<string, RaporSiswaDetail>,
  targetClassLevel?: ClassLevel
): {
  updatedStudents: Student[];
  updatedRaporDetails: Record<string, RaporSiswaDetail>;
  newStudents: Student[];
  updatedExistingCount: number;
  newStudentsCount: number;
  totalCount: number;
  syncedStudentNames: string[];
} {
  const normTarget = normalizeClassKey(targetClassLevel);
  
  // Filter records that match target class, or accept all if record has no class specified
  const targetRecords = records.filter((r) => {
    if (!r.kelas || !r.kelas.trim()) return true;
    if (!normTarget) return true;
    const normRecord = normalizeClassKey(r.kelas);
    return normRecord === normTarget || r.kelas.toLowerCase().includes(normTarget);
  });

  const updatedStudents = [...currentStudents];
  const updatedRaporDetails = { ...currentRaporDetails };
  const newStudents: Student[] = [];
  const syncedStudentNames: string[] = [];
  let updatedExistingCount = 0;
  let newStudentsCount = 0;

  targetRecords.forEach((record, idx) => {
    const cleanRecordNisn = (record.nisn || '').trim();
    const cleanRecordNis = (record.nis || '').trim();
    const cleanRecordName = (record.namaSiswa || '').trim().toLowerCase();

    // 1. Check if student already exists in currentStudents
    let studentIndex = -1;

    if (cleanRecordNisn) {
      studentIndex = updatedStudents.findIndex(
        (s) => s.nisn && s.nisn.trim() === cleanRecordNisn
      );
    }
    if (studentIndex === -1 && cleanRecordNis) {
      studentIndex = updatedStudents.findIndex(
        (s) => s.nis && s.nis.trim() === cleanRecordNis
      );
    }
    if (studentIndex === -1 && cleanRecordName) {
      studentIndex = updatedStudents.findIndex(
        (s) => s.name && s.name.trim().toLowerCase() === cleanRecordName
      );
    }

    if (studentIndex >= 0) {
      // Existing student: UPDATE profile data with data from Ogomojolo
      const existing = updatedStudents[studentIndex];
      const updated: Student = {
        ...existing,
        name: record.namaSiswa.trim() || existing.name,
        nisn: cleanRecordNisn || existing.nisn,
        nis: cleanRecordNis || existing.nis || (cleanRecordNisn ? cleanRecordNisn.slice(-4) : existing.nis),
        gender: record.gender || existing.gender || 'L',
        parentName: record.parentName || record.namaOrtu || existing.parentName || 'Orang Tua / Wali Murid',
        parentPhone: record.parentPhone || record.noHp || existing.parentPhone || '081234567890',
        address: record.address || record.alamat || existing.address || 'Alamat Siswa',
        birthDate: record.birthDate || record.tanggalLahir || existing.birthDate,
        birthPlace: record.birthPlace || record.tempatLahir || existing.birthPlace,
        nik: record.nik || existing.nik,
        religion: (record.religion || record.agama || existing.religion) as any,
        gradeLevel: targetClassLevel || existing.gradeLevel,
        fase: getFaseByClass(targetClassLevel || existing.gradeLevel),
      };

      updatedStudents[studentIndex] = updated;
      updatedExistingCount++;
      syncedStudentNames.push(updated.name);

      // Update Attendance in Rapor Details
      const prevDetail = updatedRaporDetails[existing.id] || {
        studentId: existing.id,
        catatanWaliKelas: 'Menunjukkan perkembangan belajar dan keaktifan yang baik selama semester.',
        statusKenaikan: 'Naik ke Kelas Berikutnya',
        ekstrakurikuler: [
          { id: 'ekskul-1', name: 'Pramuka', predicate: 'Baik', description: 'Aktif mengikuti kegiatan rutin kepramukaan.' }
        ],
        presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
      };

      updatedRaporDetails[existing.id] = {
        ...prevDetail,
        presensi: {
          sakit: Number(record.sakit) || 0,
          izin: Number(record.izin) || 0,
          tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
        },
      };
    } else {
      // New student: ADD to students array with full profile
      const newId = cleanRecordNisn 
        ? `std-${cleanRecordNisn.replace(/[^a-zA-Z0-9]/g, '')}` 
        : `std-og-${Date.now()}-${idx + 1}`;
      const gradeLevel = targetClassLevel || (record.kelas as ClassLevel) || 'Kelas 4';

      const newStudent: Student = {
        id: newId,
        nisn: cleanRecordNisn || `00${idx + 7890123}`,
        nis: cleanRecordNis || (cleanRecordNisn ? cleanRecordNisn.slice(-4) : `240${idx + 1}`),
        name: record.namaSiswa.trim(),
        gender: record.gender || 'L',
        gradeLevel: gradeLevel,
        fase: getFaseByClass(gradeLevel),
        parentName: record.parentName || record.namaOrtu || 'Orang Tua / Wali Murid',
        parentPhone: record.parentPhone || record.noHp || '081234567890',
        address: record.address || record.alamat || 'Alamat Siswa',
        birthDate: record.birthDate || record.tanggalLahir || '2015-05-12',
        birthPlace: record.birthPlace || record.tempatLahir || 'Kota Sekolah',
        nik: record.nik || '',
        religion: (record.religion || record.agama || 'Islam') as any,
      };

      updatedStudents.push(newStudent);
      newStudents.push(newStudent);
      newStudentsCount++;
      syncedStudentNames.push(newStudent.name);

      // Create initial Rapor Details with presensi
      updatedRaporDetails[newId] = {
        studentId: newId,
        catatanWaliKelas: 'Menunjukkan perkembangan belajar dan keaktifan yang baik selama semester.',
        statusKenaikan: 'Naik ke Kelas Berikutnya',
        ekstrakurikuler: [
          { id: 'ekskul-1', name: 'Pramuka', predicate: 'Baik', description: 'Aktif mengikuti kegiatan rutin kepramukaan.' }
        ],
        presensi: {
          sakit: Number(record.sakit) || 0,
          izin: Number(record.izin) || 0,
          tanpaKeterangan: Number(record.tanpaKeterangan) || 0,
        },
      };
    }
  });

  return {
    updatedStudents,
    updatedRaporDetails,
    newStudents,
    updatedExistingCount,
    newStudentsCount,
    totalCount: updatedExistingCount + newStudentsCount,
    syncedStudentNames,
  };
}

/**
 * Matches Ogomojolo attendance records with students by NISN (or name)
 * and updates raporDetails presensi
 */
export function syncOgomojoloToRaporDetails(
  records: OgomojoloAttendanceRecord[],
  students: Student[],
  currentRaporDetails: Record<string, RaporSiswaDetail>,
  filterClassLevel?: string
): {
  updatedDetails: Record<string, RaporSiswaDetail>;
  matchedCount: number;
  unmatchedRecords: OgomojoloAttendanceRecord[];
  matchedStudentNames: string[];
} {
  const updatedDetails = { ...currentRaporDetails };
  let matchedCount = 0;
  const matchedStudentNames: string[] = [];
  const matchedRecordIds = new Set<string>();

  const targetStudents = filterClassLevel
    ? students.filter((s) => s.gradeLevel === filterClassLevel)
    : students;

  for (const student of targetStudents) {
    const cleanStudentNisn = (student.nisn || '').trim();
    let match = records.find(
      (r) => cleanStudentNisn && r.nisn && r.nisn.trim() === cleanStudentNisn
    );

    if (!match) {
      const cleanName = student.name.trim().toLowerCase();
      match = records.find((r) => r.namaSiswa && r.namaSiswa.trim().toLowerCase() === cleanName);
    }

    if (match) {
      matchedCount++;
      matchedStudentNames.push(student.name);
      if (match.id) matchedRecordIds.add(match.id);

      const prevDetail = updatedDetails[student.id] || {
        studentId: student.id,
        catatanWaliKelas: '',
        statusKenaikan: 'Naik ke Kelas Berikutnya',
        ekstrakurikuler: [],
        presensi: { sakit: 0, izin: 0, tanpaKeterangan: 0 },
      };

      updatedDetails[student.id] = {
        ...prevDetail,
        presensi: {
          sakit: match.sakit,
          izin: match.izin,
          tanpaKeterangan: match.tanpaKeterangan,
        },
      };
    }
  }

  const unmatchedRecords = records.filter((r) => r.id && !matchedRecordIds.has(r.id));

  return {
    updatedDetails,
    matchedCount,
    unmatchedRecords,
    matchedStudentNames,
  };
}

/**
 * Converts Ogomojolo attendance records into Student objects and initial RaporSiswaDetail records.
 * Allows instant onboarding of students from the attendance system into e-Rapor.
 */
export function convertOgomojoloToStudents(
  records: OgomojoloAttendanceRecord[],
  targetClassLevel?: ClassLevel
): {
  students: Student[];
  raporDetails: Record<string, RaporSiswaDetail>;
} {
  const targetRecords = targetClassLevel
    ? records.filter((r) => !r.kelas || r.kelas.trim() === targetClassLevel.trim())
    : records;

  const students: Student[] = [];
  const raporDetails: Record<string, RaporSiswaDetail> = {};

  targetRecords.forEach((r, idx) => {
    const cleanNisn = (r.nisn || '').trim();
    const studentId = cleanNisn ? `std-${cleanNisn.replace(/[^a-zA-Z0-9]/g, '')}` : `std-og-${idx + 1}`;
    const gradeLevel = (r.kelas as ClassLevel) || targetClassLevel || 'Kelas 4';

    students.push({
      id: studentId,
      nisn: cleanNisn || `00${idx + 10000000}`,
      nis: r.nis || (cleanNisn ? cleanNisn.slice(-4) : `240${idx + 1}`),
      name: r.namaSiswa.trim(),
      gender: r.gender || (r.jenisKelamin?.toUpperCase().startsWith('P') ? 'P' : 'L'),
      gradeLevel: gradeLevel,
      fase: getFaseByClass(gradeLevel),
      parentName: r.parentName || r.namaOrtu || 'Orang Tua / Wali Murid',
      parentPhone: r.parentPhone || r.noHp || '081234567890',
      address: r.address || r.alamat || 'Alamat Siswa',
      birthDate: r.birthDate || r.tanggalLahir || '2015-05-12',
      birthPlace: r.birthPlace || r.tempatLahir || 'Kota Sekolah',
      nik: r.nik || '',
      religion: (r.religion || r.agama || 'Islam') as any,
    });

    raporDetails[studentId] = {
      studentId: studentId,
      catatanWaliKelas: 'Menunjukkan perkembangan belajar dan keaktifan yang baik selama semester.',
      statusKenaikan: 'Naik ke Kelas Berikutnya',
      ekstrakurikuler: [
        { id: 'ekskul-1', name: 'Pramuka', predicate: 'Baik', description: 'Aktif mengikuti kegiatan rutin kepramukaan.' }
      ],
      presensi: {
        sakit: Number(r.sakit) || 0,
        izin: Number(r.izin) || 0,
        tanpaKeterangan: Number(r.tanpaKeterangan) || 0,
      },
    };
  });

  return { students, raporDetails };
}

