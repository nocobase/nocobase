:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Filterformular

## Einführung

Das Filterformular ermöglicht es Benutzern, Daten durch das Ausfüllen von Formularfeldern zu filtern. Es kann verwendet werden, um Tabellen-Blöcke, Diagramm-Blöcke, Listen-Blöcke und mehr zu filtern.

## Wie man es verwendet

Lassen Sie uns mit einem einfachen Beispiel beginnen, um schnell zu verstehen, wie Sie das Filterformular verwenden. Nehmen wir an, wir haben einen Tabellen-Block mit Benutzerinformationen und möchten die Daten mithilfe eines Filterformulars filtern, wie hier gezeigt:

![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

Die Konfigurationsschritte sind wie folgt:

1. Aktivieren Sie den Bearbeitungsmodus und fügen Sie der Seite einen "Filterformular"-Block und einen "Tabellen"-Block hinzu.
![20251031163525_rec_](https://static-docs.nocobase.com/20251031163525_rec_.gif)
2. Fügen Sie das Feld "Spitzname" sowohl dem Tabellen-Block als auch dem Filterformular-Block hinzu.
![20251031163932_rec_](https://static-docs.nocobase.com/20251031163932_rec_.gif)
3. Jetzt können Sie es verwenden.
![20251031163036_rec_](https://static-docs.nocobase.com/20251031163036_rec_.gif)

## Erweiterte Verwendung

Der Filterformular-Block unterstützt erweiterte Konfigurationen. Hier sind einige gängige Anwendungsfälle.

### Mehrere Blöcke verbinden

Ein einzelnes Formularfeld kann Daten in mehreren Blöcken gleichzeitig filtern. So geht's:

1. Klicken Sie auf die Konfigurationsoption "Felder verbinden" für das Feld.
![20251031170300](https://static-docs.nocobase.com/20251031170300.png)
2. Fügen Sie die Ziel-Blöcke hinzu, die Sie verbinden möchten. In diesem Beispiel wählen wir den Listen-Block auf der Seite aus.
![20251031170718](https://static-docs.nocobase.com/20251031170718.png)
3. Wählen Sie ein oder mehrere Felder aus dem Listen-Block aus, die verbunden werden sollen. Hier wählen wir das Feld "Spitzname".
![20251031171039](https://static-docs.nocobase.com/20251031171039.png)
4. Klicken Sie auf die Schaltfläche "Speichern", um die Konfiguration abzuschließen. Das Ergebnis sieht wie folgt aus:
![20251031171209_rec_](https://static-docs.nocobase.com/20251031171209_rec_.gif)

### Diagramm-Blöcke verbinden

Referenz: [Seitenfilter und Verknüpfung](../../../data-visualization/guide/filters-and-linkage.md)

### Benutzerdefinierte Felder

Neben der Auswahl von Feldern aus Sammlungen können Sie auch Formularfelder mithilfe von "Benutzerdefinierten Feldern" erstellen. Sie können beispielsweise ein Dropdown-Auswahlfeld mit benutzerdefinierten Optionen erstellen. So geht's:

1. Klicken Sie auf die Option "Benutzerdefinierte Felder", um das Konfigurationsfenster zu öffnen.
![20251031173833](https://static-docs.nocobase.com/20251031173833.png)
2. Geben Sie den Feldtitel ein, wählen Sie "Select" als Feldmodell und konfigurieren Sie die Optionen.
![20251031174857_rec_](https://static-docs.nocobase.com/20251031174857_rec_.gif)
3. Neu hinzugefügte benutzerdefinierte Felder müssen manuell mit Feldern in Ziel-Blöcken verbunden werden. So geht's:
![20251031181957_rec_](https://static-docs.nocobase.com/20251031181957_rec_.gif)
4. Die Konfiguration ist abgeschlossen. Das Ergebnis sieht wie folgt aus:
![20251031182235_rec_](https://static-docs.nocobase.com/20251031182235_rec_.gif)

Derzeit unterstützte Feldmodelle:

- Input: Einzeilige Texteingabe
- Number: Numerische Eingabe
- Date: Datumsauswahl
- Select: Dropdown (kann für Einzel- oder Mehrfachauswahl konfiguriert werden)
- Radio group: Optionsfelder
- Checkbox group: Kontrollkästchen

### Ein- und Ausklappen

Fügen Sie eine Schaltfläche zum Ein- und Ausklappen hinzu, um den Inhalt des Filterformulars zu minimieren und zu erweitern und so Seitenplatz zu sparen.

![20251031182743](https://static-docs.nocobase.com/20251031182743.png)

Unterstützte Konfigurationen:

![20251031182849](https://static-docs.nocobase.com/20251031182849.png)

- **Zeilen im eingeklappten Zustand**: Legt fest, wie viele Zeilen von Formularfeldern im eingeklappten Zustand angezeigt werden.
- **Standardmäßig eingeklappt**: Wenn aktiviert, wird das Filterformular standardmäßig im eingeklappten Zustand angezeigt.