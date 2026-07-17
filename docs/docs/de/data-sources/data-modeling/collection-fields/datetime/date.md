---
title: "Datum"
description: "Das Datumsfeld dient zum Speichern von Geburtstagen, Vertragsunterzeichnungsdaten, Fälligkeitsterminen und anderen Datumsangaben ohne konkrete Uhrzeit."
keywords: "Datum,date,Datumsfeld,NocoBase"
---

# Datum

## Einführung

In NocoBase wird **Datum (Date)** zum Speichern von Datumsangaben ohne konkrete Uhrzeit verwendet.

Datumsfelder eignen sich für Geschäftsdaten wie Geburtstage, Vertragsunterzeichnungsdaten, Fälligkeitstermine und geplante Termine, bei denen nur Jahr, Monat und Tag relevant sind.

Wenn konkrete Stunden, Minuten und Sekunden gespeichert werden müssen, wählen Sie [Datum und Uhrzeit](./datetime.md). Wenn nur die Uhrzeit innerhalb eines Tages benötigt wird, wählen Sie [Uhrzeit](./time.md).

## Geeignete Einsatzszenarien

Datumsfelder eignen sich für folgende Geschäftsszenarien:

- Geburtstage von Kunden und Eintrittsdaten von Mitarbeitenden
- Vertragsunterzeichnungsdaten und Fälligkeitstermine
- Geplante Termine und Liefertermine
- Geschäftsdaten, für die keine konkrete Uhrzeit erforderlich ist

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Datum“, um ein Datumsfeld zu erstellen.

![20260709232951](https://static-docs.nocobase.com/20260709232951.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für Datumsfelder entspricht er `date` und bestimmt, wie Werte auf der Seite eingegeben und angezeigt werden. |
| Field display name | Der im Benutzeroberfläche angezeigte Name des Feldes, z. B. „Vertragsdatum“, „Fälligkeitstermin“ oder „Geburtstag“. Es wird empfohlen, einen für die Fachanwender direkt verständlichen Namen zu verwenden. |
| Field name | Der Identifikationsname des Feldes, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. Nach der Erstellung wird er in der Regel nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Der Feldtyp für Datumsfelder ist standardmäßig `dateonly`. |
| Default value | Der Standardwert. Wenn der Benutzer beim Erstellen eines neuen Datensatzes keinen Wert eingibt, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Es können unter anderem Pflichtfelder und Datumsbereiche konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person dokumentiert werden. |

:::warning Achtung

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Feldeigenschaften

Das Datumsfeld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßige Field interface | `date`. |
| Standardmäßiger Field type | `dateonly`. |
| Verfügbare Field types | `dateonly`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Datumsauswahlfeld verwendet. |
| Filterung | Unterstützt die Filterung nach Datum, Zeitraum, leer und nicht leer. |
| Sortierung | Unterstützt die Sortierung nach Datum. |
| Validierung | Unterstützt unter anderem Pflichtfelder und Datumsbereiche. |

## Konfiguration bearbeiten

Nach der Erstellung können Sie auf „Edit“ rechts neben dem Feld klicken, um die Konfiguration des Datumsfeldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Ändern des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, wird bei der Bearbeitung in der Regel eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einer Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch den Identifikationsnamen. |
| Field name | Nein | Der Identifikationsname des Feldes kann im Bearbeitungsformular nach der Erstellung in der Regel nicht geändert werden. |
| Field interface | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Dies beeinflusst die Eingabe, Darstellung und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Feldzuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann die Einstellung angepasst werden. Prüfen Sie vor der Änderung, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu erstellte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, die Datenquelle oder die zuständige Person. |

:::warning Achtung

Das Wechseln des Field type oder der Field interface ist nicht gleichbedeutend mit dem einfachen Ändern eines Anzeigenamens. Dadurch werden die Speicherweise des Feldes, die Eingabekomponente, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen beeinflusst. Wenn bereits viele Daten vorhanden sind, prüfen Sie zuerst, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie auf „Delete“ rechts neben dem Feld, um das Datumsfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und anschließend gesammelt löschen.

Beim Löschen eines neu erstellten Datumsfeldes in der Hauptdatenbank werden in der Regel gleichzeitig die tatsächliche Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Datumsfelder eignen sich für die Verwendung in Formularen, Tabellen, Filtern, Kalendern und Auswertungen.
![20260709232644](https://static-docs.nocobase.com/20260709232644.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl eines Datums. |
| Tabellenblock | Anzeige, Sortierung und Filterung von Datumsangaben. |
| Kalenderblock | Als Datumsfeld eines Ereignisses. |
| Workflow | Als Feld für Datumsbedingungen. |

## Weiterführende Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../../../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Datum und Uhrzeit (einschließlich Zeitzone)](./datetime.md) — Konkrete Datums- und Uhrzeitangaben speichern
- [Uhrzeit](./time.md) — Nur die Uhrzeit speichern