import type { MailPagesResource } from './pages.en-US.js';

const pagesDeDE: MailPagesResource = {
  navigation: {
    mail: 'E-Mail',
    mailTeam: 'Team-E-Mail',
    mailAccounts: 'E-Mail-Konten',
    mailAccountsDescription:
      'Verbinden Sie Ihre Postfächer und verwalten Sie Signaturen, Vorlagen und Etiketten.',
    mailSettings: 'Postfachverbindungen',
    mailSettingsDescription:
      'E-Mail-Anbieter, der Status jedes Kontos sowie Synchronisierungs- und Sendeprotokolle.',
  },
  access: {
    section: 'E-Mail',
    team: {
      title: 'Team-E-Mail',
      description: 'Synchronisierte E-Mails der Mitglieder, nur lesend.',
      actions: {
        view: 'Anzeigen',
        process: 'Bearbeiten (als gelesen markieren, markieren, archivieren)',
      },
    },
    settings: {
      title: 'Postfachverbindungen',
      actions: {
        read: 'Anzeigen',
        manage:
          'Verwalten (Synchronisierungen und Sendungen der Mitglieder wiederholen und abbrechen)',
      },
    },
  },
  pages: {
    loading: 'Wird geladen…',
    empty: 'Nichts anzuzeigen.',
    member: 'Mitglied',
    allMembers: 'Alle Mitglieder',
    workspace: {
      reauthorizationNotice:
        '{{addresses}} muss neu verbunden werden: Bis dahin wird nichts synchronisiert oder gesendet.',
      reauthorize: 'In E-Mail-Konten neu verbinden',
      needsReauthorization: 'erneute Autorisierung erforderlich',
    },
    accounts: {
      title: 'E-Mail-Konten',
      description:
        'Verbinden Sie Ihre Postfächer, um in E-Mail zu senden und zu empfangen. Nur Sie sehen Ihre E-Mails; Personen mit Zugriff auf Team-E-Mail können sie lesen, ohne sie zu ändern.',
      reauthorizationNotice:
        'Die Autorisierung von {{addresses}} wird nicht mehr akzeptiert: Es wird nichts synchronisiert oder gesendet, bis Sie das Konto mit demselben Anbieter neu verbinden.',
      reauthorize: 'Neu verbinden',
      tabs: {
        accounts: 'Konten',
        signatures: 'Signaturen',
        templates: 'Vorlagen',
        labels: 'Etiketten',
        activity: 'Aktivität',
      },
    },
    activity: {
      sends: 'Sendungen',
      syncs: 'Synchronisierungen',
    },
    logs: {
      started: 'Gestartet',
      time: 'Zeit',
      account: 'Konto',
      accountMember: 'Konto · Mitglied',
      mode: 'Modus',
      initial: 'Erste Synchronisierung',
      incremental: 'Inkrementell',
      result: 'Ergebnis',
      allResults: 'Alle Ergebnisse',
      detail: 'Details',
      reason: 'Grund',
      processed: '{{count}} Nachrichten',
      subject: 'Betreff',
      recipients: 'Empfänger',
      recipientCount: 'Empfänger',
      bulk: 'Massenversand',
      bulkCount: '{{count}} (Massenversand)',
      showRecipients: 'Empfänger anzeigen',
      hideRecipients: 'Empfänger ausblenden',
      scheduled: 'Geplant',
      retry: 'Wiederholen',
      cancel: 'Abbrechen',
      window: 'Zeitraum',
      windows: {
        day: 'Letzte 24 Stunden',
        week: 'Letzte 7 Tage',
        month: 'Letzte 30 Tage',
        all: 'Gesamter Zeitraum',
      },
    },
    team: {
      title: 'Team-E-Mail',
      description:
        'Lesen Sie die von Mitgliedern synchronisierten E-Mails für Übergaben und Compliance-Prüfungen. Das Öffnen einer Nachricht markiert sie nicht als gelesen, und Sie können nicht antworten.',
      account: 'Konto',
      allAccounts: 'Alle Konten',
      participant: 'Adresse oder @Domain',
      keyword: 'Stichwort im Betreff',
      memberAccount: 'Mitglied · Konto',
      counterpart: 'Mit',
      view: 'Anzeigen',
      selectAll: 'Alle auf dieser Seite auswählen',
      empty: 'Keine passenden synchronisierten E-Mails.',
      readOnly: 'Nur lesend. Das Öffnen markiert sie nicht als gelesen.',
      applied: '{{succeeded}} aktualisiert, {{failed}} fehlgeschlagen.',
      actions: {
        markRead: 'Als gelesen markieren',
        star: 'Markieren',
        archive: 'Archivieren',
      },
    },
    settings: {
      title: 'Postfachverbindungen',
      description:
        'Die E-Mail-Anbieter, die Mitglieder verbinden können, und der Verbindungs-, Synchronisierungs- und Sendestatus jedes Kontos. Hier werden keine Nachrichteninhalte angezeigt. System-Benachrichtigungs-E-Mails werden unter Benachrichtigungen konfiguriert.',
      tabs: {
        providers: 'Anbieter',
        accounts: 'Konten',
        syncRuns: 'Synchronisierungsprotokolle',
        submissions: 'Sendeprotokolle',
        runtime: 'Laufzeitkonfiguration',
      },
      sources: {
        environment: 'Umgebungsvariable',
        config: 'config.yml',
        default: 'Standard',
        code: 'Code',
        unknown: 'Unbekannt',
      },
      providers: {
        name: 'Name',
        type: 'Typ',
        capabilities: 'Funktionen',
        accounts: 'Konten',
        source: 'Quelle',
        attention: '{{count}} erfordern erneute Autorisierung',
        howTo: 'Anbieter hinzufügen',
        howToDescription:
          'Fügen Sie in der Anwendungskonfiguration unter mail.providers einen Eintrag hinzu und bewahren Sie Geheimnisse in Umgebungsvariablen auf. Starten Sie die Anwendung neu, damit er wirksam wird.',
        callbackHint:
          'Registrieren Sie diese OAuth-Weiterleitungs-URL bei Google oder Microsoft:',
      },
      accounts: {
        filter: {
          all: 'Alle',
          attention: 'Erneute Autorisierung erforderlich',
          suspended: 'Deaktiviert',
        },
        provider: 'Anbieter',
        allProviders: 'Alle Anbieter',
        search: 'Mitglied oder Adresse',
        lastSynced: 'Zuletzt synchronisiert',
        status: 'Status',
        showRuns: 'Synchronisierungen',
        note: 'Administratoren können Konten von Mitgliedern weder autorisieren noch entfernen. Ein Mitglied verbindet sein eigenes Konto unter Persönliche Einstellungen › E-Mail-Konten neu.',
      },
      runtime: {
        setting: 'Einstellung',
        value: 'Aktueller Wert',
        effect: 'Auswirkung',
        automaticSyncInterval: 'Intervall der automatischen Synchronisierung',
        automaticSyncIntervalEffect:
          'Wie oft Konten ohne Push-Benachrichtigungen auf neue E-Mails geprüft werden.',
        syncBatchSize: 'Nachrichten pro Synchronisierungsstapel',
        syncBatchSizeEffect:
          'Größere Stapel schließen eine erste Synchronisierung schneller ab, erreichen aber leichter die Ratenlimits des Anbieters.',
        oauthCallbackUrl: 'OAuth-Weiterleitungs-URL',
        oauthCallbackUrlEffect:
          'Registrieren Sie sie in der Entwicklerkonsole von Google oder Microsoft.',
        oauthReturnUrl: 'Seite nach der Autorisierung',
        oauthReturnUrlEffect:
          'Wohin eine Person nach dem Verbinden eines OAuth-Kontos zurückkehrt.',
        pushWebhook: 'Push-Webhook',
        pushWebhookEffect:
          'Ohne ihn werden auch Gmail und Microsoft 365 im Synchronisierungsintervall geprüft.',
        jobs: 'Hintergrundaufgaben',
        jobsEffect:
          'Bereitstellungen mit mehreren Instanzen benötigen eine gemeinsame Warteschlange.',
        logRetention: 'Protokollaufbewahrung',
        logRetentionEffect:
          'Abgeschlossene Synchronisierungen und Sendungen, die älter sind, werden automatisch gelöscht.',
        credentialVault: 'Speicher für Anmeldedaten',
        credentialVaultEffect:
          'Wo OAuth-Tokens und Passwörter verbundener Konten gespeichert werden.',
        minutes: '{{count}} Minuten',
        days: '{{count}} Tage',
        keepForever: 'Unbegrenzt aufbewahrt',
        notConfigured: 'Nicht konfiguriert',
        secretConfigured: 'Geheimnis konfiguriert',
        secretMissing: 'Kein Geheimnis konfiguriert',
        jobsDefault: 'Folgt jobs.default',
        vaultBuiltin: 'Integriert, in der Anwendungsdatenbank',
        vaultApplication: 'Von der Anwendung registriert',
        copy: 'Kopieren',
        copied: 'Kopiert',
        readOnly:
          'Nur lesend: Diese Einstellungen stammen aus config.yml und den Umgebungsvariablen MAIL_* und gelten nach einem Neustart.',
      },
    },
  },
};

export default pagesDeDE;
