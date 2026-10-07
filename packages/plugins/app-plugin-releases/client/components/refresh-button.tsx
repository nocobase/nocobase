/**
 * The Refresh of a page whose data changes underneath the reader (deployments, runtime states, requests): an outline
 * icon button with the tooltip "Refresh", spinning while the page reloads. It ends the page header's actions, as the
 * application's own Refresh does (UI guidelines R4).
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCwIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { cn } from 'cn';
import { Button } from './ui/button.js';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip.js';

export function RefreshButton({
  onRefresh,
  refreshing,
}: {
  readonly onRefresh: () => void;
  /** Whether the page is reloading: the icon spins. */
  readonly refreshing: boolean;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const label = t('ui.common.refresh');
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant='outline'
            size='icon'
            aria-label={label}
            aria-busy={refreshing}
            onClick={() => {
              if (!refreshing) onRefresh();
            }}
          />
        }
      >
        <RefreshCwIcon
          aria-hidden='true'
          className={cn(refreshing && 'animate-spin')}
        />
      </TooltipTrigger>
      <TooltipContent side='bottom'>{label}</TooltipContent>
    </Tooltip>
  );
}
