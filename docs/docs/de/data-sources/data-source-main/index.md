---
title: "Hauptdatenbank"
description: "NocoBase-Hauptdatenbank: Speichert Systemtabellendaten und Geschäftsdaten, unterstützt MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, synchronisiert Tabellenstrukturen aus Datenbanken und erstellt gewöhnliche Tabellen, Baumtabellen, SQL-Tabellen usw."
keywords: "Hauptdatenbank,MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,Datentabellensynchronisierung"
---
# Hauptdatenbank

## Einführung

Die in [NocoBase bereitstellen](/ai/install-nocobase-app) konfigurierte Datenbank dient zum Speichern der Systemtabellendaten von NocoBase und unterstützt außerdem das Speichern von Geschäftsdaten der Benutzer.

Die von der Hauptdatenbank unterstützten Datenbankversionen und Editionen sind wie folgt:

| Datenbank | Unterstützte Version | Community-Edition | Standard-Edition | Professional-Edition | Enterprise-Edition |
| --- | --- | --- | --- | --- | --- |
| MySQL | >= 8.0.17 | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL | >= 10 | ✅ | ✅ | ✅ | ✅ |
| MariaDB | >= 10.9 | ✅ | ✅ | ✅ | ✅ |
| KingbaseES | >=V9 | ❌ | ❌ | ✅ | ✅ |
| OceanBase | >=4.3 | ❌ | ❌ | ❌ | ✅ |

:::tip Hinweis

KingbaseES unterstützt nur den PostgreSQL-Kompatibilitätsmodus, OceanBase nur den MySQL-Kompatibilitätsmodus.

:::

## Plugin-Installation

| Datenbank | Zugehöriges Plugin | Installationsmethode |
| --- | --- | --- |
| MySQL | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| PostgreSQL | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| MariaDB | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Kommerzielle Lizenz erforderlich; das Plugin wird nach der Installation standardmäßig aktiviert. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Kommerzielle Lizenz erforderlich; das Plugin wird nach der Installation standardmäßig aktiviert. |

## Auf die Hauptdatenquelle zugreifen

1. Klicken Sie in den Systemfunktionen auf das Menü „Datenquellen“, um die Startseite der Datenquellen aufzurufen.
2. Wählen Sie in der Liste der Datenquellen die Datenquelle **Main** aus und klicken Sie auf die Aktion **Konfigurieren**, um auf die Hauptdatenbank zuzugreifen und sie zu verwalten.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Verwaltung der Hauptdatenquelle

Die Hauptdatenbank bietet Funktionen zur Verwaltung von Datentabellen. Sie können Datentabellen suchen, erstellen, ändern und löschen sowie die Felder bereits in der Datenbank vorhandener Datentabellen synchronisieren. Außerdem können Sie Felder von Datentabellen erstellen, ändern und löschen.
- **Filtern**: Von der NocoBase-Hauptdatenbank verwaltete Datentabellen suchen
- **Datentabelle erstellen**: Eine neue Geschäftdatentabelle hinzufügen
- **Bearbeiten**: Eine Geschäftdatentabelle ändern
- **Löschen**: Eine Geschäftdatentabelle löschen
- **Aus Datenbank synchronisieren**: Die Struktur bereits in der Datenbank vorhandener Datentabellen synchronisieren
- **Felder konfigurieren**: Felder von Datentabellen erstellen, ändern und löschen
-  **+** : Mit **+** auf der Registerkarte können Datentabellen kategorisiert sowie Kategorien erstellt, geändert und gelöscht werden
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Vorhandene Tabellen aus der Datenbank synchronisieren

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Eine wichtige Funktion der Hauptdatenquelle besteht darin, bereits in der Datenbank vorhandene Tabellen zur Verwaltung in NocoBase zu synchronisieren. Das bedeutet:

- **Vorhandene Investitionen schützen**: Wenn Ihre Datenbank bereits zahlreiche Geschäftstabellen enthält, müssen diese nicht neu erstellt werden, sondern können direkt synchronisiert und verwendet werden
- **Flexible Integration**: Mit anderen Tools (z. B. SQL-Skripten oder Datenbankverwaltungstools) erstellte Tabellen können in die Verwaltung durch NocoBase aufgenommen werden
- **Schrittweise Migration**: Bestehende Systeme können schrittweise zu NocoBase migriert werden, anstatt sie auf einmal neu zu strukturieren

Mit der Funktion „Aus Datenbank laden“ können Sie:
1. Alle Tabellen in der Datenbank durchsuchen
2. Die zu synchronisierenden Tabellen auswählen
3. Tabellenstrukturen und Feldtypen automatisch erkennen
4. Tabellen mit einem Klick in NocoBase importieren und dort verwalten

