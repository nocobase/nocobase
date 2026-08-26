---
title: "nb proxy caddy stop"
description: "Den Caddy-Proxy mit dem aktuellen Driver stoppen."
keywords: "nb proxy caddy stop,NocoBase CLI,caddy,stop"
---

# nb proxy caddy stop

Stoppt den Caddy-Proxy mit dem aktuellen Driver.

## Verwendung

```bash
nb proxy caddy stop
```

## Beispiele

```bash
nb proxy caddy stop
```

## Hinweise

- Mit dem `local`-Driver stoppt der Befehl den lokalen Caddy-Prozess
- Mit dem `docker`-Driver stoppt er den Proxy-Container
- Wenn der Proxy bereits gestoppt ist, meldet der Befehl das entsprechend

## Verwandte Befehle

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy status`](./status.md)
