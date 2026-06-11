---
pkg: '@nocobase/plugin-migration-manager'
title: "Gestionnaire de migrations"
description: "Gestionnaire de migrations en exploitation : migration de la configuration applicative d'un environnement vers un autre, prise en charge des règles structure seule, écraser, Upsert, ignorer les doublons, ignorer ; dépend du plugin Gestionnaire de sauvegardes."
keywords: "Gestionnaire de migrations,Migration,migration de configuration,règles de migration,Upsert,migration de base de données,exploitation,NocoBase"
---
# Gestionnaire de migrations

## Introduction

Le plugin Gestionnaire de migrations vous permet de migrer la configuration d'une application d'un environnement (par exemple Staging) vers un autre (par exemple PROD).

**Différences fondamentales :**

- **Gestionnaire de migrations :** Se concentre sur la migration de configurations applicatives spécifiques, de structures de tables ou de portions de données.
- **[Gestionnaire de sauvegardes](../backup-manager/index.mdx) :** Se concentre sur la sauvegarde et la restauration complètes des données.

## Installation

Dépend du plugin [Gestionnaire de sauvegardes](../backup-manager/index.mdx). Veuillez vous assurer qu'il est déjà installé et activé.

## Fonctionnement et principe

Migre les tables et données de la base de données principale d'une application vers une autre, selon les règles de migration définies. À noter : les bases de données externes et les données des sous-applications ne sont pas migrées.

