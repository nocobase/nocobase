---
pkg: '@nocobase/plugin-migration-manager'
title: "Migrationsverwaltung"
description: "Betriebliche Migration: Anwendungskonfiguration zwischen Umgebungen migrieren, mit Regeln für Nur Struktur, Überschreiben und Überspringen. Abhängig von der Backup-Verwaltung."
keywords: "Migrationsverwaltung,Migration,Anwendungskonfiguration,Migrationsregeln,Nur Struktur,Überschreiben,Überspringen,NocoBase"
---

# Migrations-Manager

## Einführung

Er dient dazu, Anwendungskonfigurationen von einer Anwendungsumgebung in eine andere zu übertragen. Der Migrations-Manager konzentriert sich dabei primär auf die Migration von Anwendungskonfigurationen. Benötigen Sie eine vollständige Migration, empfehlen wir Ihnen, die Sicherungs- und Wiederherstellungsfunktionen des „[Backup-Managers](../backup-manager/index.mdx)“ zu nutzen.

## Installation

Der Migrations-Manager ist vom [Backup-Manager](../backup-manager/index.mdx) Plugin abhängig. Bitte stellen Sie sicher, dass dieses Plugin bereits installiert und aktiviert ist.

## Ablauf und Prinzipien

Der Migrations-Manager überträgt Tabellen und Daten aus der Hauptdatenbank, basierend auf festgelegten Migrationsregeln, von einer Anwendungsinstanz in eine andere. Beachten Sie, dass Daten aus externen Datenbanken oder Sub-Anwendungen nicht migriert werden.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Migrationsregeln

### Integrierte Regeln

Die Migrationsverwaltung unterstützt die folgenden drei Regeln:

- **Nur Struktur:** Synchronisiert nur Tabellenstrukturen. Es werden keine Daten eingefügt oder aktualisiert.
- **Überschreiben:** Löscht vorhandene Tabellendatensätze und fügt anschließend neue Daten ein.
- **Überspringen:** Führt für diese Tabelle keine Verarbeitung aus.

**Hinweise:**
- Überschreiben synchronisiert auch Änderungen an der Tabellenstruktur.
- Benutzerdefinierte Geschäftsdaten-Tabellen verwenden in der Regel Nur Struktur, um Produktionsdaten nicht zu überschreiben.

### Detailliertes Design

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Konfigurationsoberfläche

Migrationsregeln konfigurieren

Weitere Informationen zu Tabellen und Standardstrategien: [Integrierte Tabellen von Anwendungen und wichtigen Plugins](./built-in-tables.md).

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Unabhängige Regeln aktivieren

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Unabhängige Regeln und die Tabellen auswählen, die von den aktuellen unabhängigen Regeln verarbeitet werden sollen

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Migrationsdateien

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Eine neue Migration erstellen

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Eine Migration ausführen

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

Überprüfung der Anwendungsumgebungsvariablen (Erfahren Sie mehr über [Umgebungsvariablen](#))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Fehlen welche, wird ein Pop-up-Fenster den Benutzer auffordern, die benötigten neuen Umgebungsvariablen hier einzugeben und dann fortzufahren.

![20250102210009](https://static-docs.nocobase.com/20250102210009.png)

## Migrationsprotokolle

![20250102205738](https://static-docs.nocobase.com/20250102205738.png)

## Rollback

Bevor eine Migration ausgeführt wird, wird die aktuelle Anwendung automatisch gesichert. Schlägt die Migration fehl oder entsprechen die Ergebnisse nicht den Erwartungen, können Sie über den [Backup-Manager](../backup-manager/index.mdx) ein Rollback durchführen und den vorherigen Zustand wiederherstellen.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)