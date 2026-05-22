---
title: "Système de gestion tout-en-un - Installation"
description: "Installation et déploiement du système de gestion tout-en-un : restauration via le Backup Manager (édition Pro/Enterprise) ou import du fichier SQL (édition Community), nécessite PostgreSQL 16, DB_UNDERSCORED ne doit pas être à true."
keywords: "installation système tout-en-un, All-in-One, restauration de sauvegarde, Backup Manager, import SQL, PostgreSQL, NocoBase"
---

# Comment l'installer

> La version actuelle est déployée par **restauration de sauvegarde**. Les versions futures pourraient passer à une **migration incrémentale** afin d'intégrer plus facilement la solution dans un système NocoBase existant.

Le système de gestion tout-en-un couvre les six modules : **CRM (gestion clients), gestion commerciale, help desk (tickets), gestion de projet, gestion d'actifs et RH**. Pour vous permettre de déployer la solution rapidement dans votre propre environnement NocoBase, nous proposons deux modes de restauration ; choisissez celui qui correspond le mieux à votre édition et à votre profil technique.

Avant de commencer, assurez-vous que :

- Vous disposez d'un environnement NocoBase fonctionnel. Pour l'installation du système principal, consultez la [documentation d'installation officielle](https://docs-cn.nocobase.com/welcome/getting-started/installation).
- NocoBase est en version **v2.1.0-alpha.34 ou supérieure**.
- Vous avez téléchargé les fichiers nécessaires de la solution tout-en-un :
  - **Fichier de sauvegarde** : [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — pour la méthode 1
  - **Fichier SQL** : [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — pour la méthode 2

**Points importants** :

- Cette solution a été conçue sur **PostgreSQL 16** ; assurez-vous que votre environnement utilise PostgreSQL 16.
- **DB_UNDERSCORED ne doit pas être à true** : vérifiez votre `docker-compose.yml` et confirmez que la variable d'environnement `DB_UNDERSCORED` n'est pas définie sur `true`, sinon elle entrera en conflit avec la sauvegarde et fera échouer la restauration.

---

## Méthode 1 : Restauration via le Backup Manager (recommandée pour Pro/Enterprise)

Cette méthode passe par le plugin « [Backup Manager](https://docs-cn.nocobase.com/handbook/backups) » intégré à NocoBase (édition Pro/Enterprise) et permet une restauration en un clic. Elle est la plus simple, mais a des prérequis sur l'environnement et l'édition.

### Caractéristiques

* **Avantages** :
  1. **Simplicité d'utilisation** : tout se fait dans l'interface, avec restauration complète de la configuration y compris les plugins.
  2. **Restauration intégrale** : **tous les fichiers système sont restaurés**, y compris les modèles d'impression, les fichiers téléchargés dans les champs de type fichier, les avatars des employés AI, etc.
* **Limites** :
  1. **Réservée à Pro/Enterprise** : le « Backup Manager » est un plugin d'entreprise, disponible uniquement pour les éditions Pro/Enterprise.
  2. **Exigences environnementales strictes** : votre environnement de base de données (version, sensibilité à la casse, etc.) doit être très compatible avec celui de la sauvegarde.
  3. **Dépendance aux plugins** : si la solution contient des plugins commerciaux absents de votre environnement local, la restauration échouera.

### Étapes opérationnelles

**Étape 1 : [fortement recommandé] Démarrer l'application avec l'image `full`**

Pour éviter les échecs de restauration liés à l'absence d'un client de base de données, nous recommandons fortement l'image Docker en version `full`. Elle embarque tous les outils nécessaires, sans configuration supplémentaire.

Exemple de commande pour récupérer l'image :

```bash
docker pull nocobase/nocobase:alpha-full
```

Démarrez ensuite votre service NocoBase avec cette image.

> **Note** : sans l'image `full`, vous devrez installer manuellement le client `pg_dump` dans le conteneur, ce qui est laborieux et instable.

**Étape 2 : Activer le plugin « Backup Manager »**

1. Connectez-vous à votre système NocoBase.
2. Allez dans **`Gestion des plugins`**.
3. Localisez et activez le plugin **`Backup Manager`**.

**Étape 3 : Restauration depuis un fichier de sauvegarde local**

1. Après activation du plugin, rafraîchissez la page.
2. Allez dans le menu **`Administration`** → **`Backup Manager`**.
3. Cliquez sur le bouton **`Restaurer depuis une sauvegarde locale`** en haut à droite.
4. Glissez-déposez le fichier `nocobase_all_in_one_backup_260521.nbdata` dans la zone d'upload.
5. Cliquez sur **`Soumettre`** et attendez la fin de la restauration ; l'opération peut prendre de quelques dizaines de secondes à quelques minutes.

### Points d'attention

* **Compatibilité de la base de données** : c'est le point le plus critique de cette méthode. La **version, le jeu de caractères et la sensibilité à la casse** de votre PostgreSQL doivent correspondre à ceux du fichier source, et le nom du `schema` doit notamment être identique.
* **Correspondance des plugins commerciaux** : assurez-vous d'avoir installé et activé tous les plugins commerciaux requis par la solution, sinon la restauration sera interrompue. Les plugins commerciaux impliqués dans la solution tout-en-un incluent : Backup Manager, Email Manager, Audit Log, Employés AI, etc.

---

## Méthode 2 : Import direct d'un fichier SQL (universelle, recommandée pour Community)

Cette méthode manipule directement la base de données pour restaurer les données, en contournant le plugin « Backup Manager » ; elle n'a donc pas la limitation Pro/Enterprise.

### Caractéristiques

* **Avantages** :
  1. **Pas de restriction d'édition** : compatible avec tous les utilisateurs NocoBase, y compris Community.
  2. **Haute compatibilité** : ne dépend pas de l'outil `dump` interne à l'application ; il suffit de pouvoir se connecter à la base de données.
  3. **Tolérance aux erreurs** : si la solution contient des plugins commerciaux absents, les fonctionnalités associées ne seront simplement pas activées, sans empêcher le reste de fonctionner ni le démarrage de l'application.
* **Limites** :
  1. **Compétences en base de données requises** : l'utilisateur doit savoir exécuter un fichier `.sql`.
  2. **Perte des fichiers système** : **cette méthode entraîne la perte de tous les fichiers système**, y compris les modèles d'impression, les fichiers téléchargés dans les champs fichier, les avatars des employés AI, etc.

### Étapes opérationnelles

**Étape 1 : Préparer une base de données vide**

Préparez une nouvelle base de données vide (PostgreSQL 16) pour recevoir les données.

**Étape 2 : Importer le fichier `.sql` dans la base**

Décompressez `nocobase_all_in_one_sql_260521.zip` pour obtenir le fichier `.sql`, puis importez son contenu dans la base préparée. L'exécution peut se faire de plusieurs façons selon votre environnement :

* **Option A : Ligne de commande sur le serveur (exemple Docker)**

  Si vous utilisez Docker pour NocoBase et la base de données, vous pouvez transférer le fichier `.sql` sur le serveur et l'importer avec `docker exec`. En supposant que votre conteneur PostgreSQL s'appelle `my-nocobase-db` :

  ```bash
  # Copier le fichier sql dans le conteneur
  docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
  # Entrer dans le conteneur et exécuter l'import
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
  ```

* **Option B : Client de base de données distant (Navicat, etc.)**

  Si votre base expose un port, vous pouvez utiliser n'importe quel client graphique (Navicat, DBeaver, pgAdmin, etc.) pour vous y connecter, puis :

  1. Faire un clic droit sur la base de données cible
  2. Choisir « Exécuter un fichier SQL » ou « Exécuter un script SQL »
  3. Sélectionner le fichier `.sql` téléchargé et l'exécuter

**Étape 3 : Se connecter à la base et démarrer l'application**

Configurez les paramètres de démarrage de NocoBase (variables d'environnement `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) pour pointer vers la base de données dans laquelle vous venez d'importer les données, puis démarrez le service NocoBase normalement.

### Points d'attention

* **Droits sur la base de données** : cette méthode nécessite un compte avec les droits d'opérer directement sur la base.
* **État des plugins** : après l'import, les données des plugins commerciaux sont présentes dans le système, mais si vous n'avez pas installé et activé les plugins correspondants en local, les fonctionnalités liées ne seront pas visibles ni utilisables, sans pour autant faire planter l'application.

---

## Synthèse comparative

| Caractéristique | Méthode 1 : Backup Manager | Méthode 2 : Import SQL direct |
| :--- | :--- | :--- |
| **Public cible** | Éditions **Pro/Enterprise** | **Tous les utilisateurs** (Community inclus) |
| **Simplicité** | ⭐⭐⭐⭐⭐ (très simple, opération en UI) | ⭐⭐⭐ (connaissances de base en BDD requises) |
| **Exigences environnement** | **Strictes**, compatibilité élevée requise sur BDD et système | **Moyennes**, simple compatibilité de la base suffit |
| **Dépendance aux plugins** | **Forte** : la restauration vérifie les plugins, tout manquant entraîne **l'échec** | **Forte au niveau des fonctionnalités**. Les données s'importent indépendamment et le système conserve ses fonctions de base, mais les fonctionnalités liées aux plugins absents seront **totalement inutilisables** |
| **Fichiers système** | **Conservation intégrale** (modèles d'impression, fichiers téléchargés, avatars, etc.) | **Perte** (modèles d'impression, fichiers téléchargés, avatars, etc.) |
| **Scénarios recommandés** | Clients entreprise avec environnement contrôlé et cohérent, qui veulent toutes les fonctionnalités | Utilisateurs sans certains plugins, recherchant compatibilité et flexibilité, ou hors édition Pro/Enterprise, acceptant la perte des fichiers |

---

## Questions fréquentes

### Est-ce que l'édition Pro fonctionne ? Y a-t-il des erreurs ?

Oui, vous pouvez utiliser directement l'édition Pro sans erreur. La démo utilise certains plugins Enterprise (Email Manager, Audit Log, Employés AI, etc.) ; si l'édition Pro ne les a pas, les points d'entrée correspondants ne s'afficheront pas, mais **les autres modules ne sont pas affectés**. Par exemple, l'entrée Audit Log disparaîtra, mais le CRM, la gestion commerciale, les tickets, les projets, les actifs, les RH et les autres modules clés fonctionnent normalement.

### Quelle version utiliser après la restauration ?

Nous recommandons la dernière image `alpha-full` (par exemple `nocobase/nocobase:alpha-full`). L'image `full` intègre le client de base de données et d'autres dépendances, ce qui évite les échecs de restauration dus à l'absence d'outils.

### Le logo ne s'affiche pas après la restauration ?

Le logo de la démo officielle est restreint à un domaine et ne se charge pas sur les domaines locaux. Ouvrez les **paramètres système** et téléchargez votre propre logo pour résoudre le problème.

### Erreur lors de l'envoi de fichiers (erreur clé OSS) ?

Après installation par SQL, l'envoi de fichiers peut provoquer des erreurs liées à OSS. Solution : allez dans **Gestion des plugins → File Manager**, définissez **Local Storage** comme espace de stockage par défaut, sauvegardez, puis l'envoi fonctionnera normalement.

### Changement de langue ?

La solution tout-en-un a déjà été localisée dans plus de 20 langues (espace de noms `nb_demo`). Après la restauration, le chinois est la langue par défaut ; pour basculer dans une autre langue : **Paramètres système → activer la langue souhaitée** (évitez d'activer `ar-SA`, qui provoque actuellement des anomalies de rendu dans NocoBase).

### Comment faire pour les mises à jour incrémentales ?

Pour le moment, les mises à jour de version sont en mode remplacement intégral et les personnalisations sont écrasées. Pensez impérativement à sauvegarder avant de mettre à jour. Une solution de migration incrémentale est en cours de réflexion ; elle sera d'abord disponible pour les éditions Pro/Enterprise. L'édition Community, qui ne dispose pas du plugin Migration Manager, est plus difficile à prendre en charge pour le moment.

Nous espérons que ce tutoriel vous aidera à déployer le système de gestion tout-en-un sans difficulté. Pour toute question pendant l'opération, n'hésitez pas à nous contacter.
