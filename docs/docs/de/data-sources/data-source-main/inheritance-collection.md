---
pkg: "@nocobase/plugin-data-source-main"
title: "Vererbungstabellen"
description: "Vererbungstabellen leiten untergeordnete Tabellen von übergeordneten Tabellen ab. Untergeordnete Tabellen erben die Feldstruktur der übergeordneten Tabelle und können eigene Felder definieren. Unterstützt wird dies nur, wenn die Hauptdatenbank PostgreSQL ist."
keywords: "Vererbungstabellen,Inheritance Collection,Tabellenvererbung,Datenbanktabellenerweiterung,PostgreSQL,NocoBase"
---

# Vererbungstabellen

## Einführung

Vererbungstabellen sind eine Erweiterung gewöhnlicher Tabellen. Sie eignen sich, wenn mehrere Datentabellen eine Gruppe gemeinsamer Felder verwenden sollen, während jede untergeordnete Tabelle zusätzlich eigene spezifische Felder besitzt.

Zum Beispiel kann zunächst eine übergeordnete Tabelle „Assets“ erstellt werden, in der gemeinsame Felder wie Asset-Nummer, Asset-Name, Kaufdatum und Verantwortlicher gespeichert werden. Davon können anschließend untergeordnete Tabellen wie „Computer-Assets“, „Fahrzeug-Assets“ und „Büromöbel“ abgeleitet werden. Die untergeordneten Tabellen erben die Feldstruktur der übergeordneten Tabelle und können zusätzlich eigene Felder definieren.

:::warning Hinweis

Vererbungstabellen können nur erstellt werden, wenn die Hauptdatenbank PostgreSQL ist. Andere Hauptdatenbanken, externe Datenbanken, REST-API-Datenquellen und externe NocoBase-Datenquellen unterstützen keine Vererbungstabellen.

:::

## Geeignete Einsatzszenarien

Vererbungstabellen eignen sich für folgende Geschäftsszenarien:

- Von einer übergeordneten Asset-Tabelle werden Computer-Assets, Fahrzeug-Assets und Büromöbel abgeleitet
- Von einer übergeordneten Personentabelle werden Mitarbeiter, externe Mitarbeiter und Besucher abgeleitet
- Von einer übergeordneten Vorgangstabelle werden Aufgaben, Fehler und Anforderungen abgeleitet
- Von einer übergeordneten Vertragstabelle werden Einkaufsverträge, Verkaufsverträge und Dienstleistungsverträge abgeleitet

Voraussetzung für den Einsatz von Vererbungstabellen ist, dass diese Objekte über stabile gemeinsame Felder verfügen und sich die untergeordneten Tabellen hauptsächlich durch wenige spezifische Felder unterscheiden.

## Erstellung und Konfiguration

Wenn Sie in der Hauptdatenbank auf „Create collection“ klicken und eine gewöhnliche Tabelle oder einen Erstellungseinstieg auswählen, der Vererbung unterstützt, können Sie über `Inherits` eine übergeordnete Tabelle auswählen.

