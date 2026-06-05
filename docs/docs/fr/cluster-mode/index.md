:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mode Cluster

## Introduction

Depuis la version v1.6.0, NocoBase prend en charge l'exécution d'applications en mode cluster. Lorsqu'une application s'exécute en mode cluster, elle peut améliorer ses performances dans la gestion des accès concurrents en utilisant plusieurs instances et un mode multi-cœur.

En s'appuyant sur le mode cluster, il est possible de mettre en place une haute disponibilité au niveau applicatif : un équilibreur de charge distribue le trafic entre plusieurs instances NocoBase au sein d'un même cluster, de sorte que si une instance tombe en panne, redémarre ou est en cours de déploiement, les autres instances peuvent continuer à fournir le service. En pratique, un même cluster doit généralement être déployé dans le même environnement réseau à faible latence.

Il est important de noter que le mode cluster de NocoBase traite l'extension horizontale et la haute disponibilité des instances applicatives au niveau de l'application. Si vous avez besoin d'un secours à chaud ou d'un plan de reprise après sinistre entre plusieurs zones de disponibilité ou régions, il faut généralement déployer plusieurs clusters indépendants, et l'équipe d'exploitation doit alors prendre en charge la stratégie de réplication et de bascule de la base de données, du stockage partagé et des autres composants d'infrastructure.

## Architecture système

![20251031221530](https://static-docs.nocobase.com/20251031221530.png)

*   **Cluster d'applications** : Un cluster composé de plusieurs instances d'applications NocoBase. Il peut être déployé sur plusieurs serveurs ou exécuté sous forme de plusieurs processus en mode multi-cœur sur un seul serveur.
*   **Base de données** : Stocke les données de l'application. Il peut s'agir d'une base de données à nœud unique ou distribuée.
*   **Stockage partagé** : Utilisé pour stocker les fichiers et les données de l'application, prenant en charge l'accès en lecture/écriture depuis plusieurs instances.
*   **Middleware** : Comprend des composants tels que le cache, les signaux de synchronisation, les files d'attente de messages et les verrous distribués pour prendre en charge la communication et la coordination au sein du cluster d'applications.
*   **Équilibreur de charge** : Responsable de la répartition des requêtes client vers différentes instances du cluster d'applications, ainsi que de l'exécution des vérifications de santé et du basculement.

## Pour en savoir plus

Ce document ne présente que les concepts de base et les composants du mode cluster de NocoBase. Pour les détails de déploiement spécifiques et davantage d'options de configuration, vous pouvez consulter les documents suivants :

- Déploiement
  - [Préparatifs](./preparations)
  - [Déploiement Kubernetes](./kubernetes)
  - [Opérations](./operations)
- Avancé
  - [Fractionnement des services](./services-splitting)
- [Référence pour les développeurs](./development)
