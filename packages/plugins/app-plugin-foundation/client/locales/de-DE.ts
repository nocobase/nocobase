import type { FoundationResource } from './en-US.js';

const deDE: FoundationResource = {
  nav: {
    settings: 'Systemeinstellungen',
    foundation: 'Anwendungsbasis',
  },
  page: {
    title: 'Anwendungsbasis',
    description:
      'Ihre Anwendung konzentriert sich auf das Geschäft. Daten, Berechtigungen und Abläufe werden von NocoBase Core unterstützt: gemeinsame Funktionen, die NocoBase entwickelt, testet, pflegt und mit offiziellen Versionen aktualisiert.',
    bandTitle: 'NocoBase Core',
    bandDescription:
      'Verwendete Fähigkeiten leuchten nacheinander auf. Wählen Sie eine für weitere Informationen.',
    score: '{{active}} / {{total}}',
    scoreCaption: 'Fähigkeiten unterstützen diese Anwendung',
    refresh: 'Aktualisieren',
    refreshing: 'Wird erfasst…',
    updatedAt: 'Erfasst am {{time}}',
    loading: 'Fähigkeiten werden erfasst…',
    refreshFailed:
      'Die Aktualisierung ist fehlgeschlagen. Das zuletzt erfolgreich erfasste Ergebnis wird angezeigt.',
    loadFailed: 'Die Übersicht konnte nicht geladen werden.',
    forbidden:
      'Nur Administratoren mit uneingeschränktem Zugriff können diese Seite sehen.',
    retry: 'Erneut versuchen',
    undetermined_one: '{{count}} Fähigkeit nicht bestimmbar',
    undetermined_other: '{{count}} Fähigkeiten nicht bestimmbar',
    highlightsLabel: 'Kennzahlen',
    unavailable: 'Nicht verfügbar',
    lowerBound: 'Mindestwert: Ein Teil konnte nicht gelesen werden.',
  },
  matrix: {
    collections: 'Datensammlungen: {{names}}',
    title: 'Geschäftsmodule und Basisfunktionen',
    description:
      'Sehen Sie, welche Basisfunktionen jedes Modul unterstützen. Wählen Sie ein Häkchen für die Zuordnung und den Aufwand einer eigenen Umsetzung.',
    modules: 'Geschäftsmodule',
    summary: '{{count}} Funktionen · {{pages}} Seiten',
    inspect: '{{module}} × {{capability}} ansehen',
    unknown: 'Nicht erkannt',
    empty:
      'Noch keine Module gefunden. Sie erscheinen automatisch mit neuen Seiten und Navigationseinträgen.',
    legend:
      '✓ Erkannte Einbindung; · keine Zuordnung erkannt. Codereferenzen zeigen Abhängigkeiten, keine Ausführungen.',
    partial:
      'Einige Seitenabhängigkeiten konnten nicht gelesen werden. Bestätigte Zuordnungen bleiben sichtbar.',
    evidence: {
      page: 'Registrierte Anwendungsseite',
      authentication: 'Seite erfordert Anmeldung',
      authorization: 'Seitenzugriff durch Berechtigungen gesteuert',
      provider: 'Seite von diesem Anbieter bereitgestellt',
      source: 'Anbieter im Seitencode referenziert',
      apiSource: 'Anbieter im zugeordneten API-Handler referenziert',
    },
  },
  inventory: {
    recognitionNotes: 'Hinweise zur Erkennung',
    title: 'Fähigkeiten und Anbieter',
    description:
      'Die Fähigkeiten spiegeln den verbundenen Kern, offizielle und Pro-Plugins sowie Anwendungserweiterungen wider.',
    discovered: 'Anbieterpakete gefunden',
    mapped: 'zugeordnete Anbieterpakete',
    unmapped: 'Zuordnung ausstehend',
    partial: 'Erfassung unvollständig. Nicht lesbar: {{sources}}.',
    selectedCategory: 'Anbieter für {{category}}',
    usageBoundary:
      'Der Status gilt für die gesamte Kategorie, nicht für die Aktivierung, Konfiguration oder Nutzung jedes Pakets.',
    noCategoryProviders:
      'Der aktuelle Katalog erkennt keinen Anbieter dieser Kategorie.',
    extensionsTitle: 'Weitere Anbieter · Erkennung ausstehend',
    extensionsDescription:
      'Nicht zugeordnete Anbieter bleiben sichtbar. Sie gelten nicht automatisch als Integration oder ungenutzt.',
    noExtensions:
      'Keine weiteren Anbieter im aktuellen Erfassungsbereich gefunden.',
    discoveryBoundary:
      'Umfang: direkte Abhängigkeiten, bekannte Anbieter sowie öffentliche Datenbank-, weitergeleitete API- und im Browser beobachtete Client-Beiträge. Nicht alle Laufzeitbeiträge, indirekten Erweiterungen oder lokalen Module werden erfasst. Herkunft und Pro-Edition benötigen einen vertrauenswürdigen Katalog; Name und Lizenz reichen nicht aus.',
    versionUnknown: 'Version nicht verfügbar',
    origin: 'Herkunft',
    officialCatalog: 'NocoBase-Katalog',
    unverifiedOrigin: 'Herkunft ungeprüft',
    installation: 'Installation',
    installed: 'Manifest gefunden',
    manifestUnavailable: 'Manifest nicht verfügbar',
    registration: 'Registrierung',
    observed: 'Aktueller Laufzeitbeitrag beobachtet',
    registrationUnknown: 'Nicht bestätigt · bedeutet nicht deaktiviert',
    evidence: 'Nachweis',
    noEvidence: 'Kein bestätigter Nachweis',
    categories: 'Kategorien',
    awaitingRecognition: 'Zuordnung ausstehend',
    evidenceLabels: {
      manifest: 'Manifest des installierten Pakets',
      databaseContribution: 'Datenbankaufgaben-Beitrag',
      apiContribution: 'Weitergeleiteter API-Beitrag',
      foundationRuntime: 'Basisdienst läuft',
      clientContribution: 'Im Browser beobachteter Client-Beitrag',
      serverRegistration: 'Server-Plugin-Registrierung',
    },
  },
  status: {
    active: 'In Verwendung',
    needsSetup: 'Bereit, Einrichtung erforderlich',
    unused: 'Noch ungenutzt',
    undetermined: 'Unbestimmt',
    legendActive: 'In Verwendung {{count}}',
    legendNeedsSetup: 'Einrichtung erforderlich {{count}}',
    legendUnused: 'Noch ungenutzt {{count}}',
  },
  detail: {
    collectionCount: '{{count}} Tabellen',
    collectionPreview: 'Tabellenvorschau',
    collectionsTitle: 'Tabellen',
    noCollectionMatches: 'Keine passenden Tabellen',
    noCollectionMatchesHint:
      'Versuchen Sie einen anderen Namen oder leeren Sie die Suche.',
    collectionRange: '{{from}}–{{to}} von {{total}}',
    closeCollections: 'Tabellen schließen',
    viewCollections: 'Alle Sammlungen anzeigen',
    searchCollections: 'Sammlungen suchen',
    collectionResults: '{{count}} passende Sammlungen',
    previousPage: 'Zurück',
    nextPage: 'Weiter',
    countRecords: 'Geschäftsdatensätze zählen',
    recordsOnDemand:
      'Geschäftsdatensätze werden bei Bedarf gezählt. Große Datenbanken können länger brauchen.',
    recordsCountedAt: 'Datensätze gezählt {{time}}',

    businessModules: 'Verknüpfte Geschäftsmodule',
    inThisApp: 'In dieser Anwendung',
    withoutFoundation: 'Ohne die Basis',
    onceInUse: 'Nach der Einrichtung',
    whyNot: 'Warum ungenutzt',
    liveData: 'Aktuelle Daten',
    parts: 'Bestandteile',
    packages: 'Bereitgestellt durch NocoBase-Pakete',
    noPackages: 'Kein Paket dieser Fähigkeit installiert.',
    noFacts: 'Noch keine bestätigten Fakten.',
    partial:
      'Ein Teil der Nachweise ist nicht lesbar. Mindestwerte umfassen nur gelesene Daten.',
    failed: 'Diese Fähigkeit konnte nicht geprüft werden. Bitte aktualisieren.',
    unreadable: 'Nicht lesbar: {{sources}}',
    timeout: 'Zeitüberschreitung bei der Prüfung.',
  },
  capabilities: {
    dataModeling: {
      name: 'Datenmodellierung',
      tagline: 'Sammlungen, Felder, Beziehungen und Migrationen',
      without:
        'Schemaänderungen, Abfragen, Filter, Seitennavigation, Injektionsschutz und Datenbankkompatibilität müssten selbst umgesetzt werden.',
      onceInUse:
        'Migrationen definieren Sammlungen, eine einheitliche Schnittstelle fragt unterstützte Datenbanken ab.',
    },
    files: {
      name: 'Dateiverwaltung',
      tagline: 'Uploads, Speicherung und Anhänge',
      without:
        'Uploads, Speicheradapter, Größen- und Typprüfungen und Downloads müssten selbst entwickelt werden.',
      onceInUse:
        'Ein einheitlicher Sammlungs- und Speichervertrag verwaltet Anhänge.',
    },
    usersAndOrganizations: {
      name: 'Benutzer und Organisationen',
      tagline: 'Konten, Anmeldung und Einladungen',
      without:
        'Registrierung, Sitzungen, Passwortwiederherstellung und sichere Kontoverwaltung müssten selbst entwickelt werden.',
      onceInUse: 'Konten, Anmeldung und Einladungen werden zentral verwaltet.',
    },
    permissions: {
      name: 'Berechtigungen',
      tagline: 'Berechtigungssätze und Zugriffsregeln',
      without:
        'Jede API müsste Berechtigungen selbst prüfen, ohne zentrale Verwaltung.',
      onceInUse:
        'Berechtigungssätze erlauben Seiten, Daten und Aktionen; der Server prüft jede Anfrage.',
    },
    workflows: {
      name: 'Abläufe und Genehmigungen',
      tagline: 'Lebenszyklen, Übergänge und Zeitpläne',
      without:
        'Zustände, Übergänge, Verlauf, Wiederholungen und Zeitlimits müssten selbst implementiert werden.',
      onceInUse:
        'Lebenszyklen bieten kontrollierte Übergänge, Verlauf und wiederholbare Effekte.',
    },
    aiAgents: {
      name: 'KI und Agenten',
      tagline: 'Modelldienste, Agenten und Ausführungsdienste',
      without:
        'Modelle, Schlüsselverwaltung, Nutzungsprotokolle und sichere Agentenausführung müssten selbst integriert werden.',
      onceInUse:
        'Aktivieren Sie Modelldienste für OnlineAgent und das Modell-Gateway oder registrieren Sie Ausführungsdienste für Agenten.',
    },
    knowledge: {
      name: 'Wissensdatenbank',
      tagline: 'Bereiche, Dokumente und Suche',
      without:
        'Dokumentspeicher, Versionen, Zugriffsrechte und Suche müssten selbst gebaut werden.',
      onceInUse:
        'Wissensbereiche verwalten Dokumente, Versionen und Zugriff für Menschen und Agenten.',
    },
    mail: {
      name: 'E-Mail',
      tagline: 'Postfächer, Synchronisierung und Versand',
      without:
        'Anbieter, Ordnerabgleich, Autorisierung und erneute Zustellung müssten selbst integriert werden.',
      onceInUse:
        'Postfächer verbinden und E-Mails in der Anwendung lesen, synchronisieren und versenden.',
    },
    notifications: {
      name: 'Benachrichtigungen',
      tagline: 'Kanäle, Zustellungen und interne Nachrichten',
      without:
        'Versand, Wiederholungen, Deduplizierung und Verlauf müssten für jeden Kanal entwickelt werden.',
      onceInUse:
        'Konfigurierte Kanäle bieten Versand mit Wiederholungen, Deduplizierung und Verlauf.',
    },
    integrations: {
      name: 'Integrationen',
      tagline: 'API-Schlüssel und externer Zugriff',
      without:
        'Zugangsdaten müssten für jedes externe System ausgestellt und geprüft werden.',
      onceInUse:
        'Externe Systeme verwenden API-Schlüssel mit den Rechten ihres Eigentümers.',
    },
    interface: {
      name: 'Oberfläche und Konfiguration',
      tagline: 'Seiten, Navigation, Sprachen und Designs',
      without:
        'Routing, Menüs, Übersetzungen und Designs müssten vor den Geschäftsseiten gebaut werden.',
      onceInUse:
        'Der NocoBase-Client liefert Seiten, Menüs, Sprachen und Designs.',
    },
    audit: {
      name: 'Auditprotokoll',
      tagline: 'Aufzeichnung sensibler Vorgänge',
      without:
        'Wichtige Änderungen und ihre Urheber müssten überall manuell protokolliert werden.',
      onceInUse:
        'Ein zentrales Protokoll bewahrt sensible Vorgänge der Anwendung auf.',
    },
    operations: {
      name: 'Betrieb',
      tagline: 'Migrationen, Aufgaben, Warteschlangen und Geheimnisse',
      without:
        'Aktualisierungen, Hintergrundaufgaben, Warteschlangen und Geheimnisse müssten selbst verwaltet werden.',
      onceInUse:
        'Der Server liefert protokollierte Migrationen, Aufgaben, Warteschlangen und Geheimnisverwaltung.',
    },
  },
  reasons: {
    installedNotUsed:
      'Installiert, aber es wurden keine Belege für eine aktuelle Aktivierung oder Nutzung gefunden.',
    noRecognizedAudit:
      'Der aktuelle Katalog erkennt keinen Auditanbieter; weitere Erweiterungen könnten diese Fähigkeit liefern.',
    noDatabase: 'Die Anwendung nutzt keine Datenbank.',
    notRegistered:
      'Das Anbieter-Plugin ist nicht in der Anwendung registriert.',
    notProvided: 'NocoBase Core stellt dies noch nicht bereit.',
    noFileCollection: 'Keine Sammlung speichert Dateien.',
    noDrive: 'Dateisammlungen vorhanden, aber kein Speicher eingerichtet.',
    noAccounts: 'Die Anwendung hat keine Konten.',
    onlyUnrestrictedAccess:
      'Nur Administratoren haben uneingeschränkten Zugriff; anderen Benutzern wurden noch keine Rechte erteilt.',
    noWorkflows: 'Keine gespeicherten Lebenszyklen oder aktivierten Zeitpläne.',
    noSchedules: 'Kein Zeitplan aktiviert.',
    noModelOrRunner:
      'Kein Modelldienst ist aktiviert und kein Ausführungsdienst registriert.',
    noModelService: 'Kein Modelldienst aktiviert.',
    noAgent: 'Kein Agent definiert.',
    noDocuments: 'Keine Dokumente in Wissensbereichen.',
    noConnectedMailbox: 'Kein Postfach verbunden.',
    noChannel: 'Kein Benachrichtigungskanal eingerichtet.',
    noApiKey: 'Keine API-Schlüssel vorhanden.',
    noUsedApiKey: 'API-Schlüssel vorhanden, aber noch nicht verwendet.',
    noClient: 'Die Anwendung stellt keinen NocoBase-Client bereit.',
    notConfigured: 'Nicht eingerichtet.',
  },
  facts: {
    collectionOwnershipUnknown:
      'Nicht zugeordnete Laufzeiterweiterung gefunden. Die Zugehörigkeit von Sammlungen ist unklar; Geschäftszahlen werden ausgeblendet.',
    noApplicationCollections:
      'Die Datenschicht läuft, die Anwendung hat noch keine eigenen Sammlungen.',
    applicationCollectionsPreview:
      'Diese Anwendung hat {{count}} Sammlungen, darunter {{names}}.',
    applicationCollections: '{{count}} eigene Sammlungen: {{names}}.',
    relations: '{{count}} Beziehungen verbinden sie.',
    fileCollections: '{{count}} Dateisammlungen: {{names}}.',
    accounts: '{{count}} Konten verwenden die NocoBase-Anmeldung.',
    permissionSets:
      '{{count}} Berechtigungssätze außer dem uneingeschränkten: {{names}}.',
    accessRules:
      '{{count}} Freigabe-, Einschränkungs- oder Standardzugriffsregeln.',
    lifecyclesWithoutTransitions:
      'Lebenszyklusspeicher eingerichtet, noch keine Übergänge.',
    lifecycles:
      '{{count}} Lebenszyklen mit {{transitions}} Übergängen: {{names}}.',
    schedules: '{{count}} Zeitpläne aktiviert.',
    modelServices:
      '{{count}} aktivierte Modelldienste unterstützen OnlineAgent und Modell-Gateway-Aufrufe.',
    runners:
      '{{count}} registrierte Ausführungsdienste unterstützen die Agentenausführung.',
    agents: '{{count}} Agenten, {{runs}} Ausführungen.',
    documents: '{{count}} Wissensdokumente.',
    mailboxes: '{{count}} Postfächer verbunden.',
    mailboxesNeedAttention:
      '{{count}} Postfächer benötigen einen Eingriff zur Synchronisierung.',
    channels: '{{count}} Benachrichtigungskanäle: {{names}}.',
    usedApiKeys: '{{count}} API-Schlüssel für Aufrufe verwendet.',
    locales: '{{count}} Sprachen: {{names}}.',
    migrations:
      '{{count}} Migrationen ausgeführt, davon {{own}} anwendungseigene.',
    latestMigration: 'Letzte Ausführung: {{at}}.',
    registeredExtension: 'Die Erweiterung ist in dieser Anwendung registriert.',
  },
  parts: {
    accounts: 'Konten',
    organizations: 'Organisationen',
    permissionSets: 'Berechtigungssätze',
    sharingRules: 'Freigaberegeln',
    restrictionRules: 'Einschränkungsregeln',
    defaultAccess: 'Standardzugriff',
    lifecycles: 'Lebenszyklen',
    schedules: 'Zeitpläne',
    modelServices: 'Modelldienste',
    agents: 'Agenten',
    runners: 'Ausführungsdienste',
    migrations: 'Migrationen',
    jobs: 'Aufgaben',
    queue: 'Warteschlange',
    secrets: 'Geheimnisse',
    caching: 'Cache',
  },
  metrics: {
    businessRecords: 'Geschäftsdatensätze',
    businessCollections: 'Geschäftssammlungen',
    views: 'Ansichten',
    fields: 'Felder',
    relations: 'Beziehungen',
    systemCollections: 'NocoBase-Systemsammlungen',
    files: 'Dateien',
    storedBytes: 'protokollierter Speicherplatz',
    fileCollections: 'Dateisammlungen',
    accounts: 'Konten',
    disabledAccounts: 'deaktivierte Konten',
    invitations: 'Einladungen',
    grants: 'Berechtigungen',
    permissionSets: 'Berechtigungssätze',
    assignments: 'Zuweisungen',
    sharingRules: 'Freigaberegeln',
    restrictionRules: 'Einschränkungsregeln',
    defaultAccess: 'Standardzugriffsregeln',
    transitions: 'Zustandsübergänge',
    lifecycles: 'Lebenszyklen mit Übergängen',
    effectsSucceeded: 'erfolgreiche Effekte',
    effectsFailed: 'fehlgeschlagene Effekte',
    effectsPending: 'wartende Effekte',
    schedules: 'aktivierte Zeitpläne',
    scheduleOccurrences: 'Zeitplanvorkommen',
    agents: 'Agenten',
    modelServices: 'aktivierte Modelldienste',
    runners: 'Ausführungsdienste',
    runs: 'Ausführungen',
    modelCalls: 'Modellaufrufe außerhalb von Ausführungen',
    tokens: 'Token',
    documents: 'Dokumente',
    spaces: 'Wissensbereiche',
    chunks: 'Fragmente',
    connectedMailboxes: 'verbundene Postfächer',
    mailboxesNeedAttention: 'Postfächer mit Handlungsbedarf',
    messages: 'Nachrichten',
    submissions: 'zum Versand übergebene Nachrichten',
    failedSubmissions: 'fehlgeschlagene Sendungen',
    acceptedDeliveries: 'vom Anbieter angenommene Zustellungen',
    notifications: 'Benachrichtigungen',
    deliveries: 'Zustellungen',
    failedDeliveries: 'fehlgeschlagene Zustellungen',
    pendingDeliveries: 'laufende Zustellungen',
    deliveryAttempts: 'Zustellversuche',
    inAppMessages: 'interne Nachrichten',
    inAppMessagesRead: 'gelesene interne Nachrichten',
    channels: 'Kanäle',
    usedApiKeys: 'verwendete API-Schlüssel',
    apiKeys: 'aktivierte API-Schlüssel',
    locales: 'Sprachen',
    migrations: 'ausgeführte Migrationen',
    applicationMigrations: 'anwendungseigene Migrationen',
    seeds: 'ausgeführte Seeds',
  },
  dynamic: {
    pending: 'Erkennung ausstehend',
    pendingDescription:
      'Das Plugin ist registriert. Konfiguration und tatsächliche Nutzung sind noch nicht bestimmt.',
  },
};

export default deDE;
