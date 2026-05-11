---
title: "nb session remove"
description: "nb session remove Befehlsreferenz: Entfernt die Shell- oder Runtime-Integration für `NB_SESSION_ID`."
keywords: "nb session remove,NocoBase CLI,NB_SESSION_ID,Sitzungsintegration entfernen"
---

# nb session remove

Entfernt die Sitzungsintegration für `NB_SESSION_ID`.

Dieser Befehl bereinigt die Shell-Konfiguration, die zuvor von [`nb session setup`](./setup.md) geschrieben wurde. Wenn eine opencode-Plugin-Integration erkannt wird, entfernt er auch diese.

## Verwendung


nb session remove [flags]

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| --shell | string | Target shell. Supported values: `bash`, `zsh`, `fish`, `powershell`, `cmd` |

## Beispiele


nb session remove
nb session remove --shell zsh

## Verwandte Befehle

- [`nb session setup`](./setup.md)
- [`nb session id`](./id.md)
