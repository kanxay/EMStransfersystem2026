import { Hospital, Referral } from '../types';

/**
 * Escapes a cell value for CSV formatting
 */
function escapeCSVCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Exports referrals list to CSV with UTF-8 BOM so Microsoft Excel cleanly renders Lao characters.
 */
export function exportReferralsToCSV(referrals: Referral[], filename = 'emscps_referrals.csv'): void {
  const headers = [
    'ລະຫັດນຳສົ່ງ (ID)',
    'ສະຖານະ',
    'ວັນທີ-ເວລາສ້າງ',
    'ວັນທີ-ເວລາຮອດ',
    'ໂຮງໝໍຕົ້ນທາງ',
    'ແຂວງ',
    'ເບີໂທຕົ້ນທາງ',
    'ຊື່ຄົນເຈັບ',
    'ອາຍຸ',
    'ເພດ',
    'ອາຊີບ',
    'ບ້ານ',
    'ເມືອງ',
    'ແຂວງຄົນເຈັບ',
    'ປະເພດປະກັນ',
    'Diagnosis (ການວິນິດໄສ)',
    'ປະຫວັດຜ່ານມາ',
    'ຢາປະຈຳ',
    'ປະຫວັດປະຈຸບັນ',
    'WBC',
    'HCT',
    'HB',
    'PLT',
    'GLUCOSE',
    'CREATININE',
    'UREA',
    'K+',
    'NA+',
    'DENGUE',
    'Chest X-Ray',
    'Ultrasound',
    'CT-Scan',
    'ໜ່ວຍງານສົ່ງມາ',
    'ຄວາມດັນ (BP)',
    'ຊີບພະຈອນ (PR)',
    'ອຸນຫະພູມ (T)',
    'SPO2',
    'ຈັງຫວະຫາຍໃຈ (RR)',
    'ນ້ຳໜັກ (kg)',
    'GCS Eye (E)',
    'GCS Verbal (V)',
    'GCS Motor (M)',
    'ຄະແນນ GCS ລວມ',
    'ອ່ອນແຮງແຂນຂາ',
    'ວົງຕາດຳ-ຂວາ',
    'ວົງຕາດຳ-ຊ້າຍ',
    'ຟັງປອດ',
    'ຟັງຫົວໃຈ',
    'ອາການອື່ນໆ',
    'ການປິ່ນປົວເບື້ອງຕົ້ນ',
    'ເຫດຜົນການນຳສົ່ງ',
    'ຜູ້ທີ່ຈະປະສານເຖິງ',
    'ນຳສົ່ງດ້ວຍ',
    'ທ່ານໝໍປິ່ນປົວ',
    'ເບີໂທທ່ານໝໍ',
    'ຜົນສຸດທ້າຍ',
    'ຜູ້ບັນທຶກ',
  ];

  const rows = referrals.map(r => [
    escapeCSVCell(r.id),
    escapeCSVCell(r.status),
    escapeCSVCell(r.created_at ? new Date(r.created_at).toLocaleString('lo-LA') : ''),
    escapeCSVCell(r.arrived_at || ''),
    escapeCSVCell(r.hospital_name || ''),
    escapeCSVCell(r.hospital_province || ''),
    escapeCSVCell(r.origin_phone || ''),
    escapeCSVCell(r.patient_name || ''),
    escapeCSVCell(r.age || ''),
    escapeCSVCell(r.gender || ''),
    escapeCSVCell(r.occupation || ''),
    escapeCSVCell(r.village || ''),
    escapeCSVCell(r.district || ''),
    escapeCSVCell(r.province || ''),
    escapeCSVCell(r.insurance_type || ''),
    escapeCSVCell(r.diagnosis || ''),
    escapeCSVCell(r.past_medical_history || ''),
    escapeCSVCell(r.current_medications || ''),
    escapeCSVCell(r.present_illness || ''),
    escapeCSVCell(r.lab_wbc || ''),
    escapeCSVCell(r.lab_hct || ''),
    escapeCSVCell(r.lab_hb || ''),
    escapeCSVCell(r.lab_plt || ''),
    escapeCSVCell(r.lab_glucose || ''),
    escapeCSVCell(r.lab_creatinine || ''),
    escapeCSVCell(r.lab_urea || ''),
    escapeCSVCell(r.lab_k || ''),
    escapeCSVCell(r.lab_na || ''),
    escapeCSVCell(r.lab_dengue || ''),
    escapeCSVCell(r.imaging_xray || ''),
    escapeCSVCell(r.imaging_ultrasound || ''),
    escapeCSVCell(r.imaging_ct || ''),
    escapeCSVCell(r.referring_unit || ''),
    escapeCSVCell(r.bp || ''),
    escapeCSVCell(r.pulse_rate || ''),
    escapeCSVCell(r.temp || ''),
    escapeCSVCell(r.spo2 || ''),
    escapeCSVCell(r.respiratory_rate || ''),
    escapeCSVCell(r.weight || ''),
    escapeCSVCell(r.gcs_e || ''),
    escapeCSVCell(r.gcs_v || ''),
    escapeCSVCell(r.gcs_m || ''),
    escapeCSVCell(r.gcs_score || ''),
    escapeCSVCell(r.limb_weakness || ''),
    escapeCSVCell(r.pupil_right || ''),
    escapeCSVCell(r.pupil_left || ''),
    escapeCSVCell(r.lung_exam || ''),
    escapeCSVCell(r.heart_exam || ''),
    escapeCSVCell(r.other_symptoms || ''),
    escapeCSVCell(r.initial_treatment || ''),
    escapeCSVCell(r.referral_reason || ''),
    escapeCSVCell(r.target_coordinator || ''),
    escapeCSVCell(r.transport_vehicle || ''),
    escapeCSVCell(r.attending_doctor_name || ''),
    escapeCSVCell(r.attending_doctor_phone || ''),
    escapeCSVCell(r.outcome || ''),
    escapeCSVCell(r.recorded_by || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports hospitals directory backup to CSV with UTF-8 BOM
 */
export function exportHospitalsToCSV(hospitals: Hospital[], filename = 'emscps_hospitals_backup.csv'): void {
  const headers = ['ລຳດັບ (ID)', 'ແຂວງ', 'ຊື່ໂຮງໝໍເມືອງ (ພາສາລາວ)', 'ລະຫັດຜ່ານ'];
  const rows = hospitals.map(h => [
    escapeCSVCell(h.id),
    escapeCSVCell(h.province),
    escapeCSVCell(h.name),
    escapeCSVCell(h.password || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
