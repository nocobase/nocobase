import type { ReactElement } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HeaderChat } from '../../agents/header-chat.js';

import { UserMenu } from './user-menu.js';

/** Keep header entries visible on their destination pages so navigation stays consistent across surfaces. */
export function HeaderActions(): ReactElement {
  return (
    <TooltipProvider>
      <div className='flex shrink-0 items-center gap-2'>
        {/* Desktop editor; the layout places the mobile editor on a second row. */}
        <HeaderChat />
        {/* Theme and language are quick choices in the account menu; Preferences holds them all. */}
        <UserMenu />
      </div>
    </TooltipProvider>
  );
}
