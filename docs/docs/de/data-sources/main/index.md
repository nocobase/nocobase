---
title: "Primäre Datenbank"
description: "NocoBase-Primärdatenbank: Speichert Systemtabellendaten und Geschäftsdaten, unterstützt MySQL/PostgreSQL/MariaDB/KingbaseES/OceanBase, synchronisiert Tabellenstrukturen aus Datenbanken und ermöglicht das Erstellen von Standardtabellen, Baumtabellen, SQL-Tabellen usw."
keywords: "Primäre Datenbank, MySQL、PostgreSQL、MariaDB、KingbaseES、OceanBase,Tabellensynchronisierung"
---
# Primäre Datenbank

## Einführung

Die in [NocoBase bereitstellen](/ai/install-nocobase-app) konfigurierte Datenbank dient zum Speichern der Systemtabellendaten von NocoBase und unterstützt außerdem die Speicherung von Geschäftstabellendaten.

Die von der Primärdatenbank unterstützten Datenbankversionen und Editionen sind:

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

## Plugininstallation

| Datenbank | Zugehöriges Plugin | Installationsmethode |
| --- | --- | --- |
| MySQL | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| PostgreSQL | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| MariaDB | Keine | Integriertes Plugin, keine separate Installation erforderlich. |
| KingbaseES | `@nocobase/plugin-data-source-kingbase` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation ist das Plugin standardmäßig aktiviert. |
| OceanBase | `@nocobase/plugin-data-source-oceanbase` | Eine kommerzielle Lizenz ist erforderlich. Nach der Installation ist das Plugin standardmäßig aktiviert. |

## Auf die Primärdatenquelle zugreifen

1. Klicken Sie im Bereich „Systemfunktionen“ auf das Menü „Datenquellen“, um die Startseite der Datenquellen aufzurufen.
2. Wählen Sie in der Datenquellenliste die Datenquelle **Main** aus und klicken Sie auf **Konfigurieren**, um auf die Primärdatenbank zuzugreifen und sie zu verwalten.

