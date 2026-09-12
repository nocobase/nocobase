---
title: "Gestion des publications"
description: "Bonnes pratiques de publication : utiliser la gestion des versions, le multi-app, les sauvegardes et la migration pour publier entre développement, préproduction et production."
keywords: "Gestion des publications,Release,déploiement multi-environnement,gestion des versions,multi-app,sauvegarde,migration,NocoBase"
---

# Gestion des publications

## Introduction

La gestion des publications encadre le passage d’une application du développement à la production. Ce n’est pas une action unique, mais un processus répétable, vérifiable et récupérable.

Gardez la production stable. Terminez les changements en développement, validez-les en préproduction, puis publiez en production. Conservez fichiers de migration, sauvegardes, journaux d’exécution et résultats de validation.

~~~text
Développement -> Préproduction -> Production
~~~

Le développement sert à configurer. La préproduction reproduit les contraintes de production. La production porte l’activité réelle.

## Modèle de publication

| Capacité | Problème résolu | Étape |
| --- | --- | --- |
| Gestion des versions | Conserve les jalons et points de retour | Développement |
| Variables et secrets | Isole configuration et informations sensibles | Toutes les étapes |
| Multi-app | Sépare les limites par module métier | Architecture et collaboration |
| Sauvegarde | Conserve un état de production restaurable | Avant publication et exploitation |
| Migration | Publie configuration et structure vers la cible | Préproduction et production |

## Configuration d’environnement : utiliser les variables et secrets

Chaque environnement doit utiliser ses propres variables et secrets. Connexions de base de données, services tiers, comptes de test, tokens, API Keys et Webhooks ne doivent pas être codés en dur. Lors de la migration, complétez uniquement les valeurs manquantes de l’environnement cible.

Documentation associée : [Variables et secrets](../variables-and-secrets/index.md).

## Phase de développement : enregistrer des points récupérables

Utilisez la gestion des versions pour les étapes importantes. Créez une version avant une modification majeure, puis une autre après les changements de modèles, pages, droits, workflows ou plugins. Donnez une description métier claire.

La gestion des versions sert surtout au développement. La publication passe par la migration. La restauration de production passe par la sauvegarde.

Documentation associée : [Gestion des versions](../version-control/index.md).

## Découpage en modules : contrôler les limites

Une petite application peut rester monolithique. Quand pages, tables, droits et workflows augmentent, une publication peut toucher plusieurs équipes. Le multi-app permet de séparer CRM, tickets, actifs, RH, rapports ou back-office.

Planifiez utilisateurs, organisations, authentification, permissions et données partagées avant de découper. Des limites nettes réduisent l’impact des publications.

~~~text
CRM : Développement -> Préproduction -> Production
Tickets : Développement -> Préproduction -> Production
Actifs : Développement -> Préproduction -> Production
~~~

Documentation associée : [Gestion multi-app](../../multi-app/multi-app/index.md).

## Préparation : confirmer la restauration

Avant une publication en production, créez une sauvegarde. Pour une publication importante, testez la restauration dans un environnement indépendant. La sauvegarde doit couvrir base de données, fichiers téléversés et stockage nécessaire à l’exécution.

Documentation associée : [Gestion des sauvegardes](../backup-manager/index.mdx).

## Exécution : migrer vers l’environnement cible

La migration publie configuration applicative, structures de tables, configuration de plugins et certaines données. Publiez d’abord en préproduction ; après validation, utilisez le même fichier pour la production.

![20250106234710](https://static-docs.nocobase.com/20250106234710.png)

### Publier en préproduction

Exécutez le fichier généré depuis le développement. La préproduction doit être proche de la production : version du noyau, plugins, variables, secrets, permissions et connexions externes. Validez pages clés, droits, workflows et intégrations.

### Publier en production

Planifiez une fenêtre de maintenance, informez les utilisateurs et stoppez les accès ou affichez une page de maintenance. En multi-nœud, réduisez à un nœud avant migration. Après migration, validez les flux métier puis réactivez l’accès.

### Règles de migration

Les stratégies courantes sont écraser, structure seule et ignorer. Les tables intégrées suivent généralement la stratégie par défaut et utilisent écraser. Les tables utilisateur contenant des données métier utilisent généralement structure seule. Les tables de métadonnées peuvent être écrasées selon le scénario.

Consultez : [Tables intégrées des applications et principaux plugins](../migration-manager/built-in-tables.md).

![20250105194845](https://static-docs.nocobase.com/20250105194845.png)

La migration traite surtout la base principale. Sources externes, données de sous-applications et certains dossiers de stockage doivent être gérés séparément.

Documentation associée : [Gestion des migrations](../migration-manager/index.md).

## Retour arrière et restauration

En cas d’échec, utilisez d’abord la sauvegarde prépublication via Backup Manager. Si l’environnement courant reste accessible et seule la migration a échoué, restaurez sur place. Sinon, restaurez dans un environnement indépendant, validez les flux clés et basculez le trafic.

![20250105195029](https://static-docs.nocobase.com/20250105195029.png)

## Documentation associée

- [Variables et secrets](../variables-and-secrets/index.md)
- [Gestion des versions](../version-control/index.md)
- [Gestion multi-app](../../multi-app/multi-app/index.md)
- [Gestion des sauvegardes](../backup-manager/index.mdx)
- [Gestion des migrations](../migration-manager/index.md)
