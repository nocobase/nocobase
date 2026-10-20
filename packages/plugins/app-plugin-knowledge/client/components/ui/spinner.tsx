import { ACCESS_NAMESPACE } from '../../../shared/access.js';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';

function Spinner(inputProps: React.ComponentProps<'svg'>): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const { className, ...props } = inputProps;

  return (
    <Loader2Icon
      data-slot='spinner'
      role='status'
      aria-label={t('knowledge.loading', { defaultValue: 'Loading' })}
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
