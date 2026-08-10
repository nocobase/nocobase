---
title: "Farbe"
description: "Das Farbfeld dient zum Speichern von Farbwerten und eignet sich für Status, Kategorien, Tags und Anzeigeeinstellungen."
keywords: "Farbe,color,Feld,NocoBase"
---

# Farbe

## Einführung

In NocoBase wird **Farbe (Color)** zum Speichern von Farbwerten verwendet.

Farbfelder eignen sich zum Speichern von Farben für Kategorien, Tags, Status, Diagramme oder Anzeigeeinstellungen. In der Regel werden hexadezimale Farbwerte oder von der Komponente unterstützte Farbformate gespeichert.

Wenn die Farbe lediglich Teil eines Optionsfelds ist, kann sie direkt im Optionsfeld konfiguriert werden. Ein separates Farbfeld ist nicht unbedingt erforderlich.

## Geeignete Einsatzszenarien

Farben eignen sich für folgende Geschäftsszenarien:

- Farben für Kundenstufen und Status
- Farben für Tags und Kategorien
- Farben für Diagrammserien
- Anzeigeeinstellungen für Seiten oder Karten

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Farbe“, um ein Farbfeld zu erstellen.

![20240512175956](https://static-docs.nocobase.com/20240512175956.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Farbe entspricht `color` und legt fest, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Oberfläche angezeigt wird, z. B. „Statusfarbe“, „Tagfarbe“ oder „Diagrammfarbe“. Es wird empfohlen, einen für Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Dieser wird nach der Erstellung in der Regel nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Typ des Feldes auf Datenebene. Der Standardtyp für Farbfelder ist `string`. |
| Default value | Standardwert. Wenn beim Erstellen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert verwendet werden. |
| Validation rules | Validierungsregeln. In der Regel reicht die Konfiguration als Pflichtfeld aus. |
| Description | Beschreibung des Feldes. Hier können Bedeutung, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Farbfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `color`. |
| Standardmäßiger Field type | `string`. |
| Verfügbare Field types | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Farbauswahlkomponente verwendet. |
| Filterung | Eine Filterung nach Farbwert ist möglich, stellt jedoch in der Regel keine wichtige Abfragebedingung dar. |
| Sortierung | Wird normalerweise nicht zur Sortierung verwendet. |
| Validierung | Unterstützt grundlegende Validierungen wie die Pflichtfeldprüfung. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Farbfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, festzulegen, wie das Feld in NocoBase angezeigt und verwendet wird, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Oberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies wirkt sich auf die Eingabe, Anzeige und Validierung auf den Seiten aus. |
| Field type | Bedingt unterstützt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt Angaben zu Feldbedeutung, Eingabeanforderungen, Datenquelle oder verantwortlicher Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen sowie die Verwendung von Workflow-Variablen. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Farbfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Farbfelds werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Farbfelder eignen sich für Anzeige- und Konfigurationsszenarien auf Seiten.
![20260709225444](https://static-docs.nocobase.com/20260709225444.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl eines Farbwerts. |
| Detailblock | Anzeige der Farbe. |
| Liste oder Karte | Visuelle Kennzeichnung von Status, Tags oder Kategorien. |
| Diagramm | Als Quelle für die Farbkonfiguration. |

## Verwandte Links

- [Feld](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Symbol](./icon.md) — Symbolbezeichner speichern
- [Dropdown-Einzelauswahl](../choices/select.md) — Farben direkt in den Optionen konfigurieren