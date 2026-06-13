---
title: "nb plugin import"
description: "Référence de la commande nb plugin import : importer une archive de plugin empaquetée ou un package npm dans le répertoire storage/plugins de l'env NocoBase sélectionné, ou dans un chemin de storage personnalisé."
keywords: "nb plugin import,NocoBase CLI,importer un plugin,storage-path,npm-registry"
---

# nb plugin import

Importe une archive de plugin empaquetée ou un package npm dans `storage/plugins`. Cette commande place seulement le plugin dans le répertoire cible. Elle ne l'active pas automatiquement.

## Utilisation

```bash
nb plugin import <archive> [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `<archive>` | string | Source du plugin. Obligatoire. Accepte un chemin local `.tgz`, une URL d'archive distante `http(s)` ou un nom / tag de package npm |
| `--env`, `-e` | string | Nom de l'env CLI. Si ce paramètre est omis, l'env courant est généralement utilisé. Si tu passes `--storage-path` explicitement, tu peux omettre `--env` |
| `--yes`, `-y` | boolean | Ignore la confirmation interactive lorsqu'un `--env` passé explicitement cible un env différent de l'env courant |
| `--storage-path` | string | Remplace le chemin racine du storage cible. Le répertoire d'import réel est `<storage-path>/plugins` |
| `--npm-registry` | string | Spécifie le registre npm à utiliser lorsque la source est un nom ou un tag de package npm |

## Exemples

```bash
# Archive distante
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# Archive locale
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# Package npm ou tag
nb plugin import @my-scope/plugin-auth-cas@beta

# Registre npm privé
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com

# Écrire directement dans un chemin de storage local sans dépendre de l'env courant
nb plugin import ./plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

## Notes

Si tu as déjà sélectionné l'env cible, le plus simple est généralement d'importer directement dans le `storage/plugins` de cet env.

Si tu veux seulement écrire le plugin dans un répertoire de storage local, passe `--storage-path`. Dans ce cas, tu peux omettre `--env` et la CLI écrit directement dans `<storage-path>/plugins`.

Après l'import, l'étape suivante consiste généralement à redémarrer l'application, puis à décider si le plugin doit aussi être activé. Dans la plupart des cas :

- Pour une première installation, exécute d'abord [`nb app restart`](../app/restart.md), puis [`nb plugin enable`](./enable.md)
- Si tu as seulement réimporté une version plus récente, redémarre d'abord l'application, puis vérifie que la nouvelle version a bien été chargée

Si la source se trouve dans un registre npm privé, connecte-toi d'abord puis lance l'import :

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

:::warning Remarque

Tu n'as pas besoin d'extraire quoi que ce soit manuellement dans `storage/plugins`. `nb plugin import` place automatiquement le plugin dans le bon répertoire.

:::

## Commandes connexes

- [`nb app restart`](../app/restart.md)
- [`nb plugin enable`](./enable.md)
- [`Installer et mettre à niveau des plugins tiers`](../../../nocobase-cli/plugins/third-party.md)