![configure_main_datasource](https://static-docs.nocobase.com/configure_main_datasource.png)

## Verwaltung der Primärdatenquelle

Die Primärdatenbank bietet Funktionen zur Verwaltung von Datentabellen. Sie können Datentabellen suchen, erstellen, ändern und löschen sowie die Felder bereits in der Datenbank vorhandener Datentabellen synchronisieren. Außerdem können Sie Felder von Datentabellen erstellen, ändern und löschen.
- **Filtern**: Von der NocoBase-Primärdatenbank verwaltete Datentabellen suchen
- **Datentabelle erstellen**: Eine neue Geschäftstabelle hinzufügen
- **Bearbeiten**: Eine Geschäftstabelle ändern
- **Löschen**: Eine Geschäftstabelle löschen
- **Aus Datenbank synchronisieren**: Die Struktur bereits in der Datenbank vorhandener Datentabellen synchronisieren
- **Felder konfigurieren**: Felder von Datentabellen erstellen, ändern und löschen
-  **+**: Mit **+** auf der Registerkarte können Datentabellen kategorisiert sowie Kategorien erstellt, geändert und gelöscht werden.
![main_datasource_management](https://static-docs.nocobase.com/main_datasource_management.png)

### Vorhandene Tabellen aus der Datenbank synchronisieren

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

Eine wichtige Funktion der Primärdatenquelle ist die Möglichkeit, bereits in der Datenbank vorhandene Tabellen zur Verwaltung in NocoBase zu synchronisieren. Das bedeutet:

- **Vorhandene Investitionen schützen**: Wenn Ihre Datenbank bereits viele Geschäftstabellen enthält, müssen Sie diese nicht neu erstellen, sondern können sie direkt synchronisieren und verwenden.
- **Flexible Integration**: Mit anderen Tools wie SQL-Skripten oder Datenbankverwaltungstools erstellte Tabellen können in die Verwaltung durch NocoBase aufgenommen werden.
- **Schrittweise Migration**: Bestehende Systeme können schrittweise zu NocoBase migriert werden, anstatt sie vollständig neu zu strukturieren.

Mit der Funktion „Aus Datenbank laden“ können Sie:
1. alle Tabellen in der Datenbank durchsuchen
2. die zu synchronisierenden Tabellen auswählen
3. Tabellenstrukturen und Feldtypen automatisch erkennen
4. die Tabellen mit einem Klick in NocoBase importieren und dort verwalten

### Unterstützung verschiedener Tabellenstrukturen

![nocobase_doc-2025-10-29-19-47-14](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-47-14.png)

NocoBase unterstützt das Erstellen und Verwalten verschiedener Datentabellentypen:
- **Standardtabelle**: Enthält häufig verwendete Systemfelder.
- **Vererbungstabelle**: Sie können eine übergeordnete Tabelle erstellen und daraus untergeordnete Tabellen ableiten. Die untergeordneten Tabellen übernehmen die Struktur der übergeordneten Tabelle und können zusätzlich eigene Spalten definieren.
- **Baumtabelle**: Tabelle mit Baumstruktur; derzeit wird nur das Adjazenzlistenmodell unterstützt.
- **Kalendertabelle**: Zum Erstellen von Ereignistabellen für Kalender.
- **Dateitabelle**: Zur Verwaltung der Dateispeicherung.
- **SQL-Tabelle**: Keine tatsächliche Datenbanktabelle, sondern eine schnelle, strukturierte Darstellung von SQL-Abfragen.
- **Sichttabelle**: Stellt eine Verbindung zu einer vorhandenen Datenbanksicht her.

### Unterstützung der Kategorisierung von Datentabellen

![20240322231520](https://static-docs.nocobase.com/20240322231520.png)

### Umfangreiche Feldtypen

![nocobase_doc-2025-10-29-19-48-51](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-48-51.png)

#### Flexible Konvertierung von Feldtypen

NocoBase unterstützt die flexible Konvertierung von Feldtypen innerhalb desselben Datenbanktyps.

**Beispiel: Konvertierungsoptionen für Felder des Typs String**

Wenn ein Feld in der Datenbank den Typ String hat, kann es in NocoBase in eine der folgenden Formen konvertiert werden:

- **Grundtypen**: Einzeiliger Text, mehrzeiliger Text, Mobiltelefonnummer, E-Mail-Adresse, URL, Passwort, Farbe, Symbol
- **Auswahltypen**: Dropdown-Menü (Einzelauswahl), Optionsfeld
- **Rich-Media-Typen**: Markdown, Markdown (Vditor), Rich-Text, Anlage (URL)
- **Datums- und Zeittypen**: Datum und Uhrzeit (mit Zeitzone), Datum und Uhrzeit (ohne Zeitzone)
- **Erweiterte Typen**: Automatische Codierung, Datentabellenauswahl, Verschlüsselung

Dieser flexible Konvertierungsmechanismus bedeutet:
- **Keine Änderung der Datenbankstruktur erforderlich**: Der zugrunde liegende Speichertyp des Feldes bleibt unverändert; lediglich seine Darstellung in NocoBase ändert sich.
- **Anpassung an geschäftliche Veränderungen**: Die Darstellung und Interaktion von Feldern kann bei sich ändernden Geschäftsanforderungen schnell angepasst werden.
- **Datensicherheit**: Der Konvertierungsprozess beeinträchtigt die Integrität vorhandener Daten nicht.

### Flexible Synchronisierung auf Feldebene

NocoBase kann nicht nur ganze Tabellen synchronisieren, sondern unterstützt auch eine detaillierte Synchronisierungsverwaltung auf Feldebene:

![nocobase_doc-2025-10-29-19-49-56](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-49-56.png)

#### Merkmale der Feldsynchronisierung:

1. **Echtzeitsynchronisierung**: Wenn sich die Struktur einer Datenbanktabelle ändert, können neu hinzugefügte Felder jederzeit synchronisiert werden.
2. **Selektive Synchronisierung**: Sie können gezielt die benötigten Felder synchronisieren, anstatt alle Felder zu übernehmen.
3. **Automatische Typenerkennung**: Datenbankfeldtypen werden automatisch erkannt und den Feldtypen von NocoBase zugeordnet.
4. **Datenintegrität bewahren**: Der Synchronisierungsprozess beeinträchtigt vorhandene Daten nicht.

#### Anwendungsfälle:

- **Weiterentwicklung der Datenbankstruktur**: Wenn aufgrund geänderter Geschäftsanforderungen neue Felder zur Datenbank hinzugefügt werden müssen, können diese schnell mit NocoBase synchronisiert werden.
- **Teamarbeit**: Wenn andere Teammitglieder oder Datenbankadministratoren Felder in der Datenbank hinzufügen, können diese zeitnah synchronisiert werden.
- **Hybrides Verwaltungsmodell**: Einige Felder werden über NocoBase verwaltet, andere auf herkömmliche Weise – eine flexible Kombination.

Durch diesen flexiblen Synchronisierungsmechanismus lässt sich NocoBase gut in bestehende technische Architekturen integrieren. Die ursprüngliche Methode der Datenbankverwaltung muss nicht geändert werden, während gleichzeitig die Vorteile der Low-Code-Entwicklung von NocoBase genutzt werden können.

Weitere Informationen finden Sie im Kapitel „[Felder von Datentabellen / Übersicht](../data-modeling/collection-fields/index.md)“.