---
title: "nb proxy nginx use"
description: "Den aktuell verwendeten Driver des Nginx-Providers umschalten."
keywords: "nb proxy nginx use,NocoBase CLI,nginx,driver"
---

# nb proxy nginx use

Schaltet den aktuell verwendeten Driver des Nginx-Providers um.

## Verwendung

```bash
nb proxy nginx use <driver>
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `<driver>` | string | Unterstützt `local` oder `docker` |

## Beispiele

```bash
nb proxy nginx use local
nb proxy nginx use docker
```

## Hinweise

- Dieser Befehl speichert das Ergebnis in `proxy.nginx-driver`
- Nachfolgende Befehle wie `start`, `reload`, `stop`, `status` und `info` arbeiten alle mit dem aktuellen Driver

## Verwandte Befehle

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx start`](./start.md)
