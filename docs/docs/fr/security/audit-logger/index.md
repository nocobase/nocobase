---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Journal d'audit

## Introduction

Le journal d'audit vous permet d'enregistrer et de suivre l'historique des activités des utilisateurs et des opérations sur les ressources au sein du système.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Description des paramètres

| Paramètre                  | Description                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Resource**               | Type de ressource cible de l'opération.                                                                                                   |
| **Action**                 | Type d'opération effectuée.                                                                                                               |
| **User**                   | Utilisateur ayant effectué l'opération.                                                                                                   |
| **Role**                   | Rôle de l'utilisateur au moment de l'opération.                                                                                           |
| **Data source**            | La source de données.                                                                                                                     |
| **Target collection**      | La collection cible.                                                                                                                      |
| **Target record UK**       | Identifiant unique de l'enregistrement de la collection cible.                                                                            |
| **Source collection**      | La collection source du champ d'association.                                                                                              |
| **Source record UK**       | Identifiant unique de l'enregistrement de la collection source.                                                                           |
| **Status**                 | Code de statut HTTP de la réponse à la requête d'opération.                                                                               |
| **Created at**             | Heure de l'opération.                                                                                                                     |
| **UUID**                   | Identifiant unique de l'opération, cohérent avec l'ID de requête de l'opération, utilisable pour récupérer les journaux d'application. |
| **IP**                     | Adresse IP de l'utilisateur.                                                                                                              |
| **UA**                     | Informations UA (User Agent) de l'utilisateur.                                                                                            |
| **Metadata**               | Métadonnées telles que les paramètres, le corps de la requête et le contenu de la réponse de l'opération.                                |

## Description des ressources auditées

Actuellement, les opérations sur les ressources suivantes sont enregistrées dans le journal d'audit :

### Application principale

| Opération        | Description                      |
| ---------------- | -------------------------------- |
| `app:resart`     | Redémarrage de l'application     |
| `app:clearCache` | Effacement du cache de l'application |

### Gestionnaire de plugins

| Opération    | Description             |
| ------------ | ----------------------- |
| `pm:add`     | Ajouter un plugin       |
| `pm:update`  | Mettre à jour un plugin |
| `pm:enable`  | Activer un plugin       |
| `pm:disable` | Désactiver un plugin    |
| `pm:remove`  | Supprimer un plugin     |

### Authentification utilisateur

| Opération             | Description                   |
| --------------------- | ----------------------------- |
| `auth:signIn`         | Connexion                     |
| `auth:signUp`         | Inscription                   |
| `auth:signOut`        | Déconnexion                   |
| `auth:changePassword` | Changement de mot de passe |

### Utilisateur

| Opération             | Description             |
| --------------------- | ----------------------- |
| `users:updateProfile` | Mise à jour du profil |

### Configuration de l'interface utilisateur

| Opération                  | Description                               |
| -------------------------- | ----------------------------------------- |
| `uiSchemas:insertAdjacent` | Insertion de schéma d'interface utilisateur |
| `uiSchemas:patch`          | Modification de schéma d'interface utilisateur |
| `uiSchemas:remove`         | Suppression de schéma d'interface utilisateur |

### Opérations sur les collections

| Opération        | Description                                   |
| ---------------- | --------------------------------------------- |
| `create`         | Créer un enregistrement                       |
| `update`         | Mettre à jour un enregistrement               |
| `destroy`        | Supprimer un enregistrement                   |
| `updateOrCreate` | Mettre à jour ou créer un enregistrement      |
| `firstOrCreate`  | Rechercher ou créer un enregistrement         |
| `move`           | Déplacer un enregistrement                    |
| `set`            | Définir l'enregistrement du champ d'association |
| `add`            | Ajouter un enregistrement au champ d'association |
| `remove`         | Supprimer un enregistrement du champ d'association |
| `export`         | Exporter un enregistrement                    |
| `import`         | Importer un enregistrement                    |

## Ajouter d'autres ressources auditées

Si vous avez étendu d'autres opérations sur les ressources via des plugins et que vous souhaitez que ces comportements soient enregistrés dans le journal d'audit, veuillez consulter l'[API](/api/server/audit-manager.md).