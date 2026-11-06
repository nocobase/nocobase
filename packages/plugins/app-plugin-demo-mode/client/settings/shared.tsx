import type { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import { useErrorText } from './context.js';

export function ErrorAlert({
  error,
  action,
}: {
  readonly error: unknown;
  readonly action?: ReactNode;
}): ReactElement | null {
  const text = useErrorText();
  if (!error) return null;
  return (
    <Alert variant='destructive'>
      <AlertTitle>{text(error)}</AlertTitle>
      {action ? <AlertDescription>{action}</AlertDescription> : null}
    </Alert>
  );
}
