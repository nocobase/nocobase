/**
 * The tabs of a detail page, kept in the URL (`?tab=`) so a link, a refresh and the browser's back button return to the
 * same tab. The first tab is the default and leaves the URL clean.
 */
import type { ReactElement, ReactNode } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.js';

export interface PageTab<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly content: ReactNode;
}

/** The tab list, what every tab shows above its content (`banner`), then the current tab. */
export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  banner,
  label,
}: {
  readonly tabs: readonly PageTab<T>[];
  readonly value: T;
  readonly onChange: (next: T) => void;
  readonly banner?: ReactNode;
  /** The accessible name of the tab list. */
  readonly label: string;
}): ReactElement {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as T)}
      className='gap-6'
    >
      <div className='border-b'>
        <TabsList variant='line' aria-label={label} className='-mb-px'>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className='px-3'>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {banner}
      {tabs.map((tab) =>
        tab.value === value ? (
          <TabsContent key={tab.value} value={tab.value} className='space-y-6'>
            {tab.content}
          </TabsContent>
        ) : null,
      )}
    </Tabs>
  );
}
