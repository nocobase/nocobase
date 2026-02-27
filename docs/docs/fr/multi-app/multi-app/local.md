---
pkg: '@nocobase/plugin-app-supervisor'
---

# Mode mémoire partagée

## Introduction

Lorsque vous souhaitez séparer les domaines métier au niveau application sans complexifier l'infrastructure, vous pouvez utiliser le mode multi-application en mémoire partagée.

Dans ce mode, plusieurs applications s'exécutent dans une seule instance NocoBase. Chaque application reste indépendante (base dédiée, création/démarrage/arrêt séparés), mais partage le même processus et la même mémoire.

## Guide d'utilisation

### Variables d'environnement

Avant d'activer les fonctionnalités multi-applications, vérifiez les variables suivantes au démarrage de NocoBase :

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Créer une application

Dans **System Settings**, cliquez sur **App supervisor** pour accéder à la gestion des applications.

![](https://static-docs.nocobase.com/202512291056215.png)

Cliquez sur **Add** pour créer une nouvelle application.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Options de configuration

| Option | Description |
| --- | --- |
| **Nom d'affichage** | Nom affiché dans l'interface |
| **ID application** | Identifiant unique global |
| **Mode de démarrage** | - Démarrer à la première visite : au premier accès URL<br>- Démarrer avec l'application principale : au démarrage de l'app principale (augmente le temps de démarrage) |
| **Environnement** | En mode mémoire partagée, seul `local` est disponible |
| **Base de données** | Configure la source principale :<br>- Nouvelle base : réutilise le service DB actuel et crée une base dédiée<br>- Nouvelle connexion : se connecte à un autre service DB<br>- Nouveau schéma : avec PostgreSQL, crée un schéma dédié |
| **Upgrade** | Autoriser la mise à niveau automatique des données NocoBase plus anciennes |
| **Secret JWT** | Génère un secret JWT indépendant pour isoler les sessions |
| **Domaine personnalisé** | Configure un domaine d'accès dédié |

### Démarrer une application

Cliquez sur **Start**.

> Si _Start on first visit_ a été sélectionné à la création, l'application démarre automatiquement au premier accès.

![](https://static-docs.nocobase.com/202512291121065.png)

### Accéder à une application

Cliquez sur **Visit** pour ouvrir l'application dans un nouvel onglet.

Par défaut, l'URL est `/apps/:appName/admin/`, par exemple :

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Vous pouvez aussi configurer un domaine dédié. Le domaine doit pointer vers l'IP courante ; avec Nginx, il faut également l'ajouter à la configuration.

### Arrêter une application

Cliquez sur **Stop**.

![](https://static-docs.nocobase.com/202512291122113.png)

### État des applications

L'état courant de chaque application est affiché dans la liste.

![](https://static-docs.nocobase.com/202512291122339.png)

### Supprimer une application

Cliquez sur **Delete**.

![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

### 1. Gestion des plugins

Les applications utilisent les mêmes plugins (et versions) que l'application principale, mais la configuration reste isolée par application.

### 2. Isolation base de données

Chaque application peut utiliser une base indépendante. Pour partager des données, utilisez des sources externes.

### 3. Sauvegarde et migration

Les sauvegardes faites dans l'application principale n'incluent pas les données des autres applications (uniquement des métadonnées de base). Sauvegarde/migration doivent être faites dans chaque application.

### 4. Déploiement et mises à jour

En mode mémoire partagée, les versions des applications suivent automatiquement celle de l'application principale.

### 5. Sessions applicatives

- Avec un secret JWT indépendant, la session est isolée de l'application principale et des autres applications. En sous-chemins d'un même domaine, un changement d'application peut imposer une reconnexion (token LocalStorage). Des domaines séparés sont recommandés.
- Sans secret JWT indépendant, la session est partagée avec l'application principale. Pratique, mais plus risqué : en cas d'ID utilisateur qui se chevauchent, des accès inter-applications non autorisés peuvent survenir.
