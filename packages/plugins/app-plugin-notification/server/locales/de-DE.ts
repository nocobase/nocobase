import type { NotificationServerResource } from './en-US.js';

const deDE: NotificationServerResource = {
  errors: {
    logNotFound: 'Benachrichtigungsprotokoll nicht gefunden.',
    kindNotFound: 'Benachrichtigungsart nicht gefunden.',
    channelNotFound:
      'Es gibt keinen aktivierten Benachrichtigungskanal namens „{{name}}“.',
    channelTestUnsupported:
      'Der Kanal „{{name}}“ kann keine Testnachricht senden.',
    channelNoRecipient:
      'Der Kanal „{{name}}“ hat keine Adresse und kein Gerät von Ihnen.',
    deliveryNotFound: 'Zustellung nicht gefunden.',
    deliveryNotRetryable:
      'Diese Zustellung kann nicht wiederholt werden: Nur eine fehlgeschlagene Zustellung mit unverändertem Kanal kann es.',
    retryReasonRequired: 'Geben Sie einen Grund für die Wiederholung an.',
    preferenceUnknown: 'Diese Benachrichtigung hat diesen Kanal nicht.',
    preferenceRequired:
      'Diese Benachrichtigung wird immer über diesen Kanal gesendet und kann nicht ausgeschaltet werden.',
  },
  test: {
    title: 'Testbenachrichtigung',
    body: 'Dies ist ein Test aus Einstellungen › Benachrichtigungen für den Kanal „{{channel}}“.',
  },
  authorization: {
    section: 'Nachrichten',
    title: 'Benachrichtigungen',
    read: 'Anzeigen',
    manage: 'Verwalten',
  },
};

export default deDE;
