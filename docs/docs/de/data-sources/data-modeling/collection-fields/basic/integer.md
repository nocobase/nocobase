---
title: "Ganzzahl"
description: "Das Ganzzahlfeld dient zum Speichern von Werten ohne Dezimalstellen, z. B. Stückzahlen, Personenzahlen, Anzahlen und Tagesangaben."
keywords: "Ganzzahl,integer,Zahlenfeld,NocoBase"
---

# Ganzzahl

## Einführung

In NocoBase wird **Ganzzahl (Integer)** zum Speichern von Werten ohne Dezimalstellen verwendet.

Ganzzahlfelder eignen sich für Geschäftsdaten wie Mengen, Anzahlen, Personenzahlen und Sortiernummern. Sie können für Filter, Sortierung, Auswertungen, Berechtigungen und Workflow-Bedingungen verwendet werden.

Wenn Dezimalzahlen, Geldbeträge, Gewichte oder Verhältnisse gespeichert werden sollen, sind [Zahl](./number.md) oder [Prozentsatz](./percent.md) besser geeignet.

## Geeignete Einsatzszenarien

Ganzzahlen eignen sich für folgende Geschäftsszenarien:

- Produktmengen, Lagerbestände und Bestellmengen
- Teilnehmerzahlen, verbleibende Plätze und Anzahlenerfassungen
- Anzahl der Arbeitstage, Verzögerungstage und Zahlungsfristen
- Ganzzahlige Codes in externen Systemen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Ganzzahl“, um ein Ganzzahlfeld zu erstellen.

![20240512175723](https://static-docs.nocobase.com/20240512175723.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für Ganzzahlen entspricht er `integer` und legt fest, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der im Benutzeroberflächen angezeigte Name des Feldes, z. B. „Menge“, „Personenzahl“ oder „Verzögerungstage“. Es wird empfohlen, einen für die Geschäftsanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Ganzzahlfelder verwenden standardmäßig `integer`. Für Ganzzahlen mit größerem Wertebereich kann `bigInt` ausgewählt werden. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Damit können Mindestwert, Höchstwert oder eine Pflichtangabe festgelegt werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Konfigurationsaufwand durch Änderungen zu vermeiden.

:::

## Feldeigenschaften

Das Ganzzahlfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `integer`. |
| Standardmäßiger Field type | `integer`. |
| Optionale Field types | `integer`、`bigInt`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Zahleneingabefeld verwendet. |
| Filter | Unterstützt numerische Filter wie gleich, ungleich, größer als, kleiner als, Bereich, leer und nicht leer. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Validierung | Unterstützt numerische Validierungen wie Mindestwert, Höchstwert und Pflichtangabe. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Ganzzahlfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, z. B. den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung in der Regel um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung im Bearbeitungsformular in der Regel nicht geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann der Wert angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder verantwortliche Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht gleichbedeutend mit einer einfachen Änderung des Anzeigenamens. Dadurch werden Speicherweise, Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen beeinflusst. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Ganzzahlfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gemeinsam löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Ganzzahlfelds werden in der Regel auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines Feldes, das aus einer Datenbank synchronisiert oder einer externen Datenquelle zugeordnet wurde, hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Ganzzahlfelder eignen sich für Tabellen, Formulare, Auswertungen und Workflows.
![20260709224913](https://static-docs.nocobase.com/20260709224913.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe von Mengen, Anzahlen, Tagesangaben usw. ohne Dezimalstellen. |
| Tabellenblock | Anzeigen, Sortieren und Filtern von Ganzzahlen. |
| Diagrammblock | Auswertungen nach Feldern wie Menge oder Anzahl. |
| Workflows und Berechtigungen | Verwendung als Bedingungsfeld, z. B. um zu prüfen, ob eine Menge größer als 0 ist. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Zahl](./number.md) — Dezimalzahlen, Geldbeträge, Gewichte und andere Werte speichern
- [Prozentsatz](./percent.md) — Verhältnisse oder Abschlussquoten speichern