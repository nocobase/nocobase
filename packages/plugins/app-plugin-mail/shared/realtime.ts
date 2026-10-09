export const MAIL_REALTIME_TOPIC: string = 'mail:messages';

export interface MailRealtimeEvent {
  readonly kind: 'mail.changed' | (string & {});
}
