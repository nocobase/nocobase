---
title: 'nb backup'
description: 'Referenz für den Befehl nb backup: Erstellen Sie ein NocoBase-Backup und laden Sie es lokal herunter, oder stellen Sie eine lokale Backup-Datei in der Ziel-env wieder her.'
keywords: 'nb backup,NocoBase CLI,Backup,Wiederherstellung,nbdata'
---

# nb backup

Erstellt oder stellt ein NocoBase-Backup wieder her. `nb backup create` erstellt ein Remote-Backup in der Ziel-env und lädt die Backup-Datei anschließend lokal herunter; `nb backup restore` lädt eine lokale Backup-Datei in die Ziel-env hoch und wartet, bis die Anwendung wieder bereit ist.

## Verwendung

```bash
nb backup <command>
```

## Unterbefehle

| Befehl                              | Beschreibung                                              |
| ----------------------------------- | --------------------------------------------------------- |
| [`nb backup create`](./create.md)   | Ein Backup erstellen und lokal herunterladen              |
| [`nb backup restore`](./restore.md) | Eine lokale Backup-Datei in der Ziel-env wiederherstellen |

## Beispiele

```bash
nb backup create
nb backup create --env app1 --output ./backups
nb backup create --env app1 --output ./backups/result.nbdata
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

## Hinweise

Vor der Ausführung prüft die CLI zunächst, ob die Ziel-env laufzeitbezogene Befehle für Backups bereitstellt. Wenn Befehle fehlen, wird der Runtime-Cache automatisch einmal aktualisiert; fehlt die Fähigkeit `nb api backup ...` auch nach der Aktualisierung noch, bedeutet das, dass die Ziel-env die Backup-/Restore-Funktion noch nicht aktiviert oder synchronisiert hat. In diesem Fall müssen Sie zuerst die Zielanwendung selbst entsprechend anpassen.

Im Einzelnen:

- `nb backup create` hängt von `nb api backup create`, `nb api backup status` und `nb api backup download` ab
- `nb backup restore` hängt von `nb api backup restore-upload` ab

## Zugehörige Befehle

- [`nb env update`](../env/update.md)
- [`nb app restart`](../app/restart.md)
- [`nb api`](../api/index.md)
