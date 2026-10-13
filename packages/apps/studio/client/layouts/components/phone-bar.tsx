/**
 * The top row of a page that hides the shell's header on a phone (`../immersive.ts`): the page's own start (Back, or
 * its heading) with the navigation and the agent chat at the end, as the header offers them. Nothing on wider screens.
 */
import type { ReactElement, ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ChatHeaderButton } from '@/extensions/nocobase-agent-chat/launchers';
import { cn } from 'cn';

import { AppSidebarToggle } from './app-sidebar.js';

export function PhoneBar({
  children,
  className,
}: {
  readonly children?: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <div
      className={cn('flex min-h-11 items-center gap-1 md:hidden', className)}
      data-testid='phone-bar'
    >
      <div className='flex min-w-0 flex-1 items-center gap-1'>{children}</div>
      <TooltipProvider>
        <ChatHeaderButton />
      </TooltipProvider>
      <AppSidebarToggle />
    </div>
  );
}
