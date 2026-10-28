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

import { useTranslation } from '@nocobase/i18n/client';
import { ArchiveIcon } from 'lucide-react';

import { useSessions } from '../api.js';

import { NewSession } from '../components/new-session.js';
import { SessionList } from '../components/session-list.js';
import { useAgentSessionsConfig } from '../config.js';
import { useSessionsLayout } from '../sessions-layout.js';

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
  const { linkPanels, layoutStoragePrefix } = useAgentSessionsConfig();
  const opened = Object.keys(linkPanels)
    .filter((kind) => params.has(kind))
    .map((kind) => `${kind}:${params.get(kind) ?? ''}`)
    .join(',');
  const panel = opened !== '';
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  const layout = useSessionsLayout(width, layoutStoragePrefix, panel);
  // Entering the page on a wide screen opens the latest session; a new one only when there is none, or when asked
  // (`?new`). While that read is pending, the new-session editor stays usable. A phone starts on the list.
  const wide = useMatches('(min-width: 768px)');
  const sessions = useSessions(false);
  const latest = sessions.data?.pages[0]?.data[0];
  // While the list shows archived sessions, an open session that is not one of them, or a new draft, stays mounted but
  // hidden, so the main area matches the list and an unsent draft survives the trip back.
  const [archived, setArchived] = useState(false);
  const archivedSessions = useSessions(archived);
  const openId = open?.params.sessionId;
  const showsArchived =
    archived &&
    !archivedSessions.data?.pages.some((page) =>
      page.data.some((session) => session.id === openId),
    );
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
    <div ref={setElement} className='relative flex h-full min-h-0'>
      <SessionList
        activeId={openId}
        className={cn(focused && 'hidden md:flex')}
        placement={wide ? layout.list : 'column'}
        {...(wide
          ? {
              onFold: () => layout.setListUnfolded(false),
              onExpand: () => layout.setListUnfolded(true),
            }
          : {})}
        archived={archived}
        onArchivedChange={setArchived}
        onNewSession={() => setArchived(false)}
      />
      <main className={cn('min-w-0 flex-1', !focused && 'hidden md:block')}>
        {showsArchived && <ArchivedView />}
        <div
          className={showsArchived ? undefined : 'contents'}
          hidden={showsArchived}
        >
          {outlet ?? (
            <NewSession
              onStart={startNew}
              deferDiscovery={!params.has('new') && wide && sessions.isPending}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function ArchivedView(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm'>
      <ArchiveIcon className='size-5' aria-hidden />
      <h2 className='text-foreground text-base font-semibold'>
        {t('list.archived')}
      </h2>
      <p>{t('list.archivedView')}</p>
    </div>
  );
}
