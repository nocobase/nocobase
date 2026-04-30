---
title: "Release-Verwaltung"
description: "Der Release-Verwaltungs-Skill dient der Ausführung auditierbarer Release-Operationen zwischen mehreren Umgebungen."
keywords: "KI-Builder,Release-Verwaltung,umgebungsübergreifende Veröffentlichung,Backup und Wiederherstellung,Migration"
---

# Release-Verwaltung

:::tip Voraussetzung

- Bevor Sie diese Seite lesen, stellen Sie bitte sicher, dass Sie NocoBase CLI gemäß dem [Schnellstart KI-Builder](./index.md) installiert und initialisiert haben.
- Sie benötigen mindestens eine Lizenz der Professional Edition oder höher der [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial).
- Stellen Sie sicher, dass die Plugins „Backup-Verwaltung" und „Migrationsverwaltung" aktiviert und auf die neueste Version aktualisiert sind.

:::

:::warning Hinweis
Die zur Release-Verwaltung gehörige CLI befindet sich noch in der Entwicklung und wird derzeit noch nicht unterstützt.
:::
## Einführung

Der Release-Verwaltungs-Skill dient der Ausführung von Release-Operationen zwischen mehreren Umgebungen – er unterstützt zwei Release-Methoden: Backup-Wiederherstellung und Migration.


## Funktionsumfang

- Backup-Wiederherstellung in einer Umgebung: vollständige Wiederherstellung lokaler Daten anhand eines Backup-Pakets.
- Umgebungsübergreifende Backup-Wiederherstellung: vollständige Wiederherstellung der Daten der Zielumgebung anhand eines Backup-Pakets.
- Umgebungsübergreifende Migration: differenzielle Aktualisierung der Daten der Zielumgebung anhand eines neu erzeugten Migrationspakets.

## Beispiel-Prompts

### Szenario A: Backup-Wiederherstellung in einer Umgebung
:::tip Voraussetzung

In der aktuellen Umgebung muss ein Backup-Paket vorhanden sein, oder Sie sichern zuerst und stellen anschließend wieder her.

:::

Prompt-Modus
```
Stelle mit <file-name> die Sicherung wieder her.
```
CLI-Modus
```
// Verfügbare Backup-Pakete anzeigen; falls keines vorhanden ist, führen Sie nb backup <file-name> aus.
nb backup list 
nb restore <file-name> 
```
![Backup-Wiederherstellung](https://static-docs.nocobase.com/20260417150854.png)

### Szenario B: Umgebungsübergreifende Backup-Wiederherstellung

:::tip Voraussetzung

Sie benötigen zwei Umgebungen, etwa eine lokale Dev-Umgebung und eine Remote-Test-Umgebung, oder zwei lokal installierte Umgebungen.

:::

Prompt-Modus
```
Stelle dev nach test wieder her.
```
CLI-Modus
```
// Verfügbare Backup-Pakete anzeigen; falls keines vorhanden ist, führen Sie nb backup <file-name> --env dev aus.
nb backup list --env dev
// Wiederherstellung mit dem Backup-Paket
nb restore <file-name> --env test
```
![Backup-Wiederherstellung](https://static-docs.nocobase.com/20260417150854.png)

### Szenario C: Umgebungsübergreifende Migration

:::tip Voraussetzung

Wie in Szenario B benötigen Sie zwei Umgebungen, etwa eine lokale Dev-Umgebung und eine Remote-Test-Umgebung, oder zwei lokal installierte Umgebungen.

:::

Prompt-Modus
```
Migriere dev nach test.
```
CLI-Modus
```
// Eine neue Migrationsregel anlegen, dabei wird eine neue ruleId erzeugt; alternativ mit nb migration rule list --env dev historische ruleIds abrufen
nb migration rule add --env dev 
// Migrationspaket über die ruleId erzeugen
nb migration generate <ruleId> --env dev 
// Migration mit dem Migrationspaket durchführen
nb migration run <file-name> --env test
```
![Migrations-Release](https://static-docs.nocobase.com/20260417151022.png)

## Häufige Fragen

**Backup-Wiederherstellung oder Migration – was wählen?**

Wenn Sie bereits ein verwendbares Backup-Paket haben, wählen Sie die Backup-Wiederherstellung. Wenn Sie nach einer Strategie steuern möchten, welche Daten synchronisiert werden (z. B. nur Strukturen, keine Daten), wählen Sie die Migration.

**Was tun, wenn das Migrations-Plugin nicht verfügbar ist?**

Das Plugin „Migrationsverwaltung" erfordert mindestens die Professional Edition. Details siehe [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial).

## Verwandte Links

- [Übersicht KI-Builder](./index.md) – Überblick über alle KI-Builder-Skills und deren Installation
- [Umgebungsverwaltung](./env-bootstrap) – Umgebungsprüfung, Installation, Bereitstellung und Fehlerdiagnose
