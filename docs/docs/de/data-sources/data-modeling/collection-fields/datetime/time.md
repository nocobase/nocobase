---
title: "Uhrzeit"
description: "Das Uhrzeitfeld wird zum Speichern einer Uhrzeit innerhalb eines Tages verwendet, z. B. für die Öffnungszeit oder den Zeitpunkt einer Erinnerung."
keywords: "Uhrzeit,time,Uhrzeitfeld,NocoBase"
---

# Uhrzeit

## Einführung

In NocoBase wird **Uhrzeit (Time)** zum Speichern einer Uhrzeit innerhalb eines Tages verwendet.

Das Uhrzeitfeld eignet sich für Geschäftsdaten wie Öffnungszeiten, Erinnerungszeiten oder Schichtzeiträume, die nicht an ein bestimmtes Datum gebunden sind.

Wenn gleichzeitig ein Datum und eine Uhrzeit gespeichert werden sollen, wählen Sie [Datum und Uhrzeit](./datetime.md).

## Geeignete Anwendungsfälle

Die Uhrzeit eignet sich für folgende Geschäftsszenarien:

- Öffnungszeit und Schließzeit
- Tägliche Erinnerungszeit
- Beginn und Ende einer Schicht
- Konfiguration fester Zeitpunkte

## Erstellen und konfigurieren

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Uhrzeit“, um ein Uhrzeitfeld zu erstellen.

![20240512181216](https://static-docs.nocobase.com/20240512181216.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Benutzeroberflächentyp des Feldes. Für die Uhrzeit entspricht er `time` und bestimmt, wie der Wert auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Startzeit“, „Erinnerungszeit“ oder „Öffnungszeit“. Es wird empfohlen, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Der Feldtyp für Uhrzeit ist standardmäßig `time`. |
| Default value | Der Standardwert. Wenn beim Erstellen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert eingesetzt werden. |
| Validation rules | Validierungsregeln. Es können unter anderem Pflichtfelder und Zeitbereiche konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person festgehalten werden. |

:::warning Achtung

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Uhrzeitfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `time`. |
| Standardmäßiger Field type | `time`. |
| Verfügbare Field types | `time`. |
| Seitenkomponente | Im Bearbeitungsmodus wird eine Zeitauswahl verwendet. |
| Filterung | Die Filterung nach Uhrzeit, Zeitbereich, leer und nicht leer wird unterstützt. |
| Sortierung | Die Sortierung nach Uhrzeit wird unterstützt. |
| Validierung | Validierungen wie Pflichtfeld und Zeitbereich werden unterstützt. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Uhrzeitfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung in der Regel nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neue Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Achtung

Das Wechseln des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Dadurch werden die Speicherart des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen beeinflusst. Bei einer großen Menge vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Uhrzeitfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Uhrzeitfelds werden in der Regel gleichzeitig die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Uhrzeitfelder eignen sich für die Verwendung in Formularen und Regelkonfigurationen.
![20260709232726](https://static-docs.nocobase.com/20260709232726.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl einer Uhrzeit innerhalb eines Tages. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Uhrzeiten. |
| Filterblock | Filtern nach einem Zeitbereich. |
| Workflow | Als Feld für eine Zeitbedingung. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Datum](./date.md) — Speichert nur ein Datum
- [Datum und Uhrzeit (mit Zeitzone)](./datetime.md) — Speichert Datum und Uhrzeit
