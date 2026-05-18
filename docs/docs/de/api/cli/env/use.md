---
title: "nb env use"
description: "nb env use Befehlsreferenz: Wechselt die aktuelle NocoBase CLI env."
keywords: "nb env use,NocoBase CLI,Umgebung wechseln,current env"
---

# nb env use

Wechselt die aktuelle CLI env. Anschließend verwenden Befehle, bei denen `--env` weggelassen wird, standardmäßig diese env.

Wenn der Sitzungsmodus für die aktuelle Shell oder Runtime aktiviert ist, betrifft diese Änderung nur die aktuelle Sitzung.

Wenn der Sitzungsmodus nicht aktiviert ist, fällt dies auf die Aktualisierung der globalen `last env` zurück. In diesem Fall können auch andere Terminals oder Agent-Runtimes ohne Sitzungsisolierung beeinflusst werden.

## Verwendung

```bash
nb env use <name>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name der konfigurierten Umgebung, zu der gewechselt werden soll |

## Beispiele

```bash
nb env use local
```

## Verwandte Befehle

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
