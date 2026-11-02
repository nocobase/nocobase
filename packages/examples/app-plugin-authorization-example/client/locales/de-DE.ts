import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  practice: {
    intro:
      'Verwenden Sie die unten aufgeführten Konten anstelle eines Administrators. Administratoren umgehen die Einschränkungen. Hierbei handelt es sich um unabhängige Vertriebskooperationsübungen, nicht um einen vollständigen Workflow zur Genehmigung von Angeboten und Aufträgen. Jede Übung beginnt mit dem gesetzten Datensatzstatus.',
    read: {
      title: 'Ein Assistent konsultiert Projektinformationen',
      steps:
        'Melden Sie sich als sales_assistant an: Projekte zeigt project-1, project-2 und project-3 an, aber keine Bearbeitungsaktionen. Angebote und Bestellungen bleiben auf das eigene Projekt beschränkt.',
      reason:
        'Projektfreigabe-Zuschussdatensätze sind nur zur Ansicht bestimmt; es gewährt weder Bearbeitung noch zugehörige Aufzeichnungen. Geheimhaltung project-4 bleibt ausgeschlossen.',
    },
    scopes: {
      title: 'Ein Ingenieur erstellt ein Angebot und reicht es ein',
      steps:
        'Melden Sie sich als sales_engineer an: Bearbeiten und senden Sie Ihr quote-2. Sie können quote-5 konsultieren, das Angebot eines Kollegen jedoch nicht ändern oder einreichen. Sie können quote-6 weiterhin vorbereiten, es jedoch nicht für ein Projekt außerhalb Ihrer Region einreichen.',
      reason:
        'Nicht vertrauliche Angebote sind internes Referenzmaterial über Regionen hinweg. Der Ersteller ist Eigentümer des Inhalts; Die regionale Zuständigkeit regelt die Vorlage. Durch das Betrachten ist keine Bearbeitung möglich. Bestehende Bestellungen verweisen auf separate akzeptierte Angebote. Durch die Abgabe eines Praxisangebots entsteht kein Auftrag.',
    },
    handover: {
      title: 'Ein beauftragter Ingenieur übernimmt ein Angebot',
      steps:
        'Ein Projektinhaber aus der Südregion übergibt quote-7 an sales_proposal, einen Ingenieur aus der Nordregion. Melden Sie sich als sales_proposal an, bearbeiten Sie das Angebot und senden Sie es ab. Setzen Sie als Administrator die Datensätze zurück und entfernen Sie sales_proposal aus der Freigaberegel für Angebotsangebotsübergabe. Erneut anmelden: Das Konto kann dieses Angebot nicht mehr bearbeiten oder übermitteln.',
      reason:
        'Mit der Übergabe ist die Bearbeitung und Übermittlung dieses Angebots sowie der für die Übermittlung erforderliche Projektzugang gestattet; es delegiert nicht die gesamte Südregion. Die Ingenieurrolle gewährt Vorgänge, während die Freigabe die Datensätze identifiziert. Als fortgeschrittene Übung können Sie entweder den Projekt- oder Angebotsumfang zurückziehen: Für die Einreichung ist beides erforderlich.',
    },
    delivery: {
      title: 'Ein Lieferspezialist führt eine Bestellung aus',
      steps:
        'Melden Sie sich als sales_delivery an. Öffnen Sie order-2, weisen Sie einen Spediteur zu, pflegen Sie Prüfpunkte und geben Sie eine Lieferreferenz ein. Nach der Bestätigung der Lieferung können weder die Beziehungen noch der Lieferstatus erneut geändert werden. Setzen Sie die Aufzeichnungen zurück, bevor Sie die Übung wiederholen.',
      reason:
        'Zusteller geben nur Bestellungen ein; Links zu Angeboten und Projekten gewähren keinen Zugriff auf diese Seiten.',
    },
  },
  reset: {
    action: 'Übungsaufzeichnungen zurücksetzen',
    cancel: 'Abbrechen',
    confirm:
      'Die gesetzten Projekte, Angebote und Bestellungen für jedes Demokonto wiederherstellen? Änderungen an diesen Datensätzen werden überschrieben.',
    description:
      'Ein Administrator kann hier Geschäftsdaten zurücksetzen, bevor er eine Übung wiederholt. Konten und Berechtigungseinstellungen bleiben erhalten; Stellen Sie alle Autorisierungsänderungen manuell wieder her.',
    done: 'Übungsaufzeichnungen wiederhergestellt. Aktualisieren Sie alle offenen Datensatzlisten.',
  },
  access: {
    title: 'Deine Rollen',
    direct: 'Direkte Zuordnung',
    coverage:
      'Jedes Beispielkonto behält seine beruflichen Verantwortlichkeiten durch eine direkte Zuweisung.',
  },
  rules: {
    public: 'Vertrauliche Projekte ausschließen',
    delivery: 'Regionale Lieferaufträge',
    handover: 'Angebotsübergabe',
    projects: 'Geteilte Beispielprojekte',
  },
  accountMenus: {
    assistant: 'Projekte, Angebote und Bestellungen (schreibgeschützt)',
    engineer:
      'Konsultieren Sie nicht vertrauliche Angebote; Bearbeiten Sie eigene Angebote und übermitteln Sie sie innerhalb der zugewiesenen Region',
    manager:
      'Eigene Projekte verwalten; Angebote und Bestellungen sind schreibgeschützt',
    delivery: 'Nur Bestellungen; regionale Lieferungen bestätigen',
    proposal: 'Bearbeiten und übermitteln Sie das übergebene quote-7',
    coordinator: 'Verwalten Sie project-8 außerhalb der Heimatregion',
  },
  relations: {
    access: {
      notGranted: 'Schreibgeschützt: Lieferkoordination wird nicht gewährt.',
      outsideScope:
        'Schreibgeschützt: Diese Bestellung liegt außerhalb Ihres Lieferumfangs.',
      notReady: 'Ausgelieferte Bestellungen können nicht geändert werden.',
    },
    title: 'Bestellbeziehungen',
    description:
      'Weisen Sie einen aktiven Spediteur zu, führen Sie Kontrollen durch und verwalten Sie kooperierende Spediteure. Probieren Sie ein Zustellungskonto und ein schreibgeschütztes Konto aus, um den Zugriff zu vergleichen.',
    order: 'Bestellung',
    carrier: 'Transportunternehmen',
    unassigned: 'Keine zugewiesen',
    assign: 'Transportunternehmen zuweisen',
    disconnect: 'Zuordnung entfernen',
    checks: 'Lieferschecks',
    done: 'Erledigt',
    pending: 'Ausstehend',
    toggle: 'Abschluss umschalten',
    delete: 'Prüfpunkt löschen',
    checkTitle: 'Bezeichnung des Prüfpunkts',
    add: 'Prüfpunkt hinzufügen',
    collaborators: 'Kooperationspartner',
    note: 'Hinweis zur Zusammenarbeit',
    addProposal: 'Ausgewählten Transportunternehmen hinzufügen',
    replace: 'Durch ausgewählten Transportunternehmen ersetzen',
    clear: 'Alle Mitarbeiter entfernen',
    unavailable: 'Diese Beziehungen sind nicht zugänglich.',
    loading: 'Beziehungen werden geladen…',
  },
  sales: {
    manageRelations: 'Ordnen Sie die Lieferung der Bestellung an',
    saveFirst: 'Änderungen vor dem Absenden speichern.',
    states: {
      draft: 'Entwurf',
      submitted: 'Eingereicht',
      accepted: 'Akzeptiert',
      ready: 'Bereit',
      delivered: 'Geliefert',
    },
    errors: {
      session: 'Sitzung abgelaufen. Melden Sie sich erneut an.',
      input: 'Überprüfen Sie den Betrag und die erforderlichen Felder.',
      conflict:
        'Der Datensatzstatus hat sich geändert. Aktualisieren Sie die Datei, bevor Sie es erneut versuchen.',
      request:
        'Anfrage fehlgeschlagen. Überprüfen Sie Ihre Verbindung und versuchen Sie es erneut.',
    },
    operation: {
      outsideScope: 'Außerhalb des zulässigen Betriebsbereichs',
      notReady: 'Es können nur fertige Bestellungen ausgeliefert werden',
      allowed: 'Im Rahmen der Einreichung',
      notGranted: 'Schreibgeschützt – Vorgang nicht gewährt',
      quoteScope: 'Außerhalb des zulässigen Angebotsbereichs',
      projectScope: 'Projekt außerhalb des zulässigen Umfangs',
      notDraft: 'Es können nur Entwürfe eingereicht werden',
      invalidAmount: 'Betrag muss positiv sein',
    },
    preparedBy: 'Erstellt von',
    parentProject: 'Projekt',
    sourceQuote: 'Quellenangabe',
    relationships: 'Zugehörige Datensätze',
    relatedQuotes: 'Projektzitate',
    relatedOrders: 'Projektaufträge',
    filtered: 'Gefiltert nach',
    clearFilter: 'Filter löschen',
    noPageAccess: 'Kein Seitenzugriff',
    descriptions: {
      projects:
        'Öffnen Sie zugehörige Angebote und Bestellungen aus einem Projekt. Themenlisten zeigen nur Datensätze an, auf die dieses Konto zugreifen kann.',
      quotes:
        'Ein Projekt kann mehrere Angebote haben. Die Einreichung prüft den Projektumfang und den Angebotsersteller unabhängig und validiert dann den Entwurfsstatus und den Betrag.',
      orders:
        'Jede Bestellung verweist auf ihr Quellangebot und ihr Projekt. Lieferkonten erfassen nur Bestellungen; Verweise gewähren keinen Zugriff auf andere Seiten oder Datensätze.',
    },
    delivery: 'Lieferung',
    orders: 'Bestellungen',
    editProject: 'Projektinformationen bearbeiten',
    editQuote: 'Preise bearbeiten',
    submit: 'Angebot einreichen',
    submitScopes: {
      projects: 'Mit den Angeboten verknüpfte Projekte',
      quotes: 'Angebote dürfen eingereicht werden',
    },
    deliver: 'Lieferung bestätigen',
    amount: 'Betrag',
    status: 'Status',
    deliveryReference: 'Lieferreferenz',
    group: 'Vertriebskooperation',
    title: 'Beispiel für Vertriebsberechtigungen',
    projects: 'Projekte',
    quotes: 'Angebote',
    view: 'Anzeigen',
    edit: 'Notizen bearbeiten',
    intro:
      'Erkunden Sie die Zugriffsgrenzen von Beratungsunterlagen von Assistenten, Angebotserstellungsingenieuren, delegierten Angebotsübergaben und Lieferpersonal bei der Auftragserfüllung.',
    record: 'Datensatz',
    notes: 'Notizen',
    save: 'Speichern',
    refresh: 'Aktualisieren',
    loading: 'Wird geladen…',
    empty: 'Keine zugänglichen Aufzeichnungen',
    readOnly: 'Schreibgeschützt',
    saved: 'Gespeichert',
    scope: {
      prepared: 'Von mir erstellte Angebote',
      title: 'Verkaufsdatenumfang',
      unrestricted: 'Keine Einschränkung',
      region: 'Meine Region',
      own: 'Übergeordnetes Projekt, das mir gehört',
      public: 'Nicht vertrauliche Projekte',
    },
  },
  title: 'Beispiel für Vertriebsberechtigungen',
  overview: 'Anleitung',
  actions: 'Aktionen',
  testAccounts: 'Beispielkonten',
  account: 'Konto',
  permissionSet: 'Berechtigungssatz',
  password: 'Beispielpasswort: AuthzExample123!',
  tryTitle: 'Konfigurieren und überprüfen',
  roles: {
    assistant: 'Verkäuferassistent',
    engineer: 'Vertriebsingenieur',
    manager: 'Projektmanager',
    delivery: 'Lieferspezialist',
  },
  forbidden: 'Sie haben keine Berechtigung für diesen Vorgang.',
  error: 'Laden fehlgeschlagen. Bitte versuchen Sie es erneut.',
};

export default deDE;
