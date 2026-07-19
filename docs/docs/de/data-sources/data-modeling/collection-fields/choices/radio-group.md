---
title: "Radio-Gruppe"
description: "Das Feld „Radio-Gruppe“ zeigt Optionen direkt auf der Seite an und ermöglicht die Auswahl eines Werts."
keywords: "Radio-Gruppe, Radio group, Optionsfeld, NocoBase"
---

# Radio-Gruppe

## Einführung

In NocoBase wird die **Radio-Gruppe (Radio group)** verwendet, um einen Wert aus einer Gruppe von Optionen auszuwählen und die Optionen direkt im Formular anzuzeigen.

Eine Radio-Gruppe eignet sich für Szenarien mit wenigen Optionen, in denen Benutzer alle Optionen auf einen Blick sehen sollen. Sie ähnelt der Dropdown-Einzelauswahl, unterscheidet sich jedoch hauptsächlich in der Art der Interaktion auf der Seite.

Wenn es viele Optionen gibt, spart die Auswahl einer [Dropdown-Einzelauswahl](./select.md) Platz. Wenn mehrere Werte ausgewählt werden sollen, verwenden Sie eine [Checkbox-Gruppe](./checkbox-group.md).

## Geeignete Szenarien

Eine Radio-Gruppe eignet sich für folgende Geschäftsszenarien:

- Priorität: niedrig, mittel, hoch
- Geschlecht, Typ sowie weitere Ja/Nein- und ähnliche Optionen
- Genehmigungsergebnis: genehmigt, abgelehnt
- Schnellauswahl aus wenigen festen Optionen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Radio-Gruppe“, um ein Radio-Gruppen-Feld zu erstellen.
![20260709231205](https://static-docs.nocobase.com/20260709231205.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für eine Radio-Gruppe entspricht er `radioGroup` und legt fest, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, zum Beispiel „Priorität“, „Genehmigungsergebnis“ oder „Typ“. Es wird empfohlen, einen für die Fachanwender direkt verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Er wird nach der Erstellung in der Regel nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Eine Radio-Gruppe verwendet standardmäßig `string` und speichert den Wert der ausgewählten Option. |
| Default value | Der Standardwert. Beim Erstellen eines neuen Datensatzes kann dieser automatisch übernommen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Validierungsregeln. In der Regel werden das Pflichtfeld und die zulässigen Optionswerte konfiguriert. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Standardverhalten eines Radio-Gruppen-Feldes ist wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiger Field interface | `radioGroup`. |
| Standardmäßiger Field type | `string`. |
| Verfügbarer Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Radio-Gruppe verwendet. |
| Filterung | Datensätze können nach Optionen gefiltert werden. |
| Sortierung | Datensätze können nach dem Optionswert sortiert werden. |
| Validierung | Pflichtfelder und Einschränkungen für den Optionsbereich werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Radio-Gruppen-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, dessen Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person. |

:::warning Hinweis

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung als Workflow-Variable. Bei vielen vorhandenen Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Radio-Gruppen-Feld zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu erstellten Radio-Gruppen-Feldes in der Hauptdatenbank werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, den Import und Export sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Eine Radio-Gruppe eignet sich, um wenige Optionen direkt in einem Formular anzuzeigen.
![20260709230347](https://static-docs.nocobase.com/20260709230347.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Alle Optionen direkt anzeigen und eine davon auswählen. |
| Detailblock | Die ausgewählte Option anzeigen. |
| Filterblock | Datensätze nach Optionen filtern. |
| Workflows und Berechtigungen | Als Bedingung für Status, Typen und ähnliche Werte verwenden. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Dropdown-Einzelauswahl](./select.md) — Für eine größere Anzahl von Optionen
- [Checkbox-Gruppe](./checkbox-group.md) — Mehrere Werte auswählen