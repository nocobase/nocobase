/**
 * What an application adds to the chat panel from plugins the agents plugin does not depend on (such as an application's are in
 * `client/agents/chat.tsx`): items placed among a conversation's messages (cards of what the agent proposed),
 * something under a message, and the wording of the news it delivers, or a card in its place. Without a binding the
 * panel shows messages only.
 */
import { createContext, type Context, type ReactNode } from 'react';

import type { ConversationMessage } from '../../shared/conversations.js';
import type { NewsNotice, Translate } from './message-model.js';

/** Something that belongs in a conversation besides its messages, placed by time among them. */
export interface ChatTimelineItem {
  /** Unique within the conversation, stable across renders. */
  readonly key: string;
  /** ISO 8601: the item follows the messages created at or before it. */
  readonly at: string;
  readonly node: ReactNode;
}

export interface ChatExtensions {
  /**
   * A hook (called on every render of an open conversation, so it must be the same function for the panel's life):
   * the conversation's other items, such as plan cards. `revision` changes whenever the conversation's messages or
   * run change, so the hook can refetch.
   */
  readonly useTimelineItems?: (
    conversationId: string,
    revision: number,
  ) => readonly ChatTimelineItem[];
  /** Renders under a message, by its metadata; null for nothing. */
  readonly renderMessageExtra?: (message: ConversationMessage) => ReactNode;
  /**
   * A news notice the application delivered, in the viewer's language (`t` takes `ns` for the application's own
   * namespace); null shows its English title.
   */
  readonly newsText?: (notice: NewsNotice, t: Translate) => string | null;
  /**
   * A news notice the application shows as a card of its own instead of the centred line (an event it follows, with
   * links and actions); null for the line. Called while rendering, so it may return components that use hooks.
   */
  readonly renderNews?: (
    notice: NewsNotice,
    message: ConversationMessage,
  ) => ReactNode;
}

export const ChatExtensionsContext: Context<ChatExtensions> =
  createContext<ChatExtensions>({});

const NO_ITEMS: readonly ChatTimelineItem[] = [];

/** The default `useTimelineItems`: nothing. */
export function noTimelineItems(): readonly ChatTimelineItem[] {
  return NO_ITEMS;
}
