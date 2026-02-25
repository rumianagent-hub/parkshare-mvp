import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import SignInForm from '@/components/auth/SignInForm';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'auth.signIn' });
  return { title: t('title') };
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Left — green branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-gradient-to-br from-green-900 via-green-800 to-green-600 px-12 text-white relative overflow-hidden">
        {/* Dot-grid overlay */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="signin-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#signin-dots)" />
        </svg>

        {/* Watermark P */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2 text-[280px] font-black text-white opacity-[0.05] select-none leading-none"
        >
          P
        </div>

        {/* Content */}
        <div className="relative text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm shadow-lg border border-white/20">
            <span className="text-5xl font-black text-white">P</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            Park<span className="text-green-300">Share</span>
          </h1>
          <p className="text-green-100/80 text-lg max-w-xs leading-relaxed">
            Find affordable parking or earn money by renting your spot.
          </p>

          {/* Trust points */}
          <div className="mt-12 space-y-4 text-left">
            {[
              { icon: '🏙️', text: 'Hundreds of spots in Montréal' },
              { icon: '⚡', text: 'Instant booking, no wait' },
              { icon: '💰', text: 'Earn passive income from your space' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-green-100/90">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — sign-in card */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-6 py-12">
        <SignInForm callbackUrl={searchParams.callbackUrl} />
      </div>
    </div>
  );
}
