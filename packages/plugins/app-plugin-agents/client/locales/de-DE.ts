import runtimesEnUS from './runtimes.en-US.js';
import type { LocaleResource } from '@nocobase/i18n';
import chatEnUS from './chat.en-US.js';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  modelSuggestions: {
    design:
      'Stärkstes Schlussfolgern: Vorschläge, Architektur, schwierige Untersuchungen und Prüfung wichtiger Änderungen; auch Routineumsetzung, paketübergreifende Änderungen und Vorschläge.',
    large:
      'Größere Umsetzungen, paketübergreifende Änderungen, Refactoring und Routineumsetzung; auch Vorschläge, Codeprüfung und kleine Änderungen.',
    review:
      'Codeprüfung und Analyse von CI-Fehlern; auch Vorschläge und schwierige Untersuchungen.',
    routine:
      'Routineumsetzung, kleine Korrekturen, Tests und Formulierungen; auch Analyse von CI-Fehlern.',
    small:
      'Kleine Änderungen, mechanische Bearbeitung und Tests, günstig und schnell; auch Analyse von CI-Fehlern.',
    explanation:
      'Anforderungen verstehen, Erklärungen und Vorschläge verfassen.',
  },
  goodAtTemplates: {
    fill: 'Aus Vorlage ausfüllen',
    design: 'Entwurf und Prüfung',
    large: 'Größere Umsetzung',
    review: 'Codeprüfung und CI',
    routine: 'Routineumsetzung',
    small: 'Kleine Änderungen',
    explanation: 'Erklärung und Vorschläge',
    undo: 'Rückgängig',
  },

  actions: {
    back: 'Zurück',
    cancel: 'Abbrechen',
    close: 'Schließen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    save: 'Speichern',
  },
  common: {
    refresh: 'Aktualisieren',
    cancel: 'Abbrechen',
    copy: 'Kopieren',
    copied: 'Kopiert',
    save: 'Speichern',
    close: 'Schließen',
    create: 'Erstellen',
    createNamed: 'Erstellen Sie „{{name}}“',
    creating: 'Erstellen…',
    noOptions: 'Keine Optionen',
    forbidden: 'Das ist Ihnen nicht gestattet.',
    loading: 'Wird geladen',
    notFound: 'Es existiert nicht mehr.',
    requestFailed: 'Die Anfrage ist fehlgeschlagen. Versuchen Sie es erneut.',
    retry: 'Erneut versuchen',
    secretKept: 'Festlegen – leer lassen, um es zu behalten',
  },
  status: {
    loading: 'Wird geladen',
  },
  unsavedChanges: {
    description: 'Ihre Eingaben wurden nicht übermittelt und gehen verloren.',
    discard: 'Verwerfen',
    keepEditing: 'Bearbeiten Sie weiter',
    title: 'Nicht gespeicherte Änderungen verwerfen?',
  },
  errors: {
    TOOLS_REFRESH_UNSUPPORTED:
      'Dieser Runner unterstützt keine Statusaktualisierung. Starte ihn neu.',
    RUNNER_REFRESH_UNAVAILABLE:
      'Der Status eines widerrufenen Runners kann nicht aktualisiert werden.',
    boundRunnerIncompatible:
      'Dieser Runner kann den ausgewählten Agent nicht ausführen. Wechseln Sie den Runner oder starten Sie eine neue Unterhaltung.',
    CONFLICT:
      'Das hat sich inzwischen geändert. Laden Sie es neu und versuchen Sie es erneut.',
    REVISION_CONFLICT:
      'Das hat sich inzwischen geändert. Laden Sie es neu und versuchen Sie es erneut.',
    FORBIDDEN: 'Das ist Ihnen nicht gestattet.',
    AGENT_NOT_FOUND: 'Es existiert nicht mehr.',
    RUN_NOT_FOUND: 'Es existiert nicht mehr.',
    SKILL_NOT_FOUND: 'Es existiert nicht mehr.',
    SKILL_VERSION_NOT_FOUND: 'Es existiert nicht mehr.',
    CONVERSATION_NOT_FOUND: 'Es existiert nicht mehr.',
    RUNNER_NOT_FOUND: 'Es existiert nicht mehr.',
    VARIABLE_NOT_FOUND: 'Es existiert nicht mehr.',
    MODEL_SERVICE_NOT_FOUND: 'Es existiert nicht mehr.',
    SCOPE_NOT_FOUND: 'Es existiert nicht mehr.',
    INVALID_INPUT: 'Einige Werte sind ungültig.',
    SECRETS_KEY_MISSING:
      'Variablen können nicht gespeichert oder angezeigt werden: Der Server verfügt über keinen geheimen Schlüssel. Bitten Sie einen Administrator, „secrets.keys“ in der Anwendungskonfiguration festzulegen.',
  },
  command: {
    copy: 'Kopierbefehl',
    copied: 'Kopiert',
    copyFailed:
      'Kopieren nicht möglich. Wählen Sie den Befehl aus und kopieren Sie ihn selbst.',
  },
  tools: {
    claude: 'Claude Code',
    codex: 'Codex',
    opencode: 'OpenCode',
    pi: 'Pi',
    gemini: 'Gemini CLI',
    copilot: 'GitHub Copilot',
    cursor: 'Cursor',
    qwen: 'Qwen Code',
    kimi: 'Kimi CLI',
    codebuddy: 'CodeBuddy Code',
    qoder: 'Qoder CLI',
    goose: 'Goose',
    auggie: 'Auggie',
    droid: 'Factory Droid',
    kilo: 'Kilo Code',
    cline: 'Cline',
    amp: 'Amp',
    vibe: 'Mistral Vibe',
  },
  agents: {
    unavailableNow: 'Derzeit nicht verfügbar',
    title: 'Agenten',
    description:
      'Fügen Sie Agenten aus den von Runnern gemeldeten Modellen hinzu. Der Lead Agent weist jeden Schritt einer Aufgabe dem Agenten zu, dessen Beschreibung dazu passt.',
    fromRunners: 'Agenten von Runnern',
    display: {
      search: 'Suchmodelle oder Anbieter',
      select: 'Wählen Sie {{name}}',
      showDisabled: 'Deaktivierte anzeigen',
      hideDisabled: 'Deaktivierte ausblenden',
    },
    filterLabel: 'Agenten anzeigen',
    filters: {
      all: 'Alle {{count}}',
      enabled: 'Aktiviert {{count}}',
      unreported: 'Kein Runner {{count}}',
    },
    loadFailed: 'Die Agenten konnten nicht geladen werden',
    loadMore: 'Mehr laden',
    emptyTitle: 'Noch keine Agenten',
    emptyDescription:
      'Verbinden Sie einen Runner mit einem angemeldeten Codierungstool und fügen Sie dann unter „Verfügbare Modelle“ einen Agenten hinzu.',
    noneInFilter: 'Kein Agent hier.',
    howToAdd:
      'Um einen Agenten hinzuzufügen, installieren Sie ein Codierungstool auf einem Runner und melden Sie sich für ein nutzbares Modell an. Sobald der Runner es meldet, fügen Sie unter „Verfügbare Modelle“ einen Agenten hinzu und beschreiben Sie seine Stärken. Er wird beim Hinzufügen sofort aktiviert. Ein Agent, der nur auf persönlichen Runnern verfügbar ist, kann nur Aufgaben bearbeiten, die deren Besitzer starten.',
    goodAtMissing: 'Noch nicht geschrieben',
    columns: {
      agent: 'Agent',
      goodAt: 'Gut darin',
      where: 'Wo es läuft',
      effort: 'Argumentationsaufwand',
      state: 'Status',
    },
    where: {
      none: 'Kein Runner',
      team_one: '{{count}} Teamläufer',
      team_other: '{{count}} Teamläufer',
      personal_one: '{{count}} persönlicher Runner online',
      personal_other: '{{count}} persönliche Runner online',
      both: '{{team}}-Team · {{personal}} persönlich',
      names: '{{names}}',
      noneOnline: 'Derzeit ist kein Runner online',
      personalOnly: 'Nur für Privatläufer',
      lastReported: 'Zuletzt gemeldet {{when}}',
    },
    state: {
      enabled: 'Aktiviert',
      disabled: 'Deaktiviert',
      unreported: 'Kein Runner',
    },
    effort: {
      default: 'Standardeinstellung des Tools',
      off: 'Aus',
      minimal: 'Minimal',
      low: 'Niedrig',
      medium: 'Mittel',
      high: 'Hoch',
      xhigh: 'Extra hoch',
      max: 'Max',
      ultra: 'Ultra',
    },
    enable: {
      reportedBy_one: 'Von {{count}}-Runner online gemeldet: {{names}}.',
      reportedBy_other: 'Von {{count}}-Runnern online gemeldet: {{names}}.',
      noRunnerNow: 'Kein Runner, der es hat, ist jetzt online.',
      goodAtHint:
        'Mit diesen Worten entscheidet der Lead Agent, was er diesem Agenten geben soll. Sagen Sie, was Ihnen passt und was nicht.',
      goodAtRequired:
        'Schreiben Sie, was es gut kann, bevor Sie es aktivieren.',
      effortHint:
        'Der Lead Agent kann es bei der Übergabe der Arbeit nicht ändern.',
      personalOnly:
        'Nur persönliche Runner haben es: Der Lead Agent übergibt die Arbeit nur an Vorgänge, die ihre Besitzer starten.',
    },
    edit: {
      button: 'Bearbeiten',
      buttonFor: '{{name}} bearbeiten',
      title: '{{name}} bearbeiten',
      enabled: 'Aktiviert',
      done: '{{name}} gespeichert',
    },
    available: {
      open: 'Agent hinzufügen',
      title: 'Verfügbare Modelle',
      description:
        'Nur die auf der Laufzeit ausgewählten Tools werden jemals erkannt und hier aufgeführt. Die von der Anwendung empfohlenen Kombinationen erstellen und aktivieren sich selbst, sobald ein Runner sie meldet; fügen Sie aus jeder anderen einen Agenten hinzu.',
      recommended: 'Wird beim Melden automatisch aktiviert',
      added: 'Hinzugefügt',
      add: 'Hinzufügen',
      status: {
        available: 'Verfügbar',
        needsSetup: 'Einrichtung erforderlich',
        versionTooOld: 'Version zu alt',
        failed: 'Erkennung fehlgeschlagen',
      },
      details: 'Tool-Details',
      setupCommand: 'Führen Sie {{command}} auf der Laufzeit aus.',
      setupUnknown:
        'Dieses Tool muss eingerichtet werden, aber wir kennen den Befehl dafür nicht.',
      upgradeAdvice:
        'Aktualisieren Sie das Tool und seinen ACP-Adapter auf der Laufzeit auf die neuesten Versionen und starten Sie die Erkennung erneut.',
      minimumVersionUnknown:
        'Die unterstützte Mindestversion des Tools ist unbekannt. Lesen Sie die Kompatibilitätsdokumentation.',
      noDetail: 'Das Tool hat keine weiteren Details angegeben.',
      showMore: 'Mehr anzeigen',
      showLess: 'Weniger anzeigen',
      groupSearchPlaceholder: 'Modelle dieses Tools durchsuchen',
      group_one: '{{tool}} · {{count}} Modell · {{runners}}',
      group_other: '{{tool}} · {{count}} Modelle · {{runners}}',
      runners_one: '{{count}} Runtime',
      runners_other: '{{count}} Runtimes',
      noModels: 'Kein Modell hier.',
      selectedCount_one: '{{count}} ausgewählt',
      selectedCount_other: '{{count}} ausgewählt',
      addSelected: '{{count}} hinzufügen',
      confirmTitle_one: '{{count}} Agent hinzufügen',
      confirmTitle_other: '{{count}} Agenten hinzufügen',
      confirmAction_one: '{{count}} hinzufügen',
      confirmAction_other: '{{count}} hinzufügen',
      goodAtNeeded: 'Worin ist er gut?',
      addedCount_one: '{{count}} Agent hinzugefügt.',
      addedCount_other: '{{count}} Agenten hinzugefügt.',
      addedPartial:
        '{{succeeded}} hinzugefügt, {{failed}} konnten nicht hinzugefügt werden. Grund jeweils darunter.',
      addFailed:
        '{{failed}} konnten nicht hinzugefügt werden. Grund jeweils darunter; bitte erneut versuchen.',
    },
  },
  agentTypes: {
    label: 'Agententyp',
    question: 'Was für ein Agent?',
    online: 'Online',
    runner: 'Runner',
    onlineHint:
      'Antworten in Sekundenschnelle auf dem Server durch einen Modelldienst. Keine Laufzeit erforderlich; Es kann keinen Code berühren.',
    runnerHint:
      'Treibt ein Codierungstool zur Laufzeit an und arbeitet in einem Arbeitsverzeichnis: Code, Dateien, Befehle.',
    immutable:
      'Ein Agent behält seinen Typ; Erstellen Sie einen anderen Agenten für die andere Art.',
    onServer: 'Auf dem Server',
    filterAll: 'Alle Typen',
    noneOfType: 'Kein Agent dieser Art.',
  },
  agentSkills: {
    title: 'Skills',
    description:
      'Handbücher, die der Agent liest, wenn eine Aufgabe mit ihrer Beschreibung übereinstimmt. Wird vor jedem Lauf in seinem Arbeitsverzeichnis abgelegt.',
    manage: 'Fähigkeiten verwalten',
    placeholder: 'Fertigkeiten auswählen',
    empty: 'Noch keine Fähigkeiten.',
    save: 'Fähigkeiten speichern',
    descriptionOnline:
      'Handbücher, die der Agent liest, wenn eine Aufgabe mit ihrer Beschreibung übereinstimmt, in einer schreibgeschützten Sandbox auf dem Server.',
    onlineScripts:
      'Skripte werden für Online-Agenten nicht ausgeführt: Der Agent kann sie lesen, nicht ausführen.',
    skippedScripts: ': {{paths}}',
    pathSeparator: ', ',
  },
  brief: {
    preview: 'Vorschau der vollständigen Eingabeaufforderung',
    previewTitle: 'Vorschau der vollständigen Eingabeaufforderung',
    previewDescription:
      'Was für ein Lauf dieses Agenten würde jetzt zu einem erfundenen Thema geschickt werden. Es steht nichts in der Warteschlange.',
    scenario: 'Szenario',
    sample:
      'Zu einem erfundenen Thema: {{subject}}. Mit [Beispiel] gekennzeichnete Werte sind erfunden.',
    previewFailed:
      'Die vollständige Eingabeaufforderung konnte nicht gerendert werden.',
    system: 'Systemaufforderung',
    showAs: 'Anzeigen als',
    rendered: 'Gerendert',
    raw: 'Roh',
    platform:
      'Plattformregeln und -aufgaben · über {{size}}-Zeichen (Englisch)',
    platformNote:
      'Plattformregeln werden auf Englisch gesendet; Der Agent antwortet weiterhin in Ihrer Sprache.',
    agentPrompt: 'Agentenaufforderung (von Ihnen geschrieben)',
    noAgentPrompt:
      'Dieser Agent verfügt über keine eigene Eingabeaufforderung.',
    firstMessage: 'Erste Nachricht',
    empty: 'Leer',
    previewPlaceholders:
      'Die Anmerkungen in Klammern zur Laufzeit werden von der Laufzeit ausgefüllt, die sie ausführt: ihre Arbeitsverzeichnisse und die Initialisierungsaufforderungen der gerade vorbereiteten Verzeichnisse.',
    placeholders:
      'Die {{runner.…}}-Platzhalter werden von der Laufzeitumgebung ausgefüllt, die sie ausführt: ihre Arbeitsverzeichnisse und die Initialisierungsaufforderungen der gerade vorbereiteten Verzeichnisse.',
    layers: {
      system: 'Regeln',
      task: 'Aufgabe',
      context: 'Kontext',
      agent: 'Agent-Eingabeaufforderung',
      turn: 'Erste Runde',
    },
  },
  envVars: {
    title: 'Umgebungsvariablen',
    description:
      'Wird bei jedem Lauf an das Codierungstool übergeben und in Laufaufzeichnungen maskiert; Werte werden nach dem Speichern nicht mehr angezeigt. Jeder, der einen Shared Agent nutzt, kann diese Werte auf seinem eigenen Computer erhalten; Markieren Sie Geheimnisse mit hohem Risiko als „Nur Team-Laufzeiten“.',
    add: 'Variable hinzufügen',
    addTitle: 'Umgebungsvariable hinzufügen',
    editTitle: '{{name}} ersetzen',
    writeOnly:
      'Der Wert wird verschlüsselt gespeichert und ersetzt den vorherigen Wert.',
    name: 'Name',
    nameHint: 'Großbuchstaben, Ziffern und Unterstriche.',
    value: 'Wert',
    valueTooLong: 'Der Wert ist größer als 8 KB.',
    keepValueHint: 'Lassen Sie es leer, um den aktuellen Wert beizubehalten.',
    teamRunnersOnly: 'Nur Teamlaufzeiten',
    teamRunnersOnlyHint:
      'Ohne sie sendet ein Lauf den Wert an die Laufzeit, die ihn annimmt, einschließlich der persönlichen Laufzeit aller Personen, die den Agenten verwenden. Damit benötigt nur eine Teamlaufzeit Läufe, die diese Variable erhalten.',
    teamRunnersOnlyBadge: 'Nur Teamlaufzeiten',
    fromRunner: 'Aus der Laufzeit übernehmen',
    fromRunnerHint:
      'Hier wird kein Wert gespeichert: Die Laufzeit, die einen Lauf durchführt, stellt ihn von ihrer eigenen Maschine bereit, wird dort mit {{command}} gesetzt oder mit `--pass-env` übergeben. Eine Laufzeit, die dies nicht bereitstellt, schlägt die Ausführung fehl, bevor sie gestartet wird.',
    fromRunnerBadge: 'Aus der Laufzeit',
    valueRequired:
      'Geben Sie einen Wert ein oder übernehmen Sie ihn weiterhin aus der Laufzeit.',
    empty: 'Keine Umgebungsvariablen.',
    scope: 'Geltungsbereich',
    updated: 'Aktualisiert',
    actionsHead: 'Aktionen',
    edit: 'Wert ersetzen',
    actions: 'Aktionen für {{name}}',
    accessLog: 'Zugriffsprotokoll',
    accessLogAll: 'Sehen Sie sich das vollständige Zugriffsprotokoll an',
    accessLogOf: 'Zugriffsprotokoll von {{name}}',
    accessLogDescription:
      'Wer hat die Variablen wann angesehen, gesetzt oder gelöscht und welche Läufe haben sie erhalten?',
    delete: 'Löschen',
    deleteTitle: '{{name}} löschen?',
    deleteDescription: 'Läufe danach empfangen die Variable nicht mehr.',
    deleteConfirm: 'Löschen',
    deleted: '{{name}} gelöscht.',
    saved: '{{name}} gespeichert.',
    updatedBy: '{{name}} · {{time}}',
    reveal: 'Werte offenbaren',
    revealTitle: 'Werte verraten?',
    revealAudit:
      'Die Offenlegung wird im Zugriffsprotokoll mit Ihrem Namen und der Uhrzeit protokolliert.',
    revealedTitle: 'Variablenwerte',
    revealedNote:
      'Diese Offenbarung wurde aufgezeichnet. Schließen Sie es, wenn Sie fertig sind.',
    runner: 'Laufzeit {{id}}',
    auditsEmpty: 'Noch nichts aufgezeichnet.',
    auditAction: {
      reveal: 'enthüllt',
      set: 'eingestellt',
      delete: 'gelöscht',
      deliver: 'für einen Lauf erhalten',
    },
    nameProblems: {
      required: 'Geben Sie einen Namen ein.',
      pattern:
        'Verwenden Sie nur Großbuchstaben, Ziffern und Unterstriche und beginnen Sie nicht mit einer Ziffer.',
      reserved: 'Dieser Name ist reserviert.',
      duplicate:
        'Eine Variable mit diesem Namen existiert; Bearbeiten Sie es stattdessen.',
    },
  },
  scopeVariables: {
    title: 'Variablen und Geheimnisse',
    description:
      'Wird jedem hier tätigen Agenten gegeben. Spezifischere Variablen (die eines Arbeitsverzeichnisses, dann die des Agenten) überzeugen diese.',
  },
  scopes: {
    workdir: 'Arbeitsverzeichnis',
  },
  subjects: {
    conversation: 'Gespräch',
    consultation: 'Konsultation',
  },
  usage: {
    otherUse: {
      title: 'Andere Modellverwendung',
      description:
        'Modellaufrufe außerhalb von Agentenläufen, z. B. Indizierung und Durchsuchen der Wissensdatenbank.',
      purpose: 'Verwendung',
      source: 'Gefragt von',
      model: 'Modell',
      calls: 'Anrufe',
      units: 'Artikel',
      purposes: {
        embedding: 'Einbettungen',
        rerank: 'Neue Rangfolge',
        text: 'Utility-Text',
      },
    },
    title: 'Verwendung',
    description:
      'Welche Agenten laufen gebraucht und was kosten sie bei den aktuellen Modellpreisen?',
    loadFailed: 'Die Nutzung konnte nicht geladen werden',
    groupBy: 'Gruppieren nach',
    groupByValue: 'Gruppierung nach {{group}}',
    empty: 'Keine Läufe in diesem Zeitraum.',
    total: 'Insgesamt',
    noGroup: 'Keine',
    unknown: 'Unbekannt',
    onlineTool: 'Online (Modelldienste)',
    setPrices: 'Preise festlegen',
    chart: {
      title: 'Tagestrend',
      metric: 'Anzeigen',
      cost: 'Kosten',
      tokens: 'Token',
      total: 'Insgesamt',
      other: 'Sonstiges',
    },
    pricedNote:
      'Die Kosten decken {{priced}} der {{total}}-Läufe; Für diese Modelle gibt es noch keinen Preis: {{models}}.',
    filters: {
      allGroups: 'Alle: {{group}}',
      agent: 'Agent',
      allAgents: 'Alle Agenten',
      person: 'Geweckt von',
      allPeople: 'Alle',
      range: 'Datumsbereich',
      presets: 'Schnelle Reichweiten',
    },
    presets: {
      last7: 'Letzte 7 Tage',
      last30: 'Letzte 30 Tage',
      thisMonth: 'Diesen Monat',
      lastMonth: 'Letzten Monat',
      last90: 'Letzte 90 Tage',
    },
    groups: {
      agent: 'Agent',
      person: 'Geweckt von',
      group: 'Gruppe',
      subject: 'Betreff',
      day: 'Tag',
      model: 'Modell',
      tool: 'Codierungstool',
      type: 'Agententyp',
    },
    columns: {
      runs: 'Ausführungen',
      duration: 'Dauer',
      input: 'Eingabe',
      output: 'Ausgabe',
      cacheRead: 'Cache gelesen',
      cacheWrite: 'Cache-Schreiben',
      cost: 'Geschätzte Kosten',
    },
  },
  defaultSkills: {
    title: 'Standardfähigkeiten',
    description:
      'Jeder hier tätige Agent verfügt ebenfalls über diese Fähigkeiten.',
    save: 'Fähigkeiten speichern',
    saved: 'Standardfähigkeiten gespeichert.',
  },
  runs: {
    title: 'Ausführungsprotokoll',
    empty: 'Noch keine Läufe.',
    loadFailed: 'Das Ausführungsprotokoll konnte nicht geladen werden',
    unknownAgent: 'Agent',
    attempt: 'Versuch {{attempt}} von {{max}}',
    viewTranscript: 'Transkript anzeigen',
    transcriptTitle: 'Protokoll der Ausführung',
    viewAll: 'Alle anzeigen {{count}}',
    allTitle: 'Alle Läufe ({{count}})',
    filters: {
      agent: 'Agent',
      status: 'Status',
      allAgents: 'Alle Agenten',
      allStatuses: 'Alle Status',
    },
    noMatch: 'Keine Läufe entsprechen diesen Filtern.',
    cancel: 'Stoppen',
    stopping: 'Anhalten…',
    cancelTitle: 'Diesen Lauf stoppen?',
    cancelDescription:
      '{{name}} wird gestoppt. Was es bereits verändert hat, bleibt bestehen.',
    cancelRequested: 'Stopp angefordert',
    retry: 'Erneut versuchen',
    retried: 'Ausführung erneut in der Warteschlange',
    viewBrief: 'Vollständige Eingabeaufforderung anzeigen',
    briefTitle: 'Vollständige Eingabeaufforderung',
    briefDescription:
      'Was dem Agenten mitgeteilt wurde, als dieser Lauf zuletzt beansprucht wurde.',
    briefOf: 'Versuch {{attempt}}, beanspruchte {{time}}',
    briefUnavailable:
      'Für diesen Lauf ist keine vollständige Eingabeaufforderung verfügbar.',
    processDataCleared:
      'Laufprozessdaten wurden gemäß der Aufbewahrungsrichtlinie gelöscht.',
    briefFailed:
      'Die vollständige Eingabeaufforderung konnte nicht geladen werden',
    workspaceReset: {
      button: 'Arbeitsverzeichnis bereinigen',
      title: 'Arbeitsverzeichnis bereinigen?',
      description:
        'Der nächste Lauf beginnt mit einem neuen Checkout und erhält erneut die Initialisierungsaufforderungen. Änderungen, die nicht gepusht wurden, gehen in dieser Laufzeit verloren. Ein vor Ort verwendetes Verzeichnis wird niemals gelöscht.',
      confirm: 'Sauber',
      done: 'Der nächste Lauf beginnt mit einer neuen Kasse.',
    },
    stateChanged:
      'Der Lauf hat seinen Status geändert. Das Protokoll wurde aktualisiert.',
    status: {
      queued: 'In der Warteschlange',
      dispatched: 'Abgeschickt',
      running: 'Wird ausgeführt',
      completed: 'Runde beendet',
      failed: 'Fehlgeschlagen',
      cancelled: 'Abgebrochen',
      cancelling: 'Anhalten',
    },
    trigger: {
      retry: 'Erneut versuchen',
      message: 'Nachricht',
      consultation: 'Konsultation',
    },
    activity: {
      queued: '{{name}} wurde in die Warteschlange gestellt',
      dispatched: '{{name}} startet',
      running: '{{name}} hat begonnen zu arbeiten',
      completed: '{{name}} beendete seinen Zug',
      failed: '{{name}} ist fehlgeschlagen',
      cancelled: '{{name}} wurde gestoppt',
    },
    live: {
      working: '{{name}} funktioniert',
      workingFor: '{{name}} funktioniert · {{minutes}} min',
      queued: '{{name}} steht in der Warteschlange',
    },
  },
  transcript: {
    title: 'Protokoll der Ausführung',
    notFound: 'Dieser Lauf existiert nicht.',
    waiting: 'Warten auf den Start des Agenten…',
    empty: 'Bei diesem Lauf wurden keine Ereignisse aufgezeichnet.',
    fetchFailed:
      'Neue Ereignisse können nicht abgerufen werden. Erneuter Versuch…',
    expand: 'Alle anzeigen',
    truncated:
      'Kurzfassung: Der vollständige Text war zu lang, um ihn aufzubewahren.',
    summary_one: 'Erstelltes {{created}} · {{count}}-Ereignis',
    summary_other: 'Erstellte {{created}} · {{count}}-Ereignisse',
    took: 'nahm {{duration}}',
    pendingInputs_one: '{{count}} Kommentar wartet auf den Agenten',
    pendingInputs_other: '{{count}} Kommentare warten auf den Agenten',
    inputDelivered_one: 'An den Agenten geliefert',
    inputDelivered_other:
      '{{count}}-Eingaben werden an den Agenten übermittelt',
    tokens: '{{input}}-Tokens rein, {{output}} raus',
    kinds: {
      text: 'Agent',
      thinking: 'Denken',
      toolUse: 'Werkzeug',
      toolResult: 'Ergebnis',
      allowed: 'Erlaubt',
      denied: 'Abgelehnt',
      input: 'Eingabe',
      checkout: 'Zur Kasse',
      status: 'Status',
      error: 'Fehler',
      usage: 'Verwendung',
    },
  },
  failures: {
    runnerUpgrade:
      'Unterbrochen wegen einer Aktualisierung der Ausführungsmaschine; Der Lauf wird fortgesetzt.',
    runnerDiskFull:
      'Auf dem Ausführungscomputer war nicht mehr genügend Speicherplatz vorhanden.',
    runnerOfflineBeforeStart:
      'Die Laufzeit ging offline, bevor der Lauf gestartet wurde.',
    runnerOffline: 'Die Laufzeit ging offline.',
    leaseExpired: 'Die Laufzeit hat die Meldung gestoppt.',
    startTimeout: 'Die Laufzeit startete den Lauf nicht rechtzeitig.',
    cancelled: 'Abgesagt.',
    idleTimeout: 'Der Agent macht keine Fortschritte mehr.',
    setupFailed: 'Der Lauf konnte nicht vorbereitet werden.',
    cliUnavailable:
      'Die Laufzeit konnte die Anwendungs-CLI nicht installieren.',
    workspaceBusy:
      'Das Arbeitsverzeichnis ist ausgelastet; warte auf einen weiteren Versuch.',
    checkoutFailed: 'Das Auschecken des Repositorys ist fehlgeschlagen.',
    toolAuth: 'Das Codierungstool ist bei der Laufzeit nicht angemeldet.',
    toolQuota: 'Das Kontingent des Codierungstools ist erschöpft.',
    toolRateLimit: 'Das Codierungstool war geschwindigkeitsbegrenzt.',
    toolNetwork: 'Das Codierungstool konnte seinen Dienst nicht erreichen.',
    toolProcess: 'Das Codierungstool wurde unerwartet beendet.',
    contextOverflow: 'Das Gespräch wurde für das Model zu lang.',
    delegatedQueueTimeout:
      'Zeitüberschreitung in der Delegationswarteschlange; zurückgezogen',
    queuedExpired: 'Keine Laufzeit hat den Lauf rechtzeitig geschafft.',
    modelUnavailable: 'Das Modell des Agenten ist nicht verfügbar.',
    stepLimit: 'Der Agent rief Tools zu oft an, ohne zu antworten.',
    policyRefused: 'Keine Laufzeitrichtlinie lässt diese Arbeit zu.',
    prepareNetwork:
      'Die Laufzeit konnte den Repository-Host während der Vorbereitung der Ausführung nicht erreichen.',
    repoAccessUnavailable:
      'Der Berechtigungsnachweis für ein Repository konnte derzeit nicht ausgestellt werden; Der Lauf wird erneut versucht.',
    repoAccessDenied:
      'Die Anwendung stellt keine Anmeldeinformationen für eines der Repositorys des Laufs aus.',
    unknown: 'Der Lauf ist fehlgeschlagen.',
  },
  runtimes: {
    refresh: {
      button: 'Status aktualisieren',
      checking: 'Wird geprüft…',
      restart: 'Starte den Runner neu, um seinen Status zu aktualisieren.',
    },
    pathHint: runtimesEnUS.runtimes.pathHint,
    quota: {
      workspaceStatus: {
        active: 'Die Arbeiten gehen weiter',
        ended: 'Beendet · Bereinigung erlaubt',
        checks: 'Beendet · Schecks ausstehend',
        inUse: 'Behalten: in Verwendung',
        changed: 'Behalten: wiederverwendet',
        trackedChanges: 'Behalten: nicht festgeschriebene Dateien',
        unpushed: 'Behalten: ungepushte Arbeit',
        missingEvidence: 'Behalten: Überprüfung erforderlich',
        gitFailed: 'Behalten: Git-Prüfung fehlgeschlagen',
        runNotFound: 'Behalten: Lauf nicht gefunden',
        ownershipUnknown: 'Behalten: Eigentümer nicht bestätigt',
        ambiguousSubject: 'Behalten: mehrdeutige Aufgabe',
        bindingUnavailable: 'Behalten: Bindung nicht verfügbar',
        subjectUnknown: 'Behalten: Aufgabe unbekannt',
        unknown: 'Behalten: nicht bestätigt',
      },
      usageLimit: 'Nutzungsbeschränkung',
      shortReset: 'setzt {{time}} zurück',
      shortUnknown: 'Zurücksetzen unbekannt',
      automatic: 'Löscht sich beim Zurücksetzen von selbst.',
      since: 'seit {{time}}',
      marks_one: '{{count}} Quotenzeichen',
      marks_other: '{{count}} Quotenzeichen',
      queueHint:
        'Ein Agent mit Kontingent kann weiterhin ausgewählt werden. Die Arbeit wird mit der bestehenden Wartefrist in die Warteschlange gestellt.',
      partial: 'Läuft auf {{available}} · {{blocked}} mit Kontingent',
      workspaceSize: 'Arbeitsbereichsgröße: {{value}}',
      providers_one: '{{count}}-Anbieter mit Kontingent',
      providers_other: '{{count}}-Anbieter mit Kontingent',
      runColumns: {
        issue: 'Problem / Gespräch',
        agent: 'Agent',
        status: 'Status',
        started: 'Gestartet',
        duration: 'Dauer',
      },
      filter: {
        all: 'Alle',
        active: 'Aktiv',
        retained: 'Behalten',
        ended: 'Beendet',
      },
      columns: {
        directory: 'Verzeichnis / Aufgabe',
        type: 'Typ',
        size: 'Größe',
        push: 'Push-Status',
        status: 'Status',
        lastUsed: 'Zuletzt verwendet',
      },
      previous: 'Zurück',
      next: 'Weiter',
      working: 'Arbeiten',
      readOnly: 'Schreibgeschützte Kopie',
      clean: 'Sauber',
      unpushed: 'Ungepusht',
      overview: 'Übersicht',
      workspaces: 'Arbeitsbereiche',
      runs: 'Ausführungen',
      title: 'Kontingent',
      reached: 'Kontingent erreicht',
      unknown: 'Reset-Zeit unbekannt',
      resets: 'Setzt {{time}} zurück',
      near: 'Nahe an der Grenze',
      clear: 'Leeren',
      clearMark: 'Klare Markierung',
      confirm: 'Diese Markierung löschen? {{target}} bekommt wieder Arbeit.',
      observed: 'Zuletzt gemeldet {{time}}',
      usedPercent: '{{percent}}% verwendet',
      ok: 'OK',
      hint: 'Bekannte Reset-Zeiten stellen die Berechtigung automatisch wieder her. Stellen Sie bei unbekannten Zurücksetzungen das Kontingent wieder her und löschen Sie die Markierung. Nur der Laufzeitbesitzer und Administratoren können Markierungen löschen.',
    },
    workspaces: {
      paused:
        'Neue Arbeiten werden angehalten, bis der Speicherplatz wiederhergestellt ist. Bestehende Läufe werden fortgesetzt.',
      working: 'Typ: Arbeitsverzeichnis',
      readOnly: 'Typ: Schreibgeschützte Kopie',
      size: 'Größe: {{value}}',
      pushed: 'Push-Status: Sauber, keine ungepushte Arbeit',
      unpushed:
        'Push-Status: Nicht festgeschriebene, nicht gepushte oder nicht überprüfte Arbeit',
      notApplicable: 'Push-Status: Nicht anwendbar',
      title: 'Arbeitsbereichsdiagnose',
      low: 'Wenig Speicherplatz',
      previousLow: 'Letzter Bericht: Wenig Speicherplatz',
      notReported: 'Noch kein Arbeitsbereichsbericht erhalten',
      diskUnknown: 'Der Speicherplatz konnte nicht gemessen werden',
      thresholdOff:
        'Keine Warnung für minimalen freien Speicherplatz konfiguriert',
      free: 'Freier Speicherplatz: {{value}}',
      threshold: 'Mindestfreier Speicherplatz: {{value}}',
      reportedAt: 'Zuletzt gemeldet: {{time}}',
      stale:
        'Dies sind frühere Lesungen; Der aktuelle Speicherplatz wird nicht bestätigt.',
      empty: 'Keine Arbeitsverzeichnisse im neuesten Bericht',
      ended: 'Beendet',
      active: 'Die Arbeiten gehen weiter',
      unknown: 'Es kann nicht bestätigt werden, ob die Arbeit beendet wurde',
      oldRunner: 'Dieser Runner hat keine Diagnosegründe angegeben',
      noCleanup: 'Lokales Bereinigungsergebnis wurde nicht empfangen',
      discardsUntracked:
        'Bei der Bereinigung werden nicht verfolgte Dateien verworfen',
      decision: {
        settled:
          'Arbeit beendet; Lokale Bereinigungsprüfungen sind erforderlich',
        active: 'Die Arbeiten gehen weiter',
        runNotFound: 'Kann nicht bestätigt werden: Ausführung nicht gefunden',
        ownershipUnknown:
          'Kann nicht bestätigt werden: Der Besitz des Runners konnte nicht überprüft werden',
        ambiguousSubject:
          'Kann nicht bestätigt werden: Betreffschlüssel ist nicht eindeutig',
        bindingUnavailable:
          'Kann nicht bestätigt werden: Die Anwendung verfügt über keine Arbeitsbereichsbindung',
        subjectUnknown:
          'Kann nicht bestätigt werden: Die Anwendung konnte das Problem nicht lösen',
      },
      cleanup: {
        allowed: 'Beendet; Aufräumen erlaubt',
        inUse: 'Behalten: Verzeichnis wird verwendet',
        changed: 'Behalten: Verzeichnis wurde wiederverwendet',
        trackedChanges:
          'Behalten: Verfolgte Dateien weisen nicht festgeschriebene Änderungen auf',
        unpushed:
          'Behalten: ungepushte Commits oder unzureichende lokale Commit-Objekte',
        missingEvidence: 'Behalten: unzureichende Commit-Beweise',
        gitFailed: 'Behalten: Git-Prüfung fehlgeschlagen',
      },
    },
    title: 'Laufzeitumgebungen',
    description:
      'Die Laufzeiten, die Agenten ausführen, und die jeweils gemeldeten Codierungstools.',
    add: 'Laufzeit hinzufügen',
    loadFailed: 'Die Laufzeiten konnten nicht geladen werden',
    emptyTitle: 'Noch keine Laufzeiten verbunden',
    emptyDescription:
      'Sobald eine Laufzeitumgebung verbunden ist, übernehmen Runner-Agents dort mit ihren Codierungstools die Arbeit.',
    noneConnected: 'Es ist keine Laufzeit angeschlossen.',
    revokedList_one: '{{count}} hat die Laufzeit widerrufen',
    revokedList_other: '{{count}} hat Laufzeiten widerrufen',
    lastSeen: 'Zuletzt gesehen {{time}}',
    activity: {
      online: 'Online {{active}}/{{slots}}',
      busy: 'Besetzt {{active}}/{{slots}}',
      low_disk: 'Wenig Speicherplatz {{active}}/{{slots}}',
      offline: 'Offline · {{time}}',
      offlineNever: 'Offline',
    },
    toolUsage: {
      label: 'Wird vom Codierungstool ausgeführt',
      item: '{{tool}} {{used}}/{{limit}}',
    },
    toolSlots: {
      label: 'Beschränkungen pro Codierungstool',
      hint: 'Wie viele Ausführungen jedes Codierungstools gleichzeitig erforderlich sind, z. B. weniger für ein Tool, dessen Abonnement weniger Sitzungen zulässt. Lassen Sie eines leer, um es nur an die gleichzeitigen Ausführungen zu binden.',
      none: 'Keine Begrenzung',
      invalid:
        'Geben Sie ganze Zahlen von 1 bis 64 ein oder lassen Sie sie leer.',
      inputLabel: 'Läuft {{tool}} auf einmal',
      overTotal:
        'Der Grenzwert von {{tools}} liegt über der maximalen Anzahl gleichzeitiger Ausführungen ({{slots}}): Höchstens werden {{slots}} gleichzeitig ausgeführt.',
      noneChecked:
        'Überprüfen Sie oben ein Codierungstool, um es einzuschränken.',
    },
    toolTable: {
      tool: 'Werkzeug',
      enabled: 'An',
      state: 'Status',
      limit: 'Sofort',
      active: 'Wird ausgeführt',
    },
    policy: {
      title: 'Lokale Politik',
      description:
        'Was der Besitzer der Laufzeit zulässt, wie berichtet. Es wird an der Maschine geändert, nicht hier.',
      none: 'Keine lokalen Richtlinien: Es werden alle Arbeiten angenommen, für die es registriert ist.',
      any: 'Irgendwelche',
      nothing: 'Keine',
      agents: 'Agenten',
      subjects: 'Themen',
      repos: 'Repositorys',
    },
    variables: {
      title: 'Variablen von dieser Maschine',
      description:
        'Die Variablen, die es für Läufe bereitstellt, die sie aus der Laufzeit übernehmen, nach Namen; Die Werte bleiben auf der Maschine. Setzen Sie dort eins mit `nocobase-runner env set NAME`, oder übergeben Sie es mit `--pass-env NAME`.',
      none: 'Keine: Ein Lauf, der eine Variable aus der Laufzeit übernimmt, schlägt hier fehl, bevor er gestartet wird.',
      unknown:
        'Nicht gemeldet: Sein Runner ist älter als diese Funktion. Aktualisieren Sie den Runner, um sie zu sehen.',
    },
    jobs: {
      allow: 'Build-Jobs zulassen',
      hint: 'Builds und andere Schritte, die diese Anwendung konfiguriert, werden ohne Modell ausgeführt. Diese Laufzeit meldet: {{kinds}}.',
      unsupported:
        'Der Runner dieser Laufzeit nimmt keine Jobs an. Aktualisieren Sie den Runner, um dies zu aktivieren.',
    },
    noTools: 'Kein Codierungstool gefunden',
    actionsFor: 'Aktionen für {{name}}',
    columns: {
      name: 'Name',
      status: 'Status',
      tools: 'Werkzeuge',
      sharing: 'Teilen',
      version: 'Runner',
      lastSeen: 'Zuletzt gesehen',
      slots: 'Max. gleichzeitige Ausführungen',
    },
    detail: {
      general: 'Allgemein',
      tools: 'Werkzeuge',
      toolsDescription:
        'Die Codierungstools wurden gemeldet. Arbeiten für ein Werkzeug, das ausgeschaltet ist oder dessen Kontingent erschöpft ist, werden hier nicht gesendet. Mit „Speichern“ werden Schalter und Grenzwerte gespeichert.',
      version: 'Runner {{version}}',
      runs: 'Letzte Läufe',
      runsEmpty: 'Noch keine Läufe.',
      runsTotal: '{{count}} Ausführungen',
      runsPagination: 'Seitennavigation des Ausführungsverlaufs',
      runsPrevious: 'Zurück',
      runsNext: 'Weiter',
      runsPage: 'Seite {{page}} von {{pageCount}}',
      runsFailed: 'Die Läufe konnten nicht geladen werden.',
      readOnly: 'Nur sein Besitzer kann es ändern.',
      owner: 'Besitzer {{name}}',
    },
    status: {
      updatePending: 'Runner wartet auf Update',
      pruning: 'Runner reinigt den gemeinsamen Laden',
      online: 'Online',
      offline: 'Offline',
      revoked: 'Widerrufen',
      upgrade_required: 'Upgrade erforderlich',
    },
    upgradeRequired: {
      title: 'Diese Laufzeit benötigt ein Upgrade',
      older:
        'Sein Runner {{version}} spricht das Agentenprotokoll {{protocol}}; Diese Anwendung benötigt das Protokoll {{required}}. Es bleibt verbunden, führt jedoch nichts aus, bis es aktualisiert wird.',
      newer:
        'Sein Runner {{version}} spricht das Agentenprotokoll {{protocol}}, neuer als diese Anwendung (Protokoll {{required}}). Die Verbindung bleibt bestehen, es wird jedoch nichts ausgeführt, bis ein Runner ausgeführt wird, den diese Anwendung bedient.',
      latest:
        'Diese Anwendung dient dem Runner {{latest}}. Führen Sie dies auf seinem Host aus, um es zu aktualisieren:',
      noLatest:
        'Installieren Sie einen Runner, der das Protokoll {{required}} spricht, oder führen Sie diesen auf seinem Host aus, um ihn zu aktualisieren:',
      reinstall:
        'Sein Runner sagt nicht, wie er installiert wurde. Installieren Sie es erneut auf seinem Host mit dem Befehl „Laufzeit hinzufügen“.',
    },
    tool: {
      checking: 'Warten auf Erkennung',
      failed: 'Erkennung fehlgeschlagen',
      redetect: 'Erneut erkennen',
      notProvided: 'Nicht bereitgestellt',
      signedIn: 'Angemeldet',
      signedOut: 'Nicht angemeldet',
      notInstalled: 'Nicht installiert',
      off: 'Aus',
      offHint:
        'Aus: Arbeit für dieses Tool wird nicht an diese Laufzeit gesendet.',
      enableLabel: 'Führen Sie {{tool}} auf {{name}} aus',
      version: 'Version {{version}}',
    },
    trust: {
      isolationHint: runtimesEnUS.runtimes.trust.isolationHint,
      label: 'Für wen es funktioniert',
      team: 'Mannschaft',
      teamHint:
        'Jeder im Team startet Läufe mit seinen Variablen und Geheimnissen. Für gemeinsam genutzte Server und VMs.',
      ownerOnly: 'Persönlich',
      ownerOnlyHint:
        'Führt nur die von Ihnen gestartete Arbeit aus. Der Standardwert für eine Laufzeit, die Sie hinzufügen.',
      personalOnly:
        'Diese Laufzeit ist persönlich: Sie führt nur die Arbeit aus, die Sie starten. Sie können es später mit dem Team teilen.',
    },
    share: {
      title: '{{name}} mit dem Team teilen?',
      description:
        'Die Läufe anderer Leute laufen auf dieser Laufzeit mit ihren Variablen und Geheimnissen und können lesen, was sich darauf befindet. Teilen Sie es nur, wenn das in Ordnung ist.',
      confirm: 'Mit dem Team teilen',
    },
    edit: {
      button: 'Bearbeiten',
      title: '{{name}} bearbeiten',
      name: 'Name',
      nameRequired: 'Geben Sie einen Namen ein.',
      slotsHint: 'Wie viele Läufe die Laufzeit gleichzeitig benötigt.',
      slotsInvalid: 'Geben Sie eine ganze Zahl von 1 bis 64 ein.',
      saved: '{{name}} gespeichert',
    },
    upgrade: {
      show: 'Version {{version}}: Ein neuerer Runner ist verfügbar',
      available: 'Update verfügbar',
      badge: 'Aktualisierbar',
      title: 'Ein neuerer Runner für {{name}}',
      description:
        '{{version}} installiert, diese Anwendung bedient {{latest}}.',
      hint: 'Es aktualisiert sich selbst, sobald kein Agent ausgeführt wird. Um es jetzt zu aktualisieren, führen Sie dies auf seinem Host aus.',
    },
    revoke: {
      title: 'Den Berechtigungsnachweis von {{name}} widerrufen?',
      description:
        'Sein Runner stoppt bei seiner nächsten Anfrage und seine Läufe kehren in die Warteschlange zurück. Um es wieder zu verbinden, fügen Sie die Laufzeit erneut hinzu.',
      confirm: 'Widerrufen',
      done: 'Die Berechtigung von {{name}} wurde widerrufen',
    },
    delete: {
      title: '{{name}} löschen?',
      description:
        'Die widerrufene Laufzeit wird aus der Liste entfernt. Seine vergangenen Läufe bleiben bestehen.',
      confirm: 'Löschen',
      done: '{{name}} gelöscht',
    },
  },
  connect: {
    ...runtimesEnUS.connect,
    title: 'Laufzeit hinzufügen',
    description:
      'Führen Sie den folgenden Befehl auf einem Host aus, auf dem ein Codierungstool installiert ist: einem Server, einer VM oder Ihrem eigenen Gerät. Agenten werden dort mit vollem Zugriff ausgeführt, als der Benutzer, der den Runner ausführt, und können alles lesen und ändern, was der Benutzer tun kann, einschließlich SSH-Schlüsseln und anderen Anmeldeinformationen. Der Runner stellt keine Sicherheitsgrenze dar: Führen Sie ihn als dedizierten Benutzer, in einem Container oder in einer VM aus.',
    createCredential: 'Installationsbefehl generieren',
    advanced: 'Erweitert: Grenzen pro Codierungstool',
    run: 'Führen Sie dies auf diesem Host aus. Es lädt den Runner (nocobase-runner) und die CLI dieser Anwendung von dieser Anwendung herunter, registriert den Runner und startet ihn bei der Anmeldung:',
    nodeRequired:
      'Der Host benötigt Node.js 24 oder neuer (überprüfen Sie dies mit node --version). Der Befehl stoppt und sagt, wie er installiert werden soll, wenn er fehlt.',
    installed:
      'Ist nocobase-runner bereits installiert? Registrieren Sie es stattdessen:',
    tokenOnce:
      'Der Befehl enthält einen einmaligen Berechtigungsnachweis für eine „{{trust}}“-Laufzeit. Es funktioniert einmal, bis {{time}}.',
    after:
      'Innerhalb von Sekunden erscheint die Laufzeitumgebung mit jedem gefundenen Codierungstool in der Liste …',
    tokenTools: 'Codierungstools: {{tools}}.',
    tools: 'Codierungstools',
    toolsHint:
      'Diese Laufzeit wird nur für die überprüften Werkzeuge angeboten. Sie können es jederzeit auf der Seite „Laufzeiten“ ändern.',
    toolsRequired: 'Wählen Sie mindestens ein Codierungstool.',
    slots: 'Max. gleichzeitige Ausführungen',
    slotsHint:
      'Wie viele Läufe die Laufzeit gleichzeitig benötigt. Sie können es jederzeit auf der Seite „Laufzeiten“ ändern.',
    tokenSlots: 'Max. gleichzeitige Ausführungen: {{slots}}.',
    tokenToolSlots: 'Pro Codierungstool: {{limits}}.',
    connected: '{{name}} ist verbunden.',
    done: 'Erledigt',
    system: {
      macos: 'macOS',
      linux: 'Linux',
      windows: 'Windows',
    },
  },
  chat: {
    // Keep new guidance available in English until this locale is translated.
    executionFailed: chatEnUS.chat.executionFailed,
    fileInputFailures: chatEnUS.chat.fileInputFailures,
    untitled: 'Gespräch ohne Titel',
    renamed: 'Umbenannt',
    archivedNamed: 'Archiviert „{{title}}“',
    unarchived: 'Gespräch wiederhergestellt',
    undo: 'Rückgängig machen',
    sendFailed: 'Die Nachricht wurde nicht gesendet. Versuchen Sie es erneut.',
    availability: {
      online: 'Online',
      agentMissing: 'Gelöscht',
      agentArchived: 'Nicht aktiviert',
      forbidden: 'Für Sie nicht verfügbar',
      noModel: 'Konfigurieren Sie zunächst ein Chat-Modell',
      noRunner: 'Kein Runner online, kann nicht ausgewählt werden',
      othersPersonal: 'Nur die persönlichen Runner anderer haben es',
      modelUnavailable: 'Modell nicht verfügbar',
    },
    offline: {
      fallbackDone: 'Diese Konversation verwendet jetzt einen anderen Agenten',
      restoreDone: 'Zurückgeschaltet',
      newSession:
        'Der Agent startet eine neue Sitzung und liest dieses Gespräch.',
    },
    notice: {
      switchedToDefault:
        'Auf {{name}}, den Systemstandard, umgestellt, bis {{own}} wieder verfügbar ist.',
      switchedToOnline:
        '{{own}} hat derzeit keinen Runner für Sie, also antwortet {{name}}, bis {{own}} zurück ist.',
      onlineFallbackUnavailable:
        'Der Online-Fallback-Agent kann nicht antworten ({{reason}}). Dieses Gespräch bleibt bei {{own}}, während es auf einen Runner wartet.',
      switchedAgent:
        'Zu {{name}} gewechselt. Der Gesprächsverlauf bleibt erhalten.',
      switchedBack: 'Zurück mit {{name}}.',
      runFailed: 'Der Agent hielt inne, bevor er antwortete.',
      runFailedReason: 'Der Agent hielt an, bevor er antwortete: {{reason}}',
      runCancelled: 'Stornierung beantragt.',
    },
    consultation: {
      unavailableTitle: 'Der konsultierte Agent ist nicht verfügbar',
      snapshotTitle: 'Damals {{name}} angefordert',
      title: 'Konsultiert {{name}}',
    },
    steps: {
      thinking: 'Denken…',
      reading: 'Blick auf {{subject}}',
      working: 'Arbeit an {{subject}}',
    },
    agents: {
      personalOnly: 'Nur für Privatläufer',
      hint: 'Listet die aktivierten Agenten auf und sagt, warum man Ihnen jetzt nicht antworten kann. Antworten laufen auf einem Runner: Die erste Antwort wartet darauf, dass jemand sie annimmt, normalerweise ein paar Sekunden.',
      chooseFor: 'Wählen Sie einen Agenten',
      empty: 'Kein Agent, den Sie wählen können',
      none: 'Kein Agent',
      unknown: 'Unbekannter Agent',
      placeholder: 'Wählen Sie einen Agenten',
      myDefault: 'Mein Standard',
      systemDefault: 'Systemstandard',
    },
  },
  chatProfile: {
    loadFailed: 'Ihre Agenteneinstellungen konnten nicht geladen werden',
    defaultAgent: 'Mein Standard-Chat-Agent',
    systemDefault: 'Systemstandard',
    systemDefaultNamed: 'Systemstandard ({{name}})',
    noDefault: 'Es ist kein Systemstandard festgelegt.',
    saved: 'Standard-Chat-Agent gespeichert',
  },
  models: {
    title: 'Modelle',
    description:
      'Die von Online-Agenten aufgerufenen Modelldienste und die jeweils angebotenen Modelle: Chat-Modelle für Agenten, Einbettung und Neubewertung von Modellen für die Suche.',
  },
  defaultModel: {
    title: 'Standard-Chat-Modell',
    description:
      'Online-Agenten ohne eigene Modelle antworten damit, z. B. ein neuer Agent oder einer, der mit der Anwendung geliefert wurde.',
    none: 'Es ist noch kein Chat-Modell aktiviert. Fügen Sie einen Modelldienst hinzu und aktivieren Sie ein Chat-Modell: Das erste wird zum Standard.',
    saved: 'Das Standard-Chat-Modell ist jetzt {{model}}.',
  },
  services: {
    list: 'Musterdienste',
    columns: {
      name: 'Name',
      provider: 'Anbietertyp',
      status: 'Status',
    },
    loadFailed: 'Die Modelldienste konnten nicht geladen werden',
    empty: {
      title: 'Noch kein Modellservice',
      description:
        'Sobald Sie einen Modelldienst hinzufügen, können Online-Agenten über diesen antworten.',
      readOnly:
        'Bitten Sie einen Administrator, einen Modelldienst hinzuzufügen.',
    },
    add: {
      open: 'Dienst hinzufügen',
      title: 'Fügen Sie einen Modelldienst hinzu',
      provider: 'Anbietertyp',
      created: '{{title}} hinzugefügt.',
    },
    status: {
      on: 'An',
      off: 'Aus',
      noKey: 'Kein API-Schlüssel',
      noModels: 'Kein Modell vorhanden',
    },
    service: {
      edit: '{{title}} bearbeiten',
      defaultHost: 'Provider-Standard',
      actions: 'Weitere Aktionen für {{title}}',
      turnOn: 'Einschalten',
      turnOff: 'Ausschalten',
      turnedOn: '{{title}} ist eingeschaltet.',
      turnedOff: '{{title}} ist ausgeschaltet.',
      name: 'Name',
      enabled: 'Aktiviert',
      enabledHint:
        'Online-Agenten dürfen ihre Modelle nur verwenden, solange sie aktiv sind.',
      saved: '{{title}} gespeichert.',
      delete: 'Löschen',
      deleteTitle: '{{title}} löschen?',
      deleteDescription:
        'Agenten, die seine Modelle verwenden, antworten nicht mehr, bis ihnen ein anderes gegeben wird, und seine Modellpreise werden gelöscht.',
      deleted: '{{title}} gelöscht.',
    },
    connection: {
      apiKey: 'API-Taste',
      keyPlaceholder: 'Fügen Sie den API-Schlüssel ein',
      baseUrl: 'Basis-URL',
      baseUrlHint:
        'Empty verwendet die Standardeinstellung des Anbieters, {{url}}.',
      baseUrlRequired: 'Die Adresse des Anbieters API.',
      baseUrlInvalid: 'Die Basis URL beginnt mit http:// oder https://.',
      test: 'Testverbindung',
      testing: 'Testen…',
      testOk: 'Verbunden: {{model}} hat geantwortet.',
      testFailed: '{{model}} hat nicht geantwortet: {{message}}',
      testNeedsModel: 'Überprüfen Sie ein Modell, um die Verbindung zu testen.',
      openCodeHint:
        'OpenCode sendet x-opencode-session bei jeder Anfrage (eine Sitzungs-ID pro Konversation). Es bedient jede Modellfamilie über einen eigenen API: DeepSeek, GLM, Kimi und MiMo bis DeepSeek oder OpenAI-compatible, Claude, MiniMax und Qwen bis Anthropic, GPT und Grok bis OpenAI. Fügen Sie mit diesem Basisgerät URL einen Service jeder Art hinzu, den Sie benötigen.',
    },
    models: {
      title: 'Modelle',
      description:
        'Sehen Sie sich die Modelle an, die dieser Dienst anbietet, und geben Sie an, wofür sie jeweils gedacht sind: Chat-Modelle, Antworten auf Agenten, Einbetten von Modellindextexten für die Suche, Neuordnen von Modellen in der Reihenfolge der Suchergebnisse. Ein Einbettungsmodell kann nach Vektoren einer Größe fragen.',
      fetching: 'Die Modelle des Anbieters werden abgerufen…',
      fetchFailed:
        'Der Anbieter würde seine Modelle nicht auflisten: {{message}}',
      fetch: 'Modelle abrufen',
      search: 'Modelle suchen',
      noMatch: 'Keine Modellübereinstimmungen.',
      empty:
        'Noch kein Modell. Rufen Sie sie vom Anbieter ab oder fügen Sie sie anhand ihrer ID hinzu.',
      add: 'Modell hinzufügen',
      addPlaceholder: 'Modell-ID',
      kind: 'Wofür {{model}} ist',
      kinds: {
        chat: 'Chatten',
        embedding: 'Einbettung',
        rerank: 'Neu einstufen',
      },
      test: 'Test {{model}}',
      testOk: 'Beantwortet als {{kind}}.',
      testFailed: 'Nicht geantwortet: {{message}}',
      notKind: {
        chat: 'Dieses Modell sieht nicht wie ein Chat-Modell aus',
        embedding: 'Dieses Modell sieht nicht wie ein Einbettungsmodell aus',
        rerank: 'Dieses Modell sieht nicht wie ein Rerank-Modell aus',
      },
      looksLike: '{{notKind}}: Es antwortet als {{kind}}.',
      kindNouns: {
        chat: 'ein Chat-Modell',
        embedding: 'ein Einbettungsmodell',
        rerank: 'ein Reranking-Modell',
      },
      dimensions: 'Vektorgröße von {{model}}',
      dimensionsPlaceholder: 'Standard',
      counts: {
        chat: '{{count}}-Chat',
        embedding: '{{count}}-Einbettung',
        rerank: '{{count}} neu eingestuft',
      },
    },
  },
  prices: {
    loadFailed: 'Die Modellpreise konnten nicht geladen werden',
    section: {
      title: 'Modellpreise',
      description:
        'Pro Million Token, Input/Output. Daraus ermitteln die Berichte die Kosten.',
      online: 'Online (Modelldienste)',
      noOnline:
        'Noch kein Modell mit Preisangabe. Schalten Sie zuerst einen Modelldienst und seine Modelle ein.',
      runner: 'Runner (Codierungstools)',
    },
    price: {
      model: 'Modell',
      state: 'Preisquelle und Aktionen',
      input: 'Eingabe / 1M',
      output: 'Ausgabe / 1M',
      inputOf: 'Eingabepreis von {{model}}, pro Million Token',
      outputOf: 'Ausgabepreis von {{model}}, pro Million Token',
      save: 'Preis für {{model}} speichern',
      saved: 'Preis von {{model}} gespeichert.',
      remove: 'Den Preis von {{model}} entfernen',
      removed: 'Preis von {{model}} entfernt.',
      unpriced: 'Ohne Preis',
      unpricedHint:
        'Seine Kosten werden in den Berichten mit „-“ angezeigt, bis es einen Preis gibt.',
      via: 'von {{pattern}}',
      viaHint:
        'Bepreist nach der Regel {{pattern}}. Wenn Sie hier sparen, erhält dieses Modell einen eigenen Preis.',
      invalid: 'Preise sind Zahlen von 0 oder mehr.',
      readOnly: 'Nur wer Modellpreise verwaltet, darf diese ändern.',
    },
    tool: {
      description:
        'Welche Läufe von {{tool}} kosten, der Preis richtet sich nach dem Modell, das jeder Lauf meldet.',
      subscription: 'Abonnement (nicht in Rechnung gestellt)',
      subscriptionTag: 'Abonnement',
      subscriptionHint:
        'Bezahlt durch einen monatlichen Plan: Seine Läufe kosten in den Berichten nichts.',
      subscribed: '{{tool}} wird per Abonnement abgerechnet.',
      unsubscribed: '{{tool}} wird nach seinen Preisen abgerechnet.',
      seen: 'Modelle in Läufen gesehen',
      noneSeen: 'Kein Lauf von {{tool}} hat bisher ein Modell gemeldet.',
      rules: 'Preisregeln ({{count}})',
      rulesHint:
        'Eine Regel ist eine Modell-ID oder ein Muster wie claude-sonnet-4*; Das spezifischste Spiel gewinnt.',
      ruleModel: 'Modell oder Muster',
      addRule: 'Preis hinzufügen',
      ruleAdded: 'Preis von {{model}} hinzugefügt.',
    },
  },
  skills: {
    attachments: 'Anhänge',
    globalMount: 'Globale Bindung',
    globalMountDescription:
      'Speichert sofort. Alle zukünftigen Läufe erhalten diese Fähigkeit.',
    mountSaved: 'Anhangseinstellungen gespeichert.',
    mountRetry:
      'Einstellungen konnten nicht geladen werden. Versuchen Sie es noch einmal',
    unavailableTarget: 'Nicht verfügbares Ziel',
    noAttachments: 'Nirgendwo angebracht.',
    title: 'Skills',
    description:
      'Wiederverwendbare Anweisungen mit unterstützenden Dateien. Hängen Sie Teamstandards global oder an ein Projekt oder Arbeitsverzeichnis an.',
    new: 'Neue Fähigkeit',
    newTitle: 'Neue Fähigkeit',
    newDescription:
      'Schreiben Sie SKILL.md: Der Titeltext benennt und beschreibt die Fertigkeit. Fügen Sie Dateien jetzt oder später hinzu.',
    breadcrumb: 'Skill',
    loadFailed: 'Fertigkeiten konnten nicht geladen werden',
    backToList: 'Zurück zu den Fähigkeiten',
    emptyTitle: 'Noch keine Fähigkeiten',
    emptyDescription:
      'Sobald Sie eine Fertigkeit hinzugefügt haben, lesen Agenten deren SKILL.md, wann immer eine Aufgabe sie erfordert.',
    emptyReadOnly:
      'Bitten Sie einen Administrator, eine Fertigkeit hinzuzufügen.',
    content: 'SKILL.md',
    contentHint:
      'Der Name der Titelseite ist der Ordnername des Skills: Durch Ändern wird der Skill umbenannt. Die Beschreibung sagt den Agenten, wann sie sie lesen sollen.',
    contentTooLarge: 'SKILL.md ist größer als {{max}}.',
    emptyContent: 'Dieser Skill hat noch keinen Inhalt.',
    created: 'Fertigkeit „{{name}}“ erstellt',
    saved: 'Gespeichert als Version {{version}}.',
    saveVersion: 'Neue Version speichern',
    editing: 'Bearbeiten',
    note: 'Notiz',
    notePlaceholder: 'Was hat sich in dieser Version geändert (optional)',
    deleted: 'Fertigkeit „{{name}}“ gelöscht.',
    edit: 'Bearbeiten',
    delete: 'Fertigkeit löschen',
    deleteTitle: 'Skill „{{name}}“ löschen?',
    deleteDescription:
      'Jeder Agent und jeder Ort, der diese Fähigkeit standardmäßig verwendet, verliert sie.',
    readOnly:
      'Nur der Ersteller des Skills und Arbeitsbereichsadministratoren können diesen Skill ändern.',
    conflict:
      'Jemand anderes hat diese Fertigkeit gerade geändert. Die neueste Version wird geladen; versuchen Sie es erneut.',
    conflictTitle: 'Jemand anderes hat diese Fertigkeit gerade geändert',
    conflictDraft:
      'Jemand hat eine neue Version gespeichert, nachdem Sie mit der Bearbeitung begonnen haben, sodass Ihre Änderungen nicht gespeichert wurden. Kopieren Sie, was Sie behalten möchten, laden Sie dann die neueste Version und bearbeiten Sie sie erneut.',
    loadLatest: 'Neueste Version laden',
    mountedAgents: 'Angeschlossene Agenten',
    noAgents: 'Noch keinem Agenten zugeordnet.',
    defaults: 'Standardfähigkeit von: {{places}}.',
    defaultsSeparator: ', ',
    files: 'Dateien',
    usage: '{{files}}/{{maxFiles}}-Dateien · {{size}}/{{maxSize}}',
    uploadTooLarge: '{{name}} ist größer als {{max}}.',
    uploadInvalidName:
      '{{name}} kann hier nicht hinzugefügt werden; Benennen Sie es zuerst um.',
    skillTooLarge: 'Eine Fertigkeit hält insgesamt höchstens {{max}}.',
    tooManyFiles: 'Ein Skill enthält höchstens {{max}}-Dateien.',
    filesTooLarge: 'Größer als {{max}}: {{paths}}.',
    binaryFile: 'Binärdatei, {{size}}. Es kann hier nicht bearbeitet werden.',
    executable: 'Ausführbar',
    scriptBadge: 'Skript',
    scriptsNote:
      'Verfügt über Skripte: Online-Agenten können sie lesen, aber niemals ausführen',
    compatibility: 'Kompatibilität: {{value}}',
    fileContent: 'Inhalt von {{path}}',
    export: 'Exportieren',
    exportVersion: 'Version {{version}} als Zip exportieren',
    import: 'Importieren',
    importVersion: 'Neue Version importieren',
    imported: 'Importierter Skill „{{name}}“.',
    importInvalid:
      'Der SKILL.md des Archivs kann nicht verwendet werden: {{problem}}',
    tree: {
      label: 'Skill-Dateien',
      newFile: 'Neue Datei',
      newFolder: 'Neuer Ordner',
      upload: 'Dateien hochladen',
      actionsFor: 'Aktionen für {{name}}',
      rename: 'Umbenennen',
      delete: 'Löschen',
      download: 'Herunterladen',
      replace: 'Ersetzen',
      markExecutable: 'Als ausführbar markieren',
      unmarkExecutable: 'Als nicht ausführbar markieren',
      dropHint:
        'Legen Sie Dateien in einem Ordner ab, um sie dort hochzuladen.',
    },
    entry: {
      description:
        'Namen werden mit den bereits vorhandenen Dateien verglichen.',
      folderHint:
        'Ein leerer Ordner wird nicht gespeichert: Fügen Sie vor dem Speichern eine Datei hinzu.',
      location: 'Standort',
      root: 'Skill-Ordner (/)',
      name: 'Name',
      renameTitle: '„{{name}}“ umbenennen',
      conventional: {
        scripts:
          'Code-Agenten können ausgeführt werden. Online-Agenten lesen es nur.',
        references: 'Dokumentationsagenten lesen, wenn sie es brauchen.',
        assets: 'Vorlagen, Bilder und andere Ressourcen.',
      },
      problems: {
        required: 'Geben Sie einen Namen ein.',
        invalid: 'Verwenden Sie einen Namen ohne „/“, außer „.“ Und "..".',
        taken:
          'Eine Datei oder ein Ordner mit diesem Namen ist bereits vorhanden.',
        reserved:
          'SKILL.md ist die Fertigkeit selbst; wähle einen anderen Namen.',
      },
      deleteFileTitle: 'Datei „{{name}}“ löschen?',
      deleteFolderTitle: 'Ordner „{{name}}“ und alles darin löschen?',
      deleteDescription:
        'Es wird aus diesem Entwurf entfernt; Gespeicherte Versionen behalten es.',
    },
    editor: {
      write: 'Schreiben',
      preview: 'Vorschau',
      nothingToPreview: 'Es gibt noch keine Vorschau.',
      noPreview: 'Keine Vorschau für diese Art von Datei.',
    },
    frontMatter: {
      title: 'Korrigieren Sie die vordere Angelegenheit von SKILL.md',
      reasons: {
        missing:
          'Beginnen Sie SKILL.md mit der Titelseite zwischen zwei „---“-Zeilen, mit Name und Beschreibung.',
        yaml: 'Die Titelseite ist kein gültiges YAML.',
        notMapping:
          'Im Vordergrund müssen Schlüssel und Werte stehen, wie zum Beispiel „Name: my-skill“.',
        required: '{{field}} hinzufügen.',
        empty: '{{field}} darf nicht leer sein.',
        type: '{{field}} hat den falschen Typ.',
        tooLong: '{{field}} ist länger als {{max}} Zeichen.',
        pattern:
          'Der Name verwendet Kleinbuchstaben, Ziffern und einzelne Bindestriche und beginnt oder endet nicht mit einem Bindestrich.',
        mismatch: 'Name muss der Name des Ordners sein, der SKILL.md enthält.',
        taken: 'Eine andere Fähigkeit hat diesen Namen; wähle einen anderen.',
      },
    },
    template: {
      description:
        'Was diese Fertigkeit bewirkt und wann ein Agent sie verwenden sollte.',
      title: 'Neue Fähigkeit',
      whenToUse: 'Wann zu verwenden',
      whenToUseHint:
        'Beschreiben Sie die Aufgaben, die diese Fähigkeit erfordern.',
      steps: 'Schritte',
      stepsHint: '1. Der erste Schritt.\n2. Der nächste Schritt.',
      examples: 'Beispiele',
      examplesHint: 'Zeigt eine Eingabe und wie ein gutes Ergebnis aussieht.',
    },
    columns: {
      name: 'Name',
      description: 'Beschreibung',
      files: 'Dateien',
      version: 'Version',
      agents: 'Agenten',
      updated: 'Aktualisiert',
    },
    versions: {
      title: 'Versionen',
      description:
        'Jeder Speichervorgang erstellt eine neue Version; Agenten erhalten immer die neueste Version.',
      current: 'Strom',
      compare: 'Vergleiche',
      compareTitle: 'Version {{version}} → Version {{current}}',
      compareDescription:
        'Seitdem entfernte Zeilen in Rot, hinzugefügt in Grün.',
      unchanged: 'unverändert',
      restore: 'Wiederherstellen',
      restoreTitle: 'Version {{version}} wiederherstellen?',
      restoreDescription:
        'Es wird erneut als neueste Version gespeichert; Agenten bekommen es bei ihrem nächsten Lauf. Es geht nichts verloren: Die aktuelle Version bleibt im Verlauf.',
      restored:
        'Version {{version}} als Version {{current}} wiederhergestellt.',
    },
  },
  runWait: {
    capacity:
      'Hier verwendete Slots {{used}}/{{limit}}; {{detail}}; Als kostenlos für alle Apps gemeldet {{reportedFree}}',
    reasons: {
      updatePending: 'Runner wartet auf Update; Neue Arbeiten werden pausiert',
      pruning:
        'Runner reinigt Gemeinschaftslager; Neue Arbeiten werden pausiert',
      toolNotInstalled: 'Kein verbundener Runner hat dieses Tool installiert',
      incompatible:
        'Verbundene Runner unterstützen diese Arbeitslast nicht. Upgrade erforderlich',
      restricted:
        'Runner-Richtlinien-, Verzeichnis- oder Variablenbeschränkungen',
      unknown: 'Die Workload-Berechtigung ist nicht festgelegt',
      agentArchived: 'Der Agent ist archiviert',
      delayed: 'Geplant für {{until}}',
      noRunnerOnline: 'Keine Laufzeit online',
      runnersOffline: 'Seine Laufzeiten sind offline',
      toolUnavailable:
        'Tool nicht angemeldet, deaktiviert oder angefordertes Modell nicht verfügbar ({{tool}})',
      noSharedRunner: 'Nur die persönlichen Runner anderer Leute sind online',
      missingFeatures: 'Keine Laufzeit unterstützt {{features}}',
      secretsNotAllowed:
        'Benötigt eine Teamlaufzeit: {{variables}} ist nur für Teamlaufzeiten vorgesehen',
      sameWorkActive: 'Nach dem Lauf schon drauf',
      concurrencyFull: 'Parallelität voll ({{active}}/{{limit}})',
      runnersBusy: 'Kompatible Runner sind voll',
      toolSlotsFull: '{{tool}}-Steckplätze voll ({{used}}/{{limit}})',
      setupRetrying: 'Die Vorbereitung schlug fehl; Wiederholung: {{detail}}',
      next: 'Weiter für eine kostenlose Laufzeit',
    },
    unknown: 'In der Warteschlange ({{reason}})',
    unknownValue: '—',
  },
  access: {
    section: 'Agententeam',
    businessSection: 'Agententeam',
    businesses: {
      agents: {
        title: 'Agenten und Fähigkeiten',
        description:
          'Die Agenten des Teams und die von ihnen eingesetzten Fähigkeiten.',
        actions: {
          edit: {
            title: 'Change Agents und Fähigkeiten',
            description:
              'Ändern Sie die Einstellungen, Fähigkeiten und Variablen eines Agenten, archivieren, wiederherstellen und löschen Sie ihn und bearbeiten Sie Fähigkeiten. Einem Agenten werden keine Befugnisse eingeräumt, die über die des Herausgebers hinausgehen',
            related:
              'Agenten und Fähigkeiten ändern (Agenten, die sie besitzen, und Fähigkeiten, die sie erstellt haben)',
            relatedLabel:
              'Agenten, die ich besitze, und Fähigkeiten, die ich erstellt habe',
            relatedHint:
              'Agenten, deren Eigentümer ich bin, und von mir erstellte Fähigkeiten',
            all: 'Change Agents und Fähigkeiten (alle)',
          },
        },
      },
    },
    settings: {
      agents: {
        agents: 'Agenten',
        runners: 'Laufzeitumgebungen',
        prices: 'Modellpreise',
        services: 'Musterdienste',
      },
    },
    actions: {
      read: 'Anzeigen',
      manage: 'Verwalten',
    },
    keyScopes: {
      agents: {
        title: 'Agenten',
        description:
          'Siehe Agenten, Fähigkeiten und Läufe; Agenten und Fähigkeiten ändern, Läufe abbrechen und wiederholen.',
      },
      runners: {
        title: 'Laufzeitumgebungen',
        description: 'Siehe Runner und Registrierungsmarken; Runner verwalten.',
      },
      prices: {
        title: 'Modellpreise',
        description:
          'Siehe die Modellpreise, anhand derer die Kosten geschätzt werden; ändere sie.',
      },
      services: {
        title: 'Musterdienste',
        description:
          'Sehen Sie sich die Modeldienste und die von ihnen angebotenen Models an, niemals deren Schlüssel.',
      },
    },
  },
};

export default deDE;
