---
pkg: '@nocobase/plugin-migration-manager'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


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

Der Migrations-Manager kann alle Tabellen in der Hauptdatenbank migrieren. Dabei werden derzeit die folgenden fünf Regeln unterstützt:

- **Nur Struktur:** Es wird nur die Struktur (Schema) der Tabellen migriert – es werden keine Daten eingefügt oder aktualisiert.
- **Überschreiben (leeren und neu einfügen):** Alle vorhandenen Datensätze aus der Zieldatenbanktabelle werden gelöscht und anschließend die neuen Daten eingefügt.
- **Einfügen oder Aktualisieren (Upsert):** Es wird geprüft, ob ein Datensatz (anhand des Primärschlüssels) bereits existiert. Falls ja, wird der Datensatz aktualisiert; falls nein, wird er eingefügt.
- **Einfügen ignorieren bei Duplikat:** Neue Datensätze werden eingefügt. Existiert ein Datensatz (anhand des Primärschlüssels) bereits, wird der Einfügevorgang ignoriert (es erfolgen keine Aktualisierungen).
- **Überspringen:** Die Verarbeitung für die Tabelle wird vollständig übersprungen (keine Strukturänderungen, keine Datenmigration).

**Hinweise:**

- Die Regeln „Überschreiben“, „Einfügen oder Aktualisieren“ und „Einfügen ignorieren bei Duplikat“ synchronisieren ebenfalls Änderungen an der Tabellenstruktur.
- Wenn eine Tabelle einen automatisch inkrementierenden Primärschlüssel verwendet oder keinen Primärschlüssel besitzt, können die Regeln `Einfügen oder Aktualisieren` und `Einfügen ignorieren bei Duplikat` nicht angewendet werden.
- Die Regeln `Einfügen oder Aktualisieren` und `Einfügen ignorieren bei Duplikat` nutzen den Primärschlüssel, um festzustellen, ob ein Datensatz bereits existiert.

### Detailliertes Design

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Konfigurationsoberfläche

Migrationsregeln konfigurieren

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