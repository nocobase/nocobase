---
title: "nb api resource list"
description: "Referenz für den Befehl nb api resource list: Datensätze einer angegebenen NocoBase-Ressource auflisten."
keywords: "nb api resource list,NocoBase CLI,Listenabfrage,Ressource"
---

# nb api resource list

Listet die Datensätze der angegebenen Ressource auf. Sie können die Abfrage mit Parametern wie `--filter`, `--fields`, `--sort` und `--page` steuern.

## Verwendung

```bash
nb api resource list --resource <resource> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--source-id` | string | Quell-Datensatz-ID einer assoziierten Ressource |
| `--filter` | string | Filterbedingung als JSON-Objekt |
| `--fields` | string[] | Abzufragende Felder; mehrfach übergeben oder als JSON-Array |
| `--appends` | string[] | Hinzuzufügende Beziehungsfelder; mehrfach übergeben oder als JSON-Array |
| `--except` | string[] | Auszuschließende Felder; mehrfach übergeben oder als JSON-Array |
| `--sort` | string[] | Sortierfelder, z. B. `-createdAt`; mehrfach übergeben oder als JSON-Array |
| `--page` | integer | Seitenzahl |
| `--page-size` | integer | Datensätze pro Seite |
| `--paginate` / `--no-paginate` | boolean | Ob die Ergebnisse paginiert werden |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource list --resource users
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
nb api resource list --resource users --filter '{"status":"active"}' --sort=-createdAt
```

## Verwandte Befehle

- [`nb api resource get`](./get.md)
- [`nb api resource query`](./query.md)
