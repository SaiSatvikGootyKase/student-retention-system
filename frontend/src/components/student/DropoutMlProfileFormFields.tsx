import React from 'react';
import type { DropoutMlProfilePayload } from '../../api';
import {
  ADDR,
  FAM,
  GENDERS,
  GUARDIANS,
  JOBS,
  PAR,
  REASONS,
  SCHOOLS,
  YES_NO,
} from '../../utils/dropoutProfilePayload';

type Props = {
  form: DropoutMlProfilePayload;
  update: <K extends keyof DropoutMlProfilePayload>(key: K, value: DropoutMlProfilePayload[K]) => void;
  num: (key: keyof DropoutMlProfilePayload, v: string, min: number, max: number) => void;
  selectClass: string;
};

export default function DropoutMlProfileFormFields({ form, update, num, selectClass }: Props) {
  return (
    <>
      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">School & identity</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">
            School (GP / MS or text from registration)
            <input
              type="text"
              required
              className={`mt-1 ${selectClass}`}
              value={form.school}
              onChange={e => update('school', e.target.value)}
              placeholder="e.g. GP or MS"
              list="school-suggestions-profile"
            />
            <datalist id="school-suggestions-profile">
              {SCHOOLS.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Gender
            <select className={`mt-1 ${selectClass}`} value={form.gender} onChange={e => update('gender', e.target.value)}>
              {GENDERS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Age
            <input
              type="number"
              min={10}
              max={30}
              className={`mt-1 ${selectClass}`}
              value={form.age}
              onChange={e => num('age', e.target.value, 10, 30)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Area (U = urban, R = rural)
            <select className={`mt-1 ${selectClass}`} value={form.address} onChange={e => update('address', e.target.value)}>
              {ADDR.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Family</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">
            Family size
            <select className={`mt-1 ${selectClass}`} value={form.familySize} onChange={e => update('familySize', e.target.value)}>
              {FAM.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Parental status
            <select
              className={`mt-1 ${selectClass}`}
              value={form.parentalStatus}
              onChange={e => update('parentalStatus', e.target.value)}
            >
              {PAR.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Mother education (1–4)
            <input
              type="number"
              min={1}
              max={4}
              className={`mt-1 ${selectClass}`}
              value={form.motherEducation}
              onChange={e => num('motherEducation', e.target.value, 1, 4)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Father education (1–4)
            <input
              type="number"
              min={1}
              max={4}
              className={`mt-1 ${selectClass}`}
              value={form.fatherEducation}
              onChange={e => num('fatherEducation', e.target.value, 1, 4)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Parents & guardian</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">
            Mother occupation
            <select className={`mt-1 ${selectClass}`} value={form.motherJob} onChange={e => update('motherJob', e.target.value)}>
              {JOBS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Father occupation
            <select className={`mt-1 ${selectClass}`} value={form.fatherJob} onChange={e => update('fatherJob', e.target.value)}>
              {JOBS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Reason for choosing school
            <select
              className={`mt-1 ${selectClass}`}
              value={form.reasonForChoosingSchool}
              onChange={e => update('reasonForChoosingSchool', e.target.value)}
            >
              {REASONS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Guardian
            <select className={`mt-1 ${selectClass}`} value={form.guardian} onChange={e => update('guardian', e.target.value)}>
              {GUARDIANS.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Study & commute</legend>
        <p className="text-xs text-slate-500 -mt-1 mb-2">
          Course failures are not entered here — they are counted from your <strong>Results</strong> when you save.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-slate-600">
            Travel time (1–4)
            <input
              type="number"
              min={1}
              max={4}
              className={`mt-1 ${selectClass}`}
              value={form.travelTime}
              onChange={e => num('travelTime', e.target.value, 1, 4)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Study time (1–4)
            <input
              type="number"
              min={1}
              max={4}
              className={`mt-1 ${selectClass}`}
              value={form.studyTime}
              onChange={e => num('studyTime', e.target.value, 1, 4)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Support & activities</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['schoolSupport', 'familySupport', 'extraPaidClass', 'extraCurricularActivities', 'wantsHigherEducation', 'internetAccess'] as const).map(
            key => (
              <label key={key} className="text-xs font-semibold text-slate-600 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
                <select className={`mt-1 ${selectClass}`} value={form[key]} onChange={e => update(key, e.target.value)}>
                  {YES_NO.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            )
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Lifestyle & health (1–5 scales)</legend>
        <p className="text-xs text-slate-500 -mt-1 mb-2">
          Absence count is taken from your <strong>Attendance</strong> record (absent sessions) when you save.
        </p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(['familyRelationship', 'freeTime', 'goingOut', 'healthStatus'] as const).map(key => (
            <label key={key} className="text-xs font-semibold text-slate-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
              <input
                type="number"
                min={1}
                max={5}
                className={`mt-1 ${selectClass}`}
                value={form[key]}
                onChange={e => num(key, e.target.value, 1, 5)}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3 border border-slate-100 rounded-xl p-4">
        <legend className="text-xs font-bold text-slate-500 uppercase px-1">Grades (0–10)</legend>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="text-xs font-semibold text-slate-600">
            10th
            <input
              type="number"
              min={0}
              max={10}
              className={`mt-1 ${selectClass}`}
              value={form.grade1}
              onChange={e => num('grade1', e.target.value, 0, 10)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            PU2
            <input
              type="number"
              min={0}
              max={10}
              className={`mt-1 ${selectClass}`}
              value={form.grade2}
              onChange={e => num('grade2', e.target.value, 0, 10)}
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Present CGPA
            <input
              type="number"
              min={0}
              max={10}
              className={`mt-1 ${selectClass}`}
              value={form.finalGrade}
              onChange={e => num('finalGrade', e.target.value, 0, 10)}
            />
          </label>
        </div>
      </fieldset>
    </>
  );
}
