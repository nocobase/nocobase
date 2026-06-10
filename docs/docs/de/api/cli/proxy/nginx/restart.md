---
title: "nb proxy nginx restart"
description: "Den Nginx-Proxy mit dem aktuellen Driver neu starten."
keywords: "nb proxy nginx restart,NocoBase CLI,nginx,restart"
---

# nb proxy nginx restart

Startet den Nginx-Proxy mit dem aktuellen Driver neu.

## Verwendung

```bash
nb proxy nginx restart
```

## Beispiele

```bash
nb proxy nginx restart
```

## Hinweise

- Dieser Befehl stoppt den Proxy zuerst und startet ihn dann erneut
- Mit `local` oder `docker` arbeitet er auf dem lokalen Prozess oder Docker-Container des aktuellen Drivers

## Verwandte Befehle

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx reload`](./reload.md)
