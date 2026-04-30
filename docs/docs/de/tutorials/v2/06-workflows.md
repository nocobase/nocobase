# Kapitel 6: Workflows — Das System für Sie arbeiten lassen

Im vorherigen Kapitel haben wir das System mit Berechtigungen ausgestattet, sodass jede Rolle nur ihre eigenen Inhalte sieht. Dennoch werden alle Aktionen weiterhin manuell ausgeführt — ein neues Ticket erfordert eigene Prüfung, und Statusänderungen bleiben anderen verborgen.

In diesem Kapitel nutzen wir den NocoBase-[Workflow](/workflow), damit das System **automatisch arbeitet**: Wir konfigurieren [Bedingungsprüfungen](/workflow/nodes/condition) und [Datenaktualisierungs-Knoten](/workflow/nodes/update), um Ticket-Statusübergänge und Erfassungszeiten automatisch zu protokollieren.

## 6.1 Was ist ein [Workflow](/workflow)?

Ein Workflow ist im Grunde eine Sammlung automatisierter „Wenn …, dann …"-Regeln.

Eine Analogie: Sie stellen auf Ihrem Handy einen Wecker ein, der jeden Morgen um 8 Uhr klingelt. Der Wecker ist der einfachste denkbare Workflow — **wenn die Bedingung erfüllt ist (es ist 8 Uhr), wird automatisch eine Aktion ausgeführt (Klingeln)**.

Der NocoBase-Workflow funktioniert nach demselben Prinzip:

![06-workflows-2026-03-20-13-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-20-13-25-38.jpg)

- **[Trigger](/workflow/triggers/collection)**: der Einstieg in den Workflow. Beispiel: „Jemand hat ein neues Ticket erstellt" oder „Ein Datensatz wurde aktualisiert".
- **Bedingungsprüfung**: optionaler Filterschritt. Beispiel: „Nur weitermachen, wenn der Zuständige nicht leer ist".
- **Aktionen ausführen**: die eigentliche Arbeit. Beispiel: „Benachrichtigung senden" oder „Field aktualisieren".

Die Aktionen können aus mehreren verketteten Knoten bestehen. Häufige Knotentypen sind:

- **Ablaufsteuerung**: Bedingungsprüfung, parallele Verzweigungen, Schleifen, Verzögerungen
- **Datenoperationen**: Datensatz anlegen, aktualisieren, abfragen, löschen
- **Benachrichtigungen und Externes**: Benachrichtigung, HTTP-Request, Berechnungen

Dieses Tutorial nutzt nur die wichtigsten davon. Wenn Sie das Zusammenspiel verstanden haben, können Sie die meisten Szenarien bewältigen.

### Übersicht der Trigger-Typen

NocoBase bietet beim Erstellen eines Workflows mehrere Trigger-Typen zur Auswahl:

| Trigger | Beschreibung | Typische Szenarien |
|-------|------|---------|
| [**Collection-Ereignis**](/workflow/triggers/collection) | Löst beim Anlegen, Aktualisieren oder Löschen aus | Neue-Ticket-Benachrichtigung, Statusänderungs-Log |
| [**Geplanter Task**](/workflow/triggers/schedule) | Löst per Cron-Ausdruck oder zu festen Zeiten aus | Tagesreport, regelmäßige Bereinigung abgelaufener Daten |
| [**Nach-Aktion-Ereignis**](/workflow/triggers/action) | Löst aus, nachdem ein Benutzer eine Aktion ausgeführt hat | Benachrichtigung nach Formularabsendung, Aktionsprotokoll |
| **Genehmigung** | Startet einen Genehmigungsprozess, mehrstufig | Urlaubsantrag, Beschaffungsantrag |
| **Eigene Aktion** | An einen Custom-Button gebunden, durch Klick ausgelöst | Ein-Klick-Archivierung, Massenoperationen |
| **Vor-Aktion-Ereignis** | Fängt eine Benutzeraktion ab, führt synchron aus und gibt dann frei | Prüfungen vor dem Speichern, Auto-Vervollständigung |
| **AI Employee** | Stellt einen Workflow als Tool für einen AI Employee bereit | KI führt Geschäftsoperationen automatisch aus |

