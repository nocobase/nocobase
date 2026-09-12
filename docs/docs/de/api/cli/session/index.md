---
title: "nb session"
description: "nb session Befehlsreferenz: Konfigurieren und prüfen Sie `NB_SESSION_ID`, damit die aktuelle env pro Shell oder Agent-Runtime isoliert wird."
keywords: "nb session,NocoBase CLI,NB_SESSION_ID,Sitzungsmodus"
---

# nb session

Verwaltet den Sitzungsmodus für `NB_SESSION_ID`.

Nach dem Aktivieren des Sitzungsmodus verwenden `nb env use` und `nb env current` zuerst den aktuellen Kontext der Shell oder Agent-Runtime, anstatt direkt eine einzige globale current env zu teilen.

## Verwendung


nb session <command>

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb session setup`](./setup.md) | Installiert die Shell- oder Runtime-Integration für `NB_SESSION_ID` |
| [`nb session id`](./id.md) | Zeigt die aktuell wirksame Sitzungs-ID an |
| [`nb session remove`](./remove.md) | Entfernt die Shell- oder Runtime-Integration für `NB_SESSION_ID` |

## Wann Sie es brauchen

Es wird empfohlen, `nb session setup` einmal auszuführen, wenn Sie die CLI zum ersten Mal verwenden. Danach gilt:

- Terminal 1 kann `env1` verwenden
- Terminal 2 kann gleichzeitig `env2` verwenden
- eine Agent-Runtime kann ebenfalls ihre eigene current env behalten

Ohne Sitzungsmodus teilen verschiedene Sitzungen als Rückfall die globale `last env`, wodurch sich parallele Arbeit leichter gegenseitig beeinflusst.

## Verwandte Befehle

- [`nb env current`](../env/current.md)
- [`nb env use`](../env/use.md)
- [`nb env status`](../env/status.md)
