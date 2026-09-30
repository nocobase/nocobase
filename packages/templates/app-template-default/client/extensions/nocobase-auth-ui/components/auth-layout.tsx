import type { ReactElement, ReactNode } from 'react';

import { AuthFormTabs, type AuthFormTab } from './auth-form-tabs.js';

export interface AuthLayoutProps {
  readonly description: ReactNode;
  readonly form?: ReactNode;
  readonly forms?: readonly AuthFormTab[];
  readonly logo: ReactNode;
  readonly marketing?: ReactNode;
  readonly sso?: ReactNode;
  readonly title: ReactNode;
}

export function AuthLayout({
  logo,
  description,
  form,
  forms,
  marketing,
  sso,
  title,
}: AuthLayoutProps): ReactElement {
  return (
    <div className='grid min-h-svh bg-background text-foreground md:grid-cols-[minmax(420px,44%)_1fr]'>
      <main className='grid place-items-center bg-card px-6 py-10 text-card-foreground sm:px-12'>
        <section className='w-full max-w-sm'>
          <div className='mb-14'>{logo}</div>
          <header className='mb-8'>
            <h1 className='text-3xl font-semibold tracking-[-0.035em]'>
              {title}
            </h1>
            <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
          </header>
          {forms?.length ? <AuthFormTabs tabs={forms} /> : form}
          {sso ? <div className='mt-8'>{sso}</div> : null}
        </section>
      </main>
      {marketing}
    </div>
  );
}
