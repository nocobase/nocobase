---
title: "nb api resource"
description: "Referenz für den Befehl nb api resource: Generisches CRUD und Aggregationsabfragen für beliebige NocoBase-Ressourcen ausführen."
keywords: "nb api resource,NocoBase CLI,CRUD,Ressource,Datentabelle"
---

# nb api resource

Führt generisches CRUD und Aggregationsabfragen für beliebige NocoBase-Ressourcen aus. Der Ressourcenname kann eine gewöhnliche Ressource sein, z. B. `users`, oder eine assoziierte Ressource, z. B. `posts.comments`.

## Verwendung

```bash
nb api resource <command>
```

## Unterbefehle

| Befehl | Beschreibung |
| --- | --- |
| [`nb api resource list`](./list.md) | Datensätze einer Ressource auflisten |
| [`nb api resource get`](./get.md) | Einen einzelnen Datensatz abrufen |
| [`nb api resource create`](./create.md) | Datensatz erstellen |
| [`nb api resource update`](./update.md) | Datensatz aktualisieren |
| [`nb api resource destroy`](./destroy.md) | Datensatz löschen |
| [`nb api resource query`](./query.md) | Aggregationsabfrage ausführen |

## Allgemeine Parameter

| Parameter | Typ | Beschreibung |
| --- | --- | --- |
| `--api-base-url` | string | NocoBase-API-Adresse, z. B. `http://localhost:13000/api` |
| `--verbose` | boolean | Detaillierten Fortschritt anzeigen |
| `--env`, `-e` | string | Umgebungsname |
| `--role` | string | Rollen-Override, wird als `X-Role`-Header gesendet |
| `--token`, `-t` | string | API-key-Override |
| `--json-output`, `-j` / `--no-json-output` | boolean | Ob rohes JSON ausgegeben wird, standardmäßig aktiviert |
| `--resource` | string | Ressourcenname, erforderlich, z. B. `users`, `orders`, `posts.comments` |
| `--data-source` | string | key der Datenquelle, Standard `main` |

Befehle für assoziierte Ressourcen können zusätzlich mit `--source-id` die Quell-Datensatz-ID angeben.

## Beispiele

```bash
nb api resource list --resource users
nb api resource get --resource users --filter-by-tk 1
nb api resource create --resource users --values '{"nickname":"Ada"}'
nb api resource list --resource posts.comments --source-id 1 --fields id --fields content
```

## Verwandte Befehle

- [`nb api`](../index.md)
- [`nb env update`](../../env/update.md)
