/** Session-only draft registry and subscriptions, with no detail reads or storage. */
import type {
  AttachmentUploads,
  IssueComment,
} from '@nocobase/app-plugin-projects/client/issues';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';

import { ComposerSession } from '../components/composer-session.js';

export class IssueDrafts {
  private revision = 0;
  private readonly listeners = new Set<() => void>();
  readonly sessions = new Map<string, ComposerSession>();
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  snapshot = (): number => this.revision;
  private changed = (): void => {
    this.revision += 1;
    for (const listener of this.listeners) listener();
  };
  ensure(id: string): void {
    if (this.sessions.has(id)) return;
    const session = new ComposerSession();
    session.subscribe(this.changed);
    this.sessions.set(id, session);
    this.changed();
  }
  hasDraft(id: string): boolean {
    const session = this.sessions.get(id);
    return Boolean(
      session &&
      (session.read('content', '').trim() ||
        session.read<AttachmentUploads | null>('issueUploads', null)?.uploads
          .length ||
        session.read<IssueComment | null>('replyTo', null)),
    );
  }
}

export const DraftContext = createContext<IssueDrafts | null>(null);

const emptySubscribe = (): (() => void) => () => undefined;
const emptySnapshot = (): number => 0;
export function useIssueDrafts(): IssueDrafts | null {
  const drafts = useContext(DraftContext);
  useSyncExternalStore(
    drafts?.subscribe ?? emptySubscribe,
    drafts?.snapshot ?? emptySnapshot,
    drafts?.snapshot ?? emptySnapshot,
  );
  return drafts;
}

export function useIssueDraft(id: string): ComposerSession | null {
  const drafts = useIssueDrafts();
  useEffect(() => {
    drafts?.ensure(id);
  }, [drafts, id]);
  // The provider publishes registration; the composer cannot accept uploads until its host is ready.
  return drafts?.sessions.get(id) ?? null;
}

export function useDraftField<T>(
  session: ComposerSession | null,
  key: string,
  initial: T,
): [T, (value: T) => void] {
  const [local] = useState(() => new ComposerSession());
  const owner = session ?? local;
  useSyncExternalStore(owner.subscribe, owner.snapshot, owner.snapshot);
  return [owner.read(key, initial), owner.setter(key, initial)];
}
