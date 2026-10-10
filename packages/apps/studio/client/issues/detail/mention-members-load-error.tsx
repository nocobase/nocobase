import type { MouseEvent, ReactElement } from 'react';

import { Button } from '@/components/ui/button';

/** A failed project-member lookup stays visible until a retry succeeds. */
export function MentionMembersLoadError({
  message,
  retryLabel,
  onRetry,
  onRetryMouseDown,
  retrying = false,
}: {
  readonly message: string;
  readonly retryLabel: string;
  readonly onRetry: () => void;
  readonly onRetryMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly retrying?: boolean;
}): ReactElement {
  return (
    <div
      role='alert'
      className='mb-2 flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm'
    >
      <span>{message}</span>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        disabled={retrying}
        onMouseDown={onRetryMouseDown}
        onClick={onRetry}
      >
        {retryLabel}
      </Button>
    </div>
  );
}
