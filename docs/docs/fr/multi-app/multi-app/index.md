---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/multi-app/multi-app/index).
:::

# Gestion multi-applications

## Aperçu des fonctionnalités

La gestion multi-applications est une solution de gestion d'applications unifiée fournie par NocoBase, utilisée pour créer et gérer plusieurs instances d'applications NocoBase physiquement isolées dans un ou plusieurs environnements d'exécution. Grâce au gestionnaire d'applications (AppSupervisor), vous pouvez créer et maintenir plusieurs applications à partir d'un point d'entrée unique, répondant ainsi aux besoins de différentes activités et de différentes étapes de croissance.

## Application unique

Au début d'un projet, la plupart des utilisateurs commencent par une application unique.

Dans ce mode, le système n'a besoin de déployer qu'une seule instance NocoBase, où toutes les fonctionnalités métier, les données et les utilisateurs s'exécutent dans la même application. Le déploiement est simple, les coûts de configuration sont faibles, ce qui est idéal pour la validation de prototypes, les petits projets ou les outils internes.

Cependant, à mesure que les activités se complexifient, une application unique est confrontée à certaines limites naturelles :

- Les fonctionnalités s'accumulent continuellement, rendant le système lourd.
- Il est difficile d'isoler les différentes activités entre elles.
- Les coûts d'extension et de maintenance de l'application ne cessent d'augmenter.

À ce stade, vous souhaiterez diviser les différentes activités en plusieurs applications afin d'améliorer la maintenabilité et l'extensibilité du système.

## Multi-application en mémoire partagée

Lorsque vous souhaitez diviser vos activités sans pour autant introduire une architecture de déploiement et d'exploitation complexe, vous pouvez passer au mode multi-application en mémoire partagée.

Dans ce mode, plusieurs applications peuvent s'exécuter simultanément dans une seule instance NocoBase. Chaque application est indépendante, peut se connecter à une base de données indépendante, et peut être créée, démarrée et arrêtée individuellement, mais elles partagent le même processus et le même espace mémoire. Vous n'avez toujours qu'une seule instance NocoBase à maintenir.

![](https://static-docs.nocobase.com/202512231055907.png)

Cette approche apporte des améliorations notables :

- Les activités peuvent être divisées selon la dimension de l'application.
- Les fonctionnalités et les configurations entre les applications sont plus claires.
- Par rapport aux solutions multi-processus ou multi-conteneurs, l'occupation des ressources est plus faible.

Cependant, comme toutes les applications s'exécutent dans le même processus, elles partagent les ressources telles que le CPU et la mémoire. Une anomalie ou une charge élevée dans une seule application peut affecter la stabilité des autres applications.

Lorsque le nombre d'applications continue d'augmenter, ou que des exigences plus élevées en matière d'isolation et de stabilité sont posées, il est nécessaire de faire évoluer davantage l'architecture.

## Déploiement hybride multi-environnement

Lorsque l'échelle et la complexité des activités atteignent un certain niveau et que le nombre d'applications doit être étendu à grande échelle, le mode multi-application en mémoire partagée sera confronté à des défis tels que la concurrence pour les ressources, la stabilité et la sécurité. Lors de la phase de mise à l'échelle, vous pouvez envisager d'adopter un déploiement hybride multi-environnement pour soutenir des scénarios métier plus complexes.

Le cœur de cette architecture est l'introduction d'une application d'entrée, c'est-à-dire le déploiement d'un NocoBase comme centre de gestion unifié, tout en déployant plusieurs NocoBase comme environnements d'exécution d'applications pour faire fonctionner réellement les applications métier.

L'application d'entrée est responsable de :

- La création, la configuration et la gestion du cycle de vie des applications.
- La transmission des commandes de gestion et la synthèse des états.

L'environnement d'application d'instance est responsable de :

- Porter et exécuter réellement les applications métier via le mode multi-application en mémoire partagée.

Pour l'utilisateur, plusieurs applications peuvent toujours être créées et gérées via une seule entrée, mais en interne :

- Différentes applications peuvent s'exécuter sur différents nœuds ou clusters.
- Chaque application peut utiliser des bases de données et des middlewares indépendants.
- Les applications à forte charge peuvent être étendues ou isolées à la demande.

![](https://static-docs.nocobase.com/202512231215186.png)

Cette approche convient aux plateformes SaaS, aux nombreux environnements de démonstration ou aux scénarios multi-locataires, améliorant la stabilité et la maintenabilité du système tout en garantissant la flexibilité.