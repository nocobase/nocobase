import type { ReactElement } from 'react';

import { cn } from '../lib/utils.js';

export interface MailPageTab<TKey extends string> {
  readonly key: TKey;
  readonly label: string;
}

/** A row of tabs that scrolls sideways on a narrow screen instead of wrapping. */
export function MailPageTabs<TKey extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  readonly label: string;
  readonly tabs: readonly MailPageTab<TKey>[];
  readonly value: TKey;
  readonly onChange: (key: TKey) => void;
}): ReactElement {
  return (
    <div
      aria-label={label}
      className='-mx-1 flex max-w-full gap-1 overflow-x-auto border-b px-1'
      role='tablist'
    >
      {tabs.map((tab) => (
        <button
          aria-selected={tab.key === value}
          className={cn(
            '-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
            tab.key === value
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
          key={tab.key}
          onClick={() => onChange(tab.key)}
          role='tab'
          type='button'
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
