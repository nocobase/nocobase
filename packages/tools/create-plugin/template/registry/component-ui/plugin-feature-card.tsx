import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';

export interface PluginFeatureCardProps {
  readonly actionLabel?: string;
  readonly description?: string;
  readonly eyebrow?: string;
  readonly onAction?: () => void;
  readonly title?: string;
}

export function PluginFeatureCard({
  actionLabel = 'Open feature',
  description =
    'This application-owned component can be adapted without changing the plugin runtime.',
  eyebrow = __NOCOBASE_DISPLAY_NAME_LITERAL__,
  onAction,
  title = 'Editable Registry component',
}: PluginFeatureCardProps): ReactElement {
  return (
    <section className='overflow-hidden rounded-2xl border bg-card shadow-sm'>
      <div className='h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent' />
      <div className='space-y-5 p-6'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold tracking-[0.18em] text-primary uppercase'>
            {eyebrow}
          </p>
          <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>
          <p className='max-w-xl text-sm leading-6 text-muted-foreground'>
            {description}
          </p>
        </div>
        {onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
      </div>
    </section>
  );
}
