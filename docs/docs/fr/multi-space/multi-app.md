---
pkg: "@nocobase/plugin-multi-app-manager"
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/multi-space/multi-app).
:::

# Multi-app

## Présentation

Le plugin **Multi-app** permet la création et la gestion dynamique de plusieurs applications indépendantes sans nécessiter de déploiements séparés. Chaque sous-application est une instance totalement indépendante disposant de sa propre base de données, de ses propres plugins et de ses propres configurations.

#### Cas d'utilisation
- **Multi-location (Multi-tenancy)** : Fournit des instances d'application indépendantes où chaque client possède ses propres données, configurations de plugins et systèmes de permissions.
- **Systèmes principaux et secondaires pour différents domaines d'activité** : Un système de grande envergure composé de plusieurs petites applications déployées indépendamment.

:::warning
Le plugin Multi-app ne fournit pas de capacités de partage d'utilisateurs par lui-même.  
Pour permettre l'intégration des utilisateurs entre plusieurs applications, il peut être utilisé en conjonction avec le **[plugin d'authentification](/auth-verification)**.
:::

## Installation

Recherchez le plugin **Multi-app** dans le gestionnaire de plugins et activez-le.

![](https://static-docs.nocobase.com/multi-app/Plugin-manager-NocoBase-10-16-2025_03_07_PM.png)

## Manuel d'utilisation

### Création d'une sous-application

Cliquez sur « Multi-app » dans le menu des paramètres système pour accéder à la page de gestion multi-app :

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_48_PM.png)

Cliquez sur le bouton « Ajouter » pour créer une nouvelle sous-application :

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_03_50_PM.png)

#### Description des champs du formulaire

* **Nom** : Identifiant de la sous-application, unique au niveau mondial.
* **Nom d'affichage** : Le nom de la sous-application affiché dans l'interface.
* **Mode de démarrage** :
  * **Démarrer lors de la première visite** : La sous-application ne démarre que lorsqu'un utilisateur y accède via l'URL pour la première fois.
  * **Démarrer avec l'application principale** : La sous-application démarre simultanément avec l'application principale (cela augmente le temps de démarrage de l'application principale).
* **Port** : Le numéro de port utilisé par la sous-application pendant l'exécution.
* **Domaine personnalisé** : Configurez un sous-domaine indépendant pour la sous-application.
* **Épingler au menu** : Épingle l'accès à la sous-application sur le côté gauche de la barre de navigation supérieure.
* **Connexion à la base de données** : Utilisé pour configurer la source de données de la sous-application, prenant en charge trois méthodes :
  * **Nouvelle base de données** : Réutilise le service de données actuel pour créer une base de données indépendante.
  * **Nouvelle connexion de données** : Configure un tout nouveau service de base de données.
  * **Mode Schema** : Crée un schéma indépendant pour la sous-application dans PostgreSQL.
* **Mise à niveau** : Si la base de données connectée contient une ancienne version de la structure de données NocoBase, elle sera automatiquement mise à niveau vers la version actuelle.

### Démarrage et arrêt des sous-applications

Cliquez sur le bouton **Démarrer** pour lancer une sous-application.  
> Si l'option *« Démarrer lors de la première visite »* a été cochée lors de la création, elle démarrera automatiquement lors de la première consultation.  

Cliquez sur le bouton **Voir** pour ouvrir la sous-application dans un nouvel onglet.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_00_PM.png)

### État de fonctionnement et journaux

Vous pouvez consulter l'utilisation de la mémoire et du CPU de chaque application dans la liste.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-21-2025_10_31_AM.png)

Cliquez sur le bouton **Logs** pour consulter les journaux d'exécution de la sous-application.  
> Si une sous-application est inaccessible après son démarrage (par exemple, en raison d'une base de données corrompue), vous pouvez effectuer un diagnostic à l'aide des journaux.

![](https://static-docs.nocobase.com/multi-app/Multi-app-NocoBase-10-16-2025_04_02_PM.png)

### Suppression d'une sous-application

Cliquez sur le bouton **Supprimer** pour retirer une sous-application.  
> Lors de la suppression, vous pouvez choisir de supprimer également la base de données. Veuillez procéder avec prudence, car cette action est irréversible.

### Accès aux sous-applications
Par défaut, utilisez `/_app/:appName/admin/` pour accéder aux sous-applications, par exemple :
```
http://localhost:13000/_app/a_7zkxoarusnx/admin/
```
De plus, vous pouvez configurer des sous-domaines indépendants pour les sous-applications. Vous devez faire pointer le domaine vers l'adresse IP actuelle. Si vous utilisez Nginx, le domaine doit également être ajouté à la configuration Nginx.

### Gestion des sous-applications via l'interface de ligne de commande (CLI)

Dans le répertoire racine du projet, vous pouvez utiliser la ligne de commande pour gérer les instances de sous-applications via **PM2** :

```bash
yarn nocobase pm2 list              # Afficher la liste des instances en cours d'exécution
yarn nocobase pm2 stop [appname]    # Arrêter un processus de sous-application spécifique
yarn nocobase pm2 delete [appname]  # Supprimer un processus de sous-application spécifique
yarn nocobase pm2 kill              # Terminer de force tous les processus démarrés (peut inclure l'instance de l'application principale)
```

### Migration des données de l'ancienne version Multi-app

Accédez à l'ancienne page de gestion multi-app et cliquez sur le bouton **Migrer les données vers la nouvelle Multi-app** pour effectuer la migration.

![](https://static-docs.nocobase.com/multi-app/Multi-app-manager-deprecated-NocoBase-10-21-2025_10_32_AM.png)

## FAQ

#### 1. Gestion des plugins
Les sous-applications peuvent utiliser les mêmes plugins que l'application principale (y compris les versions), mais les plugins peuvent être configurés et utilisés indépendamment.

#### 2. Isolation de la base de données
Les sous-applications peuvent être configurées avec des bases de données indépendantes. Si vous souhaitez partager des données entre les applications, cela peut être réalisé via des sources de données externes.

#### 3. Sauvegarde et migration des données
Actuellement, la sauvegarde des données sur l'application principale n'inclut pas les données des sous-applications (elle n'inclut que les informations de base des sous-applications). Les sauvegardes et les migrations doivent être effectuées manuellement au sein de chaque sous-application.

#### 4. Déploiement et mises à jour
Les versions des sous-applications suivront automatiquement les mises à niveau de l'application principale, garantissant ainsi la cohérence des versions entre l'application principale et les sous-applications.

#### 5. Gestion des ressources
La consommation de ressources de chaque sous-application est pratiquement la même que celle de l'application principale. Actuellement, l'utilisation de la mémoire d'une seule application est d'environ 500 à 600 Mo.