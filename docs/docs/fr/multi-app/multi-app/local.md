---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/multi-app/multi-app/local).
:::

# Mode mémoire partagée

## Introduction

Lorsque les utilisateurs souhaitent effectuer une séparation au niveau de l'application pour leurs activités, mais ne souhaitent pas introduire une architecture de déploiement et d'exploitation complexe, ils peuvent utiliser le mode multi-application en mémoire partagée.

Dans ce mode, plusieurs applications peuvent s'exécuter simultanément au sein d'une seule instance NocoBase. Chaque application est indépendante, peut se connecter à une base de données distincte, et peut être créée, démarrée et arrêtée individuellement. Cependant, elles partagent le même processus et le même espace mémoire, de sorte que l'utilisateur n'a toujours qu'une seule instance NocoBase à maintenir.

## Manuel d'utilisation

### Configuration des variables d'environnement

Avant d'utiliser la fonctionnalité multi-application, veuillez vous assurer que les variables d'environnement suivantes sont définies lors du démarrage de NocoBase :

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Création d'une application

Dans le menu des paramètres système, cliquez sur « Superviseur d'application » pour accéder à la page de gestion des applications.

![](https://static-docs.nocobase.com/202512291056215.png)

Cliquez sur le bouton « Ajouter » pour créer une nouvelle application.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Description des options de configuration

| Option de configuration | Description |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Nom de l'application** | Nom de l'application affiché dans l'interface. |
| **Identifiant de l'application** | Identifiant de l'application, unique au niveau mondial. |
| **Mode de démarrage** | - Démarrer lors de la première visite : l'application ne démarre que lorsque l'utilisateur y accède pour la première fois via l'URL.<br>- Démarrer avec l'application principale : l'application enfant démarre en même temps que l'application principale (ce qui augmente le temps de démarrage de l'application principale). |
| **Environnement** | En mode mémoire partagée, seul l'environnement local est disponible, soit `local`. |
| **Connexion à la base de données** | Utilisé pour configurer la source de données principale de l'application, prend en charge les trois méthodes suivantes :<br>- Nouvelle base de données : réutilise le service de base de données actuel pour créer une base de données indépendante.<br>- Nouvelle connexion de données : se connecte à d'autres services de base de données.<br>- Mode Schema : lorsque la source de données principale actuelle est PostgreSQL, crée un schéma indépendant pour l'application. |
| **Mise à niveau** | Si des données d'application NocoBase d'une version antérieure existent dans la base de données connectée, autorise ou non la mise à niveau automatique vers la version actuelle de l'application. |
| **Clé secrète JWT** | Génère automatiquement une clé secrète JWT indépendante pour l'application, garantissant que la session de l'application est indépendante de l'application principale et des autres applications. |
| **Nom de domaine personnalisé** | Configure un nom de domaine d'accès indépendant pour l'application. |

### Démarrage de l'application

Cliquez sur le bouton **Démarrer** pour lancer l'application enfant.

> Si vous avez coché _« Démarrer lors de la première visite »_ lors de la création, l'application démarrera automatiquement lors du premier accès.

![](https://static-docs.nocobase.com/202512291121065.png)

### Accès à l'application

Cliquez sur le bouton **Accéder**, l'application enfant s'ouvrira dans un nouvel onglet.

Par défaut, l'accès à l'application enfant se fait via `/apps/:appName/admin/`, par exemple :

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

En même temps, vous pouvez également configurer un nom de domaine indépendant pour l'application enfant. Vous devez faire pointer la résolution du nom de domaine vers l'adresse IP actuelle. Si vous utilisez Nginx, vous devez également ajouter le nom de domaine dans la configuration Nginx.

### Arrêt de l'application

Cliquez sur le bouton **Arrêter** pour arrêter l'application enfant.

![](https://static-docs.nocobase.com/202512291122113.png)

### État de l'application

Vous pouvez consulter l'état actuel de chaque application dans la liste.

![](https://static-docs.nocobase.com/202512291122339.png)

### Suppression de l'application

Cliquez sur le bouton **Supprimer** pour retirer l'application.

![](https://static-docs.nocobase.com/202512291122178.png)

## Foire aux questions

### 1. Gestion des plugins

Les plugins utilisables par les autres applications sont identiques à ceux de l'application principale (y compris les versions), mais les plugins peuvent être configurés et utilisés de manière indépendante.

### 2. Isolation de la base de données

Les autres applications peuvent configurer des bases de données indépendantes. Si vous souhaitez partager des données entre les applications, cela peut être réalisé via une source de données externe.

### 3. Sauvegarde et migration des données

Actuellement, la sauvegarde des données sur l'application principale ne prend pas en charge l'inclusion des données des autres applications (elle ne contient que les informations de base des applications). Les sauvegardes et migrations doivent être effectuées manuellement au sein de chaque application.

### 4. Déploiement et mise à jour

En mode mémoire partagée, les versions des autres applications suivront automatiquement les mises à niveau de l'application principale, garantissant ainsi automatiquement la cohérence des versions des applications.

### 5. Session de l'application

- Si l'application utilise une clé secrète JWT indépendante, la session de l'application est indépendante de l'application principale et des autres applications. Si vous accédez à différentes applications via des sous-chemins d'un même nom de domaine, comme le TOKEN de l'application est mis en cache dans le LocalStorage, vous devrez vous reconnecter lors du passage d'une application à l'autre. Il est recommandé de configurer des noms de domaine indépendants pour les différentes applications afin de réaliser une meilleure isolation des sessions.
- Si l'application n'utilise pas de clé secrète JWT indépendante, elle partagera la session de l'application principale. Après avoir accédé à d'autres applications dans le même navigateur, il n'est pas nécessaire de se reconnecter pour revenir à l'application principale. Cependant, cela présente un risque de sécurité : si les identifiants d'utilisateur (User ID) de différentes applications sont identiques, cela peut permettre à un utilisateur d'accéder sans autorisation aux données d'autres applications.