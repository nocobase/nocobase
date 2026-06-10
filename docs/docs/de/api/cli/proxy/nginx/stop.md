---
title: "nb proxy nginx stop"
description: "Den Nginx-Proxy mit dem aktuellen Driver stoppen."
keywords: "nb proxy nginx stop,NocoBase CLI,nginx,stop"
---

# nb proxy nginx stop

Stoppt den Nginx-Proxy mit dem aktuellen Driver.

## Verwendung

```bash
nb proxy nginx stop
```

## Beispiele

```bash
nb proxy nginx stop
```

## Hinweise

- Mit dem `local`-Driver stoppt der Befehl den lokalen Nginx-Prozess
- Mit dem `docker`-Driver stoppt er den Proxy-Container
- Wenn der Proxy bereits gestoppt ist, meldet der Befehl das entsprechend

## Verwandte Befehle

- [`nb proxy nginx start`](./start.md)
- [`nb proxy nginx status`](./status.md)
