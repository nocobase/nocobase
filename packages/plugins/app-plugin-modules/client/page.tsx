import type { ReactElement, ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import type { ModuleDescriptor } from '../shared/types.js';
export function ModulePage({
  module,
  children,
}: {
  readonly module: ModuleDescriptor;
  readonly children?: ReactNode;
}): ReactElement {
  const { t } = useTranslation(module.namespace);
  return (
    <section className='flex flex-col gap-4'>
      <header>
        <h1 className='text-xl font-semibold'>{t('title')}</h1>
        <p className='text-sm text-muted-foreground'>{t('description')}</p>
      </header>
      {children}
    </section>
  );
}
