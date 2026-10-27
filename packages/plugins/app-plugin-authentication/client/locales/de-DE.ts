import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  errors: {
    generic: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    network:
      'Der Server konnte nicht erreicht werden. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    rateLimited:
      'Zu viele Versuche. Bitte warten Sie einen Moment und versuchen Sie es erneut.',
    INVALID_EMAIL_OR_PASSWORD: 'Falsche E-Mail-Adresse oder falsches Passwort.',
    INVALID_USERNAME_OR_PASSWORD:
      'Falscher Benutzername oder falsches Passwort.',
    INVALID_PASSWORD: 'Falsches Passwort.',
    INVALID_EMAIL: 'Geben Sie eine gültige E-Mail-Adresse ein.',
    INVALID_USERNAME:
      'Benutzernamen dürfen nur Buchstaben, Ziffern, Unterstriche und Punkte enthalten.',
    USERNAME_TOO_SHORT: 'Dieser Benutzername ist zu kurz.',
    USERNAME_TOO_LONG: 'Dieser Benutzername ist zu lang.',
    USERNAME_IS_ALREADY_TAKEN: 'Dieser Benutzername ist bereits vergeben.',
    USER_ALREADY_EXISTS:
      'Ein Konto mit dieser E-Mail-Adresse existiert bereits.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
      'Ein Konto mit dieser E-Mail-Adresse existiert bereits. Verwenden Sie eine andere E-Mail.',
    PASSWORD_TOO_SHORT: 'Dieses Passwort ist zu kurz.',
    RESET_PASSWORD_DISABLED:
      'Das Zurücksetzen des Self-Service-Passworts ist nicht aktiviert. Wenden Sie sich an einen Administrator, um Ihr Passwort zurückzusetzen.',
    PASSWORD_TOO_LONG: 'Dieses Passwort ist zu lang.',
    EMAIL_NOT_VERIFIED:
      'Überprüfen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.',
    INVALID_TOKEN: 'Dieser Link ist ungültig oder abgelaufen.',
    TOKEN_EXPIRED: 'Dieser Link ist abgelaufen.',
    ACCOUNT_DISABLED:
      'Dieses Konto ist deaktiviert. Kontaktieren Sie Ihren Administrator.',
    SERVICE_ACCOUNT_NO_LOGIN:
      'Ein Dienstkonto kann sich nicht anmelden; es funktioniert nur über API-Tasten.',
    invalidOriginWithAddress:
      'Dieser Ursprung ist nicht vertrauenswürdig. Setzen Sie app.publicOrigin in config.yml auf {{origin}}, starten Sie die Anwendung neu und versuchen Sie es erneut.',
    INVALID_ORIGIN:
      'Dieser Ursprung ist nicht vertrauenswürdig. Überprüfen Sie app.publicOrigin in config.yml, starten Sie die Anwendung neu und versuchen Sie es erneut.',
    INVALID_CSRF_ORIGIN:
      'Diese Anfrage kam von einer anderen Website und wurde abgelehnt. Laden Sie die Seite neu und versuchen Sie es erneut.',
  },
};

export default deDE;
