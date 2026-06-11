# L'intention de conception de `nb proxy`

Le but de `nb proxy` est de fournir aux utilisateurs un ensemble de commandes plus simples et plus stables issues du processus de couche d'entrée initialement complexe.

Si l'on ne parle que du processus principal, il suffit de retenir ces 3 commandes :

```bash
nb proxy nginx use docker
nb proxy nginx generate --env test2 --host c.local.nocobase.com
nb proxy nginx reload
```

Dans la plupart des scénarios, vous utilisez `nb proxy` pour faire essentiellement ces trois étapes :

1. Utilisez d'abord `use` pour sélectionner le mode d'exécution du fournisseur actuel
2. Utilisez ensuite `generate` pour générer la configuration d'entrée en fonction de l'environnement et du nom de domaine
3. Enfin, utilisez `reload` pour que la configuration prenne effet

Si vous utilisez Caddy, remplacez simplement `nginx` dans la commande par `caddy`.

`use local` et `use docker` peuvent également être écrits directement comme ceci :

- Si Nginx ou Caddy a été installé localement, utilisez `use local`
- Il n'y a pas d'installation locale. Si vous souhaitez laisser CLI utiliser Docker pour gérer l'agent, utilisez `use docker`

C'est aussi l'expérience que cette couche de `nb proxy` souhaite le plus offrir : vous n'avez pas besoin d'entrer d'abord dans les détails de configuration de Nginx ou de Caddy, connectez simplement l'entrée selon le processus fixe.

## Pourquoi suffit-il de se souvenir de ces 3 éléments en premier ?

Car le problème résolu par `nb proxy` est en réalité très convergent : **Donnez à l'application une entrée d'accès externe stable. **

Si vous avez déjà vu [Présentation du déploiement de l'environnement de production](../production/index.md), vous pouvez vous en souvenir séparément de `nb app autostart` comme ceci :

- `nb app autostart` est en charge de "comment reprendre l'exécution de l'application après le redémarrage de la machine"
- `nb proxy` est en charge de "comment l'application peut fournir un accès externe stable via Nginx ou Caddy"

Ainsi, dans le processus de déploiement le plus courant, `nb proxy` ne nécessite pas beaucoup d'esprit. La plupart du temps c’est :

- Sélectionnez le mode de fonctionnement
- Générer une configuration
- Le rechargement prend effet

Assez.

## À quoi servent ces trois étapes ?

### `use`

`use` résout le problème de « comment gérer l'agent actuellement ».

Par exemple:

- `nb proxy nginx use docker`
- `nb proxy nginx use local`

La façon la plus simple de juger est la suivante :

- Si Nginx ou Caddy a été installé localement, utilisez `use local`
- S'il n'est pas installé localement, utilisez `use docker`

Vous pouvez également considérer cela comme une première sélection du mode d'exécution par défaut du fournisseur actuel. Les commandes suivantes `start`, `reload` et `status` fonctionneront de cette manière.

### `generate`

`generate` résout le problème du "rendu de la configuration d'entrée en fonction de l'environnement actuel".

Par exemple:

```bash
nb proxy nginx generate --env test2 --host c.local.nocobase.com
```

Cette étape combinera les informations en env avec les paramètres requis par la couche d'entrée pour générer une configuration proxy utilisable. L’entrée la plus critique ici est généralement :

- `--env` : quel environnement CLI a réussi à exposer
- `--host` : à quel nom de domaine se lier

En d'autres termes, `generate` gère les produits de configuration, pas l'état des processus.

### `reload`

`reload` résout le problème de « rendre la configuration nouvellement générée vraiment efficace ».

```bash
nb proxy nginx reload
```

Cette séparation présente un avantage direct : la génération de configuration et les actions de processus ne sont pas mélangées. Lorsque vous modifiez le nom de domaine, le port ou le chemin public, régénérez-le d'abord, puis décidez de le faire prendre effet. L'ensemble du processus sera plus clair.

## Pourquoi devrait-il être conçu comme `use → generate → reload`

Car ces trois étapes correspondent juste aux trois actions les plus stables de la couche d’entrée :

- Décidez d'abord comment exécuter l'agent
- Ensuite, décidez quelle entrée générer pour quel environnement
-Enfin, laissez la configuration prendre effet

Si vous placez toutes ces étapes dans une commande de boîte noire, il apparaîtra qu'il y a moins de commandes en surface. Cependant, lorsqu'un problème survient, il est difficile de déterminer si le pilote est mal sélectionné, si la configuration n'est pas générée correctement ou si l'agent n'a pas été rechargé.

Maintenant, après l'avoir démonté comme ceci, le chemin de l'enquête sera plus droit :

- `use` Si c'est faux, coupez simplement le pilote
- `generate` est incorrect, régénérez la configuration.
- La configuration est correcte mais elle n'a pas encore pris effet, juste `reload`

## Quels sont les avantages de cette couche de conception ?

L'avantage de `nb proxy` n'est pas seulement d'unifier les formes de commande de Nginx et Caddy, mais plus important encore, de transformer les actions à haute fréquence de la couche d'entrée en un processus composable.

Par exemple, vous pouvez démarrer directement depuis l’entrée de l’agent :

```bash
nb proxy nginx generate --env test2 --reload
```

Vous pouvez également partir de la configuration de l'application :

```bash
nb env update --env test2 --app-port 13000 --proxy-generate --proxy-reload
```

Ces deux exemples correspondent à deux points de départ très courants :

- Vous savez déjà que vous changez la couche d'entrée, alors juste `generate --reload`
- Vous avez d'abord modifié l'environnement, puis déclenché `--proxy-generate --proxy-reload`

Mais au final, ils s'inscrivent tous dans le même processus stable : mettre à jour la configuration, générer l'entrée et laisser l'agent agir.

## Pourquoi avons-nous besoin d'un `nb proxy` séparé

Car ce que `nb proxy` veut unifier, ce n'est pas un certain fichier de configuration Nginx, mais les actions communes de la couche d'entrée.

Ce qui vous intéresse vraiment, ce n’est généralement pas :

-Dans quel chemin se trouve le fichier de configuration ?
- Différences de commandes entre Nginx et Caddy
- Différences opérationnelles entre local et docker

Ce qui vous préoccupe le plus, c'est :

- Comment exposer cet environnement ?
- Comment changer mon nom de domaine ?
- Comment faire prendre effet la nouvelle configuration ?

`nb proxy` consiste à faire converger ces actions vers le même ensemble d'entrées CLI. De cette façon, si vous vous souvenez d’abord du processus principal, vous pouvez déjà couvrir la plupart des scénarios. Ce n'est que lorsque vous souhaitez continuer le dépannage ou si vous avez besoin d'une configuration spéciale qu'il vous suffit de consulter la page du fournisseur.

## Dans l'ensemble

- `nb proxy` L'utilisation principale de l'esprit est `use → generate → reload`
- Pour la plupart des utilisateurs, mémoriser ces 3 commandes suffit
- L'objectif de sa conception n'est pas de cacher tous les détails, mais de corriger d'abord les processus d'entrée de gamme les plus courants.

Si vous souhaitez continuer à consulter les commandes spécifiques, vous pouvez accéder directement à [`nb proxy`](../../api/cli/proxy/index.md). Si vous êtes prêt à vous connecter à l'entrée officielle, vous pouvez également continuer à consulter [Reverse Proxy](../production/reverse-proxy/index.md).
