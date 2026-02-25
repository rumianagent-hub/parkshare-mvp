'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import type {
  SpotType,
  AccessType,
  VehicleSize,
  Amenity,
  PricingModel,
} from '@/types';

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormData {
  // Step 1
  address: string;
  unit: string;
  city: string;
  province: string;
  postalCode: string;
  // Step 2
  spotType: SpotType;
  accessType: AccessType;
  acceptedVehicleSizes: VehicleSize[];
  amenities: Amenity[];
  description: string;
  // Step 3
  pricingModel: PricingModel;
  hourlyRate: string;
  dailyRate: string;
  monthlyRate: string;
  instantBook: boolean;
}

const initialFormData: FormData = {
  address: '',
  unit: '',
  city: 'Montreal',
  province: 'QC',
  postalCode: '',
  spotType: 'driveway',
  accessType: 'open',
  acceptedVehicleSizes: ['standard'],
  amenities: [],
  description: '',
  pricingModel: 'monthly',
  hourlyRate: '',
  dailyRate: '',
  monthlyRate: '',
  instantBook: true,
};

// ---------------------------------------------------------------------------
// Step progress indicator
// ---------------------------------------------------------------------------
function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {labels.map((label, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isActive = stepNum === current;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors
                  ${isDone ? 'bg-green-700 text-white' : isActive ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-500'}`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span className={`text-xs hidden sm:block ${isActive ? 'text-green-700 font-medium' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      {/* connecting line */}
      <div className="relative -mt-5 h-0.5 bg-gray-200 mx-4 -z-10">
        <div
          className="absolute left-0 top-0 h-full bg-green-600 transition-all"
          style={{ width: `${((current - 1) / (total - 1)) * 100}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 text-center mt-4">
        Step {current} of {total}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Location
// ---------------------------------------------------------------------------
function Step1Location({
  data,
  onChange,
  errors,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const t = useTranslations('host.create.location');
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('heading')}</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('address')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder={t('addressPlaceholder')}
          className={`field ${errors.address ? 'field-error' : ''}`}
        />
        {errors.address && (
          <p className="text-xs text-red-600 mt-1">{errors.address}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('unit')}
        </label>
        <input
          type="text"
          value={data.unit}
          onChange={(e) => onChange('unit', e.target.value)}
          placeholder="Apt 2B"
          className="field"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('city')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={`field ${errors.city ? 'field-error' : ''}`}
          />
          {errors.city && (
            <p className="text-xs text-red-600 mt-1">{errors.city}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('province')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.province}
            onChange={(e) => onChange('province', e.target.value)}
            className={`field ${errors.province ? 'field-error' : ''}`}
          />
          {errors.province && (
            <p className="text-xs text-red-600 mt-1">{errors.province}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('postalCode')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={data.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value.toUpperCase())}
          placeholder="H2X 1Y1"
          className={`field ${errors.postalCode ? 'field-error' : ''}`}
        />
        {errors.postalCode && (
          <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Details
// ---------------------------------------------------------------------------
const SPOT_TYPES: SpotType[] = ['driveway', 'garage', 'surface_lot', 'underground'];
const ACCESS_TYPES: AccessType[] = ['key', 'code', 'open', 'app'];
const VEHICLE_SIZES: VehicleSize[] = ['compact', 'standard', 'suv'];
const AMENITY_OPTIONS: Amenity[] = ['covered', 'lighting', 'ev_charging', 'security_camera'];

function Step2Details({
  data,
  onChange,
  onMultiToggle,
  errors,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string) => void;
  onMultiToggle: <T extends string>(
    field: keyof FormData,
    value: T,
    current: T[]
  ) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const t = useTranslations('host.create.details');

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">{t('heading')}</h2>

      {/* Spot Type */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          {t('spotType')} <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {SPOT_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors
                ${data.spotType === type ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="radio"
                name="spotType"
                value={type}
                checked={data.spotType === type}
                onChange={() => onChange('spotType', type)}
                className="text-green-600"
              />
              <span className="text-sm text-gray-700">
                {t(`spotTypes.${type}` as Parameters<typeof t>[0])}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Access Type */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          {t('accessType')} <span className="text-red-500">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {ACCESS_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors
                ${data.accessType === type ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <input
                type="radio"
                name="accessType"
                value={type}
                checked={data.accessType === type}
                onChange={() => onChange('accessType', type)}
                className="text-green-600"
              />
              <span className="text-sm text-gray-700">
                {t(`accessTypes.${type}` as Parameters<typeof t>[0])}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Vehicle Sizes */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          {t('vehicleSizes')} <span className="text-red-500">*</span>
        </legend>
        {errors.acceptedVehicleSizes && (
          <p className="text-xs text-red-600 mb-2">{errors.acceptedVehicleSizes}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {VEHICLE_SIZES.map((size) => {
            const checked = data.acceptedVehicleSizes.includes(size);
            return (
              <label
                key={size}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors
                  ${checked ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onMultiToggle('acceptedVehicleSizes', size, data.acceptedVehicleSizes)
                  }
                  className="text-green-600"
                />
                {t(`vehicleSizeOptions.${size}` as Parameters<typeof t>[0])}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Amenities */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          {t('amenities')}
        </legend>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((amenity) => {
            const checked = data.amenities.includes(amenity);
            return (
              <label
                key={amenity}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors
                  ${checked ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onMultiToggle('amenities', amenity, data.amenities)
                  }
                  className="text-green-600"
                />
                {t(`amenityOptions.${amenity}` as Parameters<typeof t>[0])}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('description')} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          rows={4}
          className={`field resize-none ${errors.description ? 'field-error' : ''}`}
        />
        <p className="text-xs text-gray-400 mt-1">
          {data.description.length} / 20 min · {t('descriptionHint')}
        </p>
        {errors.description && (
          <p className="text-xs text-red-600 mt-1">{errors.description}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Pricing
// ---------------------------------------------------------------------------
const PRICING_MODELS: PricingModel[] = ['hourly', 'daily', 'monthly'];

function Step3Pricing({
  data,
  onChange,
  errors,
}: {
  data: FormData;
  onChange: (field: keyof FormData, value: string | boolean) => void;
  errors: Partial<Record<keyof FormData, string>>;
}) {
  const t = useTranslations('host.create.pricing');

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">{t('heading')}</h2>

      {/* Pricing model */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">
          {t('pricingModel')} <span className="text-red-500">*</span>
        </legend>
        <div className="space-y-2">
          {PRICING_MODELS.map((model) => {
            const isMonthly = model === 'monthly';
            const isActive = data.pricingModel === model;
            return (
              <label
                key={model}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors
                  ${isActive ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricingModel"
                    value={model}
                    checked={isActive}
                    onChange={() => onChange('pricingModel', model)}
                    className="text-green-600"
                  />
                  <span className="text-sm text-gray-700">
                    {t(`models.${model}` as Parameters<typeof t>[0])}
                  </span>
                </div>
                {isMonthly && (
                  <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                    Recommended
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Rate input */}
      {data.pricingModel === 'hourly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('hourlyRate')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="0.50"
              value={data.hourlyRate}
              onChange={(e) => onChange('hourlyRate', e.target.value)}
              placeholder="5.00"
              className={`field pl-7 ${errors.hourlyRate ? 'field-error' : ''}`}
            />
          </div>
          {errors.hourlyRate && (
            <p className="text-xs text-red-600 mt-1">{errors.hourlyRate}</p>
          )}
        </div>
      )}

      {data.pricingModel === 'daily' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dailyRate')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="1"
              value={data.dailyRate}
              onChange={(e) => onChange('dailyRate', e.target.value)}
              placeholder="20.00"
              className={`field pl-7 ${errors.dailyRate ? 'field-error' : ''}`}
            />
          </div>
          {errors.dailyRate && (
            <p className="text-xs text-red-600 mt-1">{errors.dailyRate}</p>
          )}
        </div>
      )}

      {data.pricingModel === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('monthlyRate')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              min="0"
              step="5"
              value={data.monthlyRate}
              onChange={(e) => onChange('monthlyRate', e.target.value)}
              placeholder="150.00"
              className={`field pl-7 ${errors.monthlyRate ? 'field-error' : ''}`}
            />
          </div>
          {errors.monthlyRate && (
            <p className="text-xs text-red-600 mt-1">{errors.monthlyRate}</p>
          )}
        </div>
      )}

      {/* Instant booking */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {t('instantBook')}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t('instantBookDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange('instantBook', !data.instantBook)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${data.instantBook ? 'bg-green-600' : 'bg-gray-200'}`}
          aria-checked={data.instantBook}
          role="switch"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${data.instantBook ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Review
// ---------------------------------------------------------------------------
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  );
}

function Step4Review({
  data,
  onSubmit,
  submitting,
  submitError,
}: {
  data: FormData;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const t = useTranslations('host.create');

  const rateLabel =
    data.pricingModel === 'monthly'
      ? `$${data.monthlyRate} CAD / month`
      : data.pricingModel === 'daily'
      ? `$${data.dailyRate} CAD / day`
      : `$${data.hourlyRate} CAD / hr`;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">{t('review.heading')}</h2>

      <div className="rounded-xl border border-gray-200 p-4 space-y-0">
        <ReviewRow
          label="Address"
          value={`${data.address}${data.unit ? `, ${data.unit}` : ''}, ${data.city}, ${data.province} ${data.postalCode}`}
        />
        <ReviewRow label="Spot type" value={data.spotType.replace('_', ' ')} />
        <ReviewRow label="Access" value={data.accessType} />
        <ReviewRow
          label="Vehicle sizes"
          value={data.acceptedVehicleSizes.join(', ')}
        />
        {data.amenities.length > 0 && (
          <ReviewRow label="Amenities" value={data.amenities.join(', ')} />
        )}
        <ReviewRow
          label="Description"
          value={
            data.description.length > 80
              ? data.description.slice(0, 80) + '…'
              : data.description
          }
        />
        <ReviewRow label="Pricing" value={`${data.pricingModel} — ${rateLabel}`} />
        <ReviewRow
          label="Instant book"
          value={data.instantBook ? 'Yes' : 'No'}
        />
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-6 py-3 text-base font-medium text-white transition hover:bg-green-800 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting…
          </>
        ) : (
          t('review.submitListing')
        )}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function validateStep1(data: FormData): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};
  if (!data.address.trim()) errors.address = 'Address is required.';
  if (!data.city.trim()) errors.city = 'City is required.';
  if (!data.province.trim()) errors.province = 'Province is required.';
  if (!data.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  return errors;
}

function validateStep2(data: FormData): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};
  if (data.acceptedVehicleSizes.length === 0)
    errors.acceptedVehicleSizes = 'Select at least one vehicle size.';
  if (data.description.trim().length < 20)
    errors.description = 'Description must be at least 20 characters.';
  return errors;
}

function validateStep3(data: FormData): Partial<Record<keyof FormData, string>> {
  const errors: Partial<Record<keyof FormData, string>> = {};
  if (data.pricingModel === 'monthly' && !data.monthlyRate)
    errors.monthlyRate = 'Monthly rate is required.';
  if (data.pricingModel === 'daily' && !data.dailyRate)
    errors.dailyRate = 'Daily rate is required.';
  if (data.pricingModel === 'hourly' && !data.hourlyRate)
    errors.hourlyRate = 'Hourly rate is required.';
  return errors;
}

// ---------------------------------------------------------------------------
// Main wizard component
// ---------------------------------------------------------------------------
export default function CreateListingWizard() {
  const t = useTranslations('host.create');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = 4;
  const stepLabels = [
    t('steps.location'),
    t('steps.details'),
    t('steps.pricing'),
    t('steps.review'),
  ];

  // Generic field setter
  function handleChange(field: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Multi-value toggle (checkboxes)
  function handleMultiToggle<T extends string>(
    field: keyof FormData,
    value: T,
    current: T[]
  ) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setFormData((prev) => ({ ...prev, [field]: next }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleNext() {
    let stepErrors: Partial<Record<keyof FormData, string>> = {};

    if (step === 1) stepErrors = validateStep1(formData);
    else if (step === 2) stepErrors = validateStep2(formData);
    else if (step === 3) stepErrors = validateStep3(formData);

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setStep((prev) => Math.min(prev + 1, totalSteps));
  }

  function handleBack() {
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    if (!user) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await addDoc(collection(db, COLLECTIONS.LISTINGS), {
        hostId: user.uid,
        address: formData.address.trim(),
        unit: formData.unit.trim() || undefined,
        city: formData.city.trim(),
        province: formData.province.trim(),
        postalCode: formData.postalCode.trim(),
        spotType: formData.spotType,
        accessType: formData.accessType,
        acceptedVehicleSizes: formData.acceptedVehicleSizes,
        amenities: formData.amenities,
        description: formData.description.trim(),
        pricingModel: formData.pricingModel,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
        monthlyRate: formData.monthlyRate ? parseFloat(formData.monthlyRate) : undefined,
        currency: 'CAD',
        instantBook: formData.instantBook,
        photoURLs: [],
        status: 'active',
        totalReviews: 0,
        averageRating: 0,
        // Required by Listing type — defaults for MVP
        geo: { lat: 0, lng: 0 },
        availability: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(`/${locale}/host/listings`);
    } catch (err) {
      console.error('Failed to create listing:', err);
      setSubmitError(t('review.submitError'));
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} total={totalSteps} labels={stepLabels} />

      {/* Step content */}
      {step === 1 && (
        <Step1Location data={formData} onChange={handleChange} errors={errors} />
      )}
      {step === 2 && (
        <Step2Details
          data={formData}
          onChange={handleChange}
          onMultiToggle={handleMultiToggle}
          errors={errors}
        />
      )}
      {step === 3 && (
        <Step3Pricing data={formData} onChange={handleChange} errors={errors} />
      )}
      {step === 4 && (
        <Step4Review
          data={formData}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      {/* Navigation */}
      {step < 4 && (
        <div className="mt-8 flex justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ← {tCommon('back')}
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-800"
          >
            {tCommon('next')} →
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="mt-4 flex justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ← {tCommon('back')}
          </button>
        </div>
      )}
    </div>
  );
}
