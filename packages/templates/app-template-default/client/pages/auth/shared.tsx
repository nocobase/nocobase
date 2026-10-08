import { resolveAssetUrl } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Blocks, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { AuthSplitLayout } from '@/extensions/nocobase-auth-split-layout/auth-split-layout';

export interface AuthPageProps {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly children: ReactNode;
}

/**
 * The frame every sign-in, sign-up and password page shares: the form on the left, and on wide screens the NocoBase
 * brand panel on the right. Replace `BrandPanel` with the application's own content, or install
 * `auth-centered-layout` from the UI Library to drop the panel.
 */
export function AuthPage({
  children,
  description,
  title,
}: AuthPageProps): ReactElement {
  const { t } = useTranslation();
  return (
    <AuthSplitLayout
      aside={<BrandPanel />}
      asideLabel={t('auth.about')}
      description={description}
      logo={
        <>
          <img
            alt=''
            className='dark:hidden'
            src={resolveAssetUrl('/assets/logo-mark.png')}
          />
          <img
            alt=''
            className='hidden dark:block'
            src={resolveAssetUrl('/assets/logo-mark-dark.png')}
          />
        </>
      }
      name={t('app.title')}
      title={title}
    >
      {children}
    </AuthSplitLayout>
  );
}

// The brand panel is deliberately dark in both color modes, so it uses fixed neutrals rather than theme tokens.
function BrandPanel(): ReactElement {
  const { t } = useTranslation();
  const features = [
    {
      description: t('auth.frontendDescription'),
      icon: Sparkles,
      id: 'frontend',
      title: t('auth.frontend'),
    },
    {
      description: t('auth.foundationDescription'),
      icon: ShieldCheck,
      id: 'foundation',
      title: t('auth.foundation'),
    },
  ];

  return (
    <div className='relative grid h-full place-items-center overflow-hidden bg-neutral-950 p-12 text-white'>
      <div className='pointer-events-none absolute inset-0 [background-image:linear-gradient(currentColor_1px,transparent_1px),linear-gradient(90deg,currentColor_1px,transparent_1px)] [background-size:48px_48px] opacity-[0.08]' />
      <div className='relative w-full max-w-xl'>
        <p className='text-xs font-semibold tracking-[0.16em] text-white/55 uppercase'>
          {t('auth.platform')}
        </p>
        <h2 className='mt-4 text-5xl leading-[1.05] font-semibold tracking-[-0.045em]'>
          {t('auth.marketingTitleFirst')}
          <br />
          {t('auth.marketingTitleSecond')}
          <br />
          {t('auth.marketingTitleThird')}
        </h2>
        <p className='mt-5 text-sm leading-6 text-white/60'>
          {t('auth.marketingDescription')}
        </p>
        <div className='mt-8 overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-2xl'>
          <div className='space-y-5 p-6'>
            {features.map(({ description, icon: Icon, id, title }) => (
              <div className='flex gap-4' key={id}>
                <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-neutral-100 text-neutral-700'>
                  <Icon aria-hidden='true' className='size-5' />
                </span>
                <div>
                  <p className='font-semibold'>{title}</p>
                  <p className='mt-1 text-sm leading-6 text-neutral-500'>
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className='flex items-center gap-3 bg-neutral-100 px-6 py-4 text-sm font-medium text-neutral-600'>
            <Blocks aria-hidden='true' className='size-4' />
            <span>{t('auth.marketingFooter')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
