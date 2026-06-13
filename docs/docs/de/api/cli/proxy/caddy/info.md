---
title: "nb proxy caddy info"
description: "Referenz zum Befehl nb proxy caddy info: aktuellen Caddy-Provider-Driver, Konfigurationspfade und Laufzeitdetails anzeigen."
keywords: "nb proxy caddy info,NocoBase CLI,caddy,Pfade,Konfiguration"
---

# nb proxy caddy info

Zeigt den aktuellen Driver des Caddy-Providers, die Konfigurationspfade und Laufzeitdetails an.

## Verwendung

```bash
nb proxy caddy info
```

## Ausgabe

Die Ausgabe enthält in der Regel diese Felder:

- `driver`
- `configFile`
- `runtimeRoot`
- `upstreamHost`
- `caddyBinary` oder `container`
- `image`

Dabei gilt:

- beim `local`-Driver enthält die Ausgabe `caddyBinary`
- beim `docker`-Driver enthält die Ausgabe `container` und `image`

## Beispiele

```bash
nb proxy caddy info
```

## Verwandte Befehle

- [`nb proxy caddy current`](./current.md)
- [`nb proxy caddy status`](./status.md)
