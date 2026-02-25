'use client';
// TODO: load listing + calculate price breakdown
import { useTranslations } from 'next-intl';
interface Props { listingId: string; plan?: string; startAt?: string; endAt?: string; }
export default function BookingSummary(props: Props) {
  const t = useTranslations('checkout');
  return <div className="card space-y-4"><h2 className="font-semibold">{t('summary')}</h2></div>;
}
