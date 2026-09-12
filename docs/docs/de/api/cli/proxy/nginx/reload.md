---
title: "nb proxy nginx reload"
description: "Die Nginx-Konfiguration mit dem aktuellen Driver neu laden."
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,reload"
---

# nb proxy nginx reload

Lädt die Nginx-Konfiguration mit dem aktuellen Driver neu.

## Verwendung

```bash
nb proxy nginx reload
```

## Beispiele

```bash
nb proxy nginx reload
```

## Hinweise

- Dieser Befehl wird typischerweise verwendet, nachdem du die Konfiguration neu erzeugt hast
- `reload` setzt voraus, dass Nginx bereits läuft; wenn es noch nicht gestartet ist, verwende zuerst `nb proxy nginx start`
- Der lokale Driver lädt das lokale Nginx neu, und der Docker-Driver lädt Nginx im Container neu

## Verwandte Befehle

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
