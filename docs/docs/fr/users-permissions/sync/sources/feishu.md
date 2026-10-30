---
pkg: '@nocobase/plugin-feishu'
title: "Synchroniser les données utilisateur depuis Feishu"
description: "Synchronisez les utilisateurs et départements Feishu vers NocoBase et recevez les changements incrémentaux via callback HTTP ou mode Stream."
keywords: "Feishu,Lark,synchronisation utilisateur,synchronisation département,mode Stream,callback d'événement,NocoBase"
---

# Synchroniser les données utilisateur depuis Feishu

<PluginInfo commercial="true" name="feishu"></PluginInfo>

## Introduction

Le plugin **Feishu / Lark** synchronise les utilisateurs et départements d'une organisation Feishu vers NocoBase. Synchronisation complète à la demande et mises à jour incrémentales via callback HTTP ou connexion Stream.

## Avant de commencer

1. Installez et activez les plugins **Feishu / Lark** et **Synchronisation des données utilisateur**.
2. Créez une application interne sur la plateforme ouverte Feishu, voir [Authentification : Feishu / Lark](/auth-verification/auth-feishu/).
3. Accordez les permissions de contacts et configurez le périmètre de visibilité comme décrit ci-dessous.

## Permissions de contacts et périmètre de visibilité

Dans **Gestion des permissions** de l'application, activez :

| Permission | Scope | Requis | Objectif |
| --- | --- | --- | --- |
| Obtenir les informations de base de l'utilisateur | `contact:user.base:readonly` | Oui | Lit noms, `open_id` / `union_id` et autres champs de base. |
| Obtenir les informations de base du département | `contact:department.base:readonly` | Oui | Lit noms et hiérarchie des départements. |
| Obtenir la structure organisationnelle des départements | `contact:department.organize:readonly` | Oui | Parcourt les sous-départements ; lit les responsables. |
| Obtenir la structure organisationnelle de l'utilisateur | `contact:user.department:readonly` | Oui | Lit départements et département principal. |
| Obtenir le user ID | `contact:user.id:readonly` | Si identifiant `user_id` | Lit le champ `user_id`. |
| Obtenir le téléphone de l'utilisateur | `contact:user.phone:readonly` | Pour les téléphones | Lit les numéros ; requis si identifiant `mobile`. |
| Obtenir l'e-mail de l'utilisateur | `contact:user.email:readonly` | Pour les e-mails | Lit les e-mails ; requis si identifiant `email`. |

Configurez ensuite le **périmètre de permissions de contacts** (départements et membres accessibles) :

1. Dans **Configuration développement → Permissions**, cliquez sur **Configurer** dans la colonne « Périmètre de données accessible » (l'activation d'une permission de contacts y mène automatiquement).
2. Choisissez les départements et membres ; recommandé : **Tous les membres** au départ, puis restreindre si besoin.
3. Cliquez sur **OK**.

:::warning
Sans **Obtenir les informations de base de l'utilisateur**, l'API ne renvoie pas les noms et les surnoms synchronisés restent vides. Le périmètre de permissions de contacts et la « disponibilité de l'application » (qui peut l'utiliser) sont deux réglages indépendants ; seul le premier affecte la synchronisation. Les permissions d'API déterminent les champs lisibles, le périmètre les départements et utilisateurs lisibles ; configurez les deux. Après modification, relancez une synchronisation complète. L'abonnement aux événements ne remplace pas les permissions de lecture : à chaque événement, NocoBase interroge l'API Feishu.
:::

## Ajouter une source de synchronisation Feishu

Dans **Utilisateurs et permissions** → **Synchronisation**, ajoutez une source de type **Feishu / Lark** :

| Champ | Description |
| --- | --- |
| Nom de la source | Nom unique de la source. |
| Activé | Démarre la réception d'événements et autorise les tâches de synchronisation. |
| Région | `Feishu China` ou `Lark Global`. |
| App ID / App Secret | Identifiants de l'application. Variables d'environnement et secrets pris en charge. |
| Champ d'identifiant unique | `user_id`, `union_id`, `open_id`, `mobile` ou `email` ; `union_id` recommandé. Doit correspondre à l'authentificateur ; utilisateurs sans valeur ignorés. |
| Mode de réception des événements | **Callback HTTP** ou **mode Stream**, voir ci-dessous. |

