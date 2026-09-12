---
title: "nb source download"
description: "Référence de la commande nb source download : récupérer les sources ou l'image NocoBase depuis npm, Docker ou Git."
keywords: "nb source download,NocoBase CLI,télécharger,npm,Docker,Git"
---

# nb source download

Récupérer NocoBase depuis npm, Docker ou Git. `--version` est un paramètre commun aux trois sources : il s'agit de la version du package pour npm, du tag d'image pour Docker et du ref pour Git.

## Utilisation

```bash
nb source download [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--yes`, `-y` | boolean | Utiliser les valeurs par défaut et ignorer les invites interactives |
| `--verbose` | boolean | Afficher la sortie détaillée des commandes |
| `--locale` | string | Langue des messages CLI : `en-US` ou `zh-CN` |
| `--source`, `-s` | string | Mode d'obtention : `docker`, `npm` ou `git` |
| `--version`, `-v` | string | Version du package npm, tag d'image Docker ou ref Git |
| `--replace`, `-r` | boolean | Remplacer le répertoire cible s'il existe déjà |
| `--dev-dependencies`, `-D` / `--no-dev-dependencies` | boolean | Installer ou non les devDependencies lors d'une installation npm/Git |
| `--output-dir`, `-o` | string | Répertoire de destination du téléchargement, ou répertoire où enregistrer le tarball Docker |
| `--git-url` | string | URL du dépôt Git |
| `--docker-registry` | string | Nom du registry d'image Docker, sans le tag |
| `--docker-platform` | string | Plateforme de l'image Docker : `auto`, `linux/amd64`, `linux/arm64` |
| `--docker-save` / `--no-docker-save` | boolean | Enregistrer ou non l'image Docker comme tarball après récupération |
| `--npm-registry` | string | Registry npm utilisé pour les téléchargements et l'installation des dépendances npm/Git |
| `--build` / `--no-build` | boolean | Lancer la build après l'installation des dépendances npm/Git |
| `--build-dts` | boolean | Générer les fichiers de déclaration TypeScript lors de la build npm/Git |
| `--hook-script` | string | Module hook à exécuter après npm scaffold ou Git clone et avant l’installation des dépendances ; ne s’applique qu’aux sources npm/Git |

## Exemples

```bash
nb source download
nb source download -y --source npm --version alpha
nb source download -y --source npm --version alpha --no-build
nb source download --source npm --version alpha --output-dir=./app
nb source download --source docker --version alpha --docker-registry=nocobase/nocobase --docker-platform=linux/arm64
nb source download -y --source docker --version alpha --docker-save -o ./docker-images
nb source download --source git --version alpha --git-url=git@github.com:nocobase/nocobase.git
nb source download --source git --version fix/cli-v2
nb source download -y --source npm --version alpha --build-dts
nb source download -y --source npm --version alpha --npm-registry=https://registry.npmmirror.com
nb source download -y --source git --version beta --hook-script ./hooks.mjs
```

## Hook avant installation

`--hook-script` n’affecte que l’exécution actuelle de `nb source download`. Si vous souhaitez que le hook soit enregistré avec l’env et réutilisé par `nb app upgrade` ou par une restauration locale de source, passez-le plutôt via [`nb init --hook-script`](../init.md).

Le fichier hook doit exporter par défaut un objet et implémenter `beforeDependencyInstall(context)` :

```js
export default {
  beforeDependencyInstall: async ({ sourcePath, version, envConfig }) => {
    // S’exécute après git clone / npm scaffold et avant yarn install.
  },
};
```

Lorsque vous exécutez directement `nb source download --hook-script`, `beforeDependencyInstall` reçoit `context.phase` avec `source-download` et `context.command` avec `source:download`. Cette commande n’exécute pas `beforeAppInstall` ni `afterAppStart` ; ces hooks appartiennent aux flux d’installation, de start, de restart et d’upgrade de l’app.


## Alias de version

Avec la source Git, les dist-tags courants sont résolus en branches : `latest` → `main`, `beta` → `next`, `alpha` → `develop`.

## Commandes connexes

- [`nb init`](../init.md)
- [`nb app upgrade`](../app/upgrade.md)
