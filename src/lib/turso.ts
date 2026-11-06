import { createClient, type Client } from '@libsql/client/web';
import { Hospital, Referral, ReferralStatus } from '../types';

const TURSO_URL = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const TURSO_AUTH_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

const LS_HOSPITALS_KEY = 'emscps_hospitals_data_v1';
const LS_REFERRALS_KEY = 'emscps_referrals_data_v1';

let client: Client | null = null;
let isConnectedToTurso = false;
let initPromise: Promise<boolean> | null = null;
let connectionError: string | null = null;

// Initialize Turso Client if configured
function getTursoClient(): Client | null {
  if (client) return client;
  if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
    return null;
  }
  try {
    client = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
    return client;
  } catch (err: any) {
    console.warn('Failed to initialize Turso client:', err);
    connectionError = err.message || 'Cannot initialize Turso client';
    return null;
  }
}

// LocalStorage helpers for offline / fallback mode
function getLocalHospitals(): Hospital[] {
  try {
    const raw = localStorage.getItem(LS_HOSPITALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHospitals(list: Hospital[]): void {
  try {
    localStorage.setItem(LS_HOSPITALS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage error saving hospitals', e);
  }
}

function getLocalReferrals(): Referral[] {
  try {
    const raw = localStorage.getItem(LS_REFERRALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReferrals(list: Referral[]): void {
  try {
    localStorage.setItem(LS_REFERRALS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage error saving referrals', e);
  }
}

/**
 * Initialize Database (Create tables if not exists)
 */
export async function initDatabase(): Promise<boolean> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = getTursoClient();
    if (!db) {
      isConnectedToTurso = false;
      return false;
    }

    try {
      // 1. Create hospitals table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS hospitals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          province TEXT NOT NULL,
          name TEXT NOT NULL,
          password TEXT NOT NULL
        );
      `);

      // 2. Create referrals table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS referrals (
          id TEXT PRIMARY KEY,
          hospital_id INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          status TEXT DEFAULT 'ສົ່ງແລ້ວ',
          arrived_at TEXT,
          outcome TEXT,
          recorded_by TEXT,
          admission_date TEXT,
          referral_time TEXT,
          origin_phone TEXT,
          patient_name TEXT NOT NULL,
          age TEXT NOT NULL,
          gender TEXT NOT NULL,
          occupation TEXT,
          village TEXT,
          district TEXT,
          province TEXT,
          insurance_type TEXT,
          diagnosis TEXT NOT NULL,
          past_medical_history TEXT,
          current_medications TEXT,
          present_illness TEXT,
          lab_wbc TEXT,
          lab_hct TEXT,
          lab_hb TEXT,
          lab_plt TEXT,
          lab_glucose TEXT,
          lab_creatinine TEXT,
          lab_urea TEXT,
          lab_k TEXT,
          lab_na TEXT,
          lab_dengue TEXT,
          imaging_xray TEXT,
          imaging_ultrasound TEXT,
          imaging_ct TEXT,
          referring_unit TEXT,
          bp TEXT,
          pulse_rate TEXT,
          temp TEXT,
          spo2 TEXT,
          respiratory_rate TEXT,
          weight TEXT,
          gcs_e INTEGER,
          gcs_v INTEGER,
          gcs_m INTEGER,
          gcs_score INTEGER,
          limb_weakness TEXT,
          pupil_right TEXT,
          pupil_left TEXT,
          lung_exam TEXT,
          heart_exam TEXT,
          other_symptoms TEXT,
          initial_treatment TEXT,
          referral_reason TEXT NOT NULL,
          target_coordinator TEXT NOT NULL,
          transport_vehicle TEXT,
          attending_doctor_name TEXT,
          attending_doctor_phone TEXT
        );
      `);

      isConnectedToTurso = true;
      connectionError = null;
      return true;
    } catch (err: any) {
      console.warn('Turso connection or initialization error. Using local offline storage fallback.', err);
      connectionError = err.message || 'Cannot execute schema on Turso';
      isConnectedToTurso = false;
      return false;
    }
  })();

  return initPromise;
}

export function getDatabaseStatus() {
  return {
    isTurso: isConnectedToTurso,
    configured: Boolean(TURSO_URL && TURSO_AUTH_TOKEN),
    url: TURSO_URL,
    error: connectionError,
  };
}

// -------------------------------------------------------------
// HOSPITALS CRUD
// -------------------------------------------------------------

export async function getHospitals(): Promise<Hospital[]> {
  await initDatabase();
  const db = getTursoClient();

  if (isConnectedToTurso && db) {
    try {
      const res = await db.execute(`SELECT * FROM hospitals ORDER BY id ASC;`);
      return res.rows.map((row: any) => ({
        id: Number(row.id),
        province: String(row.province ?? ''),
        name: String(row.name ?? ''),
        password: String(row.password ?? ''),
      }));
    } catch (err) {
      console.error('Error fetching hospitals from Turso, fallback to local', err);
    }
  }

  return getLocalHospitals();
}

export async function createHospital(hospital: Omit<Hospital, 'id'>): Promise<Hospital> {
  await initDatabase();
  const db = getTursoClient();

  if (isConnectedToTurso && db) {
    try {
      const res = await db.execute({
        sql: `INSERT INTO hospitals (province, name, password) VALUES (?, ?, ?) RETURNING id;`,
        args: [hospital.province, hospital.name, hospital.password || ''],
      });
      const newId = res.rows[0]?.id ? Number(res.rows[0].id) : Date.now();
      return { id: newId, ...hospital };
    } catch (err) {
      console.error('Error inserting hospital to Turso, fallback to local', err);
    }
  }

  // Local fallback
  const list = getLocalHospitals();
  const nextId = list.length > 0 ? Math.max(...list.map(h => h.id)) + 1 : 1;
  const newHospital: Hospital = { id: nextId, ...hospital };
  list.push(newHospital);
  saveLocalHospitals(list);
  return newHospital;
}

export async function updateHospital(id: number, hospital: Partial<Hospital>): Promise<void> {
  await initDatabase();
  const db = getTursoClient();

  if (isConnectedToTurso && db) {
    try {
      const fields: string[] = [];
      const args: any[] = [];
      if (hospital.province !== undefined) {
        fields.push('province = ?');
        args.push(hospital.province);
      }
      if (hospital.name !== undefined) {
        fields.push('name = ?');
        args.push(hospital.name);
      }
      if (hospital.password !== undefined) {
        fields.push('password = ?');
        args.push(hospital.password);
      }
      if (fields.length > 0) {
        args.push(id);
        await db.execute({
          sql: `UPDATE hospitals SET ${fields.join(', ')} WHERE id = ?;`,
          args,
        });
      }
      return;
    } catch (err) {
      console.error('Error updating hospital in Turso, fallback to local', err);
    }
  }

  const list = getLocalHospitals();
  const idx = list.findIndex(h => h.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...hospital };
    saveLocalHospitals(list);
  }
}

export async function deleteHospital(id: number): Promise<void> {
  await initDatabase();
  const db = getTursoClient();

  if (isConnectedToTurso && db) {
    try {
      await db.execute({
        sql: `DELETE FROM hospitals WHERE id = ?;`,
        args: [id],
      });
      return;
    } catch (err) {
      console.error('Error deleting hospital in Turso, fallback to local', err);
    }
  }

  const list = getLocalHospitals().filter(h => h.id !== id);
  saveLocalHospitals(list);
}

// -------------------------------------------------------------
// REFERRALS CRUD
// -------------------------------------------------------------

export async function getNextReferralId(): Promise<string> {
  await initDatabase();
  const db = getTursoClient();

  let maxNum = 0;
  if (isConnectedToTurso && db) {
    try {
      const res = await db.execute(`SELECT id FROM referrals;`);
      for (const row of res.rows) {
        const idStr = String(row.id || '');
        const match = idStr.match(/^cps(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      return `cps${nextNum.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Error getting next ID from Turso, fallback to local', err);
    }
  }

  const list = getLocalReferrals();
  for (const item of list) {
    const match = (item.id || '').match(/^cps(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  return `cps${nextNum.toString().padStart(3, '0')}`;
}

export async function getReferrals(filters?: {
  hospitalId?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  province?: string;
}): Promise<Referral[]> {
  await initDatabase();
  const db = getTursoClient();

  let results: Referral[] = [];
  if (isConnectedToTurso && db) {
    try {
      const res = await db.execute(`
        SELECT r.*, h.name as hospital_name, h.province as hospital_province
        FROM referrals r
        LEFT JOIN hospitals h ON r.hospital_id = h.id
        ORDER BY r.created_at DESC;
      `);

      results = res.rows.map((row: any) => ({
        id: String(row.id),
        hospital_id: Number(row.hospital_id),
        hospital_name: row.hospital_name ? String(row.hospital_name) : undefined,
        hospital_province: row.hospital_province ? String(row.hospital_province) : undefined,
        created_at: String(row.created_at ?? ''),
        updated_at: String(row.updated_at ?? ''),
        status: (row.status || 'ສົ່ງແລ້ວ') as ReferralStatus,
        arrived_at: row.arrived_at ? String(row.arrived_at) : undefined,
        outcome: row.outcome ? String(row.outcome) : undefined,
        recorded_by: row.recorded_by ? String(row.recorded_by) : undefined,
        admission_date: row.admission_date ? String(row.admission_date) : undefined,
        referral_time: row.referral_time ? String(row.referral_time) : undefined,
        origin_phone: row.origin_phone ? String(row.origin_phone) : undefined,
        patient_name: String(row.patient_name ?? ''),
        age: String(row.age ?? ''),
        gender: String(row.gender ?? ''),
        occupation: row.occupation ? String(row.occupation) : undefined,
        village: row.village ? String(row.village) : undefined,
        district: row.district ? String(row.district) : undefined,
        province: row.province ? String(row.province) : undefined,
        insurance_type: row.insurance_type ? String(row.insurance_type) : undefined,
        diagnosis: String(row.diagnosis ?? ''),
        past_medical_history: row.past_medical_history ? String(row.past_medical_history) : undefined,
        current_medications: row.current_medications ? String(row.current_medications) : undefined,
        present_illness: row.present_illness ? String(row.present_illness) : undefined,
        lab_wbc: row.lab_wbc ? String(row.lab_wbc) : undefined,
        lab_hct: row.lab_hct ? String(row.lab_hct) : undefined,
        lab_hb: row.lab_hb ? String(row.lab_hb) : undefined,
        lab_plt: row.lab_plt ? String(row.lab_plt) : undefined,
        lab_glucose: row.lab_glucose ? String(row.lab_glucose) : undefined,
        lab_creatinine: row.lab_creatinine ? String(row.lab_creatinine) : undefined,
        lab_urea: row.lab_urea ? String(row.lab_urea) : undefined,
        lab_k: row.lab_k ? String(row.lab_k) : undefined,
        lab_na: row.lab_na ? String(row.lab_na) : undefined,
        lab_dengue: row.lab_dengue ? String(row.lab_dengue) : undefined,
        imaging_xray: row.imaging_xray ? String(row.imaging_xray) : undefined,
        imaging_ultrasound: row.imaging_ultrasound ? String(row.imaging_ultrasound) : undefined,
        imaging_ct: row.imaging_ct ? String(row.imaging_ct) : undefined,
        referring_unit: row.referring_unit ? String(row.referring_unit) : undefined,
        bp: row.bp ? String(row.bp) : undefined,
        pulse_rate: row.pulse_rate ? String(row.pulse_rate) : undefined,
        temp: row.temp ? String(row.temp) : undefined,
        spo2: row.spo2 ? String(row.spo2) : undefined,
        respiratory_rate: row.respiratory_rate ? String(row.respiratory_rate) : undefined,
        weight: row.weight ? String(row.weight) : undefined,
        gcs_e: Number(row.gcs_e || 4),
        gcs_v: Number(row.gcs_v || 5),
        gcs_m: Number(row.gcs_m || 6),
        gcs_score: Number(row.gcs_score || 15),
        limb_weakness: row.limb_weakness ? String(row.limb_weakness) : undefined,
        pupil_right: row.pupil_right ? String(row.pupil_right) : undefined,
        pupil_left: row.pupil_left ? String(row.pupil_left) : undefined,
        lung_exam: row.lung_exam ? String(row.lung_exam) : undefined,
        heart_exam: row.heart_exam ? String(row.heart_exam) : undefined,
        other_symptoms: row.other_symptoms ? String(row.other_symptoms) : undefined,
        initial_treatment: row.initial_treatment ? String(row.initial_treatment) : undefined,
        referral_reason: String(row.referral_reason ?? ''),
        target_coordinator: String(row.target_coordinator ?? ''),
        transport_vehicle: row.transport_vehicle ? String(row.transport_vehicle) : undefined,
        attending_doctor_name: row.attending_doctor_name ? String(row.attending_doctor_name) : undefined,
        attending_doctor_phone: row.attending_doctor_phone ? String(row.attending_doctor_phone) : undefined,
      }));
    } catch (err) {
      console.error('Error querying referrals from Turso, falling back to local', err);
      results = getLocalReferrals();
    }
  } else {
    // Populate hospital names for local referrals
    const hospitals = getLocalHospitals();
    const hospMap = new Map(hospitals.map(h => [h.id, h]));
    results = getLocalReferrals().map(r => ({
      ...r,
      hospital_name: hospMap.get(r.hospital_id)?.name || r.hospital_name,
      hospital_province: hospMap.get(r.hospital_id)?.province || r.hospital_province,
    }));
  }

  // Apply in-memory filtering for search, date, hospital, and status
  if (filters) {
    if (filters.hospitalId) {
      results = results.filter(r => r.hospital_id === filters.hospitalId);
    }
    if (filters.status && filters.status !== 'all') {
      results = results.filter(r => r.status === filters.status);
    }
    if (filters.province && filters.province !== 'all') {
      results = results.filter(r => r.hospital_province === filters.province || r.province === filters.province);
    }
    if (filters.startDate) {
      results = results.filter(r => r.created_at.slice(0, 10) >= filters.startDate!);
    }
    if (filters.endDate) {
      results = results.filter(r => r.created_at.slice(0, 10) <= filters.endDate!);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      results = results.filter(r =>
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.patient_name && r.patient_name.toLowerCase().includes(q)) ||
        (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
        (r.hospital_name && r.hospital_name.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q))
      );
    }
  }

  return results;
}

export async function getReferralById(id: string): Promise<Referral | null> {
  const all = await getReferrals();
  return all.find(r => r.id === id) || null;
}

export async function createReferral(data: Omit<Referral, 'id' | 'created_at' | 'updated_at'>): Promise<Referral> {
  await initDatabase();
  const db = getTursoClient();

  const nextId = await getNextReferralId();
  const now = new Date().toISOString();

  const newReferral: Referral = {
    ...data,
    id: nextId,
    created_at: now,
    updated_at: now,
    status: data.status || 'ສົ່ງແລ້ວ',
  };

  if (isConnectedToTurso && db) {
    try {
      await db.execute({
        sql: `
          INSERT INTO referrals (
            id, hospital_id, created_at, updated_at, status, arrived_at, outcome, recorded_by,
            admission_date, referral_time, origin_phone, patient_name, age, gender, occupation,
            village, district, province, insurance_type, diagnosis, past_medical_history,
            current_medications, present_illness, lab_wbc, lab_hct, lab_hb, lab_plt,
            lab_glucose, lab_creatinine, lab_urea, lab_k, lab_na, lab_dengue, imaging_xray,
            imaging_ultrasound, imaging_ct, referring_unit, bp, pulse_rate, temp, spo2,
            respiratory_rate, weight, gcs_e, gcs_v, gcs_m, gcs_score, limb_weakness,
            pupil_right, pupil_left, lung_exam, heart_exam, other_symptoms, initial_treatment,
            referral_reason, target_coordinator, transport_vehicle, attending_doctor_name,
            attending_doctor_phone
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
          );
        `,
        args: [
          newReferral.id,
          newReferral.hospital_id,
          newReferral.created_at,
          newReferral.updated_at,
          newReferral.status,
          newReferral.arrived_at || null,
          newReferral.outcome || null,
          newReferral.recorded_by || null,
          newReferral.admission_date || null,
          newReferral.referral_time || null,
          newReferral.origin_phone || null,
          newReferral.patient_name,
          newReferral.age,
          newReferral.gender,
          newReferral.occupation || null,
          newReferral.village || null,
          newReferral.district || null,
          newReferral.province || null,
          newReferral.insurance_type || null,
          newReferral.diagnosis,
          newReferral.past_medical_history || null,
          newReferral.current_medications || null,
          newReferral.present_illness || null,
          newReferral.lab_wbc || null,
          newReferral.lab_hct || null,
          newReferral.lab_hb || null,
          newReferral.lab_plt || null,
          newReferral.lab_glucose || null,
          newReferral.lab_creatinine || null,
          newReferral.lab_urea || null,
          newReferral.lab_k || null,
          newReferral.lab_na || null,
          newReferral.lab_dengue || null,
          newReferral.imaging_xray || null,
          newReferral.imaging_ultrasound || null,
          newReferral.imaging_ct || null,
          newReferral.referring_unit || null,
          newReferral.bp || null,
          newReferral.pulse_rate || null,
          newReferral.temp || null,
          newReferral.spo2 || null,
          newReferral.respiratory_rate || null,
          newReferral.weight || null,
          newReferral.gcs_e,
          newReferral.gcs_v,
          newReferral.gcs_m,
          newReferral.gcs_score,
          newReferral.limb_weakness || null,
          newReferral.pupil_right || null,
          newReferral.pupil_left || null,
          newReferral.lung_exam || null,
          newReferral.heart_exam || null,
          newReferral.other_symptoms || null,
          newReferral.initial_treatment || null,
          newReferral.referral_reason,
          newReferral.target_coordinator,
          newReferral.transport_vehicle || null,
          newReferral.attending_doctor_name || null,
          newReferral.attending_doctor_phone || null,
        ],
      });
      return newReferral;
    } catch (err) {
      console.error('Error inserting referral into Turso, falling back to local', err);
    }
  }

  // Local fallback
  const list = getLocalReferrals();
  list.unshift(newReferral);
  saveLocalReferrals(list);
  return newReferral;
}

export async function updateReferral(id: string, updates: Partial<Referral>): Promise<void> {
  await initDatabase();
  const db = getTursoClient();
  const now = new Date().toISOString();

  if (isConnectedToTurso && db) {
    try {
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
      if (keys.length > 0) {
        const setClauses = keys.map(k => `${k} = ?`).join(', ');
        const values = keys.map(k => (updates as any)[k] ?? null);
        setClauses.length > 0 && values.push(now, id);

        await db.execute({
          sql: `UPDATE referrals SET ${setClauses}, updated_at = ? WHERE id = ?;`,
          args: values,
        });
      }
      return;
    } catch (err) {
      console.error('Error updating referral in Turso, falling back to local', err);
    }
  }

  const list = getLocalReferrals();
  const idx = list.findIndex(r => r.id === id);
  if (idx !== -1) {
    list[idx] = {
      ...list[idx],
      ...updates,
      updated_at: now,
    };
    saveLocalReferrals(list);
  }
}

/**
 * Helper to optionally seed Champasak's 10 district hospitals
 * if the administrator chooses to load them with one click.
 */
export async function seedChampasakHospitals(): Promise<void> {
  const champasakDistricts = [
    { name: 'ໂຮງໝໍເມືອງປາກຊ່ອງ', province: 'ຈຳປາສັກ', password: 'cps01' },
    { name: 'ໂຮງໝໍເມືອງບາຈຽງຈະເລີນສຸກ', province: 'ຈຳປາສັກ', password: 'cps02' },
    { name: 'ໂຮງໝໍເມືອງຊະນະສົມບູນ', province: 'ຈຳປາສັກ', password: 'cps03' },
    { name: 'ໂຮງໝໍເມືອງໂພນທອງ', province: 'ຈຳປາສັກ', password: 'cps04' },
    { name: 'ໂຮງໝໍເມືອງຈຳປາສັກ', province: 'ຈຳປາສັກ', password: 'cps05' },
    { name: 'ໂຮງໝໍເມືອງສຸຂຸມາ', province: 'ຈຳປາສັກ', password: 'cps06' },
    { name: 'ໂຮງໝໍເມືອງມຸນລະປະໂມກ', province: 'ຈຳປາສັກ', password: 'cps07' },
    { name: 'ໂຮງໝໍເມືອງໂຂງ', province: 'ຈຳປາສັກ', password: 'cps08' },
    { name: 'ໂຮງໝໍເມືອງປະທຸມພອນ', province: 'ຈຳປາສັກ', password: 'cps09' },
    { name: 'ໂຮງໝໍສູນກາງ 106 ປາກເຊ', province: 'ຈຳປາສັກ', password: 'cps10' },
  ];

  for (const h of champasakDistricts) {
    await createHospital(h);
  }
}
