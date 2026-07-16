---
pkg: "@nocobase/plugin-data-source-main"
title: "Normale Tabelle"
description: "Normale Tabellen eignen sich zum Speichern regulärer Geschäftsdaten wie Kunden, Bestellungen, Verträgen, Tickets, Projekten und Aufgaben. Sie unterstützen gängige Systemfelder, die Konfiguration von Primärschlüsseln und den Aufbau von Seitenblöcken."
keywords: "Normale Tabelle,General Collection,Systemfelder,DatenTabelle,NocoBase"
---

# Normale Tabelle

## Einführung

Normale Tabellen sind der am häufigsten verwendete Datentabellentyp und eignen sich zum Speichern regulärer Geschäftsdaten wie Kunden, Bestellungen, Verträgen, Tickets, Spesenabrechnungen, Projekten und Aufgaben. Wenn die meisten Geschäftsobjekte keine besondere Struktur erfordern, reicht die Verwendung einer normalen Tabelle in der Regel aus.

Normale Tabellen können aus folgenden Datenquellen stammen:

- Neue Tabellen, die in der Hauptdatenbank erstellt wurden
- Bestehende physische Tabellen, die aus der Hauptdatenbank synchronisiert wurden
- Bestehende physische Tabellen, die aus einer externen Datenbank eingebunden wurden
- Über eine REST API abgebildete Ressourcen
- DatenTabellen aus einer externen NocoBase-Anwendung

Alle diese Daten werden in NocoBase als normale Tabellen verwendet. Der Unterschied besteht darin, dass normale Tabellen in der Hauptdatenbank ihre physische Tabellenstruktur von NocoBase erstellen und verwalten lassen können. Normale Tabellen aus externen Datenquellen lesen in der Regel nur die vorhandene Struktur; die physische Tabellenstruktur wird weiterhin vom externen System verwaltet.

## Geeignete Einsatzszenarien

Normale Tabellen eignen sich für folgende Geschäftsszenarien:

- CRM-Daten wie Kunden, Kontakte, Verkaufschancen und Verträge
- Transaktionsdaten wie Bestellungen, Lieferungen, Rücksendungen und Rechnungen
- Zusammenarbeitsdaten wie Tickets, Aufgaben, Projekte und Anforderungen
- Prozessdaten wie Spesenabrechnungen, Bestellungen und Zahlungsanträge
- Stammdaten wie Geräte, Anlagen, Produkte und Filialen



## Erstellen und konfigurieren

Klicken Sie in der Hauptdatenbank auf „Create collection“ und wählen Sie „General collection“, um eine normale Tabelle zu erstellen.

