import type {
  ConversationEmployee,
  ConversationUser,
} from '../../conversation-center-service.js';

export function conversationUserLabel(user: ConversationUser): string {
  return user.name || user.username || user.id;
}

export function conversationEmployeeLabel(
  employee: ConversationEmployee,
): string {
  return employee.nickname || employee.username;
}

/** A stored timestamp in the reader's locale, or the stored text when it is not a date. */
export function formatConversationTime(
  value: string | undefined,
  locale: string | undefined,
): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