![20240324085907](https://static-docs.nocobase.com/20240324085907.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der in der Benutzeroberfläche angezeigte Name der Datentabelle, zum Beispiel „Computer-Assets“, „Fahrzeug-Assets“ oder „Büromöbel“. |
| Collection name | Der Bezeichner der Datentabelle, der für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. verwendet wird. |
| Inherits | Wählt die übergeordnete Tabelle aus, von der geerbt werden soll. Die aktuelle Datentabelle erbt die Feldstruktur der übergeordneten Tabelle und kann zusätzlich eigene Felder definieren. |
| Categories | Kategorie der Datentabelle. Die Kategorie beeinflusst nur die Organisation in der Verwaltungsoberfläche der Datentabellen, nicht deren Struktur. |
| Description | Beschreibung der Datentabelle. Hier kann angegeben werden, welche Art von Daten in dieser untergeordneten Tabelle gespeichert wird, von welcher übergeordneten Tabelle sie abgeleitet ist und wer sie pflegt. |
| Preset fields | Vordefinierte Felder. Vererbungstabellen behalten in der Regel auch die Felder gewöhnlicher Tabellen wie ID, Erstellungszeit, Ersteller, Aktualisierungszeit und Aktualisierer bei. |

Für Vererbungstabellen können die Block- und Feldkonfigurationen [gewöhnlicher Tabellen](./general-collection.md) verwendet werden. Für Seitenblöcke handelt es sich weiterhin um eine Datentabelle, deren Datensätze erstellt, angezeigt, bearbeitet und gelöscht werden können.

:::warning Hinweis

Vererbungstabellen eignen sich für Geschäftsobjekte mit einer weitgehend ähnlichen Struktur. Wenn sich Geschäftsprozesse, Berechtigungen und Seiten der verschiedenen Objekte stark unterscheiden, ist es in der Regel übersichtlicher, gewöhnliche Tabellen zu verwenden und sie über Beziehungsfelder zu verknüpfen.

:::

### Integrierte Felder

Eine Vererbungstabelle erbt die bereits vorhandenen Felder der übergeordneten Tabelle und kann zusätzlich eigene Felder enthalten.

| Feldquelle | Beschreibung |
| --- | --- |
| Felder der übergeordneten Tabelle | Die untergeordnete Tabelle erbt die gemeinsamen Felder der übergeordneten Tabelle, zum Beispiel Asset-Nummer, Asset-Name und Verantwortlicher. |
| Felder der untergeordneten Tabelle | Die untergeordnete Tabelle kann eigene spezifische Felder definieren, zum Beispiel „CPU-Modell“ für Computer-Assets oder „Kennzeichen“ für Fahrzeug-Assets. |
| Systemfelder | Wenn bei der Erstellung `Preset fields` beibehalten wird, sind Felder wie ID, Erstellungszeit, Ersteller, Aktualisierungszeit und Aktualisierer enthalten. |

:::warning Hinweis

Felder der übergeordneten Tabelle wirken sich auf alle von ihr abgeleiteten untergeordneten Tabellen aus. Vergewissern Sie sich vor der Änderung eines Feldes der übergeordneten Tabelle, dass Seiten, Berechtigungen, Workflows und APIs der untergeordneten Tabellen nicht von diesem Feld abhängen.

:::

### Primärschlüsselfeld

Wie gewöhnliche Tabellen benötigen auch Vererbungstabellen ein Primärschlüsselfeld. Es wird empfohlen, bei der Tabellenerstellung das vordefinierte ID-Feld beizubehalten. Der standardmäßige Primärschlüsseltyp ist `Snowflake ID (53-bit)`.

Wenn eine verbundene oder synchronisierte Vererbungstabelle keinen Primärschlüssel besitzt, muss beim Bearbeiten der Datentabelle „Record unique key“ festgelegt werden. Andernfalls können Seitenblöcke Datensätze möglicherweise nicht korrekt anzeigen oder bearbeiten.

## Verwendung in der Seitenkonfiguration

Vererbungstabellen können in den meisten Seitenblöcken verwendet werden, die auch gewöhnliche Tabellen unterstützen. Häufig werden die verschiedenen untergeordneten Tabellen jeweils als eigenständige Tabellen-, Formular-, Detail- oder Kanban-Blöcke konfiguriert.

| Block | Verwendung |
| --- | --- |
| [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) | Anzeigen, Filtern, Sortieren und Bearbeiten von Datensätzen der untergeordneten Tabelle in großen Mengen. |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Erstellen oder Bearbeiten eines einzelnen Datensatzes der untergeordneten Tabelle. |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Anzeigen der Details eines einzelnen Datensatzes der untergeordneten Tabelle. |
| [Kanban-Block](../../interface-builder/blocks/data-blocks/kanban.md) | Gruppierte Anzeige von Datensätzen der untergeordneten Tabelle nach Feldern wie Status, Phase oder Verantwortlichem. |

## Konfiguration bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben der Vererbungstabelle auf „Edit“, um unter anderem den Anzeigenamen, die Kategorie, die Beschreibung, den einfachen Seitennavigationsmodus und „Record unique key“ zu ändern.

Es wird nicht empfohlen, die Vererbungsbeziehungen häufig anzupassen, nachdem bereits zahlreiche Geschäftskonfigurationen darauf aufgebaut wurden. Seitenblöcke, Beziehungsfelder, Berechtigungen und Workflows können von der aktuellen Feldstruktur abhängen.

## Datentabelle löschen

Klicken Sie in der Liste der Datentabellen rechts neben der Vererbungstabelle auf „Delete“, um die Vererbungstabelle zu löschen.

Beim Löschen einer Vererbungstabelle werden die Collection-Metadaten der untergeordneten Tabelle sowie die tatsächliche Datentabelle in der Hauptdatenbank gelöscht. Prüfen Sie vor dem Löschen, ob noch Seitenblöcke, Beziehungsfelder, Berechtigungen, Workflows oder APIs diese untergeordnete Tabelle verwenden.

:::danger Warnung

Das Löschen einer Vererbungstabelle entspricht nicht automatisch dem Löschen der übergeordneten Tabelle. Ob abhängige Objekte gelöscht werden, hängt von den Optionen im Löschbestätigungsdialog ab. Prüfen Sie vor dem Vorgang, ob die übergeordnete Tabelle und andere untergeordnete Tabellen weiterhin benötigt werden.

:::

## Verwandte Links

- [Gewöhnliche Tabellen](./general-collection.md) — Allgemeine Konfiguration gewöhnlicher Tabellen anzeigen
- [Hauptdatenbank](./index.md) — Unterstützte Datenbanktypen der Hauptdatenbank anzeigen
- [Felder von Datentabellen](../data-modeling/collection-fields/index.md) — Konfiguration von Feldern anzeigen