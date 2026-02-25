'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { COLLECTIONS } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import type { Listing, ListingStatus } from '@/types';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: ListingStatus }) {
  const t = useTranslations('host.listings');

  const classes: Record<ListingStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    pending: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${classes[status]}`}
    >
      {t(`status.${status}` as Parameters<typeof t>[0])}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex animate-pulse gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-3 w-64 rounded bg-gray-100" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-200" />
      <div className="h-4 w-20 rounded bg-gray-100" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type ListingWithId = Listing & { id: string };

export default function HostListingsTable() {
  const t = useTranslations('host');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();

  const [listings, setListings] = useState<ListingWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchListings() {
      try {
        setLoading(true);
        const q = query(
          collection(db, COLLECTIONS.LISTINGS),
          where('hostId', '==', user!.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Listing),
        }));
        setListings(docs);
      } catch (err) {
        console.error('Failed to fetch listings:', err);
        setError('Failed to load listings. Please refresh.');
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [user, authLoading]);

  // Toggle active / inactive
  async function handleToggleStatus(listing: ListingWithId) {
    const next: ListingStatus = listing.status === 'active' ? 'inactive' : 'active';
    setActionLoading(listing.id);
    try {
      await updateDoc(doc(db, COLLECTIONS.LISTINGS, listing.id), {
        status: next,
        updatedAt: new Date(),
      });
      setListings((prev) =>
        prev.map((l) => (l.id === listing.id ? { ...l, status: next } : l))
      );
    } catch (err) {
      console.error('Toggle failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

  // Delete
  async function handleDelete(listing: ListingWithId) {
    const confirmed = window.confirm(t('listings.confirmDelete'));
    if (!confirmed) return;

    setActionLoading(listing.id);
    try {
      await deleteDoc(doc(db, COLLECTIONS.LISTINGS, listing.id));
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert(t('listings.deleteError'));
    } finally {
      setActionLoading(null);
    }
  }

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        {error}
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            className="h-8 w-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="mb-2 text-base font-medium text-gray-700">
          {t('dashboard.noListings')}
        </p>
        <p className="mb-6 text-sm text-gray-400">
          {t('dashboard.subtitle')}
        </p>
        <Link
          href={`/${locale}/host/listings/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
        >
          + {t('dashboard.addFirst')}
        </Link>
      </div>
    );
  }

  // Desktop table / mobile cards
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr className="text-left">
              <th className="px-6 py-3 font-medium text-gray-600">Address</th>
              <th className="px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 font-medium text-gray-600">Monthly Rate</th>
              <th className="px-4 py-3 font-medium text-gray-600 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {listings.map((listing) => {
              const isLoading = actionLoading === listing.id;
              return (
                <tr key={listing.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {listing.address}
                      {listing.unit ? `, ${listing.unit}` : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      {listing.city}, {listing.province} {listing.postalCode}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {listing.monthlyRate
                      ? `$${listing.monthlyRate} CAD`
                      : listing.hourlyRate
                      ? `$${listing.hourlyRate}/hr`
                      : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/host/listings/${listing.id}/edit`}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                      >
                        {tCommon('edit')}
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        disabled={isLoading}
                        className="rounded-md px-3 py-1.5 text-xs font-medium border border-gray-200 disabled:opacity-50 hover:bg-gray-100 text-gray-600"
                      >
                        {listing.status === 'active'
                          ? t('listings.actions.deactivate')
                          : t('listings.actions.activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(listing)}
                        disabled={isLoading}
                        className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 disabled:opacity-50"
                      >
                        {tCommon('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 md:hidden">
        {listings.map((listing) => {
          const isLoading = actionLoading === listing.id;
          return (
            <div key={listing.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">
                    {listing.address}
                    {listing.unit ? `, ${listing.unit}` : ''}
                  </p>
                  <p className="text-xs text-gray-500">
                    {listing.city}, {listing.province} {listing.postalCode}
                  </p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
              <p className="text-sm text-gray-600">
                {listing.monthlyRate
                  ? `$${listing.monthlyRate} CAD / month`
                  : listing.hourlyRate
                  ? `$${listing.hourlyRate} CAD / hr`
                  : '—'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/host/listings/${listing.id}/edit`}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                >
                  {tCommon('edit')}
                </Link>
                <button
                  onClick={() => handleToggleStatus(listing)}
                  disabled={isLoading}
                  className="rounded-md px-3 py-1.5 text-xs font-medium border border-gray-200 disabled:opacity-50 hover:bg-gray-100 text-gray-600"
                >
                  {listing.status === 'active'
                    ? t('listings.actions.deactivate')
                    : t('listings.actions.activate')}
                </button>
                <button
                  onClick={() => handleDelete(listing)}
                  disabled={isLoading}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 disabled:opacity-50"
                >
                  {tCommon('delete')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
