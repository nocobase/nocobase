---
title: "Felder"
description: "Erfahren Sie mehr über die Funktionen von NocoBase-Feldern, ihre Erstellung und Verwaltung, die Einsatzszenarien verschiedener Feldtypen, das Erstellen von Feldern aus der Benutzeroberfläche sowie die Logik der Feldzuordnung für primäre und externe Datenquellen."
keywords: "Felder,Field type,Field interface,Feldzuordnung,Titelfeld,Eindeutigkeitsbedingung,Beziehungsfeld,NocoBase"
---

# Feld

## Einführung

In NocoBase ist **Field (Feld)** eine geschäftliche Eigenschaft in einer [Collection (Datentabelle)](../collection.md), die Daten beschreibt. Es legt fest, welche Informationen in einem Datensatz gespeichert werden können und wie diese Informationen auf der Seite eingegeben, angezeigt und gefiltert werden sowie an Geschäftslogik teilnehmen.

| Definition | Beschreibung |
| --- | --- |
| Welche Daten gespeichert werden | Zum Beispiel Text, Zahlen, Datumsangaben, Dateien, Status, Beziehungen oder JSON. |
| Wie die Seite sie verwendet | Zum Beispiel zur Eingabe und Anzeige über Eingabefelder, Datumsauswahl, Dropdown-Menüs, Uploads von Anhängen oder Beziehungsauswahlfelder. |
| Wie sie an Geschäftsfunktionen teilnehmen | Felder werden von Seitenblöcken, Filtern, Sortierung, Berechtigungen, Workflows, APIs sowie Funktionen zum Import und Export von Daten verwendet. |

Ein Feld kann Folgendem entsprechen:
- Eine tatsächliche Datenbankspalte in der primären Datenbank
- Eine vorhandene Datenbankspalte in einer externen Datenbank
- Ein Feld in einer Datenbankansicht
- Ein Feld in den Ergebnissen einer SQL-Abfrage
- Ein Feld in der Antwort einer REST-API
- Ein Beziehungsfeld, Systemfeld oder virtuelles Feld in einer Datentabelle

Man kann es sich als „eine Eigenschaft eines Geschäftsobjekts“ vorstellen. Zum Beispiel:

| Geschäftsobjekt | Zugehöriges Field |
| --- | --- |
| Kunde | Kundenname, Mobiltelefonnummer, Kundenstufe, Verantwortlicher |
| Bestellung | Bestellnummer, Bestellbetrag, Bestellstatus, Kunde |
| Vertrag | Vertragsname, Vertragsdatum, Vertragsanhang, Genehmigungsstatus |
| Aufgabe | Aufgabentitel, Frist, Priorität, Ausführender |
| Datei | Dateiname, Größe, MIME-Typ, URL |

## Einsatzszenarien

Im Folgenden werden häufige Einsatzszenarien nach Feldkategorien geordnet. Dieser Abschnitt soll Ihnen zunächst dabei helfen, die passende Feldkategorie auszuwählen. Konkrete Konfigurationen, Typzuordnungen und Hinweise finden Sie in der jeweiligen Kategoriedokumentation.

| Feldkategorie | Einsatzszenarien |
| --- | --- |
| [Textfelder](./basic/input.md) | Geeignet zum Speichern von Namen, Nummern, Beschreibungen, Kontaktdaten, Webadressen und ähnlichen Inhalten. |
| [Rich-Text-Felder](./media/rich-text.md) | Geeignet zum Speichern komplexerer Inhalte wie Haupttexten, Dokumentationen, Bearbeitungslösungen oder Codeausschnitten. |
| [Zahlenfelder](./basic/number.md) | Geeignet zum Speichern numerischer Werte wie Mengen, Beträgen, Bewertungen oder Verhältnissen. |
| [Datums- und Zeitfelder](./datetime/index.md) | Geeignet zum Speichern von Zeitpunkten, Datumsangaben, Uhrzeiten, Zeitstempeln externer Systeme und ähnlichen Inhalten. |
| [Status- und Optionsfelder](./choices/select.md) | Geeignet zum Speichern von Werten innerhalb eines festen Bereichs, z. B. ob etwas aktiviert ist, Bestellstatus, Kundenstufe oder Kunden-Tags. |
| [Anhangfelder](./media/field-attachment.md) | Geeignet zum Hochladen von Dateien oder zum Speichern externer Dateiadressen. |
| [Beziehungsfelder](./associations/index.md) | Geeignet zum Darstellen von Verbindungen zwischen verschiedenen Datentabellen, z. B. dass eine Bestellung zu einem Kunden gehört, ein Kunde Bestellungen besitzt oder ein Benutzer mit Rollen verknüpft ist. |
| [Kennungs- und Codierungsfelder](./advanced/uuid.md) | Geeignet zum Speichern interner Primärschlüssel, IDs für die externe Synchronisierung, Kennungen für den öffentlichen Zugriff und Geschäftsnummern. |
| [Geometriefelder](./geometric/point.md) | Geeignet zum Speichern räumlicher oder geografischer Informationen, z. B. Standorte von Filialen, Lieferwege oder Servicebereiche. |
| [Systemfelder](./system-info/created-at.md) | Geeignet zum Speichern von Systeminformationen, die von NocoBase oder der Datenbank verwaltet werden, z. B. ID, Erstellungszeit, Ersteller oder Aktualisierungszeit. |
| [Andere Felder](./advanced/json.md) | Geeignet für Feldanforderungen wie Sortierung, Formeln oder JSON, die nicht direkt in andere Kategorien fallen. |

## Feldtypen der Interface

NocoBase unterteilt Felder aus der Perspektive von Interfaces in die folgenden Kategorien:

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

## Datenfeldtypen

Jedes Field Interface verfügt über einen standardmäßigen Datentyp. Bei einem Feld mit dem Interface „Zahl“ (Number) ist der Datentyp beispielsweise standardmäßig double, kann aber auch float, decimal usw. sein. Derzeit werden folgende Datentypen unterstützt:

![20240512103733](https://static-docs.nocobase.com/20240512103733.png)

## Feldtypzuordnung

Der Ablauf zum Hinzufügen eines neuen Feldes in der primären Datenbank ist:

1. Field-Interface-Typ auswählen
2. Verfügbare Datentypen für das aktuelle Interface konfigurieren

![20240512172416](https://static-docs.nocobase.com/20240512172416.png)

Der Ablauf der Feldzuordnung für externe Datenquellen ist:

1. Anhand des Feldtyps der externen Datenbank automatisch den entsprechenden Datentyp (Field type) und UI-Typ (Field Interface) zuordnen.
2. Je nach Bedarf in einen geeigneteren Datentyp und Interface-Typ ändern

![20240512172759](https://static-docs.nocobase.com/20240512172759.png)