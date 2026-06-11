---
title: "nb proxy caddy reload"
description: "Die Caddy-Konfiguration mit dem aktuellen Driver neu laden."
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,reload"
---

# nb proxy caddy reload

Lädt die Caddy-Konfiguration mit dem aktuellen Driver neu.

## Verwendung

```bash
nb proxy caddy reload
```

## Beispiele

```bash
nb proxy caddy reload
```

## Hinweise

- Dieser Befehl wird typischerweise verwendet, nachdem du die Konfiguration neu erzeugt hast
- `reload` setzt voraus, dass Caddy bereits läuft; wenn es noch nicht gestartet ist, verwende zuerst `nb proxy caddy start`
- Der lokale Driver lädt das lokale Caddy neu, und der Docker-Driver lädt Caddy im Container neu

## Verwandte Befehle

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
