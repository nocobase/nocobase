/**
 * The one refresh action of a page whose data changes underneath the reader without a live update: an outline icon
 * button with the tooltip "Refresh", spinning while the refresh it started (or `refreshing`) is under way. It sits in the
 * page header's actions, or at the end of the toolbar of a page whose header holds no actions (UI guidelines R4).
 * `useRefreshQueries` (`use-refresh-queries.ts`) makes its `onRefresh` from the page's queries.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from 'cn';

export interface RefreshButtonProps {
  /** Refetches the page's data; the button spins until the promise it returns settles. */
  readonly onRefresh: () => Promise<unknown> | void;
  /** Also spin while this holds, such as a query's `isFetching` after the button started it. */
  readonly refreshing?: boolean;
}

export function RefreshButton({
  onRefresh,
  refreshing = false,
}: RefreshButtonProps): ReactElement {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const spinning = pending || refreshing;
  const label = t('actions.refresh');
  const refresh = () => {
    if (pending) return;
    setPending(true);
    Promise.resolve()
      .then(onRefresh)
      .catch(() => undefined)
      .finally(() => setPending(false));
  };
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label={label}
            aria-busy={spinning}
            onClick={refresh}
          />
        }
      >
        <RefreshCwIcon
          aria-hidden='true'
          className={cn(spinning && 'animate-spin')}
        />
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}
