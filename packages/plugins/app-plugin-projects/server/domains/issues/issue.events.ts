import type { MentionRef } from '../../../shared/comments.js';
import type { Executor } from '../../../shared/issues.js';
import type { ActorType } from '../../kernel/actor.js';

export interface EventActor {
  readonly type: ActorType;
  readonly id: string | null;
}

/** What an update changed that someone may need to be told about. */
export interface IssueChangeSet {
  readonly status?: { readonly from: string; readonly to: string };
  readonly owner?: { readonly from: string; readonly to: string };
  readonly executor?: {
    readonly from: Executor | null;
    readonly to: Executor | null;
  };
  /** Principals of any kind newly mentioned in the description. */
  readonly mentions?: readonly MentionRef[];
}

declare module '../../kernel/events.js' {
  interface DomainEventMap {
    /** Anything about the issue changed; the browser refetches it. */
    'issue.changed': { readonly issueId: string };
    'issue.created': {
      readonly issueId: string;
      readonly actor: EventActor;
      /** Principals of any kind mentioned in the description. */
      readonly mentions: readonly MentionRef[];
    };
    'issue.updated': {
      readonly issueId: string;
      readonly actor: EventActor;
      readonly changes: IssueChangeSet;
      /** The issue's revision after the change, to tell one change from another. */
      readonly revision: number;
    };
    'issue.deleted': { readonly issueId: string; readonly actor: EventActor };
    'issue.restored': { readonly issueId: string; readonly actor: EventActor };
  }
}
