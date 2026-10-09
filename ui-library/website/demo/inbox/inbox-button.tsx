import { SearchIcon } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';

import { inboxBadge, useDocumentTitleBadge } from '#components/inbox-badge';
import { InboxButton } from '#components/inbox-button';
import { Avatar, AvatarFallback } from '#components/ui/avatar';
import { Button } from '#components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '#components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '#components/ui/tooltip';

/** Sample states, each setting both counts: what waits on the viewer, and what is unread. */
const PRESETS = {
  waiting: { label: 'Decisions waiting (3)', waiting: 3, unread: 12 },
  many: { label: 'Decisions waiting (150 → 99+)', waiting: 150, unread: 12 },
  unread: { label: 'Unread only (12)', waiting: 0, unread: 12 },
  none: { label: 'None', waiting: 0, unread: 0 },
} as const;

type Preset = keyof typeof PRESETS;

const isPreset = (value: unknown): value is Preset =>
  typeof value === 'string' && value in PRESETS;

/**
 * The inbox button in an application's header, beside the other header actions, as an application wires it: the
 * badge counts what waits on the viewer in amber, else the unread items, and prefixes the tab title. The presets below
 * set both counts.
 */
export function InboxButtonDemo(): ReactElement {
  const [preset, setPreset] = useState<Preset>('waiting');
  const { waiting, unread } = PRESETS[preset];
  const badge = inboxBadge(waiting, unread);
  useDocumentTitleBadge(badge?.text ?? null);
  const labelId = useId();
  return (
    <TooltipProvider>
      <div className='min-h-svh bg-background text-foreground'>
        <header className='flex h-14 items-center gap-2 border-b px-4'>
          <span className='mr-auto font-heading font-semibold'>Acme</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant='ghost' size='icon-lg' aria-label='Search' />
              }
            >
              <SearchIcon />
            </TooltipTrigger>
            <TooltipContent side='bottom'>Search</TooltipContent>
          </Tooltip>
          <InboxButton badge={badge} />
          <Avatar className='ml-1 size-8'>
            <AvatarFallback>LS</AvatarFallback>
          </Avatar>
        </header>
        <div className='flex flex-col gap-2 p-4 sm:p-6'>
          <p id={labelId} className='text-sm font-medium'>
            State
          </p>
          <ToggleGroup
            aria-labelledby={labelId}
            variant='outline'
            size='sm'
            className='flex-wrap'
            value={[preset]}
            onValueChange={(value: readonly unknown[]) => {
              const next = value[0];
              if (isPreset(next)) setPreset(next);
            }}
          >
            {(Object.keys(PRESETS) as Preset[]).map((key) => (
              <ToggleGroupItem key={key} value={key}>
                {PRESETS[key].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className='text-sm text-muted-foreground'>
            {waiting} waiting, {unread} unread: the badge shows{' '}
            {badge
              ? `${badge.text} (${badge.kind === 'decisions' ? 'waiting' : 'unread'})`
              : 'nothing'}
            .
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