### Unterstützung verschiedener Tabellentypen

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase unterstützt das Erstellen und Verwalten verschiedener Datentabellentypen:
- **Gewöhnliche Tabelle**: Enthält häufig verwendete integrierte Systemfelder;
- **Vererbungstabelle**: Sie können eine übergeordnete Tabelle erstellen und daraus untergeordnete Tabellen ableiten. Die untergeordneten Tabellen erben die Struktur der übergeordneten Tabelle und können zusätzlich eigene Spalten definieren.
- **Baumtabelle**: Tabelle für Baumstrukturen; derzeit wird nur das Adjazenzlistenmodell unterstützt;
- **Kalendertabelle**: Zum Erstellen von Ereignistabellen für Kalender;
- **Dateitabelle**: Zur Verwaltung der Dateispeicherung;
- **SQL-Tabelle**: Keine tatsächliche Datenbanktabelle, sondern eine strukturierte Darstellung von SQL-Abfragen;
- **Sichttabelle**: Verknüpft vorhandene Datenbanksichten;

### Unterstützung der Kategorisierung von Datentabellen

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Umfangreiche Feldtypen

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible Konvertierung von Feldtypen

NocoBase unterstützt die flexible Konvertierung von Feldtypen innerhalb desselben Datenbanktyps.

**Konvertierungsoptionen für Felder des Typs „String“**

Wenn ein Feld in der Datenbank vom Typ String ist, kann es in NocoBase in eine der folgenden Formen konvertiert werden:

- **Grundtypen**: Einzeiliger Text, mehrzeiliger Text, Telefonnummer, E-Mail-Adresse, URL, Passwort, Farbe, Symbol
- **Auswahlt ypen**: Dropdown-Menü (Einzelauswahl), Optionsfeld
- **Rich-Media-Typen**: Markdown, Markdown (Vditor), Rich-Text, Anhang (URL)
- **Datums- und Zeittypen**: Datum und Uhrzeit (mit Zeitzone), Datum und Uhrzeit (ohne Zeitzone)
- **Erweiterte Typen**: Automatische Codierung, Datentabellenauswahl, Verschlüsselung

Dieser flexible Konvertierungsmechanismus bedeutet:
- **Keine Änderung der Datenbankstruktur erforderlich**: Der zugrunde liegende Speichertyp des Feldes bleibt unverändert; nur seine Darstellung in NocoBase ändert sich
- **Anpassung an geschäftliche Veränderungen**: Je nach Geschäftsanforderungen können Darstellung und Interaktion eines Feldes schnell angepasst werden
- **Datensicherheit**: Der Konvertierungsprozess beeinträchtigt die Integrität vorhandener Daten nicht

### Synchronisierung auf Feldebene

NocoBase kann nicht nur ganze Tabellen synchronisieren, sondern unterstützt auch eine detaillierte Synchronisierungsverwaltung auf Feldebene:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Merkmale der Feldsynchronisierung:

1. **Echtzeitsynchronisierung**: Wenn sich die Struktur einer Datenbanktabelle ändert, können neu hinzugefügte Felder jederzeit synchronisiert werden
2. **Selektive Synchronisierung**: Es können gezielt benötigte Felder statt aller Felder synchronisiert werden
3. **Automatische Typenerkennung**: Datenbankfeldtypen werden automatisch erkannt und den Feldtypen von NocoBase zugeordnet
4. **Datenintegrität bewahren**: Der Synchronisierungsprozess beeinträchtigt vorhandene Daten nicht

#### Anwendungsfälle:

- **Weiterentwicklung der Datenbankstruktur**: Wenn sich Geschäftsanforderungen ändern und neue Felder in der Datenbank hinzugefügt werden müssen, können diese schnell mit NocoBase synchronisiert werden
- **Teamzusammenarbeit**: Wenn andere Teammitglieder oder Datenbankadministratoren Felder in der Datenbank hinzufügen, können diese zeitnah synchronisiert werden
- **Hybrides Verwaltungsmodell**: Einige Felder werden über NocoBase verwaltet, andere auf herkömmliche Weise – für eine flexible Kombination

Dieser flexible Synchronisierungsmechanismus ermöglicht es NocoBase, sich gut in bestehende technische Architekturen einzufügen, ohne die bisherige Datenbankverwaltung ändern zu müssen, und gleichzeitig die Vorteile der Low-Code-Entwicklung von NocoBase zu nutzen.

Weitere Informationen finden Sie im Kapitel „[Felder von Datentabellen / Übersicht](../data-modeling/collection-fields/index.md)“.