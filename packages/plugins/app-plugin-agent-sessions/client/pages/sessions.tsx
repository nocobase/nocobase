/**
 * `/agent-sessions`: the viewer's sessions beside the open one. Entered without one on a wide screen, it opens the latest
 * session; a new session shows when there is none, or when asked for (`?new`). On a phone they take turns: the list
 * first, then a session, or a new one (`?new`), on its own.
 */
import { cn } from 'cn';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  Navigate,
  useLocation,
  useMatch,
  useOutlet,
  useSearchParams,
} from 'react-router';

import { useSessions } from '../api.js';

import { NewSession } from '../components/new-session.js';
import { SessionList } from '../components/session-list.js';
import { useLinkPanels } from '../config.js';

/** Below this width an open record's panel folds the session list to a rail, so the conversation keeps its room. */
const ROOMY = '(min-width: 1600px)';

function useMatches(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const change = () => setMatches(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, [query]);
  return matches;
}

export default function AgentSessionsPage(): ReactElement {
  const outlet = useOutlet();
  const location = useLocation();
  const open = useMatch('/agent-sessions/:sessionId');
  const [params, setParams] = useSearchParams();
  // Starting a draft makes this an explicit new session before a late list can redirect it.
  const startNew = useCallback(() => {
    if (params.has('new')) return;
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set('new', '');
        return next;
      },
      { replace: true },
    );
  }, [params, setParams]);
  const focused = Boolean(open) || params.has('new');
  const linkPanels = useLinkPanels();
  const roomy = useMatches(ROOMY);
  const opened = Object.keys(linkPanels)
    .filter((kind) => params.has(kind))
    .map((kind) => `${kind}:${params.get(kind) ?? ''}`)
    .join(',');
  const panel = opened !== '';
  // Unfolded by hand, it stays unfolded while that record is open; the next one folds it again.
  const [expandedFor, setExpandedFor] = useState<string | null>(null);
  const expanded = expandedFor === opened;
  // Entering the page on a wide screen opens the latest session; a new one only when there is none, or when asked
  // (`?new`). While that read is pending, the new-session editor stays usable. A phone starts on the list.
  const wide = useMatches('(min-width: 768px)');
  const sessions = useSessions(false);
  const latest = sessions.data?.pages[0]?.data[0];
  if (!open && !params.has('new') && wide && latest)
    return (
      <Navigate
        replace
        to={{
          pathname: `/agent-sessions/${encodeURIComponent(latest.id)}`,
          search: location.search,
        }}
      />
    );
  return (
    <div className='flex h-full min-h-0'>
      <SessionList
        activeId={open?.params.sessionId}
        className={cn(focused && 'hidden md:flex')}
        rail={panel && !roomy && !expanded}
        onExpand={() => setExpandedFor(opened)}
      />
      <main className={cn('min-w-0 flex-1', !focused && 'hidden md:block')}>
        {outlet ?? (
          <NewSession
            onStart={startNew}
            deferDiscovery={!params.has('new') && wide && sessions.isPending}
          />
        )}
      </main>
    </div>
  );
}
