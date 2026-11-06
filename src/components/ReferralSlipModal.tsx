import React, { useRef, useState } from 'react';
import { Referral } from '../types';
import { downloadElementAsPDF, triggerPrint } from '../utils/pdf';
import { Printer, Download, X, CheckCircle, FileText, Loader2 } from 'lucide-react';

interface ReferralSlipModalProps {
  referral: Referral | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReferralSlipModal: React.FC<ReferralSlipModalProps> = ({
  referral,
  isOpen,
  onClose,
}) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen || !referral) return null;

  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;
    try {
      setDownloading(true);
      await downloadElementAsPDF(
        slipRef.current,
        `EMSCPS_Referral_${referral.id}.pdf`,
        msg => setStatusMsg(msg)
      );
    } catch (err) {
      console.error(err);
      alert('ເກີດຂໍ້ຜິດພາດໃນການດາວໂຫຼດ PDF');
    } finally {
      setDownloading(false);
      setStatusMsg('');
    }
  };

  const getGcsSeverity = (score: number) => {
    if (score <= 8) return 'ຮຸນແຮງຫຼາຍ (Severe Brain Injury: 3-8)';
    if (score <= 12) return 'ປານກາງ (Moderate Brain Injury: 9-12)';
    return 'ເບົາບາງ (Mild Brain Injury: 13-15)';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* Action Header - Hidden when printing */}
        <div className="no-print bg-slate-900 text-white px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-sm sm:text-base">
              ໃບນຳສົ່ງຄົນເຈັບສຸກເສີນ: {referral.id}
            </span>
            <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded border border-teal-500/30">
              {referral.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMsg || 'ກຳລັງສ້າງ...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ດາວໂຫຼດ PDF</span>
                </>
              )}
            </button>

            <button
              onClick={triggerPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>ພິມ</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Medical Slip */}
        <div className="overflow-y-auto max-h-[82vh] p-4 sm:p-8 bg-slate-50">
          <div
            ref={slipRef}
            className="print-container bg-white mx-auto p-6 sm:p-10 shadow-sm border border-slate-300 rounded-lg max-w-[210mm] text-slate-900 leading-normal"
            style={{ fontFamily: "'Noto Sans Lao', system-ui, sans-serif" }}
          >
            {/* National Emblem & Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-5">
              <div className="font-bold text-xs uppercase tracking-wide">
                ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
              </div>
              <div className="text-xs tracking-wider">
                ສັນຕິພາບ ເອກະລາດ ປະຊາທິປະໄຕ ເອກະພາບ ວັດທະນະຖາວອນ
              </div>
              <div className="text-xs my-1 text-slate-400">--- 000 ---</div>

              <div className="flex justify-between items-end mt-2 text-left text-xs font-medium">
                <div>
                  <div>ກະຊວງສາທາລະນະສຸກ</div>
                  <div>ພະແນກສາທາລະນະສຸກແຂວງຈຳປາສັກ</div>
                  <div className="font-bold text-slate-800">
                    {referral.hospital_name || 'ໂຮງໝໍເມືອງຕົ້ນທາງ'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-teal-800">
                    ເລກລະຫັດ: {referral.id}
                  </div>
                  <div>
                    ວັນທີ-ເວລານຳສົ່ງ: {referral.referral_time || referral.created_at?.slice(0, 16) || '-'}
                  </div>
                </div>
              </div>

              <h1 className="text-lg sm:text-xl font-bold uppercase mt-4 text-slate-900 tracking-tight">
                ໃບນຳສົ່ງຄົນເຈັບສຸກເສີນ
              </h1>
              <div className="text-xs text-slate-600 font-medium">
                (EMERGENCY PATIENT REFERRAL SLIP - ໂຮງໝໍແຂວງຈຳປາສັກ)
              </div>
            </div>

            {/* 1. ຂໍ້ມູນຄົນເຈັບ */}
            <div className="mb-4">
              <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border-l-4 border-teal-600 uppercase mb-2">
                1. ຂໍ້ມູນຄົນເຈັບ (Patient Information)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">ຊື່ ແລະ ນາມສະກຸນ:</span>{' '}
                  <span className="font-semibold text-slate-900">{referral.patient_name}</span>
                </div>
                <div>
                  <span className="text-slate-500">ອາຍຸ:</span>{' '}
                  <span className="font-semibold">{referral.age} ປີ</span>
                </div>
                <div>
                  <span className="text-slate-500">ເພດ:</span>{' '}
                  <span className="font-semibold">{referral.gender}</span>
                </div>
                <div>
                  <span className="text-slate-500">ອາຊີບ:</span>{' '}
                  <span>{referral.occupation || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ບ້ານ:</span>{' '}
                  <span>{referral.village || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ເມືອງ:</span>{' '}
                  <span>{referral.district || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ແຂວງ:</span>{' '}
                  <span>{referral.province || 'ຈຳປາສັກ'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ປະກັນສັງຄົມ/ສຸຂະພາບ:</span>{' '}
                  <span className="font-semibold text-teal-800">{referral.insurance_type || 'ທົ່ວໄປ'}</span>
                </div>
                <div>
                  <span className="text-slate-500">ວັນທີເຂົ້າໂຮງໝໍ:</span>{' '}
                  <span>{referral.admission_date || '-'}</span>
                </div>
              </div>
            </div>

            {/* 2. ປະຫວັດ ແລະ ການວິນິດໄສ */}
            <div className="mb-4">
              <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border-l-4 border-teal-600 uppercase mb-2">
                2. ການວິນິດໄສ ແລະ ປະຫວັດພະຍາດ (Diagnosis & History)
              </div>
              <div className="text-xs space-y-1.5">
                <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                  <span className="font-bold text-amber-900">Diagnosis (ການວິນິດໄສ): </span>
                  <span className="font-bold text-slate-900 text-sm">{referral.diagnosis}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ປະຫວັດພະຍາດປະຈຸບັນ:</span>{' '}
                  <span>{referral.present_illness || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ປະຫວັດພະຍາດຜ່ານມາ:</span>{' '}
                  <span>{referral.past_medical_history || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-700">ຢາທີ່ໃຊ້ປະຈຳ:</span>{' '}
                  <span>{referral.current_medications || '-'}</span>
                </div>
              </div>
            </div>

            {/* 3. ສັນຍານຊີບ ແລະ ການກວດຮ່າງກາຍກ່ອນນຳສົ່ງ */}
            <div className="mb-4">
              <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border-l-4 border-teal-600 uppercase mb-2">
                3. ສັນຍານຊີບ ແລະ ອາການກ່ອນການນຳສົ່ງ (Vital Signs & Physical Examination)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">BP (ຄວາມດັນ):</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.bp || '-'} mmHg</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">PR (ຊີບພະຈອນ):</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.pulse_rate || '-'} bpm</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">T (ອຸນຫະພູມ):</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.temp || '-'} °C</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">SpO2:</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.spo2 || '-'} %</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">RR (ຫາຍໃຈ):</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.respiratory_rate || '-'} /min</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">ນ້ຳໜັກ:</span>
                  <span className="font-bold tabular-nums text-slate-900">{referral.weight || '-'} kg</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">ວົງຕາດຳ:</span>
                  <span className="text-slate-900">R: {referral.pupil_right || '-'}, L: {referral.pupil_left || '-'}</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block">ອ່ອນແຮງແຂນຂາ:</span>
                  <span className="text-slate-900">{referral.limb_weakness || 'ບໍ່ມີ'}</span>
                </div>
              </div>

              {/* Glasgow Coma Scale (GCS) */}
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-xs mb-2">
                <div className="flex justify-between items-center mb-1.5 font-bold text-slate-800 border-b border-slate-200 pb-1">
                  <span>Glasgow Coma Scale (GCS):</span>
                  <span className="text-teal-800 font-mono text-sm">
                    ຄະແນນລວມ = {referral.gcs_score} / 15 ({getGcsSeverity(referral.gcs_score)})
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-slate-700">
                  <div>
                    <span className="font-medium text-slate-600">Eye Opening (E): </span>
                    <span className="font-bold font-mono">{referral.gcs_e}</span>/4
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Verbal (V): </span>
                    <span className="font-bold font-mono">{referral.gcs_v}</span>/5
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Motor (M): </span>
                    <span className="font-bold font-mono">{referral.gcs_m}</span>/6
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-slate-600">ຟັງປອດ:</span> {referral.lung_exam || '-'}
                </div>
                <div>
                  <span className="font-medium text-slate-600">ຟັງຫົວໃຈ:</span> {referral.heart_exam || '-'}
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-slate-600">ອາການອື່ນໆ:</span> {referral.other_symptoms || '-'}
                </div>
              </div>
            </div>

            {/* 4. ຜົນກວດເລືອດ ແລະ ຮູບພາບ */}
            <div className="mb-4">
              <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border-l-4 border-teal-600 uppercase mb-2">
                4. ຜົນກວດທາງຫ້ອງທົດລອງ ແລະ ຮູບພາບ (Investigation Results)
              </div>
              <div className="overflow-x-auto mb-2">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300">
                    <tr>
                      <th className="p-1.5 border-r border-slate-300">WBC</th>
                      <th className="p-1.5 border-r border-slate-300">HCT</th>
                      <th className="p-1.5 border-r border-slate-300">HB</th>
                      <th className="p-1.5 border-r border-slate-300">PLT</th>
                      <th className="p-1.5 border-r border-slate-300">GLUCOSE</th>
                      <th className="p-1.5 border-r border-slate-300">CREAT</th>
                      <th className="p-1.5 border-r border-slate-300">UREA</th>
                      <th className="p-1.5 border-r border-slate-300">K+</th>
                      <th className="p-1.5 border-r border-slate-300">NA+</th>
                      <th className="p-1.5">DENGUE</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums font-mono text-slate-800">
                    <tr>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_wbc || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_hct || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_hb || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_plt || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_glucose || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_creatinine || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_urea || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_k || '-'}</td>
                      <td className="p-1.5 border-r border-slate-300">{referral.lab_na || '-'}</td>
                      <td className="p-1.5">{referral.lab_dengue || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="font-medium text-slate-600">Chest X-Ray:</span>{' '}
                  <span>{referral.imaging_xray || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600">Ultrasound:</span>{' '}
                  <span>{referral.imaging_ultrasound || '-'}</span>
                </div>
                <div>
                  <span className="font-medium text-slate-600">CT-Scan:</span>{' '}
                  <span>{referral.imaging_ct || '-'}</span>
                </div>
              </div>
            </div>

            {/* 5. ການປິ່ນປົວເບື້ອງຕົ້ນ ແລະ ເຫດຜົນການນຳສົ່ງ */}
            <div className="mb-6">
              <div className="bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border-l-4 border-teal-600 uppercase mb-2">
                5. ການປິ່ນປົວ ແລະ ລາຍລະອຽດການນຳສົ່ງ (Management & Transfer Details)
              </div>
              <div className="text-xs space-y-1.5">
                <div>
                  <span className="font-semibold text-slate-700">ການປິ່ນປົວເບື້ອງຕົ້ນ (Initial Treatment):</span>{' '}
                  <span>{referral.initial_treatment || '-'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-700">ເຫດຜົນຂອງການນຳສົ່ງ (Reason for Referral):</span>{' '}
                  <span className="font-medium text-red-900">{referral.referral_reason}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-600">ຜູ້ທີ່ຈະປະສານເຖິງ (Contact at CPS):</span>{' '}
                    <span className="font-semibold text-slate-900">{referral.target_coordinator}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ພາຫະນະນຳສົ່ງ:</span>{' '}
                    <span>{referral.transport_vehicle || 'ລົດສຸກເສີນ (EMS)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ທ່ານໝໍປິ່ນປົວ:</span>{' '}
                    <span className="font-semibold">{referral.attending_doctor_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">ເບີໂທຕິດຕໍ່ທ່ານໝໍ:</span>{' '}
                    <span className="font-mono">{referral.attending_doctor_phone || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4 border-t border-slate-400 mt-6">
              <div>
                <div className="font-medium text-slate-700 mb-12">ທ່ານໝໍປິ່ນປົວ / ຜູ້ກວດ</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500">
                  {referral.attending_doctor_name || '(ລາຍເຊັນ ແລະ ຊື່ແຈ້ງ)'}
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-12">ຫົວໜ້າໜ່ວຍງານ / ໂຮງໝໍຕົ້ນທາງ</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500">
                  (ລາຍເຊັນ ແລະ ກາປະທັບ)
                </div>
              </div>
              <div>
                <div className="font-medium text-slate-700 mb-12">ແພດຮັບຄົນເຈັບ ໂຮງໝໍແຂວງຈຳປາສັກ</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-slate-500">
                  (ລາຍເຊັນ ແລະ ວັນທີ-ເວລາຮັບ)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
