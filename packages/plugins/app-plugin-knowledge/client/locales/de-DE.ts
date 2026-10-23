import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  indexing: {
    failedDocumentCount: 'Fehlgeschlagene Dokumente: {{count}}',
    enabled: 'Indexierung aktivieren',
    enabledHint:
      'Deaktivieren, um nur die Textsuche zu verwenden. Änderungen werden nach dem Speichern wirksam.',
    chooseInstance: 'Indexinstanz auswählen',
    documentProgress: 'Indexierte Dokumente',
    pendingDocuments: 'Ausstehende Dokumente',
    failedDocuments: 'Fehlgeschlagene Dokumente',
    preparedChunks: 'Vorbereitete Abschnitte',
    committedChunks: 'Übernommene Abschnitte',
    agentPrompt:
      'Hilf mir, die Indizierung der Wissensdatenbank dieser NocoBase-3-Anwendung einzurichten.\n\nLies die AGENTS.md und prüfe die tatsächlich verfügbaren Indextypen (type). Zur Auswahl stehen zwei Vektordatenbanken: SQLite mit sqlite-vec (type sqlite-vec, lokale Datei) und PostgreSQL mit pgvector (type pgvector, Erweiterung vector erforderlich). Erkläre geeignete Optionen und Voraussetzungen für diese Bereitstellung und lass mich vor dem Fortfahren wählen.\n\nFrage danach die nötigen Angaben ab: bei SQLite den Indexdateipfad, bei PostgreSQL die Verbindung und den Status der Erweiterung vector. Zeige keine Passwörter oder API-Schlüssel.\n\nZeige die geplante Konfiguration und hole meine Bestätigung ein, bevor du knowledge.indexing in der config.yaml änderst. Erhalte andere Einstellungen. Wird bereits config.yml verwendet, bearbeite diese Datei statt eine weitere anzulegen.\n\nPrüfe die Konfiguration sicher und erkläre den Neustart. Starte die Anwendung nicht ohne Zustimmung neu und installiere keine Abhängigkeiten ohne Bestätigung. Führe mich danach durch das erneute Öffnen der Indexeinstellungen, Aktivieren, Auswählen von Instanz und Embedding-Modell und Speichern. Frage vor kostenpflichtigen Modellaufrufen oder dem Neuaufbau des Index nach.',
    databases: {
      sqlite: {
        name: 'SQLite-Vektordatenbank',
        description:
          'Speichert den Index mit der Vektorerweiterung sqlite-vec in einer lokalen SQLite-Datei auf dem Anwendungsserver. Kein separater Datenbankdienst erforderlich; für einen einzelnen Host geeignet.',
      },
      pgvector: {
        name: 'PostgreSQL-Vektordatenbank',
        description:
          'Speichert und durchsucht Vektoren mit pgvector in PostgreSQL. Benötigt eine Datenbankverbindung und die Erweiterung vector. Geeignet für vorhandene PostgreSQL-Dienste oder mehrere Anwendungsserver mit gemeinsamem Index.',
      },
    },
    setupTitle: 'Konfigurationsschritte',
    setup: {
      instance:
        'Öffne die config.yaml und ergänze unter knowledge.indexing eine Instanz mit Name, Typ und lokalem Dateipfad oder Datenbankverbindung.',
      restart:
        'Speichere die Datei und starte die Anwendung neu, um die Konfiguration zu laden.',
      enable:
        'Öffne die Indexeinstellungen erneut, aktiviere die Indizierung, wähle die neue Instanz und ein Embedding-Modell und speichere.',
    },
    agentHandoff:
      'Wenn du mit Konfigurationsdateien nicht vertraut bist, kopiere den folgenden Prompt für einen Entwicklungs-Agent.',
    global: 'Alle Wissensbereiche',
    back: 'Zurück zum Wissen',
    configuration: 'Indexkonfiguration',
    typeHint:
      'Instanzen sind nach type gruppiert. Jeder Typ bestimmt sein Formular und ob ein Embedding-Modell nötig ist.',
    typeForm: 'Dynamisches Formular dieses Typs',
    openPage: 'Separate Einstellungsseite öffnen',
    emptyTitle: 'Zuerst eine Vektordatenbank konfigurieren',
    emptyDescription:
      'Der Wissensindex benötigt eine Vektordatenbank, um Dokumentvektoren zu speichern und zu durchsuchen. Wähle eine der folgenden Möglichkeiten und ergänze die config.yaml der Anwendung:',
    agentTitle: 'Konfigurationsprompt',
    copyPrompt: 'Konfigurationsprompt kopieren',
    promptCopied: 'Prompt kopiert. Es wurde nichts ausgeführt.',
    promptCopyFallback:
      'Automatisches Kopieren nicht möglich. Der Prompt ist zum manuellen Kopieren markiert.',
    promptLabel: 'Konfigurationsprompt für Ihren Entwicklungs-Agent',
    rebuildHint: 'Änderungen erfordern einen Neuaufbau',
    editHint: 'Zum Speichern die Konfiguration ändern',
    confirmRetryEmbedding:
      'Nur fehlgeschlagene Dokumente aller Wissensbereiche erneut verarbeiten. Abgeschlossene Arbeit bleibt erhalten; Embedding-Kosten können anfallen.',
    confirmRetry:
      'Nur fehlgeschlagene Dokumente aller Wissensbereiche erneut verarbeiten. Abgeschlossene Arbeit bleibt erhalten; Dienstressourcen werden genutzt.',
    confirmResources:
      'Alle Wissensbereiche werden neu indexiert. Dieser Typ benötigt keine Embedding-Aufrufe, verbraucht aber Speicher und Dienstressourcen. Der veröffentlichte Index bleibt bis zum Austausch verfügbar.',
    deploymentPg:
      'Verbindung, Schema und Tabellenpräfix werden in der Bereitstellung konfiguriert.',
    deploymentFile:
      'Der Indexdateipfad wird in der Bereitstellung konfiguriert.',
    errors: {
      configurationChanged:
        'Index- oder Modelleinstellungen wurden geändert. Die alte Generation kann damit nicht erneut ausgeführt werden. Einstellungen prüfen und bei Bedarf alle Bereiche neu aufbauen (Embedding-Kosten möglich).',
      modelAuth:
        'Embedding-Authentifizierung fehlgeschlagen. API-Schlüssel, Zugriffsrechte und Endpunktregion prüfen.',
      modelQuota:
        'Embedding-Kontingent oder Guthaben aufgebraucht. Modellkonto vor dem Wiederholen prüfen.',
      modelRateLimit:
        'Der Embedding-Dienst begrenzt Anfragen. Vor dem Wiederholen warten.',
      modelConfig:
        'Das gespeicherte Embedding-Modell ist nicht verfügbar, geändert oder nicht unterstützt. Dienstauswahl und Modell prüfen.',
      modelInput:
        'Die Embedding-Eingabe ist zu lang. Größe der Dokumentabschnitte prüfen.',
      modelPolicy:
        'Der Embedding-Dienst hat die Eingabe wegen seiner Inhaltsrichtlinie abgelehnt. Betroffene Inhalte prüfen.',
      modelResponse:
        'Der Embedding-Dienst lieferte ungültige Vektoren. Modellkompatibilität und Dimensionen prüfen.',
      modelUnavailable:
        'Der Embedding-Dienst ist nicht erreichbar oder vorübergehend nicht verfügbar. Endpunkt und Netzwerk prüfen.',
      storageAuth:
        'Authentifizierung des Indexspeichers fehlgeschlagen. Datenbankbenutzer, Passwort und Verbindung prüfen.',
      storagePermission:
        'Der Indexspeicher verweigert den Vorgang oder ist schreibgeschützt. Schema- und Tabellenrechte prüfen.',
      storageSchema:
        'Indexdatenbank, Schema oder erforderliche Tabelle nicht verfügbar. Bereitstellung und Schema prüfen.',
      storageUnavailable:
        'Der Indexspeicher ist nicht erreichbar oder die Verbindung wurde unterbrochen. Adresse, Port und Netzwerk prüfen.',
      storageBusy:
        'Der Indexspeicher ist ausgelastet oder ein Transaktionskonflikt ist aufgetreten. Wiederholungsrichtlinie des Hosts abwarten.',
      timeout:
        'Zeitüberschreitung beim Indizieren. Speicher und Modelldienst vor dem Wiederholen prüfen.',
      vectorExtension:
        'Die PostgreSQL-Erweiterung vector fehlt. Datenbankadministration um Installation bitten.',
      ownership:
        'Eigentümer oder Struktur des Indexziels stimmen nicht überein. Instanzressource prüfen; keine fremden Tabellen löschen.',
      dependencies:
        'Indexinstanz, Erweiterung oder Host-Jobs-Konfiguration nicht verfügbar. Bereitstellung prüfen und bei Bedarf neu starten.',
    },
    invalidValue: 'Prüfen Sie diesen Wert.',
    title: 'Wissensindex-Einstellungen',
    description: 'Suchindexierung für alle Wissensbereiche konfigurieren.',
    progress: 'Indexierungsfortschritt',
    instance: 'Indexinstanz',
    off: 'Aus — nur Textsuche',
    missingForm:
      'Das Konfigurationsformular ist nicht verfügbar. Gespeicherte Optionen bleiben erhalten.',
    statusFailed: 'Der Indexstatus konnte nicht aktualisiert werden.',
    loadFailed:
      'Indexeinstellungen konnten nicht geladen werden. Prüfen Sie Ihre Berechtigungen.',
    saveFailed:
      'Die Anfrage wurde nicht angenommen. Ihr Entwurf wurde beibehalten.',
    conflict:
      'Die Einstellungen wurden anderweitig geändert. Laden Sie die aktuelle Revision, ohne Ihren Entwurf zu verwerfen, prüfen Sie ihn und speichern Sie erneut.',
    saved: 'Anfrage angenommen. Die Indexierung läuft im Hintergrund weiter.',
    workFailed:
      'Einige Indexaufgaben sind fehlgeschlagen. Prüfen Sie Instanz und Modelldienst und versuchen Sie es erneut.',
    rebuild: 'Alle Bereiche neu indizieren',
    retry: 'Fehlgeschlagene Aufgaben wiederholen',
    confirmTitle: 'Globale Indexänderung bestätigen',
    confirmRebuild:
      'Dies betrifft alle Wissensbereiche und kann alle Dokumente neu einbetten, Modellkosten verursachen und zusätzlichen Speicher erfordern. Der bisherige Index bleibt verfügbar, bis der neue bereit ist.',
    confirmDisable:
      'Dies deaktiviert die Indexsuche für alle Wissensbereiche. Die Textsuche bleibt verfügbar. Die Bereinigung läuft im Hintergrund.',
    discardTitle: 'Ungespeicherte Änderungen verwerfen?',
    discardDescription:
      'Ihre ungespeicherten Indexeinstellungen gehen verloren.',
    discard: 'Änderungen verwerfen',
    confirm: 'Bestätigen',
    documents:
      'Dokumente: {{done}} / {{total}} · Ausstehend: {{pending}} · Fehlgeschlagen: {{failed}}',
    chunks: 'Vorbereitete Abschnitte: {{prepared}} · Übernommen: {{committed}}',
    availability: {
      disabled: 'Deaktiviert — nur Textsuche',
      unavailable: 'Index nicht verfügbar — Textsuche bleibt verfügbar',
      building: 'Index wird erstellt',
      ready: 'Index bereit',
      degraded: 'Index eingeschränkt — Textsuche bleibt verfügbar',
    },
    table: 'Tabellenname',
    modelService: 'Modelldienst',
    model: 'Embedding-Modell',
    chooseService: 'Modelldienst auswählen',
    chooseModel: 'Modell wählen oder Modellnamen eingeben',
    loadingModels: 'Embedding-Modelle werden geladen…',
    modelsUnavailable:
      'Embedding-Modelle sind nicht verfügbar. Prüfen Sie den Modelldienst und versuchen Sie es erneut.',
  },
  access: {
    businessSection: 'Wissen',
    businesses: {
      knowledge: {
        title: 'Wissen',
        description: 'Die Dokumente jedes Wissensraums.',
        actions: {
          read: {
            title: 'Wissen lesen',
            description:
              'Lesen Sie das Systemwissen und das der damit verbundenen Räume',
            related: 'Wissen lesen (dazu gehörende Räume)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen lesen (alle)',
          },
          propose: {
            title: 'Wissen vorschlagen',
            description:
              'Eine Änderung vorschlagen, damit jemand, der sie bearbeiten kann, darüber entscheiden kann; welche Wirkstoffe gegeben werden können',
            related: 'Wissen vorschlagen (dazu gehörende Räume)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen vorschlagen (alle)',
          },
          edit: {
            title: 'Wissen bearbeiten',
            description:
              'Vorschläge bearbeiten, archivieren und als verifiziert markieren und entscheiden; Systemwissen braucht jeder',
            related: 'Wissen bearbeiten (dazu gehörende Bereiche)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissen bearbeiten (alle)',
          },
          manage: {
            title: 'Wissenszugriff verwalten',
            description:
              'Ändern Sie, wer auf jeden Ordner und Artikel zugreifen darf, und behalten Sie den Zugriff auf alles bei. Systemwissen braucht alles',
            related: 'Wissenszugriff verwalten (dazugehörige Bereiche)',
            relatedLabel: 'Räume, die mit mir in Zusammenhang stehen',
            relatedHint:
              'Die Anwendung entscheidet, welche Räume sich auf wen beziehen',
            all: 'Wissenszugriff verwalten (alle)',
          },
        },
      },
    },
  },
  knowledge: {
    directory: {
      title: 'Wissen',
      system: 'Systemwissen',
      count_one: '{{count}}-Dokument',
      count_other: '{{count}}-Dokumente',
      archivedCount_one: '{{count}} archiviertes Dokument',
      archivedCount_other: '{{count}} archivierte Dokumente',
      selectTarget: 'Öffnen Sie {{title}}',
      target: 'Erstellen in {{title}}',
      chooseTarget:
        'Wählen Sie ein Projekt oder Systemwissen aus, in dem erstellt werden soll',
      expandAll: 'Alles erweitern',
      collapseAll: 'Alles zusammenbrechen',
      retry: 'Erneut versuchen',
      allProposals: 'Alle Vorschläge',
      reviewPage: 'Seite {{page}} von {{pages}} · {{total}} insgesamt',
      previous: 'Zurück',
      next: 'Weiter',
      empty: 'Keine zugänglichen Wissensräume',
      emptyAccessHint:
        'Bitten Sie einen Administrator um Zugriff auf Projekt- oder Systemwissen.',
      noAccess:
        'Dieses Wissen ist nicht verfügbar oder Sie haben keinen Zugriff mehr.',
      emptyHint:
        'Öffnen Sie diesen Bereich, um ein Dokument zu erstellen, oder bitten Sie einen Redakteur, eines hinzuzufügen.',
      createFailed:
        'Dieser Eintrag konnte nicht erstellt werden. Überprüfen Sie das Ziel und versuchen Sie es erneut.',
      showResults: 'Top-Ergebnisse für „{{q}}“ anzeigen',
      topResults:
        'Bestbewertete Abschnitte über alle Projekte und Systemkenntnisse.',
      welcome:
        'Erweitern Sie ein Projekt oder ein freigegebenes Systemwissen, um Dokumente zu durchsuchen. Wählen Sie einen Bereich aus, den Sie dort erstellen möchten, oder durchsuchen Sie alle autorisierten Daten.',
    },
    title: 'Wissen',
    someone: 'Jemand',
    loading: 'Wird geladen',
    index: {
      states: {
        pending: 'Warten',
        done: 'Indiziert',
        failed: 'Fehlgeschlagen',
      },
      done: 'Indiziert',
      pending: 'Indizierung {{indexed}}/{{total}}',
      failed: 'Die Indizierung ist fehlgeschlagen',
      failedHint:
        'Einige Abschnitte konnten nach jedem Versuch nicht eingebettet werden.',
      reason: 'Grund: {{reason}}',
      retry: 'Index erneut',
      refreshFailed: 'Der Indexierungsstatus konnte nicht aktualisiert werden',
      retryRefresh: 'Aktualisierung erneut versuchen',
      queued: 'Erneut in der Warteschlange für die Indizierung',
    },
    chunks: {
      open: 'Abschnitte anzeigen',
      title: 'Abschnitte',
      description:
        'Die {{count}}-Abschnitte, in die die aktuelle Version von „{{title}}“ eingeschnitten ist; Suche und Zitate funktionieren Abschnitt für Abschnitt. Wählen Sie eines aus, um es im Dokument zu finden.',
      lead: '(Vor der ersten Überschrift)',
      lines: 'Linien {{start}}–{{end}}',
      chars_one: '{{count}}-Zeichen',
      chars_other: '{{count}}-Zeichen',
      empty: 'Dieses Dokument hat noch keine Abschnitte.',
      showing: 'Hervorhebung der Linien {{start}}–{{end}}.',
      clear: 'Deutliche Hervorhebung',
    },
    chunking: {
      title: 'Abschnittseinstellungen',
      description:
        'Artikel und Dateien (ihr extrahierter Text) in {{space}} werden an ihren Überschriften für die Suche und Zitierung in Abschnitte geschnitten: Word behält seine eigenen Überschriften, jede PDF- oder Folienseite und jedes Blatt ist eine Überschrift der Ebene 2, und Text ohne Überschriften wird nach Länge geschnitten. Dieser Raum kann anders als standardmäßig ausgeschnitten werden.',
      own: 'Für diesen Bereich festgelegt',
      defaults:
        'Standard: Überschriften nach unten bis zur Ebene {{depth}}, Ziel sind {{target}}-Zeichen, höchstens {{max}}.',
      depth: 'An Überschriften schneiden',
      depths: {
        '1': 'Nur Level 1 (#)',
        '2': 'Bis zur Ebene 2 (##)',
        '3': 'Bis zur Ebene 3 (###)',
      },
      depthHint:
        'Tiefere Überschriften bleiben in ihrem Abschnitt. Nur auf Ebene 1 werden Dateien nicht nach Seite oder Blatt geschnitten.',
      target: 'Ziellänge (Zeichen)',
      max: 'Limit (Zeichen)',
      sizesHint:
        'Ein Abschnitt, der länger als das Limit ist, wird zwischen den Absätzen in der Nähe des Ziels in Stücke geschnitten; Codeblöcke und Tabellen werden niemals ausgeschnitten.',
      invalid:
        'Die Längen sind {{min}} bis {{max}}, und das Ziel ist höchstens die Grenze.',
      effect:
        'Beim Speichern werden die Dokumente erneut im Hintergrund ausgeschnitten und ihre Abschnitte neu indiziert, wenn die semantische Suche aktiviert ist.',
      rechunking: 'Erneutes Schneiden der Dokumente im Hintergrund…',
      save: 'Speichern',
      saved: 'Abschnittseinstellungen gespeichert',
    },
    loadFailed: 'Das Wissen konnte nicht geladen werden',
    kinds: {
      folder: 'Ordner',
      article: 'Artikel',
      file: 'Datei',
    },
    folder: {
      empty: 'Dieser Ordner ist leer.',
    },
    new: {
      label: 'Neu',
      article: 'Neuer Artikel',
      folder: 'Neuer Ordner',
      childArticle: 'Neuer Artikel im Inneren',
      childFolder: 'Neuer Ordner darin',
    },
    files: {
      upload: 'Dateien hochladen',
      uploadHere: 'Dateien hier hochladen',
      dropHint:
        'Legen Sie Dateien hier oder in einem Ordner ab, um sie hochzuladen.',
      uploaded_one: '{{count}}-Datei hochgeladen; Sein Text wird extrahiert.',
      uploaded_other:
        'Hochgeladene {{count}}-Dateien; Ihr Text wird extrahiert.',
      download: 'Herunterladen',
      version: 'Version {{version}}',
      statusHint: {
        parsing:
          'Der Text wird extrahiert; Die Suche findet die Datei, sobald sie fertig ist.',
        ready:
          'Der Text wird extrahiert, sodass die Suche und die Agenten ihn lesen können.',
        failed: 'Der Text konnte nicht extrahiert werden.',
        unsupported:
          'Text wird aus Dateien dieses Typs nicht extrahiert; es wird so gespeichert, wie es ist.',
      },
      replace: 'Ersetzen',
      replaced: 'Ersetzt: Version {{version}}.',
      reparse: 'Erneut extrahieren',
      file: 'Datei',
      propose: 'Schlagen Sie vor',
      proposeNew: 'Eine Datei vorschlagen',
      proposeNewHint:
        'Jemand, der dieses Wissen bearbeiten darf, entscheidet; Wenn Sie es akzeptieren, wird die Datei hinzugefügt.',
      proposeReplace: 'Schlagen Sie einen Ersatz vor',
      proposeReplaceHint:
        'Jemand, der dieses Wissen bearbeiten darf, entscheidet; Wenn Sie es akzeptieren, wird Ihre Datei zur nächsten Version von {{title}}.',
      proposeReasonHint: 'Warum es hierher gehört, wer auch immer entscheidet.',
      proposed: 'Vorgeschlagen; jemand, der redigieren darf, entscheidet.',
      preview: 'Vorschau',
      text: 'Extrahierter Text',
      failed: 'Der Text konnte nicht extrahiert werden: {{reason}}',
      status: {
        parsing: 'Text extrahieren',
        ready: 'Text extrahiert',
        failed: 'Extraktion fehlgeschlagen',
        unsupported: 'Nur gespeichert',
      },
      noText: {
        parsing:
          'Der Text wird extrahiert; Sobald es fertig ist, erscheint es hier.',
        ready: 'Die Datei enthält keinen Text.',
        failed: 'Der Text konnte nicht extrahiert werden.',
        unsupported:
          'Text wird aus Dateien dieses Typs nicht extrahiert; Die Datei wird unverändert gespeichert.',
      },
    },
    spaces: {
      actions: 'Weltraumaktionen',
      access: 'Weltraumzugriff',
      proposeOnly: 'Nur vorschlagen',
      inherited: 'Vererbt',
      inheritedHint: 'Von einem anderen Raum geerbt; hier schreibgeschützt.',
      default: 'Wissen',
      readOnly: 'Schreibgeschützt',
      empty: 'Noch keine Dokumente.',
    },
    tree: {
      actions: 'Aktionen',
      expand: 'Erweitern',
      collapse: 'Zusammenbruch',
      label: 'Dokumente',
      newDoc: 'Neues Dokument',
      archived: 'Show archiviert',
      archivedBadge: 'Archiviert',
      pending: '{{count}} wartet',
      back: 'Alle Dokumente',
      restricted:
        'Eingeschränkt: Nur die aufgeführten Personen dürfen darauf zugreifen',
    },
    doc: {
      permissions: 'Berechtigungen',
      restricted: 'Eingeschränkt · {{count}}',
      restrictedHint:
        'Nur die aufgeführten Personen und derjenige, der den Bereich verwaltet, dürfen darauf zugreifen.',
      verifiedLabel: 'Verifiziert',
      versionBy: 'v{{version}} · {{name}}',
      proposeChanges: 'Änderungen vorschlagen',
      more: 'Weitere Aktionen',
      pending_one: '{{count}} ausstehend',
      pending_other: '{{count}} ausstehend',
      updatedAgo: '{{time}} aktualisiert',
      updatedDetail: '{{name}} · v{{version}}',
      renameTitle: '„{{title}}“ umbenennen',
      renamedToast: 'Umbenannt.',
      notFound:
        'Dieses Dokument existiert nicht mehr oder wird möglicherweise nicht angezeigt.',
      notVerified: 'Noch nicht verifiziert',
      contents: 'Inhalt',
      edit: 'Bearbeiten',
      rename: 'Umbenennen',
      history: 'Geschichte',
      verify: 'Markus bestätigt',
      verifiedToast: 'Als verifiziert markiert.',
      archive: 'Archivieren',
      archiveTitle: 'Archiv „{{title}}“?',
      archiveDescription:
        'Es verschwindet vom Baum und von den Agenten. Sie können es später wiederherstellen; seine Versionen bleiben erhalten.',
      archivedToast: 'Archiviert.',
      restore: 'Wiederherstellen',
      restoredToast: 'Restauriert.',
      move: 'Umzug',
      moveTitle: 'Verschieben Sie „{{title}}“',
      moveTo: 'Unter',
      root: 'Auf der obersten Ebene',
      movedToast: 'Umgezogen.',
      archivedNotice: 'Dieses Dokument ist archiviert und schreibgeschützt.',
      oldVersion: 'Sie lesen die Version {{version}}.',
      backToCurrent: 'Zurück zur aktuellen Version',
      proposals: 'Vorschläge warten',
      empty: 'Dieses Dokument ist leer.',
    },
    editor: {
      editing: 'Bearbeiten',
      proposing: 'Änderungen vorschlagen',
      properties: 'Eigenschaften',
      propertiesHint:
        'Welche Agenten und Links über dieses Dokument gelesen haben.',
      nothingToPreview: 'Es gibt noch keine Vorschau.',
      reasonPlaceholder:
        'Warum sich das ändern sollte, wer auch immer entscheidet',
      submitProposal: 'Vorschlag einreichen',
      proposed: 'Vorgeschlagen; jemand, der redigieren darf, entscheidet.',
      title: 'Titel',
      slug: 'Schnecke',
      slugHint:
        'Kleinbuchstaben, Ziffern und Bindestriche; wie Agenten und Links es benennen. Bleibt es leer, wird es aus dem Titel erstellt.',
      summary: 'Zusammenfassung',
      summaryHint: 'Einzeilige Agenten lesen den Index ein.',
      content: 'Inhalt',
      contentPlaceholder: 'Markdown',
      write: 'Schreiben',
      preview: 'Vorschau',
      note: 'Notiz ändern',
      notePlaceholder: 'Was hat sich geändert, für die Historie (optional)',
      parent: 'Elternteil',
      save: 'Speichern',
      saved: 'Gespeichert als Version {{version}}.',
      unchanged: 'Nichts hat sich geändert.',
      create: 'Erstellen',
      created: 'Dokument erstellt.',
      cancel: 'Abbrechen',
      conflict:
        'Jemand hat die Version {{version}} gespeichert, während Sie die Datei bearbeitet haben. Kopieren Sie Ihren Text, laden Sie ihn neu und übernehmen Sie Ihre Änderung erneut.',
      reload: 'Neu laden',
    },
    history: {
      by: 'von {{name}}',
      title: 'Geschichte',
      current: 'Strom',
      fromProposal: 'Aus einem Vorschlag',
      compare: 'Vergleiche',
      with: 'mit',
      previous: 'die Version davor',
      noChanges: 'Keine Unterschiede.',
      view: 'Anzeigen',
      unchangedLines: '{{count}} unveränderte Zeilen',
      approvedBy: 'genehmigt von {{name}}',
    },
    search: {
      description:
        'Durchsuchen Sie die Dokumente dieses Raums und der von ihm geerbten Räume.',
      hint: 'Geben Sie ein, um nach Titeln und Text zu suchen.',
      emptyHint: 'Versuchen Sie es mit anderen Wörtern oder weniger.',
      all: 'Alle Ergebnisse für „{{q}}“ anzeigen',
      resultsFor: 'Ergebnisse für „{{q}}“',
      placeholder: 'Wissen suchen',
      label: 'Wissen suchen',
      empty: 'Für „{{q}}“ wurde nichts gefunden.',
      results: 'Ergebnisse',
      inherited: 'Vererbt',
    },
    home: {
      emptyTitle: 'Noch keine Dokumente in {{space}}',
      emptyEdit:
        'Schreiben Sie den ersten Artikel oder laden Sie Dateien hoch, um zu beginnen.',
      emptyPropose:
        'Schlagen Sie eine Datei vor, und jemand, der sie bearbeiten darf, entscheidet, ob sie hinzugefügt wird.',
      emptyRead: 'Hier wurde noch nichts geschrieben.',
      count_one: '{{count}}-Dokument',
      count_other: '{{count}}-Dokumente',
      pending_one: 'Warten auf Überprüfung ({{count}})',
      pending_other: 'Warten auf Überprüfung ({{count}})',
      all: 'Alle anzeigen',
      recent: 'Kürzlich aktualisiert',
      updated: '{{time}} · {{name}}',
      unindexed: 'Nicht vollständig indiziert',
      unindexedFailed: '{{failed}} fehlgeschlagen · {{pending}} wartet',
      unindexedPending_one: '{{count}}-Abschnitt wartet',
      unindexedPending_other: '{{count}} Abschnitte warten',
      unverified: 'In letzter Zeit nicht verifiziert',
      verifiedAgo: 'Verifiziert {{time}}',
    },
    diff: {
      changes_one: '{{count}}-Änderung',
      changes_other: '{{count}} ändert sich',
      previous: 'Vorherige Änderung',
      next: 'Nächste Änderung',
      layout: 'Diff-Layout',
      inline: 'Inline',
      split: 'Spaltung',
    },
    access: {
      you: {
        manage: 'Sie können es schaffen',
        edit: 'Sie können bearbeiten',
        propose: 'Sie können vorschlagen',
        read: 'Du kannst lesen',
        none: 'Kein Zugang',
      },
      title: 'Weltraumzugriff',
      description: 'Wer darf in {{space}} lesen, vorschlagen und bearbeiten?',
      yours: 'Ihr Zugang',
      actions: {
        read: 'Lesen Sie die Dokumente und durchsuchen Sie sie',
        propose:
          'Schlagen Sie Änderungen vor, damit jemand, der sie bearbeiten kann, darüber entscheiden kann',
        edit: 'Bearbeiten, organisieren und überprüfen Sie Dokumente und entscheiden Sie über Vorschläge',
        manage: 'Ändern Sie, wer auf jeden Ordner und Artikel zugreifen darf',
      },
      allowed: 'Erlaubt',
      notAllowed: 'Nicht erlaubt',
      matrix: 'Nach Rolle',
      role: 'Rolle',
      columns: {
        read: 'Lesen',
        propose: 'Schlagen Sie vor',
        edit: 'Bearbeiten',
        manage: 'Verwalten',
      },
      from: 'Quelle: {{source}}',
      source: {
        space: 'Ihr Zugang zu {{space}}',
        manager: 'Sie verwalten {{space}}',
        entry: '{{subject}}, eingestellt auf „{{title}}“',
      },
      restrictedAt:
        'Eingeschränkt bei „{{title}}“: Nur die dort aufgeführten Personen dürfen darauf zugreifen.',
      viewOnly: 'Nur wer es verwaltet, darf ändern, wer darauf zugreifen darf.',
      mine: '(dein)',
      howTitle: 'So funktioniert der Zugriff hier',
      agents:
        'Agenten, die für jemanden handeln, lesen und machen höchstens Vorschläge; Sie redigieren oder entscheiden nie.',
      manage: 'Rollenwechsel',
    },
    permissions: {
      title: 'Berechtigungen von „{{title}}“',
      description: {
        folder:
          'Wer darf diesen Ordner und seinen Inhalt lesen, vorschlagen, bearbeiten und verwalten?',
        article:
          'Wer darf diesen Artikel lesen, vorschlagen, bearbeiten und verwalten?',
        file: 'Wer darf diese Datei lesen, vorschlagen, bearbeiten und verwalten?',
      },
      modeLabel: 'Zugriff',
      modes: {
        inherit: 'Vom übergeordneten Element erben',
        custom: 'Nur die aufgeführten Personen',
      },
      inheritHint:
        'Wer auf das übergeordnete Element zugreifen darf, kann auch darauf zugreifen, und die unten hinzugefügten Personen erhalten mindestens ihr Level.',
      customHint:
        'Nur die unten aufgeführten Personen dürfen darauf zugreifen, unabhängig davon, was das übergeordnete Element zulässt. was darunter ist, folgt, sofern es nicht selbst eingeschränkt wird.',
      inherited: 'Vererbt',
      fromSpace: 'Jeder mit Zugriff auf {{space}}, nach seinen Rollen',
      fromDoc: 'Von „{{title}}“',
      fromRestricted:
        'Von „{{title}}“, auf das nur die aufgeführten Personen zugreifen dürfen',
      added: 'Hat auch Zugriff',
      listed: 'Personen aufgelistet',
      add: 'Personen hinzufügen',
      addPlaceholder: 'Personen, Rollen hinzufügen…',
      noMatches: 'Keine Übereinstimmungen.',
      noneAdded: 'Niemand über das hinaus, was vererbt wird.',
      noneListed:
        'Niemand gelistet: Nur wer den Raum verwaltet, darf darauf zugreifen.',
      managers:
        'Wer den Raum verwaltet, behält immer Zugriff. Agenten lesen und schlagen höchstens vor, und nur das, was sie und ihre Person tun dürfen.',
      levelOf: 'Level von {{subject}}',
      levels: {
        read: 'Kann lesen',
        propose: 'Kann vorschlagen',
        edit: 'Kann bearbeiten',
        manage: 'Kann es schaffen',
      },
      remove: 'Entfernen',
      removedSubject: 'Entfernt ({{id}})',
      save: 'Speichern',
      close: 'Schließen',
      saved: 'Berechtigungen gespeichert.',
      loadFailed: 'Die Berechtigungen konnten nicht geladen werden.',
    },
    searchTest: {
      title: 'Suchtest',
      description:
        'Führt eine Suche wie gewohnt durch und zeigt die Rangfolge jedes Treffers an: seine Relevanz, seinen Rang nach Schlüsselwörtern und nach Bedeutung, den Reranking-Score und wo er sich im Dokument befindet.',
      keyword: 'Schlüsselwörter',
      semantic: 'Bedeutung',
      relevance: 'Relevanz {{score}}',
      rank: '{{name}} #{{rank}} · {{score}}',
      unranked: '{{name}}: nicht gefunden',
      lines: 'Linien {{start}}–{{end}}',
      notExplained:
        'Ranking-Details werden nur Personen angezeigt, die den Bereich oder die Sucheinstellungen verwalten.',
      query: 'Wörter, nach denen gesucht werden soll',
      run: 'Suchen',
      fused: 'Kombiniert: {{score}}',
      provider: '{{name}} #{{rank}} · {{score}}',
      reranked: '{{score}} neu eingestuft',
      notReranked: 'Nicht neu eingestuft',
    },
    proposals: {
      listTitle: 'Vorschläge',
      statuses: {
        pending: 'Ausstehend',
        accepted: 'Akzeptiert',
        rejected: 'Abgelehnt',
        withdrawn: 'Zurückgezogen',
      },
      none: {
        pending: 'Nichts wartet auf eine Überprüfung.',
        accepted: 'Noch keine angenommenen Vorschläge.',
        rejected: 'Keine abgelehnten Vorschläge.',
      },
      about: 'Auf „{{title}}“',
      clearAbout: 'Alle Vorschläge anzeigen',
      onBehalf: '{{proposer}} im Namen von {{person}}',
      overview: 'Übersicht',
      changes: 'Änderungen',
      staleTitle: 'Das Dokument wurde seitdem geändert',
      decision: 'Entscheidung',
      commentLabel: 'Kommentar',
      pendingEntry: 'Überprüfung steht noch aus · {{count}}',
      kinds: {
        update: 'Veränderung',
        create: 'Neues Dokument',
        verify: 'Hält immer noch',
      },
      by: '{{proposer}} für {{person}}',
      from: 'Von {{source}}',
      reason: 'Grund',
      summary: 'Zusammenfassung',
      stale:
        'Das Dokument hat sich seit dem Schreiben geändert (v{{base}} → v{{current}}). Durch das Akzeptieren wird die aktuelle Version durch den gesamten Vorschlag ersetzt.',
      diffProposed: 'Vorgeschlagene Änderung (v{{base}} → Vorschlag)',
      diffCurrent: 'Gegen die aktuelle Version (v{{current}} → Vorschlag)',
      newContent: 'Vorgeschlagener Inhalt',
      newFile: 'Vorgeschlagene Datei',
      replacementFile: 'Ersatz für Version {{base}}',
      fileNote: 'Der Text wird extrahiert, sobald er akzeptiert wurde.',
      verifyNote:
        'Es ändert sich nichts am Dokument; es ist heute als verifiziert markiert.',
      accept: 'Akzeptiere',
      acceptAnyway: 'Akzeptiere es trotzdem',
      reject: 'Ablehnen',
      comment: 'Kommentar (optional)',
      accepted: 'Akzeptiert.',
      rejected: 'Abgelehnt.',
      decided: '{{outcome}} von {{name}}',
      open: 'Öffnen',
      readOnly:
        'Jemand, der dieses Wissen bearbeiten darf, entscheidet darüber.',
    },
  },
  errors: {
    KNOWLEDGE_PROPOSAL_PENDING:
      'Ihr früherer Vorschlag für dieses Dokument wartet noch; es muss erst einmal entschieden werden.',
    KNOWLEDGE_PROPOSAL_REJECTED:
      'Die gleiche Änderung wurde zuvor abgelehnt; etwas anderes vorschlagen.',
    EMPTY_CONTENT: 'Der vorgeschlagene Inhalt ist leer.',
    INVALID_REASON:
      'Sagen Sie, warum es sich ändern sollte (höchstens 500 Zeichen).',
    KNOWLEDGE_VERSION_CONFLICT:
      'Jemand hat inzwischen eine neuere Version gespeichert; Laden Sie die Änderung neu und übernehmen Sie sie erneut.',
    KNOWLEDGE_SLUG_TAKEN:
      'Ein anderes Dokument in diesem Bereich hat diesen Fehler.',
    KNOWLEDGE_HAS_CHILDREN:
      'Zuerst die Unterdokumente archivieren oder verschieben.',
    KNOWLEDGE_ARCHIVED:
      'Das Dokument wird archiviert; Stellen Sie es zuerst wieder her.',
    KNOWLEDGE_DEPTH_EXCEEDED:
      'Dokumente sind höchstens vier Ebenen tief verschachtelt.',
    KNOWLEDGE_INVALID_MOVE:
      'Ein Dokument kann weder unter sich selbst noch unter einem eigenen Dokument stehen.',
    KNOWLEDGE_PROPOSAL_STALE:
      'Das Dokument wurde seit der Erstellung des Vorschlags geändert.',
    KNOWLEDGE_PROPOSAL_DECIDED: 'Dieser Vorschlag wurde bereits beschlossen.',
    INVALID_SLUG:
      'Der Slug akzeptiert Kleinbuchstaben, Ziffern und Bindestriche.',
    INVALID_TITLE: 'Ein Titel ist erforderlich (höchstens 200 Zeichen).',
    FILE_TOO_LARGE: 'Die Datei ist zu groß.',
    FILES_UNAVAILABLE: 'Diese Anwendung speichert keine Dateien.',
    INVALID_FILE: 'Eine Datei senden.',
    INVALID_PARENT: 'Nichts geht unter eine Datei.',
    KNOWLEDGE_NOT_FAILED:
      'Nur eine Datei, deren Text nicht extrahiert werden konnte, wird erneut extrahiert.',
  },
  ui: {
    nav: {
      knowledge: 'Wissen',
    },
  },
  common: {
    forbidden: 'Sie haben dazu keine Berechtigung.',
    requestFailed:
      'Die Anfrage ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
  },
};

export default deDE;
