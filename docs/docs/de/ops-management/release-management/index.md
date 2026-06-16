---
title: "Release-Management"
description: "Best Practices für das Release im Betrieb: Versionierung, Multi-App, Backup-Verwaltung und Migrationsverwaltung für Entwicklung, Staging und Produktion."
keywords: "Release-Management,Release,Versionsverwaltung,Multi-App,Backup-Verwaltung,Migrationsverwaltung,NocoBase"
---

# Release-Management

## Einführung

Release-Management beschreibt einen wiederholbaren, prüfbaren und wiederherstellbaren Weg von Entwicklung nach Produktion. Änderungen werden zuerst in der Entwicklungsumgebung abgeschlossen, danach in Staging geprüft und erst anschließend in Produktion veröffentlicht. Migrationsdateien, Backups, Ausführungsprotokolle und Prüfergebnisse sollten für Fehleranalyse und Rollback aufbewahrt werden.

~~~text
Entwicklungsumgebung -> Staging-Umgebung -> Produktionsumgebung
~~~

## Release-Modell

| Fähigkeit | Zweck | Phase |
| --- | --- | --- |
| Versionsverwaltung | Entwicklungsstände und Rücksprungpunkte sichern | Entwicklung |
| Variablen und Secrets | Umgebungsspezifische Werte und sensible Daten trennen | Alle Umgebungen |
| Multi-App | Geschäftsgrenzen und Release-Auswirkungen kontrollieren | Architektur und Teamarbeit |
| Backup-Verwaltung | Wiederherstellbaren Produktionszustand sichern | Vor Release und Betrieb |
| Migrationsverwaltung | Konfiguration und Struktur in Zielumgebungen veröffentlichen | Staging und Produktion |

## Umgebungskonfiguration: Variablen und Secrets

Datenbankverbindungen, Drittanbieter-URLs, Testkonten, Tokens, API Keys und Webhooks sollten nicht fest in Seiten, Workflows oder Plugin-Konfigurationen stehen. Verwenden Sie Variablen und Secrets pro Umgebung. Beim Migrieren werden nur fehlende Werte der Zielumgebung ergänzt.

Verwandte Dokumentation: [Variablen und Secrets](../variables-and-secrets/index.md).

## Entwicklung: Wiederherstellbare Punkte festhalten

Nutzen Sie Versionsverwaltung für größere Anpassungen an Datenmodellen, Seiten, Berechtigungen, Workflows und Plugins. Beschreibungen sollten den fachlichen Zweck nennen. Für die Veröffentlichung selbst verwenden Sie die Migrationsverwaltung; für Produktionswiederherstellung die Backup-Verwaltung.

Verwandte Dokumentation: [Versionsverwaltung](../version-control/index.md).

## Modulaufteilung: Release-Grenzen kontrollieren

Kleine Systeme können mit einer Anwendung starten. Bei wachsender Komplexität sollten CRM, Tickets, Assets, HR, Reporting oder Operations-Backend als getrennte Anwendungen geplant werden. Klären Sie vorher Benutzer, Organisation, Authentifizierung, Berechtigungen und gemeinsam genutzte Daten.

~~~text
CRM-App: Entwicklung -> Staging -> Produktion
Ticket-App: Entwicklung -> Staging -> Produktion
Asset-App: Entwicklung -> Staging -> Produktion
~~~

Verwandte Dokumentation: [Multi-App-Verwaltung](../../multi-app/multi-app/index.md).

## Vorbereitung: Wiederherstellung prüfen

Erstellen Sie vor Produktionsreleases ein Backup. Wichtige Releases sollten die Wiederherstellung in einer unabhängigen Umgebung testen. Das Backup muss Datenbank, Uploads und benötigte Speicherinhalte abdecken.

Verwandte Dokumentation: [Backup-Verwaltung](../backup-manager/index.mdx).

## Release-Ausführung: In die Zielumgebung migrieren

Veröffentlichen Sie zuerst nach Staging. Ist die Prüfung erfolgreich, verwenden Sie dieselbe Migrationsdatei für Produktion. Staging sollte Core-Version, Plugins, Variablen, Secrets, Berechtigungen und externe Verbindungen möglichst wie Produktion abbilden.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

### Produktion

Planen Sie ein Wartungsfenster, informieren Sie Benutzer und stoppen Sie Zugriffe oder schalten Sie eine Wartungsseite. Bei Multi-Node-Betrieb skalieren Sie vor der Migration auf einen Knoten. Nach der Migration prüfen Sie Kernprozesse und stellen den Zugriff wieder her.

### Migrationsregeln

Übliche Strategien sind Überschreiben, Nur Struktur und Überspringen. Integrierte Anwendungs- und Plugin-Tabellen folgen meist der Standardstrategie. Benutzerdefinierte Tabellen mit echten Geschäftsdaten sollten in der Regel nur die Struktur migrieren. Metadaten-Tabellen können je nach Szenario überschrieben werden.

Weitere Informationen: [Integrierte Tabellen von Anwendungen und wichtigen Plugins](../migration-manager/built-in-tables.md).

Verwandte Dokumentation: [Migrationsverwaltung](../migration-manager/index.md).

## Rollback und Wiederherstellung

Bei Fehlern verwenden Sie zuerst das Backup vor dem Release. Wenn die aktuelle Umgebung noch stabil genug ist, kann dort wiederhergestellt werden. Andernfalls stellen Sie in einer unabhängigen Umgebung wieder her, prüfen Kernprozesse und schalten den Traffic um.

## Verwandte Dokumentation

- [Variablen und Secrets](../variables-and-secrets/index.md)
- [Versionsverwaltung](../version-control/index.md)
- [Multi-App-Verwaltung](../../multi-app/multi-app/index.md)
- [Backup-Verwaltung](../backup-manager/index.mdx)
- [Migrationsverwaltung](../migration-manager/index.md)
