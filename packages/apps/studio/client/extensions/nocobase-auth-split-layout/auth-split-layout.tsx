import type { ReactElement, ReactNode } from 'react';

import { cn } from 'cn';

export interface AuthSplitLayoutProps {
  /** The application's mark, shown in a small tile. Pass an icon or an image sized to fill it. */
  readonly logo?: ReactNode;
  /** The application's name, beside the mark. */
  readonly name?: ReactNode;
  /** The page's heading, rendered as its `h1`. */
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The form, or `AuthMethods` with several. */
  readonly children: ReactNode;
  /** A short line at the bottom of the form column, such as terms or a copyright. */
  readonly footer?: ReactNode;
  /** What fills the right half from the `xl` breakpoint up, such as a product screenshot or a few highlights. */
  readonly aside?: ReactNode;
  /** The accessible name of the `aside` landmark. */
  readonly asideLabel?: string;
  readonly className?: string;
}

/** The page around an authentication form: the form in a column on the left, the application's `aside` on the right. */
export function AuthSplitLayout({
  aside,
  asideLabel,
  children,
  className,
  description,
  footer,
  logo,
  name,
  title,
}: AuthSplitLayoutProps): ReactElement {
  return (
    <div
      className={cn(
        'grid min-h-svh bg-background text-foreground',
        aside ? 'xl:grid-cols-2' : null,
        className,
      )}
    >
      <div className='flex flex-col gap-6 p-6 md:p-10'>
        <AuthBrand
          className='justify-center md:justify-start'
          logo={logo}
          name={name}
        />
        <main className='flex flex-1 items-center justify-center'>
          <div className='w-full max-w-sm'>
            <header className='mb-8 grid gap-1.5'>
              <h1 className='font-heading text-2xl font-semibold tracking-tight'>
                {title}
              </h1>
              {description ? (
                <p className='text-sm text-balance text-muted-foreground'>
                  {description}
                </p>
              ) : null}
            </header>
            {children}
          </div>
        </main>
        {footer ? (
          <div className='text-center text-xs text-muted-foreground md:text-left [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-foreground'>
            {footer}
          </div>
        ) : null}
      </div>
      {aside ? (
        <aside
          aria-label={asideLabel}
          className='relative isolate hidden overflow-hidden border-l bg-muted xl:block'
        >
          <DotPattern className='-z-10 [mask-image:linear-gradient(to_bottom,black,transparent)]' />
          {aside}
        </aside>
      ) : null}
    </div>
  );
}

interface AuthBrandProps {
  readonly logo?: ReactNode;
  readonly name?: ReactNode;
  readonly className?: string;
}

function AuthBrand({
  className,
  logo,
  name,
}: AuthBrandProps): ReactElement | null {
  if (!logo && !name) return null;
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {logo ? (
        <span className='flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background p-1.5 shadow-xs [&_img]:size-full [&_img]:object-contain [&_svg]:size-5'>
          {logo}
        </span>
      ) : null}
      {name ? (
        <span className='font-heading text-base font-semibold tracking-tight'>
          {name}
        </span>
      ) : null}
    </div>
  );
}

function DotPattern({
  className,
}: {
  readonly className?: string;
}): ReactElement {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-0 bg-[radial-gradient(color-mix(in_oklch,var(--foreground)_14%,transparent)_1px,transparent_1px)] [background-size:16px_16px]',
        className,
      )}
    />
  );
}
