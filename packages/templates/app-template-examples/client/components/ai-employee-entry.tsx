import { useState, type ReactElement, type ReactNode } from 'react';

import {
  AIChatFloatingTrigger,
  AIChatProvider,
  AIChatWindow,
  ChatSurface,
  ChatSurfaceActions,
  NocoBaseAIRootProvider,
  useAI,
  useAIChatControllerState,
  useGlobalAIChatController,
} from '#extensions/nocobase-ai';

const PANEL_WIDTH = 450;

/**
 * The application's one AI employee entry, wrapped around the signed-in layout: a floating trigger at the lower
 * right opens the shared conversation as a side panel, which can expand into a dialog without remounting the chat.
 *
 * Any page below reaches the same conversation through `useGlobalAIChatController()`, for example to run an AI
 * employee task with `controller.triggerTask({ aiEmployee, task, open: true })`, or through `AIEmployeeShortcut`.
 * The components come from the application-owned `nocobase-ai` Registry item in `client/extensions/nocobase-ai`.
 */
export function AIEmployeeEntry({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  return (
    <NocoBaseAIRootProvider>
      <GlobalAIChat>{children}</GlobalAIChat>
    </NocoBaseAIRootProvider>
  );
}

function GlobalAIChat({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const ai = useAI();
  const controller = useGlobalAIChatController();
  const { open } = useAIChatControllerState(controller);
  const [expanded, setExpanded] = useState(false);
  // Without a ready configuration and an employee the current user may talk to, there is nothing to open.
  const available =
    ai.configurationStatus === 'ready' && ai.employees.length > 0;

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) setExpanded(false);
    controller.setOpen(nextOpen);
  };

  return (
    <AIChatProvider id='global' controller={controller}>
      {/* On a wide screen the side panel pushes the layout narrower rather than covering the page; on a narrow
      screen, and once expanded into a dialog, it lies over it. */}
      <div
        data-ai-panel-open={open && !expanded}
        className='transition-[padding] duration-200 md:data-[ai-panel-open=true]:pr-[450px]'
      >
        {children}
      </div>
      {available ? <AIChatFloatingTrigger /> : null}
      <ChatSurface
        open={open}
        variant={expanded ? 'dialog' : 'side-panel'}
        onOpenChange={handleOpenChange}
        width={PANEL_WIDTH}
      >
        <AIChatWindow
          enableAttachments
          headerActions={
            <ChatSurfaceActions
              expanded={expanded}
              onExpandedChange={setExpanded}
              onClose={() => handleOpenChange(false)}
            />
          }
        />
      </ChatSurface>
    </AIChatProvider>
  );
}
