---
title: "nb source build"
description: "nb source build Befehlsreferenz: Baut ein lokales NocoBase Quellcode-Projekt."
keywords: "nb source build,NocoBase CLI,Build,Quellcode"
---

# nb source build

Baut ein lokales NocoBase Quellcode-Projekt. Dieser Befehl leitet die Ausführung an den bisherigen NocoBase Build-Ablauf im Repository-Stammverzeichnis weiter.

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
| `--verbose` | boolean | Ausführliche Befehlsausgabe anzeigen |

## Beispiele

```bash
nb source build
nb source build --no-dts
nb source build --sourcemap
nb source build @nocobase/acl
nb source build @nocobase/acl @nocobase/actions
```

## Verwandte Befehle

- [`nb source dev`](./dev.md)
- [`nb source test`](./test.md)
