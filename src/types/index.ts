import type { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export type UserRole = 'driver' | 'host' | 'both';

export interface UserProfile {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: UserRole;
  onboardingComplete: boolean;
  /** ISO locale preference ('en' | 'fr') */
  locale?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------
export type SpotType =
  | 'driveway'
  | 'garage'
  | 'surface_lot'
  | 'underground'
  | 'street';

export type AccessType = 'key' | 'code' | 'open' | 'app';

export type VehicleSize = 'compact' | 'standard' | 'suv' | 'oversized';

export type Amenity =
  | 'covered'
  | 'ev_charging'
  | 'security_camera'
  | 'lighting'
  | 'wheelchair'
  | 'heated';

export type PricingModel = 'hourly' | 'daily' | 'monthly';

export type ListingStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface AvailabilityWindow {
  /** Day of week: 0 = Sun … 6 = Sat */
  dayOfWeek: number;
  openTime: string;  // "HH:mm"
  closeTime: string; // "HH:mm"
}

export interface Listing {
  id?: string;
  hostId: string;
  // Location
  address: string;
  unit?: string;
  city: string;
  province: string;
  postalCode: string;
  geo: GeoPoint;
  // Details
  spotType: SpotType;
  accessType: AccessType;
  acceptedVehicleSizes: VehicleSize[];
  amenities: Amenity[];
  description: string;
  // Pricing
  pricingModel: PricingModel;
  hourlyRate?: number;
  dailyRate?: number;
  monthlyRate?: number;
  currency: string;
  minBookingHours?: number;
  maxBookingDays?: number;
  instantBook: boolean;
  availability: AvailabilityWindow[];
  // Photos
  photoURLs: string[];
  // Status
  status: ListingStatus;
  // Aggregates (denormalised for fast reads)
  totalReviews: number;
  averageRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'active'
  | 'completed'
  | 'cancelled';

export interface Booking {
  id?: string;
  listingId: string;
  hostId: string;
  driverId: string;
  pricingModel: PricingModel;
  startAt: Timestamp;
  endAt: Timestamp;
  vehiclePlate: string;
  vehicleMake?: string;
  status: BookingStatus;
  // Pricing snapshot at time of booking
  subtotalCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  // QR / access
  accessToken: string;
  checkedInAt?: Timestamp | Date;
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
export interface Review {
  id?: string;
  bookingId: string;
  listingId: string;
  authorId: string;
  // Star ratings 1–5
  overallRating: number;
  accuracyRating?: number;
  cleanlinessRating?: number;
  accessRating?: number;
  communicationRating?: number;
  body?: string;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Subscriptions (monthly passes)
// ---------------------------------------------------------------------------
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';

export interface Subscription {
  id?: string;
  listingId: string;
  hostId: string;
  driverId: string;
  monthlyRateCents: number;
  currency: string;
  status: SubscriptionStatus;
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  accessToken: string;
  vehiclePlate: string;
  vehicleMake?: string;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
