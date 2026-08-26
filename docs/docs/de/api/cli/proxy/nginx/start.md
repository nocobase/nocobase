---
title: "nb proxy nginx start"
description: "Den Nginx-Proxy mit dem aktuellen Driver starten."
keywords: "nb proxy nginx start,NocoBase CLI,nginx,start"
---

# nb proxy nginx start

Startet den Nginx-Proxy mit dem aktuellen Driver.

## Verwendung

```bash
nb proxy nginx start
```

## Beispiele

```bash
nb proxy nginx start
```

## Hinweise

- Mit dem `local`-Driver startet der Befehl den lokalen Nginx-Prozess
- Mit dem `docker`-Driver startet oder erstellt er den Docker-Container
- Wenn der Proxy bereits läuft, meldet der Befehl das entsprechend

## Verwandte Befehle

- [`nb proxy nginx stop`](./stop.md)
- [`nb proxy nginx status`](./status.md)
