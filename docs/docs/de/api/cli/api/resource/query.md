---
title: "nb api resource query"
description: "Referenz für den Befehl nb api resource query: Aggregationsabfrage für eine angegebene NocoBase-Ressource ausführen."
keywords: "nb api resource query,NocoBase CLI,Aggregationsabfrage,Statistik"
---

# nb api resource query

Führt eine Aggregationsabfrage für die angegebene Ressource aus. `--measures`, `--dimensions` und `--orders` verwenden alle das JSON-Array-Format.

## Verwendung

```bash
nb api resource query --resource <resource> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--measures` | string | Definition der Kennzahlen als JSON-Array |
| `--dimensions` | string | Definition der Dimensionen als JSON-Array |
| `--orders` | string | Definition der Sortierung als JSON-Array |
| `--filter` | string | Filterbedingung als JSON-Objekt |
| `--having` | string | Filterbedingung nach der Gruppierung als JSON-Objekt |
| `--limit` | integer | Maximale Anzahl zurückgegebener Zeilen |
| `--offset` | integer | Anzahl der zu überspringenden Zeilen |
| `--timezone` | string | Zeitzone für die Formatierung der Abfrage |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource query --resource orders --measures '[{"field":["id"],"aggregation":"count","alias":"count"}]'
nb api resource query --resource orders --dimensions '[{"field":["status"],"alias":"status"}]' --orders '[{"field":["createdAt"],"order":"desc"}]'
```

## Verwandte Befehle

- [`nb api resource list`](./list.md)
- [`nb api Dynamische Befehle`](../dynamic.md)
