---
pkg: "@nocobase/plugin-multi-app-manager"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Multi-applications


## Introduction

Le **plugin Multi-applications** vous permet de créer et de gérer dynamiquement plusieurs applications indépendantes, sans nécessiter de déploiement séparé. Chaque sous-application est une instance entièrement indépendante, dotée de sa propre base de données, de ses plugins et de sa configuration.

#### Cas d'utilisation
- **Multi-location** : Offrez des instances d'application indépendantes, où chaque client dispose de ses propres données, configurations de plugins et système de permissions.
- **Systèmes principaux et sous-systèmes pour différents domaines d'activité** : Un système de grande envergure composé de plusieurs applications plus petites déployées indépendamment.


:::warning
Le plugin Multi-applications ne fournit pas en soi de capacités de partage d'utilisateurs.
Si vous avez besoin de partager des utilisateurs entre plusieurs applications, vous pouvez l'utiliser en combinaison avec le **[plugin d'authentification](/auth-verification)**.
:::


## Installation

Dans le gestionnaire de plugins, trouvez le plugin **Multi-applications** et activez-le.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)


## Guide d'utilisation


### Création d'une sous-application

Dans le menu des paramètres système, cliquez sur « Multi-applications » pour accéder à la page de gestion des multi-applications :

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Cliquez sur le bouton « Ajouter » pour créer une nouvelle sous-application :

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Description des champs du formulaire

* **Nom** : Identifiant de la sous-application, unique globalement.
* **Nom d'affichage** : Le nom de la sous-application tel qu'il apparaît dans l'interface.
* **Mode de démarrage** :
  * **Démarrer à la première visite** : La sous-application ne démarre que lorsqu'un utilisateur y accède pour la première fois via une URL.
  * **Démarrer avec l'application principale** : La sous-application démarre en même temps que l'application principale (cela augmentera le temps de démarrage de l'application principale).
* **Port** : Le numéro de port utilisé par la sous-application lors de son exécution.
* **Domaine personnalisé** : Configurez un sous-domaine indépendant pour la sous-application.
* **Épingler au menu** : Épinglez l'entrée de la sous-application sur le côté gauche de la barre de navigation supérieure.
* **Connexion à la base de données** : Permet de configurer la source de données pour la sous-application, en prenant en charge les trois méthodes suivantes :
  * **Nouvelle base de données** : Réutilisez le service de données actuel pour créer une base de données indépendante.
  * **Nouvelle connexion de données** : Configurez un service de base de données entièrement nouveau.
  * **Mode Schema** : Créez un schéma indépendant pour la sous-application dans PostgreSQL.
* **Mise à niveau** : Si la base de données connectée contient une ancienne version de la structure de données NocoBase, elle sera automatiquement mise à niveau vers la version actuelle.


### Démarrage et arrêt d'une sous-application

Cliquez sur le bouton **Démarrer** pour lancer la sous-application ;
> Si l'option *« Démarrer à la première visite »* a été cochée lors de la création, elle démarrera automatiquement lors de la première visite.

Cliquez sur le bouton **Afficher** pour ouvrir la sous-application dans un nouvel onglet.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)


### État et journaux de la sous-application

Dans la liste, vous pouvez consulter l'utilisation de la mémoire et du CPU de chaque application.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Cliquez sur le bouton **Journaux** pour consulter les journaux d'exécution de la sous-application.
> Si la sous-application est inaccessible après le démarrage (par exemple, en raison d'une base de données corrompue), vous pouvez utiliser les journaux pour résoudre le problème.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)


### Suppression d'une sous-application

Cliquez sur le bouton **Supprimer** pour retirer la sous-application.
> Lors de la suppression, vous pouvez choisir de supprimer également la base de données. Veuillez procéder avec prudence, car cette action est irréversible.


### Accès à une sous-application
Par défaut, les sous-applications sont accessibles via `/_app/:appName/admin/`, par exemple :
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
Vous pouvez également configurer un sous-domaine indépendant pour la sous-application. Vous devrez résoudre le domaine vers l'adresse IP actuelle, et si vous utilisez Nginx, vous devrez également ajouter le domaine à la configuration Nginx.


### Gestion des sous-applications via la ligne de commande

Dans le répertoire racine du projet, vous pouvez utiliser la ligne de commande pour gérer les instances de sous-applications via **PM2** :

```bash
yarn nocobase pm2 list              # Afficher la liste des instances en cours d'exécution
yarn nocobase pm2 stop [appname]    # Arrêter un processus de sous-application spécifique
yarn nocobase pm2 delete [appname]  # Supprimer un processus de sous-application spécifique
yarn nocobase pm2 kill              # Terminer de force tous les processus démarrés (peut inclure l'instance de l'application principale)
```

### Migration des données de l'ancienne fonctionnalité Multi-applications

Accédez à l'ancienne page de gestion des multi-applications et cliquez sur le bouton **Migrer les données vers la nouvelle fonctionnalité Multi-applications** pour effectuer la migration des données.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)


## Questions fréquentes

#### 1. Gestion des plugins
Les sous-applications peuvent utiliser les mêmes plugins que l'application principale (y compris les versions), mais elles peuvent être configurées et utilisées indépendamment.

#### 2. Isolation de la base de données
Les sous-applications peuvent être configurées avec des bases de données indépendantes. Si vous souhaitez partager des données entre les applications, vous pouvez le faire via des sources de données externes.

#### 3. Sauvegarde et migration des données
Actuellement, les sauvegardes de données dans l'application principale n'incluent pas les données des sous-applications (seulement les informations de base des sous-applications). Vous devez sauvegarder et migrer manuellement les données au sein de chaque sous-application.

#### 4. Déploiement et mises à jour
La version d'une sous-application sera automatiquement mise à niveau en même temps que l'application principale, garantissant ainsi la cohérence des versions entre l'application principale et les sous-applications.

#### 5. Gestion des ressources
La consommation de ressources de chaque sous-application est globalement la même que celle de l'application principale. Actuellement, une seule application utilise environ 500 à 600 Mo de mémoire.