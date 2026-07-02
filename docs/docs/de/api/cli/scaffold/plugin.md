---
title: "nb scaffold plugin"
description: "nb scaffold plugin Befehlsreferenz: Erzeugt ein Gerüst für ein NocoBase Plugin."
keywords: "nb scaffold plugin,NocoBase CLI,Plugin-Gerüst"
---

# nb scaffold plugin

Erzeugt den Gerüstcode für ein NocoBase Plugin.

## Verwendung

```bash
nb scaffold plugin <pkg> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<pkg>` | string | Plugin-Paketname, erforderlich |
| `--cwd`, `-c` | string | Pfad zum Anwendungsstammverzeichnis angeben |
| `--force-recreate`, `-f` | boolean | Erzwingt das erneute Erstellen des Plugin-Gerüsts |

## Beispiele

```bash
nb scaffold plugin @my-project/plugin-hello
nb scaffold plugin @my-project/plugin-hello --cwd /path/to/app
nb scaffold plugin @my-project/plugin-hello --force-recreate
```

## Hinweis

Bei einer von der CLI verwalteten Source-App (erstellt über `nb init`) wird das Plugin im Verzeichnis `<app-path>/plugins/` generiert. `nb` synchronisiert das Plugin automatisch nach `source/packages/plugins/` für den Entwicklungs- und Build-Prozess.

Wenn das Ziel-Plugin bereits existiert, gibt der Befehl standardmäßig einen Fehler aus. Mit `--force-recreate` kann eine Neuerstellung erzwungen werden. Falls auf der Source-Seite ein Verzeichniskonflikt oder ein externer symbolischer Link besteht, muss der Konflikt zuerst manuell entfernt werden.

## Verwandte Befehle

- [`nb scaffold migration`](./migration.md)
- [`nb plugin enable`](../plugin/enable.md)
