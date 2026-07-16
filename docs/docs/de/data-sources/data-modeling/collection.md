---
title: "Datentabelle"
description: "Erfahren Sie mehr über die Funktion von NocoBase-Datentabellen, die verschiedenen Tabellenstrukturtypen, die Unterschiede zwischen der Hauptdatenbank und externen Datentabellen sowie die Auswahl zwischen regulären Tabellen, Vererbungstabellen, Baumtabellen, Dateitabellen, SQL-Tabellen und Datenbankansichten."
keywords: "Datentabelle,Collection,reguläre Tabelle,Vererbungstabelle,Baumtabelle,Dateitabelle,SQL-Tabelle,Datenbankansicht,NocoBase"
---

# Datentabelle

## Einführung

In NocoBase ist **Collection (Datentabelle)** ein Datenmodell zur Beschreibung einer bestimmten Art von Geschäftsdaten. Es handelt sich nicht einfach um den Namen einer Datenbanktabelle, sondern um die einheitliche Beschreibung einer Datenkategorie durch NocoBase.

Eine Collection definiert in der Regel drei Dinge:

| Definition | Beschreibung |
| --- | --- |
| Wo die Daten gespeichert werden | Die Daten können aus einer Tabelle der Hauptdatenbank, einer externen Datenbanktabelle, den Ergebnissen einer SQL-Abfrage, einer Datenbankansicht, einer REST-API-Ressource oder einer externen NocoBase-Anwendung stammen. |
| Welche Felder vorhanden sind | Felder beschreiben, welche Informationen jeder Datensatz enthält, zum Beispiel Kundenname, Mobiltelefonnummer, Bestellbetrag, Erstellungszeitpunkt und Verantwortlicher. |
| Wie sie von NocoBase verwendet wird | Seitenblöcke, Berechtigungen, Workflows, APIs und Beziehungsfelder arbeiten auf Grundlage von Collections. |

Sie können sich eine Collection als „Datenstruktur eines Geschäftsobjekts“ vorstellen. Beispielsweise können „Kunden“, „Bestellungen“, „Verträge“ und „Aufgaben“ jeweils eine Collection sein.

Nach dem Erstellen oder Einbinden einer Datentabelle müssen in der Regel noch drei weitere Schritte durchgeführt werden:

- Felder konfigurieren, damit die Datentabelle die für das Geschäft erforderlichen Informationen speichern kann
- Auf einer Seite [einen Block hinzufügen](../../interface-builder/blocks/index.md#添加区块), damit Benutzer Daten anzeigen, eingeben und bearbeiten können
- Berechtigungen, Workflows und APIs konfigurieren, damit auf die Daten entsprechend den Geschäftsregeln zugegriffen werden kann und sie entsprechend weitergeleitet werden

## Tabellenstrukturtypen

- **Reguläre Tabelle** — Geeignet zum Speichern gewöhnlicher Geschäftsdaten wie Kunden, Bestellungen, Verträge, Arbeitsaufträge, Erstattungsanträge, Projekte und Aufgaben
- **Baumtabelle** — Geeignet zum Speichern hierarchischer Daten wie Organisationsstrukturen, Produktkategorien, geografischen Hierarchien, Abteilungsverzeichnissen und Wissensbasisverzeichnissen
- **Kalendertabelle** — Geeignet zum Speichern von Daten mit Zeiträumen wie Konferenzraumreservierungen, Projektzeitplänen, Kursplänen, Dienstplänen und Veranstaltungskalendern
- **Kommentartabelle** — Geeignet zum Speichern von Diskussionen zu Geschäftsdaten, wie Aufgabenkommentaren, Artikelkommentaren, Genehmigungsanmerkungen und Kundenfeedback; erstellen Sie in einer Geschäftstabelle (reguläre Tabelle, Baumtabelle oder Kalendertabelle) ein [Beziehungsfeld](./collection-fields/associations/index.md) zur Verknüpfung mit der Kommentartabelle und erstellen Sie auf der Popup-Seite der Geschäftstabelle einen [Kommentarblock](../../plugins/@nocobase/plugin-comments/index.md), um die Geschäftsdaten zu kommentieren
- **Dateitabelle** — Geeignet zum Speichern von Dateimetadaten wie Vertragsanhängen, Rechnungsdateien, Produktbildern und Mitarbeiterausweisen. Die Dateien selbst werden von der Dateispeicher-Engine gespeichert; erstellen Sie in einer Geschäftstabelle (reguläre Tabelle, Baumtabelle oder Kalendertabelle) ein [Beziehungsfeld](./collection-fields/associations/index.md) zur Verknüpfung mit der Dateitabelle und konfigurieren Sie beim Erstellen eines Blocks in der Geschäftstabelle das Hochladen von Dateien über das Beziehungsfeld. Die Dateimetadaten werden automatisch in der Dateitabelle gespeichert
- **Datenbankansicht** — Eine bereits in der Datenbank vorhandene View, zum Beispiel eine Ansicht für Finanzberichte, eine gefilterte Kundenansicht oder eine aggregierte Ansicht nach der systemübergreifenden Synchronisierung
- **SQL-Tabelle** — Geeignet, um die Ergebnisse von SQL-Abfragen, etwa Verkaufssummen, Bestandswarnungen, tabellenübergreifende Statistikberichte und Operations-Dashboards, als Datentabelle zu verwenden
- **Vererbungstabelle** — Geeignet, wenn mehrere Arten von Geschäftsobjekten eine Gruppe gemeinsamer Felder verwenden, während jede Art zusätzlich eigene spezifische Felder besitzt, zum Beispiel wenn eine übergeordnete Asset-Tabelle die Asset-Typen Computer, Fahrzeuge und Büromöbel ableitet
