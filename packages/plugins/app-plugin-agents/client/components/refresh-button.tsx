/**
 * The Refresh of a page whose data changes underneath the reader without a live update, such as the usage report: an
 * outline icon button with the tooltip "Refresh", spinning until the refresh it started settles. It ends the page
 * header's actions, as the application's own Refresh does (UI guidelines R4).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { cn } from 'cn';
import { Button } from './ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

export function RefreshButton({
  onRefresh,
}: {
  /** Refetches the page's data; the icon spins until the promise settles. */
  readonly onRefresh: () => Promise<unknown>;
}): ReactElement {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const label = t('common.refresh');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label={label}
            aria-busy={pending}
            onClick={() => {
              if (pending) return;
              setPending(true);
              onRefresh()
                .catch(() => undefined)
                .finally(() => setPending(false));
            }}
          />
        }
      >
        <RefreshCwIcon
          aria-hidden='true'
          className={cn(pending && 'animate-spin')}
        />
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}
