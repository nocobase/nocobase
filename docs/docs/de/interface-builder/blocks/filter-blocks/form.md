:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/blocks/filter-blocks/form).
:::

# Filterformular

## Einführung

Das Filterformular ermöglicht es Benutzern, Daten durch das Ausfüllen von Formularfeldern zu filtern. Es kann zum Filtern von Tabellen-Blöcken, Diagramm-Blöcken, Listen-Blöcken usw. verwendet werden.

## Wie man es verwendet

Lassen Sie uns zunächst anhand eines einfachen Beispiels schnell verstehen, wie das Filterformular verwendet wird. Angenommen, wir haben einen Tabellen-Block mit Benutzerinformationen und möchten die Daten über ein Filterformular filtern. Wie folgt:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Die Konfigurationsschritte sind wie folgt:

1. Aktivieren Sie den Konfigurationsmodus, fügen Sie der Seite einen „Filterformular“-Block und einen „Tabellen-Block“ hinzu.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Fügen Sie das Feld „Spitzname“ im Tabellen-Block und im Filterformular-Block hinzu.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Jetzt kann es verwendet werden.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Fortgeschrittene Nutzung

Der Filterformular-Block unterstützt weitere fortgeschrittene Konfigurationen. Hier sind einige gängige Verwendungszwecke.

### Mehrere Blöcke verbinden

Ein einzelnes Formularfeld kann gleichzeitig Daten aus mehreren Blöcken filtern. Die konkreten Schritte sind wie folgt:

1. Klicken Sie auf die Konfigurationsoption „Connect fields“ des Feldes.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Fügen Sie den gewünschten Ziel-Block hinzu; hier wählen wir den Listen-Block auf der Seite aus.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Wählen Sie ein oder mehrere Felder im Listen-Block zur Verknüpfung aus. Hier wählen wir das Feld „Spitzname“.
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klicken Sie auf die Schaltfläche Speichern, um die Konfiguration abzuschließen. Der Effekt ist wie folgt dargestellt:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Diagramm-Blöcke verbinden

Referenz: [Seitenfilter und Verknüpfung](../../../data-visualization/guide/filters-and-linkage.md)

### Benutzerdefinierte Felder

Zusätzlich zur Auswahl von Feldern aus der Sammlung können Sie Formularfelder auch über „Benutzerdefinierte Felder“ erstellen. Beispielsweise können Sie ein Dropdown-Auswahlfeld erstellen und die Optionen anpassen. Die konkreten Schritte sind wie folgt:

1. Klicken Sie auf die Option „Benutzerdefinierte Felder“, woraufhin sich die Konfigurationsoberfläche öffnet.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Füllen Sie den Feldtitel aus, wählen Sie unter „Feldtyp“ die Option „Auswahl“ und konfigurieren Sie die Optionen.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Neu hinzugefügte benutzerdefinierte Felder müssen manuell mit den Feldern des Ziel-Blocks verknüpft werden. Die Methode ist wie folgt:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Konfiguration abgeschlossen, der Effekt ist wie folgt dargestellt:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Derzeit unterstützte Feldtypen sind:

- Textfeld
- Zahl
- Datum
- Auswahl
- Optionsfeld
- Kontrollkästchen
- Verknüpfung

#### Verknüpfung (Benutzerdefiniertes Beziehungsfeld)

„Verknüpfung“ eignet sich für Szenarien wie „Filtern nach Datensätzen der verknüpften Tabelle“. Zum Beispiel in einer Bestellliste nach „Kunde“ filtern oder in einer Aufgabenliste nach „Verantwortlicher“ filtern.

Beschreibung der Konfigurationselemente:

- **Ziel-Sammlung**: Gibt an, aus welcher Sammlung die wählbaren Datensätze geladen werden sollen.
- **Titelfeld**: Wird als Anzeigetext für Dropdown-Optionen und ausgewählte Tags verwendet (z. B. Name, Titel).
- **Wertfeld**: Der Wert, der beim tatsächlichen Filtern übermittelt wird, normalerweise das Primärschlüsselfeld (z. B. `id`).
- **Mehrfachauswahl erlauben**: Wenn aktiviert, können mehrere Datensätze gleichzeitig ausgewählt werden.
- **Operator**: Definiert, wie die Filterbedingungen abgeglichen werden (siehe unten „Operator“).

Empfohlene Konfiguration:

1. Wählen Sie für das `Titelfeld` ein gut lesbares Feld (z. B. „Name“), um zu vermeiden, dass reine IDs die Benutzerfreundlichkeit beeinträchtigen.
2. Wählen Sie für das `Wertfeld` vorzugsweise das Primärschlüsselfeld, um eine stabile und eindeutige Filterung zu gewährleisten.
3. Deaktivieren Sie bei Einzelauswahl-Szenarien normalerweise „Mehrfachauswahl erlauben“; aktivieren Sie bei Mehrfachauswahl-Szenarien „Mehrfachauswahl erlauben“ und verwenden Sie einen geeigneten `Operator`.

#### Operator

Der `Operator` wird verwendet, um die Übereinstimmungsbeziehung zwischen dem „Wert des Filterformularfelds“ und dem „Wert des Zielblockfelds“ zu definieren.

### Einklappen

Fügen Sie eine Einklappen-Schaltfläche hinzu, um den Inhalt des Filterformulars ein- und auszuklappen und so Platz auf der Seite zu sparen.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Unterstützt die folgenden Konfigurationen:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Anzahl der im eingeklappten Zustand angezeigten Zeilen**: Legt die Anzahl der Formularfeldzeilen fest, die im eingeklappten Zustand angezeigt werden.
- **Standardmäßig eingeklappt**: Wenn aktiviert, wird das Filterformular standardmäßig im eingeklappten Zustand angezeigt.