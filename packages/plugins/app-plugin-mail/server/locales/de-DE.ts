import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    imapMoveLocationChanged:
      'Der ausgewählte Ordner oder die Kopie wurde geändert. Synchronisieren Sie das Postfach und öffnen Sie den Quellordner erneut.',
    imapMoveNotWritable:
      'Der ausgewählte Ordner erlaubt diesen Vorgang nicht. Prüfen Sie die Postfachberechtigungen.',
    imapMoveSourceRequired:
      'Öffnen Sie den Quellordner, bevor Sie diese Nachricht verschieben oder löschen.',
    imapMoveUnsupported:
      'Dieser Server kann Nachrichten nicht sicher verschieben. Verwenden Sie Ihren E-Mail-Client.',
    imapTrashNotFound:
      'Dieses Konto hat keinen Papierkorb. Verwenden Sie Ihren E-Mail-Client.',
    imapMoveOutcomeUnknown:
      'Der Verschiebevorgang ist unvollständig oder das Ergebnis ist unbekannt. Prüfen Sie das Postfach vor einem erneuten Versuch.',
    invalidRecipient:
      'Korrigieren Sie vor dem Senden die E-Mail-Adressen und Anzeigenamen der Empfänger.',
    accessDenied: 'E-Mail-Zugriff ist erforderlich.',
    idempotencyConflict:
      'Der Idempotenzschlüssel ist bereits einer anderen Anfrage zugeordnet.',
    invalidRequest: 'Die E-Mail-Anfrage ist ungültig.',
    accountCredentialsInvalid:
      'Postfachauthentifizierung fehlgeschlagen. Überprüfen Sie Ihren Anmeldenamen und Ihr Passwort oder Ihren Autorisierungscode und bestätigen Sie, dass IMAP/SMTP aktiviert ist. Für Gmail und andere Dienste ist möglicherweise ein App-Passwort erforderlich.',
    requestFailed: 'Die E-Mail-Anfrage konnte nicht abgeschlossen werden.',
    providerRateLimited:
      'Der E-Mail-Dienst erhält zu viele Anfragen. Versuchen Sie es später noch einmal.',
    providerUnavailable:
      'Der Maildienst konnte nicht erreicht werden. Versuchen Sie es später noch einmal.',
    reauthorizationRequired:
      'Dieses E-Mail-Konto muss erneut verbunden werden, bevor es verwendet werden kann.',
    syncRunNotFound: 'Der Mail-Synchronisierungslauf wurde nicht gefunden.',
    messageNotFound: 'E-Mail-Nachricht wurde nicht gefunden.',
    authorizationStateRequired: 'E-Mail-Autorisierungsstatus ist erforderlich.',
  },
};

export default deDE;
