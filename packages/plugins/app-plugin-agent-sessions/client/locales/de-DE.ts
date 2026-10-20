import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  navigation: {
    agentSessions: 'Meine Agenten',
  },
  actions: {
    close: 'Schließen',
    copy: 'Kopieren',
    cancel: 'Abbrechen',
  },
  status: {
    loading: 'Wird geladen',
    offline: 'Computer offline',
    waiting: 'Braucht dich',
    active: 'In Bearbeitung',
  },
  errors: {
    generic: 'Etwas ist schief gelaufen. Versuchen Sie es erneut.',
    copy: 'Kopieren in die Zwischenablage fehlgeschlagen.',
    sessionNotFound:
      'Diese Sitzung existiert nicht oder sie gehört nicht Ihnen.',
  },
  list: {
    expand: 'Sitzungen anzeigen',
    label: 'Sitzungen',
    title: 'Meine Agenten',
    archived: 'Archiviert',
    back: 'Zurück zu den Sitzungen',
    new: 'Neue Sitzung',
    search: 'Suchsitzungen',
    filter: 'Anzeigen',
    filters: {
      all: 'Alle',
      waiting_one: 'Braucht mich {{count}}',
      waiting_other: 'Braucht mich {{count}}',
      active_one: 'In Bearbeitung {{count}}',
      active_other: 'In Bearbeitung {{count}}',
    },
    groups: {
      today: 'Heute',
      yesterday: 'Gestern',
      week: 'Diese Woche',
      earlier: 'Früher',
    },
    empty:
      'Noch keine Sitzungen. Starten Sie eine, um mit einem Agenten auf Ihrem Computer zu sprechen.',
    noArchived: 'Keine archivierten Sitzungen.',
    noMatch: 'Keine Session-Matches.',
    more: 'Mehr anzeigen',
    allProjects: 'Alle Projekte',
    archive: 'Archivieren',
    restore: 'Wiederherstellen',
    archivedToast: 'Archiviert „{{title}}“',
    restoredToast: '„{{title}}“ wiederhergestellt',
    undo: 'Rückgängig machen',
  },
  links: {
    title: 'Aufgaben',
    count_one: '{{count}}-Aufgabe',
    count_other: '{{count}}-Aufgaben',
    none: 'Keine Aufgaben',
    empty:
      'Diese Sitzung hat noch keine Aufgaben. Bitten Sie den Agenten, das, was Sie besprochen haben, in Aufgaben umzuwandeln.',
    created_one: '{{count}}-Aufgabe erstellt',
    created_other: '{{count}}-Aufgaben erstellt',
    start_one: '{{count}}-Task starten',
    start_other: '{{count}}-Aufgaben starten',
    startOne: 'Starten',
    skip: 'Nicht jetzt',
    startHint: 'Agenten im Laufzeitplan und erledigen die Arbeit.',
    notStarted: 'Nicht gestartet',
    started_one: '{{count}} gestartet',
    started_other: '{{count}} gestartet',
    left: '{{keys}} in {{status}} verlassen',
    separator: ', ',
    comma: ', ',
    waiting: 'Braucht dich {{count}}',
    unknown: 'Unbekannt',
  },
  newSession: {
    sendUnconfirmed:
      'Senden wurde nicht bestätigt. Verwenden Sie „Originalübermittlung erneut versuchen“, um die Bestätigung wiederherzustellen.',
    settingsOutdated:
      'Die Befehlszeile dieses Computers ist für diese Anwendung zu alt. Aktualisieren Sie es dort, wie unter „Meine Computer“ angezeigt.',
    settingsOffline:
      'Dieser Computer ist offline. Schließen Sie die Bridge erneut an, um die Einstellungen zu laden und zu senden.',
    settingsLoading: 'Einstellungen werden geladen…',
    settingsFailed: 'Agent-Einstellungen konnten nicht geladen werden.',
    settingsRetry: 'Einstellungen erneut versuchen',
    settingsReset: 'Agentenstandards verwenden',
    settingsUnsupported:
      'Dieser Agent macht keine Einstellungen verfügbar. Es werden die Standardeinstellungen verwendet.',
    settingsEmpty:
      'Dieser Agent verfügt über keine konfigurierbaren Einstellungen. Es werden die Standardeinstellungen verwendet.',
    title: 'Neue Sitzung',
    subtitle:
      'Besprechen und klären Sie Anforderungen mit einem Agenten am eigenen Computer, erfassen Sie Aufgaben und verfolgen Sie hier den Fortschritt. Der Projektmanager von Studio koordiniert Agenten, um Aufgaben zu entwickeln, nachdem Sie sie gestartet haben.',
    pickComputer: 'Wählen Sie einen Computer',
    noAgent: 'Kein Agent verfügbar',
    folder: 'Verzeichnis auf dem Computer',
    placeholder:
      'Sagen Sie, was Sie brauchen. Mehrere Dinge auf einmal oder ein Screenshot sind in Ordnung.',
    accessHint:
      'Agenten werden mit vollem Zugriff in dem von Ihnen gewählten Verzeichnis ausgeführt, wie in Ihrem eigenen Terminal.',
    noComputer: 'Schließen Sie zuerst Ihren Computer an',
    noComputerHint:
      'Sitzungen werden auf Ihrem eigenen Computer ausgeführt: Der Agent arbeitet dort, angemeldet mit Ihrem eigenen Konto, in den von Ihnen zugelassenen Ordnern, und die Konversationen werden hier gespeichert. Schließen Sie es einmal an und es ist online, wann immer der Computer eingeschaltet ist. Mein Agent hilft bei der Besprechung und Klärung von Anforderungen, bei der Aufzeichnung von Aufgaben und bei der Verfolgung des Fortschritts. Nachdem Sie sie gestartet haben, koordiniert der Projektmanager von Studio die Agenten, um sie zu entwickeln.',
    allOffline: 'Ihre Computer sind offline',
    offlineHint:
      'Führen Sie dies auf dem Computer aus, um die Verbindung bei jeder Anmeldung aufrechtzuerhalten.',
    noAgentTitle: 'Auf diesem Computer ist kein Agent bereit',
    noAgentHint:
      'Installieren Sie einen davon dort und melden Sie sich mit seinem eigenen Befehl an. Die Bridge überprüft jede Minute und listet sie auf, nachdem die Einrichtung und der Start erfolgreich waren, ohne erneut eine Verbindung herzustellen.',
    supported: 'Unterstützt: {{names}}',
    failedAgent: '{{name}} konnte nicht gestartet werden: {{detail}}',
    modelHint:
      'Wählen Sie das stärkste Modell, das Sie verwenden können: Es analysiert und schlüsselt die Arbeit am besten auf.',
    computers: 'Meine Computer',
    manageComputers: 'Meine Computer verwalten…',
    agents: 'Agenten auf diesem Computer',
    availableAgents: 'Verfügbare Agenten',
    agentsHint:
      'Es werden nur installierte Agenten aufgelistet. Die Brücke überprüft jede Minute; Einrichtung und Start müssen abgeschlossen sein, bevor ein Agent bereit ist.',
    alsoSupported: 'Auch unterstützt: {{names}}',
    thisComputer: 'Dieser Computer',
    recentFolders: 'Kürzlich verwendet',
    browseFolders: 'Diesen Computer durchsuchen…',
    manageFolders: 'Wählen Sie die erlaubten Ordner aus…',
    foldersDefault: 'Jetzt: Ihr gesamtes Home-Verzeichnis',
    foldersDefaultRoots: 'Nun: alles, was die Brücke zulässt',
    foldersChosen_one: 'Jetzt: Ordner {{count}}',
    foldersChosen_other: 'Jetzt: {{count}}-Ordner',
    changeFolders: 'Veränderung',
    chooseFolder: 'Wählen Sie den Ordner aus, in dem gearbeitet werden soll',
    project: 'Projekt, für das die Sitzung funktioniert',
    noProject: 'Kein Projekt',
  },
  session: {
    info: 'Sitzungsinformationen',
    archived:
      'Diese Sitzung ist archiviert. Stellen Sie es wieder her, um fortzufahren.',
    offline: '{{computer}} ist offline',
    offlineBody:
      'Das Gespräch und seine Aufgaben werden hier wie gewohnt zum Nachlesen aufbewahrt. Die Sitzung wird fortgesetzt, sobald der Computer wieder verfügbar ist.',
    working: 'Der Agent arbeitet…',
    startup: {
      starting: 'Starten des Agenten auf Ihrem Computer…',
      opening: 'Agentensitzung wird geöffnet…',
      configuring: 'Einstellungen übernehmen…',
    },
    answering: 'Antworten',
    asking: 'Benötigt Ihre Zustimmung',
    stop: 'Stoppen',
    more: 'Mehr',
    rename: 'Umbenennen',
    showDetails: 'Details anzeigen',
    hideDetails: 'Details ausblenden',
    details: 'Sitzungsdetails',
    removedComputer: 'Computer entfernt',
    about: 'Sitzung',
    computer: 'Computer',
    agent: 'Agent',
    mode: 'Modus',
    project: 'Projekt',
    directory: 'Verzeichnis',
    started: 'Gestartet',
    usage: 'Verwendung',
    contextLabel: 'Kontext',
    context: 'Kontext {{used}} von {{size}}-Tokens',
    cost: 'Bisherige Kosten: {{cost}}',
    tokens: {
      input: 'Eingabe',
      cached: 'Zwischengespeichert',
      output: 'Ausgabe',
    },
    record: 'Datensatz',
    recordBody:
      'Der vollständige Datensatz wird hier aufbewahrt und nur Sie können ihn sehen.',
  },
  composer: {
    unconfirmed:
      'Lieferung ist unbestätigt. Versuchen Sie die ursprüngliche Übermittlung erneut oder bearbeiten Sie sie als neue Nachricht (das Original ist möglicherweise bereits angekommen).',
    retrySubmission: 'Versuchen Sie die ursprüngliche Übermittlung erneut',
    editAsNew: 'Als neue Nachricht bearbeiten',
    sendUnconfirmed:
      'Senden wurde nicht bestätigt. Verwenden Sie „Originalübermittlung erneut versuchen“, um die Bestätigung wiederherzustellen.',
    sending: 'Senden…',
    expand: 'Eingabe erweitern',
    collapse: 'Eingabe reduzieren',
    placeholder: 'Antworten oder nach dem nächsten fragen…',
    busy: 'Der Agent antwortet. Ihre Nachricht wird gelöscht, sobald sie fertig ist.',
    waiting:
      'Beantworten Sie die obige Anfrage oder schreiben Sie eine Nachricht, die Sie anschließend senden möchten.',
    offline: 'Der Computer ist offline.',
    archived: 'Die Sitzung wird archiviert.',
    send: 'Senden',
    queue: 'Nach dieser Runde senden',
    addImage: 'Bilder hinzufügen',
    removeImage: 'Bild entfernen',
    attached: 'Geht mit der Nachricht',
    removeAttached: '{{name}} entfernen',
    commands: 'Die Befehle des Agenten',
    mentions: 'Erwähnen Sie eine Aufgabe',
    keys: {
      send: 'senden',
      queue: 'nach dieser Runde senden',
      newline: 'neue Zeile',
      interrupt: 'Stoppen Sie diesen Zug und senden Sie jetzt',
    },
  },
  choices: {
    more: 'Weitere Optionen',
  },
  panel: {
    fullScreen: 'Ganze Seite öffnen',
  },
  transcript: {
    image: {
      open: 'Bildvorschau öffnen',
      preview: 'Bildvorschau',
      zoomIn: 'Vergrößern',
      zoomOut: 'Verkleinern',
      fit: 'An Bildschirm anpassen',
    },
    thought: 'Denken',
    plan: 'Plan {{done}}/{{total}}',
    prompt: {
      withdrawing: 'Rückzug, Warten auf Computerbestätigung',
      withdrawn: 'Zurückgezogen',
      withdraw: 'Zurückziehen',
      retry: 'Erneut versuchen',
      copy: 'Kopieren',
      edit: 'Bearbeiten und erneut senden',
      editBody:
        'Bearbeiten Sie diese Nachricht in einem separaten Entwurf. Ihr aktueller Entwurf bleibt unverändert.',
      attachmentError:
        'Die Originalanhänge konnten nicht geladen werden. Versuchen Sie es vor der Bearbeitung noch einmal.',
      loading: 'Nachricht und Anhänge werden geladen…',
      unsupported:
        'Diese ältere Nachricht kann nicht sicher zurückgezogen werden. Aktualisieren Sie die Befehlszeile und starten Sie die Computerverbindung neu.',
      queued: 'In der Warteschlange, gesendet, wenn dieser Zug endet',
      cancelled: 'Abgebrochen',
      failed: 'Nicht beantwortet',
    },
    tools: {
      separator: ', ',
      read_one: '{{count}}-Datei lesen',
      read_other: '{{count}}-Dateien lesen',
      edit_one: 'bearbeitete {{count}}-Datei',
      edit_other: 'bearbeitete {{count}}-Dateien',
      delete_one: '{{count}}-Datei gelöscht',
      delete_other: '{{count}}-Dateien gelöscht',
      move_one: '{{count}}-Datei verschoben',
      move_other: '{{count}}-Dateien verschoben',
      search_one: 'einmal gesucht',
      search_other: '{{count}} mal durchsucht',
      execute_one: 'Befehl {{count}} ausgeführt',
      execute_other: 'führte {{count}}-Befehle aus',
      think_one: 'dachte einmal',
      think_other: 'dachte mal {{count}}',
      fetch_one: '{{count}}-Seite abgerufen',
      fetch_other: '{{count}}-Seiten abgerufen',
      other_one: 'Verwendetes {{count}}-Tool',
      other_other: 'Verwendete {{count}}-Tools',
    },
    kinds: {
      read: 'Lesen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      move: 'Umzug',
      search: 'Suchen',
      execute: 'Ausführung',
      think: 'Denken Sie nach',
      fetch: 'Holen',
      other: 'Werkzeug',
    },
    permission: {
      title: '{{agent}} fragt, bevor es weitergeht',
      timeout: 'Abgelehnt, wenn innerhalb von 30 Minuten niemand antwortet.',
      declined: 'Abgelehnt',
      cancelled: 'Wird nicht mehr benötigt',
      timedOut: 'Abgelehnt, nachdem 30 Minuten lang keine Antwort erfolgte',
    },
    turn: {
      cancelled: 'Angehalten',
      seconds_one: 'belegte {{count}} den zweiten Platz',
      seconds_other: 'dauerte {{count}} Sekunden',
      minutes: 'benötigte {{minutes}} min. {{seconds}} s',
      input: 'Eingang {{count}}',
      cached: 'zwischengespeichert {{count}}',
      output: 'Ausgang {{count}}',
    },
  },
  folders: {
    hint: 'Die Ordner auf {{computer}}, wie sie dort aufgelistet sind.',
    up: 'Auf',
    choose: 'Wählen Sie diesen Ordner',
    empty: 'Keine Ordner hier.',
    failed: 'Der Computer konnte diesen Ordner nicht auflisten.',
    truncated: 'Es werden nur die ersten 500 Ordner angezeigt.',
  },
  computers: {
    outdated: {
      title:
        'Aktualisieren Sie die Befehlszeile auf diesem Computer ({{host}})',
      body: 'Die Anwendung hat ihre Verbindung verweigert: Sie spricht das Bridge-Protokoll {{bridgeProtocol}} und die Anwendung benötigt {{protocol}}. Führen Sie dies auf dem Computer aus:',
      restart:
        'Eine aktuelle Befehlszeile startet ihre Hintergrundverbindung von selbst neu; Wenn die Verbindung nicht innerhalb weniger Minuten wiederhergestellt wird, führen Sie Folgendes aus:',
    },
    offline: 'Offline',
    title: 'Meine Computer',
    description:
      'Diese Computer führen nur Ihre eigenen Sitzungen aus und die Agenten arbeiten wie Sie. Maschinen, auf denen die Hintergrundarbeit des Teams ausgeführt wird, werden separat verwaltet.',
    none: 'Es ist noch kein Computer angeschlossen.',
    online: 'Online',
    lastSeen: 'Zuletzt gesehen {{time}}',
    remove: 'Entfernen',
    confirmRemove: 'Entfernen Sie es',
    problems: {
      notInstalled: 'nicht installiert',
      failed: 'konnte nicht gestartet werden',
    },
    recheckHint:
      'Während der Verbindung überprüft die Bridge die Agenten automatisch jede Minute erneut.',
    ready: 'Bereit',
    name: 'Name',
    system: 'System',
    cli: 'Befehlszeile',
    folders: 'Verzeichnisse',
    allowedFolders: 'Wo Sitzungen funktionieren',
    defaultFolders: 'Ihr Home-Verzeichnis',
    defaultRoots: 'Alles, was die Brücke zulässt',
    addFolder: 'Einen Ordner hinzufügen',
    removeFolder: 'Entfernen Sie den Ordner',
    resetFolders: 'Zurück zum gesamten Home-Verzeichnis',
    browseOffline:
      'Ordner können durchsucht werden, während der Computer online ist.',
    foldersHint:
      'Sitzungen können in jedem Ordner darunter funktionieren. Fügen Sie Ordner hinzu, um nur diese zuzulassen.',
    foldersChosenHint:
      'Sitzungen funktionieren möglicherweise nur in diesen Ordnern.',
    add: 'Schließen Sie einen Computer an',
    steps: {
      agent: 'Installieren Sie einen Codierungsagenten und melden Sie sich an',
      agentHint:
        'Codex, Claude Code, Gemini CLI, GitHub Copilot, Cursor, Qwen Code, Kimi CLI und mehr: Melden Sie sich mit einem eigenen Befehl an. Verwenden Sie das stärkste Modell, das Sie können.',
      login: 'Melden Sie sich mit Ihrem Konto an',
      start: 'Diesen Computer angeschlossen lassen',
      startHint:
        'Es läuft im Hintergrund und stellt bei jeder Anmeldung eine Verbindung her, und erneut, wenn das Netzwerk ausfällt oder der Computer in den Ruhezustand wechselt.',
      foreground:
        'Um nur eine Verbindung herzustellen, bis Sie das Terminal schließen, führen Sie stattdessen Folgendes aus:',
      foldersHint:
        'Sitzungen funktionieren möglicherweise überall in Ihrem Home-Verzeichnis. Sobald die Verbindung hergestellt ist, wählen Sie unter „Meine Computer“ andere Ordner aus.',
    },
  },
};

export default deDE;
