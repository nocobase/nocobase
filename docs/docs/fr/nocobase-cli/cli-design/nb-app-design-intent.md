# NB intention de conception d'application

Les commandes liées à `nb app` sont essentiellement des adaptations basées sur différentes méthodes de gestion de processus, puis unifiées en un ensemble d'entrées stables de gestion d'applications. Le but est d'essayer de faire converger l'utilisation mentale lors de l'exploitation et de la maintenance quotidiennes vers un ensemble de commandes.

Actuellement, les méthodes de gestion des processus de candidature prises en charge par CLI comprennent principalement :

- Docker
-PM2

Si nous devons prendre en charge davantage de méthodes à l'avenir, telles que Supervisor, nous continuerons à procéder à des adaptations à ce niveau. L’entrée de commande haute fréquence exposée au monde extérieur reste la même :

```bash
nb app start
nb app restart
nb app logs
nb app upgrade
nb app stop
```

## Pourquoi devrions-nous l'unifier en `nb app`

La gestion des processus peut être mise en œuvre de plusieurs manières, mais pour la plupart des utilisateurs, ce qui les intéresse vraiment n'est pas ce qui est utilisé dans la couche inférieure, mais les actions spécifiques de « Je veux démarrer l'application », « Je veux lire le journal » et « Je veux mettre à niveau l'application ».

Si les différences sous-jacentes sont directement exposées, les utilisateurs doivent d'abord déterminer quel mode de fonctionnement ils utilisent actuellement, puis se souvenir de l'ensemble correspondant de méthodes de fonctionnement. Après avoir été unifiées en `nb app`, ces actions à haute fréquence peuvent converger vers un ensemble d'entrées stables.

### Réduire les coûts d'apprentissage

Différentes solutions de gestion de processus fonctionnent de différentes manières :

- Docker dispose du système de commande de Docker
- PM2 dispose d'un système de commande PM2
- Le superviseur dispose également de sa propre méthode de configuration

Si ces différences sont directement exposées, les utilisateurs devront apprendre plusieurs méthodes d'utilisation et il sera plus facile de manquer des étapes clés dans des scénarios à haute fréquence tels que les mises à niveau, les redémarrages et le dépannage des journaux.

Après l'unification sous le nom de `nb app`, la plupart des gestions quotidiennes ne nécessitent que la maîtrise d'un seul ensemble de commandes.

### Unifier les processus métier

La gestion du cycle de vie des applications ne concerne pas seulement la gestion des processus.

Dans les processus tels que le démarrage, la mise à niveau et l'arrêt, la CLI doit souvent gérer une logique supplémentaire, telle que :

- Contrôle environnemental
- Traitement des configurations
- Migration des données
- Mise à niveau de version
- Gestion des journaux

En utilisant `nb app` comme entrée unifiée, vous pouvez garantir que les comportements de ces processus sont cohérents. Si vous continuez à développer vos capacités à l'avenir, vous n'avez pas besoin de réapprendre une nouvelle entrée en matière d'exploitation et de maintenance.

## Pourquoi `nb app autostart` est-il toujours nécessaire ?

Après avoir obtenu une entrée unifiée dans la gestion des processus, une autre couche de capacité de « gestion à démarrage automatique » doit être ajoutée pour que l'ensemble du processus soit terminé. C'est pourquoi `nb app autostart` existe.

L'usage courant est :

```bash
# 为当前 env 开启自启动
nb app autostart enable

# 为指定 env 开启自启动
nb app autostart enable --env app1

# 查看自启动状态
nb app autostart list

# 启动所有已开启自启动的 env
nb app autostart run

# 启动时显示底层启动输出
nb app autostart run --verbose
```

L’objectif de cet ensemble d’ordres est de continuer à maintenir l’unité à l’extérieur. En d'autres termes, dans l'esprit de l'utilisateur de cette couche de `nb app`, vous n'avez pas besoin de vous soucier de savoir si la couche inférieure est Docker, PM2 ou d'autres méthodes qui pourraient être prises en charge à l'avenir. La méthode de fonctionnement externe unifié est toujours similaire à :

```bash
nb app autostart enable --env app1
nb app autostart disable --env app1
```

### `run` À quoi cette couche s'adapte-t-elle ?

`nb app autostart` est également divisé en deux niveaux de responsabilités :

- `enable` / `disable` sont chargés de gérer si un certain environnement autorise le démarrage automatique
- `run` est responsable de l'extraction de tous les environnements pour lesquels le démarrage automatique est activé pendant la phase de démarrage du système.

En d’autres termes, la CLI fournira également une entrée `run` unifiée pour donner accès au mécanisme de démarrage automatique du système :

```bash
nb app autostart run
```

Ce qui est adapté ici, ce sont les mécanismes de démarrage du système tels que `systemd`, `launchd` et les scripts de démarrage de l'hôte, et non les gestionnaires de processus d'application tels que Supervisor.

## Dans l'ensemble

- Les commandes liées à `nb app` sont essentiellement une couche d'adaptation au-dessus de différentes méthodes de gestion de processus. Après avoir été unifiés extérieurement, ils peuvent réduire la confusion mentale de l'utilisateur.
- La mise en œuvre de la gestion des processus peut être Docker, PM2, Supervisor, etc. Actuellement, Docker et PM2 sont pris en charge
- Étant donné que les configurations de démarrage automatique des différentes méthodes de gestion de processus sont différentes, un ensemble unifié de fonctionnalités `nb app autostart` est nécessaire pour que l'ensemble du processus soit terminé.

Si vous souhaitez continuer à voir les opérations quotidiennes, vous pouvez accéder directement à [Gérer l'application] (../operations/manage-app.md). Si vous êtes prêt à déployer l'application dans l'environnement formel, vous pouvez continuer à voir [Déploiement de l'environnement de production](../production/index.md).
