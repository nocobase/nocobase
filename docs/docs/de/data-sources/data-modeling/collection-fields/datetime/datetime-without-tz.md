---
title: "Datum und Uhrzeit (ohne Zeitzone)"
description: "Das Feld „Datum und Uhrzeit (ohne Zeitzone)“ speichert Datum und Uhrzeit ohne Zeitzonenumrechnung."
keywords: "Datum und Uhrzeit,datetime without timezone,ohne Zeitzone,NocoBase"
---

# Datum und Uhrzeit (ohne Zeitzone)

## Einführung

In NocoBase wird **Datum und Uhrzeit (ohne Zeitzone) (Date time without timezone)** verwendet, um Datum und Uhrzeit ohne Zeitzonenumrechnung zu speichern.

Datum und Uhrzeit (ohne Zeitzone) eignen sich für Szenarien wie Schichtplanung, Öffnungszeiten und Kurszeiten, bei denen der lokal angezeigte Wert im Vordergrund steht.

Wenn ein weltweit einheitlicher tatsächlicher Zeitpunkt ausgedrückt werden soll, ist [Datum und Uhrzeit (mit Zeitzone)](./datetime.md) besser geeignet.

## Geeignete Einsatzszenarien

Datum und Uhrzeit (ohne Zeitzone) eignen sich für folgende Geschäftsszenarien:

- Lokale Schichtzeiten
- Kursbeginn und Prüfungszeiten
- Öffnungszeiten von Filialen
- Geschäftszeiten, die nicht über Zeitzonen hinweg umgerechnet werden sollen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Datum und Uhrzeit (ohne Zeitzone)“, um ein entsprechendes Feld zu erstellen.

![20260709232834](https://static-docs.nocobase.com/20260709232834.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für Datum und Uhrzeit (ohne Zeitzone) gilt `datetimeNoTz`. Dadurch wird festgelegt, wie die Eingabe und Anzeige auf der Seite erfolgt. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Schichtzeit“, „Kurszeit“ oder „Öffnungszeit“. Es wird empfohlen, einen für die Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Ziffern und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Für Datum und Uhrzeit (ohne Zeitzone) wird normalerweise `datetimeNoTz` verwendet. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Es können beispielsweise Pflichtfelder und Zeitbereiche konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Konfigurationsanpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Datum und Uhrzeit (ohne Zeitzone)“ weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `datetimeNoTz`. |
| Standardmäßiger Field type | `datetimeNoTz`. |
| Optionaler Field type | `datetimeNoTz`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Auswahlfeld für Datum und Uhrzeit verwendet. |
| Filterung | Unterstützt die Filterung nach Zeitpunkt, Bereich, leer und nicht leer. |
| Sortierung | Unterstützt die Sortierung nach Uhrzeit. |
| Validierung | Unterstützt unter anderem Pflichtfeld- und Zeitbereichsvalidierungen. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie rechts neben dem Feld auf „Edit“ klicken, um die Konfiguration des Feldes „Datum und Uhrzeit (ohne Zeitzone)“ zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Anzeige und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder der feldspezifischen Konfiguration.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch dessen Bezeichner. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung normalerweise nicht geändert werden. |
| Field interface | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt | Felder der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu erstellte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Es beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung in Workflow-Variablen. Bei einer größeren Anzahl vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Datum und Uhrzeit (ohne Zeitzone)“ zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und gemeinsam löschen.

Beim Löschen eines neu erstellten Feldes „Datum und Uhrzeit (ohne Zeitzone)“ in der Hauptdatenbank werden normalerweise auch die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Felder für Datum und Uhrzeit (ohne Zeitzone) eignen sich für lokale Zeitangaben.
![20260709232511](https://static-docs.nocobase.com/20260709232511.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl von Datum und Uhrzeit. |
| Tabellenblock | Anzeige, Sortierung und Filterung von Zeitangaben. |
| Kalenderblock | Als Feld für die lokale Ereigniszeit. |
| Workflow | Als Feld für Zeitbedingungen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Datum und Uhrzeit (mit Zeitzone)](./datetime.md) — Zeitpunkte mit Zeitzonenbedeutung speichern
- [Datum](./date.md) — Nur das Datum speichern