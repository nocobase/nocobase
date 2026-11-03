/** How the chat workspace lays itself out by its own width, and the state its slots can read. */
import { createContext, useContext, type Context } from 'react';

export type WorkspaceLayout = 'narrow' | 'medium' | 'wide';
/** Below this the list and the conversation take turns. */
export const NARROW_BELOW = 640;
/** From this the details stand beside the conversation. */
export const WIDE_FROM = 1000;

export function workspaceLayout(width: number): WorkspaceLayout {
  return width < NARROW_BELOW
    ? 'narrow'
    : width < WIDE_FROM
      ? 'medium'
      : 'wide';
}

export interface ChatWorkspaceState {
  readonly layout: WorkspaceLayout;
  readonly conversationId: string | null;
  /** Shows the details, closing an opened record. */
  readonly openDetails: () => void;
  /** Hides the details where they cover the conversation; beside it they stay. */
  readonly closeCoveringDetails: () => void;
  /** An opened record takes the details' place; its closer runs when the details are asked for. */
  readonly reportAside: (aside: { readonly close: () => void } | null) => void;
}

export const WorkspaceContext: Context<ChatWorkspaceState | null> =
  createContext<ChatWorkspaceState | null>(null);

/** The workspace around a conversation, for slots that adapt to its layout; null outside one. */
export function useChatWorkspace(): ChatWorkspaceState | null {
  return useContext(WorkspaceContext);
}
