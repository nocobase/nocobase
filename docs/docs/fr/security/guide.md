---
title: "Guide de sécurité NocoBase"
description: "Guide de sécurité NocoBase : authentification, stratégie de Token JWT, APP_KEY, contrôle d'accès, chiffrement, restriction IP, politique de mot de passe, journal d'audit, stockage LocalStorage/SessionStorage."
keywords: "Sécurité NocoBase,authentification,stratégie de Token,contrôle d'accès,chiffrement,restriction IP,politique de mot de passe,journal d'audit,NocoBase"
---

:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Guide de sécurité NocoBase

NocoBase accorde une grande importance à la sécurité des données et de l'application, depuis la conception fonctionnelle jusqu'à la mise en œuvre. La plateforme intègre l'authentification des utilisateurs, le contrôle d'accès, le chiffrement des données et de nombreuses autres fonctions de sécurité, tout en permettant de configurer les politiques de sécurité avec souplesse selon vos besoins. Qu'il s'agisse de protéger les données des utilisateurs, de gérer les droits d'accès ou d'isoler les environnements de développement et de production, NocoBase fournit des outils et solutions pratiques. Ce guide a pour but de vous accompagner dans une utilisation sécurisée de NocoBase, afin de protéger vos données, vos applications et vos environnements tout en exploitant efficacement les fonctionnalités du système.

## Authentification

L'authentification permet d'identifier les utilisateurs, d'empêcher tout accès non autorisé au système et de garantir que les identités ne sont pas usurpées.

### Clé du Token

Par défaut, NocoBase utilise JWT (JSON Web Token) pour authentifier les API du serveur. Vous pouvez définir la clé du Token via la variable d'environnement `APP_KEY`. Veuillez gérer soigneusement cette clé et éviter toute fuite. Notez que la modification de `APP_KEY` invalide les anciens Tokens.

### Stratégie de Token

NocoBase prend en charge les politiques de sécurité suivantes pour les Tokens utilisateur :

