import type { MentionRef } from '../../../shared/comments.js';
import type { EventActor } from '../issues/index.js';

declare module '../../kernel/events.js' {
  interface DomainEventMap {
    'comment.created': {
      readonly issueId: string;
      readonly commentId: string;
      readonly rootId: string;
      readonly parentId: string | null;
      readonly actor: EventActor;
      /** It starts with `/note`: it starts no work. */
      readonly note: boolean;
      /** Every principal it mentions, of any kind. */
      readonly mentions: readonly MentionRef[];
      /** Who wrote the comment it answers, for a rule such as "a reply wakes the author". */
      readonly parentAuthor: EventActor | null;
    };
    'comment.updated': {
      readonly issueId: string;
      readonly commentId: string;
      readonly actor: EventActor;
      /** Principals newly mentioned by the edit. */
      readonly mentions: readonly MentionRef[];
      /** When it was edited, to tell one edit from another. */
      readonly editedAt: string;
    };
    'comment.deleted': {
      readonly issueId: string;
      readonly commentId: string;
      readonly actor: EventActor;
      readonly author: EventActor;
    };
    'comment.threadResolved': {
      readonly issueId: string;
      readonly commentId: string;
      readonly actor: EventActor;
      readonly resolved: boolean;
    };
  }
}

export {};
