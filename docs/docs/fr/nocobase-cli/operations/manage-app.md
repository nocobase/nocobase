#Gérer les candidatures

Si vous avez enregistré une application NocoBase en tant qu'environnement CLI, la gestion quotidienne est essentiellement effectuée dans le groupe de commandes `nb app` : démarrer, arrêter, redémarrer, afficher les journaux et mettre à niveau.

La plupart du temps, vous n’avez pas besoin de mémoriser tous les paramètres. Indiquez d'abord clairement si ce que vous souhaitez faire est « exécuter l'application », « lire les journaux pour résoudre les problèmes » ou « mettre à niveau vers une nouvelle version », puis sélectionnez la commande correspondante.

Si vous voulez d'abord comprendre pourquoi `nb app` est unifié dans cet ensemble de commandes et sa relation avec `nb app autostart`, lisez d'abord [nb app design intent](../cli-design/nb-app-design-intent.md). Cette page ne retient que les opérations quotidiennes les plus courantes.

## Index rapide

| Je veux... | Quelle commande utiliser |
| --- | --- |
| Démarrer ou reprendre le fonctionnement de l'application | [`nb app start`](../../api/cli/app/start.md) |
| Arrêter temporairement l'application | [`nb app stop`](../../api/cli/app/stop.md) |
| Arrêtez-vous avec la base de données intégrée gérée par CLI | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Redémarrez l'application après avoir modifié la configuration | [`nb app restart`](../../api/cli/app/restart.md) |
| Afficher les journaux des applications en temps réel | [`nb app logs`](../../api/cli/app/logs.md) |
| Mettre à niveau vers une nouvelle version source ou image | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

:::tip confirmez d'abord l'environnement actuel

La commande `nb app` agit par défaut sur l'environnement actuel. Si vous gérez plusieurs environnements en même temps, il est recommandé par défaut de confirmer l'environnement cible avant de démarrer, d'arrêter, de journaliser ou de mettre à niveau les opérations.

Si vous transmettez explicitement un `--env` différent, la CLI demandera généralement une confirmation. Dans les scripts ou les scénarios non interactifs, vous pouvez ajouter `--yes` pour ignorer cette étape. La commutation, l'affichage et la suppression multi-environnements sont introduits dans [Gestion multi-environnements](./multi-environment.md).

:::

## Démarrer l'application

Ouvrez l'application et utilisez `nb app start` par défaut :

```bash
nb app start
```

Si vous souhaitez opérer sur autre chose que l'environnement actuel, vous pouvez le spécifier explicitement :

```bash
nb app start --env app1 --yes
```

Plusieurs autres paramètres de démarrage couramment utilisés :

- `nb app start` Par défaut, les préparations nécessaires à l'installation ou à la mise à niveau seront automatiquement terminées en premier, puis le service sera démarré.

L'environnement npm/Git local démarrera le processus d'application local et Docker env reconstruira le conteneur d'application en fonction de la configuration enregistrée. Pour les paramètres détaillés, voir [`nb app start`](../../api/cli/app/start.md).

## Arrêter et redémarrer

Si vous souhaitez simplement arrêter l'application temporairement, utilisez `nb app stop` :

```bash
nb app stop
```

Si vous venez de modifier la configuration, les dépendances ou le code, il est généralement plus simple d'utiliser directement `nb app restart` :

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` sera d'abord arrêté puis redémarré de la même manière que `start`. Pour une utilisation détaillée, voir [`nb app stop`](../../api/cli/app/stop.md) et [`nb app restart`](../../api/cli/app/restart.md).

## Afficher le journal

Lors du dépannage des problèmes, vous consultez généralement d'abord les journaux :

```bash
nb app logs
```

Si vous souhaitez simplement voir des résultats plus récents ou si vous ne souhaitez pas continuer à suivre le journal, vous pouvez utiliser ceci :

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

L'environnement npm/Git local lit les journaux pm2 et l'environnement Docker lit les journaux du conteneur. Par défaut, `nb app logs` continuera à suivre la nouvelle sortie du journal. Pour les paramètres détaillés, voir [`nb app logs`](../../api/cli/app/logs.md).

## Demande de mise à niveau

La commande de mise à niveau est `nb app upgrade` :

```bash
nb app upgrade
```

Cette commande fait plus que simplement « télécharger la nouvelle version ». Le processus par défaut comprend généralement :

1. Arrêtez l'application en cours
2. Téléchargez et remplacez le code source ou l'image enregistré
3. Synchronisez les plug-ins commerciaux
4. Mettez à niveau et démarrez l'application
5. Actualiser les informations d'exécution de l'environnement

Si vous avez mis à jour le code source ou l'image à l'avance et que vous souhaitez simplement poursuivre la mise à niveau et démarrer l'application en fonction du contenu actuel, vous pouvez ajouter `--skip-download` :

```bash
nb app upgrade --skip-download
```

Si vous souhaitez spécifier explicitement la version cible, vous pouvez également ajouter `--version` :

```bash
nb app upgrade --version beta
```

:::avertissement

`nb app upgrade` Il vous sera également généralement demandé de confirmer une fois avant de commencer réellement. Dans les scripts, CI ou autres scénarios non interactifs, `--force` doit être transmis explicitement. Si vous opérez également sur plusieurs environnements en même temps, vous devez généralement réunir `--yes`.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Pour une description plus complète des paramètres, consultez [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Liens connexes

- [intention de conception d'application nb](../cli-design/nb-app-design-intent.md)
- [Gestion d'environnements multiples](./multi-environment.md)
- [Référence de commande `nb app`](../../api/cli/app/index.md)
