import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  navigation: {
    parameters: 'Laufzeitparameter',
    group: 'Workflow',
    tickets: 'Helpdesk',
    expenses: 'Spesenabrechnungen',
    invoices: 'E-Rechnung',
    orders: 'Zahlung bestellen',
    exports: 'Datenexporte',
    purchases: 'Flash-Verkauf',
    fulfilments: 'Versand',
    subscriptions: 'Abonnements',
  },
  parameters: {
    fields: {
      paymentWindowMinutes: {
        title: 'Zahlungs-Timeout (Minuten)',
        description:
          'Stornieren Sie eine unbezahlte Bestellung nach dieser Wartezeit. Änderungen gelten für neu geplante Zahlungszeitpläne; Vorhandene Timer behalten ihre Zeit.',
      },
      escalateAfterMinutes: {
        title: 'Zeitüberschreitung der Managerüberprüfung (Minuten)',
        description:
          'Eskalieren Sie eine ausstehende Managerüberprüfung nach dieser Wartezeit. Änderungen gelten für neu geplante Überprüfungstimer; Vorhandene Timer behalten ihre Zeit.',
      },
      waitMinutes: {
        title: 'Zeitüberschreitung der Kundenantwort (Minuten)',
        description:
          'Schließen Sie ein Ticket, wenn der Kunde innerhalb dieser Wartezeit nicht antwortet. Änderungen gelten für neu geplante Timer; Vorhandene Timer behalten ihre Zeit.',
      },
      querySeconds: {
        title: 'Verzögerung der Rechnungsstatusabfrage (Sekunden)',
        description:
          'Fragen Sie den Rechnungsanbieter ab, wenn innerhalb dieser Wartezeit kein Rückruf eintrifft. Änderungen gelten für neu geplante Abfragen; Bestehende Abfragen behalten ihre Zeit.',
      },
      pollSeconds: {
        title: 'Prüfintervall für den Exportfortschritt (Sekunden)',
        description:
          'Warten Sie so lange, bevor Sie einen laufenden Export prüfen. Änderungen gelten für neu geplante Kontrollen; bestehende Schecks behalten ihre Gültigkeit.',
      },
      maxMinutes: {
        title: 'Zeitüberschreitung beim Exportabschluss (Minuten)',
        description:
          'Legen Sie die Abschlussfrist fest, wenn ein Exportauftrag beginnt. Bei einem nicht abgeschlossenen Auftrag läuft die Zeit bis zu diesem Stichtag ab. Durch Änderungen werden bestehende Auftragsfristen nicht verschoben.',
      },
      periodMinutes: {
        title: 'Abonnementverlängerungszeitraum (Minuten)',
        description:
          'Verwenden Sie diese Dauer, um das neue Periodenende nach einer erfolgreichen Aufladung zu berechnen. Änderungen gelten nach der nächsten erfolgreichen Aufladung; das aktuelle Periodenende bleibt fixiert.',
      },
      dunningMinutes: {
        title:
          'Wiederholungsintervall für Verlängerungszahlung fehlgeschlagen (Minuten)',
        description:
          'Warten Sie so lange, bevor Sie eine fehlgeschlagene Verlängerungszahlung erneut versuchen. Änderungen gelten für neu geplante Wiederholungsversuche; Vorhandene Wiederholungsversuche behalten ihre fällige Zeit.',
      },
      maxDunning: {
        title: 'Fehlergrenze für Verlängerungszahlung',
        description:
          'Kündigen Sie das Abonnement beim nächsten automatischen Wiederholungsversuch, wenn die Anzahl der fehlgeschlagenen Zahlungen dieses Limit erreicht hat. Änderungen gelten bei der nächsten Wiederholungsentscheidung.',
      },
      reopenDays: {
        title: 'Frist für die Wiedereröffnung des Tickets (Tage)',
        description:
          'Wiedereröffnung innerhalb dieser vielen Tage nach Schließung eines Tickets zulassen; andernfalls ist ein neues Ticket erforderlich. Bei jeder Wiedereröffnungsanfrage wird die neueste Einstellung verwendet.',
      },
    },
    loading: 'Parameter werden geladen…',
    title: 'Laufzeitparameter',
    description:
      'Nur vom Code deklarierte Werte ändern. Workflow-Struktur, Entscheidungen und Zeitüberschreitungen bleiben im Code.',
    ruleExplanation:
      'Alle Bedingungen in einer Gruppe müssen übereinstimmen. Einzelne Gruppen werden zusammengezählt. Ordnen Sie alternative Benutzer separaten Gruppen zu.',
    allConditions: 'Erfüllen Sie alle diese Bedingungen',
    alsoInclude: 'Auch einschließen',
    selectionType: 'Auswahltyp',
    searchReference: 'Suche nach Namen',
    noMatches: 'Keine passenden Referenzen',
    previousPage: 'Vorherige Seite',
    nextPage: 'Nächste Seite',
    reference: 'Referenz',
    remove: 'Entfernen',
    addCondition: 'Bedingung hinzufügen',
    addGroup: 'Schließen Sie auch eine andere Gruppe ein',
    revision: 'Revision {{revision}}',
    codeDefaults: 'Code-Standardwerte',
    databaseVersion: 'Konfiguration gespeichert',
    snapshotEffect:
      'Snapshot: bei der ersten Übermittlung behoben; nach Rückgabe oder Widerruf einbehalten',
    liveEffect:
      'Zukünftige Parameterlesevorgänge verwenden die neueste Konfiguration; Bestehende Timer und Fristen bleiben unverändert.',
    yes: 'Ja',
    no: 'Nein',
    invalidObject: 'Geben Sie ein gültiges JSON-Objekt ein.',
    saved: 'Konfiguration gespeichert.',
    conflict:
      'Die Revision wurde geändert. Ihre Eingaben sind erhalten geblieben; Überprüfen Sie die aktuellen Werte, bevor Sie es erneut versuchen.',
    currentRevision: 'Aktuell gespeicherte Revision: {{revision}}',
    keepDraft: 'Behalten Sie meine Eingaben und verwenden Sie diese Revision',
    save: 'Werte speichern',
    readOnly: 'Sie können diese Werte lesen, aber nicht ändern.',
    preview: 'Vorschau der Kandidaten für Lin',
    candidates: 'Kandidaten',
    noCandidates:
      'Keine geeigneten Kandidaten; Die Einreichung wird abgelehnt.',
    editCurrent: 'Aktuelle Konfiguration bearbeiten',
    historyBoundary:
      'Dadurch wird die aktuelle Konfiguration bearbeitet. Historische Fakten und bereits zugewiesene Kandidaten bleiben unverändert.',
    history: 'Tatsächliche Parameterverwendung',
    effectivePreview: 'Jetzt gültige Werte für diesen Datensatz',
    firstSnapshot: 'Snapshot der ersten Übermittlung',
    notRecorded: 'Nicht erfasst',
    diagramEntry: 'Optionaler Diagrammeintrag',
    diagramHint:
      'Klicken Sie auf einen gebundenen Knoten oder Übergang, um den gemeinsamen Editor zu öffnen. Ungebundene Einträge zeigen ihre ursprünglichen Details. Durch Klicken wird niemals ein Übergang ausgeführt.',
    workflow: 'Workflow',
    types: {
      department: 'Abteilung',
      role: 'Rolle',
      user: 'Person',
    },
  },
  invoices: {
    title: 'E-Rechnung',
    list: 'Rechnungen',
    new: 'Neue Rechnung',
    empty: 'Keine Rechnungen hier.',
    pick: 'Wählen Sie eine Rechnung aus, um deren Ausstellung zu verfolgen.',
    description:
      'Eine abgeschlossene Sandbox-Bestellung in Rechnung stellen. Warten Sie auf den Plattform-Webhook. Abfrage nach {{seconds}} Sekunden ohne eine. Die Einreichung wird bis zu dreimal versucht.',
    shows:
      'Übermittlung, Rückrufe, Timeout-Abfragen und Wiederholungsversuche teilen sich eine Anbieteranforderung. Wiederholte Benachrichtigungen gelten einmal und bei Wiederholungsversuchen wird nie eine zweite Rechnung ausgestellt.',
    orderSummary: 'Bestellnr. {{order}} · {{amount}}',
    fields: {
      order: 'Abgeschlossene Bestellung',
      customer: 'Kunde',
      amount: 'Betrag',
      taxNumber: 'Steuernummer',
      request: 'Provider-Anfrage',
      number: 'Rechnungsnummer',
      queries: 'Abfragen',
    },
    actions: {
      submit: 'Rechnung anfordern',
      retryInvoice: 'Rechnung erneut versuchen',
    },
    form: {
      title: 'Fordern Sie eine elektronische Rechnung an',
      ordersHint:
        'Wählen Sie einen abgeschlossenen Demonstrationsauftrag. Jede Bestellung kann nur eine Rechnung haben.',
      order:
        'Bestellung Nr. {{order}} · {{customer}} · {{amount}} · Abgeschlossen',
      invoiceTitle: 'Rechnungstitel',
      failSubmissions: 'Einsendungen, die absichtlich scheitern',
      failHint:
        'Stellen Sie 1 oder 2 ein, um automatische Wiederholungsversuche anzuzeigen. 3 Stopps in diesem Fall scheiterten. Versuchen Sie es erneut, die Rechnung wird dann wiederhergestellt.',
      submit: 'Erstellen',
    },
    banner: {
      draft: 'Noch nicht angefordert.',
      submitting: 'Absenden der Anfrage; Fehler werden wiederholt...',
      awaiting: 'Warten auf den Plattform-Webhook; Abfrage in {{time}}.',
      querying: 'Abfrage der Rechnungsplattform…',
      issued: 'Rechnung ausgestellt. Das Demo-PDF ist fertig.',
      failed:
        'Problem fehlgeschlagen: {{error}} Sie können die Rechnung erneut versuchen.',
    },
    outside: {
      title: 'Rechnungsplattform (Sandbox)',
      description:
        'Simulieren Sie, dass die externe Plattform eine Anfrage ausführt und ihren Webhook sendet. Es ist kein wirkliches Steuersystem angeschlossen.',
      result: 'Plattformergebnis',
      hint: 'Halten Sie den Webhook gedrückt und stellen Sie erfolgreich aus: Die Rechnung wartet noch und fragt dann nach 30 Sekunden das Ergebnis ab. Eine spätere Zustellung des alten Ereignisses kann es nicht erneut ausstellen.',
      issue: 'Ausgabe erfolgreich',
      fail: 'Rechnung ablehnen',
      download: 'Beispiel-PDF herunterladen',
      pdfHint:
        'In der Datei steht „SANDBOX-RECHNUNG“ und es handelt sich nicht um eine gültige Steuerrechnung.',
    },
  },
  identity: {
    label: 'Angemeldet als',
  },
  roles: {
    agent: 'Support-Agenten',
    customer: 'Kunden',
    applicant: 'Mitarbeiter',
    manager: 'Manager',
    director: 'Führungskräfte',
    finance: 'Finanzen',
  },
  common: {
    signedInUser: 'Angemeldeter Benutzer',
    system: 'System',
    unassigned: 'Nicht zugewiesen',
    loading: 'Wird geladen…',
    cancel: 'Abbrechen',
    close: 'Schließen',
    demoOptions: 'Demo-Optionen',
  },
  tickets: {
    title: 'Helpdesk',
    agentDescription:
      'Nehmen Sie neue Tickets entgegen, antworten Sie Kunden und lösen Sie sie. Ein Ticket, das auf den Kunden wartet, schließt sich selbst, wenn dieser schweigt, und eine Kundenantwort leitet es an den Beauftragten zurück.',
    customerDescription:
      'Bitten Sie das Support-Team um Hilfe und verfolgen Sie das Gespräch. Ein geschlossenes Ticket kann für {{days}} Tage wieder geöffnet werden.',
    queue: 'Ticketwarteschlange',
    mine: 'Meine Tickets',
    newTicket: 'Neues Ticket',
    empty: 'Hier gibt es keine Tickets.',
    pick: 'Wählen Sie ein Ticket, um das Gespräch zu lesen.',
    filters: {
      all: 'Alle',
      new: 'Neu',
      open: 'Öffnen',
      awaitingCustomer: 'Warten',
      closed: 'Geschlossen',
    },
    form: {
      title: 'Support kontaktieren',
      subject: 'Betreff',
      subjectPlaceholder: 'Fassen Sie das Problem in einem Satz zusammen',
      category: 'Kategorie',
      priority: 'Priorität',
      description: 'Beschreibung',
      descriptionPlaceholder:
        'Was ist passiert, was haben Sie erwartet und die Schritte, um es zu reproduzieren',
      failNotifications: 'E-Mail-Zustellungen scheitern absichtlich',
      failHint:
        'Bei jeder Antwort auf dieses Ticket erhalten Sie eine E-Mail. Lassen Sie die ersten Versuche fehlschlagen, damit der Effekt erneut auftritt.',
      submit: 'Ticket einreichen',
    },
    categories: {
      account: 'Konto und Anmeldung',
      billing: 'Abrechnung',
      howto: 'Wie kann ich…',
      incident: 'Etwas ist kaputt',
    },
    priorities: {
      low: 'Niedrig',
      normal: 'Normal',
      high: 'Hoch',
      urgent: 'Dringend',
    },
    meta: {
      customer: 'Kunde',
      category: 'Kategorie',
      priority: 'Priorität',
      assignee: 'Zugewiesene Person',
      created: 'Erstellt',
    },
    banner: {
      new: 'Warten auf einen Agenten, der es übernimmt.',
      open: '{{assignee}} arbeitet daran.',
      awaiting:
        'Warten auf den Kunden. Schließt sich automatisch in {{time}} ohne Antwort.',
      overdue: 'Das Warten hat ein Ende; Der nächste Sweep schließt es.',
      resolved: 'Vom Support behoben.',
      timeout:
        'Automatisch geschlossen: Der Kunde hat nicht rechtzeitig geantwortet.',
      reopenUntil: 'Sie können es bis {{date}} erneut öffnen.',
      reopenExpired:
        'Eine Wiedereröffnung ist nicht mehr möglich; Bitte eröffnen Sie ein neues Ticket.',
    },
    thread: {
      wrote: '{{name}} · {{time}}',
      accept: '{{actor}} hat das Ticket genommen',
      resolve: '{{actor}} hat es als gelöst markiert',
      autoClose:
        'Wird automatisch geschlossen, nachdem {{minutes}} Minuten gewartet wurde',
      reopen: '{{actor}} hat das Ticket erneut geöffnet',
      delivery: {
        queued: 'E-Mail an den Kunden in der Warteschlange',
        running: 'E-Mail an den Kunden senden…',
        succeeded: 'Per E-Mail an den Kunden gesendet',
        failed: 'E-Mail nach {{attempts}}-Versuchen fehlgeschlagen: {{error}}',
        retrying:
          'E-Mail-Versuch {{attempts}} fehlgeschlagen, erneuter Versuch: {{error}}',
      },
    },
    composer: {
      agentPlaceholder: 'Antwort an den Kunden…',
      customerPlaceholder: 'Antwort hinzufügen…',
      reopenPlaceholder: 'Sagen Sie uns, was noch los ist…',
      reply: 'Antwort senden',
      accept: 'Ticket nehmen',
      resolve: 'Mark beschloss',
      customerReply: 'Senden',
      reopen: 'Wieder öffnen',
      nothing: 'Im Moment haben Sie mit diesem Ticket nichts zu tun.',
    },
  },
  expenses: {
    title: 'Spesenabrechnungen',
    applicantDescription:
      'Geschäftsausgaben geltend machen. Bis {{auto}} wird automatisch genehmigt; darüber stimmt Ihr Vorgesetzter zu und darüber {{finance}} auch der Finanzdirektor.',
    approverDescription:
      'Berichte warten auf Ihre Genehmigung. Ein Bericht, den Sie für {{minutes}} Minuten hinterlassen, wird an Ihren eigenen Vorgesetzten weitergeleitet.',
    finalApproverDescription: 'Berichte warten auf Ihre Genehmigung.',
    mine: 'Meine Berichte',
    approvals: 'Warte auf mich',
    newReport: 'Neuer Bericht',
    empty: 'Keine Berichte hier.',
    emptyApprovals: 'Nichts wartet auf Ihre Zustimmung.',
    pick: 'Wählen Sie einen Bericht aus, um ihn anzuzeigen.',
    number: 'Bericht {{id}}',
    editor: {
      title: 'Zweck',
      titlePlaceholder: 'Zum Beispiel: Shanghai-Messe, Oktober',
      purpose: 'Details',
      purposePlaceholder:
        'Wer ging, warum und alles, was ein Genehmiger wissen sollte',
      items: 'Spesen',
      date: 'Datum',
      category: 'Kategorie',
      description: 'Beschreibung',
      amount: 'Betrag (¥)',
      addItem: 'Kosten hinzufügen',
      removeItem: 'Entfernen',
      total: 'Insgesamt',
      failPayments: 'Zahlungsversuche scheitern absichtlich',
      failHint:
        'Ein genehmigter Bericht wird durch eine Wirkung bezahlt. Lassen Sie die ersten Versuche fehlschlagen, um zu sehen, wie es erneut versucht wird.',
      save: 'Entwurf speichern',
      saved: 'Gespeichert.',
      submit: 'Zur Genehmigung einreichen',
      resubmit: 'Erneut senden',
    },
    categories: {
      transport: 'Verkehr',
      lodging: 'Unterkunft',
      meals: 'Mahlzeiten',
      office: 'Bürobedarf',
      entertainment: 'Kundenunterhaltung',
      other: 'Sonstiges',
    },
    steps: {
      submit: 'Eingereicht',
      manager: 'Manager',
      finance: 'Finanzen',
      payment: 'Bezahlt',
    },
    meta: {
      applicant: 'Antragsteller',
      approver: 'Warten auf',
      created: 'Erstellt',
      paymentRef: 'Zahlungsreferenz',
      total: 'Insgesamt',
    },
    banner: {
      draft: 'Entwurf. Nur Sie können es sehen, bis Sie es absenden.',
      awaiting:
        'Warten auf {{approver}}. Passt ohne Entscheidung an seinen Manager in {{time}}.',
      awaitingFinal: 'Warten auf {{approver}}.',
      overdue:
        'Das Warten hat ein Ende; beim nächsten Durchlauf wird es weitergegeben.',
      needsInfo: '{{actor}} hat es zurückgesendet: {{reason}}',
      rejected: '{{actor}} hat es abgelehnt: {{reason}}',
      approved: 'Genehmigt. Die Zahlung ist unterwegs.',
      paymentRetrying:
        'Zahlungsversuch {{attempts}} fehlgeschlagen, erneuter Versuch: {{error}}',
      paymentFailed:
        'Die Zahlung ist nach {{attempts}}-Versuchen fehlgeschlagen: {{error}}. Die Finanzen werden folgen.',
      paid: 'Bezahlt. Referenz {{ref}}.',
    },
    timeline: {
      title: 'Zulassungshistorie',
      empty: 'Noch nicht übermittelt.',
      autoApproved: 'Innerhalb von {{limit}}: automatisch genehmigt',
      escalated:
        'Keine rechtzeitige Entscheidung; an den nächsthöheren Manager weitergegeben',
      paid: 'Zahlung abgeschlossen',
    },
    decision: {
      title: 'Deine Entscheidung',
      placeholder: 'Kommentar (erforderlich zum Zurücksenden oder Ablehnen)',
      approve: 'Genehmigen',
      requestInfo: 'Zurückschicken',
      reject: 'Ablehnen',
    },
    withdraw: 'Zurückziehen',
  },
  flowDiagram: {
    overview: 'Diagrammübersicht',
    actualSize: 'Tatsächliche Größe',
    states: 'Staaten',
    transitions: 'Übergänge',
    configurable: 'Parameter',
    current: 'Strom',
    visited: 'Besucht',
    initial: 'Initiale',
    final: 'Endgültig',
    state: 'Zustand',
    zoomOut: 'Verkleinern',
    zoomIn: 'Vergrößern',
    fit: 'Zur Ansicht anpassen',
    empty: 'Keine anzuzeigenden Status.',
    loading: 'Layout-Diagramm…',
    failed: 'Dieses Diagramm kann nicht angelegt werden.',
    nodeHelp:
      'Drücken Sie die Eingabetaste oder die Leertaste, um einen Status auszuwählen.',
    edgeHelp:
      'Drücken Sie die Eingabetaste oder die Leertaste, um einen Übergang auszuwählen.',
  },
  diagramStatus: {
    traversed: 'Durchquert',
    end: 'Ende',
    current: 'Strom',
    visited: 'Besucht',
    available: 'Verfügbar',
    pending: 'Nicht durchquert',
  },
  flows: {
    customer: 'Kunde',
    final: 'Dieser ist fertig; nichts bewegt es mehr.',
    process: 'Prozess',
    legend:
      'Der aktuelle Zustand hat eine stärkere Füllung; Besuchte Zustände und tatsächlich durchlaufene Übergänge teilen sich eine Akzentfarbe. Die Legende identifiziert verfügbare Übergänge und nicht durchlaufene Teile. Anfangsstaaten haben Pillengrenzen, Endstaaten doppelte Grenzen. Wählen Sie einen Zustand oder Übergang aus, um Einzelheiten zu erfahren. ⚙ Nur Server, ⏱ Auslöser, ✓/✗ Effektfortsetzung.',
    nothing:
      'Im Moment haben Sie hier nichts zu tun; es wartet auf das Äußere.',
  },
  webhooks: {
    title: 'Webhooks',
    hint: 'Was die Sandbox gesendet, gehalten oder übermittelt hat und wie jede Lieferung beantwortet wurde. Geben Sie eine erneut ab, um eine Wiederholung zu sehen, oder halten Sie sie in einer anderen Reihenfolge bereit.',
    empty: 'Noch keine Webhooks.',
    hold: 'Halten Sie den Webhook',
    deliver: 'Liefern',
    deliverAgain: 'Erneut liefern',
    deliveries_one: 'lieferte {{count}}-Zeit',
    deliveries_other: 'lieferte {{count}}-Zeiten',
    occurred: 'Geschehen {{time}}',
    outcomes: {
      applied: 'Angewendet',
      replayed: 'Wiederholt',
      ignored: 'Ignoriert',
      retry: 'Wird es erneut versuchen',
      held: 'Gehalten',
    },
  },
  orders: {
    title: 'Zahlung bestellen',
    list: 'Bestellungen',
    new: 'Neue Ordnung',
    empty: 'Keine Bestellungen hier.',
    pick: 'Wählen Sie eine Bestellung aus, um zu sehen, wo die Zahlung steht.',
    shows:
      'Die Zahlung wird vom Webhook des Anbieters bestätigt, nicht von der Seite: Die Bestellung wartet als Status, und der Webhook – egal wie spät, früh oder oft sie eintrifft – verschiebt sie genau einmal. Eine nach der Stornierung der Bestellung eingehende Zahlung wird zurückerstattet.',
    description:
      'Kunden zahlen an der vom Zahlungsanbieter gehosteten Kasse; Die Bestellung wird fortgesetzt, wenn der Webhook des Anbieters eintrifft. Eine unbezahlte Bestellung wird nach {{minutes}} Minuten geschlossen.',
    nothing:
      'Sie müssen nichts tun: Die Bestellung wartet auf den Zahlungsanbieter.',
    actions: {
      checkout: 'Bezahlen',
      cancel: 'Bestellung stornieren',
      ship: 'Schiff',
      refundOrder: 'Rückerstattung veranlassen',
      retryRefund: 'Rückerstattung erneut versuchen',
    },
    form: {
      title: 'Geben Sie eine Bestellung auf',
      item: 'Artikel',
      amount: 'Betrag (¥)',
      failCheckouts: 'Checkout-Versuche scheitern absichtlich',
      failRefunds: 'Rückerstattungsversuche scheitern absichtlich',
      failHint:
        'Das Öffnen der Kasse und die Erstattung sind Auswirkungen bei Wiederholungsversuchen; Lassen Sie sie die Wiederholungsversuche und die Stellen, an denen die Bestellung aufhört, nicht beobachten.',
      submit: 'Bestellung aufgeben',
    },
    fields: {
      customer: 'Kunde',
      amount: 'Betrag',
      attempt: 'Zahlungsrunde',
      session: 'Checkout-Sitzung',
      paymentRef: 'Zahlung',
      refundRef: 'Rückerstattung veranlassen',
    },
    banner: {
      draft: 'Noch nicht bezahlt.',
      creatingCheckout: 'Kasse des Anbieters öffnen…',
      awaitingPayment:
        'Warten auf den Zahlungsanbieter. Wird in {{time}} geschlossen, wenn keine Zahlung erfolgt.',
      overdue: 'Das Fenster ist vorbei; Der nächste Sweep schließt es.',
      paymentFailed:
        '{{error}} Erneut zahlen, sonst wird in {{time}} geschlossen.',
      paid: 'Bezahlt, versandbereit.',
      cancelled: {
        customer: 'Vom Kunden storniert.',
        timeout: 'Geschlossen: nicht rechtzeitig bezahlt.',
        refundRequested: 'Rückerstattung vom Kunden angefordert.',
      },
      refunding: 'Rückerstattung läuft…',
      refundNeedsAttention:
        'Die Rückerstattung ist fehlgeschlagen: {{error}} Es wird darauf gewartet, dass jemand es erneut versucht.',
      refunded: 'Erstattet.',
      fulfilled: 'Bezahlt und versendet.',
    },
    sessionStatus: {
      open: 'offen',
      paid: 'bezahlt',
      declined: 'lehnte ab',
      expired: 'abgelaufen',
    },
    outside: {
      title: 'Zahlungsanbieter (Sandbox)',
      description:
        'Spielt den Kunden an der Kasse des Anbieters ab und der Anbieter sendet seinen Webhook. Halten Sie einen Webhook gedrückt, um ihn zu spät, zweimal oder nach dem Abbruch zuzustellen.',
      checkout: 'Gehosteter Checkout',
      session: 'Sitzung {{id}}: {{status}}.',
      noSession: 'Keine Kasse geöffnet; Der Kunde zahlt zuerst.',
      pay: 'Bezahlen',
      decline: 'Lehnen Sie die Karte ab',
      tryThis:
        'Versuchen Sie: Webhook halten, bezahlen, Bestellung stornieren und dann den gehaltenen Webhook liefern – das Geld kommt nach der Stornierung an und wird zurückerstattet.',
    },
  },
  exports: {
    title: 'Datenexporte',
    list: 'Exporte',
    new: 'Neuer Export',
    empty: 'Keine Exporte hier.',
    pick: 'Wählen Sie einen Export aus, um die Abfrage zu beobachten.',
    shows:
      'Der Anbieter hat keinen Webhook, daher fragt der Lebenszyklus: Ein Auslöser löst alle paar Sekunden einen Selbstübergang aus, und beim erneuten Eintritt in den Status wird der Anbieter abgefragt. Eine im Protokoll festgelegte Frist beendet das Warten.',
    description:
      'Der Anbieter rendert Exporte langsam und ruft niemanden zurück, daher fragt jeder Export alle {{seconds}} Sekunden ab und gibt nach {{minutes}} Minuten auf.',
    nothing: 'Sie müssen nichts tun: Der Export fragt den Anbieter ab.',
    actions: {
      submit: 'Export starten',
      retry: 'Erneut exportieren',
      cancel: 'Abbrechen',
    },
    outcomes: {
      success: 'ist erfolgreich',
      failure: 'schlägt fehl',
      stuck: 'bleibt bei 60 % hängen',
    },
    jobStatus: {
      running: 'läuft',
      succeeded: 'erledigt',
      failed: 'fehlgeschlagen',
      cancelled: 'abgebrochen',
    },
    form: {
      title: 'Fordern Sie einen Export an',
      name: 'Name',
      duration: 'Anbieter braucht (Sekunden)',
      outcome: 'Die Aufgabe des Verkäufers',
      hint: 'Ein steckengebliebener Job wird nie beendet: Der Export läuft bei Ablauf seiner Frist ab und stoppt den Job.',
      submit: 'Erstellen',
    },
    fields: {
      vendor: 'Anbieter',
      vendorValue: '{{seconds}} s, {{outcome}}',
      job: 'Lieferantenjob',
      polls: 'Umfragen',
      deadline: 'Frist',
    },
    banner: {
      draft: 'Nicht gestartet.',
      starting: 'Der Auftrag wird an den Anbieter gesendet…',
      processing: 'Der Anbieter arbeitet daran. Gibt in {{time}} auf.',
      done: 'Bereit: {{url}}',
      failed: 'Fehlgeschlagen: {{error}}',
      timedOut:
        'Der Lieferant war nicht vor Ablauf der Frist fertig; seine Arbeit wurde eingestellt.',
      cancelled: 'Abgesagt.',
    },
    outside: {
      title: 'Anbieter (Sandbox)',
      description:
        'Was der Export über den Job des Anbieters weiß: nur das, was seine letzte Umfrage ergeben hat. Der Anbieter sendet keinen Webhook, also kann nichts anderes dies tun.',
      lifecycleSide: 'Was der Export weiß',
      lifecycleHint:
        'Job {{id}}, so wie es die letzte Umfrage sah; Die nächste Umfrage bringt es auf den neuesten Stand.',
      lastPoll:
        'Letzte Umfrage ergab {{status}}, {{progress}}% ({{count}}-Umfragen).',
      noPoll: 'Noch nicht abgefragt.',
      nextPoll: 'Nächste Umfrage in etwa {{time}}.',
      pollDue: 'Der nächste Sweep fragt es ab.',
      noJob: 'Noch keine Anstellung beim Verkäufer.',
    },
  },
  purchases: {
    title: 'Flash-Verkauf',
    list: 'Einkäufe',
    new: 'Neukauf',
    empty: 'Keine Einkäufe hier.',
    pick: 'Wählen Sie einen Kauf aus, um dessen Schritte zu befolgen.',
    shows:
      'Ein Kauf erstreckt sich über zwei Systeme, die durch ein Datenbank-Rollback nicht rückgängig gemacht werden können. Jeder Schritt ist ein Zustand mit einer Auswirkung, und wenn die Gebühr abgelehnt wird, wird die Reservierung durch einen eigenen Schritt aufgehoben – was also immer noch geschuldet wird, ist immer der Zustand des Datensatzes.',
    description:
      'Das Lager hält die Einheiten, dann nimmt der Zahlungsanbieter das Geld. Bei Ablehnung der Karte werden die Einheiten durch einen Ausgleichsschritt zurückgegeben; Eine Entschädigung, die immer wieder scheitert, bleibt stehen und wartet auf eine Person.',
    nothing: 'Sie müssen nichts tun: Der Kauf läuft.',
    actions: {
      submit: 'Bestellung aufgeben',
      abandon: 'Verwerfen',
      retryRelease: 'Bestandsfreigabe erneut versuchen',
    },
    items: {
      headphones: 'Kopfhörer',
      keyboard: 'Mechanische Tastatur',
      lamp: 'Schreibtischlampe',
    },
    form: {
      title: 'Kaufen Sie im Flash-Sale',
      item: 'Artikel',
      quantity: 'Menge',
      total: 'Gesamt {{total}}',
      declineCharge: 'Die Karte wurde abgelehnt',
      failReleases: 'Absichtlich fehlschlagende Bestandsfreigaben',
      failHint:
        'Lehnen Sie die Karte ab, um die Entschädigung zu beobachten. Lassen Sie die Freigabe dreimal oder öfter fehlschlagen, um zu beobachten, wie sie anhält und auf eine Person wartet.',
      submit: 'Erstellen',
    },
    fields: {
      customer: 'Kunde',
      amount: 'Betrag',
      reservation: 'Reservierung',
      paymentRef: 'Zahlung',
    },
    banner: {
      draft: 'Noch nicht platziert.',
      reserving: 'Einheiten werden reserviert…',
      charging: 'Einheiten gehalten; Aufladen der Karte…',
      releasing:
        'Die Abbuchung ist fehlgeschlagen ({{error}}); der reservierte Bestand wird freigegeben…',
      compensationNeedsAttention:
        'Die Einheiten konnten nicht zurückgegeben werden: {{error}} Es wird darauf gewartet, dass jemand die Freigabe erneut versucht.',
      confirmed: 'Bestätigt: Einheiten reserviert und bezahlt.',
      cancelled: {
        customer: 'Verworfen.',
        outOfStock: 'Abgebrochen: {{error}}',
        paymentDeclined:
          'Storniert: Die Karte wurde abgelehnt und die Einheiten wurden zurückgegeben.',
      },
    },
    outside: {
      title: 'Lager- und Zahlungsanbieter (Sandbox)',
      description:
        'Jeder Schritt hat eine Auswirkung auf ein System außerhalb der Anwendung; Das Rückgängigmachen ist ebenfalls ein Schritt.',
      steps: 'Schritte',
      stepsHint: 'Der letzte Durchlauf des Effekts jedes Schritts.',
      reserve: 'Reservebestand',
      charge: 'Laden Sie die Karte auf',
      release: 'Freigabebestand (Vergütung)',
      notYet: 'Nicht ausgeführt',
      stock: 'Lagerbestand',
      stockHint: 'Beobachten Sie, wie die Einheiten abreisen und zurückkommen.',
      item: 'Artikel',
      available: 'Verfügbar',
      reserved: 'Reserviert',
    },
  },
  fulfilments: {
    title: 'Versand',
    list: 'Sendungen',
    new: 'Neue Lieferung',
    empty: 'Keine Lieferungen hier.',
    pick: 'Wählen Sie eine Sendung aus, um deren Zahlung, Lager und Spediteur anzuzeigen.',
    shows:
      'Eine Sendung wartet auf zwei Signale von zwei Systemen in beliebiger Reihenfolge und folgt dann den Ereignissen des Spediteurs – angewendet nach dem Zeitpunkt, an dem sie eingetreten sind, nicht nach ihrem Eintreffen.',
    description:
      'Eine Sendung wird in beliebiger Reihenfolge versandt, sobald die Zahlung erfasst wurde und das Lager sie kommissioniert hat. Die Webhooks des Spediteurs kommen dann zu spät und außer Betrieb; nur ein neueres Ereignis verschiebt es.',
    nothing: 'Sie müssen nichts tun: Die Lieferung wartet auf die Außenseite.',
    actions: {
      ship: 'Hand an den Träger',
      cancel: 'Versand stornieren',
    },
    signals: {
      payment: 'Zahlung erfasst',
      pick: 'Lager kommissioniert',
    },
    and: 'und',
    carrier: {
      booked: 'Gebucht',
      pickedUp: 'Abgeholt',
      inTransit: 'Unterwegs',
      outForDelivery: 'Zur Auslieferung bereit',
      delivered: 'Geliefert',
      exception: 'Ausnahme',
    },
    form: {
      title: 'Öffnen Sie eine Sendung',
      name: 'Name',
      customer: 'Kunde',
      submit: 'Erstellen',
    },
    fields: {
      customer: 'Kunde',
      paid: 'Zahlung erfasst',
      picked: 'Gepflückt',
      tracking: 'Tracking-Nummer',
      carrier: 'Carrier sagt',
      carrierAt: 'Ab',
    },
    banner: {
      preparing: 'Warten auf: {{waiting}}.',
      readyToShip:
        'Bezahlt und kommissioniert: bereit zur Übergabe an den Spediteur.',
      booking: 'Buchung des Spediteurs…',
      shipped: 'Auf dem Weg.',
      exception:
        'Der Spediteur hat ein Problem gemeldet; Ein neueres Ereignis löscht es.',
      delivered: 'Geliefert.',
      cancelled: 'Abgesagt.',
    },
    outside: {
      title: 'Zahlungsanbieter, Lager und Spediteur (Sandbox)',
      description:
        'Senden Sie den Webhook jedes Systems, jetzt oder angehalten. Geben Sie zurückgehaltene in einer anderen Reihenfolge ab, um zu sehen, welche zutreffen.',
      signals: 'Zwei Signale',
      signalsHint:
        'Beides kann zuerst kommen; der zweite befördert die Sendung weiter.',
      capture: 'Zahlung erfasst',
      pick: 'Lager kommissioniert',
      carrierTitle: 'Transportunternehmen',
      carrierHint:
        'Ereignisse rund um das Paket, jeweils mit Angabe des Zeitpunkts, zu dem es passiert ist.',
      status: 'Status',
      location: 'Standort',
      offset: 'In wenigen Minuten',
      send: 'Senden',
      offsetHint:
        'Das letzte Feld verschiebt sich, wenn der Scan durchgeführt wurde: Eine negative Zahl meldet einen älteren Scan.',
      scramble:
        'Halten Sie drei Scans gedrückt, um sie in beliebiger Reihenfolge abzugeben',
    },
  },
  subscriptions: {
    title: 'Abonnements',
    list: 'Abonnements',
    new: 'Abonnieren',
    empty: 'Keine Abonnements hier.',
    pick: 'Wählen Sie ein Abonnement aus, um dessen Abrechnung zu verfolgen.',
    shows:
      'Ein Abonnement bewegt sich einmal im Zeitraum zwischen „Aktiv“ → „Aufladen“ → „Aktiv“, solange es läuft. Die Verlängerung ist am Ende des eigenen Abonnementzeitraums fällig, den der Sweep feststellt; Eine abgelehnte Karte wird durch einen Auslöser erneut versucht, bis sie aufgibt.',
    description:
      'Wird alle {{period}} Minuten berechnet. Eine abgelehnte Belastung wird alle {{dunning}} Minute(n) erneut versucht; Nachdem {{tries}} es versucht hat, wird das Abonnement gekündigt.',
    nothing: 'Sie müssen nichts tun: Die Abrechnung läuft von selbst.',
    actions: {
      updateCard: 'Karte aktualisieren',
      cancel: 'Abmelden',
    },
    plans: {
      basic: 'Grundlegend',
      pro: 'Pro',
    },
    periodN_one: '{{count}}-Periode',
    periodN_other: '{{count}} Perioden',
    form: {
      title: 'Abonnieren',
      plan: 'Plan',
      charge: '{{price}} wird jetzt und zu Beginn jeder Periode berechnet.',
      cardDeclines: 'Die Belastung der Karte wird abgelehnt',
      failHint:
        'Ablehnungen sind Antworten, keine Ausfälle: Die Belastung wird nicht sofort, sondern durch den Mahnauslöser unter einem neuen Schlüssel erneut versucht.',
      submit: 'Abonnieren',
    },
    fields: {
      customer: 'Kunde',
      periods: 'Bezahlte Zeiträume',
      periodEnd: 'Zeitraum endet',
      dunning: 'Fehlversuche',
      lastCharge: 'Letzter Angriff',
      card: 'Karte',
      cardWorks: 'Funktioniert',
      cardValue_one: 'lehnt den nächsten Angriff ab',
      cardValue_other: 'lehnt die nächsten {{count}}-Gebühren ab',
    },
    banner: {
      renewing: 'Die Karte wird aufgeladen…',
      active: 'Aktiv. Erneuert in {{time}}.',
      due: 'Der Zeitraum ist abgelaufen; Beim nächsten Sweep wird es erneuert.',
      pastDue:
        '{{error}} Versuchen Sie {{tries}} oder {{max}}; Nächster Versuch in {{time}}.',
      cancelled: {
        customer: 'Abgemeldet.',
        unpaid: 'Storniert: Die Karte wurde weiterhin abgelehnt.',
      },
    },
    outside: {
      title: 'Abrechnung (Sandbox)',
      description:
        'Jede Abbuchung ist eine Ausführung des Abbuchungseffekts, dessen Schlüssel sich aus dem Abrechnungszeitraum und dem Versuch ergibt.',
      charges: 'Abbuchungen',
      chargesHint: 'Älteste zuerst.',
      noCharges: 'Noch keine Anklage.',
      sweep: 'Erneuerungsdurchlauf',
      sweepHint:
        'Verlängerungen werden durch den Sweep am Ende jedes Abonnementzeitraums ermittelt; Es läuft alle 10 Sekunden, oder jetzt.',
    },
  },
  guide: {
    title: 'Zu diesem Beispiel',
    show: 'Anzeigen',
    hide: 'Verstecken',
    purpose: 'Was es zeigt',
    howTo: 'So probieren Sie es aus',
    samples:
      'Die Beispieldatensätze werden geladen, wenn die Anwendung mit Beispieldaten (APP_SAMPLE_DATA=true) installiert wird. Führen Sie in einer ohne sie installierten Datenbank „pnpm nocobase db sample“ aus.',
    invoices: {
      purpose:
        'Verwenden Sie eine Anbieteranfrage, um Rückrufe, Timeout-Abfragen und Wiederholungsversuche mit einem herunterladbaren Beispiel-PDF zu demonstrieren.',
      step1:
        'Öffnen Sie das Beispiel für Bestellung Nr. 1024, fordern Sie es an und klicken Sie dann in der Sandbox auf „Erfolgreich ausgeben“. Laden Sie nach dem Webhook das Beispiel-PDF herunter.',
      step2:
        'Senden Sie die gleiche Benachrichtigung noch einmal: Sie wird wiederholt und es wird keine zweite Rechnung ausgestellt.',
      step3:
        'Halten Sie bei Bestellung Nr. 1026 den Webhook gedrückt und führen Sie den Fehler erfolgreich aus. Nach 30 Sekunden ist die Abfrage abgeschlossen. Eine spätere Lieferung kann es nicht erneut ausstellen.',
      step4:
        'Das 晨光书jia-Beispiel scheitert dreimal an der Übermittlung. Bei einem erneuten Versuch wird die Rechnung nach einem fehlgeschlagenen Problem wiederhergestellt und die gleiche Anbieteranforderung bleibt erhalten.',
    },
    tickets: {
      purpose:
        'Ein Ticket behält seinen Status in seinem eigenen Statusfeld und jede Änderung – Akzeptieren, Antworten, Lösen, erneutes Öffnen – ist ein im Quellcode deklarierter Übergang. Die Konversation ist das Übergangsprotokoll: Jede Nachricht ist die Eingabe des Übergangs, den sie verursacht hat. E-Mails werden als Effekte ausgeführt, nachdem der Übergang festgeschrieben wurde, mit Wiederholungsversuchen, und ein Ticket, das auf seinen Kunden wartet, wird durch einen Auslöser geschlossen.',
      step1:
        'Verwenden Sie „Angemeldet als“ oben rechts, um zwischen den Supportmitarbeitern und den Kunden zu wechseln. Agenten sehen die gesamte Warteschlange; Ein Kunde sieht nur seine eigenen Tickets.',
      step2:
        'Öffnen Sie als Agent das neue Ticket „无法登录管理后台“ und antworten Sie. Es wartet nun auf den Kunden und schließt sich nach ein paar Minuten der Stille; Die Trigger werden alle 10 Sekunden durchlaufen.',
      step3:
        'Wechseln Sie zu 王女士 und antworten Sie auf ein Ticket, das auf sie wartet: Es geht zurück an seinen Agenten. Ein geschlossenes Ticket kann vom Kunden für 7 Tage wieder geöffnet werden – versuchen Sie es als 李先生 auf „如何导出本月的订单报表？“.',
      step4:
        'Erstellen Sie als Kunde ein Ticket mit der Einstellung „Absichtlich fehlgeschlagene E-Mail-Zustellungen“ unter „Demo-Optionen“ und antworten Sie dann als Agent: „Unter der Haube“ zeigt, dass der E-Mail-Effekt fehlschlägt und es erneut versucht.',
    },
    expenses: {
      purpose:
        'Eine Spesenabrechnung wird nach ihrem Betrag weitergeleitet: Bis zu 5.000 Yen wird sie automatisch genehmigt, darüber genehmigt der Vorgesetzte des Antragstellers und über 50.000 Yen auch der Finanzdirektor. Genehmiger genehmigen, senden zurück oder lehnen mit einer Begründung ab, ein untätiger Manager wird von einem Auslöser übergangen und ein genehmigter Bericht wird von einem Effekt bezahlt, der ihn dann als bezahlt markiert.',
      step1:
        'Verwenden Sie „Angemeldet als“, um die Mitarbeiter 林晓 und 何东, ihre Manager, den Geschäftsführer und den Finanzdirektor zu spielen. Ein Mitarbeiter sieht seine eigenen Berichte; Ein Genehmiger sieht, was ihn erwartet.',
      step2:
        'Reichen Sie als 林晓 den Entwurf „杭州客户拜访“ (¥872) ein: Er wird automatisch genehmigt und einen Moment später bezahlt. „Unter der Haube“ zeigt den Zahlungseffekt und den dadurch ausgelösten „bezahlten“ Übergang.',
      step3:
        'Wechseln Sie zu 赵静, dem Finanzdirektor, und genehmigen Sie „法兰克福展会参展“, das 陈明 bereits genehmigt hat: über ¥ 50.000 benötigt es beides.',
      step4:
        'Reichen Sie als 何东 „北京客户现场支持“ erneut ein, das für weitere Informationen zurückgesendet wurde, und genehmigen Sie es dann als 孙磊. Eine Meldung, die drei Minuten lang bei einem Vorgesetzten hinterlassen wird, wird an den Vorgesetzten des Vorgesetzten eskaliert.',
      step5:
        'Unter „Unter der Haube“ gibt „Was die aktuelle Identität tun kann“ den Grund für jede Aktion an, die die aktuelle Person möglicherweise nicht ausführt. Öffnen Sie einen Wartebericht in zwei Fenstern und handeln Sie in beiden Fenstern: Das zweite wird abgelehnt, da die angezeigte Version veraltet ist.',
    },
    orders: {
      purpose:
        'Eine Bestellung wird nur durch den Webhook des Zahlungsanbieters als bezahlt markiert, niemals durch die Seite. Während es wartet, ist es nur ein Status in der Aufzeichnung – kein Timer, keine offene Anfrage – und ein Webhook, der zu spät, zu früh oder zweimal eintrifft, verschiebt ihn trotzdem genau einmal. Geld, das nach der Stornierung der Bestellung eintrifft, wird zurückerstattet.',
      step1:
        'Öffnen Sie die Beispielbestellung „降噪耳机 × 1“ und klicken Sie auf „Bezahlen“: Ein Effekt öffnet den gehosteten Checkout des Anbieters und die Bestellung wartet auf die Zahlung.',
      step2:
        'Bezahlen oder lehnen Sie die Karte in der gestrichelten Karte „Zahlungsanbieter (Sandbox)“ ab. Der Webhook, den der Anbieter sendet, ist derjenige, der die Bestellung verschiebt. „Erneut liefern“ wird wiederholt abgespielt.',
      step3:
        'Aktivieren Sie „Webhook zurückhalten“, bezahlen Sie, klicken Sie auf „Bestellung stornieren“ und übermitteln Sie dann den zurückgehaltenen Webhook: Die Zahlung landet nach der Stornierung und wird zurückerstattet.',
      step4:
        'Das Beispiel „机械键盘 × 1“ scheitert absichtlich beim ersten Auschecken, um zu zeigen, dass der Effekt erneut versucht wird. Eine unbezahlte Bestellung verfällt nach 3 Minuten.',
    },
    exports: {
      purpose:
        'Der Anbieter sendet keinen Webhook, also fragt der Export ihn ab: Ein Auslöser löst den Selbstübergang „Poll“ aus, die erneute Eingabe von „Verarbeitung“ führt die Prüfung durch und die im Datensatz vermerkte Frist entscheidet, wann aufgegeben werden soll.',
      step1:
        'Öffnen Sie „9 月订单明细“ und klicken Sie auf „Export starten“. Der Verkäufer benötigt 30 Sekunden; Beobachten Sie, wie „Was der Anbieter weiß“ bis zur nächsten Umfrage vor dem läuft, was der Export weiß.',
      step2:
        'Starten Sie „全年客户名单“, dessen Lieferantenjob hängen bleibt: Bei Ablauf der Frist läuft der Export ab und stoppt den Lieferantenjob. „Erneut exportieren“ startet eine neue Runde.',
      step3:
        'Unter „Unter der Haube“ ist jede Abfrage ein Übergang im Protokoll und jede Prüfung ein Effektlauf.',
    },
    purchases: {
      purpose:
        'Ein Flash-Sale-Kauf umfasst zwei Systeme: Das Lager reserviert den Bestand, dann belastet der Zahlungsanbieter die Karte. Bei Ablehnung der Belastung wird der Vorbehalt durch eine eigene Ausgleichsmaßnahme aufgehoben; Eine Entschädigung, die immer wieder fehlschlägt, endet in einem Zustand, in dem eine Person es erneut versucht.',
      step1:
        'Öffnen Sie den Musterkauf von zwei Lampen und klicken Sie auf „Bestellung aufgeben“: Die Einheiten werden reserviert, die Karte wird belastet und der Kauf wird abgeschlossen.',
      step2:
        'Platzieren Sie den Mustertastaturkauf, dessen Karte abgelehnt wurde, und beobachten Sie, wie das Gerät den „Lagerbestand“ verlässt und zurückkommt.',
      step3:
        'Erstellen Sie einen Kauf mit abgelehnter Karte und setzen Sie „Absichtlich fehlschlagende Bestandsfreigaben“ auf 3: Die Bestandsfreigabe stoppt und wartet auf „Bestandsfreigabe erneut versuchen“.',
    },
    fulfilments: {
      purpose:
        'Eine Sendung wartet auf zwei Signale von zwei Systemen – die erfasste Zahlung und die Kommissionierung des Lagers – in welcher Reihenfolge auch immer, und folgt dann dem Spediteur. Trägerereignisse werden nach dem Zeitpunkt ihres Auftretens und nicht nach ihrem Eintreffen angewendet, und ein älteres Ereignis wird als veraltet abgelehnt.',
      step1:
        'Öffnen Sie die Mustersendung und senden Sie „Lager kommissioniert“ und „Zahlung erfasst“ in beliebiger Reihenfolge: Die zweite Sendung versetzt sie in den Status „Versandbereit“.',
      step2:
        'Klicken Sie auf „An Spediteur übergeben“ und senden Sie dann die Scans des Spediteurs, jeweils mit Status und Standort.',
      step3:
        'Aktivieren Sie „Drei Scans zur Übermittlung in beliebiger Reihenfolge zurückhalten“ und liefern Sie den neuesten Scan zuerst: Die früheren werden als veraltet ignoriert.',
      step4:
        'Ein negatives „In Minuten“ meldet einen Scan, der früher stattgefunden hat, was einem späten Ereignis entspricht.',
    },
    subscriptions: {
      purpose:
        'Ein Abonnement wird zu Beginn jeder Periode für die gesamte Laufzeit berechnet. Der Sweep des Plugins erneuert jede Gebühr am Ende ihres eigenen Zeitraums, und eine abgelehnte Gebühr wird vom Mahnauslöser unter einem neuen Schlüssel erneut versucht, bis sie wiederhergestellt wird oder das Abonnement gekündigt wird.',
      step1:
        'Klicken Sie auf „Abonnieren“ und wählen Sie einen Tarif: Die erste Abbuchung erfolgt sofort. Es gibt kein Beispielabonnement, da das Anlegen eines Abonnements die Karte belastet.',
      step2:
        'Abonnieren mit der Einstellung „Belastung der Karte wird abgelehnt“ auf 1: Die Zahlung geht über die Fälligkeit hinaus, wird eine Minute später erneut versucht und wird wiederhergestellt. „Karte aktualisieren“ stellt sie sofort wieder her.',
      step3:
        'Eine Periode dauert 3 Minuten; „Trigger jetzt ausführen“ unter „Erneuerungsdurchlauf“ erneuert alles, was fällig ist, ohne auf den nächsten Durchlauf zu warten.',
    },
  },
  blockers: {
    invoiceRequestMismatch:
      'Das Ergebnis gehört zu einer anderen Rechnungsanforderung.',
    agentOnly: 'Nur ein Supportmitarbeiter kann an Tickets arbeiten.',
    requesterOnly:
      'Dies kann nur der Kunde tun, der das Ticket eingereicht hat.',
    systemOnly:
      'Das System führt dies selbstständig aus, sobald die Wartezeit abgelaufen ist.',
    reopenExpired:
      'Zu lange geschlossen, um wieder zu öffnen; Reichen Sie stattdessen ein neues Ticket ein.',
    applicantOnly: 'Dies kann nur der Antragsteller mit seinem Gutachten tun.',
    approverOnly:
      'Nur der aktuelle Genehmiger kann über diesen Bericht entscheiden.',
    topApprover: 'Der aktuelle Genehmiger hat bereits die höchste Ebene.',
    customersOnly: 'Nur ein Kunde kann für sich selbst ein Ticket einreichen.',
    applicantsOnly:
      'Nur ein Mitarbeiter kann für sich selbst eine Spesenabrechnung einreichen.',
    alreadyPaid: 'Die Zahlung wurde bereits bestätigt.',
    alreadyPicked: 'Das Lager hat es bereits kommissioniert.',
    staleCarrierEvent: 'Ein neueres Trägerereignis wurde bereits angewendet.',
    periodNotOver: 'Die aktuelle Periode ist noch nicht beendet.',
  },
  problems: {
    orderRef: 'Wählen Sie eine abgeschlossene Sandbox-Bestellung.',
    taxNumber:
      'Geben Sie eine Steuernummer mit 15 bis 20 Buchstaben oder Ziffern ein.',
    message: 'Schreiben Sie eine Nachricht.',
    reason: 'Geben Sie einen Grund an.',
    subject: 'Geben Sie dem Ticket einen Betreff.',
    description: 'Beschreiben Sie das Problem.',
    category: 'Wählen Sie eine Kategorie.',
    priority: 'Wählen Sie eine Priorität.',
    title: 'Gib ihm einen Namen.',
    amountCents: 'Der Betrag muss größer als 0 sein.',
    durationSeconds: 'Der Verkäufer benötigt zwischen 5 und 600 Sekunden.',
    vendorOutcome: 'Wählen Sie, wie der Job endet.',
    sku: 'Wählen Sie einen Gegenstand.',
    quantity: 'Kaufen Sie zwischen 1 und 5.',
    plan: 'Wählen Sie einen Plan.',
    customerId: 'Wählen Sie den Kunden.',
  },
  errors: {
    EXPENSE_NOT_FOUND: 'Die Spesenabrechnung existiert nicht.',
    OWN_EXPENSE_ONLY: 'Nur der Antragsteller kann diesen Bericht bearbeiten.',
    EXPENSE_LOCKED:
      'Ein zu prüfender Bericht kann nicht bearbeitet werden; Ziehen Sie es zuerst zurück.',
    EXPENSE_CHANGED:
      'Der Bericht wurde während der Bearbeitung geändert; Laden Sie es neu und versuchen Sie es erneut.',
    SANDBOX_SESSION_CLOSED: 'Die Kasse ist nicht mehr geöffnet.',
    SANDBOX_NOT_FOUND: 'Die Sandbox hat kein solches Objekt.',
    UNKNOWN_WEBHOOK_EVENT: 'Die Sandbox sendet dieses Ereignis nicht.',
    WEBHOOK_EVENT_NOT_FOUND: 'Kein solches Webhook-Ereignis.',
  },
  lifecycle: {
    title: 'Unter der Haube',
    hint: 'Was der Lebenszyklus für diesen Datensatz aufgezeichnet hat. Eine echte Anwendung würde dies ihren Benutzern nicht anzeigen.',
    available: 'Was die aktuelle Identität kann',
    final: 'Kein Übergang verlässt diesen Zustand.',
    diagram: 'Interaktives Diagramm',
    diagramHint:
      'toMermaid(describe()) zeichnet den Lebenszyklus als Zustandsdiagramm; Fügen Sie es in einen beliebigen Mermaid-Renderer ein.',
    retry: 'Erneut versuchen',
    cancel: 'Abbrechen',
    continue: 'Weiter',
    continuationWaits: '{{transition}} wartet: {{error}}',
    continuationAbandoned:
      '{{transition}} hat aufgegeben, nachdem {{attempts}} es versucht hat, bis es von Hand fortgesetzt wurde: {{error}}',
    states: 'Staaten',
    parameters: 'Parameter',
    transitions: 'Übergangsprotokoll',
    effects: 'Effekt läuft',
    noTransitions: 'Noch keine Übergänge.',
    noEffects: 'Noch keine Auswirkungen.',
    attempts: '{{attempts}}/{{max}}',
    runTriggers: 'Trigger jetzt ausführen',
    sweepNote:
      'Trigger werden ohnehin alle 10 Sekunden durchsucht; Dadurch wird der Sweep sofort ausgeführt.',
    swept_one: 'Der Sweep löste den {{count}}-Übergang aus.',
    swept_other: 'Der Sweep löste {{count}}-Übergänge aus.',
    columns: {
      time: 'Zeit',
      transition: 'Übergang',
      change: 'Veränderung',
      actor: 'Von',
      input: 'Eingabe',
      effect: 'Effekt',
      status: 'Status',
      attempts: 'Versuche',
      error: 'Letzter Fehler',
    },
  },
  states: {
    review: 'Wird derzeit überprüft',
    submitting: 'Einreichen',
    awaitingIssue: 'Warten auf Problem',
    querying: 'Abfrage',
    issued: 'Ausgestellt',
    issueFailed: 'Problem fehlgeschlagen',
    new: 'Neu',
    open: 'Öffnen',
    awaitingCustomer: 'Warten auf den Kunden',
    closed: 'Geschlossen',
    draft: 'Entwurf',
    awaitingManager: 'Warten auf den Manager',
    awaitingFinance: 'Warten auf Finanzierung',
    needsInfo: 'Zurückgeschickt',
    approved: 'Genehmigt',
    rejected: 'Abgelehnt',
    paid: 'Bezahlt',
    creatingCheckout: 'Kasse wird geöffnet',
    awaitingPayment: 'Warten auf Zahlung',
    paymentFailed: 'Die Zahlung ist fehlgeschlagen',
    cancelled: 'Abgebrochen',
    refunding: 'Rückerstattung läuft',
    refundNeedsAttention: 'Rückerstattung erfordert Aufmerksamkeit',
    refunded: 'Erstattet',
    fulfilled: 'Ausgeliefert',
    starting: 'Beginnt',
    processing: 'Verarbeitung',
    done: 'Erledigt',
    failed: 'Fehlgeschlagen',
    timedOut: 'Zeitüberschreitung',
    reserving: 'Lagerbestand reservieren',
    charging: 'Wird abgebucht',
    releasing: 'Lagerbestände werden freigegeben',
    compensationNeedsAttention: 'Entschädigung bleibt hängen',
    confirmed: 'Bestätigt',
    preparing: 'Vorbereitung',
    readyToShip: 'Versandbereit',
    booking: 'Buchungsträger',
    shipped: 'Unterwegs',
    exception: 'Carrier-Ausnahme',
    delivered: 'Geliefert',
    renewing: 'Wird abgebucht',
    active: 'Aktiv',
    pastDue: 'Überfällig',
  },
  transitions: {
    retry: 'Erneut versuchen',
    jobStarted: 'Job eingereicht',
    startFailed: 'Die Übermittlung ist fehlgeschlagen',
    poll: 'Umfrageergebnis',
    jobDone: 'Export abgeschlossen',
    jobFailed: 'Export fehlgeschlagen',
    cancel: 'Abbrechen',
    paymentCaptured: 'Zahlung erfasst',
    picked: 'Lager kommissioniert',
    ship: 'Schiff',
    booked: 'Spediteur gebucht',
    trackingUpdated: 'Tracking aktualisiert',
    checkout: 'Kasse öffnen',
    checkoutCreated: 'Kasse geöffnet',
    checkoutFailed: 'Auschecken fehlgeschlagen',
    paymentSucceeded: 'Die Zahlung war erfolgreich',
    paymentDeclined: 'Zahlung abgelehnt',
    paidAfterCancel: 'Zahlung nach Stornierung',
    expire: 'Nach Zeitüberschreitung schließen',
    refundOrder: 'Rückerstattung veranlassen',
    refunded: 'Rückerstattung abgeschlossen',
    refundFailed: 'Rückerstattung fehlgeschlagen',
    retryRefund: 'Rückerstattung erneut versuchen',
    charged: 'Der Angriff war erfolgreich',
    chargeFailed: 'Ladung fehlgeschlagen',
    renew: 'Bei Fälligkeit erneuern',
    retryCharge: 'Abbuchung erneut versuchen',
    updateCard: 'Karte aktualisieren',
    abandon: 'Aufgeben',
    stockReserved: 'Lagerbestand reserviert',
    stockUnavailable: 'Lagerbestand nicht verfügbar',
    stockReleased: 'Lagerbestand freigegeben',
    releaseFailed: 'Lagerfreigabe fehlgeschlagen',
    retryRelease: 'Lagerfreigabe erneut versuchen',
    retryInvoice: 'Rechnung erneut versuchen',
    submitted: 'Antrag eingereicht',
    submissionFailed: 'Die Übermittlung ist fehlgeschlagen',
    query: 'Rechnung abfragen',
    stillPending: 'Noch ausstehend',
    issued: 'Rechnung ausgestellt',
    issueFailed: 'Problem fehlgeschlagen',
    queryFailed: 'Abfrage fehlgeschlagen',
    create: 'Erstellt',
    accept: 'Nimm',
    reply: 'Antworten',
    customerReply: 'Kundenantwort',
    resolve: 'Entschlossenheit',
    autoClose: 'Automatisch schließen',
    reopen: 'Wieder öffnen',
    submit: 'Senden',
    approve: 'Genehmigen',
    reject: 'Ablehnen',
    requestInfo: 'Zurückschicken',
    resubmit: 'Erneut senden',
    withdraw: 'Zurückziehen',
    escalate: 'Eskalieren',
    paid: 'Mark bezahlt',
  },
  runs: {
    queued: 'In der Warteschlange',
    running: 'Wird ausgeführt',
    succeeded: 'Erfolgreich',
    failed: 'Fehlgeschlagen',
    dead: 'Aufgegeben',
    cancelled: 'Abgebrochen',
  },
};

export default deDE;
