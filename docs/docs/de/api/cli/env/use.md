---
title: "nb env use"
description: "nb env use Befehlsreferenz: Wechselt die aktuelle NocoBase CLI env."
keywords: "nb env use,NocoBase CLI,Umgebung wechseln,current env"
---

# nb env use

Wechselt die aktuelle CLI env. Anschließend verwenden Befehle, bei denen `--env` weggelassen wird, standardmäßig diese env.

## Verwendung

```bash
nb env use <name>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<name>` | string | Name einer konfigurierten Umgebung |

## Beispiele

```bash
nb env use local
```

## Verwandte Befehle

- [`nb env list`](./list.md)
- [`nb env info`](./info.md)
