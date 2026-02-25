'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import type {
  Listing,
  SpotType,
  AccessType,
  VehicleSize,
  Amenity,
  PricingModel,
} from '@/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface Props {
  listing: Listing & { id: string };
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------
interface FormState {
  address: string;
  unit: string;
  city: string;
  province: string;
  postalCode: string;
  spotType: SpotType;
  accessType: AccessType;
  acceptedVehicleSizes: VehicleSize[];
  amenities: Amenity[];
  description: string;
  pricingModel: PricingModel;
  hourlyRate: string;
  dailyRate: string;
  monthlyRate: string;
  instantBook: boolean;
}

function listingToForm(listing: Listing): FormState {
  return {
    address: listing.address,
    unit: listing.unit ?? '',
    city: listing.city,
    province: listing.province,
    postalCode: listing.postalCode,
    spotType: listing.spotType,
    accessType: listing.accessType,
    acceptedVehicleSizes: listing.acceptedVehicleSizes,
    amenities: listing.amenities,
    description: listing.description,
    pricingModel: listing.pricingModel,
    hourlyRate: listing.hourlyRate?.toString() ?? '',
    dailyRate: listing.dailyRate?.toString() ?? '',
    monthlyRate: listing.monthlyRate?.toString() ?? '',
    instantBook: listing.instantBook,
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SPOT_TYPES: SpotType[] = ['driveway', 'garage', 'surface_lot', 'underground'];
const ACCESS_TYPES: AccessType[] = ['key', 'code', 'open', 'app'];
const VEHICLE_SIZES: VehicleSize[] = ['compact', 'standard', 'suv'];
const AMENITY_OPTIONS: Amenity[] = ['covered', 'lighting', 'ev_charging', 'security_camera', 'wheelchair', 'heated'];
const PRICING_MODELS: PricingModel[] = ['hourly', 'daily', 'monthly'];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(data: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!data.address.trim()) errors.address = 'Address is required.';
  if (!data.city.trim()) errors.city = 'City is required.';
  if (!data.province.trim()) errors.province = 'Province is required.';
  if (!data.postalCode.trim()) errors.postalCode = 'Postal code is required.';
  if (data.acceptedVehicleSizes.length === 0)
    errors.acceptedVehicleSizes = 'Select at least one vehicle size.';
  if (data.description.trim().length < 20)
    errors.description = 'Description must be at least 20 characters.';
  if (data.pricingModel === 'monthly' && !data.monthlyRate)
    errors.monthlyRate = 'Monthly rate is required.';
  if (data.pricingModel === 'daily' && !data.dailyRate)
    errors.dailyRate = 'Daily rate is required.';
  if (data.pricingModel === 'hourly' && !data.hourlyRate)
    errors.hourlyRate = 'Hourly rate is required.';
  return errors;
}

// ---------------------------------------------------------------------------
// Reusable field label
// ---------------------------------------------------------------------------
function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function EditListingForm({ listing }: Props) {
  const t = useTranslations('host.edit');
  const tDetails = useTranslations('host.create.details');
  const tPricing = useTranslations('host.create.pricing');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [form, setForm] = useState<FormState>(() => listingToForm(listing));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleMultiToggle<T extends string>(
    field: keyof FormState,
    value: T,
    current: T[]
  ) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setForm((prev) => ({ ...prev, [field]: next }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaveSuccess(false);
    setSaveError(null);

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      await updateDoc(doc(db, COLLECTIONS.LISTINGS, listing.id), {
        address: form.address.trim(),
        unit: form.unit.trim() || null,
        city: form.city.trim(),
        province: form.province.trim(),
        postalCode: form.postalCode.trim(),
        spotType: form.spotType,
        accessType: form.accessType,
        acceptedVehicleSizes: form.acceptedVehicleSizes,
        amenities: form.amenities,
        description: form.description.trim(),
        pricingModel: form.pricingModel,
        hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : null,
        dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : null,
        monthlyRate: form.monthlyRate ? parseFloat(form.monthlyRate) : null,
        instantBook: form.instantBook,
        updatedAt: serverTimestamp(),
      });
      setSaveSuccess(true);
    } catch (err) {
      console.error('Update failed:', err);
      setSaveError(t('saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/host/listings`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← {tCommon('back')}
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ── Location ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Location</h2>

          <div>
            <Label htmlFor="address" required>Address</Label>
            <input
              id="address"
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className={`field ${errors.address ? 'field-error' : ''}`}
            />
            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
          </div>

          <div>
            <Label htmlFor="unit">Unit (optional)</Label>
            <input
              id="unit"
              type="text"
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="field"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" required>City</Label>
              <input
                id="city"
                type="text"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className={`field ${errors.city ? 'field-error' : ''}`}
              />
              {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
            </div>
            <div>
              <Label htmlFor="province" required>Province</Label>
              <input
                id="province"
                type="text"
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className={`field ${errors.province ? 'field-error' : ''}`}
              />
              {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="postalCode" required>Postal Code</Label>
            <input
              id="postalCode"
              type="text"
              value={form.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value.toUpperCase())}
              className={`field ${errors.postalCode ? 'field-error' : ''}`}
            />
            {errors.postalCode && <p className="text-xs text-red-600 mt-1">{errors.postalCode}</p>}
          </div>
        </section>

        {/* ── Details ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Spot Details</h2>

          {/* Spot type */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {tDetails('spotType')} <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {SPOT_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors
                    ${form.spotType === type ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="spotType"
                    value={type}
                    checked={form.spotType === type}
                    onChange={() => handleChange('spotType', type)}
                    className="text-green-600"
                  />
                  <span className="text-sm text-gray-700">
                    {tDetails(`spotTypes.${type}` as Parameters<typeof tDetails>[0])}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Access type */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {tDetails('accessType')} <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {ACCESS_TYPES.map((type) => (
                <label
                  key={type}
                  className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors
                    ${form.accessType === type ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="accessType"
                    value={type}
                    checked={form.accessType === type}
                    onChange={() => handleChange('accessType', type)}
                    className="text-green-600"
                  />
                  <span className="text-sm text-gray-700">
                    {tDetails(`accessTypes.${type}` as Parameters<typeof tDetails>[0])}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Vehicle sizes */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {tDetails('vehicleSizes')} <span className="text-red-500">*</span>
            </legend>
            {errors.acceptedVehicleSizes && (
              <p className="text-xs text-red-600 mb-2">{errors.acceptedVehicleSizes}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {VEHICLE_SIZES.map((size) => {
                const checked = form.acceptedVehicleSizes.includes(size);
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
                        handleMultiToggle('acceptedVehicleSizes', size, form.acceptedVehicleSizes)
                      }
                      className="text-green-600"
                    />
                    {tDetails(`vehicleSizeOptions.${size}` as Parameters<typeof tDetails>[0])}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Amenities */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {tDetails('amenities')}
            </legend>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => {
                const checked = form.amenities.includes(amenity);
                return (
                  <label
                    key={amenity}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors
                      ${checked ? 'border-green-600 bg-green-50 text-green-800' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleMultiToggle('amenities', amenity, form.amenities)}
                      className="text-green-600"
                    />
                    {tDetails(`amenityOptions.${amenity}` as Parameters<typeof tDetails>[0])}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Description */}
          <div>
            <Label htmlFor="description" required>
              {tDetails('description')}
            </Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              placeholder={tDetails('descriptionPlaceholder')}
              className={`field resize-none ${errors.description ? 'field-error' : ''}`}
            />
            <p className="text-xs text-gray-400 mt-1">
              {form.description.length} characters · min 20
            </p>
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description}</p>
            )}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-semibold text-gray-800">Pricing</h2>

          {/* Pricing model */}
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">
              {tPricing('pricingModel')} <span className="text-red-500">*</span>
            </legend>
            <div className="space-y-2">
              {PRICING_MODELS.map((model) => (
                <label
                  key={model}
                  className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors
                    ${form.pricingModel === model ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pricingModel"
                      value={model}
                      checked={form.pricingModel === model}
                      onChange={() => handleChange('pricingModel', model)}
                      className="text-green-600"
                    />
                    <span className="text-sm text-gray-700">
                      {tPricing(`models.${model}` as Parameters<typeof tPricing>[0])}
                    </span>
                  </div>
                  {model === 'monthly' && (
                    <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                      Recommended
                    </span>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Rate inputs */}
          {form.pricingModel === 'hourly' && (
            <div>
              <Label htmlFor="hourlyRate" required>
                {tPricing('hourlyRate')}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="0.50"
                  value={form.hourlyRate}
                  onChange={(e) => handleChange('hourlyRate', e.target.value)}
                  className={`field pl-7 ${errors.hourlyRate ? 'field-error' : ''}`}
                />
              </div>
              {errors.hourlyRate && (
                <p className="text-xs text-red-600 mt-1">{errors.hourlyRate}</p>
              )}
            </div>
          )}

          {form.pricingModel === 'daily' && (
            <div>
              <Label htmlFor="dailyRate" required>
                {tPricing('dailyRate')}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  id="dailyRate"
                  type="number"
                  min="0"
                  step="1"
                  value={form.dailyRate}
                  onChange={(e) => handleChange('dailyRate', e.target.value)}
                  className={`field pl-7 ${errors.dailyRate ? 'field-error' : ''}`}
                />
              </div>
              {errors.dailyRate && (
                <p className="text-xs text-red-600 mt-1">{errors.dailyRate}</p>
              )}
            </div>
          )}

          {form.pricingModel === 'monthly' && (
            <div>
              <Label htmlFor="monthlyRate" required>
                {tPricing('monthlyRate')}
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  id="monthlyRate"
                  type="number"
                  min="0"
                  step="5"
                  value={form.monthlyRate}
                  onChange={(e) => handleChange('monthlyRate', e.target.value)}
                  className={`field pl-7 ${errors.monthlyRate ? 'field-error' : ''}`}
                />
              </div>
              {errors.monthlyRate && (
                <p className="text-xs text-red-600 mt-1">{errors.monthlyRate}</p>
              )}
            </div>
          )}

          {/* Instant book */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {tPricing('instantBook')}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {tPricing('instantBookDesc')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('instantBook', !form.instantBook)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${form.instantBook ? 'bg-green-600' : 'bg-gray-200'}`}
              aria-checked={form.instantBook}
              role="switch"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${form.instantBook ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </section>

        {/* ── Status messages ── */}
        {saveSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            ✓ {t('saveSuccess')}
          </div>
        )}
        {saveError && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {/* ── Submit ── */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/host/listings`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            ← {tCommon('back')}
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {tCommon('saving')}
              </>
            ) : (
              t('saveChanges')
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
