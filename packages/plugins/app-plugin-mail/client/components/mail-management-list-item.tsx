import type { ReactElement, ReactNode } from 'react';

import { cn } from '../lib/utils.js';
import { Button } from './ui/button.js';

interface MailManagementListItemProps {
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  readonly ariaLabel?: string;
}

export function MailManagementListItem({
  selected,
  onSelect,
  children,
  actions,
  ariaLabel,
}: MailManagementListItemProps): ReactElement {
  return (
    <div
      className={cn(
        'flex min-w-0 items-center border-l-2 border-transparent transition-colors hover:bg-muted/30',
        selected &&
          'border-b-transparent border-l-primary bg-primary/10 hover:bg-primary/15',
      )}
    >
      <Button
        aria-current={selected ? 'true' : undefined}
        aria-label={ariaLabel}
        className='h-auto min-w-0 flex-1 justify-start gap-3 px-4 py-2.5 text-left text-sm hover:bg-transparent focus-visible:ring-2 focus-visible:ring-inset'
        onClick={onSelect}
        type='button'
        variant='ghost'
      >
        {children}
      </Button>
      {actions ? (
        <div className='flex shrink-0 items-center gap-1 pr-2'>{actions}</div>
      ) : null}
    </div>
  );
}