![20240324085739](https://static-docs.nocobase.com/20240324085739.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Collection display name | Der in der Benutzeroberfläche angezeigte Name der Datentabelle, zum Beispiel „Kunden“, „Bestellungen“ oder „Vertragsanhänge“. Es wird empfohlen, einen Namen zu verwenden, den Fachanwender direkt verstehen können. |
| Collection name | Der Bezeichner der Datentabelle für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Er wird automatisch generiert und kann auch manuell geändert werden. Unterstützt werden nur Buchstaben, Zahlen und Unterstriche; der Name muss mit einem Buchstaben beginnen. |
| Categories | Kategorie der Datentabelle. Kategorien beeinflussen nur die Organisation in der Verwaltungsoberfläche für Datentabellen, nicht die Struktur der Datentabelle. Bei vielen Datentabellen empfiehlt sich eine Einteilung nach Geschäftsmodulen, zum Beispiel „Kundenverwaltung“, „Projektverwaltung“ oder „Finanzen“. |
| Description | Beschreibung der Datentabelle. Sie können angeben, welche Daten gespeichert werden, wer sie pflegt und mit welchen Geschäftsprozessen sie zusammenhängen, um die spätere Wartung zu erleichtern. |
| Use simple pagination mode | Einfacher Seitenaufteilungsmodus. Nach der Aktivierung wird bei der Seitennavigation von Tabellenblöcken die Gesamtzahl der Datensätze nicht ermittelt. Dies eignet sich für sehr große Tabellen und kann die Abfragelast reduzieren. |
| Preset fields | Vordefinierte Felder. Beim Erstellen der Tabelle können Sie auswählen, ob gängige Felder wie ID, Erstellungszeit, Ersteller, Aktualisierungszeit und Aktualisierer automatisch hinzugefügt werden sollen. Für normale Geschäftstabellen wird empfohlen, diese Felder beizubehalten. |

### Integrierte Felder

Beim Erstellen einer normalen Tabelle können Sie über `Preset fields` gängige Systemfelder automatisch hinzufügen.

| Feld | Feldname | Beschreibung |
| --- | --- | --- |
| ID | `id` | Standardfeld für den Primärschlüssel zur eindeutigen Identifizierung eines Datensatzes. Der Standardtyp des Primärschlüssels ist `Snowflake ID (53-bit)`. |
| Erstellungszeit | `createdAt` | Zeichnet automatisch den Erstellungszeitpunkt des Datensatzes auf. Wird häufig zum Sortieren, Filtern, für Audits und als Workflow-Bedingung verwendet. |
| Ersteller | `createdBy` | Zeichnet automatisch den Benutzer auf, der den Datensatz erstellt hat. Wird häufig für „Nur von mir erstellte Daten anzeigen“, die Berechtigungssteuerung und die Nachverfolgung von Verantwortlichkeiten verwendet. |
| Aktualisierungszeit | `updatedAt` | Zeichnet automatisch den Zeitpunkt der letzten Aktualisierung des Datensatzes auf. Wird häufig verwendet, um festzustellen, ob Daten geändert wurden. |
| Aktualisierer | `updatedBy` | Zeichnet automatisch den Benutzer auf, der den Datensatz zuletzt aktualisiert hat. Wird häufig in Audit- und Zusammenarbeits-Szenarien verwendet. |
| [Bereich](../../multi-app/multi-space/index.md) | `space` | Nach Aktivierung des [Multi-Space-Plugins](../../multi-app/multi-space/index.md) verfügbar; dient der Trennung von Daten nach Bereichen. Bei deaktivierten Multi-Space-Funktionen wird dieses Feld nicht in den vordefinierten Feldern normaler Tabellen angezeigt. |

### Primärschlüsselfeld

**Primary key** kennzeichnet das Primärschlüsselfeld. Es dient dazu, einen Datensatz auf Datenbankebene eindeutig zu identifizieren. Beim Erstellen einer Tabelle wird empfohlen, das vordefinierte Feld ID beizubehalten. Der Standardtyp des Primärschlüssels ist `Snowflake ID (53-bit)`.

![20251209210153](https://static-docs.nocobase.com/20251209210153.png)

Bewegen Sie den Mauszeiger über Interface des Feldes ID, um einen anderen Primärschlüsseltyp auszuwählen.

![20251209210517](https://static-docs.nocobase.com/20251209210517.png)

Folgende Primärschlüsseltypen stehen zur Auswahl:

- [Text](../data-modeling/collection-fields/basic/input.md)
- [Integer](../data-modeling/collection-fields/basic/integer.md)
- [Snowflake ID (53-bit)](../data-modeling/collection-fields/advanced/snowflake-id.md)
- [UUID](../data-modeling/collection-fields/advanced/uuid.md)
- [Nano ID](../data-modeling/collection-fields/advanced/nano-id.md)

:::warning Hinweis

Datentabellen ohne Primärschlüssel müssen beim Bearbeiten der Datentabelle unter „Record unique key“ konfiguriert werden. Andernfalls können auf Seiten keine Blöcke erstellt und Datensätze nicht korrekt angezeigt oder bearbeitet werden.

:::


## Verwendung in der Seitenkonfiguration

Normale Tabellen können für die meisten Daten- und Filterblöcke verwendet werden.

| Block | Zweck |
| --- | --- |
| [Tabellenblock](../../interface-builder/blocks/data-blocks/table.md) | Datensätze anzeigen, filtern, sortieren und stapelweise verarbeiten. |
| [Formularblock](../../interface-builder/blocks/data-blocks/form.md) | Einen einzelnen Datensatz hinzufügen oder bearbeiten. |
| [Detailblock](../../interface-builder/blocks/data-blocks/details.md) | Die Details eines einzelnen Datensatzes anzeigen. |
| [Listenblock](../../interface-builder/blocks/data-blocks/list.md) | Datensätze in Listenform anzeigen. |
| [Rasterkartenblock](../../interface-builder/blocks/data-blocks/grid-card.md) | Datensätze wie Bilder, Dateien, Produkte und Anlagen in einem Kartenraster anzeigen. |
| [Kanban-Block](../../interface-builder/blocks/data-blocks/kanban.md) | Datensätze nach Feldern wie Status, Phase oder Verantwortlichem gruppiert anzeigen. |
| [Kalenderblock](../../interface-builder/blocks/data-blocks/calendar.md) | Datensätze nach Datum oder Zeitraum anzeigen. |
| [Diagrammblock](../../interface-builder/blocks/data-blocks/chart.md) | Statistische Diagramme auf Grundlage der Datensätze erstellen. |
| [Kartenblock](../../interface-builder/blocks/data-blocks/map.md) | Datensätze nach geografischem Standort anzeigen. |
| [Gantt-Diagrammblock](../../plugins/@nocobase/plugin-gantt/index.md) | Projektpläne und Aufgabenplanung anhand von Start- und Endzeit anzeigen. |
| [Formularfilterblock](../../interface-builder/blocks/filter-blocks/form.md) | Datenblöcke auf der Seite anhand von Formularbedingungen filtern. |
| [Baumfilterblock](../../interface-builder/blocks/filter-blocks/tree.md) | Datenblöcke auf der Seite anhand einer Baumstruktur filtern, etwa nach Kategorien, Organisationen oder Regionen. |

## Konfiguration bearbeiten

Klicken Sie in der Liste der Datentabellen rechts neben einer normalen Tabelle auf „Edit“, um die grundlegende Konfiguration der Datentabelle zu ändern. Die Bearbeitung der Datentabelle dient hauptsächlich zur Anpassung von Metadaten und bestimmten Laufzeiteinstellungen, nicht zur stapelweisen Änderung der Feldstruktur.

Wenn Sie Felder hinzufügen, Feldtypen ändern, den Feldschnittstellentyp anpassen oder Felder löschen möchten, öffnen Sie „Configure fields“.

![edit_collection](https://static-docs.nocobase.com/edit_collection.png)

![edit_collection_configure](https://static-docs.nocobase.com/edit_collection_configure.png)

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Collection display name | Ja | Der in der Benutzeroberfläche angezeigte Name der Datentabelle, zum Beispiel „Kunden“, „Bestellungen“ oder „Vertragsanhänge“. Änderungen wirken sich nur auf die Anzeige aus, nicht auf den Bezeichner der Datentabelle. |
| Collection name | Nein | Der Bezeichner der Datentabelle für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung kann er im Bearbeitungsformular nicht geändert werden. |
| Inherits | Bedingt | Auswahl der übergeordneten Tabelle, von der geerbt werden soll. Nur verfügbar, wenn die Hauptdatenbank PostgreSQL ist und die Konfiguration in der Benutzeroberfläche angezeigt wird. Vor der Änderung der Vererbungsbeziehung einer bestehenden Datentabelle müssen Sie prüfen, ob Feldstruktur, Seitenblöcke, Berechtigungen und Workflows von der bisherigen Struktur abhängen. |
| Categories | Ja | Kategorie der Datentabelle. Kategorien beeinflussen nur die Organisation in der Verwaltungsoberfläche für Datentabellen, nicht die Struktur der Datentabelle. |
| Description | Ja | Beschreibung der Datentabelle. Hier können Zweck, Pflegeverantwortliche, Datenquelle und zugehörige Geschäftsprozesse ergänzt werden. |
| Use simple pagination mode | Ja | Einfacher Seitenaufteilungsmodus. Nach der Aktivierung wird bei der Seitennavigation von Tabellenblöcken die Gesamtzahl der Datensätze nicht ermittelt. Dies eignet sich für sehr große Tabellen. |
| Record unique key | Ja | Eindeutige Kennung eines Datensatzes. Dient dazu, einen Datensatz in einem Block zu identifizieren. In der Regel wird der Primärschlüssel oder ein eindeutiges Feld ausgewählt. Für Datentabellen ohne Primärschlüssel ist diese Konfiguration erforderlich, da andernfalls Blöcke nicht korrekt erstellt und Datensätze nicht angezeigt oder bearbeitet werden können. |

:::warning Hinweis

Beim Bearbeiten einer Datentabelle werden vorhandene Felder nicht automatisch angepasst. `Preset fields` wird nur beim Erstellen der Tabelle wirksam. Wenn Sie nach der Erstellung noch Felder wie Erstellungszeit, Ersteller, Aktualisierungszeit oder Aktualisierer hinzufügen müssen, fügen Sie diese separat unter „Configure fields“ hinzu.

:::

## Löschen einer Datentabelle

Klicken Sie in der Liste der Datentabellen rechts neben einer normalen Tabelle auf „Delete“, um die Datentabelle zu löschen. Normale Tabellen in der Hauptdatenbank können außerdem nach einer Mehrfachauswahl gemeinsam gelöscht werden.

![delete_collection](https://static-docs.nocobase.com/delete_collection.png)

Beim Löschen wird eine zusätzliche Bestätigung angezeigt. Nach der Bestätigung löscht NocoBase die Collection-Metadaten dieser normalen Tabelle sowie die physische Datentabelle in der Hauptdatenbank einschließlich ihrer Daten.

![delete_collection_second_confirmation](https://static-docs.nocobase.com/delete_collection_second_confirmation.png)

Im Bestätigungsdialog zum Löschen gibt es eine optionale Einstellung: Objekte, die von dieser Datentabelle abhängen, automatisch löschen. Nach der Aktivierung versucht NocoBase, Datenbankobjekte, die von dieser Tabelle abhängen, ebenfalls zu löschen, beispielsweise auf Grundlage dieser Tabelle erstellte Datenbankansichten sowie weitere Objekte, die weiterhin von diesen Objekten abhängen.

:::danger Warnung

Das Löschen einer normalen Tabelle ist ein Vorgang mit hohem Risiko. Nach dem Löschen können Tabellenstruktur, Tabellendaten, Feldmetadaten sowie Seitenblöcke, Beziehungsfelder, Berechtigungen, Workflows und API-Aufrufe, die von dieser Tabelle abhängen, ausfallen. Prüfen Sie vor der Aktivierung des automatischen Löschens abhängiger Objekte, ob diese ebenfalls gelöscht werden dürfen.

:::