Enregistrez et activez la source, puis cliquez **Synchroniser** pour la première synchronisation complète.

## Choisir le mode de réception

### Mode Stream

Le mode Stream maintient une connexion WebSocket initiée par le serveur NocoBase. Aucune URL publique, token ni clé de chiffrement requis.

1. Sélectionnez **mode Stream** dans NocoBase, enregistrez et activez.
2. Sur la plateforme, dans **Événements et callbacks**, passez la réception en **connexion longue (WebSocket)** et abonnez-vous aux événements de contacts.

La connexion démarre automatiquement (reconnexion automatique) et se renouvelle ou se ferme selon le cycle de vie de la source.

:::info
Le mode Stream ne nécessite ni adresse entrante publique ni proxy inverse ; adapté aux déploiements intranet. Vérifiez la connexion dans les journaux avec `Feishu stream client`.
:::

### Callback HTTP

1. Sélectionnez **callback HTTP** et configurez le **Verification Token** et éventuellement l'**Encrypt Key** — au moins un requis.
2. Enregistrez et copiez l'**URL de callback d'événements** affichée.
3. Sur la plateforme, dans **Événements et callbacks** → **Configuration des événements**, choisissez l'envoi au serveur, collez l'URL et abonnez-vous aux événements de contacts.

L'URL doit être joignable par Feishu (HTTPS en production). Avec Encrypt Key, le contenu est chiffré.

:::warning
Sans Verification Token ni Encrypt Key, les requêtes sont rejetées (401). Une source passée en mode Stream ferme le endpoint HTTP (403).
:::

## Événements incrémentaux pris en charge

| Événement | Traitement dans NocoBase |
| --- | --- |
| `contact.user.created_v3` | Créer ou mettre à jour l'utilisateur. |
| `contact.user.updated_v3` | Mettre à jour l'utilisateur. |
| `contact.user.deleted_v3` | Supprimer l'utilisateur synchronisé. |
| `contact.department.created_v3` | Créer ou mettre à jour le département. |
| `contact.department.updated_v3` | Mettre à jour le département. |
| `contact.department.deleted_v3` | Supprimer le département synchronisé. |

Les utilisateurs avec le rôle Root ne sont jamais supprimés par la synchronisation.

## Champs synchronisés

### Champs de département

| Champ Feishu | Champ / usage NocoBase |
| --- | --- |
| `open_department_id` | Identifiant source du département. |
| `name` | Nom du département. |
| `parent_department_id` | Département parent pour la hiérarchie ; hors périmètre = synchronisé comme racine. |

### Champs d'utilisateur

| Champ Feishu | Champ / usage NocoBase |
| --- | --- |
| Valeur du champ identifiant | Identifiant source et nom d'utilisateur issus du **champ d'identifiant unique**. |
| `name`, sinon `en_name` | Surnom ; vide si les deux manquent. |
| `mobile` | Téléphone. |
| `email` | E-mail. |
| `department_ids` | Départements de l'utilisateur ; dans le périmètre uniquement. |
| `main_department_id` | Département principal. |

### Responsables de département

Les responsables issus des données de département sont synchronisés comme propriétaires : un utilisateur peut diriger plusieurs départements, pas nécessairement le sien. Seuls les départements du périmètre participent. Un responsable retiré côté Feishu l'est à la prochaine synchronisation ; les modifications manuelles peuvent être écrasées.

Avatar, poste, matricule et autres champs ne sont pas synchronisés actuellement.

## Dépannage

- Résultats vides ou départements manquants : vérifiez permissions et périmètre.
- Surnoms vides : activez **Obtenir les informations de base de l'utilisateur** (`contact:user.base:readonly`) et resynchronisez.
- Utilisateurs ignorés : valeur d'identifiant manquante ou incohérence avec l'authentificateur.
- Callback HTTP 401 : Verification Token / Encrypt Key absents ou incorrects ; 403 : source passée en mode Stream.
- Erreurs `redirect_uri` ou d'URL de callback : correspondance exacte avec l'URL affichée par NocoBase (préfixe `APP_PUBLIC_PATH` inclus).
- Échec par limite de fréquence API : attendez la levée de la limite et relancez manuellement.
