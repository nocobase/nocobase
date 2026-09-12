---
title: "nb proxy caddy restart"
description: "Den Caddy-Proxy mit dem aktuellen Driver neu starten."
keywords: "nb proxy caddy restart,NocoBase CLI,caddy,restart"
---

# nb proxy caddy restart

Startet den Caddy-Proxy mit dem aktuellen Driver neu.

## Verwendung

```bash
nb proxy caddy restart
```

## Beispiele

```bash
nb proxy caddy restart
```

## Hinweise

- Dieser Befehl stoppt den Proxy zuerst und startet ihn dann erneut
- Mit `local` oder `docker` arbeitet er auf dem lokalen Prozess oder Docker-Container des aktuellen Drivers

## Verwandte Befehle

- [`nb proxy caddy start`](./start.md)
- [`nb proxy caddy stop`](./stop.md)
- [`nb proxy caddy reload`](./reload.md)
