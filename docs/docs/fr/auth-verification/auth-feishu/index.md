---
pkg: '@nocobase/plugin-feishu'
---

# Authentification : Feishu / Lark

## Introduction

Le plugin **Feishu / Lark** permet aux utilisateurs de se connecter à NocoBase avec leur compte Feishu ou Lark, avec connexion automatique en option.

## Activer le plugin

Feishu / Lark est un plugin commercial. Installez-le et activez-le dans le gestionnaire de plugins, avec le plugin **Authentification des utilisateurs**.

## Créer une application sur la plateforme ouverte

Accédez à la [plateforme ouverte Feishu](https://open.feishu.cn/) et créez une **application interne d'entreprise** (pour Lark, utilisez la [plateforme ouverte Lark](https://open.larksuite.com/)). Notez l'**App ID** et l'**App Secret**.

Aucune permission d'API supplémentaire n'est requise pour la connexion. Pour la synchronisation des contacts, voir [Synchroniser les données utilisateur depuis Feishu](/users-permissions/sync/sources/feishu).

## Configurer l'URL de redirection

Dans **Paramètres de sécurité** → **URL de redirection** de l'application, ajoutez l'URL de rappel affichée par NocoBase :

```
https://votre-domaine/api/feishu:redirect
```

Le plus simple est de copier l'**URL de redirection** affichée sur la page de configuration de l'authentificateur dans NocoBase.

:::warning
Si NocoBase est déployé sous un sous-chemin (ex. `APP_PUBLIC_PATH=/nocobase/`), l'URL de rappel inclut le préfixe, ex. `https://votre-domaine/nocobase/api/feishu:redirect`. L'URL de la liste blanche doit correspondre exactement à l'URL réelle.
:::

## Ajouter l'authentification Feishu dans NocoBase

Dans **Authentification des utilisateurs**, ajoutez un authentificateur **Feishu / Lark** :

| Champ | Description |
| --- | --- |
| Inscription automatique | Crée un compte à la première connexion. Activée par défaut. |
| Région | `Feishu China` ou `Lark Global`. |
| App ID / App Secret | Identifiants de l'application Feishu. Variables d'environnement et secrets pris en charge. |
| Origin | Adresse publique du site, ex. `https://example.com`. Protocole et domaine uniquement, sans chemin (barre finale facultative) ; vide = adresse de la requête courante. |
| Champ d'identifiant unique | Clé d'identité de l'utilisateur, voir ci-dessous. |
| Connexion automatique | Connexion silencieuse à l'ouverture dans Feishu, voir ci-dessous. |

## Choisir le champ d'identifiant unique

| Champ | Description |
| --- | --- |
| `union_id` | Recommandé. Stable et commun à toutes les applications du même compte développeur. |
| `open_id` | Unique par application ; change si l'application change. |
| `user_id` | Unique dans le tenant ; risque de collision en multi-tenant. |
| `mobile` / `email` | Modifiables et pouvant être vides ; inadaptés comme identifiant. |

Gardez ce choix stable une fois des utilisateurs connectés. Si vous utilisez la synchronisation, sélectionnez le même champ dans la source.

## Connexion et inscription automatique

L'utilisateur clique sur **Feishu / Lark** sur la page de connexion pour terminer OAuth. Avec l'inscription automatique :

- les utilisateurs sont rapprochés ou créés selon le **champ d'identifiant unique** ;
- téléphone, e-mail et surnom ne sont remplis que si le profil est vide ; les valeurs existantes ne sont jamais écrasées.

## Connexion automatique

Avec **Connexion automatique**, ouvrir l'application dans le client Feishu lance OAuth sans cliquer. Un seul authentificateur Feishu peut l'activer à la fois.

Conditions :

- l'URL de rappel figure dans la liste blanche des **URL de redirection** ;
- l'application est publiée et l'utilisateur est dans le périmètre de disponibilité ;
- l'application est ouverte dans le client Feishu.

La première utilisation affiche une page de consentement unique ; ensuite la connexion est silencieuse. Dans le navigateur système, pas de connexion automatique — comportement attendu.

## Accès depuis l'espace Feishu (facultatif)

Configurez la page d'accueil bureau/mobile sous **Fonctionnalités de l'application** → **Application web** pour que les utilisateurs ouvrent NocoBase depuis l'espace Feishu. L'URL doit correspondre à l'adresse réelle (préfixe de sous-chemin inclus).
