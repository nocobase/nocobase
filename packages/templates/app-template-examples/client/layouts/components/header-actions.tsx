import { useTranslation } from '@nocobase/i18n/client';
import { Settings } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '#components/ui/tooltip';

import { ThemeSettings } from '../../theme/index.js';
import { UserMenu } from './user-menu.js';
import { InboxHeaderButton } from '#components/inbox-header-button';

const ACTION_LINK_CLASS =
  'inline-flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background/60 text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/** Keep header entries visible on their destination pages so navigation stays consistent across surfaces. */
export function HeaderActions({
  showSettings,
}: {
  readonly showSettings: boolean;
}): ReactElement {
  const { t } = useTranslation();

  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        {/* The inbox's entry, from the UI Library; keep its unread shortcut on every authenticated surface. */}
        <InboxHeaderButton />
        {showSettings ? (
          <Tooltip>
            <TooltipTrigger
              render={<Link to='/settings' className={ACTION_LINK_CLASS} />}
              aria-label={t('settings.title', { defaultValue: 'Settings' })}
            >
              <Settings className='size-5' />
            </TooltipTrigger>
            <TooltipContent side='bottom'>
              {t('settings.title', { defaultValue: 'Settings' })}
            </TooltipContent>
          </Tooltip>
        ) : null}
        <ThemeSettings />
        <UserMenu />
      </div>
    </TooltipProvider>
  );
}
