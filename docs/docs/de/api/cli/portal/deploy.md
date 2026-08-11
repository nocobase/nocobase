---
title: "nb portal deploy"
description: "Befehlsreferenz für nb portal deploy: baut und deployt den angegebenen Portal-Workspace."
keywords: "nb portal deploy,NocoBase CLI,Portal,Build,Deployment"
---

# nb portal deploy

Buildet und deployt den angegebenen Portal-Workspace. Der Befehl wird normalerweise verwendet, wenn die lokale Entwicklung abgeschlossen ist und das Portal in der Ziel-env aktualisiert werden soll.

Bei der Ausführung werden zuerst `.env` und `.env.local` im Workspace aktualisiert, danach wird `pnpm build` ausgeführt. Das Build-Artefakt muss `dist/client/index.html` enthalten.

## Verwendung

```bash
nb portal deploy <portal> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<portal>` | string | Portal-Name oder slug |
| `--env`, `-e` | string | Name der CLI-env. Wird der Wert ausgelassen, wird die aktuelle env verwendet |
| `--no-install` | boolean | `pnpm install` vor dem Build überspringen |
| `--yes`, `-y` | boolean | Interaktive Bestätigung überspringen, wenn die explizite `--env` von der aktuellen env abweicht |

## Beispiele

Portal in der aktuellen env deployen:

```bash
nb portal deploy customer
```

Portal in einer bestimmten env deployen:

```bash
nb portal deploy customer --env dev --yes
```

Installation der Abhängigkeiten überspringen und nur neu bauen und deployen:

```bash
nb portal deploy customer --no-install
```

## Hinweise

`deploy` richtet sich an bereits vorhandene Portal-Entwicklungsworkspaces. Wenn lokal noch kein Workspace vorhanden ist, erstelle ihn zuerst mit [`nb portal create`](./create.md) oder lade ihn mit [`nb portal pull`](./pull.md) aus dem source storage.

Das Deployment baut das Portal aus dem Entwicklungspfad, der in der CLI-env-Konfiguration gespeichert ist, und synchronisiert die Build-Artefakte in das Deployment-Verzeichnis im Storage der Zielanwendung.

Das Deployment ändert weder source storage noch Git-Konfiguration. Diese Einstellungen werden mit [`nb portal config`](./config.md) in den entfernten Portal-Datensatz geschrieben.

## Verwandte Befehle

- [`nb portal create`](./create.md)
- [`nb portal config`](./config.md)
- [`nb portal pull`](./pull.md)
- [`nb portal push`](./push.md)
