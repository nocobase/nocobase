---
title: "Présentation du déploiement de l'environnement de production"
description: "Instructions générales pour le déploiement de l'environnement de production : Après avoir confirmé que l'application fonctionne normalement, ajoutez les entrées de démarrage automatique et de proxy inverse de l'application."
keywords: "NocoBase, déploiement d'un environnement de production, présentation, démarrage automatique de l'application, proxy inverse, Nginx, Caddy"
---


# Présentation du déploiement de l'environnement de production

Si votre NocoBase peut déjà fonctionner normalement sur le serveur, vous devez généralement ajouter deux fonctionnalités supplémentaires avant son lancement officiel :

1. Autorisez l'application à reprendre automatiquement son exécution après le redémarrage de la machine.
2. Connectez l'entrée proxy inverse à l'application pour fournir un accès stable au monde extérieur.

Correspondant à la CLI NocoBase, elle se compose principalement des deux jeux de commandes suivants :

- `nb app autostart`
- `nb proxy`

Cet ensemble de documents est principalement divisé en deux parties :

1. Démarrage automatique de l'application : permet à l'application de reprendre son exécution après le redémarrage de la machine.
2. Proxy inverse : fournit une entrée d'accès externe stable pour les applications

Vous pouvez d'abord voir de quelle pièce vous avez le plus besoin actuellement, puis accéder à la page correspondante.

## Quels problèmes ces deux éléments résolvent-ils dans l'environnement de production ?

C'est à dire :

- `nb app autostart` résout le problème de "comment reprendre le fonctionnement des applications après le démarrage du système"
- `nb proxy` résout le problème de "comment fournir un accès stable au monde extérieur"

:::tip Pourquoi n'utilisez-vous pas directement la configuration à démarrage automatique de Docker, PM2 ou Supervisor ici ?

`nb app autostart` ne contourne pas ces méthodes de gestion de processus, mais adapte uniformément différentes méthodes de gestion de processus, puis les fait converger vers un ensemble stable d'entrées de gestion à démarrage automatique. De cette façon, vous n'avez pas besoin de mémoriser un ensemble différent de configurations à démarrage automatique, car la couche sous-jacente est Docker, PM2 ou Supervisor qui pourrait être prise en charge à l'avenir.

Lorsque le système démarre cette couche, elle continuera à être traitée par `systemd`, `launchd` ou le script de démarrage de l'hôte. Ils sont chargés d'exécuter une seule fois au démarrage de la machine :

```bash
nb app autostart run
```

Cette commande extraira ensuite toutes les applications dont le démarrage automatique est activé.

Voici deux couches de choses qui ne doivent pas être mélangées :

- Des fonctionnalités telles que Docker, PM2 et Supervisor sont plus proches de « la façon dont les applications s'exécutent habituellement et comment gérer les processus d'application ».
- Les fonctionnalités telles que `systemd`, `launchd` et les scripts de démarrage de l'hôte sont plus proches de « quelle commande exécuter au démarrage du système »

Si vous êtes bloqué ici "Pourquoi avez-vous besoin de `nb app autostart`", continuez simplement à lire [Démarrage automatique de l'application] (./autostart.md) et [Intention de conception d'application nb] (../cli-design/nb-app-design-intent.md).

:::

## Quelle page dois-je consulter maintenant ?

| Je veux... | Où chercher |
| --- | --- |
| Laissez d'abord le serveur redémarrer, puis l'application pourra automatiquement reprendre son exécution | [Démarrage automatique de l'application](./autostart.md) |
| Comprenez d’abord la relation d’entrée de Nginx / Caddy dans cette CLI | [Proxy inverse](./reverse-proxy/index.md) |
| Continuer à utiliser Nginx pour gérer l'entrée du site | [Nginx](./reverse-proxy/nginx.md) |
| Connectez HTTPS dès que possible et conservez moins de détails TLS | [Caddy](./reverse-proxy/caddy.md) |
| Afficher le démarrage, l'arrêt, les journaux et les mises à niveau de l'application elle-même | [Gérer l'application](../operations/manage-app.md) |

## Avant d'entrer dans l'environnement de production, confirmez ces prérequis

- L'application a été enregistrée en tant qu'environnement CLI
- L'application peut être démarrée normalement sur le serveur lui-même
- Si vous allez vous connecter au proxy inverse, `appPort` a été enregistré dans env
- Si vous êtes prêt à l'ouvrir officiellement au monde extérieur, vous avez déjà prévu le nom de domaine, le port d'entrée et la solution HTTPS.

Si vous n'avez pas terminé l'installation CLI ou l'initialisation de l'environnement, revenez à [Installation à l'aide de CLI (recommandé)] (../installation/cli.md).

Si la commande indique qu'il manque `appPort` env, exécutez d'abord [`nb env update`](../../api/cli/env/update.md) pour le remplir.

## Liens connexes

- [Démarrage automatique de l'application](./autostart.md)
- [Proxy inverse](./reverse-proxy/index.md)
- [Nginx](./reverse-proxy/nginx.md)
- [Caddy](./reverse-proxy/caddy.md)
- [Gérer l'application](../operations/manage-app.md)
