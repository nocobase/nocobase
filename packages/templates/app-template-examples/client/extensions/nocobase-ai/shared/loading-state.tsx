import { LoaderCircle } from 'lucide-react';
import type { ReactElement } from 'react';

export interface LoadingStateProps {
  readonly label?: string;
  readonly className?: string;
}

export function LoadingState({
  label = 'Loading…',
  className = '',
}: LoadingStateProps): ReactElement {
  return (
    <div
      className={`flex min-h-24 items-center justify-center gap-2 text-sm text-muted-foreground ${className}`}
      role='status'
    >
      <LoaderCircle className='h-4 w-4 animate-spin' aria-hidden='true' />
      <span>{label}</span>
    </div>
  );
}
