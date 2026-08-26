---
title: "L'application démarre automatiquement"
description: "Utilisez nb app autostart pour configurer une entrée de démarrage automatique d’application unifiée pour l’environnement NocoBase hébergé par CLI."
keywords: "NocoBase, démarrage automatique de l'application, démarrage automatique de l'application nb, systemd, Docker, PM2"
---


# L'application démarre automatiquement

Dans NocoBase CLI, `nb app autostart` est utilisé pour gérer « quels environnements sont autorisés à démarrer automatiquement » et « comment extraire ces environnements uniformément après le démarrage du système ».

Si vous envisagez d'exécuter officiellement une application hébergée par CLI sur le serveur, il s'agit généralement de l'étape par défaut dans un environnement de production.

## Pourquoi `nb app autostart` est-il toujours nécessaire ?

Ce problème est très courant.

Lorsque de nombreuses personnes verront cela pour la première fois, elles penseront que puisque la couche inférieure a déjà Docker, PM2 ou que le système lui-même a déjà `systemd`, pourquoi avons-nous besoin d'une autre couche de `nb app autostart`.

La raison est que ces couches ne résolvent pas réellement le même problème :

- Des fonctionnalités telles que Docker, PM2 et Supervisor résolvent le problème de « la façon dont les applications s'exécutent habituellement et comment gérer les processus d'application ».
- Des fonctionnalités telles que `systemd`, `launchd` et les scripts de démarrage de l'hôte résolvent le problème de « quelle commande exécuter au démarrage du système ? »
- `nb app autostart` résout le problème "au niveau NocoBase CLI, comment gérer uniformément quels environnements sont autorisés à démarrer automatiquement et comment les extraire après le démarrage du système"

En d’autres termes, CLI n’élimine pas le besoin de Docker, PM2 ou Supervisor. Au lieu de cela, il adapte différentes méthodes de gestion des processus de manière unifiée, puis les fait converger vers un ensemble stable de portails de gestion à démarrage automatique pour réduire la maladie mentale de l'utilisateur.

Lorsque le système démarre cette couche, elle continue d'être transmise à `systemd`, `launchd` ou au script de démarrage de l'hôte. Ils sont chargés d'exécuter au démarrage de la machine :

```bash
nb app autostart run
```

Cette commande extraira ensuite toutes les applications dont le démarrage automatique est activé.

Sans cette couche, une fois que la méthode de fonctionnement sous-jacente est différente, vous devez vous souvenir des processus respectifs de configuration et de récupération à démarrage automatique de Docker, PM2 ou d'autres méthodes. Après avoir ajouté `nb app autostart`, il vous suffit de continuer à vous souvenir du même ensemble d'habitudes d'utilisation de NocoBase CLI.

Si vous voulez d'abord comprendre pourquoi cette conception est décomposée de cette manière, continuez à lire [nb app design intent](../cli-design/nb-app-design-intent.md#Pourquoi-nb-app-autostart est-il toujours nécessaire).

## Quelles sont les responsabilités de ce groupe de commandes ?

Les plus couramment utilisés sont les suivants :

- `nb app autostart enable`
- `nb app autostart disable`
- `nb app autostart list`
- `nb app autostart run`

Si vous ne regardez que les deux niveaux de responsabilités les plus courants, vous pouvez le comprendre ainsi :

- `enable` / `disable` sont chargés de gérer si un certain environnement autorise le démarrage automatique
- `run` est responsable de l'extraction de tous les environnements pour lesquels le démarrage automatique est activé pendant la phase de démarrage du système.

Activez d'abord l'indicateur de démarrage automatique pour l'environnement actuel :

```bash
nb app autostart enable
```

Si vous souhaitez opérer sur autre chose que l'environnement actuel, vous pouvez le spécifier explicitement :

```bash
nb app autostart enable --env app1 --yes
```

Après l'avoir activé, vous pouvez vérifier quels environnements ont été marqués comme à démarrage automatique :

```bash
nb app autostart list
```

Une fois le système démarré, vous devez exécuter la commande suivante pour extraire tous les environnements pour lesquels le démarrage automatique est activé :

```bash
nb app autostart run
```

Si vous souhaitez voir le résultat de démarrage sous-jacent lors du dépannage, vous pouvez ajouter :

```bash
nb app autostart run --verbose
```

Si vous ne souhaitez plus qu'un environnement soit démarré avec le système, vous pouvez également annuler cette marque :

```bash
nb app autostart disable --env app1 --yes
```

## Quelle est sa relation avec Docker, PM2 et systemd ?

Il y a ici une frontière qui peut facilement être confondue.

`nb app` Cette couche résout le problème du « comment l'application s'exécute ». La couche inférieure peut s'adapter à différentes méthodes d'exécution, telles que Docker et PM2, et peut continuer à être étendue à l'avenir.

`nb app autostart` Cette couche résout le problème de « comment extraire l'environnement qui permet le démarrage automatique après le démarrage de la machine ». Il s'agit plutôt de fournir un point d'entrée stable pour le mécanisme de démarrage de l'hôte, plutôt que de remplacer un outil de gestion de processus spécifique.

autrement dit:

- Des fonctionnalités telles que Docker, PM2 et Supervisor sont plus proches de la façon dont les applications s'exécutent
- `systemd`, `launchd`, script de démarrage de l'hôte, plus proche de la couche de démarrage du système

C'est pourquoi, dans un environnement formel, vous devez généralement connecter `nb app autostart run` à votre propre processus de démarrage du système, tel que `systemd`, `launchd`, les scripts de démarrage de la plateforme de conteneurs ou d'autres mécanismes de démarrage automatique de l'hôte que vous utilisez déjà.

## Champ d'application

`nb app autostart` s'applique uniquement aux environnements avec un environnement d'exécution géré par CLI, c'est-à-dire :

- `local`
- `docker`

Si cet environnement est uniquement une connexion API distante ou n'est pas une application exécutée sous gestion CLI sur la machine actuelle, alors cet ensemble de commandes n'est pas adapté au démarrage automatique.

##Pratique par défaut

Dans la plupart des scénarios, la séquence suivante suffit :

1. Confirmez d'abord que l'application peut être démarrée normalement sur la machine actuelle
2. Exécutez `nb app autostart enable --env <name> --yes`
3. Connectez `nb app autostart run` au système pour démarrer le processus
4. Redémarrez la machine ou exécutez manuellement `run` pour vérifier si elle récupère normalement.

Si vous devez encore configurer la couche d'entrée de production ensuite, continuez à consulter [proxy inverse](./reverse-proxy/index.md).

## Commandes associées

```bash
nb app autostart enable --env app1 --yes
nb app autostart disable --env app1 --yes
nb app autostart list
nb app autostart run
nb app autostart run --verbose
```

## Liens connexes

- [Présentation du déploiement de l'environnement de production](./index.md)
- [Proxy inverse](./reverse-proxy/index.md)
- [intention de conception d'application nb](../cli-design/nb-app-design-intent.md)
- [Gérer l'application](../operations/manage-app.md)
