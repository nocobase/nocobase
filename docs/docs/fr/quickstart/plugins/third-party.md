# Installation et mise à niveau de plug-ins tiers

Si vous obtenez un package de plug-in tiers, importez-le généralement dans le `storage/plugins` de l'application cible, puis redémarrez l'application, puis continuez à activer ou à vérifier si le plug-in prend effet.

## Index rapide

| Je veux... | Où chercher |
| --- | --- |
| Basculez d’abord vers l’environnement cible, puis commencez à importer ou à redémarrer le plug-in | [Confirmez d'abord l'environnement cible](#Confirmez d'abord l'environnement cible) |
| Importez des plug-ins tiers à partir de packages compressés distants, de packages compressés locaux ou de npm | [Utilisez `nb plugin import` pour importer des packages de plug-ins](#Utilisez -nb-plugin-import-Import des packages de plug-ins) |
| Spécifier le plug-in d'importation de stockage | [Spécifiez le chemin de stockage à importer](#Specify-storage-path to import) |
| Une fois l'importation terminée, laissez l'application recharger le répertoire du plug-in | [`nb app restart`](../../api/cli/app/restart.md) |
| Activer officiellement le plug-in après la première installation | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Mettre à niveau un plug-in tiers activé | [Que faire lors de la mise à niveau du plug-in](#Que faire lors de la mise à niveau du plug-in) |
| Vous souhaitez confirmer si le plug-in est apparu dans l'application actuelle | [`nb plugin list`](../../api/cli/plugin/list.md) |
| La machine cible ne peut pas être directement connectée à Internet et ne peut être téléchargée que manuellement `.tgz`, puis importée | [Lorsque Internet ne peut pas être connecté directement](#Lorsque Internet ne peut pas être connecté directement) |

## Confirmez d'abord l'environnement cible

Si vous gérez plusieurs applications localement, passez d'abord à l'environnement cible, puis exécutez :

```bash
nb env use app1
```

## Utilisez `nb plugin import` pour importer le package du plug-in

`nb plugin import` prend en charge trois types de sources : les packages compressés distants, les packages compressés locaux et les noms de packages npm. Cette commande est uniquement responsable de l'importation du plug-in dans `storage/plugins` et n'activera pas automatiquement le plug-in.

Si vous avez obtenu l'adresse de téléchargement du package du plug-in, le chemin du fichier local ou si le plug-in a été publié sur npm, vous pouvez exécuter :

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Si vous utilisez une source NPM privée, connectez-vous généralement d'abord, puis spécifiez le registre :

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Spécifiez le chemin de stockage à importer

Si vous connaissez déjà le répertoire racine `storage` de l'application cible, vous pouvez également transmettre `--storage-path` directement sans vous fier à l'environnement actuel :

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

La CLI écrira le plugin dans `<storage-path>/plugins`. Pour le moment, vous ne pouvez pas exécuter `nb env use` en premier, ni transmettre `--env`.

## Redémarrer après l'importation

Une fois l'importation terminée, redémarrez l'application cible :

```bash
nb app restart
```

Si vous ne changez pas d'abord l'environnement actuel, vous pouvez également transmettre explicitement `-e <env>` dans la commande.

## Activer ou vérifier après le redémarrage

S'il s'agit de la première installation, redémarrez puis activez le plugin :

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

L'installation sera terminée automatiquement lorsqu'elle sera activée pour la première fois.

## Que faire lors de la mise à niveau des plugins

Si le plug-in est déjà activé et que vous passez cette fois-ci à une nouvelle version, il n'y a généralement que deux étapes :

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

La même chose s'applique si vous importez un package npm :

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

En d’autres termes, le scénario de mise à niveau ne nécessite pas d’exécution supplémentaire de `nb plugin enable`. Importez simplement le nouveau package et redémarrez l’application.

## Lorsqu'Internet ne peut pas être connecté directement

Si la machine cible ne peut pas accéder directement à l'adresse de téléchargement du plug-in, vous pouvez d'abord télécharger le fichier `.tgz` dans n'importe quel répertoire de la machine cible, puis effectuer une importation locale sur la machine cible.

Par exemple:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::avertissement

Il n'est pas nécessaire d'extraire manuellement vers `storage/plugins` ici. `nb plugin import` placera automatiquement le plug-in dans le bon répertoire.

:::
