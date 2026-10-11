import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { NAMESPACE } from '../lib/format.js';
import { Input } from './ui/input.js';

/** The collapsible demo options under a form. */
export function DemoOptions({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <details className='rounded-lg bg-muted/50 px-3 py-2 text-sm'>
      <summary className='cursor-pointer text-muted-foreground'>
        {t('common.demoOptions')}
      </summary>
      <div className='mt-2 space-y-2'>{children}</div>
    </details>
  );
}

export function NumberOption({
  label,
  value,
  onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
}): ReactElement {
  return (
    <label className='flex items-center gap-2'>
      <span className='min-w-0 flex-1'>{label}</span>
      <Input
        className='w-20'
        type='number'
        min={0}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
