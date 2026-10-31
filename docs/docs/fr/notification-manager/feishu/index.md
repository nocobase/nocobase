---
pkg: '@nocobase/plugin-feishu'
---

# Notification : Feishu / Lark

## Introduction

Le plugin **Feishu / Lark** permet d'envoyer des notifications aux utilisateurs Feishu.

## Ajouter et configurer un authentificateur Feishu

Ajoutez d'abord un authentificateur Feishu dans NocoBase, voir [Authentification : Feishu / Lark](/auth-verification/auth-feishu/). Seuls les utilisateurs connectés via Feishu reçoivent les notifications système par Feishu.

Les messages passent par l'application Feishu de l'authentificateur choisi, qui exige en plus :

1. La capacité **Bot** ajoutée dans **Fonctionnalités de l'application** sur la plateforme ouverte — sans elle l'envoi échoue ;
2. La permission **Envoyer des messages en tant que bot** (`im:message:send_as_bot`) activée dans **Gestion des permissions**, avec publication d'une nouvelle version ;
3. Les destinataires dans le **périmètre de permissions de contacts** (disponibilité) de l'application.

Après toute modification, publiez une version et réessayez.

## Ajouter un canal de notification Feishu

Dans **Gestion des notifications** → canaux, ajoutez un canal **Feishu / Lark** et sélectionnez l'authentificateur configuré.

Configurez éventuellement le **Type d'ID du destinataire** (`open_id`, `user_id`, `union_id` ou `email`) ; par défaut celui du champ identifiant de l'authentificateur.

## Types de message

| Type | Description |
| --- | --- |
| Message texte | Texte brut. |
| Message Post | Texte enrichi au format Post Feishu. |
| Carte interactive | Carte Feishu configurée en JSON. |

Les destinataires sont résolus via l'identité Feishu liée à l'authentificateur (selon le type d'ID) ; sinon repli sur e-mail ou nom d'utilisateur.

## Nœud de notification dans le workflow

Sélectionnez le canal Feishu configuré dans le nœud de notification du workflow pour envoyer des messages aux utilisateurs du contexte.

## Dépannage

- Échec avec erreur de permissions (ex. code `230002`) : capacité **Bot**, permission **Envoyer des messages en tant que bot** et publication de la dernière version à vérifier.
- Échec destinataire invalide (erreurs `receive_id`) : utilisateur hors périmètre ou type d'ID incohérent avec le canal.
- Erreur générique uniquement : cherchez `FeishuNotificationChannel.send failed` dans les journaux serveur ; les versions récentes du plugin journalisent aussi le code et le message d'erreur Feishu.
