import type { ReactElement, ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { cn } from 'cn';

export interface AuthCenteredLayoutProps {
  /** The application's mark, shown in a small tile. Pass an icon or an image sized to fill it. */
  readonly logo?: ReactNode;
  /** The application's name, beside the mark. */
  readonly name?: ReactNode;
  /** The page's heading, rendered as its `h1`. */
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The form, or `AuthMethods` with several. */
  readonly children: ReactNode;
  /** A short line under the card, such as terms or a copyright. */
  readonly footer?: ReactNode;
  readonly className?: string;
}

/** The page around an authentication form: the brand above a card in the middle of a muted page. */
export function AuthCenteredLayout({
  children,
  className,
  description,
  footer,
  logo,
  name,
  title,
}: AuthCenteredLayoutProps): ReactElement {
  return (
    <div
      className={cn(
        'relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden bg-muted/40 px-4 py-10 text-foreground sm:px-6',
        className,
      )}
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10'
      >
        <div className='absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_50%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent)]' />
        <DotPattern className='[mask-image:radial-gradient(ellipse_45%_45%_at_50%_50%,black,transparent)]' />
      </div>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <AuthBrand className='self-center' logo={logo} name={name} />
        <Card className='shadow-sm [--card-spacing:--spacing(6)]'>
          <CardHeader className='text-center'>
            <CardTitle className='text-xl font-semibold tracking-tight'>
              <h1>{title}</h1>
            </CardTitle>
            {description ? (
              <CardDescription className='text-balance'>
                {description}
              </CardDescription>
            ) : null}
          </CardHeader>
          {/* A separator's label sits on the card, not on the page background it assumes. */}
          <CardContent className='pt-2 [&_[data-slot=field-separator-content]]:bg-card'>
            {children}
          </CardContent>
        </Card>
        {footer ? (
          <div className='px-6 text-center text-xs text-balance text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-foreground'>
            {footer}
          </div>
        ) : null}
      </div>
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
