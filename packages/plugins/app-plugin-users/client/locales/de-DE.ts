import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  page: {
    loading: 'Wird geladen',
  },
  accept: {
    title: 'Nimm die Einladung an',
    description: '{{inviter}} hat Sie eingeladen.',
    summary: 'Sie werden auch beitreten: {{items}}',
    loading: 'Die Einladung wird geladen…',
    email: 'E-Mail',
    name: 'Name',
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
    goToLogin: 'Gehen Sie zur Anmeldung',
    errors: {
      notFound: 'Dieser Einladungslink ist ungültig.',
      expired: 'Diese Einladung ist abgelaufen. Fordern Sie ein neues an.',
      accepted: 'Diese Einladung wurde bereits angenommen.',
      revoked: 'Diese Einladung wurde widerrufen.',
      password: 'Das Passwort entspricht nicht den Anforderungen.',
      accountConflict:
        'Ein Konto mit dieser Adresse kann nicht erstellt werden.',
      failed: 'Etwas ist schief gelaufen. Bitte versuchen Sie es erneut.',
    },
  },
};

export default deDE;
