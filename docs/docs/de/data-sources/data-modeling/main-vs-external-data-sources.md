---
title: "Vergleich zwischen Haupt- und externen Datenbanken"
description: "Unterschiede zwischen Haupt- und externen Datenbanken: Vergleich der unterstützten Datenbanktypen, Datentabellentypen, Feldtypen sowie der Möglichkeiten für Sicherung, Wiederherstellung und Migration."
keywords: "Hauptdatenbank, externe Datenbank, Datenquellenvergleich, schreibgeschützte Verbindung, Datentabellensynchronisierung, NocoBase"
---

# Vergleich zwischen Haupt- und externen Datenbanken

Die Unterschiede zwischen der Hauptdatenbank und externen Datenbanken in NocoBase zeigen sich hauptsächlich in den folgenden vier Bereichen: Unterstützung von Datenbanktypen, Datentabellentypen und Feldtypen sowie Sicherung, Wiederherstellung und Migration.

## 1. Unterstützung von Datenbanktypen

Weitere Informationen finden Sie unter [Datenquellenverwaltung](https://docs.nocobase.com/data-sources/data-source-manager).

### Datenbanktypen

| Datenbanktyp | Von der Hauptdatenbank unterstützt | Von externen Datenbanken unterstützt |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Datenbanktabellenverwaltung

| Tabellenverwaltung | Von der Hauptdatenbank unterstützt | Von externen Datenbanken unterstützt |
|-----------|-------------|--------------|
| Grundlegende Verwaltung | ✅ | ✅ |
| Visuelle Verwaltung | ✅ | ❌ |

## 2. Unterstützung von Datentabellentypen

Weitere Informationen finden Sie unter [Datentabellen](https://docs.nocobase.com/data-sources/data-modeling/collection).

| Datentabellentyp | Hauptdatenbank | Externe Datenbanken | Beschreibung |
|-----------|---------|-----------|------|
| Normale Tabelle | ✅ | ✅ | Grundlegende Datentabelle |
| View-Tabelle | ✅ | ✅ | View der Datenquelle |
| Vererbungstabelle | ✅ | ❌ | Unterstützt die Vererbung von Datenmodellen; nur von der Hauptdatenquelle unterstützt |
| Dateitabelle | ✅ | ❌ | Unterstützt das Hochladen von Dateien; nur von der Hauptdatenquelle unterstützt |
| Kommentartabelle | ✅ | ❌ | Integriertes Kommentarsystem; nur von der Hauptdatenquelle unterstützt |
| Kalendertabelle | ✅ | ❌ | Datentabelle für Kalenderansichten |
| Ausdruckstabelle | ✅ | ❌ | Unterstützt Formelberechnungen |
| Baumtabelle | ✅ | ❌ | Zur Modellierung hierarchischer Datenstrukturen |
| SQL-Tabelle | ✅ | ❌ | Datentabelle, die per SQL definiert werden kann |
| Verbindung zu einer externen Datentabelle | ✅ | ❌ | Verknüpfte Tabelle einer externen Datenquelle mit eingeschränktem Funktionsumfang |

## 3. Unterstützung von Feldtypen

Weitere Informationen finden Sie unter [Felder von Datentabellen](https://docs.nocobase.com/data-sources/data-modeling/collection-fields).

### Grundlegende Typen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Einzeiliger Text | ✅ | ✅ |
| Mehrzeiliger Text | ✅ | ✅ |
| Mobiltelefonnummer | ✅ | ✅ |
| E-Mail-Adresse | ✅ | ✅ |
| URL | ✅ | ✅ |
| Ganzzahl | ✅ | ✅ |
| Zahl | ✅ | ✅ |
| Prozentsatz | ✅ | ✅ |
| Passwort | ✅ | ✅ |
| Farbe | ✅ | ✅ |
| Symbol | ✅ | ✅ |

### Auswahแลtypen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Kontrollkästchen | ✅ | ✅ |
| Dropdown-Menü (Einzelauswahl) | ✅ | ✅ |
| Dropdown-Menü (Mehrfachauswahl) | ✅ | ✅ |
| Optionsfeld | ✅ | ✅ |
| Kontrollkästchengruppe | ✅ | ✅ |
| Chinesische Verwaltungsregion | ✅ | ❌ |

### Multimedia-Typen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Rich Text | ✅ | ✅ |
| Anhang (Beziehung) | ✅ | ❌ |
| Anhang (URL) | ✅ | ✅ |

### Datums- und Zeittypen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Datum und Uhrzeit (mit Zeitzone) | ✅ | ✅ |
| Datum und Uhrzeit (ohne Zeitzone) | ✅ | ✅ |
| Unix-Zeitstempel | ✅ | ✅ |
| Datum (ohne Uhrzeit) | ✅ | ✅ |
| Uhrzeit | ✅ | ✅ |

### Geometrietypen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Punkt | ✅ | ✅ |
| Linie | ✅ | ✅ |
| Kreis | ✅ | ✅ |
| Polygon | ✅ | ✅ |

### Erweiterte Typen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sortierung | ✅ | ✅ |
| Berechnungsformel | ✅ | ✅ |
| Automatische Codierung | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Datentabellenauswahl | ✅ | ❌ |
| Verschlüsselung | ✅ | ✅ |

### Systeminformationsfelder

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Erstellungsdatum | ✅ | ✅ |
| Datum der letzten Änderung | ✅ | ✅ |
| Ersteller | ✅ | ❌ |
| Zuletzt geändert von | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Beziehungstypen

| Feldtyp | Hauptdatenbank | Externe Datenbanken |
|---------|---------|-----------|
| Eins zu eins | ✅ | ✅ |
| Eins zu viele | ✅ | ✅ |
| Viele zu eins | ✅ | ✅ |
| Viele zu viele | ✅ | ✅ |
| Viele zu viele (Array) | ✅ | ✅ |

:::info
Anhangsfelder sind von Dateitabellen abhängig. Da Dateitabellen nur von der Hauptdatenbank unterstützt werden, werden Anhangsfelder von externen Datenbanken derzeit nicht unterstützt.
:::

## 4. Vergleich der Unterstützung für Sicherung und Migration

| Funktion | Hauptdatenbank | Externe Datenbanken |
|-----|---------|-----------|
| Sicherung und Wiederherstellung | ✅ | ❌ (muss selbst durchgeführt werden) |
| Migrationsverwaltung | ✅ | ❌ (muss selbst durchgeführt werden) |

:::info
NocoBase bietet Funktionen zur Sicherung, Wiederherstellung und Strukt-urmigration der Hauptdatenbank. Bei externen Datenbanken müssen diese Vorgänge vom Benutzer entsprechend der jeweiligen Datenbankumgebung eigenständig durchgeführt werden. NocoBase bietet dafür keine integrierte Unterstützung.
:::

## Zusammenfassender Vergleich

| Vergleichspunkt | Hauptdatenbank | Externe Datenbanken |
|-------|---------|-----------|
| Datenbanktypen | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Unterstützung von Tabellentypen | Alle Tabellentypen | Nur normale Tabellen und View-Tabellen |
| Unterstützung von Feldtypen | Alle Feldtypen | Alle Feldtypen außer Anhangsfeldern |
| Sicherung und Migration | Integrierte Unterstützung | Muss selbst durchgeführt werden |

## Empfehlungen

- **Wenn Sie mit NocoBase ein vollständig neues Geschäftssystem entwickeln**, verwenden Sie bitte die **Hauptdatenbank**. Damit können Sie den vollständigen Funktionsumfang von NocoBase nutzen.
- **Wenn Sie NocoBase verwenden, um die Datenbank eines anderen Systems anzubinden und grundlegende Vorgänge zum Erstellen, Lesen, Aktualisieren und Löschen von Daten durchzuführen**, verwenden Sie eine **externe Datenbank**.