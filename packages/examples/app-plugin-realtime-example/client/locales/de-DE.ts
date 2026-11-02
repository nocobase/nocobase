import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  business: {
    scenarios: 'Echtzeitszenarien',
    tabs: {
      tasks: 'Aufgaben',
      inbox: 'Posteingang',
      exports: 'Exporte',
      lab: 'Fähigkeitslabor',
    },
    assignee: 'Zugewiesene Person',
    creator: 'Erstellt von',
    updated: 'Letzte Aktualisierung',
    statusLabel: 'Status',
    detail: 'Aufgabendetails',
    saving: 'Speichern…',
    saved: 'Aufgabenstatus aktualisiert',
    updating: 'Aktualisiert…',
    previous: 'Zurück',
    next: 'Weiter',
    close: 'Schließen',
    cancel: 'Abbrechen',
    create: 'Erstellen',
    created: 'Aufgabe „{{title}}“ erstellt',
    status: {
      open: 'Zu tun',
      'in-progress': 'In Bearbeitung',
      done: 'Erledigt',
    },
    actions: {
      'in-progress': 'Starten',
      done: 'Abgeschlossen',
      open: 'Wieder öffnen',
    },
    form: {
      help: 'Beschreiben Sie die Arbeit und entscheiden Sie, wer sie erledigen soll.',
      title: 'Titel',
      description: 'Beschreibung',
      choose: 'Wählen Sie einen Beauftragten',
      titleRequired: 'Geben Sie einen Titel mit 1–200 Zeichen ein.',
      descriptionRequired: 'Beschreiben Sie, was getan werden muss.',
      assigneeRequired: 'Wählen Sie einen aktiven Beauftragten.',
    },
    errors: {
      session: 'Ihre Sitzung ist beendet. Melden Sie sich erneut an.',
      forbidden:
        'Sie haben keinen Zugriff mehr auf diese Aufgabe. Schließen Sie es und wenden Sie sich an den Ersteller.',
      missing:
        'Dieser Datensatz existiert nicht mehr. Schließen Sie es oder kehren Sie zur aktuellen Liste zurück.',
      failed: 'Die Anfrage ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
      active:
        'Ein Export läuft noch. Warten Sie, bis der Vorgang abgeschlossen ist.',
    },
    read: 'Lesen',
    unread: 'Ungelesen',
    markRead: 'Mark las',
    markUnread: 'Als ungelesen markieren',
    markedRead: 'Benachrichtigung als gelesen markiert',
    markedUnread: 'Benachrichtigung als ungelesen markiert',
    loadMore: 'Mehr laden',
    jobs: {
      queued: 'In der Warteschlange',
      running: 'Exportieren',
      completed: 'Bereit zum Download',
      failed: 'Fehlgeschlagen',
    },
    tasks: {
      title: 'Aufgabenzusammenarbeit',
      description:
        'Weisen Sie Arbeiten zu und verfolgen Sie deren Fortschritt gemeinsam in Echtzeit.',
      try: 'Versuchen Sie es mit zwei Fenstern: Erstellen Sie hier eine Aufgabe und beobachten Sie dann, wie sie im anderen Fenster angezeigt wird und ihren Status ändert. Nur Aufgaben, die Sie erstellt haben oder denen Sie zugewiesen sind, sind sichtbar.',
      create: 'Neue Aufgabe',
      empty: 'Noch keine Aufgaben',
      emptyHelp:
        'Erstellen Sie eine echte Aufgabe, weisen Sie sie sich selbst oder einem Kollegen zu und befolgen Sie sie hier.',
      stageEmpty: 'In dieser Phase gibt es auf dieser Seite keine Aufgaben',
      page: 'Seite {{page}} · {{count}} Aufgaben insgesamt. In den Spalten werden bis zu 30 Aufgaben auf dieser Seite angezeigt.',
    },
    inbox: {
      title: 'Persönlicher Posteingang',
      description:
        'Erhalten Sie Aufgabenzuweisungen und Aktualisierungen und halten Sie den Lesestatus über alle Fenster hinweg synchron.',
      try: 'Weisen Sie sich selbst eine Aufgabe zu, um eine Benachrichtigung zu erhalten. Verwenden Sie für die Zusammenarbeit ein anderes Konto: Aktualisierungen benachrichtigen die anderen Teilnehmer. Dieser Posteingang enthält alle Ihre Bewerbungsbenachrichtigungen.',
      empty: 'Noch keine Benachrichtigungen',
      emptyHelp:
        'Erstellen Sie unter „Aufgaben“ eine Aufgabe, die Ihnen selbst zugewiesen wurde, und kehren Sie dann hierher zurück.',
    },
    exports: {
      missing:
        'Diese Exportdatei ist nicht mehr verfügbar. Erstellen Sie einen neuen Export, um Ihre aktuellen Aufgaben herunterzuladen.',
      title: 'Aufgabenexporte',
      description:
        'Exportieren Sie Ihre sichtbaren Aufgaben im Hintergrund und laden Sie die resultierende CSV herunter.',
      try: 'Starten Sie einen Export, wechseln Sie die Seite und kehren Sie dann zurück, um ihn herunterzuladen. Ein weiteres Fenster folgt dem gleichen Job. Der Fortschritt zählt echte Zeilen; Ein kleiner Export kann sofort abgeschlossen werden.',
      create: 'Aufgaben exportieren',
      empty: 'Noch keine Exporte',
      emptyHelp:
        'Erstellen Sie einen CSV-Snapshot Ihrer Aufgaben, einschließlich deren Beschreibungen, Status und Beauftragten.',
      accepted: 'Export gestartet',
      active:
        'Ein Export wird ausgeführt. Sie können diese Seite verlassen und später wiederkommen.',
      file: 'Aufgaben CSV',
      rows: '{{processed}} / {{total}} Zeilen verarbeitet',
      progress: 'Exportfortschritt',
      limit:
        'Der Export überschreitet 5.000 Aufgaben. Dieses Beispiel unterstützt höchstens 5.000 Zeilen pro Export.',
      failed:
        'Der Export ist fehlgeschlagen. Verwenden Sie „Aufgaben exportieren“, um einen neuen Versuch zu starten.',
      download: 'Herunterladen',
      downloaded: 'CSV-Download gestartet',
      retention:
        'Ihre letzten 20 Exporte bleiben erhalten. Jede Datei ist eine Momentaufnahme der Aufgaben, auf die Sie bei der Erstellung zugreifen konnten.',
    },
  },
  routeOverlay: {
    close: 'Schließen',
  },
  title: 'Echtzeitbeispiele',
  description:
    'Entdecken Sie Abonnements, Zugriffskontrolle und Wiederherstellung mit Live-Ereignissen und beobachtbaren Schnappschüssen.',
  scope:
    'Demowerte gehören zu Ihrem Konto, sind nur in diesem Prozess aktiv und werden nach einer Stunde Inaktivität oder einem Serverneustart zurückgesetzt.',
  account: 'Girokonto',
  loading: 'Wird geladen',
  working: 'Arbeitet…',
  retry: 'Erneut versuchen',
  reload: 'Demo zum erneuten Laden',
  signIn: 'Melden Sie sich erneut an',
  cancel: 'Abbrechen',
  connection: 'Verbindung',
  subscription: 'Abonnement',
  events: 'Erhaltene Ereignisse',
  ready: 'Danksagungen',
  snapshot: 'Beobachteter Schnappschuss',
  reads: 'Snapshot-Lesevorgänge abgeschlossen',
  readAt: 'Letzter erfolgreicher Lesevorgang',
  waiting: 'Warten auf das erste Ereignis…',
  none: 'Noch nicht verfügbar',
  topic: 'Thema',
  receipt: 'Letzter Veröffentlichungsbeleg',
  pause: 'Abonnement pausieren',
  resume: 'Abonnement fortsetzen',
  reconnect: 'Verbindung wiederherstellen',
  states: {
    idle: 'Leerlauf',
    connecting: 'Verbinden',
    open: 'Öffnen',
    reconnecting: 'Verbindung wird wiederhergestellt',
    closed: 'Geschlossen',
    pending: 'Ausstehend',
    subscribing: 'Abonnieren',
    subscribed: 'Abonniert',
    error: 'Fehler',
  },
  clock: {
    title: '1. Öffentliches Thema und React-Hook',
    description:
      'useRealtimeTopic abonniert die öffentliche Uhr. Durch das Pausieren wird die Überwachung dieser Karte freigegeben.',
    latest: 'Letzte Serverzeit',
    paused: 'Diese Karte ist pausiert. Fortsetzen, um neue Ticks zu erhalten.',
    initial:
      'Die Uhr beginnt mit der Veröffentlichung, wenn ihr erster Abonnent bestätigt wird.',
  },
  personal: {
    title: '2. Persönliche Ereignisse',
    description:
      '„publishFor“ zielt auf Ihr Konto ab. Eine weitere Registerkarte dieses Kontos empfängt das Ereignis; ein anderes Konto nicht.',
    send: 'An mein Konto senden',
    empty:
      'Noch keine persönlichen Ereignisse. Senden Sie eines, um die Lieferung zu beobachten.',
    recovery:
      'onReady liest nach jeder Bestätigung den neuesten persönlichen Schnappschuss.',
  },
  room: {
    title: '3. Dynamische Ressourcenautorisierung',
    description:
      'Dieser Raum verwendet dieselbe Eigentümer- und Zugriffsrichtlinie für HTTP-Lesevorgänge und Echtzeitzustellung.',
    allowed: 'Zugriff gewährt',
    denied: 'Zugriff verweigert',
    grant: 'Zugriff gewähren',
    revoke: 'Zugriff widerrufen',
    retry: 'Abonnement erneut versuchen',
    send: 'Raumänderung veröffentlichen',
    grantHint:
      'Gewähren Sie Zugriff und versuchen Sie dann erneut, das verweigerte Abonnement abzuschließen.',
    retryHint:
      'Der Zugang wird gewährt. Versuchen Sie erneut, eine neue Bestätigung zu erhalten.',
    revokeTitle: 'Zugriff auf Ihren Demoraum widerrufen?',
    revokeDescription:
      'Bestehende Abonnements verlieren den Zugriff und löschen den Raum-Snapshot. Sie können den Zugriff erneut gewähren.',
    blocked:
      'Der Raum-Snapshot wird ausgeblendet, während der Zugriff verweigert wird.',
    success: 'Raumzugang aktualisiert',
  },
  counter: {
    title: '4. Zusammengeführte Auffrischung und Aufholjagd',
    description:
      'Fünf Ungültigmachungen aktualisieren einen Zähler. useRealtimeRefresh führt Lesevorgänge zusammen; Die Vergleichsanzahl erhöht sich nach der anfänglichen Bereitschaft.',
    burst: '5 Änderungen veröffentlichen',
    pause: 'Live-Aktualisierung anhalten',
    resume: 'Live-Aktualisierung fortsetzen',
    paused:
      'Snapshot-Aktualisierung ist angehalten; Der Ereignisbeobachter bleibt aktiv. Veröffentlichen Sie erneut und fahren Sie dann fort, um auf dem Laufenden zu bleiben.',
    running:
      'Snapshot-Aktualisierung ist aktiv. Ausgeblendete Registerkarten werden aktualisiert, wenn sie wieder sichtbar sind.',
    refreshing: 'Erfrischender Schnappschuss…',
    note: 'Dieser Wert stammt nur aus dem gelesenen API, niemals aus der Veröffentlichungsantwort.',
  },
  unknown: {
    title: '5. Abonnementfehler',
    description:
      'Ein nicht deklariertes Thema wird abgelehnt, ohne dass zugelassene Themen gestoppt werden.',
    try: 'Versuchen Sie es mit einem unbekannten Thema',
    explanation:
      'Hier wird TOPIC_NOT_FOUND erwartet. Der Server muss ein Thema deklarieren, bevor es abonniert werden kann.',
    initial:
      'Starten Sie den Versuch, einen echten Protokollfehler zu beobachten.',
  },
  recovery: {
    title: '6. Verbindungswiederherstellung',
    description:
      'Trennen Sie die lokalen Sockets dieses Kontos, einschließlich anderer Registerkarten. Der Client stellt die Verbindung automatisch wieder her und onReady ruft verpasste Änderungen erneut ab.',
    disconnect: 'Trennung simulieren',
    history: 'Aktuelle Verbindungsstatus',
    note: '„An der Spitze erneut verbinden“ öffnet die gemeinsame Anwendungsverbindung erneut. Ereignisse sind vorübergehend: Snapshots stellen den Status ohne Wiederholung wieder her.',
    instruction:
      'Änderungen von einer anderen Registerkarte aus veröffentlichen. Setzen Sie eine angehaltene Aktualisierung fort, um auf dem Laufenden zu bleiben. Reconnect ruft Snapshots erneut ab, während die Aktualisierung aktiv ist.',
    disconnected: 'Echtzeit-Sockets getrennt',
  },
  published: 'Veröffentlichung angenommen',
  errors: {
    request: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
    session: 'Ihre Sitzung ist beendet. Melden Sie sich erneut an.',
    forbidden:
      'Der Zugriff wird verweigert. Überprüfen Sie Ihre aktuellen Berechtigungen.',
    expired:
      'Die Demonstration ist abgelaufen. Laden Sie es neu, um einen neuen Raum zu erstellen.',
    capacity:
      'Die Demonstration ist beschäftigt. Versuchen Sie es später noch einmal.',
    subscription:
      'Das Abonnement ist fehlgeschlagen. Stellen Sie erneut eine Verbindung her oder versuchen Sie es erneut, nachdem der Zugriff wiederhergestellt wurde.',
  },
};

export default deDE;
