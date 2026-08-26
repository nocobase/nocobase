---
title: "nb source"
description: "nb source Befehlsreferenz: Verwaltet das lokale NocoBase Quellcode-Projekt, einschließlich Download, Entwicklung, Build und Test."
keywords: "nb source,NocoBase CLI,Quellcode,download,dev,build,test"
---

# nb source

Verwaltet das lokale NocoBase Quellcode-Projekt. npm/Git env verwenden ein lokales Quellcode-Verzeichnis; bei Docker env genügt es in der Regel, die Laufzeit über [`nb app`](../app/index.md) zu verwalten.

## Verwendung

```bash
nb source <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb source download`](./download.md) | Bezieht NocoBase von npm, Docker oder Git |
| [`nb source dev`](./dev.md) | Startet den Entwicklungsmodus in einer env mit npm/Git-Quellcode |
| [`nb source build`](./build.md) | Baut das lokale Quellcode-Projekt |
| [`nb source test`](./test.md) | Führt Tests im ausgewählten Anwendungsverzeichnis aus |

## Beispiele

```bash
nb source download --source npm --version alpha
nb source download --source docker --version alpha --docker-platform auto
nb source dev --env app1
nb source build @nocobase/acl
nb source test --server --coverage
```

## Verwandte Befehle

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
