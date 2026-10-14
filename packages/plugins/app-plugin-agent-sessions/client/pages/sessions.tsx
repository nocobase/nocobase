/**
 * `/agent-sessions`: the viewer's sessions beside the open one, or beside a new session when none is open. On a phone
 * they take turns: the list first, then a session, or a new one (`?new`), on its own.
 */
import { cn } from 'cn';
import type { ReactElement } from 'react';
import { useMatch, useOutlet, useSearchParams } from 'react-router';

import { NewSession } from '../components/new-session.js';
import { SessionList } from '../components/session-list.js';

export default function AgentSessionsPage(): ReactElement {
  const outlet = useOutlet();
  const open = useMatch('/agent-sessions/:sessionId');
  const [params] = useSearchParams();
  const focused = Boolean(open) || params.has('new');
  return (
    <div className='flex h-full min-h-0'>
      <SessionList
        activeId={open?.params.sessionId}
        className={cn(focused && 'hidden md:flex')}
      />
      <main className={cn('min-w-0 flex-1', !focused && 'hidden md:block')}>
        {outlet ?? <NewSession />}
      </main>
    </div>
  );
}
