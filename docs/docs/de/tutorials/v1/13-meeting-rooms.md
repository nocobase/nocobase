# Kapitel 12: Konferenzraumbuchung und Workflow

<iframe width="800" height="436" src="https://player.bilibili.com/player.html?isOutside=true&aid=114048192480747&bvid=BV1PKPuevEH5&cid=28526840811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

Sicher sind Sie inzwischen mit **NocoBase** bestens vertraut.

In diesem Kapitel setzen wir gemeinsam ein besonderes Szenario um: ein Modul zur Besprechungsverwaltung.

Dieses Modul umfasst Funktionen wie Konferenzraumbuchung und Benachrichtigungen. Wir bauen das Modul Schritt für Schritt von Grund auf, beginnen mit den Grundlagen und ergänzen schrittweise komplexere Funktionen. Zunächst entwerfen wir die grundlegende Datenstruktur.

---

### 12.1 Datenstruktur entwerfen

Die Datenstruktur bildet das Grundgerüst des Moduls. Wir konzentrieren uns auf die **Konferenzraum-Tabelle** und die **Buchungstabelle** und nutzen dabei neue Beziehungen wie [Many-to-Many](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m) zur Benutzertabelle.

![](https://static-docs.nocobase.com/Solution/CRuKbVrnroSgGdxaVrBcvzSMnHd.png)

#### 12.1.1 Konferenzraum-Tabelle

Die Konferenzraum-Tabelle speichert grundlegende Informationen aller Konferenzräume, einschließlich Name, Standort, Kapazität und Ausstattung.

##### Beispielstruktur

```json
Räume (Rooms)
    ID (Primärschlüssel)
    Raumname (name, einzeiliger Text)
    Standort (location, mehrzeiliger Text)
    Kapazität (capacity, Ganzzahl)
    Ausstattung (equipment, mehrzeiliger Text)
```

#### 12.1.2 Buchungstabelle

Die Buchungstabelle speichert alle Buchungsdaten, einschließlich Konferenzraum, Teilnehmer, Zeitraum, Titel und Beschreibung.

##### Beispielstruktur

```json
Buchungen (Bookings)
    ID (Ganzzahl, eindeutiger Primärschlüssel)
    Konferenzraum (room, Many-to-One, Fremdschlüssel room_id verweist auf Raum-ID)
    Benutzer (users, Many-to-Many, verknüpft mit Benutzer-ID)
    Startzeit (start_time, Datum/Uhrzeit)
    Endzeit (end_time, Datum/Uhrzeit)
    Besprechungstitel (title, einzeiliger Text)
    Besprechungsbeschreibung (description, Markdown)
```

##### [Many-to-Many-Beziehung](https://docs-cn.nocobase.com/handbook/data-modeling/collection-fields/associations/m2m)

In der Buchungstabelle gibt es eine Many-to-Many-Beziehung: Ein Benutzer kann an mehreren Besprechungen teilnehmen, eine Besprechung kann mehrere Teilnehmer haben. Die Fremdschlüsselbeziehung muss korrekt konfiguriert sein. Zur einfacheren Verwaltung benennen wir die Zwischentabelle **booking_users**.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428726.png)

---

### 12.2 Modul zur Besprechungsverwaltung aufbauen

Nachdem die Datenstruktur entworfen ist, erstellen wir die beiden Tabellen und bauen das Modul „Besprechungsverwaltung" auf. Folgen Sie diesen Schritten:

#### 12.2.1 [Tabellenblöcke](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) erstellen

Fügen Sie zunächst auf der Seite das Modul „Besprechungsverwaltung" hinzu und erstellen Sie jeweils einen **Tabellenblock für Konferenzräume** und einen **[Tabellenblock](https://docs-cn.nocobase.com/handbook/ui/blocks/data-blocks/table) für Buchungen**. Erstellen Sie außerdem einen [Kalenderblock](https://docs-cn.nocobase.com/handbook/calendar) für die Buchungstabelle und stellen Sie die Standardansicht des Kalenders auf „Tag".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428135.png)

##### Verknüpfung der Konferenzraum-Tabelle einrichten

Verknüpfen Sie den Konferenzraum-Tabellenblock mit den anderen beiden Blöcken, sodass die zugehörigen Buchungen automatisch gefiltert werden. Anschließend können Sie Filter, CRUD-Operationen und die grundlegende Modulinteraktion testen.

