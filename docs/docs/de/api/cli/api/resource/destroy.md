---
title: "nb api resource destroy"
description: "Referenz für den Befehl nb api resource destroy: Datensatz einer angegebenen NocoBase-Ressource löschen."
keywords: "nb api resource destroy,NocoBase CLI,Datensatz löschen,CRUD"
---

# nb api resource destroy

Löscht einen Datensatz der angegebenen Ressource. Sie können den Datensatz mit `--filter-by-tk` oder `--filter` lokalisieren.

## Verwendung

```bash
nb api resource destroy --resource <resource> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--source-id` | string | Quell-Datensatz-ID einer assoziierten Ressource |
| `--filter-by-tk` | string | Wert des Primärschlüssels; bei zusammengesetzten oder mehreren keys als JSON-Array |
| `--filter` | string | Filterbedingung als JSON-Objekt |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource destroy --resource users --filter-by-tk 1
nb api resource destroy --resource posts --filter '{"status":"archived"}'
```

## Verwandte Befehle

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
