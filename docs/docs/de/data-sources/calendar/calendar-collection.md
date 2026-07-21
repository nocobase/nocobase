---
pkg: "@nocobase/plugin-calendar"
title: "Kalendertabelle"
description: "Die Kalendertabelle dient zum Speichern von Daten mit Zeiträumen, etwa für Besprechungen, Planungen, Kurse oder Bereitschaftsdienste, und ermöglicht zusammen mit dem Kalenderblock die Anzeige und Bearbeitung von Ereignissen."
keywords: "Kalendertabelle,Calendar Collection,Kalenderereignis,Wiederholungsereignis,Kalenderblock,NocoBase"
---

# Kalendertabelle

## Einführung

Die Kalendertabelle eignet sich zum Speichern von Daten mit Zeiträumen, etwa für Raumreservierungen, Projektplanungen, Kurspläne, Bereitschaftspläne oder Veranstaltungspläne. Im Grunde handelt es sich weiterhin um eine Datentabelle, die jedoch bereits Felder für Kalenderereignisse enthält und sich dadurch später bequem mit dem Kalenderblock verwenden lässt.

Kalendertabellen können nur über die Seite der primären Datenbank erstellt werden. Externe Datenbanken, REST-API-Datenquellen und externe NocoBase-Datenquellen unterstützen das Erstellen von Kalendertabellen nicht.

## Geeignete Einsatzszenarien

Kalendertabellen eignen sich für folgende Geschäftsszenarien:

- Reservierung von Besprechungsräumen, Fahrzeugen und Geräten
- Projektplanung, Aufgabenplanung und Meilensteinplanung
- Stundenpläne, Schulungspläne und Veranstaltungspläne
- Bereitschaftspläne, Schichtpläne und Inspektionspläne
- Ereignisaufzeichnungen, die nach Tag, Woche oder Monat angezeigt werden sollen

## Erstellung und Konfiguration

Klicken Sie in der primären Datenbank auf „Create collection“ und wählen Sie „Calendar collection“, um eine Kalendertabelle zu erstellen.

Die Konfiguration beim Erstellen einer Kalendertabelle entspricht weitgehend der einer normalen Tabelle. `Preset fields` dient zur Steuerung gängiger Systemfelder. Außerdem werden in einer Kalendertabelle Felder zum Speichern von Wiederholungsereignissen vorab eingerichtet.

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der Name, unter dem die Datentabelle in der Benutzeroberfläche angezeigt wird, zum Beispiel „Raumreservierung“, „Kursplan“ oder „Bereitschaftsplan“. |
| Collection name | Der Bezeichner der Datentabelle für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. |
| Inherits | Wählen Sie die übergeordnete Tabelle aus, von der geerbt werden soll. Diese Option ist nur sichtbar, wenn die primäre Datenbank PostgreSQL verwendet. |
| Categories | Kategorie der Datentabelle. Die Kategorie beeinflusst nur die Organisation in der Verwaltung der Datentabellen, nicht deren Struktur. |
| Description | Beschreibung der Datentabelle. Sie können angeben, welche Ereignisse diese Kalendertabelle speichert, wer sie pflegt und mit welchen Geschäftsprozessen sie verbunden ist. |
| Preset fields | Voreingestellte Felder. Beim Erstellen einer Kalendertabelle wird empfohlen, die Systemfelder und die integrierten Felder der Kalendertabelle beizubehalten. |

### Integrierte Felder

Nach dem Erstellen enthält eine Kalendertabelle normalerweise die folgenden integrierten Felder. `cron` und `exclude` dienen zum Speichern von Regeln für Wiederholungsereignisse und Ausschlussdaten.

| Feld | Feldname | Beschreibung |
| --- | --- | --- |
| ID | `id` | Standardfeld für den Primärschlüssel zur eindeutigen Identifizierung eines Ereignisses. |
| Erstellungszeit | `createdAt` | Zeichnet automatisch den Erstellungszeitpunkt des Ereignisses auf. |
| Ersteller | `createdBy` | Zeichnet automatisch den Benutzer auf, der das Ereignis erstellt hat. |
| Aktualisierungszeit | `updatedAt` | Zeichnet automatisch den Zeitpunkt der letzten Aktualisierung des Ereignisses auf. |
| Aktualisierer | `updatedBy` | Zeichnet automatisch den Benutzer auf, der das Ereignis zuletzt aktualisiert hat. |
| Sortierung | `sort` | Speichert den Sortierwert des Ereignisses und unterstützt Funktionen wie die Sortierung per Drag-and-drop. |
| Repeats | `cron` | Speichert Regeln für Wiederholungsereignisse, zum Beispiel tägliche, wöchentliche, monatliche oder jährliche Wiederholungen. |
| Exclude | `exclude` | Speichert die aus einem Wiederholungsereignis ausgeschlossenen Daten und wird normalerweise automatisch durch die Kalenderinteraktion gepflegt. |
| Bereich | `space` | Nach Aktivierung des [Multi-Space-Plugins](../../multi-app/multi-space/index.md) verfügbar; dient zur Trennung von Daten nach Bereichen. Wird bei nicht aktiviertem Multi-Space-Plugin nicht angezeigt. |

