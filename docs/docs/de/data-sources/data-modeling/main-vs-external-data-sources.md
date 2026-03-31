:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Haupt- und externe Datenbanken im Vergleich

Die Unterschiede zwischen Haupt- und externen Datenbanken in NocoBase zeigen sich hauptsächlich in vier Bereichen: der Unterstützung von Datenbanktypen, der Unterstützung von Sammlungstypen, der Unterstützung von Feldtypen sowie den Funktionen für Sicherung und Migration.

## 1. Unterstützung von Datenbanktypen

Weitere Details finden Sie unter: [Datenquellen-Verwaltung](https://docs.nocobase.com/data-sources/data-source-manager)

### Datenbanktypen

| Datenbanktyp | Unterstützung Hauptdatenbank | Unterstützung externe Datenbank |
|-------------|-----------------------------|--------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Sammlungsverwaltung

| Sammlungsverwaltung | Unterstützung Hauptdatenbank | Unterstützung externe Datenbank |
|---------------------|-----------------------------|--------------------------------|
| Grundlegende Verwaltung | ✅ | ✅ |
| Visuelle Verwaltung | ✅ | ❌ |

## 2. Unterstützung von Sammlungstypen

Weitere Details finden Sie unter: [Sammlungen](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Sammlungstyp | Hauptdatenbank | Externe Datenbank | Beschreibung |
|-------------|---------------|-------------------|--------------|
| Standard-Sammlung | ✅ | ✅ | Grundlegende Sammlung |
| Ansichts-Sammlung | ✅ | ✅ | Datenquellen-Ansicht |
| Vererbungs-Sammlung | ✅ | ❌ | Unterstützt Datenmodell-Vererbung, nur von der Hauptdatenquelle unterstützt |
| Datei-Sammlung | ✅ | ❌ | Unterstützt Dateiuploads, nur von der Hauptdatenquelle unterstützt |
| Kommentar-Sammlung | ✅ | ❌ | Integriertes Kommentarsystem, nur von der Hauptdatenquelle unterstützt |
| Kalender-Sammlung | ✅ | ❌ | Sammlung für Kalenderansichten |
| Ausdrucks-Sammlung | ✅ | ❌ | Unterstützt Formelberechnungen |
| Baum-Sammlung | ✅ | ❌ | Für die Datenmodellierung von Baumstrukturen |
| SQL-Sammlung | ✅ | ❌ | Sammlung, die über SQL definiert werden kann |
| Verbindung zu externer Sammlung | ✅ | ❌ | Verbindungs-Sammlung für externe Datenquellen, mit eingeschränkter Funktionalität |

## 3. Unterstützung von Feldtypen

Weitere Details finden Sie unter: [Sammlungsfelder](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Basistypen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Einzeiliger Text | ✅ | ✅ |
| Mehrzeiliger Text | ✅ | ✅ |
| Mobiltelefonnummer | ✅ | ✅ |
| E-Mail | ✅ | ✅ |
| URL | ✅ | ✅ |
| Ganzzahl | ✅ | ✅ |
| Zahl | ✅ | ✅ |
| Prozentsatz | ✅ | ✅ |
| Passwort | ✅ | ✅ |
| Farbe | ✅ | ✅ |
| Symbol | ✅ | ✅ |

### Auswahltypen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Kontrollkästchen | ✅ | ✅ |
| Dropdown (Einzelauswahl) | ✅ | ✅ |
| Dropdown (Mehrfachauswahl) | ✅ | ✅ |
| Optionsfeld | ✅ | ✅ |
| Kontrollkästchen-Gruppe | ✅ | ✅ |
| Chinesische Region | ✅ | ❌ |

### Medientypen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Medien | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Rich Text | ✅ | ✅ |
| Anhang (Beziehung) | ✅ | ❌ |
| Anhang (URL) | ✅ | ✅ |

### Datums- und Zeittypen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Datum und Uhrzeit (mit Zeitzone) | ✅ | ✅ |
| Datum und Uhrzeit (ohne Zeitzone) | ✅ | ✅ |
| Unix-Zeitstempel | ✅ | ✅ |
| Datum (ohne Uhrzeit) | ✅ | ✅ |
| Uhrzeit | ✅ | ✅ |

### Geometrische Typen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Punkt | ✅ | ✅ |
| Linie | ✅ | ✅ |
| Kreis | ✅ | ✅ |
| Polygon | ✅ | ✅ |

### Erweiterte Typen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Sortierung | ✅ | ✅ |
| Berechnungsformel | ✅ | ✅ |
| Automatische Nummerierung | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Sammlungs-Selektor | ✅ | ❌ |
| Verschlüsselung | ✅ | ✅ |

### Systeminformationsfelder

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Erstellungsdatum | ✅ | ✅ |
| Letztes Änderungsdatum | ✅ | ✅ |
| Erstellt von | ✅ | ❌ |
| Zuletzt geändert von | ✅ | ❌ |
| Tabellen-OID | ✅ | ❌ |

### Beziehungstypen

| Feldtyp | Hauptdatenbank | Externe Datenbank |
|---------|---------------|-------------------|
| Eins-zu-eins | ✅ | ✅ |
| Eins-zu-viele | ✅ | ✅ |
| Viele-zu-eins | ✅ | ✅ |
| Viele-zu-viele | ✅ | ✅ |
| Viele-zu-viele (Array) | ✅ | ✅ |

:::info
Anhangsfelder sind von Datei-Sammlungen abhängig. Da Datei-Sammlungen nur von Hauptdatenbanken unterstützt werden, bieten externe Datenbanken derzeit keine Unterstützung für Anhangsfelder.
:::

## 4. Vergleich der Unterstützung für Sicherung und Migration

| Funktion | Hauptdatenbank | Externe Datenbank |
|----------|---------------|-------------------|
| Sicherung & Wiederherstellung | ✅ | ❌ (Manuelle Verwaltung erforderlich) |
| Migrationsverwaltung | ✅ | ❌ (Manuelle Verwaltung erforderlich) |

:::info
NocoBase bietet Funktionen für die Sicherung, Wiederherstellung und Strukturmigration von Hauptdatenbanken. Bei externen Datenbanken müssen diese Vorgänge vom Benutzer eigenständig und entsprechend der jeweiligen Datenbankumgebung durchgeführt werden, da NocoBase hierfür keine integrierte Unterstützung bietet.
:::

## Zusammenfassender Vergleich

| Vergleichspunkt | Hauptdatenbank | Externe Datenbank |
|-----------------|---------------|-------------------|
| Datenbanktypen | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Unterstützung von Sammlungstypen | Alle Sammlungstypen | Unterstützt nur Standard- und Ansichts-Sammlungen |
| Unterstützung von Feldtypen | Alle Feldtypen | Alle Feldtypen außer Anhangsfeldern |
| Sicherung & Migration | Integrierte Unterstützung | Manuelle Verwaltung erforderlich |

## Empfehlungen

- **Wenn Sie NocoBase für den Aufbau eines völlig neuen Geschäftssystems nutzen**, verwenden Sie bitte die **Hauptdatenbank**. So können Sie den vollen Funktionsumfang von NocoBase ausschöpfen.
- **Wenn Sie NocoBase verwenden, um eine Verbindung zu Datenbanken anderer Systeme herzustellen und grundlegende CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen) durchzuführen**, nutzen Sie die **externen Datenbanken**.