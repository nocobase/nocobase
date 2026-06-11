---
title: "nb api resource update"
description: "Referenz für den Befehl nb api resource update: Datensatz einer angegebenen NocoBase-Ressource aktualisieren."
keywords: "nb api resource update,NocoBase CLI,Datensatz aktualisieren,CRUD"
---

# nb api resource update

Aktualisiert einen Datensatz der angegebenen Ressource. Sie können den Datensatz mit `--filter-by-tk` oder `--filter` lokalisieren und den aktualisierten Inhalt mit `--values` übergeben.

## Verwendung

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--source-id` | string | Quell-Datensatz-ID einer assoziierten Ressource |
| `--filter-by-tk` | string | Wert des Primärschlüssels; bei zusammengesetzten oder mehreren keys als JSON-Array |
| `--filter` | string | Filterbedingung als JSON-Objekt |
| `--values` | string | Daten des zu aktualisierenden Datensatzes als JSON-Objekt, erforderlich |
| `--whitelist` | string[] | Felder, in die geschrieben werden darf; mehrfach übergeben oder als JSON-Array |
| `--blacklist` | string[] | Felder, in die nicht geschrieben werden darf; mehrfach übergeben oder als JSON-Array |
| `--update-association-values` | string[] | Beziehungsfelder, die gleichzeitig aktualisiert werden sollen; mehrfach übergeben oder als JSON-Array |
| `--force-update` / `--no-force-update` | boolean | Ob unveränderte Werte erzwungen geschrieben werden sollen |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Verwandte Befehle

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
