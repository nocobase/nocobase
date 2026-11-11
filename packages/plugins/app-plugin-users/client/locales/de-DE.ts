import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Wird geladen',
  },
  notificationTemplates: {
    invitation: {
      contributor: 'Benutzer',
      category: 'Konten',
      name: 'Benutzereinladung',
      trigger:
        'Ein Administrator lädt jemanden ein oder sendet eine Einladung erneut, wobei E-Mail ausgewählt ist.',
      recipients:
        'Die eingeladene Person, an die für sie eingegebene E-Mail-Adresse.',
      businessRule:
        'Wird jedes Mal gesendet, wenn eine Einladung mit ausgewählter E-Mail erstellt oder erneut gesendet wird. Es gibt keinen eigenen Schalter zum Ausschalten.',
      languagePolicy:
        'In einer einzigen Sprache verfasst, die beim Einladen festgelegt wird: die Oberflächensprache der einladenden Person, sofern keine andere gewählt wird. Beim erneuten Senden bleibt sie gleich. Gibt es für diese Sprache keinen E-Mail-Text, verwendet die E-Mail die Standardsprache der Anwendung und Englisch.',
      channel: 'Absender der Einladungs-E-Mail',
      variables: {
        app: 'Name der Anwendung',
        inviter: 'Name der Person, die die Einladung gesendet hat',
        items: 'Rollen oder Zugriffe, die die Einladung gewährt',
        date: 'Wann die Einladung abläuft, in der Sprache der E-Mail und in UTC',
        url: 'Link zum Annehmen der Einladung; die Vorschau verwendet einen erfundenen Link',
      },
    },
  },
  accept: {
    title: 'Nimm die Einladung an',
    language: 'Sprache',
    description: '{{inviter}} hat Sie eingeladen.',
    summary: 'Sie werden auch beitreten: {{items}}',
    loading: 'Die Einladung wird geladen…',
    email: 'E-Mail',
    name: 'Name',
    username: 'Benutzername (optional)',
    usernameHint: 'Du kannst dich mit diesem Benutzernamen anmelden.',
    password: 'Passwort',
    nameRequired: 'Geben Sie Ihren Namen ein.',
    passwordTooShort: 'Das Passwort benötigt mindestens {{min}} Zeichen.',
    submit: 'Konto erstellen und beitreten',
    join: 'Einladung annehmen',
    submitting: 'Beitritt…',
    signedIn:
      'Sie sind als {{name}} angemeldet. Melden Sie sich ab, um diese Einladung mit einem neuen Konto anzunehmen.',
    signOut: 'Abmelden',
    signOutFailed: 'Abmeldung konnte nicht durchgeführt werden.',
    existingAccount:
      'Für diese Adresse gibt es bereits ein Konto. Melden Sie sich damit an, um fortzufahren.',
    alreadyHaveAccount: 'Du hast schon ein Konto? Anmelden',
    goToLogin: 'Gehen Sie zur Anmeldung',
    errors: {
      notFound: 'Dieser Einladungslink ist ungültig.',
      expired: 'Diese Einladung ist abgelaufen. Fordern Sie ein neues an.',
      accepted: 'Diese Einladung wurde bereits angenommen.',
      revoked: 'Diese Einladung wurde widerrufen.',
      password: 'Das Passwort entspricht nicht den Anforderungen.',
      usernameConflict:
        'Dieser Name wird bereits als Benutzername oder E-Mail-Adresse verwendet. Wähle einen anderen.',
      accountConflict:
        'Ein Konto mit dieser Adresse kann nicht erstellt werden.',
      failed: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    },
  },
};

export default deDE;