> Tipp **Block-Verbindungen in NocoBase (empfohlen!)**:
>
> Neben dem bisher gezeigten Filter-Block können auch Tabellenblöcke mit anderen Blöcken verbunden werden, um durch Klicks zu filtern.
>
> Wie in der Abbildung unten gezeigt, verbinden wir in der Konfiguration der Konferenzraum-Tabelle die beiden anderen Buchungs-Blöcke (Buchungs-Tabellenblock, Buchungs-Kalenderblock).

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211428280.png)

> Nach erfolgreicher Verbindung führt ein Klick auf einen Eintrag in der Konferenzraum-Tabelle dazu, dass die anderen beiden Tabellen entsprechend gefiltert werden! Erneutes Klicken hebt die Auswahl auf.
>
> ![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429198.gif)

---

### 12.3 Konferenzraumbelegung prüfen

Nach Abschluss der Seitenkonfiguration ergänzen wir eine wichtige Funktion: die Prüfung der Konferenzraumbelegung. Diese Funktion prüft beim Erstellen oder Aktualisieren einer Buchung, ob der Konferenzraum im angegebenen Zeitraum bereits belegt ist, um Buchungskonflikte zu vermeiden.

![](https://static-docs.nocobase.com/project-management-cn-er.drawio.svg)

#### 12.3.1 [Workflow](https://docs-cn.nocobase.com/handbook/workflow) mit „Pre-Action Event" konfigurieren

Für die Prüfung beim Buchen verwenden wir einen besonderen Workflow-Typ - das [„Pre-Action Event"](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor):

- [**Pre-Action Event**](https://docs-cn.nocobase.com/handbook/workflow-request-interceptor) (kommerzielles Plugin): Führt vor dem Hinzufügen, Löschen oder Ändern von Daten eine Reihe von Operationen aus, kann jederzeit unterbrechen und vorzeitig abbrechen - eine Vorgehensweise, die unserem täglichen Code-Entwicklungsablauf sehr nahekommt!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429352.png)

#### 12.3.2 Knoten konfigurieren

Im Workflow zur Belegungsprüfung benötigen wir folgende Knotentypen:

- [**Berechnungsknoten**](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) (Datentransformationslogik für Aktualisierungen und Neuanlagen)
- [**SQL-Operation**](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) (führt SQL-Abfragen aus)
- [**JSON-Parsing**](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) (kommerzielles Plugin zum Parsen von JSON-Daten)
- [**Antwortnachricht**](https://docs-cn.nocobase.com/handbook/workflow/nodes/response-message) (kommerzielles Plugin zur Rückgabe von Hinweismeldungen)

---

#### 12.3.3 Buchungstabelle binden und Trigger konfigurieren

Wir binden die Buchungstabelle, wählen den Trigger-Modus „Globaler Modus" und als Aktionstypen „Datensatz erstellen" und „Datensatz aktualisieren".

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429296.png)

---

### 12.4 [Berechnungsknoten](https://docs-cn.nocobase.com/handbook/workflow/nodes/calculation) konfigurieren

#### 12.4.1 Berechnungsknoten „Leere ID in -1 umwandeln" erstellen

Zunächst erstellen wir einen Berechnungsknoten, der leere IDs in -1 umwandelt. Berechnungsknoten transformieren Variablen nach unseren Vorgaben und bieten drei Operationsformen:

- **Math.js** (siehe [Math.js](https://mathjs.org/))
- **Formula.js** (siehe [Formula.js](https://formulajs.info/functions/))
- **String-Vorlage** (zum Verketten von Daten)

Hier verwenden wir **Formula.js** zur numerischen Auswertung:

```html
IF(NUMBERVALUE([Trigger-Variable/Parameter/Übermittelte Werte/ID], '', '.'),[Trigger-Variable/Parameter/Übermittelte Werte/ID], -1)
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211429134.png)

---

### 12.5. [SQL-Operationsknoten](https://docs-cn.nocobase.com/handbook/workflow/nodes/sql) erstellen

Als Nächstes erstellen wir einen SQL-Operationsknoten zur Abfrage verfügbarer Konferenzräume:

#### 12.5.1 SQL-Anweisung zur Abfrage verfügbarer Konferenzräume

```sql
-- Alle buchbaren Konferenzräume abfragen
SELECT r.id, r.name
FROM rooms r
LEFT JOIN bookings b ON r.id = b.room_id
  AND b.id <> {{$jobsMapByNodeKey.3a0lsms6tgg}}  -- Aktuelle Buchung ausschließen
  AND b.start_time < '{{$context.params.values.end_time}}' -- Startzeit liegt vor Abfrage-Endzeit
  AND b.end_time > '{{$context.params.values.start_time}}' -- Endzeit liegt nach Abfrage-Startzeit
WHERE b.id IS NULL;
```

> Hinweis zu SQL: Variablen werden direkt in die SQL-Anweisung eingesetzt. Prüfen Sie sie sorgfältig, um SQL-Injection zu vermeiden, und ergänzen Sie an den richtigen Stellen einfache Anführungszeichen.

Die Variablen bedeuten:

`{{$jobsMapByNodeKey.3a0lsms6tgg}}` steht für das Ergebnis des vorherigen Knotens [Knoten-Daten/Leere ID in -1 umwandeln]

`{{$context.params.values.end_time}}` steht für [Trigger-Variable/Parameter/Übermittelte Werte/Endzeit]

`{{$context.params.values.start_time}}` steht für [Trigger-Variable/Parameter/Übermittelte Werte/Startzeit]

#### 12.5.2 SQL testen

Unser Ziel: alle Konferenzräume finden, die mit dem Zielzeitraum nicht kollidieren.

Während des Tests können Sie unten auf „Test run" klicken, Variablenwerte ändern und die SQL-Anweisung debuggen.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211437958.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438641.png)

---

### 12.6 [JSON-Parsing](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query)

#### 12.6.1 [JSON-Parsing-Knoten](https://docs-cn.nocobase.com/handbook/workflow/nodes/json-query) konfigurieren

Im vorherigen Test haben wir Ergebnisse in folgender Form erhalten. Dafür müssen wir das [**JSON Query Node-Plugin**](https://docs-cn.nocobase.com/handbook/workflow-json-query) aktivieren:

```json
[
  {
    "id": 2,
    "name": "Konferenzraum 2"
  },
  {
    "id": 1,
    "name": "Konferenzraum 1"
  }
]
```

> Es gibt drei Arten des JSON-Parsings:
> [JMESPath](https://jmespath.org/)
> [JSON Path Plus](https://jsonpath-plus.github.io/JSONPath/docs/ts/)
> [JSONata](https://jsonata.org/)

Wir wählen z. B. das [JMESPath](https://jmespath.org/)-Format. Da wir eine Liste aller verfügbaren Raumnamen filtern möchten, lautet der Ausdruck:

```sql
[].name
```

Die Attribute-Mapping-Konfiguration wird auf Objektlisten angewendet und ist hier nicht erforderlich.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211438250.png)

### 12.7 [Bedingungsknoten](https://docs-cn.nocobase.com/handbook/workflow/nodes/condition)

Konfigurieren Sie einen Bedingungsknoten, um zu prüfen, ob der aktuelle Konferenzraum in der Liste der verfügbaren Räume enthalten ist. Je nach Ergebnis (**Ja** oder **Nein**) konfigurieren Sie unterschiedliche Antwortnachrichten:

Als Bedingungstyp wählen Sie „Basis":

```json
[Knoten-Daten / Geparste Raumliste] enthält [Trigger-Variable / Parameter / Übermittelte Werte / Konferenzraum / Name]
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439432.png)

#### 12.7.1 Ja: Erfolgsmeldung konfigurieren

Hierfür muss das [**Workflow: Response Message-Plugin**](https://docs-cn.nocobase.com/handbook/workflow-response-message) aktiviert werden:

```json
[Trigger-Variable/Parameter/Übermittelte Werte/Konferenzraum/Name] verfügbar, Buchung erfolgreich!
```

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211439159.png)

#### 12.7.2 Nein: Fehlermeldung konfigurieren

```json
Zielraum nicht verfügbar, verfügbare Räume: [Knoten-Daten/Geparste Raumliste]
```

Hinweis: Bei Fehlschlag muss zwingend ein „Prozess beenden"-Knoten konfiguriert werden, um den Workflow manuell zu stoppen.

![202411170606321731794792.png](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440377.png)

---

### 12.8 Funktionstest und Debugging im Detail

Wir kommen zur finalen Testphase des Besprechungsverwaltungssystems. Ziel ist, zu bestätigen, dass unser Workflow korrekt erkennt und kollidierende Buchungen verhindert.

#### 12.8.1 Buchung mit Zeitkonflikt hinzufügen

Wir versuchen zunächst, eine Besprechung mit konfligierender Zeit hinzuzufügen, und prüfen, ob das System die Operation blockiert und eine Fehlermeldung anzeigt.

- Konfligierenden Buchungszeitraum festlegen

Wir versuchen, in „Konferenzraum 1" eine neue Buchung für den Zeitraum

`2024-11-14 00:00:00 - 2024-11-14 23:00:00`

hinzuzufügen. Dieser ganztägige Zeitraum kollidiert absichtlich mit bestehenden Buchungen.

- Bestehende Besprechungen prüfen

In „Konferenzraum 1" existieren bereits zwei Buchungen:

1. `2024-11-14 09:00:00 bis 2024-11-14 12:00:00`
2. `2024-11-14 14:00:00 bis 2024-11-14 16:30:00`

Beide Zeiträume überschneiden sich mit dem hinzuzufügenden Zeitraum

(`2024-11-14 00:00:00 - 2024-11-14 23:00:00`).

Daher sollte das System nach unserer Logik den Zeitkonflikt erkennen und die Buchung blockieren.

- Buchung absenden und Reaktion prüfen

Wir klicken auf **Senden**, das System führt die Workflow-Prüfung aus:

**Erfolgreiches Feedback:** Nach dem Absenden zeigt das System einen Konflikthinweis - die Prüflogik funktioniert. Die Seite informiert uns erfolgreich, dass die Buchung nicht abgeschlossen werden kann.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440141.png)

---

#### 12.8.2 Buchung ohne Konflikt hinzufügen

Als Nächstes testen wir konfliktfreie Buchungen.

Wir stellen sicher, dass bei nicht überlappenden Zeiten der Konferenzraum erfolgreich gebucht werden kann!

- Konfliktfreien Buchungszeitraum festlegen

Wir wählen einen Zeitraum ohne Konflikt, etwa

`2024-11-10 16:00:00 - 2024-11-10 17:00:00`.

Dieser überlappt nicht mit bestehenden Buchungen und entspricht somit den Buchungsanforderungen.

- Konfliktfreie Buchung absenden

Klicken Sie auf **Senden**, das System führt erneut die Workflow-Prüfung aus:

**Lassen Sie uns prüfen:** Erfolgreich abgesendet! Das System zeigt „Buchung erfolgreich" an. Die Buchungsfunktion funktioniert auch bei konfliktfreien Eingaben einwandfrei.

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211440542.png)

#### 12.8.3 Bestehende Buchung ändern

Neben dem Anlegen neuer Buchungen können Sie auch das Ändern bestehender testen.

Ändern Sie etwa eine bestehende Besprechung auf einen konfliktfreien Zeitraum und klicken Sie erneut auf Senden.

Diesen Schritt überlassen wir Ihnen.

---

### 12.9 Dashboard-Optimierung und persönliches Terminpanel

Nachdem alle Tests bestanden sind, können wir das Dashboard verschönern und für eine bessere Benutzererfahrung optimieren.

#### 12.9.1 Dashboard-Layout anpassen

Im Dashboard können Sie die Inhalte nach Benutzergewohnheiten neu anordnen, sodass Anwender Systemdaten leichter überblicken.

Zur weiteren Verbesserung der Benutzererfahrung können Sie für jeden Benutzer ein persönliches Terminpanel erstellen:

1. **Block „Persönliche Termine" hinzufügen**: Fügen Sie im Dashboard einen neuen Kalender- oder Listenblock hinzu, der die persönlichen Termine des Benutzers anzeigt.
2. **Standardwert für Mitglied festlegen**: Setzen Sie den Standardwert auf „aktueller Benutzer", sodass Anwender beim Öffnen des Dashboards standardmäßig ihre eigenen Termine sehen.

Damit verbessern Sie die Benutzererfahrung im Modul zur Besprechungsverwaltung weiter.

Nach dieser Konfiguration sind Funktionen und Layout des Dashboards intuitiver und reichhaltiger!

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507712.png)

![](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412211507197.png)

Mit den obigen Schritten haben wir die Hauptfunktionen des Besprechungsverwaltungsmoduls erfolgreich umgesetzt und optimiert! Wir hoffen, Sie eignen sich beim Arbeiten Schritt für Schritt die Kernfunktionen von NocoBase an und erleben den Spaß am modularen Aufbau eines Systems.

---

Erkunden Sie weiter und lassen Sie Ihrer Kreativität freien Lauf! Bei Fragen können Sie jederzeit die [offizielle NocoBase-Dokumentation](https://docs-cn.nocobase.com/) zu Rate ziehen oder im [NocoBase Community-Forum](https://forum.nocobase.com/) diskutieren.
