import { useTranslation } from '@nocobase/i18n/client';
import { ExternalLinkIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { cn } from 'cn';

/**
 * Shared frame for the reference pages: the business examples and the
 * component gallery share one header, one width and one section rhythm, so a
 * reader can compare pages without the layout changing under them.
 */

export interface ExamplePageProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** The shadcn documentation page the component gallery entry follows. */
  readonly docs?: string;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
}

export function ExamplePage({
  title,
  description,
  docs,
  actions,
  className,
  children,
}: ExamplePageProps): ReactElement {
  const { t } = useTranslation();

  return (
    <PageContainer className={className}>
      <PageHeader
        title={title}
        description={description}
        actions={
          actions || docs ? (
            <>
              {actions}
              {docs ? (
                <Button
                  variant='outline'
                  size='sm'
                  render={<a href={docs} target='_blank' rel='noreferrer' />}
                >
                  {t('reference.docs')}
                  <ExternalLinkIcon data-icon='inline-end' />
                </Button>
              ) : null}
            </>
          ) : undefined
        }
      />
      <div className='space-y-8'>{children}</div>
    </PageContainer>
  );
}

export interface ExampleSectionProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly className?: string;
  /**
   * Classes for the preview surface. The default lays children out as a
   * wrapping row; pass `block`, `grid-cols-*` or a fixed height when the
   * example needs a different shape.
   */
  readonly contentClassName?: string;
  readonly children: ReactNode;
}

export function ExampleSection({
  title,
  description,
  className,
  contentClassName,
  children,
}: ExampleSectionProps): ReactElement {
  return (
    <section className={cn('space-y-3', className)}>
      <div className='space-y-1'>
        <h2 className='font-heading text-base font-semibold tracking-tight'>
          {title}
        </h2>
        {description ? (
          <p className='text-sm text-muted-foreground'>{description}</p>
        ) : null}
      </div>
      <div
        className={cn(
          'flex flex-wrap items-center gap-4 rounded-lg border bg-card p-6 text-card-foreground',
          contentClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
