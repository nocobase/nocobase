import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const deDE: LocaleResource<typeof enUS> = {
  closeDialog: 'Schließen',
  sortTitle: 'Beispiele sortieren',
  sortIntro:
    'Führen Sie schreibgeschützte Sortierbeispiele mit dem Repository HTTP-Client aus. Builder-Snippets begleiten die eigentlichen serialisierten Anfragen; Tabellen bewahren die Antwortreihenfolge des Servers. Abfragen geben höchstens 10 Wurzeln zurück und verwenden die vorhandenen CRM- und Beziehungs-Seeds wieder.',
  sortLimits:
    'Verwenden Sie logische Feldnamen. Zu viele Pfade erfordern Aggregate; Zu-Eins-Includes akzeptieren keine lokale Sortierung. Der Cursor erfordert nicht nullbare direkte Skalarachsen und einen eindeutigen Tie-Break. „distinct“ akzeptiert nur direkte Skalarsortierung mit eindeutigem Tie-Break. Text und JSON können nicht sortiert werden.',
  sortRequest: 'Tatsächliche Anfrage · JSON AST',
  sortResultHint:
    'Zeilen behalten die Serverreihenfolge bei. Beziehungswerte werden explizit ausgewählt; Datensatzvorschauen können kürzer sein als Gesamtzählungen.',
  sortExpectedError: 'Erwarteter Validierungsfehler',
  sortUnexpectedSuccess: 'Diese ungültige Abfrage war unerwartet erfolgreich.',
  sort_default_title: 'Standard-Primärschlüsselreihenfolge',
  sort_default_description:
    'Sortierung weglassen: Kunden werden durch aufsteigenden Primärschlüssel zurückgegeben.',
  sort_asc_title: 'Produktpreis steigt',
  sort_asc_description:
    'Gibt einen einzelnen aufsteigenden Ausdruck für unitPriceCents zurück; Die Preise sind ganzzahlige Cent-Beträge.',
  sort_desc_title: 'Produktpreis sinkt',
  sort_desc_description:
    'Gibt einen einzelnen absteigenden Ausdruck für unitPriceCents zurück; Die Preise sind ganzzahlige Cent-Beträge.',
  sort_multi_title: 'Mehrere Felder und automatischer Tie-Break',
  sort_multi_description:
    'Menge absteigend, dann Snapshot-Preis aufsteigend. Gleiche Paare verwenden die angehängte ID in aufsteigender Reihenfolge. demo-item-3 und demo-item-7 demonstrieren den Gleichstand.',
  'sort_nulls-first_title': 'NULL-Werte zuerst',
  'sort_nulls-first_description':
    'Nullbare zugewiesene AssigneeId, aufsteigend mit NULL-Werten zuerst. Nicht zugewiesene Aufgaben bleiben sichtbar und die ID löst Bindungen.',
  'sort_nulls-last_title': 'NULL-Werte zuletzt',
  'sort_nulls-last_description':
    'Zulässige AssigneeId mit aufsteigenden NULL-Werten als letztes. Durch die explizite Platzierung werden datenbankspezifische NULL-Standardwerte vermieden.',
  'sort_to-one_title': 'Sortieren Sie eine Eins-zu-Eins-Beziehung',
  'sort_to-one_description':
    'Name des Beauftragten absteigend, Beauftragte fehlen zuletzt. Ein separater Include gibt den für die Sortierung verwendeten Namen zurück.',
  sort_count_title: 'Beziehungsanzahl und gefilterte Auswahl',
  sort_count_description:
    'Rang nach allen Bestellungen, einschließlich Anzahl 0.paidCount wählt nur bezahlte Bestellungen aus; Sein Filter hat keinen Einfluss auf die Root-Sortierung.',
  sort_include_title: 'Unabhängige Include-Reihenfolge',
  sort_include_description:
    'Kunden steigen nach ID auf, während die Bestellungen jedes Kunden nach Nummer absteigen. Pro Kunde gilt das Limit von zwei Datensätzen.',
  sort_duplicate_title: 'Abgelehnt: Sortierziel doppelt',
  sort_duplicate_description:
    'Das gleiche Feld kann nicht zweimal vorkommen, auch nicht mit unterschiedlichen Richtungen. Führen Sie es aus, um INVALID_SORT zu überprüfen.',
  'sort_to-many_title': 'Abgelehnt: Direkter-zu-viele-Feldpfad',
  'sort_to-many_description':
    'items.quantity hat mehrere Werte pro Produkt. Verwenden Sie stattdessen ein explizites Beziehungsaggregat.',
  sort_sum_title: 'Relation SUM-Ranking',
  sort_sum_description:
    'Ordnen Sie Produkte nach SUMME der Artikelmenge, absteigend mit NULL-Werten zuerst. Leere Beziehungen werden als 0 sortiert, obwohl die ausgewählte SUMME NULL ist. Metriken und Artikelzeilen werden explizit ausgewählt.',
  sort_avg_title: 'Beziehung AVG-Ranking',
  sort_avg_description:
    'Ordnen Sie Produkte nach dem Durchschnitt der Artikelmenge, absteigend mit NULL-Werten zuerst. Leere Beziehungen werden als NULL sortiert. Metriken und Artikelzeilen werden explizit ausgewählt.',
  sort_min_title: 'Relation MIN-Ranking',
  sort_min_description:
    'Ordnen Sie Produkte nach der MIN. Artikelmenge, absteigend mit NULL-Werten zuerst. Leere Beziehungen werden als NULL sortiert. Metriken und Artikelzeilen werden explizit ausgewählt.',
  sort_max_title: 'Relation MAX-Ranking',
  sort_max_description:
    'Ordnen Sie Produkte nach MAX der Artikelmenge, absteigend mit NULL-Werten zuerst. Leere Beziehungen werden als NULL sortiert. Metriken und Artikelzeilen werden explizit ausgewählt.',
  selectCombineTitle: 'Wählen Sie „Kombinieren“.',
  selectCombineIntro:
    'Mit select.combine werden benannte Datensatzlisten und Skalaraggregate aus derselben Beziehung zurückgegeben. In jedem Beispiel wird eine schreibgeschützte Repository-findMany-Anfrage ausgeführt.',
  combineScopeHint:
    'Zeigt die ersten 10 Stammdatensätze nach ID an. Beziehungslimits gelten pro übergeordnetem Element und pro Zweig. Führen Sie die Anwendungsmigrationen und Seeds aus, wenn keine Beispieldatensätze vorhanden sind.',
  combineRequest: 'Anfrage · AST auswählen',
  combineTable: 'Datentabelle',
  combineJson: 'Roh JSON',
  combineNoRelated: 'Keine zugehörigen Aufzeichnungen',
  combineTableHint:
    'Spalten verwenden Antwortfeldpfade. Datensatzzweige werden als verschachtelte Tabellen angezeigt. NULL unterscheidet sich von Null- und leeren Listen.',
  combineRun: 'Abfrage ausführen',
  combineResult: 'Abfrageergebnis',
  combineResultHint:
    'Tatsächliche Antwort: Benannte Zweige leben in jedem Beziehungsobjekt.',
  combineEmpty:
    'Keine Stammdatensätze. Führen Sie die Anwendungsmigrationen und Seeds aus oder erstellen Sie Beispieldatensätze.',
  combine_preview_title: 'Bestellvorschau und unabhängige Filialen',
  combine_preview_description:
    'Eine Bestellung in der Vorschau, die vollständige Bestellanzahl, die bezahlte Anzahl und die stornierten Datensätze. Das Vorschaulimit schränkt die Geschwisterzweige nicht ein. Kunden ohne Bestellungen führen leere Listen und Nullzählungen.',
  combine_statistics_title: 'Artikeldatensätze und mehrere Aggregate',
  combine_statistics_description:
    'Zwei Artikelzeilen neben COUNT, SUM-Menge und AVG/MIN/MAX-Snapshot-Einheitspreisen in Cent. AVG ist ungewichtet; Eine leere Beziehung gibt für die anderen Aggregate count 0 und null zurück.',
  combine_nested_title: 'Verschachtelte Bestellungen, Artikel und Produkte',
  combine_nested_description:
    'Jeder Kunde erhält eine Bestellvorschau und -zählung. Jede Vorschaubestellung kombiniert eine Artikelvorschau, eine Anzahl und eine Mengensumme; Artikeldatensätze enthalten auch ihren Produktnamen.',
  combine_scoped_title: 'Gemeinsamer Filter und branchenlokale Filter',
  combine_scoped_description:
    'Der Entwurfsaufgabenfilter gilt für jeden Zweig. COUNT(assigneeId) zählt Nicht-Null-Zuweisungsempfänger; „nicht zugewiesen“ fügt „assigneeId = null“ hinzu. Die einzeilige Vorschau ändert keine der beiden Zählungen.',
  combine_tags_title: 'Viele-zu-viele-Tag-Kombinationen',
  combine_tags_description:
    'Gibt die verknüpften Tags, die Gesamtzahl und die Dokumentationszahl jedes Projekts zurück. Zweigfilter bleiben innerhalb der Beziehung dieses Projekts; Nicht verlinkte Tags sind ausgeschlossen.',
  apiExamples: 'Repository-Beispiele',
  labIntro:
    'Erkunden Sie jeweils einen Beziehungsvorgang. Wählen Sie eine Beziehung, bereiten Sie ein unabhängiges Beispiel vor und verwenden Sie dann dessen Form und Tabelle. Jede Karte besitzt ihr Projekt und ihre Ziele; Beim Laden dieser Seite wird nichts geschrieben.',
  labOperations: 'Beziehungsoperationen',
  labBoth: 'zu-eins / zu-viele',
  labManyOnly: 'nur für viele',
  labRelation: 'Beziehungstyp',
  labPrepare: 'Beispiel vorbereiten',
  labPrepareAgain: 'Bereiten Sie ein neues Beispiel vor',
  labRefresh: 'Tabelle aktualisieren',
  labPrepareHint:
    'Die Vorbereitung erstellt ein Projekt und vier private Ziele. Neue Aufbereitung bewahrt frühere Beispiele. Bei der Vorbereitung werden mehrere Anfragen verwendet. Jeder einzelne Schreibvorgang ist transaktional.',
  labProject: 'Beispielprojekt',
  labDefaultContent: '{{operation}} Beispiel {{id}}',
  labSummary: 'Profilzusammenfassung',
  labLabel: 'Tag-Label',
  labTitle: 'Aufgabentitel',
  labPoints: 'Punkte',
  labTarget: 'Zieldatensatz',
  labChoose: 'Wählen Sie einen Datensatz',
  labNewTarget: 'Beim ersten Durchlauf ein neues Ziel erstellen',
  labNoEligible:
    'Kein geeignetes Ziel. Bereiten Sie ein neues Beispiel vor, um es erneut zu versuchen.',
  labSetTargets: 'Halten Sie diese Ziele verknüpft',
  labSetEmpty:
    'Deaktivieren Sie alle zum Senden eingestellten Werte: []. Entfernte Ziele verbleiben in der Zieltabelle.',
  labThroughRole: 'Rolle auf diesem Link (through.role)',
  labCurrentProfile: 'Aktuelles Profil',
  labNoProfile: 'Derzeit ist kein Profil verlinkt.',
  labDeleteHint:
    'Dadurch wird der ausgewählte Beispielzieldatensatz gelöscht. Es handelt sich nicht um eine Trennung; Die Zeile darunter bleibt als Löschergebnis erhalten.',
  labUpsertHint:
    'Der erste Lauf kann ein Ziel erstellen; Nachfolgende Läufe mit demselben Ziel aktualisieren es. Ziele außerhalb dieser Beziehung sind nicht teilnahmeberechtigt.',
  labExecute: '{{operation}} ausführen',
  labRequest: 'Vorschau der Anforderung dieses Vorgangs',
  labSaved: '{{operation}}-Schreibvorgang erfolgreich.',
  labRefreshFailed:
    'Der Schreibvorgang war erfolgreich, aber das Aktualisieren der Tabelle ist fehlgeschlagen. Verwenden Sie „Tabelle aktualisieren“ vor einem weiteren Schreibvorgang.',
  labTargets: 'Ziele und Beziehungsstatus',
  labTableHint:
    'Jedes Ziel wird unabhängig gelesen: Trennen/Festlegen von Zielen behalten, während Löschen sie entfernt. Es werden nur die Ziele dieser Karte aufgeführt.',
  labRecord: 'Datensatz',
  labLinked: 'Mit diesem Projekt verknüpft',
  labExists: 'Ziel existiert',
  labDeleted: 'Ziel gelöscht',
  labYes: 'Ja',
  labNo: 'Nein',
  labLastCall: 'Letzte ausgeführte Anfrage und Antwort',
  lab_create_title: 'Erstellen und verknüpfen',
  lab_create_description:
    'Erstellen Sie ein Ziel durch die Beziehung. Das Repository füllt die Beziehungsschlüssel. Eine hasOne-Erstellung erfordert in diesem Beispiel eine leere Beziehung.',
  lab_connect_title: 'Verknüpfen Sie ein vorhandenes Ziel',
  lab_connect_description:
    'Wähle ein nicht verknüpftes Ziel, das für diese Karte vorbereitet ist. Durch Connect wird kein Ziel erstellt. Es muss ein hasOne-Ziel verfügbar sein.',
  lab_disconnect_title: 'Verknüpfung aufheben und Ziel behalten',
  lab_disconnect_description:
    'Löschen Sie einen nullbaren hasOne-Link, trennen Sie ein hasMany-Ziel oder entfernen Sie einen Join-Table-Link. Das Ziel bleibt bestehen.',
  lab_set_title: 'Ersetzen Sie den Beziehungssatz',
  lab_set_description:
    'Behalten Sie genau die ausgewählten vorhandenen Ziele bei. Es werden nur To-Many-Beziehungen unterstützt. nullbare hasMany-Schlüssel ermöglichen das Entfernen.',
  lab_update_title: 'Bearbeiten Sie ein verknüpftes Ziel',
  lab_update_description:
    'Bearbeiten Sie ein Ziel innerhalb der aktuellen Beziehung. Bei einer 1:1-Aktualisierung wird das aktuelle Ziel ohne Selektor verwendet.',
  lab_upsert_title: 'Beziehungsbereich aktualisieren oder erstellen',
  lab_upsert_description:
    'Erstellen, wenn kein passendes Ziel verknüpft ist, andernfalls aktualisieren. To-many verwendet eine stabile eindeutige ID sowohl für die Suche als auch für die Erstellung.',
  lab_delete_title: 'Löschen Sie den Zieldatensatz',
  lab_delete_description:
    'Löschen Sie ein verknüpftes Ziel, vorbehaltlich Einschränkungen. Verwenden Sie nur die für diese Karte vorbereiteten Ziele. Gemeinsame Ziele können andere Beziehungen beeinflussen.',
  relationMutationsTitle: 'Beziehung schreibt',
  relationMutationsIntro:
    'Führen Sie einen vollständigen Repository-HTTP-Beziehungsworkflow für „gehörtTo“, „hasOne“, „hasMany“ und „gehörtToMany“ aus. Jede Schaltfläche verwendet api.repository(name); Es ist kein beispielspezifischer Mutationsendpunkt beteiligt.',
  relationBaselineTitle: 'Grundlinie der gesäten Beziehung',
  relationBaselineDescription:
    'Deterministische Datensätze spiegeln die Repository-Beziehungsschreibdokumentation wider, während Sammlungsnamen mit Plugin-Präfix verwendet werden.',
  relationSeedHint:
    'Führen Sie die Anwendungsmigrationen und Seeds aus, um die Beziehungsbeispieldatensätze zu erstellen.',
  relationRunTitle: 'Komplette Mutations-Komplettlösung',
  relationRunDescription:
    'Erstellt ein isoliertes Projektdiagramm, wendet inkrementelle Beziehungsoperationen an und ersetzt dann seinen Tag-Satz. Jede Wurzelmutation ist transaktional.',
  relationRunButton:
    'Führen Sie den vollständigen Beziehungsschreibvorgang aus',
  relationRunIsolation:
    'Bei jedem Lauf werden neue IDs verwendet, sodass frühere Beispiele weiterhin zur Überprüfung verfügbar bleiben.',
  relationResultTitle: 'Endgültiger Beziehungsstatus',
  relationResultDescription:
    'Der Besitzer und das Profil wurden aktualisiert, Aufgabenvorgänge wurden im Beziehungsbereich angewendet und der Satz behielt nur die ausgewählten Tags bei.',
  relationLifetimeTitle: 'Überprüfung der Ziellebensdauer',
  relationLifetimeDescription:
    'Trennen Sie die Verbindung und setzen Sie „Links entfernen“, aber behalten Sie die Ziele bei; delete entfernt den Zieldatensatz.',
  relationTraceHint:
    'Tatsächliche Repository-Namen, createOne/updateOne-Nutzlasten und von diesem Lauf ausgegebene Antworten.',
  relationOwnerLabel: 'gehört zu · Eigentümer',
  relationProfileLabel: 'hasOne · Profil',
  relationTasksLabel: 'hat viele · Aufgaben',
  relationTagsLabel: 'gehörtToMany · Tags',
  relationTasks: 'Verwandte Aufgaben',
  relationPoints: 'Punkte',
  relationAssignee: 'Zugewiesene Person',
  relationDisconnectCheck:
    'Verbindung trennen: Aufgabe existiert={{exists}}, Projekt-ID={{projectId}}',
  relationDeleteCheck: 'löschen: Aufgabe existiert={{exists}}',
  relationSetCheck: 'gesetzt: entferntes Tag exist={{exists}}',
  findManyTitle: 'findMany: Array und Stream',
  findManyIntro:
    'Führen Sie dieselbe Repository-Abfrage in zwei Verbrauchsmodi aus. Await wird einmal mit dem kompletten Array aufgelöst; Die asynchrone Iteration liest gerahmte NDJSON-Datensätze, sobald sie eintreffen. Die Datenbankabfrage, Filter, Sortierung und Grenzwerte bleiben gleich.',
  findManyArrayTitle: 'Warte auf ein Array',
  findManyArrayDescription:
    'Wartet darauf, dass findMany eine normale JSON-Anfrage sendet und mit allen übereinstimmenden Datensätzen aufgelöst wird.',
  findManyStreamTitle: 'Iterieren Sie einen Stream',
  findManyStreamDescription:
    'Die Verwendung von forawait sendet eine NDJSON-Anfrage und hängt jeden dekodierten Datensatz an die Ergebnistabelle an.',
  findManyProtocol: 'HTTP-Antwort',
  findManyRunArray: 'Array-Abfrage ausführen',
  findManyRunStream: 'Stream-Abfrage ausführen',
  findManyReceived: 'Aufzeichnungen erhalten',
  findManyReceivedCount: '{{count}}-Datensätze empfangen',
  findManyResults: 'Ergebnisse',
  findManyRecordTitle: 'Titel',
  findManyCategory: 'Kategorie',
  findManyDescription: 'Beschreibung',
  findManyEmpty:
    'Führen Sie diese Abfrage aus, um die vordefinierten Beispieldatensätze zu laden.',
  atomicTitle: 'Atomnumerische Aktualisierungen',
  atomicIntro:
    'Zahlen direkt in der Datenbank durch Inkrementieren, Dekrementieren und Multiplizieren aktualisieren. Anfragen senden den Vorgang, niemals einen Wert, der aus einem möglicherweise veralteten Browser-Snapshot berechnet wird. Alle angemeldeten Benutzer teilen diese Beispielzähler.',
  atomicStock: 'Lagerbestand',
  atomicStockHint:
    'Einheiten erhalten oder abziehen. Der Abzug prüft den verfügbaren Bestand in derselben Aktualisierung und verhindert so einen negativen Bestand.',
  atomicWallet: 'Kontostand (Cent)',
  atomicWalletHint:
    'Ganzzahlige Cent aufladen oder ausgeben. Die Bilanzbedingung und die Subtraktion werden gemeinsam in der Datenbank ausgewertet.',
  atomicPoints: 'Prämienpunkte',
  atomicPointsHint:
    'Addieren Sie Punkte oder verdoppeln Sie die aktuellen Punkte mit Multiplikation: 2. Beim Verdoppeln wird der aktuelle Datenbankwert verwendet.',
  atomicVisits: 'Besucherzähler',
  atomicVisitsHint:
    'Einmal erhöhen oder 10 gleichzeitige Erhöhungen senden: 1 Anfragen. Andere Benutzer können diesen gemeinsamen Zähler ebenfalls ändern.',
  atomicAmount: 'Betrag',
  atomic_increment: 'Steigerung',
  atomic_decrement: 'Abnahme (bewacht)',
  atomic_multiply: 'Doppelt ×2',
  atomic_concurrent: '10 gleichzeitig +1',
  atomicSeedHint:
    'Führen Sie die Anwendungsmigrationen und Seeds aus, um diesen Beispielzähler zu erstellen.',
  atomicInsufficient:
    'Der Zähler wurde entfernt oder sein aktueller Wert reicht nicht aus. Es wurde nichts abgezogen.',
  atomicUpdated: 'Die Datenbank hat den neuen Wert zurückgegeben: {{value}}.',
  atomicConcurrentResult:
    '{{count}} von 10 gleichzeitigen Inkrementen waren erfolgreich. Der angezeigte Wert wird erneut aus der Datenbank gelesen.',
  atomicPartial:
    'Einige Inkremente sind fehlgeschlagen. Erfolgreiche Anfragen bleiben festgeschrieben; Überprüfen Sie die Ergebnisse, bevor Sie es erneut versuchen.',
  atomicTraceHint:
    'Tatsächliche updateOne-Eingaben und -Antworten, einschließlich abgelehnter Updates. Es werden keine automatischen Wiederholungsversuche durchgeführt.',
  groupByExamples: 'Weitere GroupBy-Beispiele',
  groupByMinimumCount: 'Mindestreihen pro Gruppe (neue Beispiele)',
  groupByEmpty:
    'Keine Gruppe entspricht diesen Filtern. Reduzieren Sie die Mindestanzahl oder ändern Sie den Status.',
  groupBy_customerRanking: 'Rangfolge der Kundenbestellungen',
  groupBy_customerRankingHint:
    'GROUP BY customerId · COUNT(*) · HAVING count ≥ Minimum · count DESC, customerId ASC. Kunden ohne übereinstimmende Bestellungen bilden keine Gruppe.',
  groupBy_customerStatus: 'Kunde × Bestellstatus',
  groupBy_customerStatusHint:
    'GROUP BY customerId, Status. Derselbe Kunde kann in mehreren Statusgruppen vorkommen. HAVING gilt für jede Kombination, nicht für die Kundensumme. Aufzählungsgruppen bewahren genaue Werte; Beim Sortieren werden Anzahl und Kunden-ID verwendet.',
  groupBy_productPrice: 'Produkt × Stückpreis des Artikels',
  groupBy_productPriceHint:
    'GROUP BY Produkt-ID, UnitPriceCents · COUNT(*) und SUM(Menge). Unterschiedliche Artikel-Snapshot-Preise bleiben auch für dasselbe Produkt getrennt. Sortieren nach Menge DESC, Produkt-ID ASC, Preis ASC. Die Preise betragen Cent; COUNT misst Artikelzeilen, nicht Einheiten.',
  aggregateApply: 'Anwenden',
  aggregateTitle: 'Aggregierte Abfragen',
  aggregateIntro:
    'Datenbankseitige Statistiken über die vorhandenen Bestellungen und Artikel: Aggregat, GroupBy mit HAVING und Anzahl der Beziehungen pro Kunde. Statusfilter gelten für alle Panels; Die Mindestmenge gilt nur für Produktgruppen. Die Mindestzeilenanzahl gilt für die drei zusätzlichen „groupBy“-Beispiele.',
  aggregateAll: 'Alle Status',
  aggregateHaving: 'Mindestgruppierte Menge (HAVING)',
  aggregateMetrics: 'Artikelaggregate',
  aggregate_count: 'COUNT · Elementzeilen',
  aggregate_quantity: 'SUM · Menge',
  aggregate_averagePrice: 'AVG · Stückpreis (Cent)',
  aggregate_minimumPrice: 'MIN · Stückpreis (Cent)',
  aggregate_maximumPrice: 'MAX · Stückpreis (Cent)',
  aggregateSemantics:
    'Der Durchschnittspreis ist der ungewichtete Durchschnitt der Artikelstückpreise, kein Bestellgesamtpreis oder mengengewichteter Preis. Leere Sätze geben die Anzahl 0 und NULL für SUM/AVG/MIN/MAX zurück. Panels führen separate Abfragen aus und können gleichzeitige Bearbeitungen beobachten.',
  aggregateStatuses: 'Bestellungen nach Status gruppiert · groupBy',
  aggregateCustomers: 'Aggregate zur Kundenbeziehung',
  aggregateCustomerHint:
    'Erste {{count}}-Kunden nach ID, einschließlich Kunden mit null passenden Bestellungen. Zählungen verwenden den ausgewählten Status.',
  aggregateProducts: 'Artikel nach Produkt gruppiert',
  aggregateTraceHint:
    'Ruft die konfigurierten Repository-HTTP-Aggregate/GroupBy-Aktionen mit JSON-ASTs auf; Kundenzählungen verwenden findMany-Relationsauswahlen. Erweitern Sie die Anforderungen, um die tatsächlichen Ausdrücke zu überprüfen.',
  crm: 'CRM-Beispiel',
  ordersTitle: 'Beispiel für Bestellungen',
  subtitle:
    'Kunden, Beziehungen und Bestellungen, unterstützt durch Repository-APIs.',
  customer: 'Kunde',
  contact: 'Kontakt',
  product: 'Produkt',
  order: 'Bestellung',
  orderItem: 'Bestellposition',
  customers: 'Kunden',
  contacts: 'Kontakte',
  products: 'Produkte',
  orders: 'Bestellungen',
  items: 'Artikel bestellen',
  name: 'Name',
  company: 'Unternehmen',
  email: 'E-Mail',
  phone: 'Telefon',
  status: 'Status',
  sku: 'Artikelnummer',
  unitPriceCents: 'Stückpreis (Cent)',
  number: 'Bestellnummer',
  customerId: 'Kunde',
  orderId: 'Bestellung',
  productId: 'Produkt',
  quantity: 'Menge',
  lead: 'Lead',
  active: 'Aktiv',
  inactive: 'Inaktiv',
  draft: 'Entwurf',
  confirmed: 'Bestätigt',
  paid: 'Bezahlt',
  cancelled: 'Abgebrochen',
  new: 'Neuer Rekord',
  edit: 'Bearbeiten',
  view: 'Details anzeigen',
  delete: 'Löschen',
  save: 'Speichern',
  cancel: 'Abbrechen',
  search: 'Suche nach Name/Nummer/ID',
  apply: 'Suchen',
  refresh: 'Aktualisieren',
  previous: 'Zurück',
  next: 'Weiter',
  page: 'Seite {{page}}',
  count: '{{count}}-Datensätze',
  empty:
    'Noch keine Aufzeichnungen. Erstellen Sie zunächst den ersten Datensatz.',
  loading: 'Wird geladen…',
  listFeedback: {
    loading: 'Wird geladen',
    empty: 'Keine Daten vorhanden',
    noResults: 'Keine Ergebnisse',
    forbidden: 'Zugriff verweigert',
    unauthenticated: 'Sitzung abgelaufen',
    failed: 'Liste konnte nicht geladen werden',
    refreshFailed:
      'Aktualisierung fehlgeschlagen; vorherige Daten werden angezeigt',
    retry: 'Erneut versuchen',
    retrying: 'Wird erneut versucht…',
    clear: 'Filter löschen',
    signIn: 'Anmelden',
  },
  select: 'Wählen Sie einen Datensatz aus',
  createTitle: 'Erstellen Sie {{entity}}',
  editTitle: '{{entity}} bearbeiten',
  details: 'Details aufzeichnen',
  relations: 'Zugehörige Datensätze',
  none: 'Keine',
  lookup: 'Nach ID suchen',
  check: 'Prüfen und öffnen',
  notFound: 'Kein Eintrag mit dieser ID.',
  found: 'Datensatz vorhanden.',
  saved: 'Datensatz gespeichert.',
  deleted: 'Datensatz gelöscht.',
  confirmDelete:
    'Diesen Datensatz löschen? Zugehörige Kontakte oder Bestellpositionen werden ebenfalls entfernt. Kunden mit Bestellungen und von Bestellpositionen verwendeten Produkten können nicht gelöscht werden.',
  confirm: 'Löschen bestätigen',
  trace: 'Repository-Aufrufe',
  traceHint:
    'Die letzte Anfrage und das Ergebnis zeigen den von diesem Bildschirm verwendeten API.',
  error: 'Der Vorgang ist fehlgeschlagen.',
  loadError:
    'Datensätze können nicht geladen werden. Versuchen Sie es erneut mit Aktualisieren.',
  conflict:
    'Diese Bestellung hat sich seit dem Öffnen geändert. Aktualisieren Sie es und öffnen Sie es erneut, bevor Sie es bearbeiten.',
  choicesHint:
    'Erstellen Sie zuerst Kunden und Produkte, dann Bestellungen und deren Artikel.',
  moneyHint:
    'Die Preise sind ganze Cents. Zeilensumme = Menge × Stückpreis; Keine Gleitkomma-Währungsberechnung.',
  version: 'Version',
  addItem: 'Element hinzufügen',
  removeItem: 'Element entfernen',
  orderTotal: 'Bestellsumme (Cent)',
  noItems: 'Keine Bestellpositionen.',
  itemRow: 'Artikel {{number}}',
  lineTotal: 'Zeilensumme (Cent)',
  id: 'ID',
  back: 'Zurück zur Liste',
  close: 'Details schließen',
  request: 'Anfrage',
  response: 'Antwort',
  loadingChoices: 'Zugehörige Datensätze werden geladen…',
};

export default deDE;
