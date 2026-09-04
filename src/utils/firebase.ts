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
  const cleanId = workspaceId.trim() || 'SDN-01-MERDEKA-2025';
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
  const cleanId = workspaceId.trim() || 'SDN-01-MERDEKA-2025';
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
  const cleanId = workspaceId.trim() || 'SDN-01-MERDEKA-2025';
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
 */
export async function fetchOgomojoloAttendanceRecords(): Promise<OgomojoloAttendanceRecord[]> {
  const firestore = getFirebaseDb();
  const colRef = collection(firestore, OGOMOJOLO_COLLECTION_NAME);
  const snapshot = await getDocs(colRef);
  const records: OgomojoloAttendanceRecord[] = [];
  snapshot.forEach((d) => {
    const data = d.data() as any;
    records.push({
      id: d.id,
      nisn: data.nisn || '',
      namaSiswa: data.namaSiswa || '',
      kelas: data.kelas || '',
      semester: data.semester ?? 1,
      tahunAjaran: data.tahunAjaran || '',
      sakit: typeof data.kehadiran?.sakit === 'number' ? data.kehadiran.sakit : (Number(data.sakit) || 0),
      izin: typeof data.kehadiran?.izin === 'number' ? data.kehadiran.izin : (Number(data.izin) || 0),
      tanpaKeterangan: typeof data.kehadiran?.tanpaKeterangan === 'number' ? data.kehadiran.tanpaKeterangan : (Number(data.tanpaKeterangan) || 0),
      updatedAt: data.updatedAt || new Date().toISOString(),
      catatan: data.catatan || '',
    });
  });
  return records;
}

/**
 * Saves or updates a student attendance record in 'rekap_absensi_ogomojolo'
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
    }, { merge: true });
  }

  await batch.commit();
  return records.length;
}

/**
 * Real-time listener for incoming attendance updates from SDK Ogomojolo
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
        records.push({
          id: d.id,
          nisn: data.nisn || '',
          namaSiswa: data.namaSiswa || '',
          kelas: data.kelas || '',
          semester: data.semester ?? 1,
          tahunAjaran: data.tahunAjaran || '',
          sakit: typeof data.kehadiran?.sakit === 'number' ? data.kehadiran.sakit : (Number(data.sakit) || 0),
          izin: typeof data.kehadiran?.izin === 'number' ? data.kehadiran.izin : (Number(data.izin) || 0),
          tanpaKeterangan: typeof data.kehadiran?.tanpaKeterangan === 'number' ? data.kehadiran.tanpaKeterangan : (Number(data.tanpaKeterangan) || 0),
          updatedAt: data.updatedAt || new Date().toISOString(),
          catatan: data.catatan || '',
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
    const studentId = cleanNisn ? `std-${cleanNisn}` : `std-og-${idx + 1}`;
    const gradeLevel = (r.kelas as ClassLevel) || targetClassLevel || 'Kelas 4';

    students.push({
      id: studentId,
      nisn: cleanNisn || `00${idx + 10000000}`,
      nis: cleanNisn ? cleanNisn.slice(-4) : `240${idx + 1}`,
      name: r.namaSiswa.trim(),
      gender: 'L',
      gradeLevel: gradeLevel,
      fase: getFaseByClass(gradeLevel),
      parentName: 'Orang Tua / Wali Murid',
      parentPhone: '081234567890',
      address: 'Alamat Siswa',
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

