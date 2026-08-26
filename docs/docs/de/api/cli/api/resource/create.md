---
title: "nb api resource create"
description: "Referenz für den Befehl nb api resource create: Datensatz für eine angegebene NocoBase-Ressource erstellen."
keywords: "nb api resource create,NocoBase CLI,Datensatz erstellen,CRUD"
---

# nb api resource create

Erstellt einen Datensatz der angegebenen Ressource. Der Inhalt des Datensatzes wird über `--values` als JSON-Objekt übergeben.

## Verwendung

```bash
nb api resource create --resource <resource> --values <json> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--source-id` | string | Quell-Datensatz-ID einer assoziierten Ressource |
| `--values` | string | Daten des zu erstellenden Datensatzes als JSON-Objekt, erforderlich |
| `--whitelist` | string[] | Felder, in die geschrieben werden darf; mehrfach übergeben oder als JSON-Array |
| `--blacklist` | string[] | Felder, in die nicht geschrieben werden darf; mehrfach übergeben oder als JSON-Array |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource create --resource posts.comments --source-id 1 --values '{"content":"Hello"}'
```

## Verwandte Befehle

- [`nb api resource update`](./update.md)
- [`nb api resource destroy`](./destroy.md)
