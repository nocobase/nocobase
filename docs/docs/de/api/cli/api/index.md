---
title: "nb api"
description: "Referenz für den Befehl nb api: NocoBase-API über die CLI aufrufen, einschließlich generischer resource-Befehle und dynamischer Befehle."
keywords: "nb api,NocoBase CLI,API,resource,OpenAPI"
---

# nb api

NocoBase-API über die CLI aufrufen. `nb api` enthält die generischen CRUD-Befehle [`nb api resource`](./resource/index.md) sowie Befehle, die dynamisch anhand des OpenAPI-Schemas der aktuellen Anwendung generiert werden.

## Verwendung

```bash
nb api <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb api resource`](./resource/index.md) | Generisches CRUD und Aggregationsabfragen für beliebige NocoBase-Ressourcen ausführen |
| [`nb api Dynamische Befehle`](./dynamic.md) | Topic- und Operation-Befehle, die anhand des OpenAPI-Schemas der Anwendung generiert werden |

## Allgemeine Parameter

Die meisten `nb api`-Befehle unterstützen folgende Verbindungsparameter:

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase-API-Adresse, z. B. `http://localhost:13000/api` |
| `--env`, `-e` | string | Umgebungsname |
| `--token`, `-t` | string | API-key-Override |
| `--role` | string | Rollen-Override, wird als `X-Role`-Header gesendet |
| `--verbose` | boolean | Detaillierten Fortschritt anzeigen |
| `--json-output`, `-j` / `--no-json-output` | boolean | Ob rohes JSON ausgegeben wird, standardmäßig aktiviert |

## Beispiele

```bash
nb api resource list --resource users -e app1
nb api resource get --resource users --filter-by-tk 1 -e app1
nb api resource create --resource users --values '{"nickname":"Ada"}' -e app1
nb api resource list --resource users -e app1 --no-json-output
```

## Verwandte Befehle

- [`nb env update`](../env/update.md)
- [`nb env add`](../env/add.md)
