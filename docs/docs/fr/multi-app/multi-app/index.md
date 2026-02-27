---
pkg: '@nocobase/plugin-app-supervisor'
---

# Gestion multi-applications

## Présentation

La gestion multi-applications est une solution unifiée fournie par NocoBase. Elle permet de créer et gérer plusieurs instances NocoBase **physiquement isolées** sur un ou plusieurs environnements d'exécution. Avec **AppSupervisor**, les utilisateurs administrent plusieurs applications depuis une entrée unique.

## Application unique

Au début d'un projet, la plupart des équipes commencent avec une seule application.

Dans ce mode, une seule instance NocoBase est déployée. Toute la logique métier, les données et les utilisateurs y sont centralisés. Le déploiement est simple et le coût de configuration faible.

Avec la croissance, ce modèle atteint ses limites :

- Accumulation de fonctionnalités et complexité croissante
- Isolation difficile entre domaines métier
- Coûts de maintenance et d'extension en hausse

Il devient alors préférable de répartir les domaines métier dans plusieurs applications.

## Multi-application en mémoire partagée

Si vous souhaitez séparer les domaines métier sans introduire une architecture d'exploitation complexe, vous pouvez utiliser le mode multi-application en mémoire partagée.

Dans ce mode, plusieurs applications tournent dans une seule instance NocoBase. Chaque application est indépendante, peut avoir sa propre base de données, et être créée, démarrée ou arrêtée séparément. En revanche, elles partagent le même processus et la même mémoire.

![](https://static-docs.nocobase.com/202512231055907.png)

Avantages :

- Découpage métier par application
- Configuration et fonctionnalités mieux structurées
- Moins de ressources qu'une architecture multi-processus ou multi-conteneurs

Comme tout tourne dans un même processus, CPU et mémoire sont partagés. Une surcharge ou panne d'une application peut affecter les autres.

Quand le nombre d'applications augmente ou que les exigences d'isolation/stabilité montent, il faut faire évoluer l'architecture.

## Déploiement hybride multi-environnement

À grande échelle, le mode mémoire partagée rencontre des défis de contention des ressources, stabilité et sécurité. Le **déploiement hybride multi-environnement** permet d'aller plus loin.

Le principe : introduire une **application d'entrée** (plan de contrôle) et déployer plusieurs instances NocoBase comme environnements d'exécution qui hébergent réellement les applications métier.

Responsabilités de l'application d'entrée :

- Création, configuration et cycle de vie des applications
- Distribution des commandes de gestion et agrégation des états

Responsabilités des environnements d'exécution :

- Héberger et exécuter les applications métier

Côté utilisateur, la création et la gestion restent centralisées. En interne :

- Les applications peuvent s'exécuter sur des nœuds/cluster différents
- Chaque application peut utiliser sa propre base et son middleware
- Les applications à forte charge peuvent être isolées ou scalées indépendamment

![](https://static-docs.nocobase.com/202512231215186.png)

Ce modèle convient aux plateformes SaaS, à de nombreux environnements de démonstration et aux scénarios multi-tenant.
