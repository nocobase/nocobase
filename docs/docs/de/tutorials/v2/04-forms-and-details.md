# Kapitel 4: Formulare und Detailansichten — Erfassen und Anzeigen in einem Schritt

Im vorherigen Kapitel haben wir die Ticket-Liste aufgebaut und über ein einfaches Formular Testdaten eingegeben. In diesem Kapitel **verbessern wir das Formular-Erlebnis**: Wir optimieren die Feldanordnung des [Formular-Blocks](/interface-builder/blocks/data-blocks/form), fügen einen [Detail-Block](/interface-builder/blocks/data-blocks/details) hinzu, konfigurieren [Linkage Rules](/interface-builder/linkage-rules) und nutzen die [Änderungshistorie](https://docs.nocobase.com/cn/record-history/), um jede Änderung an einem Ticket nachvollziehen zu können.

:::tip
Die in Abschnitt 4.4 vorgestellte Funktion „[Änderungshistorie](https://docs.nocobase.com/cn/record-history/)" ist Teil der [Pro-Edition](https://www.nocobase.com/cn/commercial). Sie können diesen Abschnitt überspringen, ohne den weiteren Verlauf zu beeinträchtigen.
:::

## 4.1 Das Formular „Neues Ticket" verbessern

Im vorherigen Kapitel haben wir schnell ein funktionstüchtiges Anlageformular erstellt. Jetzt verbessern wir es: Wir passen die Feldreihenfolge an, setzen Standardwerte und optimieren das Layout. Falls Sie den Schnellformular-Teil im vorherigen Kapitel übersprungen haben, ist das kein Problem — wir beginnen hier von vorne.

### Aktions-Button „Hinzufügen" einfügen

1. Stellen Sie sicher, dass Sie sich im UI-Editor-Modus befinden (Schalter oben rechts aktiv).
2. Öffnen Sie die Seite „Ticket-Liste" und klicken Sie oberhalb des Tabellen-Blocks auf **„[Action](/interface-builder/actions) (Actions)"**.
3. Aktivieren Sie den Action-Button **„Add"**.
4. Oberhalb der Tabelle erscheint nun ein „Add"-Button. Ein Klick darauf öffnet ein [Pop-up](/interface-builder/actions/pop-up).

![04-forms-and-details-2026-03-13-09-43-54](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-43-54.png)

### Das Formular im Pop-up konfigurieren

1. Klicken Sie auf den Button „Add", um das Pop-up zu öffnen.
2. Klicken Sie im Pop-up auf **„[Block](/interface-builder/blocks) erstellen (Add block)" → Daten-Block → Formular (Add)**.
3. Wählen Sie **„Aktuelle [Collection](/data-sources/data-modeling/collection) (Current collection)"**. Das Pop-up ist bereits mit dem Kontext der entsprechenden Collection verknüpft, sodass keine manuelle Angabe nötig ist.

   ![04-forms-and-details-2026-03-13-09-44-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-09-44-50.png)
4. Klicken Sie im Formular auf **„[Field](/data-sources/data-modeling/collection-fields) (Fields)"** und aktivieren Sie folgende Felder:

| Field | Konfigurationshinweis |
|------|---------|
| Titel | Pflichtfeld (folgt globaler Einstellung) |
| Beschreibung | Lange Texteingabe |
| Status | Dropdown-Auswahl (Standardwert wird später über Linkage Rule gesetzt) |
| Priorität | Dropdown-Auswahl |
| Kategorie | Verknüpftes Field, automatisch als Dropdown angezeigt |
| Einreicher | Verknüpftes Field (Standardwert wird später über Linkage Rule gesetzt) |
| Zuständiger | Verknüpftes Field |

![04-forms-and-details-2026-03-13-12-44-49](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-44-49.png)

Sie sehen, dass neben dem Field „Titel" automatisch ein rotes Sternchen `*` erscheint — denn wir haben dieses Field bereits in Kapitel 2 als Pflichtfeld definiert. Das Formular übernimmt automatisch die Pflichtfeld-Regel auf Collection-Ebene, eine zusätzliche Konfiguration ist nicht erforderlich.

![04-forms-and-details-2026-03-13-12-46-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-46-34.png)

> **Tipp**: Falls ein Field auf Collection-Ebene nicht als Pflichtfeld definiert ist, Sie es aber im aktuellen Formular als Pflichtfeld verlangen möchten, können Sie dies in den Field-Optionen einzeln festlegen.
> 
![04-forms-and-details-2026-03-13-12-47-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-47-26.png)

### Submit-Button hinzufügen

1. Klicken Sie unterhalb des Formular-Blocks auf **„Actions"**.
2. Aktivieren Sie den Button **„Submit"**.

![04-forms-and-details-2026-03-13-16-30-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-30-06.png)

3. Sobald die Benutzer das Formular ausgefüllt haben, erstellen sie mit einem Klick auf Submit ein neues Ticket.

![04-forms-and-details-2026-03-13-16-32-19](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-32-19.gif)

## 4.2 Linkage Rules: Standardwerte und Field-Verknüpfungen

Manche Felder möchten wir automatisch befüllen (etwa „Status" mit dem Standardwert „Offen"), andere sollen sich abhängig von Bedingungen dynamisch verhalten (zum Beispiel sollen dringende Tickets eine Pflichtbeschreibung haben). Die Standardwert-Funktion in 2.0 wird derzeit noch weiterentwickelt; in diesem Tutorial setzen wir Standardwerte und Field-Verknüpfungen einheitlich über **Linkage Rules** um.

1. Klicken Sie oben rechts im Formular-Block auf die **Block-Einstellungen** (Drei-Striche-Symbol).
2. Suchen Sie **„Linkage rules"** und klicken Sie darauf, um das Konfigurations-Panel in der Seitenleiste zu öffnen.

![04-forms-and-details-2026-03-13-16-43-35](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-43-35.png)

### Standardwerte setzen

Wir setzen zunächst Standardwerte für „Status" und „Einreicher":

1. Klicken Sie auf **„Linkage Rule hinzufügen"**.
2. **Setzen Sie keine Bedingung** (einfach leer lassen) — bedingungslose Linkage Rules werden beim Laden des Formulars sofort ausgeführt.

![04-forms-and-details-2026-03-13-16-47-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-16-47-34.png)

3. Konfigurieren Sie die Aktionen (Actions):
   - Field „Status" → **Standardwert setzen** → Offen
   - Field „Einreicher" → **Standardwert setzen** → Aktueller Benutzer

> **Hinweis zur Field-Wertauswahl**: Beim Setzen der Werte müssen Sie zunächst **„Aktuelles Formular"** als Datenquelle wählen. Bei verknüpften Objekt-Fields (z. B. Many-to-One-Fields wie Kategorie, Einreicher, Zuständiger) müssen Sie das Objekt-Attribut selbst auswählen, nicht die untergeordneten Felder nach dem Aufklappen.
>
> Beim Auswählen von Variablen (z. B. „Aktueller Benutzer") müssen Sie die Variable zuerst per **Einfachklick** markieren und dann mit einem **Doppelklick** in das Auswahlfeld einfügen.

![04-forms-and-details-2026-03-13-17-01-06](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-01-06.png)

![04-forms-and-details-2026-03-13-17-02-20](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-02-20.png)


![04-forms-and-details-2026-03-13-17-03-41](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-03-41.png)


Falls ein Field vom Einreicher nicht geändert werden darf (z. B. Status), können Sie in den Field-Optionen den **„Display mode"** auf **„Readonly"** setzen.

![04-forms-and-details-2026-03-13-17-22-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-22-15.png)

> **Drei Anzeigemodi**: Editable (bearbeitbar), Readonly (Bearbeitung gesperrt, Field-Optik bleibt erhalten), Easy-reading (zeigt nur Text an).

![04-forms-and-details-2026-03-13-12-54-53](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-12-54-53.png)

### Pflichtbeschreibung bei dringenden Tickets

Als Nächstes fügen wir eine bedingte Linkage Rule hinzu: Sobald der Benutzer die Priorität auf „Dringend" setzt, wird das Field „Beschreibung" zu einem **Pflichtfeld**, damit der Einreicher die Situation unbedingt klar beschreibt.

1. Klicken Sie auf **„Linkage Rule hinzufügen"**.

![04-forms-and-details-2026-03-13-17-07-34](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-07-34.png)

2. Konfigurieren Sie die Regel:
   - **Bedingung (Condition)**: Aktuelles Formular / Priorität **gleich** Dringend
   - **Aktionen (Actions)**: Field „Beschreibung" → als **Pflichtfeld** setzen

![04-forms-and-details-2026-03-13-17-08-46](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-08-46.png)

![04-forms-and-details-2026-03-13-17-18-16](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-18-16.png)

3. Speichern Sie die Regel.

Probieren Sie es aus: Wählen Sie die Priorität „Dringend" — neben dem Field „Beschreibung" erscheint nun ein rotes Sternchen `*`, was bedeutet, dass es ein Pflichtfeld ist. Bei einer anderen Priorität ist es wieder optional.

![04-forms-and-details-2026-03-13-17-20-18](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-20-18.gif)

Zum Abschluss passen wir das Layout entsprechend dem soeben Gelernten leicht an.
![04-forms-and-details-2026-03-13-17-25-55](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-25-55.png)

> **Was können Linkage Rules sonst noch?** Neben Standardwerten und Pflichtfeld-Steuerung können sie auch das Anzeigen/Verbergen von Fields und dynamische Wertzuweisungen steuern. Beispiel: Wenn der Status „Geschlossen" ist, wird das Field „Zuständiger" ausgeblendet. Wir gehen in späteren Kapiteln darauf ein.

## 4.3 [Detail-Block](/interface-builder/blocks/data-blocks/details)

Im vorherigen Kapitel haben wir den Tabellenzeilen einen „Anzeigen"-Button hinzugefügt, der ein Drawer öffnet. Jetzt konfigurieren wir den Inhalt dieses Drawers.

1. Klicken Sie in der Tabelle bei einer beliebigen Zeile auf **„Anzeigen"**, um den Drawer zu öffnen.
2. Klicken Sie im Drawer auf **„Block erstellen (Add block)" → Daten-Block → Details**.
3. Wählen Sie **„Aktuelle Collection (Current collection)"**.

![04-forms-and-details-2026-03-13-17-27-02](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-27-02.png)

4. Im Detail-Block, **„Fields"**, mit folgendem Layout:


| Bereich | Fields |
|------|------|
| Oberer Bereich | Titel, Status (Tag-Stil) |
| Hauptbereich | Beschreibung (langes Textfeld) |
| Seitlicher Infobereich | Kategoriename, Priorität, Einreicher, Zuständiger, Erstellungszeit |

Wie platziert man eine große Überschrift?
Wählen Sie Field > Markdown > Markdown bearbeiten > im Editor-Bereich Variable auswählen > Aktueller Datensatz > Titel.
Damit wird der Titel des Datensatzes dynamisch in den Markdown-Block eingefügt.
Löschen Sie den Standardtext und formatieren Sie ihn mit Markdown-Syntax als Überschrift zweiter Ebene (also `## ` mit Leerzeichen davor).

![04-forms-and-details-2026-03-13-17-36-26](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-36-26.png)

![04-forms-and-details-2026-03-13-17-39-51](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-39-51.png)

Das ursprüngliche Titel-Field auf der Seite kann nun entfernt werden. Passen Sie das Layout der Detailansicht an.

![04-forms-and-details-2026-03-13-17-43-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-43-36.png)


> **Tipp**: Mehrere Fields können per Drag-and-Drop in dieselbe Zeile gesetzt werden, was das Layout kompakter und ansprechender macht.


1. Aktivieren Sie unter **„Actions"** des Detail-Blocks den Button **„Bearbeiten"**, um direkt aus der Detailansicht in den Bearbeitungsmodus zu wechseln.

![04-forms-and-details-2026-03-13-17-45-15](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-45-15.png)

### Das Bearbeitungsformular konfigurieren

Ein Klick auf den Button „Bearbeiten" öffnet ein neues Pop-up — darin muss ein Bearbeitungsformular platziert werden. Die Felder im Bearbeitungsformular sind nahezu identisch mit denen des Anlageformulars. Müssen wir wirklich alles erneut auswählen?

Nein. Erinnern Sie sich an das Anlageformular? Wir **speichern es als Vorlage**, und das Bearbeitungsformular kann sie direkt referenzieren.

**Schritt 1: Zurück zum Anlageformular und als Vorlage speichern**

1. Schließen Sie das aktuelle Pop-up, kehren Sie zur Ticket-Liste zurück und öffnen Sie das Anlageformular über den „Add"-Button.
2. Klicken Sie oben rechts im Formular-Block auf die **Block-Einstellungen** (Drei-Striche-Symbol) und wählen Sie **„Als Vorlage speichern (Save as template)"**.

![04-forms-and-details-2026-03-13-17-47-21](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-21.png)

3. Klicken Sie auf Speichern. Standardmäßig wird **„Reference (Referenz)"** gewählt — alle Formulare, die diese Vorlage referenzieren, teilen sich dieselbe Konfiguration: Eine Änderung wirkt sich auf alle aus.

![04-forms-and-details-2026-03-13-17-47-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-47-44.png)


![04-forms-and-details-2026-03-13-18-39-05](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-39-05.png)

> Unser Ticket-Formular ist nicht komplex; mit „Reference" haben wir eine einheitliche Pflege und sparen uns Arbeit. Bei „Duplicate (Kopie)" erhält jedes Formular eine unabhängige Kopie, die einzeln geändert werden kann, ohne andere zu beeinflussen.

**Schritt 2: Vorlage im Bearbeitungs-Pop-up referenzieren**

1. Kehren Sie zum Detail-Drawer oder zur Tabellen-Aktionsspalte zurück und öffnen Sie über „Bearbeiten" das Bearbeitungs-Pop-up.

Vielleicht denken Sie: Kann ich nicht einfach über **„Block erstellen → Andere Blöcke → Block-Vorlage"** direkt eine erstellen? Probieren Sie es aus: Was dabei entsteht, ist ein **Anlageformular**, dessen Felder zudem nicht automatisch befüllt werden. Das ist eine häufige Falle.

![04-forms-and-details-2026-03-13-17-59-36](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-17-59-36.png)

Der korrekte Weg ist:

2. Klicken Sie im Pop-up auf **„Block erstellen (Add block)" → Daten-Block → Formular (Edit)** und erstellen Sie zunächst regulär einen Bearbeitungsformular-Block.
3. Klicken Sie im Bearbeitungsformular auf **„Fields" → „Field-Vorlagen (Field templates)"** und wählen Sie die zuvor gespeicherte Vorlage.
4. Alle Felder werden auf einen Schlag übernommen, identisch zum Anlageformular.
5. Vergessen Sie nicht, den Action-Button „Submit" hinzuzufügen, damit Änderungen gespeichert werden können.

![04-forms-and-details-2026-03-13-18-05-13](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-05-13.png)

![04-forms-and-details-2026-03-13-18-15-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-15-11.gif)

Möchten Sie später Felder hinzufügen? Eine einzige Änderung an der Vorlage genügt — Anlage- und Bearbeitungsformular werden gleichzeitig aktualisiert.

### Schnellbearbeitung: Daten ändern, ohne ein Pop-up zu öffnen

Neben der Pop-up-Bearbeitung unterstützt NocoBase auch die direkte **Schnellbearbeitung** in der Tabelle — ohne ein Pop-up zu öffnen können Sie einfach mit der Maus darüberfahren und ändern.

Zwei Stellen zur Aktivierung:

- **Auf Tabellen-Block-Ebene**: Öffnen Sie die **Block-Einstellungen** (Drei-Striche-Symbol) des Tabellen-Blocks und suchen Sie **„Quick editing"**. Nach Aktivierung unterstützen alle Felder der Tabelle die Schnellbearbeitung.
- **Auf einzelner Field-Ebene**: Öffnen Sie die Field-Konfiguration einer bestimmten Spalte, suchen Sie **„Quick editing"** und steuern Sie sie pro Field.

![04-forms-and-details-2026-03-13-18-20-07](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-20-07.png)

Sobald aktiviert, erscheint beim Hover über einer Tabellenzelle ein kleines Stiftsymbol. Ein Klick blendet die Bearbeitungskomponente des Fields ein, und Änderungen werden automatisch gespeichert.

![04-forms-and-details-2026-03-13-18-21-09](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-21-09.gif)

> **Wofür eignet sich das?** Die Schnellbearbeitung ist ideal für Massenänderungen an Feldern wie Status oder Zuständiger. Wenn Administratoren etwa die Ticket-Liste durchsehen, können sie direkt in der Spalte „Status" ein Ticket schnell von „Offen" auf „In Bearbeitung" ändern, ohne jedes Mal die Bearbeitungsansicht zu öffnen.

## 4.4 Änderungshistorie aktivieren

:::info Kommerzielles Plugin
Die „[Änderungshistorie](https://docs.nocobase.com/cn/record-history/)" ist ein Plugin der NocoBase [Pro-Edition](https://www.nocobase.com/cn/commercial) und benötigt eine kommerzielle Lizenz. Falls Sie die Community-Edition nutzen, können Sie diesen Abschnitt überspringen, ohne den weiteren Verlauf zu beeinträchtigen.
:::

Eines ist in einem Ticket-System besonders wichtig: **Wer hat wann was geändert? Das muss nachvollziehbar sein.** Das NocoBase-Plugin „Änderungshistorie" zeichnet jede Datenänderung automatisch auf.

### Änderungshistorie konfigurieren

1. Öffnen Sie **Einstellungen → Plugin-Verwaltung** und stellen Sie sicher, dass das Plugin „Record History" aktiviert ist.

![04-forms-and-details-2026-03-13-18-22-44](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-22-44.png)

2. Öffnen Sie die Konfigurationsseite des Plugins, klicken Sie auf **„Collection hinzufügen"** und wählen Sie **„Tickets"**.
3. Wählen Sie die zu protokollierenden Felder: **Titel, Status, Priorität, Zuständiger, Beschreibung** usw.

![04-forms-and-details-2026-03-13-18-25-11](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-25-11.png)

> **Empfehlung**: Es ist nicht nötig, alle Felder zu protokollieren. Felder wie ID oder Erstellungszeit, die nicht manuell verändert werden, müssen nicht verfolgt werden. Erfassen Sie nur fachlich relevante Änderungen.

4. Klicken Sie nun in der Konfiguration auf **„Historische Daten-Snapshot synchronisieren"**. Das Plugin erfasst alle bestehenden Tickets als ersten Eintrag in die Historie; jede weitere Änderung erzeugt einen neuen Eintrag.

![04-forms-and-details-2026-03-13-18-27-01](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-27-01.png)

![04-forms-and-details-2026-03-13-18-28-50](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-28-50.png)

### Historie in der Detailansicht anzeigen

1. Kehren Sie zur Drawer-Detailansicht eines Tickets zurück (Klick auf „Anzeigen" in der Tabellenzeile).
2. Klicken Sie im Drawer auf **„Block erstellen (Add block)" → Änderungshistorie**.
3. Wählen Sie **„Aktuelle Collection"** und als Datenquelle **„Aktueller Datensatz"**.
4. Am unteren Rand der Detailansicht erscheint nun ein Zeitstrahl, der jede Änderung übersichtlich darstellt: Wer hat wann welches Field von welchem Wert auf welchen Wert geändert.

![04-forms-and-details-2026-03-13-18-31-45](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-31-45.png)

![04-forms-and-details-2026-03-13-18-33-00](https://static-docs.nocobase.com/04-forms-and-details-2026-03-13-18-33-00.gif)

Selbst wenn ein Ticket durch viele Hände gegangen ist, sind so alle Änderungen klar nachvollziehbar.

## Zusammenfassung

In diesem Kapitel haben wir den vollständigen Lebenszyklus der Daten umgesetzt:

- **Formular** — Benutzer können neue Tickets einreichen, mit Standardwerten und Validierungen
- **Linkage Rules** — Dringende Tickets verlangen automatisch eine Pflichtbeschreibung
- **Detail-Block** — Vollständige Ticket-Informationen klar dargestellt
- **Änderungshistorie** — Jede Änderung wird automatisch protokolliert, sorgenfreie Prüfspur (kommerzielles Plugin, optional)

Vom „Sehen" über „Eingeben" bis zum „Nachverfolgen" — unser Ticket-System ist nun grundlegend einsatzbereit.

## Verwandte Ressourcen

- [Formular-Block](/interface-builder/blocks/data-blocks/form) — Detaillierte Konfiguration des Formular-Blocks
- [Detail-Block](/interface-builder/blocks/data-blocks/details) — Konfiguration des Detail-Blocks
- [Linkage Rules](/interface-builder/linkage-rules) — Erläuterung der Field-Verknüpfungsregeln
