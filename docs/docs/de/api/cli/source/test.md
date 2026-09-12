---
title: "nb source test"
description: "nb source test Befehlsreferenz: Führt Tests im ausgewählten Anwendungsverzeichnis aus und bereitet automatisch eine integrierte Testdatenbank vor."
keywords: "nb source test,NocoBase CLI,Test,Vitest,Datenbank"
---

# nb source test

Führt Tests im ausgewählten Anwendungsverzeichnis aus. Vor der Testausführung erstellt die CLI eine integrierte Docker-Testdatenbank neu und injiziert die intern verwendeten `DB_*` Umgebungsvariablen.

## Verwendung

```bash
nb source test [paths...] [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `[paths...]` | string[] | An den Test-Runner durchgereichte Testdateipfade oder Globs |
| `--cwd`, `-c` | string | Anwendungsverzeichnis, in dem die Tests ausgeführt werden, Standard ist das aktuelle Verzeichnis |
| `--watch`, `-w` | boolean | Vitest im Watch-Modus ausführen |
| `--run` | boolean | Einmalige Ausführung, kein Wechsel in den Watch-Modus |
| `--allowOnly` | boolean | `.only`-Tests zulassen |
| `--bail` | boolean | Beim ersten Fehlschlag stoppen |
| `--coverage` | boolean | Coverage-Report aktivieren |
| `--single-thread` | string | Single-Thread-Modus an den zugrunde liegenden Test-Runner durchreichen |
| `--server` | boolean | Server-Testmodus erzwingen |
| `--client` | boolean | Client-Testmodus erzwingen |
| `--db-clean`, `-d` | boolean | Datenbank bereinigen, wenn der zugrunde liegende Anwendungsbefehl dies unterstützt |
| `--db-dialect` | string | Typ der integrierten Testdatenbank: `postgres`, `mysql`, `mariadb`, `kingbase` |
| `--db-image` | string | Docker-Image der integrierten Testdatenbank |
| `--db-port` | string | TCP-Port, auf dem die integrierte Testdatenbank zum Host veröffentlicht wird |
| `--db-database` | string | In den Test injizierter Datenbankname |
| `--db-user` | string | In den Test injizierter Datenbankbenutzer |
| `--db-password` | string | In den Test injiziertes Datenbankpasswort |
| `--verbose` | boolean | Ausgabe des zugrunde liegenden Docker- und Test-Runners anzeigen |

## Beispiele

```bash
nb source test
nb source test --cwd /path/to/app
nb source test packages/core/server/src/__tests__/foo.test.ts
nb source test --server --coverage
nb source test --db-port 5433
```

## Verwandte Befehle

- [`nb source build`](./build.md)
- [`nb db ps`](../db/ps.md)
