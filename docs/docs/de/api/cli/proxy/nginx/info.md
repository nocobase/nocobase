---
title: "nb proxy nginx info"
description: "Referenz zum Befehl nb proxy nginx info: aktuellen Nginx-Provider-Driver, Konfigurationspfade und Laufzeitdetails anzeigen."
keywords: "nb proxy nginx info,NocoBase CLI,nginx,Pfade,Konfiguration"
---

# nb proxy nginx info

Zeigt den aktuellen Driver des Nginx-Providers, die Konfigurationspfade und Laufzeitdetails an.

## Verwendung

```bash
nb proxy nginx info
```

## Ausgabe

Die Ausgabe enthält in der Regel diese Felder:

- `driver`
- `configFile`
- `snippetsDir`
- `runtimeRoot`
- `upstreamHost`
- `nginxBinary` oder `container`
- `image`

Dabei gilt:

- beim `local`-Driver enthält die Ausgabe `nginxBinary`
- beim `docker`-Driver enthält die Ausgabe `container` und `image`

## Beispiele

```bash
nb proxy nginx info
```

## Verwandte Befehle

- [`nb proxy nginx current`](./current.md)
- [`nb proxy nginx status`](./status.md)
