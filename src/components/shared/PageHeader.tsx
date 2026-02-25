import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface PageHeaderProps {
  titleKey: string;
  subtitleKey?: string;
  actionHref?: string;
  actionKey?: string;
}

export default function PageHeader({
  titleKey,
  subtitleKey,
  actionHref,
  actionKey,
}: PageHeaderProps) {
  // NOTE: titleKey/subtitleKey/actionKey are dot-notation translation keys
  // e.g. "host.listings.title" → t('host.listings.title')
  // We use a raw translation function with the full key path trick.
  // In production, pass the already-translated strings from the page server component.
  const t = useTranslations();

  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t(titleKey as Parameters<typeof t>[0])}</h1>
        {subtitleKey && (
          <p className="mt-1 text-sm text-gray-500">
            {t(subtitleKey as Parameters<typeof t>[0])}
          </p>
        )}
      </div>
      {actionHref && actionKey && (
        <Link href={actionHref} className="btn-primary shrink-0">
          {t(actionKey as Parameters<typeof t>[0])}
        </Link>
      )}
    </div>
  );
}