| Paramètre | Description |
| --- | --- |
| Durée de session | Durée maximale d'une connexion. Pendant cette période, le Token est automatiquement renouvelé ; après expiration, l'utilisateur doit se reconnecter. |
| Durée de validité du Token | Durée de validité de chaque Token API émis. Une fois le Token expiré, si la session est toujours valide et le délai de rafraîchissement n'a pas été dépassé, le serveur émet automatiquement un nouveau Token ; sinon, l'utilisateur doit se reconnecter. (Chaque Token ne peut être rafraîchi qu'une fois.) |
| Délai de rafraîchissement après expiration du Token | Délai maximum autorisé pour rafraîchir un Token expiré. |

En général, nous recommandons aux administrateurs :

- De définir une durée de validité du Token courte pour limiter le temps d'exposition.
- De définir une durée de session raisonnable, plus longue que la validité du Token mais pas trop longue, afin d'équilibrer l'expérience utilisateur et la sécurité. Le mécanisme de rafraîchissement automatique préserve la continuité des sessions actives tout en réduisant le risque d'abus des sessions de longue durée.
- De définir un délai de rafraîchissement raisonnable, afin que pour les utilisateurs longuement inactifs, le Token expire naturellement sans qu'un nouveau ne soit émis, réduisant ainsi le risque d'abus de sessions inactives.

### Stockage du Token côté client

Par défaut, le Token utilisateur est stocké dans le LocalStorage du navigateur. Lors de la réouverture de la page après fermeture, l'utilisateur n'a pas besoin de se reconnecter si le Token est encore valide.

Si vous souhaitez que l'utilisateur se reconnecte à chaque ouverture de page, définissez la variable d'environnement `API_CLIENT_STORAGE_TYPE=sessionStorage` pour stocker le Token dans le SessionStorage du navigateur.

### Politique de mot de passe

> Édition Pro et supérieures

NocoBase prend en charge des règles de mot de passe et des politiques de verrouillage en cas de tentatives de connexion par mot de passe, afin de renforcer la sécurité des applications NocoBase utilisant l'authentification par mot de passe. Consultez [Politique de mot de passe](./password-policy/index.md) pour comprendre chaque option.

#### Règles de mot de passe

| Paramètre | Description |
| --- | --- |
| **Longueur du mot de passe** | Longueur minimale exigée ; longueur maximale 64 caractères. |
| **Complexité du mot de passe** | Définit les types de caractères que le mot de passe doit contenir. |
| **Le mot de passe ne peut pas contenir le nom d'utilisateur** | Indique si le mot de passe peut contenir le nom de l'utilisateur courant. |
| **Mémoriser l'historique des mots de passe** | Nombre de derniers mots de passe utilisés que l'utilisateur ne pourra pas réutiliser. |

#### Configuration de l'expiration du mot de passe

| Paramètre | Description |
| --- | --- |
| **Durée de validité du mot de passe** | Durée pendant laquelle un mot de passe est valide. L'utilisateur doit changer son mot de passe avant expiration pour réinitialiser le compteur. À défaut, l'ancien mot de passe ne peut plus être utilisé et l'administrateur doit le réinitialiser.<br>Si d'autres méthodes d'authentification sont configurées, l'utilisateur peut s'en servir. |
| **Canal de notification d'expiration** | Dans les 10 jours précédant l'expiration, l'utilisateur reçoit une notification à chaque connexion. |

#### Sécurité de la connexion par mot de passe

| Paramètre | Description |
| --- | --- |
| **Nombre maximum de tentatives de connexion invalides** | Nombre maximum de tentatives de connexion autorisées dans l'intervalle défini. |
| **Intervalle (secondes) de comptage des tentatives invalides** | Intervalle, en secondes, sur lequel le nombre maximum de tentatives invalides est calculé. |
| **Durée de verrouillage (secondes)** | Durée pendant laquelle l'utilisateur est verrouillé après avoir dépassé le nombre maximum de tentatives invalides (0 signifie pas de limite).<br>Pendant le verrouillage, l'utilisateur ne peut accéder au système par aucun moyen d'authentification, y compris les API Keys. |

En général, nous recommandons :

- De définir des règles de mot de passe robustes pour limiter le risque de devinette ou d'attaque par force brute.
- De définir une durée de validité raisonnable afin d'imposer un changement régulier de mot de passe.
- De combiner le nombre de tentatives invalides et l'intervalle de temps pour limiter les tentatives de connexion à haute fréquence et empêcher les attaques par force brute.
- Dans les contextes très sensibles, de définir une durée de verrouillage raisonnable. Notez toutefois qu'un verrouillage peut être détourné : un attaquant pourrait délibérément saisir de mauvais mots de passe pour bloquer un compte. En pratique, combinez avec des restrictions IP et la limitation de fréquence des API.
- De modifier l'identifiant, l'e-mail et le mot de passe par défaut du compte root pour éviter toute exploitation malveillante.
- Comme l'expiration du mot de passe ou le verrouillage du compte empêche l'accès au système, y compris pour le compte administrateur, nous vous suggérons de configurer plusieurs comptes habilités à réinitialiser les mots de passe et déverrouiller les utilisateurs.

![](https://static-docs.nocobase.com/202501031618900.png)

### Verrouillage des utilisateurs

> Édition Pro et supérieures, inclus dans le plugin de politique de mot de passe

Gérez les utilisateurs verrouillés pour avoir dépassé le nombre de tentatives invalides : vous pouvez les déverrouiller manuellement ou ajouter des utilisateurs suspects à la liste de verrouillage. Un utilisateur verrouillé ne peut plus accéder au système par aucun moyen d'authentification, y compris les API Keys.

![](https://static-docs.nocobase.com/202501031618399.png)

### Clés API

NocoBase permet d'appeler les API du système à l'aide de clés API. Vous pouvez créer des clés API dans la configuration du plugin API Keys.

- Associez chaque clé API au bon rôle et vérifiez les permissions associées.
- Évitez toute fuite de la clé API durant son utilisation.
- Nous recommandons généralement de définir une durée de validité plutôt que de choisir « Ne jamais expirer ».
- En cas d'utilisation suspecte, vous pouvez supprimer la clé API correspondante pour l'invalider.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On (SSO)

> Plugin commercial

NocoBase propose une riche collection de plugins SSO et prend en charge OIDC, SAML 2.0, LDAP, CAS et d'autres protocoles courants. NocoBase fournit également une interface complète pour étendre les méthodes d'authentification, ce qui permet d'intégrer rapidement de nouveaux types. Vous pouvez ainsi connecter facilement votre IdP existant à NocoBase, centraliser la gestion des identités et améliorer la sécurité.
![](https://static-docs.nocobase.com/202501031619427.png)

### Authentification à deux facteurs (Two-factor authentication)

> Édition Enterprise

L'authentification à deux facteurs exige un second élément d'identification lorsque l'utilisateur se connecte par mot de passe, par exemple un code à usage unique envoyé sur un appareil de confiance, afin de confirmer l'identité et de réduire les risques liés à une éventuelle fuite du mot de passe.

### Contrôle d'accès par IP

> Édition Enterprise

NocoBase prend en charge la liste blanche et la liste noire des adresses IP des utilisateurs.

- Dans les environnements à fortes exigences de sécurité, vous pouvez définir une liste blanche pour n'autoriser que certaines IP ou plages, afin de bloquer toute connexion non autorisée.
- Dans un contexte d'accès public, si l'administrateur détecte des accès anormaux, il peut définir une liste noire pour bloquer les IP malveillantes connues ou suspectes, réduisant ainsi le risque d'analyses ou d'attaques par force brute.
- Les requêtes refusées sont consignées dans les journaux.

## Contrôle d'accès

En définissant différents rôles et en leur attribuant les permissions correspondantes, vous pouvez contrôler de manière fine l'accès des utilisateurs aux ressources. L'administrateur doit configurer ces éléments en fonction des besoins réels pour réduire le risque de fuite des ressources.

### Compte Root

Lors de la première installation de NocoBase, un utilisateur root est initialisé. Nous vous recommandons de modifier ses informations via les variables d'environnement pour éviter qu'il ne soit exploité de façon malveillante.

- `INIT_ROOT_USERNAME` — nom d'utilisateur root
- `INIT_ROOT_EMAIL` — adresse e-mail du compte root
- `INIT_ROOT_PASSWORD` — mot de passe root ; choisissez un mot de passe fort.

Par la suite, créez et utilisez d'autres comptes administrateurs et évitez d'utiliser directement le compte root.

### Rôles et permissions

NocoBase contrôle l'accès aux ressources en définissant des rôles, en leur accordant des permissions et en associant les utilisateurs aux rôles correspondants. Chaque utilisateur peut posséder plusieurs rôles et basculer entre eux pour accéder aux ressources sous différents angles. Si le plugin Department est installé, vous pouvez également associer les rôles aux départements, et l'utilisateur héritera des rôles attachés à son département.

![](https://static-docs.nocobase.com/202501031620965.png)

### Permissions de configuration système

Les permissions de configuration système comprennent :

- Autoriser la configuration de l'interface
- Autoriser l'installation, l'activation et la désactivation des plugins
- Autoriser la configuration des plugins
- Autoriser le vidage du cache et le redémarrage de l'application
- Permissions de configuration de chaque plugin

### Permissions de menu

Les permissions de menu contrôlent l'accès aux différentes pages de menu, à la fois sur le bureau et le mobile.
![](https://static-docs.nocobase.com/202501031620717.png)

### Permissions de données

NocoBase offre un contrôle fin des permissions d'accès aux données du système, garantissant que chaque utilisateur ne peut accéder qu'aux données qui lui sont nécessaires et empêchant tout accès non autorisé ou fuite.

#### Contrôle global

![](https://static-docs.nocobase.com/202501031620866.png)

#### Contrôle au niveau de la table et du Field

![](https://static-docs.nocobase.com/202501031621047.png)

#### Contrôle de la portée des données

Définit la portée des données sur lesquelles l'utilisateur peut agir. Notez que cette portée diffère de celle configurée dans un Block : la portée d'un Block sert principalement de filtre côté frontend. Pour contrôler strictement les permissions d'accès, configurez-la ici, côté serveur.

![](https://static-docs.nocobase.com/202501031621712.png)

## Sécurité des données

NocoBase fournit des mécanismes efficaces pour assurer la sécurité des données lors du stockage et des sauvegardes.

### Stockage des mots de passe

NocoBase chiffre les mots de passe avec l'algorithme scrypt avant stockage, offrant une bonne résistance aux attaques matérielles à grande échelle.

### Variables d'environnement et clés

Lorsque vous utilisez des services tiers dans NocoBase, nous recommandons de configurer leurs clés sous forme de variables d'environnement, chiffrées. Cela facilite leur utilisation dans différents environnements et améliore la sécurité. Consultez la documentation pour plus de détails.

:::warning
Par défaut, les clés sont chiffrées avec AES-256-CBC. NocoBase génère automatiquement une clé de 32 octets et la stocke dans storage/.data/environment/aes_key.dat. Conservez ce fichier en lieu sûr pour éviter qu'il ne soit dérobé. En cas de migration des données, ce fichier doit être migré également.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Stockage de fichiers

Pour stocker des fichiers sensibles, nous recommandons un service de stockage cloud compatible S3, combiné avec le plugin commercial File storage: S3 (Pro), pour assurer une lecture/écriture privée. Pour une utilisation en intranet, optez pour MinIO ou une autre solution compatible S3 déployable en privé.

![](https://static-docs.nocobase.com/202501031623549.png)

### Sauvegarde de l'application

Pour assurer la sécurité de vos données et éviter toute perte, nous recommandons une sauvegarde régulière de la base de données.

Les utilisateurs de l'édition Open Source peuvent se référer à https://www.nocobase.com/en/blog/nocobase-backup-restore pour utiliser des outils de base de données et conserver les fichiers de sauvegarde en lieu sûr afin d'éviter toute fuite.

Les utilisateurs Pro ou supérieurs peuvent utiliser le Backup Manager, qui propose :

- Sauvegarde automatique périodique : sauvegarde planifiée pour gagner du temps et améliorer la sécurité.
- Synchronisation des sauvegardes vers un stockage cloud : isole les sauvegardes du serveur d'application, afin de prévenir leur perte en cas de panne du serveur.
- Chiffrement des fichiers de sauvegarde : protège vos données par mot de passe en cas de fuite des sauvegardes.

![](https://static-docs.nocobase.com/202501031623107.png)

## Sécurité de l'environnement d'exécution

Un déploiement correct de NocoBase et la sécurisation de l'environnement d'exécution sont essentiels à la sécurité globale de l'application.

### Déploiement HTTPS

Pour empêcher les attaques de type Man-in-the-Middle, nous recommandons d'ajouter un certificat SSL/TLS à votre site NocoBase, afin de protéger les données pendant leur transport.

### Chiffrement de la transmission API

> Édition Enterprise

Dans les environnements aux exigences de sécurité strictes, NocoBase prend en charge le chiffrement des requêtes et réponses API, évitant la transmission en clair et augmentant la difficulté d'analyse des données.

### Déploiement on-premise

Par défaut, NocoBase ne communique pas avec des services tiers et l'équipe NocoBase ne collecte aucune information utilisateur. Une connexion au serveur NocoBase n'est nécessaire que dans deux cas :

1. Téléchargement automatique des plugins commerciaux via la plateforme NocoBase Service.
2. Validation et activation en ligne des applications commerciales.

Si vous acceptez de perdre un peu de confort, ces deux opérations peuvent aussi être réalisées hors ligne, sans connexion au serveur NocoBase.

NocoBase prend en charge un déploiement entièrement en intranet, voir

- https://www.nocobase.com/en/blog/load-docker-image

### Isolation multi-environnements

> Édition Pro et supérieures

En pratique, nous recommandons aux entreprises d'isoler les environnements de test et de production afin de garantir la sécurité des données et de l'environnement d'exécution en production. Le plugin Migration Manager permet de migrer les données d'application entre environnements.

![](https://static-docs.nocobase.com/202501031627729.png)

## Audit et surveillance

### Journal d'audit

> Édition Enterprise

Le journal d'audit de NocoBase enregistre l'activité des utilisateurs au sein du système. En consignant les opérations clés et les accès, l'administrateur peut :

- Vérifier les IP, appareils et horaires des opérations pour repérer rapidement les comportements anormaux.
- Tracer l'historique des opérations sur les ressources de données.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Journaux d'application

NocoBase fournit plusieurs types de journaux pour comprendre l'état du système et son comportement, repérer rapidement les problèmes et garantir sécurité et contrôle sous différents angles. Principaux types :

- Journal des requêtes : journaux des requêtes API, incluant URL, méthode HTTP, paramètres, temps de réponse et code de statut.
- Journal système : événements liés à l'application, comme le démarrage du service, les changements de configuration, les erreurs et les opérations clés.
- Journal SQL : instructions SQL et leur durée, couvrant SELECT, UPDATE, INSERT, DELETE, etc.
- Journal des Workflows : journal d'exécution des Workflows, incluant durée, informations d'exécution et erreurs.
