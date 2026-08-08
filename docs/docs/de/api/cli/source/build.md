---
title: "nb source build"
description: "nb source build Befehlsreferenz: Baut ein lokales NocoBase Quellcode-Projekt."
keywords: "nb source build,NocoBase CLI,Build,Quellcode"
---

# nb source build

Baut ein lokales NocoBase Quellcode-Projekt. Der Befehl muss im Quellcodeverzeichnis (`<app-path>/source/`) ausgeführt werden. Bei einer von der CLI verwalteten Source-App werden Plugins aus dem Verzeichnis `plugins/` vor dem Build automatisch nach `source/packages/plugins/` synchronisiert.

## Verwendung

```bash
nb source build [packages...] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[packages...]` | string[] | Zu bauende Paketnamen. Wird der Wert weggelassen, werden alle Pakete gebaut |
| `--cwd`, `-c` | string | Arbeitsverzeichnis |
| `--no-dts` | boolean | Keine `.d.ts` Deklarationsdateien erzeugen |
| `--sourcemap` | boolean | Sourcemap erzeugen |
| `--tar` | boolean | Nach dem Build automatisch als `.tgz`-Datei paketieren |
| `--verbose` | boolean | Ausführliche Befehlsausgabe anzeigen |

## Beispiele

```bash
nb source build
nb source build @my-project/plugin-hello
nb source build @my-project/plugin-hello --tar
nb source build --no-dts
nb source build --sourcemap
```

## Hinweis

Bei Verwendung von `--tar` wird das angegebene Plugin nach dem Build als `.tgz`-Datei paketiert und im Verzeichnis `source/storage/tar/` ausgegeben. Nach Abschluss gibt der Befehl den vollständigen Pfad zum Tarball aus.

## Verwandte Befehle

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
