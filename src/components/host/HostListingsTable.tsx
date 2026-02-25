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
    active: 'bg-green-50 text-green-700 border border-green-100',
    inactive: 'bg-gray-50 text-gray-500 border border-gray-200',
    pending: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
    suspended: 'bg-red-50 text-red-600 border border-red-100',
  };

  const dots: Record<ListingStatus, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-400',
    pending: 'bg-yellow-500',
    suspended: 'bg-red-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />
      {t(`status.${status}` as Parameters<typeof t>[0])}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex animate-pulse gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-48 rounded bg-gray-100" />
        <div className="h-3 w-64 rounded bg-gray-50" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-100" />
      <div className="h-4 w-20 rounded bg-gray-50" />
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

  // Loading
  if (loading || authLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  // Empty state — illustration style
  if (listings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
        <div className="mx-auto mb-5 text-6xl">🏠</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {t('dashboard.noListings')}
        </h3>
        <p className="text-sm text-gray-400 mb-8 max-w-xs mx-auto">
          Add your first parking spot and start earning. It only takes a few minutes.
        </p>
        <Link
          href={`/${locale}/host/listings/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-800 transition-colors"
        >
          <span>+</span>
          <span>{t('dashboard.addFirst')}</span>
        </Link>
      </div>
    );
  }

  // Stats bar
  const activeCount = listings.filter((l) => l.status === 'active').length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Spots</p>
          <p className="text-2xl font-extrabold text-gray-900">{listings.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Active</p>
          <p className="text-2xl font-extrabold text-green-700">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hidden sm:block">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Inactive</p>
          <p className="text-2xl font-extrabold text-gray-400">{listings.length - activeCount}</p>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-left">
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Address
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Status
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Rate
              </th>
              <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-400 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listings.map((listing) => {
              const isLoading = actionLoading === listing.id;
              return (
                <tr
                  key={listing.id}
                  className="group hover:bg-gray-50/60 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                      {listing.address}
                      {listing.unit ? `, ${listing.unit}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {listing.city}, {listing.province} {listing.postalCode}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={listing.status} />
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-700">
                    {listing.monthlyRate
                      ? `$${listing.monthlyRate} /mo`
                      : listing.hourlyRate
                      ? `$${listing.hourlyRate} /hr`
                      : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/${locale}/host/listings/${listing.id}/edit`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200 transition-colors"
                      >
                        {tCommon('edit')}
                      </Link>
                      <button
                        onClick={() => handleToggleStatus(listing)}
                        disabled={isLoading}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                      >
                        {listing.status === 'active'
                          ? t('listings.actions.deactivate')
                          : t('listings.actions.activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(listing)}
                        disabled={isLoading}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 disabled:opacity-40 transition-colors"
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
      <div className="space-y-3 md:hidden">
        {listings.map((listing) => {
          const isLoading = actionLoading === listing.id;
          return (
            <div
              key={listing.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    {listing.address}
                    {listing.unit ? `, ${listing.unit}` : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {listing.city}, {listing.province} {listing.postalCode}
                  </p>
                </div>
                <StatusBadge status={listing.status} />
              </div>
              <p className="text-sm font-medium text-gray-600">
                {listing.monthlyRate
                  ? `$${listing.monthlyRate} CAD / month`
                  : listing.hourlyRate
                  ? `$${listing.hourlyRate} CAD / hr`
                  : '—'}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={`/${locale}/host/listings/${listing.id}/edit`}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                >
                  {tCommon('edit')}
                </Link>
                <button
                  onClick={() => handleToggleStatus(listing)}
                  disabled={isLoading}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                >
                  {listing.status === 'active'
                    ? t('listings.actions.deactivate')
                    : t('listings.actions.activate')}
                </button>
                <button
                  onClick={() => handleDelete(listing)}
                  disabled={isLoading}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 disabled:opacity-40"
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
