import type { ReactElement } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatHeaderButton } from '@/extensions/nocobase-agent-chat/launchers';

import { UserMenu } from './user-menu.js';

/** Keep header entries visible on their destination pages so navigation stays consistent across surfaces. */
export function HeaderActions(): ReactElement {
  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        {/* The agents' chat panel (⌘J / Ctrl+J); hidden below md, where the floating button opens it. */}
        <div className='hidden md:contents'>
          <ChatHeaderButton />
        </div>
        {/* Theme and language are quick choices in the account menu; Preferences holds them all. */}
        <UserMenu />
      </div>
    </TooltipProvider>
  );
}
