import type { ReactElement } from 'react';
import { TooltipProvider } from '#components/ui/tooltip';

import { UserMenu } from './user-menu.js';
import { ChatHeaderButton } from '#extensions/nocobase-agent-chat/launchers';

/** The header's right-hand actions, shared by every authenticated page. */
export function HeaderActions(): ReactElement {
  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        <ChatHeaderButton />
        <UserMenu />
      </div>
    </TooltipProvider>
  );
}
