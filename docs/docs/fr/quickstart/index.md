# Démarrage rapide

Si c'est la première fois que vous utilisez cette CLI, vous n'avez pas besoin de mémoriser toutes les commandes au début. Utilisez `nb init --ui` pour installer d'abord une application, puis continuez à regarder le reste en fonction du scénario.

## Établissez d'abord l'esprit le plus important

Dans NocoBase CLI, les opérations ultérieures ne tournent pas autour de « un certain répertoire » ou « un certain port » par défaut, mais autour de **env**.

Vous pouvez considérer env comme "un ensemble d'informations de connexion d'application et d'exécution mémorisées par la CLI". Tant qu'il a été enregistré avec succès, de nombreuses commandes ultérieures peuvent être utilisées directement :

- Utilisez `nb init` pour installer une nouvelle application et enregistrez-la sous env
- Utilisez `nb env add` pour connecter une application existante à la CLI
- Gérez cet environnement avec `nb app start`, `nb app logs`, `nb app upgrade`
- Sauvegardez et restaurez cet environnement en utilisant `nb backup`
- Utilisez `nb app autostart`, `nb proxy` pour continuer à compléter les capacités de l'environnement de production

Gardez cela à l’esprit d’abord, et les documents suivants seront beaucoup plus fluides.

## Chemin recommandé par défaut

Si vous ne savez pas par où commencer, il est généralement plus simple de suivre ce chemin :

1. Lisez d’abord [Installation à l’aide de CLI (recommandé)](./installation/cli.md) et complétez `nb init` une fois.
2. Une fois l'application enregistrée en tant qu'environnement, consultez [Gestion d'environnements multiples] (./opérations/multi-environment.md) pour confirmer l'environnement actuel, changer d'environnement et vérifier l'état.
3. Pour le démarrage, l'arrêt, la journalisation et la mise à niveau quotidiens, continuez à consulter [Gérer l'application] (./operations/manage-app.md).
4. Avant d'effectuer des mises à niveau, des migrations ou des modifications importantes, consultez [Sauvegarde et restauration](./operations/backup-restore.md).
5. Si vous êtes prêt à vous connecter officiellement, entrez [Présentation du déploiement de l'environnement de production] (./production/index.md).

Les trois premières étapes couvrent la plupart des scénarios d'utilisation.

## Index rapide

| Je veux... | Où chercher |
| --- | --- |
| Il n'y a pas encore d'application, installez d'abord un nouveau NocoBase et enregistrez-le sous CLI env | [Installer à l'aide de CLI (recommandé)](./installation/cli.md) |
| Vous disposez déjà d'un NocoBase en cours d'exécution et souhaitez accéder à la gestion CLI | [Installer à l'aide de CLI (recommandé)](./installation/cli.md) |
| Migrez progressivement les anciennes méthodes d'installation vers CLI | [Migrer des anciennes méthodes d'installation vers CLI](./installation/migration.md) |
| Découvrez quels environnements sont enregistrés localement, changez l'environnement actuel et vérifiez l'état | [Gestion d'environnements multiples](./operations/multi-environment.md) |
| Démarrer, arrêter, redémarrer l'application, afficher les journaux ou poursuivre la mise à niveau | [Gérer l'application](./operations/manage-app.md) |
| Effectuez une sauvegarde avant de mettre à niveau, de migrer ou de modifier par lots des données, puis restaurez-la si nécessaire | [Sauvegarde et restauration](./operations/backup-restore.md) |
| Confirmez d'abord les variables d'environnement clés requises pour exécuter l'application | [Variables d'environnement d'application](./installation/env.md) |
| Installer des plug-ins tiers | [Installation et mise à niveau de plug-ins tiers](./plugins/third-party.md) |
| Laissez l'application entrer dans l'environnement de production : démarrage automatique, accès externe stable, proxy inverse | [Présentation du déploiement de l'environnement de production](./production/index.md) |

## Quand consulter la référence de la commande

Cet ensemble de documents de démarrage rapide est plutôt « qu'est-ce que je veux faire maintenant ». Si vous savez déjà quelle commande vous souhaitez exécuter et que vous souhaitez simplement continuer à voir les paramètres complets, accédez simplement à [NocoBase CLI Command Reference](../api/cli/index.md).

Les suggestions par défaut sont :

- Utilisez d'abord le document de démarrage rapide pour établir une idée du chemin
- Vérifiez ensuite les détails des paramètres sur la page de commande spécifique

Cela rend la prise en main plus facile que la lecture de l'arborescence de commandes complète au premier coup d'œil.
