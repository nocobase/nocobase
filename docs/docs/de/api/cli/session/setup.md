---
title: "nb session setup"
description: "nb session setup Befehlsreferenz: Installiert Shell- oder Runtime-Integration für `NB_SESSION_ID`."
keywords: "nb session setup,NocoBase CLI,NB_SESSION_ID,Shell-Integration"
---

# nb session setup

Installiert die Sitzungsintegration für `NB_SESSION_ID`.

Dieser Befehl erkennt die aktuelle Shell oder verwendet die mit `--shell` angegebene Shell und schreibt die passende Initialisierungsdatei, sodass neue Shell-Sitzungen automatisch `NB_SESSION_ID` erhalten.

Wenn eine opencode-Konfiguration erkannt wird, schreibt er zusätzlich die passende Plugin-Integration, damit die Agent-Runtime ihre eigene `NB_SESSION_ID` injizieren kann.

## Verwendung


nb session setup [flags]

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Hinweise

In den meisten Fällen müssen Sie diesen Befehl nur einmal ausführen.

Öffnen Sie danach eine neue Shell-Sitzung oder laden Sie Ihr Profil neu, damit `NB_SESSION_ID` automatisch initialisiert wird.

In Agent-Runtimes wie Codex verwendet die CLI zuerst vorhandene Kontextvariablen wie `CODEX_THREAD_ID`, falls diese bereits gesetzt sind.

## Beispiele


nb session setup
nb session setup --shell zsh
nb session setup --shell powershell

## Verwandte Befehle

- [`nb session id`](./id.md)
- [`nb session remove`](./remove.md)
- [`nb env use`](../env/use.md)
