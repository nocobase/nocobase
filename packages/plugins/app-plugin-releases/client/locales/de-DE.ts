import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  access: {
    section: 'Releases',
    pages: {
      'rel-apps': 'Apps',
    },
    businessSection: 'Releases',
    businesses: {
      apps: {
        title: 'Apps',
        description:
          'Apps, ihre Veröffentlichungen, Bereitstellungen und Laufzeit.',
        actions: {
          view: {
            title: 'Apps anzeigen',
            description:
              'Siehe Apps, ihre Releases, Bereitstellungen und Laufzeitstatus',
            related: 'Apps anzeigen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps anzeigen (alle)',
          },
          readLogs: {
            title: 'Protokolle lesen',
            description: 'App- und Bereitstellungsprotokolle lesen',
            related: 'Protokolle lesen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Protokolle lesen (alle)',
          },
          create: {
            title: 'Apps erstellen',
            description: 'Erstellen Sie Apps in einer Umgebung',
            all: 'Apps erstellen',
          },
          configure: {
            title: 'Apps konfigurieren',
            description:
              'Lesen und ändern Sie die Konfiguration einer App, die möglicherweise Geheimnisse birgt',
            related: 'Apps konfigurieren (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps konfigurieren (alle)',
          },
          upload: {
            title: 'Veröffentlichungen hochladen',
            description: 'Veröffentlichungen hochladen und bewerben',
            related: 'Veröffentlichungen hochladen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Veröffentlichungen hochladen (alle)',
          },
          deploy: {
            title: 'Bereitstellen',
            description:
              'Bereitstellung und Rollback in ungeschützten Umgebungen, Anforderung von Bereitstellungen in geschützten Umgebungen',
            related: 'Deploy (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Bereitstellen (alle)',
          },
          deployProtected: {
            title: 'Geschützte Bereitstellungen genehmigen',
            description:
              'Genehmigen Sie Bereitstellungen in geschützten Umgebungen, in denen keine Genehmiger benannt sind. Nur Menschen',
            related:
              'Geschützte Bereitstellungen genehmigen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Geschützte Bereitstellungen genehmigen (alle)',
          },
          operate: {
            title: 'Starten und stoppen',
            description: 'Apps starten, stoppen und neu starten',
            related: 'Start und Stopp (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Start und Stopp (alle)',
          },
          delete: {
            title: 'Apps löschen',
            description: 'Löschen Sie eine App mit ihren Daten',
            related: 'Apps löschen (die damit verbundenen)',
            relatedLabel: 'Die, die ich erschaffen habe',
            relatedHint:
              'Apps, die ich erstellt habe, und alle Apps, die sich auf mich beziehen',
            all: 'Apps löschen (alle)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Apps, die sie erstellt haben',
    },
    settings: {
      rel: {
        environments: 'Umgebungen bereitstellen',
      },
    },
    keyScopes: {
      apps: {
        title: 'Apps und Bereitstellungen',
        description:
          'Lesen: Apps, Releases, Bereitstellungen und Protokolle anzeigen. Lesen und schreiben: auch Veröffentlichungen hochladen. Admin: Apps auch bereitstellen und starten oder stoppen.',
        objects: 'Apps',
      },
      environments: {
        title: 'Umgebungen bereitstellen',
        description:
          'Lesen: Umgebungen auflisten. Lesen und schreiben: Verwalten Sie sie.',
      },
      presets: {
        ciDeploy: {
          title: 'CI-Bereitstellung',
          description:
            'Laden Sie Releases auf die ausgewählten Apps hoch und stellen Sie sie 90 Tage lang bereit.',
        },
        ciUpload: {
          title: 'CI-Upload',
          description:
            'Laden Sie 90 Tage lang Releases auf die ausgewählten Apps hoch, ohne sie bereitzustellen.',
        },
      },
    },
    actions: {
      read: 'Anzeigen',
      manage: 'Verwalten',
      view: 'Anzeigen',
      'read-logs': 'Protokolle lesen',
      create: 'Erstellen',
      configure: 'Konfigurieren',
      upload: 'Veröffentlichungen hochladen',
      deploy: 'Bereitstellen',
      'deploy-protected': 'Geschützte Bereitstellungen genehmigen',
      operate: 'Starten und stoppen',
      delete: 'Löschen',
    },
  },
  drivers: {
    host: 'Dieser Server',
  },
  ui: {
    nav: {
      apps: 'Apps',
      environments: 'Umgebungen bereitstellen',
    },
    apps: {
      title: 'Apps',
      description:
        'Anwendungen, ihre Veröffentlichungen und der Ort, an dem sie bereitgestellt werden.',
      search: 'Suche nach ID oder Name',
      create: 'App erstellen',
      id: 'App-ID',
      name: 'Name',
      environment: 'Umgebung',
      version: 'Version',
      state: 'Zustand',
      url: 'Adresse',
      labels: 'Etiketten',
      loadFailed: 'Die Apps konnten nicht geladen werden.',
      loadOneFailed: 'Die App konnte nicht geladen werden.',
      emptyTitle: 'Noch keine Apps',
      emptyNoAccess: 'Bitten Sie einen Administrator, eine App zu erstellen.',
      emptyDescription:
        'Erstellen Sie eine App, laden Sie dann eine Version hoch und stellen Sie sie in einer Umgebung bereit.',
      noResults: 'Keine App entspricht der Suche.',
      created: '{{name}} erstellt.',
      createDescription:
        'Eine App wird in einer Umgebung bereitgestellt. Die Veröffentlichungen werden anschließend hochgeladen.',
      idHint:
        'Buchstaben, Ziffern, Unterstriche und Bindestriche; Teil seiner Adresse. Es kann sich später nicht mehr ändern.',
      noEnvironment: 'Noch keine Umgebung',
      lastAccess: 'Letzter Besuch',
    },
    advanced: 'Erweitert (optional)',
    labels: {
      name: 'Name',
      value: 'Wert',
      nameOf: 'Name des Labels {{index}}',
      valueOf: 'Wert des Labels {{index}}',
      remove: 'Etikett {{index}} entfernen',
      add: 'Beschriftung hinzufügen',
      hint: 'Mithilfe von Labels können Tools und Personen Apps und Releases finden und gruppieren.',
      count_one: '{{count}}-Label',
      count_other: '{{count}}-Beschriftungen',
      system: 'Vom System hinzugefügte Beschriftungen',
      systemHint: 'Vom System hinzugefügt; es kann hier nicht geändert werden.',
      errors: {
        keyRequired: 'Geben Sie einen Namen für diesen Wert ein.',
        keyInvalid:
          'Verwenden Sie Buchstaben, Ziffern, „.“, „_“, „/“ oder „-“, beginnend mit einem Buchstaben oder einer Ziffer (höchstens 63).',
        keyDuplicate: 'Dieser Name wird bereits verwendet.',
        valueTooLong: 'Höchstens {{max}}-Zeichen.',
        tooMany: 'Höchstens {{max}}-Labels.',
      },
    },
    policy: {
      title: 'Laufzeitumgebung',
      activationLabel: 'Starten',
      activation: {
        eager: 'Immer rennend',
        onDemand: 'Beginnt zu Besuch',
      },
      activationHint: {
        eager:
          'Wird bei der Bereitstellung und bei jedem Neustart der Laufzeit gestartet.',
        onDemand:
          'Wird beim ersten Besuch nach einer Bereitstellung oder einem Laufzeitneustart gestartet.',
      },
      idleLabel: 'Halten Sie an, wenn Sie keinen Besuch abstatten',
      dormantLabel: 'Winterschlaf halten, wenn er nicht besucht wird',
      idleModeLabel: 'Verhalten des Leerlauf-Timers',
      dormantModeLabel: 'Verhalten des Ruhezustands-Timers',
      minutes: 'Minuten',
      hours: 'Stunden',
      neverIdle: 'Niemals',
      neverDormant: 'Niemals',
      timerMode: {
        inherit: 'Umgebungsvorgabe verwenden',
        custom: 'Benutzerdefinierten Wert festlegen',
      },
      customTimerHint:
        'Ein leerer benutzerdefinierter Wert deaktiviert diesen Timer; die Umgebungsvorgabe wird dann nicht verwendet.',
      idleSummary: 'stoppt nach {{minutes}} Minuten ohne Besuch',
      dormantSummary: 'Winterschlaf nach {{hours}} h',
      timersHint:
        'Eine gestoppte App gibt ihren Speicher frei und startet beim nächsten Besuch erneut. Bei einer App im Ruhezustand werden auch die entpackten Dateien entfernt. Konfiguration und Daten bleiben erhalten und werden beim nächsten Besuch erneut aufbereitet, was länger dauert.',
      unsupported:
        'Diese Umgebung unterstützt den Start bei Besuch nicht. Die App läuft weiter.',
      errors: {
        idleInvalid:
          'Geben Sie ganze Minuten von 1 bis {{max}} ein oder lassen Sie das Feld leer.',
        dormantInvalid:
          'Geben Sie Stunden von 0,02 (eine Minute) bis {{max}} ein oder lassen Sie das Feld leer.',
        dormantBeforeIdle: 'Der Winterschlaf muss nach dem Stopp erfolgen.',
      },
    },
    state: {
      pending: 'Beginnt',
      starting: 'Beginnt',
      running: 'Wird ausgeführt',
      stopped: 'Angehalten',
      stoppedOnDemand: 'Angehalten (beginnt bei Besuch)',
      dormant: 'Winterschlaf (bei Besuch vorbereitet)',
      failed: 'Fehlgeschlagen',
      unknown: 'Unbekannt',
      deploying: 'Bereitstellung',
    },
    operate: {
      refreshFailed:
        'Der App-Status konnte nicht aktualisiert werden. Vorgänge sind nicht verfügbar, bis der Status aktualisiert wird. Überprüfen Sie Ihre Verbindung und Ihren Zugriff und versuchen Sie es dann erneut.',
      disabled: {
        busy: 'Ein Vorgang wird ausgeführt.',
        unavailable:
          'Der App-Status ist nicht verfügbar. Aktualisieren Sie den Status, bevor Sie die App ausführen.',
        deploying: 'Eine Bereitstellung ist im Gange.',
        starting: 'Die App wird gestartet.',
        notDeployed: 'Stellen Sie zuerst ein Release bereit.',
        alreadyRunning: 'Die App läuft bereits.',
        notRunning: 'Die App läuft nicht.',
      },
      start: 'Starten',
      stop: 'Stoppen',
      restart: 'Neustart',
      done: {
        start: 'Die App wird gestartet.',
        stop: 'Die App wurde gestoppt.',
        restart: 'Die App wird neu gestartet.',
      },
    },
    releases: {
      title: 'Releases',
      upload: 'Laden Sie eine Veröffentlichung hoch',
      uploadAction: 'Hochladen',
      commit: 'Commit',
      commitHint:
        'Optional: Der Commit, aus dem dieses Archiv erstellt wurde, wird als SHA-Label gespeichert.',
      uploaded: 'Veröffentlichung hochgeladen.',
      checksum: 'Prüfsumme',
      size: 'Größe',
      created: 'Erstellt',
      empty:
        'Noch keine Veröffentlichung. Laden Sie ein für diese App erstelltes .tar.gz-Paket hoch.',
      loadFailed: 'Die Versionen konnten nicht geladen werden.',
    },
    deploy: {
      deploy: 'Bereitstellen',
      started: 'Bereitstellung von {{version}}.',
      confirmProtected:
        'Diese Umgebung ist geschützt. Geben Sie zum Bereitstellen {{appId}} ein.',
    },
    deployments: {
      title: 'Bereitstellungen',
      kind: 'Freundlich',
      status: 'Status',
      by: 'Von',
      current: 'Strom',
      logs: 'Protokolle',
      rollback: 'Zurückrollen',
      rollbackStarted: 'Zurückrollen.',
      confirmRollbackTitle: 'Rollback {{name}}?',
      confirmRollback:
        'Die App kehrt zur Version dieser Bereitstellung zurück; was seitdem eingesetzt wurde, wird zurückgenommen.',
      loadFailed: 'Die Bereitstellungen konnten nicht geladen werden.',
      empty: 'Noch nicht bereitgestellt.',
      hideLogs: 'Protokolle ausblenden',
      noLogs: 'Keine Protokollzeilen.',
      statuses: {
        queued: 'In der Warteschlange',
        deploying: 'Bereitstellung',
        succeeded: 'Erfolgreich',
        failed: 'Fehlgeschlagen',
      },
    },
    actors: {
      human: 'Person',
      agent: 'Agent',
      key: '-Taste',
      rule: 'Regel',
      system: '-System',
    },
    requests: {
      title: 'Bereitstellungsanfragen',
      pendingApproval: 'Genehmigung steht aus',
      notice: {
        deploy: 'angefordert, {{version}} auf {{environment}} bereitzustellen',
        rollback: 'angefordert, {{environment}} auf {{version}} zurückzusetzen',
      },
      someone: 'Jemand',
      review: 'Rezension',
      view: 'Anzeigen',
      comment: 'Kommentar (optional)',
      decideFailed: 'Die Entscheidung wurde nicht angenommen',
      request: 'Bereitstellung anfordern',
      created: 'Bereitstellung angefordert.',
      approve: 'Genehmigen',
      confirmApproveTitle: 'Den Einsatz von {{appId}} genehmigen?',
      reject: 'Ablehnen',
      cancel: 'Zurückziehen',
      requestedBy: 'Angefordert von',
      decidedBy: 'Beschlossen von',
      note: 'Notiz',
      approvedToast: 'Genehmigte den Einsatz von {{appId}}.',
      rejectedToast: 'Die Bereitstellung von {{appId}} wurde abgelehnt.',
      app: 'App',
      commit: 'Commit',
      build: 'Bauen',
      ciLog: 'CI-Protokoll',
      requestedAt: 'Angefordert',
      decisionNote: 'Entscheidungsvermerk',
      pinned: 'Prüfsumme {{checksum}}; approving setzt genau dies um',
      loadFailed: 'Die Bereitstellungsanforderung konnte nicht geladen werden.',
      detailTitle: {
        deploy: 'Bereitstellungsanforderung für {{appId}}',
        rollback: 'Rollback-Anfrage für {{appId}}',
      },
      reviewTitle: {
        deploy: 'Überprüfen Sie die Bereitstellungsanforderung für {{appId}}',
        rollback: 'Überprüfen Sie die Rollback-Anfrage für {{appId}}',
      },
      done: {
        approve: 'Antrag genehmigt.',
        reject: 'Anfrage abgelehnt.',
        cancel: 'Antrag zurückgezogen.',
      },
      kind: {
        deploy: 'Bereitstellen',
        rollback: 'Rollback',
      },
      status: {
        pending: 'Ausstehend',
        approved: 'Genehmigt',
        rejected: 'Abgelehnt',
        cancelled: 'Zurückgezogen',
        deployed: 'Eingesetzt',
        failed: 'Fehlgeschlagen',
      },
    },
    variables: {
      title: 'Variablen',
      description:
        'Umgebungsvariablen, mit denen diese App ausgeführt wird. Jede Änderung wird sofort gespeichert und erreicht die App bei der nächsten Bereitstellung.',
      environmentDescription:
        'Jede App in dieser Umgebung, einschließlich Pull-Request-Vorschauen, erhält diese, es sei denn, sie legt ihre eigenen fest. Aufgelistet mit dem, was der neueste Build jeder App deklariert. Änderungen werden sofort gespeichert und gelangen bei der nächsten Bereitstellung in eine App.',
      add: 'Variable hinzufügen',
      name: 'Name',
      value: 'Wert',
      source: 'Quelle',
      secret: 'Geheimnis',
      secretHint:
        'Ein einmal gespeichertes Geheimnis wird nie wieder angezeigt.',
      nameHint:
        'Großbuchstaben, Ziffern und Unterstriche, beginnend mit einem Buchstaben.',
      invalidName:
        'Verwenden Sie Großbuchstaben, Ziffern und Unterstriche, beginnend mit einem Buchstaben.',
      valueOf: 'Wert von {{name}}',
      set: 'Eingestellt',
      notSet: 'Nicht festgelegt',
      sources: {
        app: 'App',
        environment: 'Aus der Umgebung',
        configFile: 'config.yml',
        generated: 'Erstellt',
        default: 'Standard',
        unset: 'Unscharf',
      },
      tags: {
        required: 'Erforderlich',
        secret: 'Geheimnis',
        firstStartOnly: 'Nur beim ersten Start',
        changed: 'Geändert – Neustart erforderlich',
        missing: 'Vermisst',
        undeclared: 'Nicht deklariert',
      },
      setValue: 'Wert einstellen',
      replace: 'Ersetzen',
      override: 'Überschreiben',
      overrideOf: '{{name}} überschreiben',
      overrideTitle: '{{name}} überschreiben',
      overrideHint:
        'Diese App verwendet diesen Wert anstelle des Werts ihrer Umgebung. Sofort gespeichert; Die App erhält es bei ihrer nächsten Bereitstellung.',
      savedAtOnce:
        'Sofort gerettet; Die App erhält es bei ihrer nächsten Bereitstellung.',
      updated: 'Aktualisiert',
      clear: 'Leeren',
      addTitle: 'Variable hinzufügen',
      setTitle: '{{name}} einstellen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      saved: '{{name}} gespeichert.',
      cleared: '{{name}} gelöscht.',
      loadFailed: 'Die Variablen konnten nicht geladen werden.',
      emptyTitle: 'Keine Variablen',
      emptyDescription:
        'Die Version gibt an, dass „keine“ und „keine“ festgelegt sind. Fügen Sie eine hinzu, um sie an die App zu übergeben.',
      emptyEnvironmentTitle: 'Noch keine Variablen',
      emptyEnvironment:
        'Fügen Sie eine hinzu, um sie an jede App in dieser Umgebung weiterzugeben.',
      emptyEnvironmentReadOnly:
        'Bitten Sie einen Administrator, einen hinzuzufügen.',
      noManifest:
        'Diese Version deklariert ihre Variablen nicht, daher werden vor einer Bereitstellung keine überprüft.',
      basis:
        'Wird als neuester Build ({{version}}) aufgeführt, der sie deklariert. Der eigene Wert der App steht vor dem ihrer Umgebung.',
      noBuildTitle: 'Noch kein Bau',
      noBuildDescription:
        'Variablen erscheinen hier, sobald der erste Build der App hochgeladen wird. Sie können jetzt eines manuell hinzufügen.',
      noBuild: 'Noch kein Build: Dies sind von Hand festgelegte Werte.',
      undeclaredTitle: 'Nicht deklariert',
      undeclaredDescription:
        'Der neueste Build deklariert diese nicht. Sie erreichen immer noch die App; Löschen Sie den eigenen Wert der App, wenn er nicht benötigt wird.',
      setOnEnvironment: 'Auf Umgebung eingestellt',
      setOnApp: 'In dieser App eingestellt',
      declaredBy: 'Erklärt von',
      status: 'Status',
      noApps: 'Keine App deklariert es',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: 'Fehlt in der {{count}}-App',
      missingIn_other: 'Fehlt in {{count}}-Apps',
      missingInTitle: 'Erforderlich und kein Wert für: {{apps}}',
      environmentSet: 'Hier einstellen',
      environmentNotSet: 'Hier nicht eingestellt',
      missingTitle: 'Erforderliche Variablen sind nicht festgelegt',
      missingDescription:
        '{{names}} muss festgelegt werden, bevor der neueste Build bereitgestellt werden kann: in der Umgebung für jede App dort oder nur für diese App.',
      review: 'Variablen überprüfen',
      changedTitle: 'Variablenänderungen werden nicht übernommen',
      changedDescription:
        'Eine Variable hat sich seit der Bereitstellung der App geändert. Es wird wirksam, wenn die App erneut bereitgestellt wird.',
      apply: 'Anwenden und neu starten',
      applied: 'Erneute Bereitstellung mit den neuen Variablen.',
      needs_one: 'Benötigt die Variable {{count}}',
      needs_other: 'Benötigt {{count}}-Variablen',
      missing: '{{count}} fehlt',
      bulk: {
        edit: 'Massenbearbeitung',
        title: 'Massenbearbeitung von Variablen',
        reviewTitle: 'Änderungen überprüfen',
        description:
          'Fügen Sie KEY=value-Zeilen ein oder bearbeiten Sie sie, wie in einer .env-Datei. Zeilen, die mit # beginnen, werden ignoriert.',
        appHint:
          'Listet die Werte auf, die diese App selbst festlegt. Werte aus seiner Umgebung und Geheimnisse werden nicht angezeigt: Fügen Sie eine Zeile hinzu, um eine zu überschreiben oder zu ersetzen. Durch das Entfernen einer Zeile wird dieser Wert gelöscht.',
        environmentHint:
          'Listet die Werte dieser Umgebung auf. Geheimnisse werden nicht angezeigt: Fügen Sie eine Zeile hinzu, um eine zu ersetzen. Durch das Entfernen einer Zeile wird dieser Wert gelöscht.',
        label: 'Variablen (.env)',
        review: 'Änderungen überprüfen',
        back: 'Zurück',
        changes: 'Änderungen',
        noChanges: 'Der Text setzt, was bereits vorhanden ist.',
        nothing: 'Keine Änderungen zu speichern',
        unchanged_one: 'Die Variable {{count}} bleibt unverändert.',
        unchanged_other: '{{count}}-Variablen bleiben unverändert.',
        save_one: '{{count}} Änderung speichern',
        save_other: '{{count}} Änderungen speichern',
        saved_one: '{{count}}-Änderung gespeichert.',
        saved_other: '{{count}} Änderungen gespeichert.',
        secretOf: '{{name}} ist ein Geheimnis',
        failedTitle: 'Einige Änderungen wurden nicht gespeichert',
        kinds: {
          add: 'Hinzufügen',
          change: 'Veränderung',
          remove: 'Entfernen',
        },
        problems: {
          syntax: 'Zeile {{line}}: Schreiben Sie es als KEY=Wert.',
          name: 'Zeile {{line}}: {{name}} ist kein gültiger Name. Verwenden Sie Großbuchstaben, Ziffern und Unterstriche, beginnend mit einem Buchstaben.',
          reserved:
            'Zeile {{line}}: {{name}} wird von der Laufzeit gesetzt und kann keine Variable sein.',
          duplicate:
            'Zeile {{line}}: {{name}} ist bereits auf einer früheren Zeile festgelegt.',
          unterminated:
            'Zeile {{line}}: Das Anführungszeichen um den Wert von {{name}} wird nicht geschlossen.',
        },
      },
    },
    tabs: {
      label: 'Abschnitte von {{name}}',
      overview: 'Übersicht',
      deployments: 'Bereitstellungen',
      variables: 'Variablen',
      settings: 'Einstellungen',
    },
    overview: {
      currentRelease: 'Aktuelle Version',
      recent: 'Aktuelle Bereitstellungen',
      viewAll: 'Alle anzeigen',
    },
    initialAdmin: {
      title: 'Erster Administrator',
      expires:
        'Wird für die erste Bereitstellung generiert. Speichern Sie es jetzt: Es wird in {{hours}} h gelöscht.',
      kept: 'Wird für die erste Bereitstellung generiert; Es bleibt erhalten, bis die App entfernt wird.',
      username: 'Benutzername',
      email: 'E-Mail',
      password: 'Passwort',
      show: 'Passwort anzeigen',
      hide: 'Passwort verbergen',
      copy: 'Passwort kopieren',
      copied: 'Passwort kopiert.',
      copyFailed:
        'Das Passwort konnte nicht kopiert werden. Zeigen Sie es an und kopieren Sie es manuell.',
      dismiss: 'Ich habe es gespeichert',
      dismissed:
        'Der erste Administrator wurde aus dem Release Manager gelöscht.',
    },
    config: {
      title: 'Fortgeschritten',
      description:
        'config.yml der bereitgestellten App; Beim Speichern wird die App neu geladen. Bevorzugen Sie Variablen für Werte, die je nach Umgebung unterschiedlich sind, und für Geheimnisse.',
      loadFailed: 'Die Konfiguration konnte nicht geladen werden.',
      discard: 'Änderungen verwerfen',
      save: 'Speichern und neu laden',
      saved: 'Konfiguration gespeichert.',
      external:
        'Diese App liest ihre Konfiguration von außerhalb des Release-Managements, daher gibt es hier kein config.yml zum Bearbeiten. Legen Sie Werte, die je nach Umgebung unterschiedlich sind, als Variablen fest.',
      externalTitle: 'Kein config.yml zum Bearbeiten',
      noFileTitle: 'Noch kein config.yml',
      noFile:
        'config.yml wird durch die erste Bereitstellung erstellt. Bis dahin konfigurieren Sie die App mit Variablen.',
      toVariables: 'Gehe zu Variablen',
      maskedHint:
        'Geheime Werte werden als {{mask}} angezeigt. Lassen Sie die Maske bestehen, um den gespeicherten Wert beizubehalten, oder geben Sie einen neuen Wert darüber ein.',
      secrets: 'Geheimnisse',
      secretsHint:
        'Gespeicherte Werte werden nie angezeigt. Ersetzen oder löschen Sie hier einen; Es wird wirksam, wenn Sie speichern.',
      newValue: 'Neuer Wert für {{path}}',
      replace: '{{path}} ersetzen',
      clear: 'Löschen Sie {{path}}',
    },
    settings: {
      edit: 'Laufzeit und Labels',
      editShort: 'Bearbeiten',
      editDescription:
        'Wann die App ausgeführt wird und wie sie gekennzeichnet ist. Änderungen werden übernommen, ohne dass ein Neustart erforderlich ist.',
      save: 'Speichern',
      saved: 'Einstellungen gespeichert.',
      danger: 'Anwendung löschen',
      delete: 'Mit seinen Daten löschen',
      deleteDescription:
        'Entfernt die App, ihre Versionen, Bereitstellungen und Daten. Dies kann nicht rückgängig gemacht werden.',
      deleted: '{{name}} gelöscht.',
      confirmDeleteTitle: '{{name}} löschen?',
      confirmDelete:
        'Dadurch werden {{appId}} und alle seine Daten gelöscht. Geben Sie zur Bestätigung {{appId}} ein.',
    },
    common: {
      retry: 'Erneut versuchen',
      refresh: 'Aktualisieren',
      actions: 'Aktionen',
      rowActions: 'Aktionen für {{name}}',
    },
    errors: {
      requestFailed: 'Die Anfrage ist fehlgeschlagen.',
      reasons: {
        IMAGE_REQUIRED:
          'In dieser Umgebung werden Release-Images ausgeführt, und das Release verfügt dort über kein Image. Registrieren Sie das von Ihrem CI gepushte Image (`release image`) und stellen Sie es dann bereit.',
        ARCHIVE_REQUIRED:
          'Diese Umgebung führt laufende Release-Archive aus; Laden Sie das Archiv hoch (`release upload`).',
        IMAGE_CONFLICT:
          'Die Veröffentlichung enthält bereits ein weiteres Image für diese Plattform. Das Image einer Veröffentlichung ändert sich nie.',
        INVALID_IMAGE: 'Das ist keine Bildreferenz mit einem sha256-Digest.',
        REGISTRY_EXISTS:
          'Eine Registrierung mit dieser ID ist bereits vorhanden.',
        REGISTRY_IN_USE:
          'Umgebungen werden aus dieser Registrierung abgerufen; Wählen Sie zunächst eine andere Registrierung für sie aus.',
        UNKNOWN_REGISTRY: 'Diese Registrierung existiert nicht.',
        INVALID_REGISTRY_URL:
          'Geben Sie den Ursprung der Registrierung ein, z. B. https://ghcr.io oder localhost:5000.',
        INVALID_REGISTRY_NAMESPACE:
          'Der Namespace besteht aus kleingeschriebenen Pfadkomponenten, z. B. acme.',
        APP_EXISTS: 'Eine App mit dieser ID existiert bereits.',
        APP_NOT_DEPLOYED: 'Die App wurde noch nicht bereitgestellt.',
        APP_NOT_FOUND:
          'Die App existiert nicht, oder Sie sehen sie möglicherweise nicht.',
        APPROVAL_REQUIRED:
          'Diese Umgebung ist geschützt: Fordern Sie stattdessen die Bereitstellung an.',
        ARTIFACT_TOO_LARGE: 'Das Release-Paket ist zu groß.',
        BASE_PATH_MISMATCH:
          'Die Version wurde für einen anderen Basispfad erstellt.',
        CHECKSUM_MISMATCH:
          'Das Paket stimmt nicht mit seiner Prüfsumme überein.',
        CONFIG_NOT_EDITABLE:
          'Die Konfiguration dieser App kann hier nicht bearbeitet werden.',
        CONFIG_SECRET_NOT_STORED:
          'Ein maskierter Wert hat an seiner Stelle kein gespeichertes Geheimnis. Geben Sie den Wert anstelle der Maske ein.',
        CONFIG_RELOAD_FAILED:
          'Die Konfiguration wurde gespeichert, die App konnte sie jedoch nicht neu laden.',
        CONFIG_TOO_LARGE: 'Die Konfiguration ist zu groß.',
        CONFIRMATION_REQUIRED: 'Geben Sie zur Bestätigung die App-ID ein.',
        DEPLOYMENT_IN_PROGRESS:
          'Die Bereitstellung dieser App ist bereits im Gange.',
        DEPLOYMENT_NOT_FOUND: 'Die Bereitstellung ist nicht vorhanden.',
        DRIVER_UNAVAILABLE: 'Der Treiber der Umgebung ist nicht verfügbar.',
        ENVIRONMENT_DRIVER_FIXED:
          'Der Treiber einer Umgebung kann nicht geändert werden.',
        ENVIRONMENT_VARIANT_FIXED:
          'Der Ausführungsmodus einer Umgebung kann nicht geändert werden; Erstellen Sie stattdessen eine andere Umgebung.',
        ENVIRONMENT_EXISTS:
          'Eine Umgebung mit dieser ID ist bereits vorhanden.',
        ENVIRONMENT_FULL: 'Die Umgebung hat ihr Limit an Apps erreicht.',
        ENVIRONMENT_IN_USE:
          'Apps werden weiterhin in dieser Umgebung bereitgestellt.',
        ENVIRONMENT_NOT_FOUND: 'Die Umgebung existiert nicht.',
        FORBIDDEN: 'Sie haben dazu keine Berechtigung.',
        IDEMPOTENCY_CONFLICT:
          'Dieselbe Anfrage wurde mit unterschiedlichem Inhalt gesendet.',
        INVALID_ACTIVATION_POLICY: 'Die Aktivierungsrichtlinie ist ungültig.',
        INVALID_IDLE_STOP: 'Der Leerlaufstopp ist ungültig.',
        INVALID_DORMANCY: 'Die Ruhezeit ist ungültig.',
        INVALID_APP_ID:
          'Verwenden Sie Buchstaben, Ziffern, Unterstriche und Bindestriche für die App-ID, beginnend nicht mit „__“ und nicht „neu“.',
        INVALID_APPROVERS: 'Die Genehmiger sind ungültig.',
        INVALID_ARTIFACT_SIZE: 'Die Paketgröße ist ungültig.',
        INVALID_ARTIFACT_VERSION: 'Die Release-Version ist ungültig.',
        INVALID_ARTIFACT: 'Die Datei ist kein gültiges Release-Paket.',
        INVALID_CHECKSUM: 'Die Prüfsumme ist ungültig.',
        INVALID_CONFIG_FILE: 'Die Konfiguration ist kein gültiges YAML.',
        INVALID_CONFIG_MODE: 'Der Konfigurationsmodus ist ungültig.',
        INVALID_CONFIG_SECRET: 'Die geheime Änderung ist ungültig.',
        INVALID_CONTENT_TYPE: 'Laden Sie ein .tar.gz-Paket hoch.',
        INVALID_DEPLOYMENT_INPUT:
          'Die Bereitstellungsanforderung ist ungültig.',
        INVALID_DRIVER: 'Der Treiber ist ungültig.',
        INVALID_ENVIRONMENT_CONFIG:
          'Die Umgebungseinstellungen sind für den Treiber ungültig.',
        INVALID_ENVIRONMENT_ID:
          'Verwenden Sie Kleinbuchstaben, Ziffern, Unterstriche und Bindestriche für die Umgebungs-ID.',
        INVALID_ENVIRONMENT_SETTINGS:
          'Die Umgebungseinstellungen sind ungültig.',
        INVALID_IDEMPOTENCY_KEY: 'Der Anforderungsschlüssel ist ungültig.',
        INVALID_INPUT: 'Einige Felder der Anfrage sind ungültig.',
        INVALID_LABELS:
          'Schreiben Sie Beschriftungen als Schlüssel=Wert, getrennt durch Kommas.',
        INVALID_LOG_CURSOR: 'Die Protokollposition ist ungültig.',
        INVALID_LOG_ID: 'Das Protokoll existiert nicht.',
        INVALID_NOTE: 'Die Notiz ist zu lang.',
        INVALID_PUBLIC_URL: 'Das öffentliche URL-Muster ist ungültig.',
        INVALID_REQUEST: 'Die Anfrage ist ungültig.',
        INVALID_ROLLBACK_TARGET:
          'Auf diese Bereitstellung kann kein Rollback zurückgesetzt werden.',
        INVALID_SEARCH: 'Die Suche ist ungültig.',
        INVALID_TICKET: 'Das Ticket ist ungültig.',
        RELEASE_EXISTS: 'Diese Version wurde bereits hochgeladen.',
        RELEASE_NOT_FOUND: 'Das Release existiert nicht.',
        REQUEST_DECIDED: 'Über den Antrag wurde bereits entschieden.',
        REQUEST_NOT_FOUND: 'Die Anfrage existiert nicht.',
        REQUEST_PENDING:
          'Eine Anfrage für diese App wartet bereits auf Genehmigung.',
        RESTART_FAILED: 'Die App konnte nicht neu gestartet werden.',
        SESSION_REQUIRED: 'Melden Sie sich erneut an, um fortzufahren.',
        START_FAILED: 'Die App konnte nicht gestartet werden.',
        STOP_FAILED: 'Die App konnte nicht gestoppt werden.',
        TICKET_DEPLOY_REFUSED:
          'Das Ticket lässt diese Bereitstellung nicht zu.',
        TICKET_FORBIDDEN: 'Das Ticket lässt dies nicht zu.',
        UNSAFE_ARTIFACT: 'Das Paket enthält unsichere Pfade.',
        VARIABLES_MISSING:
          'Erforderliche Variablen sind nicht festgelegt: {{names}}. Legen Sie sie in den Variablen der App oder ihrer Umgebung fest und stellen Sie sie dann erneut bereit.',
        VARIABLE_RESERVED:
          'Dieser Name wird von der Laufzeit festgelegt und kann keine Variable sein.',
        INVALID_VARIABLE_NAME:
          'Ein Variablenname besteht aus Großbuchstaben, Ziffern und Unterstrichen, beginnend mit einem Buchstaben.',
        INVALID_VARIABLE_VALUE: 'Der Wert ist zu lang.',
        VARIABLE_NOT_FOUND: 'Die Variable ist nicht gesetzt.',
        INVALID_VARIABLES_MANIFEST:
          'Das Variablenmanifest der Version (dist/variables.json) ist ungültig.',
        INITIAL_ADMIN_UNAVAILABLE:
          'Es gibt keinen ersten Administrator, der angezeigt werden kann.',
      },
      messages: {
        hostExited: 'Der Prozess der App wurde gestoppt, bevor sie bereit war.',
        hostDisabled: 'Der App-Host ist ausgeschaltet.',
        hostShutDown: 'Der App-Host wurde heruntergefahren.',
        hostEntryMissing: 'Die Eintragsdatei des App-Hosts fehlt.',
        cannotRestart:
          'Dieser Host kann von hier aus nicht neu gestartet werden.',
        selfDeploy:
          'Der Host kann die Anwendung, in der er ausgeführt wird, nicht bereitstellen.',
        noStatus:
          'Der Host hat nicht berichtet, wie die Bereitstellung verlaufen ist.',
        interrupted:
          'Die Bereitstellung wurde durch einen Neustart unterbrochen.',
        notReported: 'Die Laufzeit hat die App nicht gemeldet.',
        notRunning: 'Die App läuft nach dem Neustart nicht.',
        deploymentNotReported:
          'Die Laufzeit hat die Bereitstellung nicht gemeldet.',
        notReady:
          'Es ist noch nicht fertig; Versuchen Sie es gleich noch einmal.',
        checkTimeout:
          'Der Test wurde nicht innerhalb von 20 Sekunden abgeschlossen.',
        hostNoSettings:
          'Die lokale Laufzeit nimmt keine Verbindungseinstellungen entgegen.',
      },
      prefixed: {
        startFailed: 'Start fehlgeschlagen: {{detail}}',
        stopFailed: 'Stopp fehlgeschlagen: {{detail}}',
        restartFailed: 'Neustart fehlgeschlagen: {{detail}}',
        outcomeUnreadable:
          'Das Ergebnis konnte nicht gelesen werden: {{detail}}',
      },
    },
    confirm: {
      cancel: 'Abbrechen',
      typeLabel: 'Geben Sie zur Bestätigung {{text}} ein',
    },
    environments: {
      title: 'Umgebungen bereitstellen',
      description:
        'Wo Anwendungen bereitgestellt werden und wer dort bereitgestellt werden darf.',
      open: 'Öffnen',
      loadOneFailed: 'Die Umgebung konnte nicht geladen werden.',
      settingsTitle: 'Umgebungseinstellungen',
      readOnly:
        'Sie können die Einstellungen dieser Umgebung anzeigen, aber nicht ändern.',
      danger: 'Umgebung löschen',
      deleteDescription:
        'Entfernt die Umgebung und ihre Variablen. Hier bereitgestellte Apps müssen zuerst gelöscht werden.',
      discard: 'Änderungen verwerfen',
      anyone: 'Jeder, der sich einsetzen darf',
      unlimited: 'Keine Begrenzung',
      apps: 'Apps',
      appsDescription: 'Die in dieser Umgebung bereitgestellten Apps.',
      appsEmpty: 'Hier sind noch keine Apps bereitgestellt.',
      sampleData: 'Laden Sie Beispieldaten bei der ersten Bereitstellung',
      sampleDataHint:
        'Die erste Bereitstellung einer App hier installiert ihre Beispieldaten (APP_SAMPLE_DATA=true). Verwenden Sie es für Vorschauen, nicht für die Produktion.',
      add: 'Umgebung hinzufügen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      check: 'Überprüfen',
      reachable: '{{name}} ist erreichbar.',
      unreachable: '{{name}} ist nicht erreichbar.',
      deleted: 'Umgebung {{name}} gelöscht.',
      saved: 'Umgebung {{name}} gespeichert.',
      added: 'Umgebung {{name}} hinzugefügt.',
      loadFailed: 'Die Umgebungen konnten nicht geladen werden.',
      emptyTitle: 'Noch keine Umgebungen',
      emptyNoAccess:
        'Bitten Sie einen Administrator, eine Umgebung hinzuzufügen.',
      emptyDescription:
        'Fügen Sie eine Umgebung für die Bereitstellung von Apps hinzu.',
      editTitle: '{{name}} bearbeiten',
      formDescription:
        'Wo Apps bereitgestellt werden, wie sie erreicht werden und wer dort bereitgestellt werden darf.',
      configHint: 'Die Treibereinstellungen als JSON-Objekt.',
      secretHint:
        'Verschlüsselt gespeichert und nie wieder angezeigt; leer lassen, um es aufzubewahren.',
      invalidJson: 'Geben Sie ein JSON-Objekt ein, z. B. {}.',
      protectedHint:
        'Jede Bereitstellung, sei es durch eine Person oder durch CI, wartet auf einen Genehmiger, der die App-ID erneut eingibt, um sie zu genehmigen.',
      approversColumn: 'Genehmiger',
      approversPlaceholder: 'Wählen Sie Genehmiger aus',
      approversHint:
        'Jeder von ihnen kann zustimmen, auch seine eigenen Wünsche. Wenn „Keine“ ausgewählt wird, entscheiden die Personen, die geschützte Bereitstellungen genehmigen dürfen.',
      confirmDelete: 'Umgebung {{id}} löschen?',
      id: 'Umgebungs-ID',
      name: 'Name',
      driver: 'Fahrer',
      runsOn: 'Läuft weiter',
      policy: 'Richtlinie',
      publicUrl: 'Öffentliches URL-Muster',
      config: 'Einstellungen (JSON)',
      secret: 'Anmeldeinformationen (JSON, schreibgeschützt)',
      secretStored:
        'Anmeldeinformationen werden gespeichert; Geben Sie neue ein, um sie zu ersetzen.',
      protected: 'Geschützt',
      approvers: 'Genehmiger',
      pickDriver:
        'Wählen Sie aus, wie Apps in dieser Umgebung ausgeführt werden. Eine Umgebung behält ihren Treiber.',
      next: 'Weiter',
      addWith: '{{driver}}-Umgebung hinzufügen',
      changeDriver: 'Veränderung',
      basics: 'Umgebung',
      namePlaceholder: 'Inszenierung',
      idHint:
        'Kleinbuchstaben, Ziffern, Unterstriche und Bindestriche; kann später nicht mehr geändert werden.',
      policyDescription: 'Wer darf hier eingesetzt werden?',
      appDefaults: 'Apps',
      appDefaultsDescription:
        'Höchstens so viele Apps und wenn eine App, die ohne eigene Laufzeitrichtlinie erstellt wurde, stoppt und in den Ruhezustand wechselt. Leer: keine Grenze, niemals.',
      maxApps: 'Die meisten Apps',
      defaultIdle: 'Stopp nach (Minuten ohne Besuch)',
      defaultDormant: 'Ruhend nach (Stunden ohne Besuch)',
      noForm:
        'Kein Einstellungsformular; Die Einstellungen werden als JSON ({{kind}}) eingegeben.',
      imageSource: 'Bilder freigeben',
      imageSourceDescription:
        'Rufen Sie das Image jeder Version per Digest mit den Pull-Anmeldeinformationen aus einer Registrierung ab, sodass diese Umgebung genau das Image ausführt, das CI gepusht hat und das andere Umgebungen ausgeführt haben.',
      registry: 'Registry',
      noRegistry: 'Keine: Öffentliche Bilder anonym abrufen',
      newRegistry: 'Neues Register',
      editRegistry: 'Bearbeiten',
      cancelRegistryEdit: 'Bearbeitung abbrechen',
      registryShared:
        'Änderungen gelten für jede Umgebung, die Daten aus dieser Registrierung abruft.',
    },
    registries: {
      check: 'Testverbindung',
      url: 'Adresse',
      urlHint:
        'Sein Ursprung, z. B. https://ghcr.io;, eine Localhost-Adresse, wird über HTTP erreicht.',
      namespace: 'Namensraum',
      namespaceHint: 'Die Pfad-Release-Bilder gehen unter, z. B. acme.',
      pull: 'Anmeldeinformationen abrufen',
      pullHint:
        'Für Umgebungen, die aus dieser Registrierung ziehen; Lassen Sie sie dort weg, wo anonyme Pulls möglich sind.',
      username: 'Benutzername',
      password: 'Passwort oder Token',
      checkOk: 'Verbunden',
      checkFailed: 'Der Verbindungstest ist fehlgeschlagen.',
      checkFailedTitle: 'Die Registrierung kann nicht verwendet werden',
      anonymous:
        'Die Registry antwortet ohne Zugangsdaten: Jeder, der sie erreicht, kann ziehen.',
      status: {
        ok: 'akzeptiert',
        failed: 'lehnte ab',
        notSet: 'nicht gesetzt',
      },
    },
    artifacts: {
      title: 'Artefakte',
      tarball: 'Archivieren',
      image: 'Bild',
      ran: 'Ausgeführt',
      ranTarball: 'Archiv, in Bearbeitung',
    },
    driverForm: {
      advanced: 'Erweiterte Einstellungen',
      advancedHint:
        'Die Standardeinstellungen eignen sich für die meisten Umgebungen. Öffnen Sie eine Gruppe, um sie zu ändern.',
      on: 'An',
      off: 'Aus',
      noLimit: 'Keine Begrenzung',
      writeOnly: '(schreibgeschützt)',
      secretSet: 'Eingestellt',
      secretCleared: 'Wird beim Speichern entfernt',
      replace: 'Ersetzen',
      clear: 'Entfernen',
      undo: 'Rückgängig machen',
      keepStored: 'Behalten Sie das gespeicherte',
      jsonTitle: 'Treibereinstellungen',
      jsonDescription:
        'Dieser Treiber verfügt über kein Einstellungsformular; Geben Sie die Einstellungen als JSON ein.',
      check: 'Testverbindung',
      checkOk: 'Verbunden',
      checkFailed: 'Der Verbindungstest ist fehlgeschlagen.',
      checkFailedTitle: 'Es konnte keine Verbindung hergestellt werden',
      fixErrors:
        'Einige Einstellungen müssen korrigiert werden; sie sind oben markiert.',
      errors: {
        required: 'Erforderlich.',
        number: 'Geben Sie eine Nummer ein.',
        integer: 'Geben Sie eine ganze Zahl ein.',
        range: 'Außerhalb des zulässigen Bereichs.',
        mapLine: 'Schreiben Sie einen NAME=Wert pro Zeile.',
        mapName:
          'Namen bestehen aus Buchstaben, Ziffern und Unterstrichen und beginnen nicht mit einer Ziffer.',
      },
    },
    driverForms: {
      host: {
        description:
          'Führt Apps auf diesem Server aus: Im untergeordneten App-Host-Prozess wird diese Anwendung gestartet, oder jeweils in einem Docker-Container.',
        runtime: 'Run-Modus',
        backend: 'Run-Modus',
        backendInProcess: 'In Bearbeitung',
        backendInProcessHint:
          'Wird im untergeordneten App-Host-Prozess ausgeführt, den dieser Server startet und von allen solchen Apps gemeinsam genutzt wird. Geeignet für Vorschauen.',
        backendDocker: 'Docker',
        backendDockerHint:
          'Ein Container pro App, voneinander isoliert. Geeignet für Tests und Produktion.',
        dockerConnection: 'Docker-Verbindung',
        dockerConnectionDescription:
          'Verwendet Docker auf diesem Server, gefunden von DOCKER_HOST oder dem aktuellen Docker-Kontext, mit empfohlenen Containereinstellungen. Testen Sie die Verbindung, um zu sehen, welches Docker gefunden wurde.',
        access: 'Zugriffsadresse',
        publicUrl: 'Öffentliches URL-Muster',
        publicUrlHint:
          'Wenn Leute eine App öffnen, mit {appId} im Pfad oder im Hostnamen; empty verwendet die eigene Adresse des Servers.',
        check: {
          url: 'Adresse',
          apps: 'Apps laufen',
          endpoint: 'Docker',
          version: 'Docker-Version',
          platform: 'Plattform',
          errors: {
            unsupported:
              'Nur Docker auf diesem Server wird unterstützt: DOCKER_HOST muss ein Unix://-Socket oder ein TCP://-Socket-Proxy sein.',
            socketMissing:
              'Es gibt dort keinen Docker-Sockel. Ist Docker auf diesem Server installiert und läuft es?',
            permission:
              'Docker hat den Zugriff verweigert. Der Benutzer, unter dem diese Anwendung ausgeführt wird, darf den Docker-Socket nicht verwenden.',
            refused:
              'An dieser Adresse werden keine Verbindungen akzeptiert. Überprüfen Sie, ob Docker ausgeführt wird.',
            timeout: 'Docker antwortete nicht rechtzeitig.',
          },
        },
      },
    },
  },
  actions: {
    close: 'Schließen',
  },
  status: {
    loading: 'Wird geladen',
  },
};

export default deDE;
