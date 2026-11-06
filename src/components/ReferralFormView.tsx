import React, { useState, useEffect } from 'react';
import { Referral, UserSession } from '../types';
import { createReferral, updateReferral } from '../lib/turso';
import {
  User,
  HeartPulse,
  FlaskConical,
  Activity,
  Ambulance,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Save,
  RotateCcw,
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface ReferralFormViewProps {
  session: UserSession;
  editingReferral?: Referral | null;
  onSuccess: (savedReferral: Referral) => void;
  onCancel?: () => void;
}

const LS_DRAFT_KEY = 'emscps_referral_form_draft';

export const ReferralFormView: React.FC<ReferralFormViewProps> = ({
  session,
  editingReferral,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasDraftNotice, setHasDraftNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toTimeString().slice(0, 5);

  const initialFormState = {
    // Step 1: Patient
    admission_date: todayStr,
    referral_time: `${todayStr} ${nowTimeStr}`,
    origin_phone: '',
    patient_name: '',
    age: '',
    gender: 'ຊາຍ',
    occupation: '',
    village: '',
    district: '',
    province: session.hospitalProvince || 'ຈຳປາສັກ',
    insurance_type: 'ທົ່ວໄປ/ຈ່າຍເອງ',

    // Step 2: History
    diagnosis: '',
    past_medical_history: '',
    current_medications: '',
    present_illness: '',

    // Step 3: Labs & Imaging
    lab_wbc: '',
    lab_hct: '',
    lab_hb: '',
    lab_plt: '',
    lab_glucose: '',
    lab_creatinine: '',
    lab_urea: '',
    lab_k: '',
    lab_na: '',
    lab_dengue: '',
    imaging_xray: '',
    imaging_ultrasound: '',
    imaging_ct: '',

    // Step 4: Vitals & Exam
    referring_unit: 'ພະແນກສຸກເສີນ (ER)',
    bp: '',
    pulse_rate: '',
    temp: '37.0',
    spo2: '98',
    respiratory_rate: '20',
    weight: '',
    gcs_e: 4,
    gcs_v: 5,
    gcs_m: 6,
    limb_weakness: 'ບໍ່ມີ',
    pupil_right: '3mm RTL',
    pupil_left: '3mm RTL',
    lung_exam: 'Clear both lungs',
    heart_exam: 'Normal S1 S2, no murmur',
    other_symptoms: '',

    // Step 5: Transfer
    initial_treatment: '',
    referral_reason: '',
    target_coordinator: 'ຫ້ອງສຸກເສີນ ໂຮງໝໍແຂວງຈຳປາສັກ (ER CPS)',
    transport_vehicle: 'ລົດສຸກເສີນ EMS ພ້ອມພະຍາບານ',
    attending_doctor_name: '',
    attending_doctor_phone: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  // Initialize form or check draft
  useEffect(() => {
    if (editingReferral) {
      setFormData({
        ...initialFormState,
        ...editingReferral,
      });
    } else {
      // Check for saved local draft
      try {
        const savedDraft = localStorage.getItem(`${LS_DRAFT_KEY}_${session.hospitalId}`);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          setHasDraftNotice(true);
        }
      } catch (e) {
        console.error('Failed to load form draft', e);
      }
    }
  }, [editingReferral, session.hospitalId]);

  // Auto-save draft on changes (if not editing an existing referral)
  useEffect(() => {
    if (!editingReferral && session.hospitalId) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(`${LS_DRAFT_KEY}_${session.hospitalId}`, JSON.stringify(formData));
        } catch (e) {
          console.error('Failed to save draft', e);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData, editingReferral, session.hospitalId]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearDraft = () => {
    if (confirm('ທ່ານຕ້ອງການລຶບຮ່າງທີ່ບັນທຶກໄວ້ ແລະ ເລີ່ມຕົ້ນໃໝ່ແທ້ບໍ່?')) {
      if (session.hospitalId) {
        localStorage.removeItem(`${LS_DRAFT_KEY}_${session.hospitalId}`);
      }
      setFormData(initialFormState);
      setHasDraftNotice(false);
      setCurrentStep(1);
    }
  };

  // Auto GCS score
  const gcsTotal = Number(formData.gcs_e || 4) + Number(formData.gcs_v || 5) + Number(formData.gcs_m || 6);

  const steps = [
    { num: 1, title: 'ຂໍ້ມູນຄົນເຈັບ', icon: User, desc: 'ຊື່, ອາຍຸ, ທີ່ຢູ່, ປະກັນ' },
    { num: 2, title: 'ປະຫວັດ', icon: HeartPulse, desc: 'Diagnosis, ປະຫວັດພະຍາດ' },
    { num: 3, title: 'ຜົນກວດ', icon: FlaskConical, desc: 'ຜົນກວດເລືອດ, X-ray' },
    { num: 4, title: 'ອາການກ່ອນນຳສົ່ງ', icon: Activity, desc: 'ສັນຍານຊີບ, ຄະແນນ GCS' },
    { num: 5, title: 'ການນຳສົ່ງ', icon: Ambulance, desc: 'ການປິ່ນປົວ, ຜູ້ປະສານ' },
  ];

  // Step validation
  const validateStep = (step: number): boolean => {
    setErrorMsg('');
    if (step === 1) {
      if (!formData.patient_name.trim()) {
        setErrorMsg('ກະລຸນາໃສ່ ຊື່ ແລະ ນາມສະກຸນ ຂອງຄົນເຈັບ (ບັງຄັບ)');
        return false;
      }
      if (!formData.age.trim()) {
        setErrorMsg('ກະລຸນາໃສ່ ອາຍຸ ຂອງຄົນເຈັບ (ບັງຄັບ)');
        return false;
      }
      if (!formData.gender) {
        setErrorMsg('ກະລຸນາເລືອກ ເພດ (ບັງຄັບ)');
        return false;
      }
    } else if (step === 2) {
      if (!formData.diagnosis.trim()) {
        setErrorMsg('ກະລຸນາໃສ່ ການວິນິດໄສ (Diagnosis) (ບັງຄັບ)');
        return false;
      }
    } else if (step === 5) {
      if (!formData.referral_reason.trim()) {
        setErrorMsg('ກະລຸນາໃສ່ ເຫດຜົນຂອງການນຳສົ່ງ (ບັງຄັບ)');
        return false;
      }
      if (!formData.target_coordinator.trim()) {
        setErrorMsg('ກະລຸນາໃສ່ ຜູ້ທີ່ຈະປະສານເຖິງ ໂຮງໝໍແຂວງຈຳປາສັກ (ບັງຄັບ)');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrorMsg('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(5)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const submissionPayload = {
        hospital_id: session.hospitalId || 1,
        hospital_name: session.hospitalName,
        hospital_province: session.hospitalProvince,
        status: (editingReferral?.status || 'ສົ່ງແລ້ວ') as any,
        admission_date: formData.admission_date,
        referral_time: formData.referral_time,
        origin_phone: formData.origin_phone,
        patient_name: formData.patient_name.trim(),
        age: formData.age.trim(),
        gender: formData.gender,
        occupation: formData.occupation,
        village: formData.village,
        district: formData.district,
        province: formData.province,
        insurance_type: formData.insurance_type,
        diagnosis: formData.diagnosis.trim(),
        past_medical_history: formData.past_medical_history,
        current_medications: formData.current_medications,
        present_illness: formData.present_illness,
        lab_wbc: formData.lab_wbc,
        lab_hct: formData.lab_hct,
        lab_hb: formData.lab_hb,
        lab_plt: formData.lab_plt,
        lab_glucose: formData.lab_glucose,
        lab_creatinine: formData.lab_creatinine,
        lab_urea: formData.lab_urea,
        lab_k: formData.lab_k,
        lab_na: formData.lab_na,
        lab_dengue: formData.lab_dengue,
        imaging_xray: formData.imaging_xray,
        imaging_ultrasound: formData.imaging_ultrasound,
        imaging_ct: formData.imaging_ct,
        referring_unit: formData.referring_unit,
        bp: formData.bp,
        pulse_rate: formData.pulse_rate,
        temp: formData.temp,
        spo2: formData.spo2,
        respiratory_rate: formData.respiratory_rate,
        weight: formData.weight,
        gcs_e: Number(formData.gcs_e),
        gcs_v: Number(formData.gcs_v),
        gcs_m: Number(formData.gcs_m),
        gcs_score: gcsTotal,
        limb_weakness: formData.limb_weakness,
        pupil_right: formData.pupil_right,
        pupil_left: formData.pupil_left,
        lung_exam: formData.lung_exam,
        heart_exam: formData.heart_exam,
        other_symptoms: formData.other_symptoms,
        initial_treatment: formData.initial_treatment,
        referral_reason: formData.referral_reason.trim(),
        target_coordinator: formData.target_coordinator.trim(),
        transport_vehicle: formData.transport_vehicle,
        attending_doctor_name: formData.attending_doctor_name,
        attending_doctor_phone: formData.attending_doctor_phone,
      };

      let resultReferral: Referral;

      if (editingReferral) {
        await updateReferral(editingReferral.id, submissionPayload);
        resultReferral = {
          ...editingReferral,
          ...submissionPayload,
          updated_at: new Date().toISOString(),
        };
      } else {
        resultReferral = await createReferral(submissionPayload);
        // Clear saved draft on successful new submission
        if (session.hospitalId) {
          localStorage.removeItem(`${LS_DRAFT_KEY}_${session.hospitalId}`);
        }
      }

      onSuccess(resultReferral);
    } catch (err: any) {
      console.error('Submission failed', err);
      setErrorMsg(err.message || 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກຂໍ້ມູນ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Title & Origin Banner */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>{editingReferral ? 'ແກ້ໄຂໃບນຳສົ່ງຄົນເຈັບ' : 'ແບບຟອມນຳສົ່ງຄົນເຈັບ'}</span>
            {editingReferral && (
              <span className="text-xs font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded font-normal">
                {editingReferral.id}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            ໂຮງໝໍຕົ້ນທາງ: <strong className="text-teal-700">{session.hospitalName || 'ໂຮງໝໍເມືອງ'}</strong>
            {session.hospitalProvince && ` (ແຂວງ${session.hospitalProvince})`} ➔ ປາຍທາງ: <b>ໂຮງໝໍແຂວງຈຳປາສັກ</b>
          </p>
        </div>

        {hasDraftNotice && !editingReferral && (
          <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Save className="w-4 h-4 text-emerald-600" />
            <span>ບັນທຶກຮ່າງອັດຕະໂນມັດແລ້ວ</span>
            <button
              type="button"
              onClick={clearDraft}
              className="text-rose-600 hover:text-rose-800 font-medium underline ml-1 cursor-pointer"
            >
              ເລີ່ມໃໝ່
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar & Steps Tabs */}
      <div className="mb-6 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Progress Bar Line */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="bg-teal-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* 5 Step Icons */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 text-center">
          {steps.map(step => {
            const Icon = step.icon;
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  // Only allow jumping back, or next if current is valid
                  if (step.num < currentStep || validateStep(currentStep)) {
                    setCurrentStep(step.num);
                  }
                }}
                className={`flex flex-col items-center p-1 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 font-semibold'
                    : isCompleted
                    ? 'text-teal-600 hover:bg-slate-50'
                    : 'text-slate-400 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs mb-1 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-[11px] sm:text-xs leading-tight line-clamp-1">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 md:p-8">
        {/* ================= STEP 1: ຂໍ້ມູນຄົນເຈັບ ================= */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <span>ຂັ້ນ 1: ຂໍ້ມູນຄົນເຈັບ (Patient Demographics)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ຂໍ້ມູນພື້ນຖານຂອງຄົນເຈັບ ແລະ ຕົ້ນທາງການນຳສົ່ງ (* ແມ່ນຊ່ອງບັງຄັບ)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ ແລະ ນາມສະກຸນ ຄົນເຈັບ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ທ້າວ ສົມສັກ ແກ້ວມະນີ"
                  value={formData.patient_name}
                  onChange={e => handleChange('patient_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ອາຍຸ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: 45 (ຫຼື 6 ເດືອນ)"
                  value={formData.age}
                  onChange={e => handleChange('age', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເພດ <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-4 pt-1.5">
                  <label className="inline-flex items-center text-sm gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="ຊາຍ"
                      checked={formData.gender === 'ຊາຍ'}
                      onChange={e => handleChange('gender', e.target.value)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>ຊາຍ</span>
                  </label>
                  <label className="inline-flex items-center text-sm gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="ຍິງ"
                      checked={formData.gender === 'ຍິງ'}
                      onChange={e => handleChange('gender', e.target.value)}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <span>ຍິງ</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ອາຊີບ
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: ຊາວກະສິກອນ, ພະນັກງານ, ນັກຮຽນ"
                  value={formData.occupation}
                  onChange={e => handleChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ບ້ານ
                </label>
                <input
                  type="text"
                  placeholder="ບ້ານທີ່ຢູ່ອາໄສ"
                  value={formData.village}
                  onChange={e => handleChange('village', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເມືອງ
                </label>
                <input
                  type="text"
                  placeholder="ເມືອງ"
                  value={formData.district}
                  onChange={e => handleChange('district', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ແຂວງ
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={e => handleChange('province', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ປະເພດປະກັນສັງຄົມ / ສຸຂະພາບ
                </label>
                <select
                  value={formData.insurance_type}
                  onChange={e => handleChange('insurance_type', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden bg-white"
                >
                  <option value="ທົ່ວໄປ/ຈ່າຍເອງ">ທົ່ວໄປ / ຈ່າຍເອງ</option>
                  <option value="ກອງທຶນປະກັນສຸຂະພາບແຫ່ງຊາດ (ກປຊ)">ກອງທຶນປະກັນສຸຂະພາບແຫ່ງຊາດ (ກປຊ)</option>
                  <option value="ປະກັນສັງຄົມ (ກສປ)">ປະກັນສັງຄົມ (ກສປ)</option>
                  <option value="ນະໂຍບາຍ/ທຸກຍາກ">ນະໂຍບາຍ / ທຸກຍາກ</option>
                  <option value="ແມ່ ແລະ ເດັກ">ແມ່ ແລະ ເດັກ (ຟຣີ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວັນທີເຂົ້າໂຮງໝໍຕົ້ນທາງ
                </label>
                <input
                  type="date"
                  value={formData.admission_date}
                  onChange={e => handleChange('admission_date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວັນທີ-ເວລານຳສົ່ງ
                </label>
                <input
                  type="text"
                  placeholder="2026-11-05 14:30"
                  value={formData.referral_time}
                  onChange={e => handleChange('referral_time', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ໂຮງໝໍຕົ້ນທາງ (ຕື່ມອັດຕະໂນມັດ)
                </label>
                <input
                  type="text"
                  disabled
                  value={session.hospitalName || 'ໂຮງໝໍເມືອງ'}
                  className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກໂທລະສັບໂຮງໝໍຕົ້ນທາງ
                </label>
                <input
                  type="tel"
                  placeholder="ເຊັ່ນ: 031-xxxxxx ຫຼື 020-xxxxxxxx"
                  value={formData.origin_phone}
                  onChange={e => handleChange('origin_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: ປະຫວັດ ================= */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-teal-600" />
                <span>ຂັ້ນ 2: ປະຫວັດພະຍາດ (Clinical History)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ການວິນິດໄສ ແລະ ປະຫວັດຄວາມເຈັບປ່ວຍ
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Diagnosis (ການວິນິດໄສພະຍາດ) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="ເຊັ່ນ: Severe Traumatic Brain Injury, Acute Appendicitis with peritonitis, Sepsis, Severe Dengue with shock"
                value={formData.diagnosis}
                onChange={e => handleChange('diagnosis', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ປະຫວັດພະຍາດປະຈຸບັນ (Present Illness)
              </label>
              <textarea
                rows={3}
                placeholder="ເລີ່ມມີອາການແນວໃດ, ໄລຍະເວລາ, ອາການປ່ຽນແປງແນວໃດກ່ອນມານຳສົ່ງ..."
                value={formData.present_illness}
                onChange={e => handleChange('present_illness', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ປະຫວັດພະຍາດຜ່ານມາ (Past Medical History)
                </label>
                <textarea
                  rows={2}
                  placeholder="ຄວາມດັນ, ເບົາຫວານ, ຜ່າຕັດຜ່ານມາ, ແພ້ຢາ..."
                  value={formData.past_medical_history}
                  onChange={e => handleChange('past_medical_history', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຢາທີ່ໃຊ້ປະຈຳ (Current Medications)
                </label>
                <textarea
                  rows={2}
                  placeholder="ລາຍຊື່ຢາທີ່ຄົນເຈັບກິນເປັນປະຈຳ..."
                  value={formData.current_medications}
                  onChange={e => handleChange('current_medications', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ຜົນກວດ ================= */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-teal-600" />
                <span>ຂັ້ນ 3: ຜົນກວດທາງຫ້ອງທົດລອງ ແລະ ຮູບພາບ (Investigations)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ຜົນກວດເລືອດ, ນ້ຳຕານ, ເກືອແຮ່ ແລະ ຜົນກວດ X-ray / Ultrasound
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                ຜົນກວດເລືອດ (Blood Tests)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">WBC</label>
                  <input
                    type="text"
                    placeholder="x10^3/uL"
                    value={formData.lab_wbc}
                    onChange={e => handleChange('lab_wbc', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">HCT</label>
                  <input
                    type="text"
                    placeholder="%"
                    value={formData.lab_hct}
                    onChange={e => handleChange('lab_hct', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">HB</label>
                  <input
                    type="text"
                    placeholder="g/dL"
                    value={formData.lab_hb}
                    onChange={e => handleChange('lab_hb', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">PLT</label>
                  <input
                    type="text"
                    placeholder="x10^3/uL"
                    value={formData.lab_plt}
                    onChange={e => handleChange('lab_plt', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">GLUCOSE</label>
                  <input
                    type="text"
                    placeholder="mg/dL"
                    value={formData.lab_glucose}
                    onChange={e => handleChange('lab_glucose', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">CREATININE</label>
                  <input
                    type="text"
                    placeholder="mg/dL"
                    value={formData.lab_creatinine}
                    onChange={e => handleChange('lab_creatinine', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">UREA</label>
                  <input
                    type="text"
                    placeholder="mg/dL"
                    value={formData.lab_urea}
                    onChange={e => handleChange('lab_urea', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">K+ (Potassium)</label>
                  <input
                    type="text"
                    placeholder="mmol/L"
                    value={formData.lab_k}
                    onChange={e => handleChange('lab_k', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">NA+ (Sodium)</label>
                  <input
                    type="text"
                    placeholder="mmol/L"
                    value={formData.lab_na}
                    onChange={e => handleChange('lab_na', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">DENGUE NS1/IgM</label>
                  <input
                    type="text"
                    placeholder="Negative / Positive"
                    value={formData.lab_dengue}
                    onChange={e => handleChange('lab_dengue', e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
                ຜົນກວດຮູບພາບ (Imaging Investigations)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chest X-ray (ຟີມເອິກ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ເຊັ່ນ: Infiltration left lower lung, No pneumothorax"
                    value={formData.imaging_xray}
                    onChange={e => handleChange('imaging_xray', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ultrasound (ເອໂກ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ເຊັ່ນ: Free fluid in pouch of Douglas, Gallstones"
                    value={formData.imaging_ultrasound}
                    onChange={e => handleChange('imaging_ultrasound', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CT-Scan (ຖ້າມີ)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ເຊັ່ນ: Epidural hematoma, Non-contrast brain CT"
                    value={formData.imaging_ct}
                    onChange={e => handleChange('imaging_ct', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: ອາການກ່ອນນຳສົ່ງ ================= */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-600" />
                <span>ຂັ້ນ 4: ອາການກ່ອນການນຳສົ່ງ (Vitals & GCS Score)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ສັນຍານຊີບ ແລະ ການປະເມີນສະຕິ Glasgow Coma Scale ຄິດໄລ່ອັດຕະໂນມັດ
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ໜ່ວຍງານທີ່ນຳສົ່ງມາ
              </label>
              <input
                type="text"
                placeholder="ເຊັ່ນ: ຫ້ອງສຸກເສີນ (ER), ຫ້ອງເກີດ, ຕຶກພາຍໃນ, ICU"
                value={formData.referring_unit}
                onChange={e => handleChange('referring_unit', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  BP ຄວາມດັນ (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={formData.bp}
                  onChange={e => handleChange('bp', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  PR ຊີບພະຈອນ (bpm)
                </label>
                <input
                  type="text"
                  placeholder="80"
                  value={formData.pulse_rate}
                  onChange={e => handleChange('pulse_rate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  T ອຸນຫະພູມ (°C)
                </label>
                <input
                  type="text"
                  placeholder="37.0"
                  value={formData.temp}
                  onChange={e => handleChange('temp', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  SPO2 ອົກຊີແຊນ (%)
                </label>
                <input
                  type="text"
                  placeholder="98"
                  value={formData.spo2}
                  onChange={e => handleChange('spo2', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  RR ຈັງຫວະຫາຍໃຈ (/min)
                </label>
                <input
                  type="text"
                  placeholder="20"
                  value={formData.respiratory_rate}
                  onChange={e => handleChange('respiratory_rate', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ນ້ຳໜັກ (kg)
                </label>
                <input
                  type="text"
                  placeholder="60"
                  value={formData.weight}
                  onChange={e => handleChange('weight', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Glasgow Coma Scale (Auto Calculate) */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-sm text-slate-900">
                  Glasgow Coma Scale (GCS)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ຄະແນນລວມ (E + V + M):</span>
                  <span className="font-mono font-bold text-lg text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-lg border border-teal-300">
                    {gcsTotal} / 15
                  </span>
                  <span className="text-xs font-medium text-slate-700">
                    {gcsTotal <= 8 ? '🔴 ຮຸນແຮງຫຼາຍ (Severe)' : gcsTotal <= 12 ? '🟡 ປານກາງ (Moderate)' : '🟢 ເບົາບາງ (Mild)'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* E */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ການມືນຕາ (Eye Opening - E)
                  </label>
                  <select
                    value={formData.gcs_e}
                    onChange={e => handleChange('gcs_e', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={4}>4: ມືນຕາເອງ (Spontaneous)</option>
                    <option value={3}>3: ມືນຕາຕາມສຽງເອີ້ນ (To speech)</option>
                    <option value={2}>2: ມືນຕາເມື່ອເຈັບ (To pain)</option>
                    <option value={1}>1: ບໍ່ມືນຕາເລີຍ (None)</option>
                  </select>
                </div>

                {/* V */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ການປາກເວົ້າ (Verbal - V)
                  </label>
                  <select
                    value={formData.gcs_v}
                    onChange={e => handleChange('gcs_v', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={5}>5: ຮູ້ທິດທາງເວົ້າຖືກຕ້ອງ (Oriented)</option>
                    <option value={4}>4: ເວົ້າສັບສົນ (Confused)</option>
                    <option value={3}>3: ເວົ້າເປັນຄຳໆບໍ່ຕໍ່ເນື່ອງ (Inappropriate)</option>
                    <option value={2}>2: ສຽງຄາງບໍ່ເປັນຄຳ (Incomprehensible)</option>
                    <option value={1}>1: ບໍ່ມີສຽງເລີຍ (None)</option>
                  </select>
                </div>

                {/* M */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ການເຄື່ອນເໜັງ (Motor - M)
                  </label>
                  <select
                    value={formData.gcs_m}
                    onChange={e => handleChange('gcs_m', Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value={6}>6: ເຮັດຕາມສັ່ງໄດ້ (Obeys commands)</option>
                    <option value={5}>5: ປັດຈຸດເຈັບຖືກຕ້ອງ (Localizes to pain)</option>
                    <option value={4}>4: ຫົດແຂນໜີເຈັບ (Withdrawal to pain)</option>
                    <option value={3}>3: ງໍແຂນຜິດປົກກະຕິ (Abnormal flexion)</option>
                    <option value={2}>2: ຢຽດແຂນເກຣັງ (Abnormal extension)</option>
                    <option value={1}>1: ບໍ່ເຄື່ອນເໜັງເລີຍ (None)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Other Exam */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ອ່ອນແຮງແຂນຂາ (Motor Weakness)
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: ບໍ່ມີ, ອ່ອນແຮງຂ້າງຂວາ Grade 3/5"
                  value={formData.limb_weakness}
                  onChange={e => handleChange('limb_weakness', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວົງຕາດຳ-ຂວາ (Pupil Right)
                </label>
                <input
                  type="text"
                  placeholder="3mm RTL"
                  value={formData.pupil_right}
                  onChange={e => handleChange('pupil_right', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ວົງຕາດຳ-ຊ້າຍ (Pupil Left)
                </label>
                <input
                  type="text"
                  placeholder="3mm RTL"
                  value={formData.pupil_left}
                  onChange={e => handleChange('pupil_left', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຟັງປອດ (Lung Examination)
                </label>
                <input
                  type="text"
                  placeholder="Clear / Crepitation / Wheezing"
                  value={formData.lung_exam}
                  onChange={e => handleChange('lung_exam', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຟັງຫົວໃຈ (Heart Examination)
                </label>
                <input
                  type="text"
                  placeholder="Normal S1 S2 / Murmur"
                  value={formData.heart_exam}
                  onChange={e => handleChange('heart_exam', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ອາການອື່ນໆ
                </label>
                <input
                  type="text"
                  placeholder="ບາດແຜ, ເລືອດອອກ, ທ້ອງແຂງ..."
                  value={formData.other_symptoms}
                  onChange={e => handleChange('other_symptoms', e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: ການນຳສົ່ງ ================= */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ambulance className="w-5 h-5 text-teal-600" />
                <span>ຂັ້ນ 5: ການນຳສົ່ງ (Transfer & Logistics)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ການປິ່ນປົວເບື້ອງຕົ້ນ ແລະ ລາຍລະອຽດການຕິດຕໍ່ປະສານງານ (* ແມ່ນຊ່ອງບັງຄັບ)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ການປິ່ນປົວເບື້ອງຕົ້ນ (Initial Treatment Given)
              </label>
              <textarea
                rows={3}
                placeholder="ເຊັ່ນ: NSS 1000ml IV drip 100ml/hr, On O2 cannula 3LPM, Ceftriaxone 2g IV, Paracetamol 1g IV, Splinting..."
                value={formData.initial_treatment}
                onChange={e => handleChange('initial_treatment', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ເຫດຜົນຂອງການນຳສົ່ງ (Reason for Referral) <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="ເຊັ່ນ: ຕ້ອງການແພດຊ່ຽວຊານສະເພາະທາງ, ຂາດເຄື່ອງມື CT-Scan, ຄົນເຈັບອາການໜັກຕ້ອງການ ICU"
                value={formData.referral_reason}
                onChange={e => handleChange('referral_reason', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຜູ້ທີ່ຈະປະສານເຖິງ ໂຮງໝໍແຂວງຈຳປາສັກ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ເຊັ່ນ: ຫ້ອງສຸກເສີນ ER ໂຮງໝໍແຂວງ, ທ່ານໝໍເວນສຸກເສີນ"
                  value={formData.target_coordinator}
                  onChange={e => handleChange('target_coordinator', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ນຳສົ່ງດ້ວຍ (Transport Vehicle)
                </label>
                <input
                  type="text"
                  placeholder="ເຊັ່ນ: ລົດສຸກເສີນໂຮງໝໍເມືອງ, ລົດກູ້ໄພ 1623, ລົດສ່ວນຕົວ"
                  value={formData.transport_vehicle}
                  onChange={e => handleChange('transport_vehicle', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ຊື່ ທ່ານໝໍປິ່ນປົວຕົ້ນທາງ
                </label>
                <input
                  type="text"
                  placeholder="ຊື່ທ່ານໝໍຜູ້ສົ່ງຕໍ່"
                  value={formData.attending_doctor_name}
                  onChange={e => handleChange('attending_doctor_name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ເລກໂທລະສັບ ທ່ານໝໍປິ່ນປົວ
                </label>
                <input
                  type="tel"
                  placeholder="020-xxxxxxxx"
                  value={formData.attending_doctor_phone}
                  onChange={e => handleChange('attending_doctor_phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Actions */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ກັບຄືນ</span>
              </button>
            )}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="ml-2 px-3 py-2 text-xs sm:text-sm text-slate-500 hover:text-slate-700"
              >
                ຍົກເລີກ
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <span>ຂັ້ນຕອນຖັດໄປ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-60"
              >
                <FileCheck className="w-5 h-5" />
                <span>{isSubmitting ? 'ກຳລັງບັນທຶກ...' : editingReferral ? 'ບັນທຶກການແກ້ໄຂ' : 'ບັນທຶກ ແລະ ສ້າງໃບນຳສົ່ງ'}</span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
