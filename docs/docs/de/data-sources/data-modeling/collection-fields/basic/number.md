---
title: "Zahl"
description: "Das Zahlenfeld dient zum Speichern numerischer Werte mit Dezimalstellen, etwa für Beträge, Gewichte, Bewertungen und Flächen."
keywords: "Zahl,number,double,decimal,NocoBase"
---

# Zahl

## Einführung

In NocoBase wird **Zahl (Number)** zum Speichern numerischer Werte verwendet, die Dezimalstellen enthalten können.

Zahlenfelder eignen sich für Geschäftsdaten wie Beträge, Gewichte, Flächen, Bewertungen und Stückpreise. Sie können für Filter, Sortierung, Statistiken, Formeln und Bedingungen in Workflows verwendet werden.

Wenn der Wert eine Ganzzahl sein muss, ist die Auswahl von [Ganzzahl](./integer.md) direkter. Wenn der Wert als Verhältnis oder Prozentsatz angezeigt werden soll, wählen Sie [Prozentsatz](./percent.md).

## Geeignete Anwendungsfälle

Zahlen eignen sich für folgende Geschäftsszenarien:

- Bestellbeträge, Vertragsbeträge und Stückpreise
- Gewichte, Flächen, Volumen und Entfernungen
- B﻿ewertungen, Koeffizienten und Werte vor dem Rabatt
- Dezimalwerte, die in Statistiken oder Formeln verwendet werden müssen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Zahl“, um ein Zahlenfeld zu erstellen.

![20240512175752](https://static-docs.nocobase.com/20240512175752.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Zahlen entspricht er `number` und bestimmt, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der im Interface angezeigte Name des Feldes, zum Beispiel „Bestellbetrag“, „Bewertung“ oder „Gewicht“. Es wird empfohlen, einen Namen zu verwenden, den die zuständigen Fachanwender direkt verstehen. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows und anderen Bereichen. Er wird nach der Erstellung normalerweise nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Der Standardtyp für Zahlenfelder ist `double`. Für Anwendungsfälle wie Geldbeträge, die eine präzise Dezimaldarstellung erfordern, kann `decimal` ausgewählt werden. |
| Default value | Der Standardwert. Wenn beim Erstellen eines neuen Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können Mindestwert, Höchstwert, Genauigkeit und Pflichtfeldstatus eingeschränkt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Achtung

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Zahlenfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `number`. |
| Standardmäßiger Field type | `double`. |
| Verfügbare Field types | `float`, `double` und `decimal`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Zahleneingabefeld verwendet. |
| Filter | Unterstützt numerische Filter wie gleich, ungleich, größer als, kleiner als, Bereich, ist leer und ist nicht leer. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Validierung | Unterstützt Validierungen wie Wertebereich und Pflichtfeld. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Zahlenfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, etwa den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neue Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Achtung

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer größeren Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Zahlenfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Zahlenfelds werden normalerweise auch die entsprechende tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbanksynchronisierung oder einer Zuordnung aus einer externen Datenquelle stammt, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Zahlenfelder eignen sich für Eingaben, Statistiken, Diagramme und Bedingungen in Workflows.
![20260709225103](https://static-docs.nocobase.com/20260709225103.png)

| Szenario | Zweck |
| --- | --- |
| Formularblock | Eingabe von Werten wie Beträgen, Bewertungen und Gewichten. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Werten. |
| Diagrammblock | Gruppieren, Summieren oder Mitteln nach Zahlenfeldern. |
| Formel-Feld | Verwendung als Eingabefeld für Formelberechnungen. |

## Weiterführende Links

- [Feld](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Ganzzahl](./integer.md) — Speichern von Werten ohne Dezimalstellen
- [Prozentsatz](./percent.md) — Speichern von Verhältnissen oder Abschlussquoten
- [Formel](../../../field-formula/index.md) — Ergebnisse auf Grundlage von Zahlenfeldern berechnen