Bei der Verwendung einer Kalendertabelle im Kalenderblock müssen außerdem die Geschäftsfelder für die Anzeige der Ereignisse festgelegt werden:

| Konfiguration | Beschreibung |
| --- | --- |
| Titelfeld | Legt den Titel des Ereignisses im Kalender fest, zum Beispiel „Besprechungsthema“ oder „Kursname“. |
| Startdatumsfeld | Legt den Beginn des Ereignisses fest. In der Regel wird ein Datums- und Uhrzeitfeld verwendet. |
| Enddatumsfeld | Legt das Ende des Ereignisses fest. In der Regel wird ein Datums- und Uhrzeitfeld verwendet. |

:::warning Hinweis

`cron` und `exclude` werden normalerweise von der Kalenderfunktion gepflegt und sollten nicht direkt als normale Geschäftsfelder bearbeitet werden. Die Felder für Titel, Startdatum und Enddatum müssen entsprechend den Geschäftsanforderungen selbst erstellt und konfiguriert werden, da der Kalenderblock Ereignisse sonst nicht korrekt anzeigen kann.

:::

### Primärschlüsselfeld

Wie eine normale Tabelle benötigt auch eine Kalendertabelle ein Primärschlüsselfeld. Beim Erstellen der Tabelle wird empfohlen, das voreingestellte ID-Feld beizubehalten. Der Standardtyp des Primärschlüssels ist `Snowflake ID (53-bit)`.

Wenn eine Kalendertabelle keinen Primärschlüssel besitzt, muss beim Bearbeiten der Datentabelle „Record unique key“ festgelegt werden. Andernfalls kann der Kalenderblock Ereignisse möglicherweise nicht korrekt öffnen, bearbeiten oder lokalisieren.

## Konfiguration bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben der Kalendertabelle auf „Edit“, um unter anderem den Anzeigenamen, die Kategorie, die Beschreibung, den einfachen Seitennavigationsmodus und „Record unique key“ zu ändern.

Die integrierten Felder `cron`, `exclude` usw. der Kalendertabelle werden normalerweise von der Kalenderfunktion verwendet und sollten nicht mit einer anderen geschäftlichen Bedeutung versehen werden. Wenn Sie die Ereignisinformationen erweitern müssen, können Sie normale Geschäftsfelder hinzufügen, zum Beispiel Ort, Teilnehmer, Besprechungsraum oder Status.

## Datentabelle löschen

Klicken Sie in der Liste der Datentabellen rechts neben der Kalendertabelle auf „Delete“, um die Kalendertabelle zu löschen.

Beim Löschen einer Kalendertabelle werden die Ereignisaufzeichnungen, die Daten der integrierten Kalenderfelder und die zugehörigen Metadaten der Collection gelöscht. Prüfen Sie vor dem Löschen, ob Kalenderblock, Tabellenblock, Berechtigungen, Workflows und APIs noch von dieser Tabelle abhängen.

:::danger Warnung

Kalendertabellen enthalten normalerweise Zeitdaten für Planungen, Reservierungen und Bereitschaftsdienste. Nach dem Löschen gehen historische Ereignisse und Wiederholungsregeln verloren. Vergewissern Sie sich daher vor dem Vorgang, dass die Daten gesichert wurden oder nicht mehr benötigt werden.

:::

## Verwendung in der Seitenkonfiguration

Für Kalendertabellen können die meisten Datenblöcke der [normalen Tabelle](../data-source-main/general-collection.md) zum Erstellen, Lesen, Aktualisieren und Löschen von Daten verwendet werden. Darüber hinaus werden sie normalerweise zusammen mit dem Kalenderblock eingesetzt:

| Block | Verwendung |
| --- | --- |
| [Kalenderblock](../../interface-builder/blocks/data-blocks/calendar.md) | Zeigt Ereignisaufzeichnungen in Tages-, Wochen-, Monats- und anderen Ansichten an und ermöglicht das Erstellen, Anzeigen und Bearbeiten von Ereignissen im Kalender. |
| [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) | Ermöglicht die listenbasierte Anzeige, Filterung und stapelweise Pflege von Ereignisaufzeichnungen. |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Fügt eine einzelne Ereignisaufzeichnung hinzu oder bearbeitet sie. |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Zeigt die detaillierten Informationen eines einzelnen Ereignisses an. |

## Verwandte Links

- [Normale Tabelle](../data-source-main/general-collection.md) — Informationen zu allgemeinen Konfigurationen und zur Verwendung von Blöcken
- [Datums- und Uhrzeitfelder](../data-modeling/collection-fields/datetime/datetime.md) — Erstellen von Feldern für Beginn und Ende von Ereignissen
- [Kalenderblock](../../interface-builder/blocks/data-blocks/calendar.md) — Anzeigen von Daten in Kalenderform auf einer Seite
- [Multi-Space](../../multi-app/multi-space/index.md) — Informationen zu Bereichsfeldern und der Bereichstrennung von Daten