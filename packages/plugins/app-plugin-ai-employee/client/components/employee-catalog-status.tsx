import { RefreshCw } from 'lucide-react';
import type { ReactElement } from 'react';
import { Button } from './ui/button.js';
import { useT } from '../locales/index.js';

export function EmployeeCatalogStatus({
  loading,
  error,
  loadingLabel,
  errorLabel,
  onRetry,
}: {
  loading: boolean;
  error: boolean;
  loadingLabel: string;
  errorLabel: string;
  onRetry: () => void;
}): ReactElement | null {
  const t = useT();
  if (loading)
    return (
      <p role='status' className='text-sm text-muted-foreground'>
        {loadingLabel}
      </p>
    );
  if (!error) return null;
  return (
    <div role='alert' className='flex flex-wrap items-center gap-3 text-sm'>
      <span className='text-destructive'>{errorLabel}</span>
      <Button variant='outline' onClick={onRetry}>
        <RefreshCw data-icon='inline-start' />
        {t('Retry')}
      </Button>
    </div>
  );
}
