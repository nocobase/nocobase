import {
  MailIcon,
  MailOpenIcon,
  Trash2Icon,
  type LucideIcon,
} from 'lucide-react';

import type { InboxEntry } from './model.js';

/** What a card offers: read ↔ unread, and delete (the in-app inbox has no archive). */
export type InboxAction = 'read' | 'unread' | 'delete';

export const INBOX_ACTION_ICON: Readonly<Record<InboxAction, LucideIcon>> = {
  read: MailOpenIcon,
  unread: MailIcon,
  delete: Trash2Icon,
};

export function inboxActionsFor(entry: InboxEntry): readonly InboxAction[] {
  return [entry.item.readAt ? 'unread' : 'read', 'delete'];
}
