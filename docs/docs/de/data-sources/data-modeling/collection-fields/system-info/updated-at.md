---
title: "Aktualisierungsdatum"
description: "Das Feld „Aktualisierungsdatum“ zeichnet automatisch den Zeitpunkt der letzten Aktualisierung eines Datensatzes auf."
keywords: "Aktualisierungsdatum,updatedAt,Systemfeld,NocoBase"
---

# Aktualisierungsdatum

## Einführung

In NocoBase wird **das Aktualisierungsdatum (Updated at)** verwendet, um automatisch den Zeitpunkt der letzten Aktualisierung eines Datensatzes aufzuzeichnen.

Das Aktualisierungsdatum wird normalerweise durch ein voreingestelltes Feld erzeugt. Es eignet sich für Audits, die Beurteilung von Synchronisierungen, Sortierungen, Filterungen und Workflow-Bedingungen.

Wenn Sie geschäftliche Zeitpunkte wie den Abschlusszeitpunkt oder den Genehmigungszeitpunkt speichern müssen, verwenden Sie [Datum und Uhrzeit](../datetime/datetime.md).

## Geeignete Einsatzszenarien

Das Aktualisierungsdatum eignet sich für folgende geschäftliche Szenarien:

- Den Zeitpunkt der letzten Aktualisierung anzeigen
- Zuletzt aktualisierte Daten filtern
- Ermitteln, ob Daten längere Zeit nicht gepflegt wurden
- Beim Synchronisieren mit externen Systemen Aktualisierungszeitpunkte vergleichen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Aktualisierungsdatum“, um ein Feld für das Aktualisierungsdatum zu erstellen.

![20240512174826](https://static-docs.nocobase.com/20240512174826.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Benutzeroberflächentyp des Feldes. Für das Aktualisierungsdatum entspricht er `updatedAt` und bestimmt, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Aktualisierungsdatum“ oder „Zeitpunkt der letzten Aktualisierung“. Es wird empfohlen, einen für die zuständigen Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Datentyp des Feldes auf Datenebene. Für das Aktualisierungsdatum wird normalerweise `date` verwendet. |
| Default value | Der Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch ein Standardwert übernommen werden. |
| Validation rules | Wird vom System automatisch verwaltet; eine manuelle Validierung ist normalerweise nicht erforderlich. |
| Description | Die Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Bestätigen Sie die Benennung daher vor der Erstellung, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Feld für das Aktualisierungsdatum weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `updatedAt`. |
| Standardmäßiger Field type | `date`. |
| Verfügbare Field types | `date`. |
| Seitenkomponente | Wird automatisch vom System geschrieben; auf der Seite wird der Wert normalerweise schreibgeschützt angezeigt. |
| Filterung | Unterstützt die Filterung nach Zeitpunkten und Zeiträumen. |
| Sortierung | Unterstützt die Sortierung nach Zeitpunkten. |
| Validierung | Wird automatisch vom System geschrieben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes für das Aktualisierungsdatum zu bearbeiten. Die Bearbeitung von Feldern dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, etwa den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – ein Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den Anzeigenamen des Feldes in der Benutzeroberfläche, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt unterstützt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Dies wirkt sich auf die Eingabe, Anzeige und Validierung auf der Seite aus. |
| Field type | Bedingt unterstützt | Felder aus der Hauptdatenbank oder synchronisierte Felder können bei der Feldzuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die für die Pflege verantwortliche Person. |

:::warning Hinweis

Der Wechsel von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Er wirkt sich auf die Speicherung des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen aus. Bei einer größeren Anzahl vorhandener Daten muss zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld für das Aktualisierungsdatum zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Feldes für das Aktualisierungsdatum werden normalerweise auch die tatsächliche Spalte in der Datenbank und die bereits darin enthaltenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann sich auf Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten auswirken. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld für das Aktualisierungsdatum eignet sich für die Verwendung in Listen, Detailansichten, Filtern und bei der Beurteilung von Synchronisierungen.
![20260710153223](https://static-docs.nocobase.com/20260710153223.png)

| Szenario | Zweck |
| --- | --- |
| Tabellenblock | Den Zeitpunkt der letzten Aktualisierung anzeigen und danach sortieren. |
| Filterblock | Zuletzt aktualisierte oder längere Zeit nicht aktualisierte Datensätze filtern. |
| Detailblock | Den Zeitpunkt der letzten Aktualisierung anzeigen. |
| Workflow | Als Zeitbedingung für die Entscheidungsfindung verwenden. |

## Verwandte Links

- [Felder](../index.md) — Informationen zu Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Erstellungsdatum](./created-at.md) — Den Erstellungszeitpunkt automatisch aufzeichnen
- [Datum und Uhrzeit (mit Zeitzone)](../datetime/datetime.md) — Geschäftliche Zeitpunkte speichern