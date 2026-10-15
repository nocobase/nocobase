import type { Session, SessionLink } from '../../shared/api.js';
import { linkIcon, linkNeedsYou } from './tones.js';

/** What a session's row and header say about it at a glance. */
export interface SessionFacts {
  readonly online: boolean;
  /** Its agent asks for permission, its work waits to be started, or something tied to it waits for the viewer. */
  readonly needsMe: boolean;
  /** Its agent is answering, or work tied to it goes on. */
  readonly active: boolean;
  /** The project it works for, else where most of its work belongs. */
  readonly group: string | null;
  /** How many records tied to it wait for the viewer. */
  readonly waitingLinks: number;
}

export function sessionFacts(session: Session): SessionFacts {
  return {
    online: session.computerOnline,
    needsMe:
      session.waiting ||
      session.links.some((link) => awaitsStart(link) || linkNeedsYou(link)),
    active:
      session.running ||
      session.links.some((link) =>
        link.status?.icon
          ? linkIcon(link) === 'started'
          : link.status?.tone === 'active',
      ),
    waitingLinks: session.links.filter(linkNeedsYou).length,
    group:
      session.project?.name ??
      mostCommon(
        session.links.flatMap((link) => (link.group ? [link.group] : [])),
      ),
  };
}

/** The work on it can start from the session and its owner has not decided yet. */
export function awaitsStart(link: SessionLink): boolean {
  return link.startable && link.decidedAt === null;
}

function mostCommon(values: readonly string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
