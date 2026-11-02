import { useChatPanel } from '@nocobase/app-plugin-agents/client/chat';
import { lazy, Suspense, useState, type ReactElement } from 'react';
import { Spinner } from '#components/ui/spinner';

const Panel = lazy(() => import('./panel.js'));

/** Loading the panel never suspends the current page; once opened, closing keeps its conversation mounted. */
export function OnlineAgentPanelHost(): ReactElement | null {
  const { available, open } = useChatPanel();
  const [opened, setOpened] = useState(false);
  if (open && !opened) setOpened(true);
  return available && (open || opened) ? (
    <Suspense
      fallback={
        open ? (
          <div className='p-4' role='status'>
            <Spinner />
          </div>
        ) : null
      }
    >
      <Panel />
    </Suspense>
  ) : null;
}
