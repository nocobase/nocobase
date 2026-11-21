import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  actions: {
    cancel: 'Abbrechen',
    close: 'Schließen',
    save: 'Speichern',
  },
  activity: {
    actions: {
      approvalApproved: 'genehmigte die Statusänderung',
      approvalNoApprover:
        'hat den Status geändert (kein Genehmiger zum Fragen)',
      approvalRejected: 'lehnte die Statusänderung ab',
      approvalRequested:
        'hat die Genehmigung für eine Statusänderung beantragt',
      approvalSelf: 'hat den Status als Genehmiger geändert',
      approvalStale: 'markierte den Genehmigungsantrag als nicht mehr gültig',
      approvalWithdrawn: 'zog den Genehmigungsantrag zurück',
      checklistItemChecked: 'hat den Artikel überprüft',
      commentDeleted: 'hat einen Kommentar gelöscht',
      attachmentAdded: 'beigefügt',
      attachmentRemoved: 'hat die Datei entfernt',
      threadResolved: 'hat einen Thread gelöst',
      threadUnresolved: 'hat einen Thread erneut geöffnet',
      checklistItemUnchecked: 'hat das Kontrollkästchen deaktiviert',
      ownerNotified: 'hat den Eigentümer benachrichtigt',
      stageActionApplied: 'hat eine Bühnenaktion angewendet',
      stageActionSkipped: 'hat eine Bühnenaktion übersprungen',
      stageActionSuppressed: 'eine Bühnenaktion unterdrückt (zu viele Läufe)',
      stageActionBlocked:
        'hat eine Phasenaktion übersprungen: Die Aufgabe wartet auf',
      workBlocked: 'hat die Arbeit nicht begonnen: Die Aufgabe wartet auf',
      workDormant:
        'hat die Arbeit nicht begonnen, solange die Aufgabe hier ist:',
      workLimited:
        'hat die Arbeit nicht begonnen: Die Kommentare der Agents haben das Ausführungslimit der Aufgabe erreicht',
      workWithdrawn:
        'hat die eingereihte Arbeit zurückgezogen: Die Aufgabe wartet jetzt auf',
      stageActionFailed: 'Eine Regel des Status konnte nicht ausgeführt werden',
      created: 'hat die Aufgabe erstellt',
      datesChanged: 'hat die Daten geändert',
      deleted: 'hat die Aufgabe gelöscht',
      descriptionChanged: 'hat die Beschreibung bearbeitet',
      executorChanged: 'hat den Bearbeiter geändert',
      executorRemoved: 'Bearbeiter {{name}} wurde entfernt',
      labelsChanged: 'hat die Beschriftungen geändert',
      ownerChanged: 'hat den Besitzer gewechselt',
      parentChanged: 'hat die übergeordnete Aufgabe geändert',
      priorityChanged: 'hat die Priorität geändert',
      projectChanged: 'hat die Aufgabe in ein anderes Projekt verschoben',
      restored: 'hat die Aufgabe wiederhergestellt',
      statusChanged: 'hat den Status geändert',
      titleChanged: 'hat die Aufgabe umbenannt',
      updated: 'hat die Aufgabe aktualisiert',
      subtaskAdded: 'hat die Unteraufgabe hinzugefügt',
      dependencyAdded: 'fügte die Abhängigkeit von hinzu',
      dependencyRemoved: 'entfernte die Abhängigkeit von',
      relationAdded: 'verknüpfte die Aufgabe mit',
      relationRemoved: 'entfernte die Verknüpfung mit',
      stageChanged: 'wechselte die Bühne',
      autoMoveSkipped: 'konnte die Aufgabe nicht automatisch verschieben nach',
    },
    afterEvent: '(automatisch, auf „{{event}}“)',
    empty: 'Noch keine Aktivität.',
    loadOlder: 'Ältere Aktivität laden',
    system: 'System',
    title: 'Aktivität',
    via: {
      agent: 'über {{agent}}',
      agentPlan: 'über den Plan von {{agent}}',
      plan: 'über einen Plan',
    },
  },
  actor: {
    system: 'System',
    user: 'Person',
  },
  board: {
    announce: {
      cancel: 'Umzug abgebrochen.',
      end: 'Abgelegt auf {{status}}.',
      instructions:
        'Drücken Sie die Leertaste oder Enter, um eine Aufgabe aufzunehmen, verschieben Sie sie mit den Pfeiltasten in einen anderen Status und drücken Sie erneut die Leertaste oder Enter, um sie abzulegen, oder Escape zum Abbrechen.',
      over: 'Über {{status}}.',
      start: '{{identifier}} abgeholt.',
    },
    boardView: 'Vorstand',
    cardRole: 'Verschiebbare Aufgabe',
    closeDenied:
      'Nur der Eigentümer, der Projektleiter oder ein Administrator darf {{identifier}} schließen.',
    emptyColumn: 'Keine Aufgaben',
    label: 'Aufgabenboard',
    listView: 'Liste',
    moveRejected: '{{identifier}} kann nicht in diesen Status wechseln.',
    viewLabel: 'Anzeigen',
  },
  colors: {
    blue: 'Blau',
    gray: 'Grau',
    green: 'Grün',
    orange: 'Orange',
    purple: 'Lila',
    red: 'Rot',
    yellow: 'Gelb',
  },
  common: {
    apiKey: 'API-Taste',
    clearFilters: 'Filter löschen',
    close: 'Schließen',
    collapseText: 'Reduzieren Sie den Textbereich',
    create: 'Erstellen',
    createNamed: 'Erstellen Sie „{{name}}“',
    creating: 'Erstellen…',
    expandText: 'Erweitern Sie den Textbereich',
    forbidden: 'Sie haben dazu keine Berechtigung.',
    notFound:
      'Es existiert nicht mehr, oder Sie sehen es möglicherweise nicht.',
    loading: 'Wird geladen…',
    noOptions: 'Keine Optionen',
    requestFailed:
      'Die Anfrage ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    save: 'Speichern',
    saving: 'Speichern',
    unknown: 'Unbekannt',
  },
  attachments: {
    attach: 'Dateien anhängen',
    attachHint:
      'Dateien anhängen: Wählen Sie sie aus, fügen Sie einen Screenshot ein oder legen Sie Dateien in der Box ab',
    download: '{{name}} herunterladen',
    dropHint:
      'Legen Sie hier Dateien ab oder fügen Sie sie ein, jeweils bis zu {{size}} MB',
    files: 'Dateien',
    images: 'Bilder',
    next: 'Nächste Datei',
    pending: 'Zu sendende Dateien',
    preview: 'Vorschau {{name}}',
    previous: 'Vorherige Datei',
    remove: '{{name}} entfernen',
    removeConfirm: 'Entfernen',
    removeDescription: '„{{name}}“ wird für alle gelöscht.',
    removeTitle: 'Diese Datei entfernen?',
    title: 'Anhänge',
    tooLarge: '{{name}} ist größer als {{size}} MB.',
    tooMany: 'Höchstens {{count}}-Dateien gleichzeitig.',
    upload: 'Hochladen',
    uploadFailed: '{{name}} konnte nicht hochgeladen werden.',
    uploading: '{{name}} wird hochgeladen…',
  },
  comments: {
    cancelReply: 'Antwort abbrechen',
    delete: 'Löschen',
    deleteDescription:
      'Der Kommentar wird durch den Hinweis ersetzt, dass er gelöscht wurde; Antworten bleiben.',
    deleteTitle: 'Diesen Kommentar löschen?',
    deleted: 'Dieser Kommentar wurde gelöscht.',
    edit: 'Bearbeiten',
    editLabel: 'Kommentar bearbeiten',
    edited: '(bearbeitet)',
    failed:
      'Der Kommentar konnte nicht gepostet werden. Bitte versuchen Sie es erneut.',
    label: 'Kommentar',
    modeComment: 'Kommentar',
    modeNote: 'Notiz',
    more: 'Weitere Aktionen',
    nameSeparator: ', ',
    note: 'Notiz',
    notePlaceholder: 'Schreibe eine Notiz…',
    placeholder: 'Einen Kommentar schreiben…',
    reply: 'Antworten',
    replyTo: 'Antwort auf {{name}}',
    replyingTo: 'Antwort auf {{name}}',
    send: 'Kommentar',
    sendNote: 'Anmerkung hinzufügen',
    sendReply: 'Antworten',
  },
  composer: {
    newLine: 'für eine neue Zeile',
    quickSend: 'zum Senden',
  },
  config: {
    labels: {
      actionsFor: 'Aktionen für {{name}}',
      columns: {
        actions: 'Aktionen',
        color: 'Farbe',
        name: 'Name',
      },
      create: 'Etikett erstellen',
      created: 'Label „{{name}}“ erstellt',
      delete: 'Label löschen',
      deleteDescription:
        'Es wird von allen Aufgaben entfernt, die es tragen. Das lässt sich nicht rückgängig machen.',
      deleteTitle: 'Label „{{name}}“ löschen?',
      deleted: 'Label „{{name}}“ gelöscht',
      description: 'Etiketten gruppieren Aufgaben projektübergreifend.',
      emptyDescription: 'Erstellen Sie ein Etikett, um Aufgaben zu gruppieren.',
      emptyNoAccess: 'Bitten Sie einen Administrator, Etiketten zu erstellen.',
      emptyTitle: 'Noch keine Etiketten',
      loadFailed: 'Etiketten können nicht geladen werden',
      namePlaceholder: 'Labelname',
      newColor: 'Neue Etikettenfarbe',
      newName: 'Neuer Markenname',
      recolored: 'Farbe von „{{name}}“ geändert',
      rename: 'Umbenennen',
      renameLabel: '{{name}} umbenennen',
      renamed: 'Bezeichnung umbenannt in „{{name}}“',
      title: 'Etiketten',
    },
  },
  configPage: {
    description:
      'Mitglieder, Rollen, Etiketten und das Aufgabenpräfix der Projekte.',
    noAccess: 'Hier gibt es nichts einzurichten',
    noAccessDescription:
      'Ihre Rollen beinhalten keine Projekteinstellungen. Fragen Sie einen Eigentümer oder Administrator, wenn Sie eines benötigen.',
    tabsLabel: 'Einstellungsabschnitte',
    title: 'Einstellungen',
  },
  connect: {
    copied: 'Kopiert',
    copy: 'Kopierbefehl',
    copyFailed:
      'Kopieren nicht möglich. Wählen Sie den Befehl aus und kopieren Sie ihn manuell.',
  },
  dataTable: {
    firstPage: 'Gehe zur ersten Seite',
    lastPage: 'Gehe zur letzten Seite',
    nextPage: 'Gehe zur nächsten Seite',
    noResults: 'Keine Ergebnisse.',
    pageOf: 'Seite {{page}} von {{pageCount}}',
    previousPage: 'Zur vorherigen Seite gehen',
    rowsPerPage: 'Zeilen pro Seite',
    selectedCount: '{{selected}} der {{total}} Zeile(n) ausgewählt.',
    sortAscending: 'Asc',
    sortDescending: 'Beschr',
    toggleColumns: 'Spalten umschalten',
    view: 'Anzeigen',
  },
  datePicker: {
    placeholder: 'Wählen Sie ein Datum',
    rangePlaceholder: 'Wählen Sie einen Datumsbereich',
  },
  dates: {
    clearDue: 'Fälligkeitsdatum löschen',
    clearStart: 'Startdatum löschen',
    due: 'Fälligkeitsdatum',
    start: 'Startdatum',
  },
  errors: {
    APPROVAL_DECIDED: 'Über diesen Antrag wurde bereits entschieden.',
    NOT_REQUESTER: 'Nur wer gefragt hat, kann die Anfrage zurückziehen.',
    CHECKLIST_INCOMPLETE:
      'Überprüfen Sie zunächst die erforderlichen Punkte der Checkliste für den aktuellen Status.',
    GRANT_NOT_ALLOWED:
      'Eine Rolle enthält nur die Seiten, Einstellungen und Aktionen dieses Plugins.',
    INVALID_DATE: 'Das Datum ist ungültig.',
    INVALID_EXECUTOR: 'Dieser Bearbeiter kann nicht gewählt werden.',
    INVALID_INVITATION: 'Überprüfen Sie die E-Mail-Adressen.',
    INVALID_LABEL: 'Ein Label existiert nicht mehr.',
    INVALID_LEAD: 'Der Lead muss ein aktives Mitglied sein.',
    INVALID_OWNER: 'Der Eigentümer muss ein aktives Mitglied sein.',
    INVALID_PARENT: 'Die übergeordnete Aufgabe kann nicht verwendet werden.',
    INVALID_PREFIX:
      'Verwenden Sie 1 bis 10 Großbuchstaben und Ziffern, beginnend mit einem Buchstaben.',
    INVALID_PROJECT: 'Das Projekt existiert nicht.',
    INVALID_PROJECTS: 'Wählen Sie vorhandene Projekte aus.',
    INVALID_STATUS: 'Dieser Status kann hier nicht verwendet werden.',
    INVALID_TITLE: 'Der Titel muss 1 bis 100 Zeichen lang sein.',
    INVALID_URL: 'Das Repository URL ist ungültig.',
    INVITATION_CLOSED: 'Die Einladung steht nicht mehr aus.',
    LABEL_EXISTS: 'Ein Label mit diesem Namen existiert bereits.',
    LAST_OWNER:
      'Der letzte Eigentümer kann die Eigentümerrolle nicht verlieren.',
    LEAD_MEMBER:
      'Wählen Sie einen anderen Projektleiter, bevor Sie dieses Mitglied entfernen.',
    OWNER_REQUIRED: 'Eine Aufgabe braucht einen Verantwortlichen.',
    REVISION_CONFLICT:
      'Jemand hat dies inzwischen geändert. Die neueste Version wird angezeigt; Wenden Sie Ihre Änderung erneut an.',
    REVISION_REQUIRED:
      'Die Seite ist veraltet. Laden Sie es neu und versuchen Sie es erneut.',
    ROLE_BUILT_IN: 'Integrierte Rollen können nicht gelöscht werden.',
    ROLE_IN_USE:
      'Jemand hat diese Rolle immer noch inne; Ändern Sie zuerst ihre Rollen.',
    ROLE_NOT_EDITABLE:
      'Die Besitzerrolle beinhaltet alles; es kann nicht bearbeitet werden.',
    TRANSITION_NOT_ALLOWED:
      'Sie dürfen die Aufgabe nicht in diesen Status verschieben.',
    UNKNOWN_ROLE: 'Die Rolle existiert nicht mehr.',
    USER_DISABLED:
      'Einem deaktivierten Konto kann keine Rolle zugewiesen werden.',
    DEPENDENCY_CYCLE: 'Diese Abhängigkeit würde einen Kreislauf erzeugen.',
    DEPENDENCY_CHANGED:
      'Die Beziehung änderte sich. Neu laden und erneut versuchen.',
    DEPENDENCY_GRAPH_CHANGED:
      'Die Abhängigkeiten der Aufgaben haben sich geändert. Neu laden und erneut versuchen.',
    DEPENDENCY_EXISTS: 'Diese Abhängigkeit besteht bereits.',
    DEPENDENCY_TOO_DEEP: 'Die Abhängigkeitskette ist zu lang.',
    INVALID_DEPENDENCY: 'Diese Aufgabe kann hier keine Abhängigkeit sein.',
    INVALID_STAGE:
      'Geben Sie eine ganze Zahl von 0 bis 1000 ein oder lassen Sie das Feld leer.',
    ISSUE_BLOCKED: 'Die Aufgabe wartet noch auf Aufgaben, die sie blockieren.',
    SUBTASKS_OPEN:
      'Schließen Sie zuerst ihre Unteraufgaben ab oder brechen Sie sie ab.',
    INVALID_FILE: 'Eine Datei gehört nicht zu Ihren Uploads.',
    FILE_TOO_LARGE: 'Die Datei ist zu groß.',
    FILES_UNAVAILABLE: 'Diese Anwendung speichert keine Dateien.',
  },
  dependencies: {
    add: 'Blockierende Aufgabe hinzufügen',
    added: 'Abhängigkeit hinzugefügt.',
    addPlaceholder:
      'Aufgaben suchen, die als Blocker hinzugefügt werden sollen',
    blockedBy: 'Blockiert von',
    blocks: 'Blöcke',
    hidden_one:
      '{{count}} weitere blockierende Aufgabe, die Sie nicht sehen können.',
    hidden_other:
      '{{count}} weitere blockierende Aufgaben, die Sie nicht sehen können.',
    related: 'Verwandte',
    remove: '{{identifier}} entfernen',
    removed: 'Abhängigkeit entfernt.',
    title: 'Abhängigkeiten',
  },
  executor: {
    busy_one: '{{count}} in Bearbeitung',
    busy_other: '{{count}} in Bearbeitung',
    none: 'Nicht zugewiesen',
    offline: 'Offline',
  },
  filters: {
    allLabels: 'Alle Etiketten',
    allProjects: 'Alle Projekte',
    anyExecutor: 'Beliebiger Bearbeiter',
    anyOwner: 'Jeder Eigentümer',
    executor: 'Nach Bearbeiter filtern',
    label: 'Nach Label filtern',
    owner: 'Nach Eigentümer filtern',
    project: 'Nach Projekt filtern',
    toggle: 'Filter',
  },
  invitations: {
    actions: 'Aktionen',
    actionsFor: 'Aktionen für Einladung zu {{email}}',
    dialogDescription:
      'Jede Adresse erhält eine E-Mail mit einem Link zum Festlegen eines Namens und eines Passworts. Der Link ist 7 Tage gültig.',
    dialogTitle: 'Mitglieder einladen',
    done: 'Erledigt',
    emails: 'E-Mail-Adressen',
    emailsHint:
      'Eine pro Zeile oder durch Kommas oder Leerzeichen getrennt. Bis 50.',
    emailsInvalid: 'Keine gültige E-Mail-Adresse: {{emails}}',
    emailsRequired: 'Geben Sie mindestens eine E-Mail-Adresse ein.',
    emailsTooMany: 'Bis zu 50 Adressen gleichzeitig.',
    expired: 'Abgelaufen',
    expiresAt: 'Läuft ab',
    forbidden: 'Sie können nicht zu diesen Projekten einladen.',
    invite: 'Mitglieder einladen',
    invitedBy: 'Eingeladen von',
    link: 'Einladungslink',
    linkTitle: 'Leiten Sie diesen Link weiter',
    linkUnavailable:
      'Die Einladung hat sich geändert. Aktualisieren Sie die Liste und versuchen Sie es erneut.',
    listSeparator: ', ',
    loadFailed: 'Einladungen können nicht geladen werden',
    noProjects: 'Keine Projekte',
    notSent: 'E-Mail nicht gesendet',
    outcome: {
      added: 'Hat ein Konto – zu den Projekten hinzugefügt',
      alreadyMember: 'Bereits Mitglied',
      notSent: 'E-Mail nicht gesendet',
      noEmailChannel: 'E-Mail nicht gesendet: Kein E-Mail-Kanal konfiguriert',
      deliveryFailed: 'E-Mail nicht gesendet: E-Mail-Zustellung fehlgeschlagen',
      sent: 'E-Mail gesendet',
    },
    pending: 'Warten',
    projectRequired: 'Wählen Sie mindestens ein Projekt aus, das Sie leiten.',
    projects: 'Projekte',
    projectsHint:
      'Eingeladene Personen treten diesen Projekten als Mitglieder bei.',
    language: 'E-Mail-Sprache',
    languageHint:
      'Die Einladungs-E-Mail und ihre Registrierungsseite verwenden diese Sprache.',
    projectsPlaceholder: 'Projekte auswählen',
    resend: 'Erneut senden',
    generateLink: 'Neuen Link generieren',
    generateDescription:
      'Der vorherige Einladungslink funktioniert nicht mehr. Es wird keine E-Mail verschickt. Kopieren Sie den neuen Link, nachdem Sie ihn generiert haben.',
    linkReady: 'Neuer Link bereit',
    newLinkDescription:
      'Der vorherige Link funktioniert nicht mehr. Kopieren und teilen Sie den neuen Link unten.',
    copyLink: 'Einladungslink kopieren',
    resent: 'Einladung erneut an {{email}} gesendet',
    resultsLabel: 'Ergebnisse der Einladung',
    revoke: 'Widerrufen',
    revokeDescription:
      'Der Link funktioniert nicht mehr. Sie können die Adresse später erneut einladen.',
    revokeTitle: 'Einladung für {{email}} widerrufen?',
    revoked: 'Einladung für {{email}} widerrufen',
    send: 'Einladungen versenden',
    sent: 'Einladungen verarbeitet: {{number}}',
    status: 'Status',
    title: 'Ausstehende Einladungen',
  },
  issue: {
    backToList: 'Zurück zu den Aufgaben',
    delete: 'Aufgabe löschen',
    deleteDescription:
      'Es verschwindet aus Listen und Suchen. Ein Administrator kann es wiederherstellen.',
    deleteTitle: '{{identifier}} löschen?',
    deleted: '{{identifier}} gelöscht.',
    editDescription: 'Beschreibung bearbeiten',
    editTitle: 'Titel bearbeiten',
    conflict: 'Diese Aufgabe hat sich geändert, wird neu geladen.',
    loadFailed: 'Diese Aufgabe kann nicht geladen werden',
    noDescription: 'Keine Beschreibung.',
    parent: 'Unteraufgabe von',
  },
  issueAdd: {
    dependency: 'Blocker',
    label: 'Hinzufügen',
    none: 'keine',
  },
  issuePicker: {
    empty: 'Keine passenden Aufgaben',
    placeholder: 'Suche nach Titel oder Kennung',
  },
  issueForm: {
    created: '{{identifier}} erstellt',
    descriptionLabel: 'Beschreibung',
    descriptionPlaceholder: 'Markdown wird unterstützt.',
    noProject: 'Kein Projekt',
    ownerHint:
      'Die Person, die für die Aufgabe verantwortlich ist. Standardmäßig Sie.',
    startLabel: 'Wann soll begonnen werden?',
    startNow: 'Beginnen Sie jetzt',
    startNowHint: 'Der Projektmanager beginnt sofort mit der Organisation.',
    startLater: 'Später',
    startLaterHint:
      'Sie wartet im Backlog; starten Sie sie auf der Aufgabenseite.',
    createAndStart: 'Erstellen und starten',
    projectLabel: 'Projekt',
    titleLabel: 'Titel',
    titleRequired: 'Geben Sie einen Titel ein.',
  },
  issues: {
    allStatuses: 'Alle Status',
    columns: {
      executor: 'Bearbeiter',
      identifier: 'ID',
      owner: 'Verantwortlicher',
      priority: 'Priorität',
      status: 'Status',
      title: 'Titel',
      updated: 'Aktualisiert',
    },
    agentsDescription:
      'Arbeit für Menschen und Coding-Agents. Weisen Sie einen Agent als Bearbeiter zu, um eine Ausführung zu starten.',
    agentsEmptyDescription:
      'Erstellen Sie eine Aufgabe und wählen Sie einen Agent als Bearbeiter, um ihm die Arbeit zu übergeben.',
    description: 'Alles, woran das Team arbeitet, als Tafel oder Liste.',
    emptyDescription:
      'Erstellen Sie eine Aufgabe und wählen Sie, wer sie bearbeitet.',
    emptyTitle: 'Noch keine Aufgaben',
    loadFailed: 'Aufgaben können nicht geladen werden',
    new: 'Neue Aufgabe',
    noResults: 'Keine passenden Aufgaben.',
    restore: 'Wiederherstellen',
    restored: '{{identifier}} wiederhergestellt.',
    searchLabel: 'Aufgaben suchen',
    searchPlaceholder: 'Suche nach Titel oder Kennung',
    statusFilterLabel: 'Nach Status filtern',
    title: 'Aufgaben',
  },
  labelColors: {
    for: 'Farbe von {{name}}',
    open: 'Beschriftungsfarben ändern',
    title: 'Etikettenfarben',
  },
  labels: {
    createFailed: 'Das Etikett konnte nicht erstellt werden.',
    empty:
      'Noch keine Etiketten. Geben Sie einen Namen ein, um einen zu erstellen.',
    placeholder: 'Beschriftungen hinzufügen',
  },
  members: {
    columns: {
      email: 'E-Mail',
      name: 'Name',
      roles: 'Rollen',
    },
    description:
      'Jeder, der in Projekten arbeitet, mit seinen Rollen. Systemadministratoren haben alles in der Hand und werden nicht aufgeführt. Nur ein Eigentümer gewährt oder widerruft die Eigentümerrolle.',
    loadFailed: 'Mitglieder können nicht geladen werden',
    title: 'Mitglieder',
  },
  myIssues: {
    description:
      'Aufgaben, für die Sie verantwortlich sind, und Aufgaben, die Sie selbst bearbeiten.',
    empty: {
      executing: 'Sie bearbeiten keine Aufgaben',
      owned: 'Sie sind für keine Aufgaben verantwortlich',
    },
    emptyDescription:
      'Ihnen zugewiesene Aufgaben erscheinen hier. Erstellen Sie eine oder übernehmen Sie eine aus der Aufgabenliste.',
    tabs: {
      executing: 'Ich exekutiere',
      owned: 'Ich besitze',
    },
    tabsLabel: 'Ansichten von Meine Aufgaben',
    title: 'Meine Aufgaben',
  },
  nav: {
    general: 'Allgemein',
    issues: 'Aufgaben',
    labels: 'Etiketten',
    members: 'Mitglieder',
    myIssues: 'Meine Aufgaben',
    projects: 'Projekte',
    roles: 'Rollen',
    settings: 'Einstellungen',
  },
  newIssue: {
    title: 'Neue Aufgabe',
  },
  pagination: {
    countMore: '{{count}}+',
    loadMore: 'Mehr laden',
    shown: 'Zeigt {{count}} an',
  },
  priority: {
    high: 'Hoch',
    low: 'Niedrig',
    medium: 'Mittel',
    none: 'Keine Priorität',
    urgent: 'Dringend',
  },
  projectForm: {
    created: 'Projekt {{name}} erstellt',
    description:
      'Projekte gruppieren Aufgaben und die Repositorys, die sie betreffen.',
    descriptionHint:
      'Was jeder, der an diesem Projekt arbeitet, wissen sollte.',
    descriptionPlaceholder: 'Worum es in diesem Projekt geht.',
    name: 'Name',
    nameRequired: 'Geben Sie einen Namen ein.',
    title: 'Neues Projekt',
  },
  projectMembers: {
    actions: 'Aktionen für {{name}}',
    choose: 'Mitglied hinzufügen: Nach Namen suchen',
    empty: 'Noch keine Mitglieder.',
    leadSet: 'Leitungswechsel.',
    noMatches: 'Niemand passt.',
    removeAction: 'Entfernen',
    removeDescription: '{{name}} wird kein Mitglied dieses Projekts mehr sein.',
    removeTitle: '{{name}} entfernen?',
    removed: 'Mitglied entfernt.',
    role: {
      lead: 'Projektleiter',
    },
    setLead: 'Als Lead festlegen',
    title: 'Mitglieder',
  },
  projectMore: {
    delete: 'Projekt löschen',
    deleteDescription:
      'Das Projekt, seine Mitglieder und Repositorys werden entfernt. Seine Aufgaben bleiben erhalten und gehören keinem Projekt mehr an.',
    deleteTitle: '{{name}} löschen?',
    deleted: 'Projekt {{name}} gelöscht',
    label: 'Weitere Projektaktionen',
  },
  projectPage: {
    distribution: 'Nach Status',
    noIssues: 'Noch keine Aufgaben.',
    numbers: 'Schlüsselzahlen',
    openInList: 'In der Aufgabenliste öffnen',
    stats: {
      done: 'Erledigt',
      review: 'In Prüfung',
      started: 'In Bearbeitung',
      total: 'Aufgaben',
    },
    tabs: {
      issues: 'Aufgaben',
      label: 'Projektabschnitte',
      overview: 'Übersicht',
    },
  },
  projectStatus: {
    cancelled: 'Abgebrochen',
    completed: 'Abgeschlossen',
    inProgress: 'In Bearbeitung',
    paused: 'Angehalten',
    planned: 'Geplant',
  },
  projects: {
    backToList: 'Zurück zu Projekten',
    breadcrumb: 'Projekt',
    columns: {
      lead: 'Projektleiter',
      members: 'Mitglieder',
      name: 'Name',
      priority: 'Priorität',
      progress: 'Fortschritt',
      status: 'Status',
    },
    description:
      'Aufgaben gruppieren, ihre Repositorys verknüpfen und den Fortschritt verfolgen.',
    descriptionLabel: 'Beschreibung',
    detailLoadFailed: 'Dieses Projekt konnte nicht geladen werden',
    editDescription: 'Beschreibung bearbeiten',
    emptyDescription:
      'Erstellen Sie ein Projekt, um Aufgaben zu gruppieren und die betroffenen Repositorys zu verknüpfen.',
    emptyNoAccess: 'Bitten Sie einen Administrator, ein Projekt zu erstellen.',
    emptyTitle: 'Noch keine Projekte',
    loadFailed: 'Projekte können nicht geladen werden',
    new: 'Neues Projekt',
    noDescription: 'Keine Beschreibung.',
    noLead: 'Keine Spur',
    noResults: 'Keine Projektübereinstimmungen.',
    notFound: 'Dieses Projekt existiert nicht oder Sie können es nicht sehen.',
    progressLabel: '{{done}} von {{total}} Aufgaben erledigt',
    search: 'Projekte suchen',
    sidePanel: 'Projektdetails',
    title: 'Projekte',
    visibility: {
      everyone: 'Alle',
      members: 'Nur für Mitglieder',
    },
    visibilityHint: {
      everyone: 'Jedes Mitglied des Arbeitsbereichs kann dieses Projekt sehen.',
      members:
        'Nur Projektmitglieder und Workspace-Administratoren können dieses Projekt und seine Aufgaben sehen.',
    },
    visibilityLabel: 'Sichtbarkeit',
  },
  properties: {
    assignToMe: 'Beauftrage mich',
    created: 'Erstellt',
    details: 'Details',
    executor: 'Bearbeiter',
    labels: 'Etiketten',
    owner: 'Verantwortlicher',
    priority: 'Priorität',
    project: 'Projekt',
    status: 'Status',
    title: 'Eigenschaften',
    updated: 'Aktualisiert',
    you: '(du)',
  },
  reactions: {
    add: 'Reaktion hinzufügen',
    label: 'Reaktionen',
    picker: 'Wählen Sie eine Reaktion',
    toggle: '{{emoji}} {{count}}: {{names}}',
  },
  resourceEdit: {
    edit: '{{name}} bearbeiten',
    moveDown: 'Bewegen Sie {{name}} nach unten',
    moveUp: '{{name}} nach oben verschieben',
    saved: 'Gespeichert.',
    title: 'Repository bearbeiten',
    titleDirectory: 'Verzeichnis bearbeiten',
  },
  resources: {
    add: 'Hinzufügen',
    addSubmit: 'Hinzufügen',
    added: 'Hinzugefügt.',
    adding: 'Hinzufügen…',
    defaultBranch: 'Standardzweig',
    defaultRef: 'Standardzweig',
    defaultRefHint:
      'Optional. Lassen Sie das Feld leer, um den Repository-Standard zu verwenden.',
    empty: 'Keine Repositorys oder Verzeichnisse angehängt.',
    initPrompt: 'Initialisierungsaufforderung',
    initPromptHint:
      'Optional. Einfache Anweisungen, die ein Agent befolgt, wenn er hier zum ersten Mal für eine Aufgabe arbeitet, bevor diese beginnt. Kein Skript: Es führt nichts selbst aus.',
    initPromptPlaceholder:
      'Führen Sie pnpm install aus und kopieren Sie dann .env.example nach .env.',
    initPromptTooLong: 'Die Initialisierungsaufforderung ist zu lang.',
    label: 'Etikett',
    newDescription:
      'Wo die Arbeit dieses Projekts stattfindet. Das erste ist das primäre Arbeitsverzeichnis.',
    newTitle: 'Fügen Sie ein Arbeitsverzeichnis hinzu',
    noRunners: 'Noch keine Laufzeitumgebungen',
    path: 'Verzeichnispfad',
    pathHint:
      'Der absolute Pfad des Verzeichnisses in dieser Laufzeitumgebung. Agenten arbeiten dort vor Ort, eine Aufgabe nach der anderen.',
    pathInvalid:
      'Geben Sie einen absoluten Pfad ein, z. B. /Users/me/work/app.',
    pathRequired: 'Geben Sie den Verzeichnispfad ein.',
    primary: 'Primär',
    remove: '{{name}} entfernen',
    removed: 'Entfernt.',
    runner: 'Laufzeitumgebung',
    runnerHint: 'Nur diese Laufzeitumgebung funktioniert im Verzeichnis.',
    runnerIdPlaceholder: 'Laufzeitumgebung-ID',
    runnerPlaceholder: 'Wählen Sie eine Laufzeitumgebung',
    runnerRequired:
      'Wählen Sie die Laufzeitumgebung aus, in der sich das Verzeichnis befindet.',
    title: 'Repositories und Verzeichnisse',
    type: 'Typ',
    types: {
      directory: 'Verzeichnis auf einer Laufzeitumgebung',
      gitRepo: 'Git-Repository',
    },
    url: 'Repository-URL',
    urlHint:
      'Ein https oder ssh URL, von dem aus das Repository geklont werden kann.',
    urlInvalid:
      'Geben Sie einen Git URL ein, z. B. https://github.com/owner/repo.git.',
    urlRequired: 'Geben Sie das Repository URL ein.',
  },
  richText: {
    mentionList: 'Erwähnungen',
    noMatches: 'Keine Übereinstimmungen',
    toolbar: 'Formatierung',
    tools: {
      bold: 'Fett',
      bulletList: 'Aufzählungsliste',
      code: 'Code',
      italic: 'Kursiv',
      orderedList: 'Nummerierte Liste',
      quote: 'Zitat',
      strike: 'Durchgestrichen',
    },
  },
  roles: {
    actions: 'Aktionen',
    assigned: 'Rollen von {{name}} aktualisiert.',
    backToList: 'Zurück zu den Rollen',
    breadcrumb: 'Rolle',
    builtIn: 'Eingebaut',
    columns: {
      holders: 'Inhaber',
      kind: 'Typ',
      name: 'Name',
    },
    created: 'Rolle {{name}} erstellt.',
    custom: 'Benutzerdefiniert',
    abilities: {
      issues: {
        changeOwner: {
          hint: 'Eine Aufgabe an jemand anderen übergeben, der dafür verantwortlich ist',
          title: 'Besitzer wechseln',
        },
        close: {
          hint: 'Eine Aufgabe als erledigt oder abgebrochen markieren',
          title: 'Aufgaben schließen',
        },
        create: {
          hint: 'Aufgaben erstellen, in einem Projekt oder eigenständig',
          title: 'Aufgaben erstellen',
        },
        delete: {
          hint: 'Aufgaben löschen und gelöschte wiederherstellen',
          title: 'Aufgaben löschen und wiederherstellen',
        },
        edit: {
          hint: 'Titel, Beschreibung, Priorität, Daten, Etiketten, Bearbeiter und offene Status',
          title: 'Aufgaben bearbeiten',
        },
        view: {
          hint: 'Aufgaben in Listen, Boards und ihren Details sehen',
          title: 'Aufgaben ansehen',
        },
      },
      projects: {
        create: {
          hint: 'Starten Sie ein neues Projekt und leiten Sie es',
          title: 'Projekte erstellen',
        },
        delete: {
          hint: 'Projekte löschen und gelöschte wiederherstellen',
          title: 'Projekte löschen',
        },
        manage: {
          hint: 'Umbenennen, Status, Daten und Lead ändern, Mitglieder und Repositories verwalten',
          title: 'Projekte verwalten',
        },
        view: {
          hint: 'Sehen Sie sich Projekte, deren Überblick und Fortschritt an',
          title: 'Projekte anzeigen',
        },
      },
    },
    capabilities: {
      general: {
        read: 'Siehe allgemeine Einstellungen',
        update: 'Aufgabenpräfix ändern',
      },
      labels: {
        read: 'Siehe Etiketten',
        update: 'Labels verwalten',
      },
      members: {
        assign: 'Ändern Sie die Rollen der Mitglieder',
        defineRoles: 'Rollen erstellen und bearbeiten',
        invite: 'Leute einladen',
        read: 'Siehe Mitglieder und Rollen',
      },
    },
    copyOf: '{{name}} (Kopie)',
    defineRolesNote:
      'Wenn Sie „Rollen erstellen und bearbeiten“ gedrückt halten, erhalten Sie Zugriff auf alles in Projekten: Der Inhaber kann seiner eigenen Rolle jede beliebige Fähigkeit hinzufügen.',
    delete: 'Löschen',
    deleteDescription: 'Die Rolle und ihre Berechtigungen werden entfernt.',
    deleteInUse:
      '{{count}}-Leute haben diese Rolle immer noch inne. Ändern Sie ihre Rollen, bevor Sie sie löschen.',
    deleteNamed: '{{name}} löschen',
    deleteTitle: 'Die Rolle {{name}} löschen?',
    deleted: 'Rolle {{name}} gelöscht.',
    description:
      '​​Eine Rolle entscheidet, welche Seiten ihre Inhaber öffnen, welche Einstellungen sie ändern dürfen und wie weit jeder Geschäftsvorgang reicht.',
    discard: 'Änderungen verwerfen',
    duplicate: 'Als neue Rolle duplizieren',
    errors: {
      builtIn: 'Integrierte Rollen können nicht gelöscht werden.',
      notOffered: 'Die Rolle enthält etwas, was Projekte nicht bieten.',
      inUse:
        'Jemand hat diese Rolle immer noch inne; Ändern Sie zuerst ihre Rollen.',
      invalidTitle: 'Der Name muss 1 bis 100 Zeichen lang sein.',
      lastOwner: 'Der letzte Eigentümer behält die Eigentümerrolle.',
      notEditable: 'Die Eigentümerrolle wird hier nicht geändert.',
      notPmRole:
        'Das ist keine Projektrolle; Plattformrollen werden in den Berechtigungseinstellungen verwaltet.',
      systemAdmin:
        'Die Rollen eines Systemadministrators werden in den Berechtigungseinstellungen verwaltet.',
      userDisabled:
        'Einem deaktivierten Konto kann keine Rolle zugewiesen werden.',
    },
    holders: 'Wird von {{count}} gehalten',
    legend: {
      issues:
        'Sichtbare: Aufgaben ohne Projekt und Aufgaben in Projekten, die sie sehen können. Geleitete oder eigene: ihre Aufgaben und Aufgaben in Projekten, die sie leiten. Alle: jede Aufgabe.',
      projects:
        'Sichtbare: öffentliche Projekte und private, denen sie beigetreten sind. Diejenigen, die sie leiten oder besitzen: Projekte, die sie leiten. Alle: jedes Projekt.',
    },
    levels: {
      all: 'Alle',
      managed: 'Diejenigen, die sie führen oder besitzen',
      none: 'Nicht erlaubt',
      visible: 'Sichtbare',
    },
    loadFailed: 'Rollen können nicht geladen werden',
    modules: {
      issues: 'Aufgaben',
      projects: 'Projekte',
      settings: 'Einstellungen',
    },
    modulesLabel: 'Module',
    name: 'Name',
    new: 'Neue Rolle',
    newTitle: 'Neue Rolle',
    none: 'Keine Rolle',
    notFound: 'Diese Rolle existiert nicht.',
    ownerReadOnly:
      'Die Eigentümerrolle besitzt alle Projektberechtigungen und wird hier nicht geändert.',
    pick: 'Fügen Sie eine Rolle hinzu',
    rolesFor: 'Rollen von {{name}}',
    save: 'Speichern',
    saved: 'Rolle {{name}} gespeichert.',
    scopeFor: 'Wie weit {{name}} reicht',
    title: 'Rollen',
    owner: 'Verantwortlicher',
    admin: 'Admin',
    member: 'Mitglied',
  },
  search: {
    description: 'Aufgaben nach Titel oder Kennung suchen.',
    hint: 'Tippen, um Aufgaben zu suchen.',
    issues: 'Aufgaben',
    noResults: 'Keine passenden Aufgaben.',
    placeholder: 'Suche nach Titel oder Kennung…',
    title: 'Aufgaben suchen',
    trigger: 'Suchen',
  },
  settingsPage: {
    general: {
      prefix: 'Präfix der Aufgabenkennung',
      prefixHint:
        'Neue Aufgaben werden wie {{example}} nummeriert. Bestehende Aufgaben behalten ihre Kennung.',
      saved: 'Einstellungen gespeichert.',
      title: 'Aufgabenkennungen',
    },
    readOnly: 'Schreibgeschützt: Sie können dies anzeigen, aber nicht ändern.',
    loadFailed: 'Die Einstellungen konnten nicht geladen werden',
  },
  subtasks: {
    blockedByHint:
      'Es wird erst gestartet, wenn diese erledigt oder abgebrochen sind.',
    blockedByLabel: 'Wartet auf',
    blockedByPlaceholder: 'Geschwister-Unteraufgaben wählen',
    count_one: '{{count}} Unteraufgabe',
    count_other: '{{count}} Unteraufgaben',
    new: 'Neue Unteraufgabe',
    newDescription:
      'Unteraufgaben einer späteren Phase beginnen erst, wenn alle früheren Phasen erledigt sind.',
    newTitle: 'Neue Unteraufgabe',
    noSiblings: 'Noch keine weiteren Unteraufgaben.',
    noStage: 'Keine Bühne',
    stage: 'Stufe {{stage}}',
    stageHint: 'Optional. Die unteren Stufen laufen zuerst.',
    stageInvalid:
      'Geben Sie eine ganze Zahl von 0 bis 1000 ein oder lassen Sie das Feld leer.',
    stageLabel: 'Phase',
    title: 'Unteraufgaben',
    waiting_one: 'Warten auf {{count}}',
    waiting_other: 'Warten auf {{count}}',
  },
  states: {
    notFound: 'Es existiert nicht oder wurde gelöscht.',
  },
  unsavedChanges: {
    description: 'Ihre Eingaben wurden nicht übermittelt und gehen verloren.',
    discard: 'Verwerfen',
    keepEditing: 'Bearbeiten Sie weiter',
    title: 'Nicht gespeicherte Änderungen verwerfen?',
  },
  status: {
    analysis: 'Analyse',
    backlog: 'Backlog',
    blocked: 'Blockiert',
    cancelled: 'Abgebrochen',
    done: 'Erledigt',
    in_progress: 'In Bearbeitung',
    in_review: 'In Prüfung',
    proposal_review: 'Vorschlagsprüfung',
    todo: 'Offen',
  },
  subscribers: {
    label_one: '{{count}}-Abonnent',
    label_other: '{{count}}-Abonnenten',
    none: 'Niemand ist abonniert.',
    reason: {
      commenter: 'kommentierte',
      creator: 'hat es erstellt',
      executor: 'Bearbeiter',
      manual: 'abonniert',
      mentioned: 'erwähnt',
      owner: 'Besitzer',
    },
    subscribe: 'Abonnieren',
    subscribed: 'Sie werden über diese Aufgabe benachrichtigt.',
    title: 'Teilnehmer & Follower',
    unsubscribe: 'Abmelden',
    unsubscribed: 'Sie werden nicht mehr über diese Aufgabe benachrichtigt.',
  },
  threads: {
    collapse: 'Reduziere den Thread',
    expand: 'Zeigt den gelösten Thread von {{name}} an',
    replies_one: '{{count}} Antwort',
    replies_other: '{{count}} antwortet',
    earlierReplies: '{{count}} frühere Antworten anzeigen',
    resolve: 'Entschlossenheit',
    resolved: 'Behoben',
    resolvedBy: 'Behoben durch {{name}}',
    unresolve: 'Wieder öffnen',
  },
  access: {
    sections: {
      projects: 'Projekte',
      issues: 'Aufgaben',
      settings: 'Projekteinstellungen',
      members: 'Mitglieder und Rollen',
    },
    businesses: {
      projects: {
        title: 'Projekte',
        description: 'Projekte, ihre Mitglieder, Repositories und Fortschritt.',
        actions: {
          view: {
            title: 'Projekte anzeigen',
            description:
              'Sehen Sie sich Projekte, deren Überblick und Fortschritt an',
            related: 'Projekte anzeigen (die sie sehen können)',
            relatedLabel: 'Die, die ich sehen kann',
            relatedHint:
              'Öffentliche und private Projekte, die ich leite oder denen ich beigetreten bin',
            all: 'Projekte anzeigen (alle)',
          },
          create: {
            title: 'Projekte erstellen',
            description: 'Starten Sie ein neues Projekt und leiten Sie es',
            all: 'Projekte erstellen',
          },
          manage: {
            title: 'Projekte verwalten',
            description:
              'Umbenennen, Status, Daten und Lead ändern, Mitglieder und Repositories verwalten',
            related: 'Projekte verwalten (die sie leiten)',
            relatedLabel: 'Diejenigen, die ich führe',
            relatedHint: 'Projekte, deren Leiter ich bin',
            all: 'Projekte verwalten (alle)',
          },
          delete: {
            title: 'Projekte löschen',
            description: 'Projekte löschen und gelöschte wiederherstellen',
            all: 'Projekte löschen',
          },
        },
      },
      issues: {
        title: 'Aufgaben',
        description:
          'Aufgaben und ihre Kommentare, in einem Projekt oder eigenständig.',
        actions: {
          view: {
            title: 'Aufgaben ansehen',
            description: 'Aufgaben in Listen, Boards und ihren Details sehen',
            related: 'Aufgaben ansehen (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben ansehen (alle)',
          },
          create: {
            title: 'Aufgaben erstellen',
            description:
              'Aufgaben erstellen, in einem Projekt oder eigenständig',
            related: 'Aufgaben erstellen (in sichtbaren Projekten)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt oder in Projekten, die ich sehen kann',
            all: 'Aufgaben erstellen (alle)',
          },
          edit: {
            title: 'Aufgaben bearbeiten',
            description:
              'Titel, Beschreibung, Priorität, Daten, Etiketten, Bearbeiter und offene Status',
            related: 'Aufgaben bearbeiten (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben bearbeiten (alle)',
          },
          comment: {
            title: 'Aufgaben kommentieren',
            description:
              'Threads kommentieren, antworten und auflösen; eigene Kommentare bearbeiten und löschen',
            related: 'Aufgaben kommentieren (sichtbare)',
            relatedLabel: 'In Projekten kann ich sehen',
            relatedHint:
              'Aufgaben ohne Projekt und Aufgaben in Projekten, die ich sehen kann',
            all: 'Aufgaben kommentieren (alle)',
          },
          moderateComments: {
            title: 'Moderate Kommentare',
            description: 'Kommentare anderer Personen löschen',
            related:
              'Kommentare moderieren (bei eigenen Aufgaben oder in geleiteten Projekten)',
            relatedLabel:
              'Bei meinen Aufgaben oder in Projekten, die ich leite',
            relatedHint:
              'Kommentare zu meinen Aufgaben und zu Aufgaben in Projekten, die ich leite',
            all: 'Moderate Kommentare (alle)',
          },
          close: {
            title: 'Aufgaben schließen',
            description: 'Eine Aufgabe als erledigt oder abgebrochen markieren',
            related: 'Aufgaben schließen (eigene oder in geleiteten Projekten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Meine Aufgaben und Aufgaben in Projekten, die ich leite',
            all: 'Aufgaben schließen (alle)',
          },
          changeOwner: {
            title: 'Besitzer wechseln',
            description:
              'Eine Aufgabe an jemand anderen übergeben, der dafür verantwortlich ist',
            related:
              'Ändern Sie den Eigentümer (die Eigentümer oder deren Projekt sie leiten)',
            relatedLabel:
              'Diejenigen, die ich besitze oder in Projekten, die ich leite',
            relatedHint:
              'Meine Aufgaben und Aufgaben in Projekten, die ich leite',
            all: 'Besitzer wechseln (alle)',
          },
          delete: {
            title: 'Aufgaben löschen und wiederherstellen',
            description: 'Aufgaben löschen und gelöschte wiederherstellen',
            all: 'Aufgaben löschen und wiederherstellen',
          },
        },
      },
      attachments: {
        title: 'Anhänge',
        description: 'An Aufgaben und Kommentare angehängte Dateien.',
        actions: {
          upload: {
            title: 'Anhänge hochladen',
            description:
              'Dateien an Aufgaben, die sie bearbeiten dürfen, und an ihre Kommentare anhängen',
            related: 'Anhänge hochladen (bei sichtbaren Aufgaben)',
            relatedLabel: 'Bei Aufgaben in Projekten, die ich sehen kann',
            relatedHint:
              'Dateien bei Aufgaben ohne Projekt und bei Aufgaben in Projekten, die ich sehen kann',
            all: 'Anhänge hochladen (alle)',
          },
        },
      },
    },
    collections: {
      pmProjects: 'Projekte',
      pmIssues: 'Aufgaben',
    },
    recordAccess: {
      visible: 'Projekte und Aufgaben, die sie sehen können',
      managed:
        'Projekte, die sie leiten, und Aufgaben, für die sie verantwortlich sind',
    },
    settings: {
      pm: {
        general: 'Allgemein',
        labels: 'Etiketten',
        members: 'Mitglieder',
      },
    },
    keyScopes: {
      projects: {
        title: 'Projekte',
        description: 'Siehe Projekte; sie verwalten; erstellen und löschen.',
        objects: 'Projekte',
      },
      issues: {
        title: 'Aufgaben',
        description:
          'Aufgaben sehen; erstellen, bearbeiten, kommentieren, schließen und neu zuweisen; Kommentare moderieren und Aufgaben löschen.',
      },
      settings: {
        title: 'Projekteinstellungen',
        description: 'Allgemeine Einstellungen und Beschriftungen.',
      },
    },
    actions: {
      view: 'Anzeigen',
      create: 'Erstellen',
      manage: 'Verwalten',
      edit: 'Bearbeiten',
      close: 'Schließen',
      comment: 'Kommentar',
      moderateComments: 'Moderate Kommentare',
      changeOwner: 'Eigentümer wechseln',
      delete: 'Löschen',
      upload: 'Hochladen',
      read: 'Anzeigen',
      update: 'Bearbeiten',
      invite: 'Einladen',
      assign: 'Rollen zuweisen',
      'define-roles': 'Rollen definieren',
    },
  },
};

export default deDE;
