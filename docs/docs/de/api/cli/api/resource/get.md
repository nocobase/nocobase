---
title: "nb api resource get"
description: "Referenz für den Befehl nb api resource get: Einen einzelnen Datensatz einer angegebenen NocoBase-Ressource abrufen."
keywords: "nb api resource get,NocoBase CLI,Datensatz abrufen,Primärschlüssel"
---

# nb api resource get

Ruft einen einzelnen Datensatz der angegebenen Ressource ab. Üblicherweise wird der Primärschlüssel mit `--filter-by-tk` angegeben.

## Verwendung

```bash
nb api resource get --resource <resource> [flags]
```

## Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--resource` | string | Ressourcenname, erforderlich |
| `--data-source` | string | key der Datenquelle, Standard `main` |
| `--source-id` | string | Quell-Datensatz-ID einer assoziierten Ressource |
| `--filter-by-tk` | string | Wert des Primärschlüssels; bei zusammengesetzten oder mehreren keys als JSON-Array |
| `--fields` | string[] | Abzufragende Felder; mehrfach übergeben oder als JSON-Array |
| `--appends` | string[] | Hinzuzufügende Beziehungsfelder; mehrfach übergeben oder als JSON-Array |
| `--except` | string[] | Auszuschließende Felder; mehrfach übergeben oder als JSON-Array |

Zusätzlich werden die allgemeinen Verbindungsparameter von [`nb api resource`](./index.md) unterstützt.

## Beispiele

```bash
nb api resource get --resource users --filter-by-tk 1
nb api resource get --resource posts.comments --source-id 1 --filter-by-tk 2
```

## Verwandte Befehle

- [`nb api resource list`](./list.md)
- [`nb api resource update`](./update.md)