![20250102202546](https://static-docs.nocobase.com/20250102202546.png)

## Règles de migration

### Règles intégrées

Les cinq règles de migration suivantes sont prises en charge :

- **Structure seule :** Synchronise uniquement la structure des tables, sans insertion ni mise à jour des données.
- **Écraser (vider et réinsérer) :** Vide les enregistrements existants de la table puis insère les nouvelles données.
- **Insérer ou mettre à jour (Upsert) :** Détermine en fonction de la clé primaire ; met à jour si l'enregistrement existe, sinon l'insère.
- **Insérer en ignorant les doublons :** Insère de nouveaux enregistrements ; en cas de conflit de clé primaire, ignore (ne met pas à jour les enregistrements existants).
- **Ignorer :** N'effectue aucun traitement sur cette table.

**Remarques :**
- Les règles « Écraser », « Insérer ou mettre à jour » et « Insérer en ignorant les doublons » synchronisent également les modifications de structure de table.
- Les tables avec un ID auto-incrémenté comme clé primaire ou sans clé primaire ne prennent pas en charge « Insérer ou mettre à jour » ni « Insérer en ignorant les doublons ».

### Conception détaillée

![20250102204909](https://static-docs.nocobase.com/20250102204909.png)

### Interface de configuration

Configuration des règles de migration

![20250102205450](https://static-docs.nocobase.com/20250102205450.png)

Activer les règles indépendantes

![20250107105005](https://static-docs.nocobase.com/20250107105005.png)

Sélectionnez la règle indépendante ainsi que les tables traitées selon cette règle

![20250107104644](https://static-docs.nocobase.com/20250107104644.png)

## Fichiers de migration

![20250102205844](https://static-docs.nocobase.com/20250102205844.png)

### Créer une nouvelle migration

![20250102205857](https://static-docs.nocobase.com/20250102205857.png)

### Exécuter une migration

![20250102205915](https://static-docs.nocobase.com/20250102205915.png)

#### Vérification des variables d'environnement

Vérification des variables d'environnement de l'application (en savoir plus sur les [variables d'environnement](../variables-and-secrets/index.md))

![20250102212311](https://static-docs.nocobase.com/20250102212311.png)

Si les valeurs de `DB_UNDERSCORED`, `USE_DB_SCHEMA_IN_SUBAPP`, `DB_TABLE_PREFIX`, `DB_SCHEMA`, `COLLECTION_MANAGER_SCHEMA` dans le fichier .env ne correspondent pas, une popup s'affichera pour signaler que la migration ne peut pas continuer.

![918b8d56037681b29db8396ccad63364](https://static-docs.nocobase.com/918b8d56037681b29db8396ccad63364.png)

S'il manque des variables d'environnement de configuration dynamique ou des secrets, une popup vous invitera à saisir les variables d'environnement ou secrets supplémentaires nécessaires pour continuer.

![93a4fcb44f92c43d827d57b7874f6ae6](https://static-docs.nocobase.com/93a4fcb44f92c43d827d57b7874f6ae6.png)

#### Vérification des plugins

Vérification des plugins de l'application : si l'environnement courant manque de plugins, une popup vous le signalera ; vous pouvez aussi choisir de poursuivre la migration.

![bb5690a1e95660e1a5e0fd7440b6425c](https://static-docs.nocobase.com/bb5690a1e95660e1a5e0fd7440b6425c.png)

## Journaux de migration et stockage

Après l'exécution d'une migration, les fichiers de log d'exécution sont conservés sur le serveur ; vous pouvez les consulter en ligne ou les télécharger.

![20251225184721](https://static-docs.nocobase.com/20251225184721.png)

Lors de la consultation en ligne du fichier de log d'exécution, vous pouvez aussi télécharger le SQL exécuté pour la migration de la structure de données.

![20251227164116](https://static-docs.nocobase.com/20251227164116.png)

Cliquez sur le bouton « Processus » pour consulter le déroulé de la migration terminée

![c065716cfbb7655f5826bf0ceae4b156](https://static-docs.nocobase.com/c065716cfbb7655f5826bf0ceae4b156.png)

![f4abe566de1186a9432174ce70b2f960](https://static-docs.nocobase.com/f4abe566de1186a9432174ce70b2f960.png)

### À propos du répertoire `storage`

Le gestionnaire de migrations gère principalement les enregistrements de la base de données. Certaines données du répertoire `storage` (logs, historique de sauvegarde, logs de requête, etc.) ne sont pas migrées automatiquement.

- Si vous souhaitez conserver ces fichiers dans le nouvel environnement, vous devez copier manuellement les sous-dossiers concernés du répertoire `storage`.

## Rollback

Avant l'exécution d'une migration, le système crée automatiquement une sauvegarde.

### Principes de rollback

1.  **Arrêter le service :** Avant le rollback, arrêtez l'application pour empêcher de nouvelles écritures de données.
2.  **Correspondance des versions :** La version du noyau NocoBase (image Docker) **doit** être identique à celle utilisée lors de la création du fichier de sauvegarde.
3.  **Restauration dans un environnement neuf :** Si la base de données ou le stockage actuels sont corrompus, restaurer uniquement la version d'image peut ne pas suffire. La méthode la plus sûre est de **restaurer la sauvegarde dans une instance d'application complètement neuve (nouvelle base de données et nouveau stockage)** avec la bonne image de noyau.

### Procédure de rollback

#### Scénario A : Échec de l'exécution de la tâche de migration
Si seule la tâche de migration a échoué, mais que la version du noyau n'a pas changé, utilisez directement le [Gestionnaire de sauvegardes](../backup-manager/index.mdx) pour restaurer la sauvegarde créée automatiquement avant la migration.

#### Scénario B : Système corrompu ou échec de mise à niveau du noyau
Si la mise à niveau ou la migration a rendu le système inopérant, vous devez revenir à un état stable :
1.  **Arrêter l'application :** Arrêtez le service de conteneur courant.
2.  **Préparer un environnement neuf :** Préparez une nouvelle base de données vide et un stockage vide.
3.  **Déployer la version cible :** Remettez le tag de l'image Docker à la version *au moment de la création de la sauvegarde*.
4.  **Restaurer la sauvegarde :** Effectuez la restauration dans cet environnement propre via le [Gestionnaire de sauvegardes](../backup-manager/index.mdx).
5.  **Basculer le trafic :** Mettez à jour la passerelle/load balancer pour rediriger le trafic vers cette nouvelle instance restaurée.

![20251227164004](https://static-docs.nocobase.com/20251227164004.png)

## Ligne de commande

### `yarn nocobase migration generate`

```bash
Usage: nocobase migration generate [options]

Options:
  --title [title]    migration title
  --ruleId <ruleId>  migration rule id
```

Exemple

```bash
yarn nocobase migration generate --ruleId=1
```

### `yarn nocobase migration run`

```bash
Usage: nocobase migration run [options] <filePath>

Arguments:
  filePath           migration file path

Options:
  --skip-backup      skip backup
  --var [var]        variable (default: [])
  --secret [secret]  secret (default: [])
```

Exemple

```bash
yarn nocobase migration run /your/path/migration_1775658568158.nbdata \
  && --var A=a --var B=b \
  && --secret C=c --secret D=d
```

## Bonnes pratiques

### Procédure de déploiement recommandée (bascule blue-green)

Pour garantir un temps d'indisponibilité nul ou très court tout en obtenant une sécurité maximale, nous vous recommandons un schéma à deux environnements avec bascule :

1.  **Phase de préparation (Staging) :** Créez le fichier de migration dans l'environnement Staging.
2.  **Sauvegarde sécurisée (PROD-A) :** Créez une sauvegarde complète de l'environnement de production courant (PROD-A).
3.  **Déploiement parallèle (PROD-B) :** Déployez une instance de production *neuve, avec une base de données vide* (PROD-B), avec la version cible du noyau.
4.  **Restauration et migration :**
    *   Restaurez la sauvegarde de PROD-A vers PROD-B.
    *   Exécutez le fichier de migration provenant de Staging dans PROD-B.
5.  **Validation :** Pendant que PROD-A continue à servir le trafic, testez de manière exhaustive PROD-B.
6.  **Bascule du trafic :** Mettez à jour Nginx/passerelle pour diriger le trafic de PROD-A vers PROD-B.
    *   *En cas de problème, vous pouvez basculer instantanément vers PROD-A.*

### Cohérence des données et fenêtre de maintenance

Actuellement, NocoBase ne prend pas en charge la migration sans interruption de service. Pour éviter les incohérences de données pendant la sauvegarde ou la migration :
- **Couper la passerelle/entrée :** Il est fortement recommandé d'arrêter l'accès des utilisateurs avant de démarrer la sauvegarde ou la migration. Vous pouvez configurer **une page de maintenance 503** via Nginx ou la passerelle pour avertir les utilisateurs que le système est en maintenance et empêcher de nouvelles écritures.
- **Synchronisation manuelle des données :** Si des utilisateurs continuent à produire des données dans l'ancienne version pendant la migration, ces données devront être synchronisées manuellement par la suite.
