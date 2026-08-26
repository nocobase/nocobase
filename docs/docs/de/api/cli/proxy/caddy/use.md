---
title: "nb proxy caddy use"
description: "Den aktuell verwendeten Driver des Caddy-Providers umschalten."
keywords: "nb proxy caddy use,NocoBase CLI,caddy,driver"
---

# nb proxy caddy use

Schaltet den aktuell verwendeten Driver des Caddy-Providers um.

## Verwendung

```bash
nb proxy caddy use <driver>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<driver>` | string | Unterstützt `local` oder `docker` |

## Beispiele

```bash
nb proxy caddy use local
nb proxy caddy use docker
```

## Hinweise

- Dieser Befehl speichert das Ergebnis in `proxy.caddy-driver`
- Nachfolgende Befehle wie `start`, `reload`, `stop`, `status` und `info` arbeiten alle mit dem aktuellen Driver

## Verwandte Befehle

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy start`](./start.md)