In diesem Tutorial verwenden wir die zwei Trigger **Collection-Ereignis** und **Eigenes-Aktionsereignis**. Andere Typen funktionieren analog; wenn Sie das Prinzip einmal verstanden haben, können Sie es übertragen.

Der NocoBase-Workflow ist ein integriertes Plugin — keine zusätzliche Installation erforderlich, sofort einsatzbereit.

## 6.2 Szenario 1: Neuen Ticket-Zuständigen automatisch benachrichtigen

**Anforderung**: Sobald jemand ein neues Ticket erstellt und einen Zuständigen festgelegt hat, sendet das System dem Zuständigen automatisch eine Inbox-Nachricht „Es ist Arbeit eingetroffen".

### Schritt 1: Workflow erstellen

Öffnen Sie das Plugin-Konfigurationsmenü oben rechts und gehen Sie zu **Workflow-Verwaltung**.

![06-workflows-2026-03-14-23-50-45](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-50-45.png)


Klicken Sie auf **Neu** und im Dialog:

- **Name**: „Neuen Ticket-Zuständigen benachrichtigen"
- **Trigger-Typ**: **Collection-Ereignis** auswählen

![06-workflows-2026-03-14-23-53-37](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-53-37.png)


Klicken Sie nach dem Speichern in der Liste auf **Konfigurieren**, um den Editor zu öffnen.

### Schritt 2: Trigger konfigurieren

Klicken Sie oben auf die Trigger-Karte, um den Konfigurations-Drawer zu öffnen:

- **[Collection](/data-sources/data-modeling/collection)**: Hauptdatenquelle / „Tickets"
- **Auslösezeitpunkt**: „Nach Anlegen oder Aktualisieren"
- **Geänderte [Fields](/data-sources/data-modeling/collection-fields)**: „Zuständiger (Assignee)" aktivieren — der Workflow wird nur dann ausgelöst, wenn das Field „Zuständiger" geändert wird, sodass keine überflüssigen Benachrichtigungen bei anderen Änderungen entstehen. (Bei einem Neuanlage-Ereignis gelten alle Felder als geändert, sodass auch neue Tickets auslösen.)
- **Nur wenn folgende Bedingungen erfüllt sind**: Modus „Mindestens **eine** Bedingung der Gruppe", zwei Bedingungen hinzufügen:
  - `assignee_id` ist nicht leer
  - `Assignee / ID` ist nicht leer

  > Warum zwei Bedingungen? Beim Trigger-Zeitpunkt enthält der Datensatz manchmal nur den Fremdschlüssel (assignee_id) ohne das aufgelöste Beziehungsobjekt, manchmal das Beziehungsobjekt, aber nicht den Fremdschlüssel. Mit ODER-Verknüpfung lösen wir auf jeden Fall aus, sobald ein Zuständiger gesetzt ist.

- **Vorab geladene Beziehungsdaten**: „Assignee" aktivieren — der spätere Benachrichtigungsknoten benötigt Informationen zum Zuständigen, daher müssen sie im Trigger vorab geladen werden.

