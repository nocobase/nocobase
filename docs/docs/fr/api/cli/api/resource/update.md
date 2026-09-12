---
title: "nb api resource update"
description: "Référence de la commande nb api resource update : mettre à jour un enregistrement pour la ressource NocoBase indiquée."
keywords: "nb api resource update,NocoBase CLI,mettre à jour un enregistrement,CRUD"
---

# nb api resource update

Mettre à jour un enregistrement de la ressource indiquée. Vous pouvez cibler l'enregistrement avec `--filter-by-tk` ou `--filter`, puis passer le contenu mis à jour via `--values`.

## Utilisation

```bash
nb api resource update --resource <resource> --values <json> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--resource` | string | Nom de la ressource, requis |
| `--data-source` | string | Clé de la source de données, par défaut `main` |
| `--source-id` | string | ID de l'enregistrement source pour une ressource d'association |
| `--filter-by-tk` | string | Valeur de la clé primaire ; pour une clé composite ou plusieurs clés, passez un tableau JSON |
| `--filter` | string | Conditions de filtre sous forme d'objet JSON |
| `--values` | string | Données de mise à jour, objet JSON, requis |
| `--whitelist` | string[] | Champs autorisés en écriture, répétable ou tableau JSON |
| `--blacklist` | string[] | Champs interdits en écriture, répétable ou tableau JSON |
| `--update-association-values` | string[] | Champs d'association à mettre à jour également, répétable ou tableau JSON |
| `--force-update` / `--no-force-update` | boolean | Forcer ou non l'écriture des valeurs inchangées |

Les paramètres de connexion communs de [`nb api resource`](./index.md) sont également pris en charge.

## Exemples

```bash
nb api resource update --resource users --filter-by-tk 1 --values '{"nickname":"Grace"}'
nb api resource update --resource posts --filter '{"status":"draft"}' --values '{"status":"published"}'
```

## Commandes connexes

- [`nb api resource get`](./get.md)
- [`nb api resource destroy`](./destroy.md)
