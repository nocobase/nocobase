---
title: "Release-Verwaltung"
description: "Der Release-Verwaltungs-Skill dient zur Ausführung auditierbarer Release-Operationen zwischen mehreren Umgebungen und unterstützt Backup-Wiederherstellung und Migration."
keywords: "KI-Builder,Release-Verwaltung,umgebungsübergreifende Veröffentlichung,Backup-Wiederherstellung,Migration"
---

# Release-Verwaltung

:::tip Voraussetzung

- Bevor Sie diese Seite lesen, installieren Sie NocoBase CLI und schließen Sie die Initialisierung gemäß dem [Schnellstart KI-Builder](./index.md) ab
- Erforderlich ist eine Lizenz der Professional Edition oder höher. Details finden Sie unter [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial)
- Aktivieren Sie die Plugins "Backup-Verwaltung" und "Migrationsverwaltung" und aktualisieren Sie sie auf die neueste Version

:::

## Einführung

Der Release-Verwaltungs-Skill dient zur Ausführung von Release-Operationen zwischen mehreren NocoBase-Umgebungen. Er unterstützt zwei Verfahren: Backup-Wiederherstellung und Migration.

Wenn Sie eine Umgebung nur vollständig mit einer anderen überschreiben möchten, reicht normalerweise die Backup-Wiederherstellung aus. Wenn Sie per Regeln steuern müssen, welche Inhalte synchronisiert werden, etwa nur die Struktur ohne Geschäftsdaten, ist die Migration besser geeignet.

## Funktionsumfang

- Backup-Wiederherstellung in einer Umgebung: stellt die aktuelle Umgebung mit einem vorhandenen Backup-Paket wieder her
- Sofortige Backup-Wiederherstellung in einer Umgebung: erstellt zuerst ein Backup der aktuellen Umgebung und stellt die aktuelle Umgebung dann mit diesem Backup wieder her
- Umgebungsübergreifende Backup-Wiederherstellung: stellt das Backup-Paket der Quellumgebung in der Zielumgebung wieder her
- Umgebungsübergreifende Migration: aktualisiert die Zielumgebung differenziell mit einem Migrationspaket

## Beispiel-Prompts

### Szenario A: Backup-Wiederherstellung in einer Umgebung mit angegebener Datei

:::tip Voraussetzung

In der aktuellen Umgebung muss bereits eine gleichnamige Backup-Datei vorhanden sein.

:::

```text
Mit dem Backup <file-name.nbdata> wiederherstellen
```

Der Skill verwendet die gleichnamige Backup-Datei, die bereits auf dem Server der aktuellen Umgebung vorhanden ist, für die Wiederherstellung.

### Szenario B: Backup-Wiederherstellung in einer Umgebung ohne angegebene Datei

```text
Die aktuelle Umgebung sichern und wiederherstellen
```

Der Skill erstellt zuerst ein Backup der aktuellen Umgebung und stellt die aktuelle Umgebung dann mit diesem Backup wieder her.

### Szenario C: Umgebungsübergreifende Backup-Wiederherstellung

:::tip Voraussetzung

Bereiten Sie zwei Umgebungen vor, zum Beispiel eine lokale dev-Umgebung und eine entfernte test-Umgebung, oder zwei lokale Umgebungen. Sie können eine konkrete Backup-Datei angeben oder keine Datei angeben.

:::

```text
dev nach test wiederherstellen
```

Der Skill erstellt in der dev-Umgebung ein Backup-Paket und stellt dieses Backup-Paket anschließend in der test-Umgebung wieder her.

### Szenario D: Umgebungsübergreifende Migration

:::tip Voraussetzung

Bereiten Sie wie in Szenario C zwei Umgebungen vor. Sie können eine konkrete Migrationsdatei angeben oder keine Datei angeben.

:::

```text
dev nach test migrieren
```

Der Skill erstellt in der dev-Umgebung ein Migrationspaket und verwendet dieses Migrationspaket anschließend, um die test-Umgebung zu aktualisieren.

## Häufige Fragen

**Soll ich Backup-Wiederherstellung oder Migration wählen?**

Standardmäßig reicht die Backup-Wiederherstellung aus, besonders wenn Sie bereits ein verwendbares Backup-Paket haben oder die Zielumgebung vollständig mit dem Zustand der Quellumgebung überschreiben möchten. Verwenden Sie Migration nur, wenn Sie den Synchronisierungsumfang per Regeln steuern müssen, etwa nur die Struktur ohne Daten zu synchronisieren.

**Was bedeutet es, wenn das Migrations-Plugin fehlt?**

Das Plugin "Migrationsverwaltung" erfordert eine Lizenz der Professional Edition oder höher. Details finden Sie unter [NocoBase Commercial Edition](https://www.nocobase.com/cn/commercial).

## Verwandte Links

- [Übersicht KI-Builder](./index.md) — Überblick über alle KI-Builder-Skills und deren Installation
- [Umgebungsverwaltung](./env-bootstrap) — Umgebungsprüfung, Installation, Bereitstellung und Fehlerdiagnose
