---
pkg: '@nocobase/plugin-auth-dingtalk'
title: "Synchroniser les données utilisateur depuis DingTalk"
description: "Synchronisez les utilisateurs et départements DingTalk avec NocoBase et recevez les changements via callback HTTP ou mode Stream."
keywords: "DingTalk,synchronisation utilisateur,synchronisation département,mode Stream,abonnement aux événements,NocoBase"
---

# Synchroniser les données utilisateur depuis DingTalk

<PluginInfo commercial="true" name="auth-dingtalk"></PluginInfo>

## Introduction

Le plugin **DingTalk** synchronise les utilisateurs et départements d'une organisation DingTalk avec NocoBase. Il prend en charge la synchronisation complète manuelle et les mises à jour incrémentielles via callback HTTP ou connexion Stream.

## Prérequis

1. Installez et activez **DingTalk** et **Synchronisation des données utilisateur**.
2. Créez une application interne dans la console développeur DingTalk.
3. Accordez les permissions d'annuaire et configurez le périmètre des données ci-dessous.
4. Copiez le Client ID et le Client Secret. Consultez [Authentification : DingTalk](/auth-verification/auth-dingtalk/).

## Configurer les permissions d'annuaire et le périmètre des données

Dans la **Gestion des permissions** de l'application DingTalk, accordez les permissions suivantes :

| Permission | Identifiant | Requise | Utilisation |
| --- | --- | --- | --- |
| Lire les informations des départements | `qyapi_get_department_list` | Oui | Lire la liste, les noms et la hiérarchie. |
| Lire les membres des départements | `qyapi_get_department_member` | Oui | Lire les membres de chaque département. |
| Lire les informations des membres | `qyapi_get_member` | Oui | Lire les détails et appartenances des utilisateurs. |
| Numéro de mobile des employés | `fieldMobile` | Si le mobile est utilisé | Synchroniser le téléphone ; requis si l'identifiant unique est `mobile`. |
| E-mail et autres informations personnelles | `fieldEmail` | Non | Requis pour synchroniser les adresses e-mail. |

Configurez également le **Périmètre des permissions de données** afin d'inclure les départements et employés à synchroniser. Sélectionnez tous les employés pour une synchronisation complète.

:::warning
Les permissions API déterminent les champs lisibles ; le périmètre de données détermine les départements et employés lisibles. Les deux sont nécessaires. L'abonnement aux événements ne remplace pas les permissions de lecture.
:::

Si la même application sert aussi à la connexion, accordez les permissions personnelles décrites dans [Authentification : DingTalk](/auth-verification/auth-dingtalk/).

## Ajouter une source DingTalk

Accédez à **Utilisateurs et permissions > Synchroniser**, cliquez sur **Ajouter** et sélectionnez **DingTalk**.

| Champ | Description |
| --- | --- |
| Nom de la source | Nom unique de la source. |
| Activée | Démarre la réception des événements et autorise les tâches de synchronisation. |
| Client ID | Client ID de l'application ; variables d'environnement et secrets pris en charge. |
| Client Secret | Client Secret de l'application ; variables d'environnement et secrets pris en charge. |
| Identifiant unique utilisateur | `mobile` ou `unionId`. Ne le modifiez pas après la première synchronisation. Les utilisateurs sans valeur sont ignorés. |
| Mode de réception | **Callback HTTP** ou **mode Stream** pour les changements incrémentiels. |

Enregistrez et activez la source, puis lancez d'abord une synchronisation complète avec **Synchroniser**.

## Choisir le mode de réception des événements

### Mode Stream

Le mode Stream établit une connexion persistante sortante du serveur NocoBase vers DingTalk. Il ne nécessite ni URL publique, ni Token, ni EncodingAESKey.

1. Sélectionnez **mode Stream** dans les paramètres d'abonnement DingTalk.
2. Abonnez-vous aux événements utilisateur et département nécessaires.
3. Sélectionnez **mode Stream** dans NocoBase, enregistrez et activez la source.

Le client Stream démarre lorsque la source est activée. La mise à jour, la désactivation ou la suppression actualise ou ferme la connexion.

:::info
Le serveur NocoBase doit pouvoir se connecter à DingTalk. Aucun proxy inverse ni endpoint entrant public n'est requis.
:::

### Callback HTTP

1. Sélectionnez **Callback HTTP** dans NocoBase.
2. Saisissez le Token et l'EncodingAESKey configurés dans DingTalk.
3. Enregistrez la source et copiez l'**URL de callback des événements**.
4. Configurez cette URL dans DingTalk et abonnez les événements requis.

L'URL doit être accessible par DingTalk. En production, utilisez HTTPS et transmettez le chemin sans modification via le proxy inverse.

## Événements incrémentiels pris en charge

| Événement | Traitement dans NocoBase |
| --- | --- |
| `user_add_org` | Créer ou mettre à jour l'utilisateur. |
| `user_modify_org` | Mettre à jour l'utilisateur. |
| `user_leave_org` | Supprimer l'utilisateur synchronisé. |
| `org_dept_create` | Créer ou mettre à jour le département. |
| `org_dept_modify` | Mettre à jour le département et synchroniser ses utilisateurs. |
| `org_dept_remove` | Supprimer le département synchronisé. |

## Champs synchronisés

### Champs des départements

| Champ DingTalk | Champ ou utilisation NocoBase |
| --- | --- |
| `dept_id` | Identifiant source unique du département. |
| `name` | Nom du département. |
| `parent_id` | Département parent. S'il est hors périmètre, le département est synchronisé comme racine. |

### Champs des utilisateurs

| Champ DingTalk | Champ ou utilisation NocoBase |
| --- | --- |
| `mobile` ou `unionid` | Identifiant source unique et nom d'utilisateur selon la configuration. |
| `name` | Surnom de l'utilisateur. |
| `mobile` | Téléphone. Nécessite `fieldMobile`. |
| `email`, avec repli sur `org_email` | Adresse e-mail. Nécessite `fieldEmail`. |
| `dept_id_list` | Départements de l'utilisateur inclus dans le périmètre de données. |
| `dept_order_list` | Département principal. |
| `leader_in_dept` | Indique si l'utilisateur est responsable du département. |

### Responsables de département

NocoBase synchronise `leader_in_dept` séparément pour chaque département. Un utilisateur peut diriger plusieurs départements, indépendamment de son département principal. La suppression du statut dans DingTalk le supprime à la synchronisation suivante dans NocoBase. Les modifications manuelles peuvent être écrasées.

La synchronisation complète et incrémentielle utilisent le même mappage. L'avatar, le poste et le matricule ne sont pas synchronisés actuellement.

## Dépannage

- En cas de données manquantes, vérifiez les trois permissions requises et le périmètre de données.
- En cas de téléphone ou d'e-mail manquant, vérifiez `fieldMobile` et `fieldEmail`.
- Les utilisateurs sans identifiant unique configuré sont ignorés.
- Pour Stream, recherchez `Dingtalk stream client starting`, `Dingtalk stream client started` et les erreurs de connexion dans les journaux.
- Pour le callback HTTP, vérifiez l'accessibilité, le Token et l'EncodingAESKey.
- Relancez une synchronisation complète après toute modification des permissions ou du périmètre.
