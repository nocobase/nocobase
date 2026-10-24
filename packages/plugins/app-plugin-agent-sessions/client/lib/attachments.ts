import type { Reference } from '../../shared/api.js';
import type { QueryClient } from '@tanstack/react-query';
import { sessionMemoryKey } from '../use-session-memory.js';

/** How a selected reference reads in the message. */
export const mentionText = (reference: Reference): string =>
  `#${reference.key ?? reference.title}`;

/** What the host attached to the next message, such as the record a panel was opened beside. */
export interface Attachment {
  readonly id: string;
  readonly label: string;
  /** A record the message mentions, as with `#`. */
  readonly reference?: Pick<Reference, 'kind' | 'refId'>;
  /** Said along with the message, for what cannot be mentioned. */
  readonly text?: string;
  /** Owned by the panel's automatic context, separate from manually added attachments. */
  readonly automatic?: boolean;
}

/** Where the attachments of a draft are kept, for a host to fill. */
export const attachedKey = (draftKey: string): string => `attached:${draftKey}`;

export interface AutomaticAttachmentState {
  readonly scope: string;
  readonly stopped: boolean;
  readonly projectId: string | null | undefined;
}

export const automaticKey = (draftKey: string): string =>
  `automatic:${draftKey}`;

/** Removing automatic context or sending freezes it for this intent, including a failed submission. */
export function stopAutomaticAttachment(
  client: QueryClient,
  draftKey: string | undefined,
): void {
  if (!draftKey) return;
  client.setQueryData<AutomaticAttachmentState>(
    sessionMemoryKey(automaticKey(draftKey)),
    (state) => (state ? { ...state, stopped: true } : undefined),
  );
}
