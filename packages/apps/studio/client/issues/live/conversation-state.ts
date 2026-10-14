/** The state an `IssueConversation` (`conversation.tsx`) shares with its feed and its composer. */
import type {
  IssueComment,
  IssueCommentActions,
} from '@nocobase/app-plugin-projects/client/issues';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import type { QueryKey } from '@tanstack/react-query';
import { createContext, useContext, type RefObject } from 'react';

import type {
  RichTextHandle,
  RichTextMention,
} from '@/components/rich-text-editor';

export interface IssueConversationState {
  readonly detail: IssueDetail;
  readonly detailKey: QueryKey;
  readonly actions: IssueCommentActions;
  readonly mayComment: boolean;
  readonly editorRef: RefObject<RichTextHandle | null>;
  readonly replyTo: Pick<IssueComment, 'id' | 'authorName'> | null;
  readonly setReplyTo: (
    comment: Pick<IssueComment, 'id' | 'authorName'> | null,
  ) => void;
  readonly searchMentions: (
    query: string,
  ) => Promise<readonly RichTextMention[]>;
  readonly mentionSearchRevision: number;
  /** The project's members could not be read, so people are left out of mentions. */
  readonly memberSearchFailed: boolean;
  readonly retryingMembers: boolean;
  readonly retryMembers: () => void;
  /** Whether a composer that starts folded (on a phone) is open. */
  readonly composerOpen: boolean;
  readonly setComposerOpen: (open: boolean) => void;
  /** Opens the composer and puts the cursor in it, as Reply and Answer do. */
  readonly openComposer: () => void;
}

export const ConversationContext = createContext<IssueConversationState | null>(
  null,
);

export function useIssueConversation(): IssueConversationState {
  const state = useContext(ConversationContext);
  if (!state)
    throw new Error('useIssueConversation needs an <IssueConversation>');
  return state;
}

/** The conversation around a part that may also be placed outside one; null there. */
export function useOptionalIssueConversation(): IssueConversationState | null {
  return useContext(ConversationContext);
}
