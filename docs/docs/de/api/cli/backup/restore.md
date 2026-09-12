---
title: 'nb backup restore'
description: 'Referenz für den Befehl nb backup restore: Stellt eine lokale Sicherungsdatei in der Ziel-Env wieder her.'
keywords: 'nb backup restore,NocoBase CLI,Backup wiederherstellen,wiederherstellen,nbdata'
---

# nb backup restore

Stellt eine lokale Sicherungsdatei in der Ziel-Env wieder her. Üblicherweise wird hier eine `*.nbdata`-Datei verwendet. Die Wiederherstellung überschreibt die Daten der Zielanwendung, daher fordert die CLI standardmäßig eine zusätzliche Bestätigung an.

## Verwendung

```bash
nb backup restore --file <path> [flags]
```

## Parameter

| Parameter      | Typ     | Beschreibung                                                                                                                                |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--env`, `-e`  | string  | Name der CLI-Env, in die wiederhergestellt werden soll; wenn weggelassen, wird die aktuelle Env verwendet                                   |
| `--yes`, `-y`  | boolean | Überspringt die interaktive Bestätigung, wenn die mit `--env` explizit angegebene Env von der aktuellen Env abweicht                        |
| `--file`, `-f` | string  | Pfad zur lokalen Sicherungsdatei; erforderlich                                                                                              |
| `--force`      | boolean | Bestätigt das Überschreiben der Anwendungsdaten; in nicht-interaktiven Terminals und AI-agent-Sitzungen muss dies explizit angegeben werden |

## Beispiele

```bash
nb backup restore --file ./backups/base.nbdata --force
nb backup restore --env e2e --file ./backups/base.nbdata --yes --force
```

## Hinweise

Die CLI prüft nur dann, ob `--env` mit der aktuellen Env übereinstimmt, wenn du `--env` explizit angibst. Wenn ausdrücklich eine andere Env angegeben ist, fragt ein interaktives Terminal zunächst nach einer Bestätigung; in nicht-interaktiven Terminals oder AI-agent-Szenarien musst du selbst explizit `--yes` hinzufügen oder zuerst `nb env use <name>` ausführen und es dann erneut versuchen.

Vor der Ausführung prüft die CLI zunächst, ob der von `--file` angegebene Pfad existiert, und bestätigt, dass es sich um eine reguläre Datei handelt. Wenn der Pfad nicht existiert oder auf ein Verzeichnis zeigt, schlägt der Befehl sofort fehl.

Wenn `--force` nicht angegeben wird, zeigt ein interaktives Terminal eine weitere Bestätigung an und weist ausdrücklich darauf hin, dass diese Wiederherstellung die Anwendungsdaten überschreibt. In nicht-interaktiven Terminals und AI-agent-Sitzungen verweigert die CLI die Ausführung direkt, wenn `--force` fehlt, und gibt einen Hinweis zum erneuten Ausführen aus, der direkt kopiert werden kann. Wenn es sich gleichzeitig auch um eine env-übergreifende Operation handelt, müssen in der Regel sowohl `--yes` als auch `--force` angegeben werden.

Nach erfolgreichem Upload wartet die CLI weiter darauf, dass die Zielanwendung `__health_check` erneut besteht. Das heißt, wenn der Befehl erfolgreich zurückkehrt, ist die Anwendung in der Regel bereits wieder in einem zugänglichen Zustand.

## Verwandte Befehle

- [`nb backup create`](./create.md)
- [`nb app restart`](../app/restart.md)
