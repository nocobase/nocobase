import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  // The shared list, form and overlay components (`components/`).
  actions: {
    close: 'Schließen',
  },
  dataTable: {
    filters: 'Filter',
    filtersApplied: 'Filter · {{count}}',
    firstPage: 'Zur ersten Seite',
    hideColumn: 'Ausblenden',
    lastPage: 'Zur letzten Seite',
    nextPage: 'Zur nächsten Seite',
    pageOf: 'Seite {{page}} von {{pageCount}}',
    previousPage: 'Zur vorherigen Seite',
    rowsPerPage: 'Zeilen pro Seite',
    selectPage: 'Alle auf dieser Seite auswählen',
    selectedCount: '{{selected}} von {{total}} Zeile(n) ausgewählt.',
    sort: 'Sortieren',
    sortAscending: 'Aufst.',
    sortBy: 'Sortieren nach',
    sortDescending: 'Abst.',
    toggleColumns: 'Spalten ein-/ausblenden',
    view: 'Ansicht',
  },
  formFeedback: {
    denied:
      'Mit Ihren aktuellen Berechtigungen können Sie dieses Formular nicht absenden. Ihre Eingaben bleiben erhalten.',
    failed:
      'Speichern nicht möglich. Ihre Eingaben bleiben erhalten. Versuchen Sie es erneut.',
    field:
      'Dieser Wert wurde abgelehnt. Prüfen Sie ihn und versuchen Sie es erneut.',
    invalid: 'Prüfen Sie die markierten Felder und versuchen Sie es erneut.',
    network:
      'Keine Verbindung. Prüfen Sie Ihre Verbindung und versuchen Sie es erneut. Ihre Eingaben bleiben erhalten.',
  },
  listFeedback: {
    clear: 'Filter zurücksetzen',
    loading: 'Wird geladen',
    refreshFailed:
      'Aktualisierung fehlgeschlagen; frühere Daten werden angezeigt',
    retry: 'Erneut versuchen',
    retrying: 'Erneuter Versuch…',
    signIn: 'Anmelden',
    empty: 'Noch keine Daten',
    noResults: 'Keine Ergebnisse',
    forbidden: 'Zugriff verweigert',
    unauthenticated: 'Sitzung abgelaufen',
    failed: 'Liste konnte nicht geladen werden',
  },
  pendingFeedback: {
    longWait: 'Das dauert länger als üblich. Sie können weiter warten.',
    working: 'Wird bearbeitet…',
  },
  routeOverlay: {
    close: 'Schließen',
  },
  status: {
    loading: 'Wird geladen',
    refreshing: 'Wird aktualisiert',
  },
  management: {
    actions: 'Aktionen',
    actionsFor: 'Aktionen für {{name}}',
    all: 'Alle Status',
    allRoles: 'Alle Rollen',
    assignedRoles: 'Zugewiesene Rollen',
    backToSource: 'Zur vorherigen Seite zurückkehren',
    cancel: 'Abbrechen',
    clear: 'Filter zurücksetzen',
    confirm: 'Bestätigen',
    conflict:
      'Die Anfrage steht im Konflikt mit den aktuellen Daten. Prüfen Sie den neuesten Datensatz, bevor Sie es erneut versuchen.',
    create: 'Erstellen',
    created: 'Benutzer „{{name}}“ erstellt',
    denied: 'Sie haben keinen Zugriff. Wenden Sie sich an einen Administrator.',
    disable: 'Deaktivieren',
    disableHint:
      'Dieser Benutzer kann sich nicht mehr anmelden, und bestehende Sitzungen werden beendet.',
    disableTitle: 'Benutzer „{{name}}“ deaktivieren?',
    disabled: 'Deaktiviert',
    discardHint: 'Nicht gespeicherte Änderungen gehen verloren.',
    discardTitle: 'Änderungen verwerfen?',
    editUser: 'Benutzer bearbeiten',
    email: 'E-Mail',
    enable: 'Aktivieren',
    enableHint: 'Dieser Benutzer kann sich wieder anmelden.',
    enableTitle: 'Benutzer „{{name}}“ aktivieren?',
    enabled: 'Aktiviert',
    failed:
      'Die Anfrage konnte nicht abgeschlossen werden. Versuchen Sie es erneut.',
    identityConflict:
      'Diese E-Mail-Adresse oder dieser Benutzername wird bereits verwendet.',
    invalidEmail: 'Geben Sie eine gültige E-Mail-Adresse ein',
    invalidRequest:
      'Einige Werte sind ungültig. Prüfen Sie Ihre Eingaben oder Filter und versuchen Sie es erneut.',
    listChanged: 'Die Liste hat sich geändert. Bitte erneut versuchen.',
    loading: 'Wird geladen',
    missing: 'Dieser Datensatz existiert nicht oder wurde gelöscht.',
    name: 'Name',
    newUser: 'Neuer Benutzer',
    noAssignedRoles: 'Keine zugewiesenen Rollen',
    noRoleAccess:
      'Dieser Benutzer kann sich weiterhin anmelden und die Grundfunktionen des Kontos nutzen. Rollen gewähren keinen geschäftlichen Zugriff.',
    noRolesFound: 'Keine Rollen gefunden.',
    password: 'Anfangspasswort',
    passwordPolicy:
      'Das Passwort entspricht nicht der aktuellen Passwortrichtlinie.',
    required: 'Füllen Sie dieses Feld aus',
    retry: 'Erneut versuchen',
    revokeHint: 'Dieser Benutzer muss sich erneut anmelden.',
    revokeRoleHint:
      'Der durch die aufgeführten Rollen gewährte Zugriff wird entfernt.',
    revokeRoleTitle: 'Rollen von „{{name}}“ entziehen?',
    revokeSessions: 'Sitzungen widerrufen',
    revokeTitle: 'Sitzungen von „{{name}}“ widerrufen?',
    roleFilter: 'Nach Rolle filtern',
    roleFilterIncomplete:
      'Wählen Sie sowohl einen Rollenbereich als auch eine Rolle aus oder setzen Sie die Filter zurück.',
    save: 'Speichern',
    saved: '„{{name}}“ gespeichert',
    saving: 'Wird gespeichert…',
    searchRoles: 'Rollen suchen',
    selectRoles: 'Rollen auswählen',
    sessionEnded: 'Ihre Sitzung ist abgelaufen. Melden Sie sich erneut an.',
    signInAgain: 'Erneut anmelden',
    status: 'Status',
    total_one: '{{count}} Benutzer',
    total_other: '{{count}} Benutzer',
    userActionSaved: {
      disable: 'Benutzer „{{name}}“ deaktiviert',
      enable: 'Benutzer „{{name}}“ aktiviert',
      revokeSessions: 'Aktive Sitzungen von „{{name}}“ widerrufen',
    },
    userSearch: 'Namen, Benutzernamen oder E-Mail-Adressen suchen',
    username: 'Benutzername',
    users: 'Benutzer',
    usersDescription: 'Konten, Zugriffe und aktive Sitzungen verwalten.',
  },
  humanOnly: {
    manageAccounts:
      'Konten verwaltet nur ein Mensch: Kein API-Schlüssel darf das.',
  },
  page: {
    roles: 'Rollen',
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
