import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
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
