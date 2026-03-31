---
pkg: '@nocobase/plugin-workflow'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Aperçu

## Introduction

Le plugin Flux de travail vous aide à orchestrer des processus métier automatisés dans NocoBase, tels que les approbations quotidiennes, la synchronisation des données, les rappels et d'autres tâches. Avec un flux de travail, vous pouvez implémenter une logique métier complexe en configurant simplement des déclencheurs et des nœuds associés via une interface visuelle, sans avoir à écrire de code.

### Exemple

Chaque flux de travail est orchestré avec un déclencheur et plusieurs nœuds. Le déclencheur représente un événement dans le système, et chaque nœud représente une étape d'exécution. Ensemble, ils décrivent la logique métier à traiter après qu'un événement se soit produit. L'image suivante montre un processus typique de déduction de stock après qu'une commande de produit a été passée :

![Exemple de flux de travail](https://static-docs.nocobase.com/20251029222146.png)

Lorsqu'un utilisateur soumet une commande, le flux de travail vérifie automatiquement le stock. Si le stock est suffisant, il déduit la quantité et poursuit la création de la commande ; sinon, le processus se termine.

### Cas d'utilisation

D'un point de vue plus général, les flux de travail dans les applications NocoBase peuvent résoudre des problèmes dans divers scénarios :

- Automatiser les tâches répétitives : Les examens de commande, la synchronisation des stocks, le nettoyage des données, le calcul des scores, etc., ne nécessitent plus d'opération manuelle.
- Soutenir la collaboration homme-machine : Organisez des approbations ou des révisions aux nœuds clés, et poursuivez les étapes suivantes en fonction des résultats.
- Connecter aux systèmes externes : Envoyez des requêtes HTTP, recevez des notifications de services externes et réalisez l'automatisation inter-systèmes.
- S'adapter rapidement aux changements métier : Ajustez la structure du processus, les conditions ou d'autres configurations de nœuds, et mettez en production sans nouvelle version.

## Installation

Le flux de travail est un plugin intégré de NocoBase. Aucune installation ou configuration supplémentaire n'est requise.

## En savoir plus

- [Démarrage rapide](./getting-started)
- [Déclencheurs](./triggers/index)
- [Nœuds](./nodes/index)
- [Utilisation des variables](./advanced/variables)
- [Exécutions](./advanced/executions)
- [Gestion des versions](./advanced/revisions)
- [Configuration avancée](./advanced/options)
- [Développement d'extensions](./development/index)