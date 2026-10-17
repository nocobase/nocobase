import type { Reference } from '../../shared/api.js';

/** What the host attached to the next message, such as the record a panel was opened beside. */
export interface Attachment {
  readonly id: string;
  readonly label: string;
  /** A record the message mentions, as with `#`. */
  readonly reference?: Pick<Reference, 'kind' | 'refId'>;
  /** Said along with the message, for what cannot be mentioned. */
  readonly text?: string;
}

/** Where the attachments of a draft are kept, for a host to fill. */
export const attachedKey = (draftKey: string): string => `attached:${draftKey}`;
