# Sauvegarde et restauration

Si vous avez enregistré une application NocoBase en tant qu'environnement CLI, la sauvegarde et la récupération quotidiennes sont essentiellement effectuées dans le groupe de commandes `nb backup`. `nb backup create` est utilisé pour créer une sauvegarde dans l'environnement cible et la télécharger en local. `nb backup restore` est utilisé pour restaurer le fichier de sauvegarde local dans l'environnement cible.

La plupart du temps, il suffit de retenir les conseils par défaut : sauvegardez avant de mettre à niveau, de migrer ou de modifier des données par lots ; effectuez la récupération uniquement lorsque vous savez clairement que vous souhaitez écraser les données actuelles.

## Index rapide

| Je veux... | Quelle commande utiliser |
| --- | --- |
| Sauvegardez d’abord l’environnement actuel sur local | [`nb backup create`](../../api/cli/backup/create.md) |
| Enregistrez la sauvegarde dans le répertoire spécifié | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Laissez le script continuer à consommer les résultats de la sauvegarde | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Restaurer la sauvegarde locale sur l'environnement actuel | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Restaurer la sauvegarde locale sur un autre environnement | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

:::tip confirmez d'abord l'environnement actuel

La commande `nb backup` agit par défaut sur l'environnement actuel. Si vous gérez plusieurs environnements en même temps, la recommandation par défaut est d'examiner l'environnement actuel avant d'effectuer une sauvegarde ou une restauration.

```bash
nb env current
nb env use app1
```

Si vous transmettez explicitement un `--env` différent, la CLI demandera généralement une confirmation. Dans les scripts ou les scénarios non interactifs, vous pouvez ajouter `--yes` pour ignorer cette étape.

:::

## Créer une sauvegarde

L'utilisation la plus simple consiste à créer directement une sauvegarde :

```bash
nb backup create
```

Une fois la commande renvoyée avec succès, le fichier de sauvegarde a été téléchargé localement. Lorsque `--output` est omis, la CLI enregistre le fichier dans le répertoire de travail actuel et utilise le nom de fichier renvoyé par l'extrémité distante, généralement `backup_*.nbdata`.

Si vous souhaitez placer les sauvegardes dans un seul répertoire, vous pouvez utiliser ceci :

```bash
nb backup create --output ./backups
```

Si `./backups` existe déjà et qu'il s'agit d'un répertoire, la CLI ajoutera automatiquement le nom du fichier de sauvegarde distant au répertoire. Ce n'est que si le chemin n'existe pas que la CLI le traitera comme chemin du fichier cible.

Si vous souhaitez continuer à consommer les résultats de sauvegarde dans des scripts, des CI ou des liens d'agent, vous pouvez ajouter `--json-output` :

```bash
nb backup create --env app1 --yes --json-output
```

Dans ce mode, la CLI ne génère plus de texte de progression, mais renvoie directement le JSON final, qui contient généralement trois champs : `env`, `name` et `output`.

## Restaurer la sauvegarde

La commande de restauration téléchargera le fichier de sauvegarde local sur l'environnement cible et écrasera les données actuelles de l'application :

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Si vous souhaitez restaurer quelque chose d'autre que l'environnement actuel, il est généralement plus sûr d'écrire comme ceci :

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::avertissement

La récupération est une opération de couverture complète. Par défaut, il est recommandé de faire une autre sauvegarde de l'environnement cible actuel avant la restauration.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` vérifiera d'abord si le chemin pointé par `--file` existe et confirmera qu'il s'agit d'un fichier normal. Une fois le téléchargement réussi, la CLI continuera d'attendre que l'application réussisse à nouveau le contrôle de santé. Ainsi, lorsque la commande revient avec succès, l'application a généralement été restaurée dans un état accessible.

Si `--force` n'est pas renseigné, la borne interactive vous demandera à nouveau une confirmation. Dans les terminaux non interactifs, les scripts et les sessions d'agent IA, `--force` est requis.

## Situations courantes

Si vous êtes plus habitué à utiliser l'interface ou si vous avez besoin de fonctionnalités telles que la sauvegarde planifiée et la synchronisation du stockage dans le cloud, vous pouvez directement consulter [Gestion des sauvegardes](../../ops-management/backup-manager/index.mdx). Dans de tels scénarios, l’interface utilisateur Web est souvent plus adaptée.

## Liens connexes

- [Référence de commande `nb backup`](../../api/cli/backup/index.md)
- [Référence de commande `nb env`](../../api/cli/env/index.md)
- [Gestion d'environnements multiples](./multi-environment.md)
- [Gestion des sauvegardes](../../ops-management/backup-manager/index.mdx)