![06-workflows-2026-03-14-23-58-31](https://static-docs.nocobase.com/06-workflows-2026-03-14-23-58-31.png)

Klicken Sie auf Speichern. Damit ist die Bedingungsprüfung schon im Trigger enthalten — der Workflow wird nur ausgelöst, wenn der Zuständige nicht leer ist; ein zusätzlicher Bedingungsprüfungs-Knoten ist nicht nötig.

### Schritt 3: Benachrichtigungs-Knoten hinzufügen

Klicken Sie unter dem Trigger auf **+** und wählen Sie den Knoten **Benachrichtigung**.

![06-workflows-2026-03-15-00-00-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-00-55.png)

Öffnen Sie die Konfiguration des Benachrichtigungs-Knotens. Der erste Punkt ist die Auswahl des **Benachrichtigungs-Channels** — aber wir haben noch keinen Channel angelegt, die Liste ist leer. Legen Sie zuerst einen an.

![06-workflows-2026-03-15-00-10-12](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-10-12.png)


### Schritt 4: Benachrichtigungs-Channel anlegen

NocoBase unterstützt mehrere Channel-Typen:

| Channel-Typ | Beschreibung |
|---------|------|
| **Inbox-Nachricht** | Browser-interne Benachrichtigung, in Echtzeit ins Notification-Center |
| **E-Mail** | Versand per SMTP, Mailserver muss konfiguriert sein |

In diesem Tutorial verwenden wir den einfachsten Channel **Inbox-Nachricht**:

1. Öffnen Sie oben rechts die Plugin-Einstellungen und gehen Sie zu **Benachrichtigungs-Verwaltung**.
2. Klicken Sie auf **Neuer Channel**.

![06-workflows-2026-03-15-00-13-07](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-13-07.png)

3. Wählen Sie als Channel-Typ **Inbox-Nachricht** und vergeben Sie einen Namen (z. B. „System-Inbox").
4. Speichern.

![06-workflows-2026-03-15-00-17-55](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-17-55.png)

### Schritt 5: Benachrichtigungs-Knoten konfigurieren

Kehren Sie zur Workflow-Bearbeitung zurück und öffnen Sie die Konfiguration des Benachrichtigungs-Knotens.

Der Benachrichtigungs-Knoten enthält folgende Optionen:

- **Benachrichtigungs-Channel**: Wählen Sie den eben angelegten „System-Inbox".
- **Empfänger**: Klicken Sie auf Auswahl, dann „Benutzer abfragen → id = Trigger-Variable / Trigger-Daten / Zuständiger / ID".
- **Titel**: Beispiel „Sie haben ein neues Ticket zur Bearbeitung". Variablen werden unterstützt, etwa der Ticket-Titel: `Neues Ticket: {{Trigger-Daten / Titel}}`.
- **Inhalt**: Hauptteil der Benachrichtigung, ebenfalls mit Variablen, um Priorität, Beschreibung usw. einzubinden.

![06-workflows-2026-03-15-20-10-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-10-11.png)

(Im nächsten Schritt suchen wir die Ticket-Adresse. Vorher unbedingt speichern, bevor das Pop-up geschlossen wird!)

- **Detailseite (Desktop)**: URL-Pfad der Ticket-Detailseite. So kommen Sie an den Pfad: Öffnen Sie im Frontend ein beliebiges Ticket-Detail-Pop-up und kopieren Sie den Pfad aus der Adresszeile, etwa `/admin/camcwbox2uc/view/d8f8e122d37/filterbytk/353072988225540`. Fügen Sie den Pfad in das Konfigurationsfeld ein. Die Zahl nach `filterbytk/` ist die Ticket-ID — ersetzen Sie diesen Teil durch die ID-Variable der Trigger-Daten (Variablen-Auswahl → Trigger-Daten → ID). Damit kann der Benutzer in der Inbox direkt auf die Detailseite des Tickets springen, und die Benachrichtigung wird automatisch als gelesen markiert.

![06-workflows-2026-03-15-00-28-32](https://static-docs.nocobase.com/06-workflows-2026-03-15-00-28-32.png)

![06-workflows-2026-03-15-20-15-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-15-19.png)

- **Bei Sendefehler fortfahren**: Optional. Wenn aktiviert, wird der Workflow nicht abgebrochen, falls die Benachrichtigung fehlschlägt.

> Nach dem Versand sieht der Zuständige die Nachricht im **Notification-Center** oben rechts; ungelesene Einträge erhalten ein rotes Hinweissymbol. Ein Klick führt direkt zur Ticket-Detailseite.

### Schritt 6: Testen und aktivieren

> Der gesamte Ablauf von Szenario 1 besteht nur aus zwei Knoten: Trigger (mit Bedingungsfilter) → Benachrichtigung. Einfach und direkt.

Aktivieren Sie noch nicht gleich — der Workflow bietet eine **manuelle Ausführung**, mit der Sie den Ablauf mit konkreten Daten testen können:

1. Klicken Sie oben rechts auf **Ausführen** (nicht den Aktivieren-Schalter).
2. Wählen Sie ein bestehendes Ticket als Trigger-Datensatz.
  > Wenn im Auswahlfeld nur die ID erscheint, gehen Sie zu Datenquellen > Collections > Tickets und setzen Sie die Spalte „Titel" als Titel-Field.
![06-workflows-2026-03-15-19-47-57](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-47-57.png)

3. Klicken Sie auf Ausführen. Der Workflow läuft und wechselt automatisch in eine kopierte neue Version.
![06-workflows-2026-03-15-19-57-19](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-57-19.png)

4. Klicken Sie oben rechts auf die drei Punkte und wählen Sie Ausführungshistorie. Sie sollten den eben durchgeführten Lauf sehen; ein Klick auf den Eintrag zeigt Details — Trigger-Situation, Ausführungsdetails jedes Knotens, Parameter.
![06-workflows-2026-03-15-19-58-34](https://static-docs.nocobase.com/06-workflows-2026-03-15-19-58-34.png)

![06-workflows-2026-03-15-20-01-02](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-01-02.png)


5. Das eben verwendete Ticket scheint Alice zugewiesen zu sein. Wir wechseln zum Konto von Alice — und die Benachrichtigung ist da!

![06-workflows-2026-03-15-20-16-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-22.png)

Ein Klick führt zur Ticket-Seite; gleichzeitig wird die Benachrichtigung als gelesen markiert.

![06-workflows-2026-03-15-20-16-54](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-16-54.png)


Sobald der Ablauf passt, klicken Sie oben rechts auf den **Aktivieren/Deaktivieren**-Schalter und versetzen den Workflow in den aktiven Status.

![06-workflows-2026-03-15-20-18-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-18-16.png)

> **Hinweis**: Sobald ein Workflow einmal ausgeführt wurde (auch manuell), wird er **schreibgeschützt** (grau) und kann nicht mehr bearbeitet werden. Falls Änderungen nötig sind, klicken Sie oben rechts auf **„In neue Version kopieren"** und arbeiten Sie an der neuen Version weiter. Die alte Version wird automatisch deaktiviert.

![06-workflows-2026-03-15-20-19-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-19-11.png)

Kehren Sie zur Ticket-Seite zurück und legen Sie ein neues Ticket an, vergessen Sie nicht, einen Zuständigen auszuwählen. Wechseln Sie dann zum Konto des Zuständigen und prüfen Sie das Notification-Center — dort sollte eine neue Benachrichtigung erscheinen.

![06-workflows-2026-03-15-20-22-00](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-22-00.gif)

Glückwunsch, der erste Automatisierungsablauf läuft!

## 6.3 Szenario 2: Abschlusszeit bei Statusänderung automatisch erfassen

**Anforderung**: Sobald der Status eines Tickets auf „Erledigt" gesetzt wird, trägt das System automatisch die aktuelle Zeit in das Field „Abschlusszeit" ein. Damit muss niemand mehr manuell eintragen, und es wird auch nichts vergessen.

> Falls Sie das Field „Abschlusszeit" in der Tickets-Collection noch nicht angelegt haben, fügen Sie zunächst unter **Collection-Verwaltung → Tickets** ein Field vom Typ **Datum** mit dem Namen „Abschlusszeit" hinzu. Die genaue Vorgehensweise siehe Field-Erstellung in Kapitel 2; wir wiederholen sie hier nicht.
> ![06-workflows-2026-03-15-20-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-25-38.png)

### Schritt 1: Neuen Workflow anlegen

Kehren Sie zur Workflow-Verwaltung zurück und klicken Sie auf Neu:

- **Name**: „Ticket-Abschluss automatisch protokollieren"
- **Trigger-Typ**: **Eigenes-Aktionsereignis** auswählen (löst aus, wenn ein Benutzer auf einen mit dem Workflow verbundenen Button klickt)
- **Ausführungsmodus**: Synchron
> Zum Unterschied zwischen Synchron und Asynchron:
> - Asynchron: Nach der Aktion können Sie weiterarbeiten; der Workflow läuft im Hintergrund und meldet das Ergebnis.
> - Synchron: Nach der Aktion bleibt die Oberfläche im Wartezustand, bis der Workflow vollständig durchgelaufen ist.

![06-workflows-2026-03-19-22-56-34](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-56-34.png)

### Schritt 2: Trigger konfigurieren

Öffnen Sie die Trigger-Konfiguration:

- **Collection**: „Tickets" auswählen
- **Ausführungsmodus**: **Einzelmodus** (jeder Lauf verarbeitet nur das gerade angeklickte Ticket)

![06-workflows-2026-03-19-22-58-21](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-58-21.png)

<!-- TODO: Trigger-Konfiguration-Screenshot ergänzen -->


### Schritt 3: Bedingungsprüfung hinzufügen

Anders als beim Collection-Ereignis-Trigger ist beim Eigenes-Aktionsereignis keine eingebaute Bedingungsprüfung enthalten — wir müssen einen Bedingungs-Knoten selbst hinzufügen:

![06-workflows-2026-03-15-20-39-14](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-39-14.png)

Wir empfehlen die Option „Mit ‚Ja' und ‚Nein' jeweils fortfahren", um spätere Erweiterungen zu erleichtern.

- Bedingung: **Trigger-Daten → Status** ungleich **Erledigt** (also nur unfertige Tickets passieren; bereits erledigte werden nicht erneut verarbeitet)

![06-workflows-2026-03-19-22-37-59](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-37-59.png)

### Schritt 4: Datenaktualisierungs-Knoten hinzufügen

Klicken Sie im „Ja"-Zweig der Bedingungsprüfung auf **+** und wählen Sie den Knoten **Daten aktualisieren**:

![06-workflows-2026-03-15-20-46-22](https://static-docs.nocobase.com/06-workflows-2026-03-15-20-46-22.png)

- **Collection**: „Tickets" auswählen
- **Filterbedingung**: ID gleich Trigger-Daten → ID (stellt sicher, dass nur das aktuelle Ticket aktualisiert wird)
- **Field-Werte**:
  - Status = **Erledigt**
  - Abschlusszeit = **Systemvariable / Systemzeit**

![06-workflows-2026-03-19-22-39-27](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-39-27.png)

> So erledigt ein einziger Knoten beides — „Status ändern" und „Zeit erfassen" —, ohne dass am Button zusätzlich Field-Werte konfiguriert werden müssten.

### Schritt 5: Aktions-Button „Erledigen" anlegen

Der Workflow ist konfiguriert; das „Eigene-Aktionsereignis" muss jedoch an einen konkreten Aktions-Button gebunden werden, damit es ausgelöst wird. Wir legen in der Aktionsspalte der Ticket-Liste einen eigenen „Erledigen"-Button an:

1. Wechseln Sie in den UI-Editor-Modus, klicken Sie in der Aktionsspalte der Ticket-Tabelle auf **„+"** und wählen Sie die Aktion **„Workflow auslösen"**.

![06-workflows-2026-03-19-22-41-31](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-41-31.png)

2. Klicken Sie auf die Button-Optionen, ändern Sie den Titel auf **„Erledigen"** und wählen Sie ein passendes Symbol (z. B. ein Haken-Icon).

![06-workflows-2026-03-19-22-43-39](https://static-docs.nocobase.com/06-workflows-2026-03-19-22-43-39.png)

3. Konfigurieren Sie eine **Linkage Rule** für den Button: Sobald der Status eines Tickets bereits „Erledigt" ist, wird der Button ausgeblendet (erledigte Tickets benötigen kein „Erledigen" mehr).
   - Bedingung: Aktuelle Daten → Status gleich Erledigt
   - Aktion: ausblenden

![06-workflows-2026-03-15-21-15-29](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-15-29.png)

4. Öffnen Sie in den Button-Optionen **„Workflow binden"** und wählen Sie den eben angelegten Workflow „Ticket-Abschluss automatisch protokollieren".

![06-workflows-2026-03-19-23-00-53](https://static-docs.nocobase.com/06-workflows-2026-03-19-23-00-53.png)

### Schritt 6: Event-Flow zur Aktualisierung konfigurieren

Der Button ist angelegt, aber nach dem Klick wird die Tabelle nicht automatisch aktualisiert — der Benutzer sieht die Statusänderung also nicht. Wir konfigurieren den **Event-Flow** des Buttons, damit die Tabelle nach Abschluss des Workflows automatisch aktualisiert wird.

1. Klicken Sie in den Button-Optionen auf das zweite Blitz-Symbol (⚡), um die **Event-Flow**-Konfiguration zu öffnen.
2. Ereignis konfigurieren:
   - **Auslösendes Ereignis**: **Klick** auswählen
   - **Ausführungszeitpunkt**: **Nach allen Flows** auswählen
3. Klicken Sie auf **„Schritt anhängen"** und wählen Sie **„Ziel-Block aktualisieren"**.

![06-workflows-2026-03-20-16-46-59](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-46-59.png)

4. Suchen Sie die Ticket-Tabelle der aktuellen Seite, öffnen Sie deren Konfigurationsmenü, wählen Sie ganz unten **„UID kopieren"** und fügen Sie die UID in den Ziel-Block des Aktualisierungsschritts ein.

![06-workflows-2026-03-20-16-48-39](https://static-docs.nocobase.com/06-workflows-2026-03-20-16-48-39.png)

So wird die Tabelle nach einem Klick auf den „Erledigen"-Button und dem Ende des Workflows automatisch aktualisiert; der Benutzer sieht Statusänderung und Abschlusszeit unmittelbar.

### Schritt 7: Aktivieren und testen

Kehren Sie zur Workflow-Verwaltung zurück und aktivieren Sie den Workflow „Ticket-Abschluss automatisch protokollieren".

Öffnen Sie nun ein Ticket mit Status „In Bearbeitung" und klicken Sie in der Aktionsspalte auf **„Erledigen"**. Sie werden Folgendes feststellen:

- Das Field „Abschlusszeit" des Tickets wird automatisch mit der aktuellen Zeit gefüllt.
- Die Tabelle aktualisiert sich; der Button „Erledigen" verschwindet bei diesem Ticket (die Linkage Rule greift).

![06-workflows-2026-03-15-21-25-11](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-11.gif)

Praktisch, oder? Das ist die zweite gängige Workflow-Anwendung — **Daten automatisch aktualisieren**. Mit der Kombination aus „Eigenes-Aktionsereignis + Button-Bindung" haben wir zudem einen präzisen Auslösemechanismus realisiert: Der Workflow wird nur dann ausgeführt, wenn ein bestimmter Button geklickt wird.

## 6.4 Ausführungshistorie ansehen

Wie oft lief der Workflow? Gab es Fehler? NocoBase merkt sich alles für Sie.

In der Workflow-Verwaltungsliste hat jeder Workflow einen Link mit der **Ausführungsanzahl**. Ein Klick zeigt die Details jedes Laufs:

- **Ausführungsstatus**: Erfolg (grün) oder Fehler (rot), auf einen Blick erkennbar
- **Triggerzeit**: Wann wurde ausgelöst
- **Knotendetails**: Beim Aufklappen sehen Sie die Ergebnisse aller Knoten

![06-workflows-2026-03-15-21-25-38](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-25-38.png)

Falls ein Lauf fehlschlägt, können Sie in den Details sehen, welcher Knoten der Verursacher war und welche Fehlermeldung vorliegt. Das ist das wichtigste Werkzeug zum Debuggen von Workflows.

![06-workflows-2026-03-15-21-36-16](https://static-docs.nocobase.com/06-workflows-2026-03-15-21-36-16.png)

## Zusammenfassung

In diesem Kapitel haben wir zwei einfache, aber praktische Workflows erstellt:

- **Neue-Ticket-Benachrichtigung** (Collection-Ereignis): Benachrichtigt nach Anlage oder Änderung des Zuständigen automatisch — kein Hinterhertelefonieren mehr.
- **Abschlusszeit automatisch erfassen** (Eigenes-Aktionsereignis): Klick auf „Erledigen", Zeit wird automatisch eingetragen, kein menschliches Vergessen.

Die beiden Workflows demonstrieren zwei verschiedene Trigger-Arten und benötigten zusammen weniger als 10 Minuten Konfiguration — das System arbeitet jetzt automatisch für uns. NocoBase unterstützt noch viele weitere Knotentypen (HTTP-Request, Berechnungen, Schleifen usw.), aber für den Einstieg reichen diese Bausteine, um die meisten Szenarien abzudecken.

## Vorschau auf das nächste Kapitel

Das System arbeitet nun automatisch, doch uns fehlt noch der „Gesamtblick" — wie viele Tickets gibt es insgesamt? Welche Kategorie kommt am häufigsten vor? Wie viele neue pro Tag? Im nächsten Kapitel bauen wir mit Diagramm-[Blöcken](/interface-builder/blocks) ein **Daten-Dashboard** und sehen alles auf einen Blick.

## Verwandte Ressourcen

- [Workflow-Übersicht](/workflow) — Kernkonzepte und Einsatzszenarien
- [Collection-Ereignis-Trigger](/workflow/triggers/collection) — Konfiguration des Datenänderungs-Triggers
- [Datenaktualisierungs-Knoten](/workflow/nodes/update) — Konfiguration der automatischen Datenaktualisierung
