export type ReferralStatus = 'ສົ່ງແລ້ວ' | 'ກຳລັງມາ' | 'ຮອດແລ້ວ' | 'ຮັບເຂົ້າຮັກສາ' | 'ສົ່ງກັບ';

export interface Hospital {
  id: number;
  province: string;
  name: string;
  password?: string;
}

export interface Referral {
  id: string; // e.g. cps001, cps002
  hospital_id: number;
  hospital_name?: string;
  hospital_province?: string;
  created_at: string;
  updated_at: string;
  status: ReferralStatus;
  arrived_at?: string;
  outcome?: string;
  recorded_by?: string;

  // ຂັ້ນ 1: ຂໍ້ມູນຄົນເຈັບ
  admission_date?: string;
  referral_time?: string;
  origin_phone?: string;
  patient_name: string; // required
  age: string; // required
  gender: string; // required
  occupation?: string;
  village?: string;
  district?: string;
  province?: string;
  insurance_type?: string;

  // ຂັ້ນ 2: ປະຫວັດ
  diagnosis: string; // required
  past_medical_history?: string;
  current_medications?: string;
  present_illness?: string;

  // ຂັ້ນ 3: ຜົນກວດ
  lab_wbc?: string;
  lab_hct?: string;
  lab_hb?: string;
  lab_plt?: string;
  lab_glucose?: string;
  lab_creatinine?: string;
  lab_urea?: string;
  lab_k?: string;
  lab_na?: string;
  lab_dengue?: string;
  imaging_xray?: string;
  imaging_ultrasound?: string;
  imaging_ct?: string;

  // ຂັ້ນ 4: ອາການກ່ອນການນຳສົ່ງ
  referring_unit?: string;
  bp?: string;
  pulse_rate?: string;
  temp?: string;
  spo2?: string;
  respiratory_rate?: string;
  weight?: string;
  gcs_e: number; // 1-4
  gcs_v: number; // 1-5
  gcs_m: number; // 1-6
  gcs_score: number; // 3-15 (E + V + M)
  limb_weakness?: string;
  pupil_right?: string;
  pupil_left?: string;
  lung_exam?: string;
  heart_exam?: string;
  other_symptoms?: string;

  // ຂັ້ນ 5: ການນຳສົ່ງ
  initial_treatment?: string;
  referral_reason: string; // required
  target_coordinator: string; // required
  transport_vehicle?: string;
  attending_doctor_name?: string;
  attending_doctor_phone?: string;
}

export interface UserSession {
  role: 'admin' | 'user';
  hospitalId?: number;
  hospitalName?: string;
  hospitalProvince?: string;
}
