---
title: "Comment installer CRM 2.0"
description: "Installation et déploiement de CRM 2.0 : restauration via le gestionnaire de sauvegardes (édition Pro/Entreprise) ou import de fichier SQL (édition Communautaire), nécessite PostgreSQL 16, DB_UNDERSCORED ne doit pas être à true."
keywords: "installation CRM, restauration de sauvegarde, gestionnaire de sauvegardes, import SQL, PostgreSQL, NocoBase"
---

# Comment installer

> La version actuelle est déployée sous forme de **sauvegarde et restauration**. Dans les versions ultérieures, nous pourrions passer à une forme de **migration incrémentale** afin de faciliter l'intégration de la solution dans vos systèmes existants.

Afin de vous permettre de déployer la solution CRM 2.0 rapidement et sans encombre dans votre propre environnement NocoBase, nous proposons deux méthodes de restauration. Veuillez choisir celle qui convient le mieux à votre édition utilisateur et à votre bagage technique.

Avant de commencer, veuillez vous assurer que :

- Vous disposez déjà d'un environnement d'exécution NocoBase de base. Pour l'installation du système principal, veuillez vous référer à la [documentation d'installation officielle](https://docs-cn.nocobase.com/welcome/getting-started/installation) plus détaillée.
- Version de NocoBase **v2.1.0-beta.2 ou supérieure**
- Vous avez déjà téléchargé les fichiers correspondants du système CRM :
  - **Fichier de sauvegarde** : [nocobase_crm_v2_backup_260406.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260406.nbdata) - applicable à la méthode 1
  - **Fichier SQL** : [nocobase_crm_v2_sql_260406.zip](https://static-docs.nocobase.com/nocobase_crm_v2_sql_260406.zip) - applicable à la méthode 2

**Remarques importantes** :
- Cette solution est basée sur la base de données **PostgreSQL 16** ; veuillez vous assurer que votre environnement utilise PostgreSQL 16.
- **DB_UNDERSCORED ne peut pas être à true** : veuillez vérifier votre fichier `docker-compose.yml` et vous assurer que la variable d'environnement `DB_UNDERSCORED` n'est pas définie sur `true`, sinon cela entrera en conflit avec la sauvegarde de la solution et entraînera l'échec de la restauration.

---

## Méthode 1 : restaurer via le gestionnaire de sauvegardes (recommandé pour les utilisateurs Pro/Entreprise)

Cette méthode utilise le plugin «[Gestionnaire de sauvegardes](https://docs-cn.nocobase.com/handbook/backups)» (Pro/Entreprise) intégré à NocoBase pour une restauration en un clic, ce qui est l'opération la plus simple. Cependant, elle présente certaines exigences concernant l'environnement et l'édition utilisateur.

### Caractéristiques principales

* **Avantages** :
  1. **Opération pratique** : peut être effectuée via l'interface utilisateur (UI), permettant de restaurer l'intégralité des configurations, y compris les plugins.
  2. **Restauration complète** : **capable de restaurer tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés via les champs de fichiers dans les collections, etc., garantissant l'intégrité fonctionnelle.
* **Limites** :
  1. **Réservé aux éditions Pro/Entreprise** : le «Gestionnaire de sauvegardes» est un plugin de niveau entreprise, disponible uniquement pour les utilisateurs Pro/Entreprise.
  2. **Exigences environnementales strictes** : nécessite que votre environnement de base de données (version, paramètres de sensibilité à la casse, etc.) soit hautement compatible avec l'environnement où la sauvegarde a été créée.
  3. **Dépendance aux plugins** : si la solution contient des plugins commerciaux que vous n'avez pas dans votre environnement local, la restauration échouera.

### Étapes de l'opération

**Étape 1 : [fortement recommandé] utiliser l'image `full` pour démarrer l'application**

Pour éviter les échecs de restauration dus à l'absence de client de base de données, nous vous recommandons vivement d'utiliser la version `full` de l'image Docker. Elle intègre tous les programmes d'accompagnement nécessaires, vous évitant ainsi toute configuration supplémentaire.

Exemple de commande pour récupérer l'image :

```bash
docker pull nocobase/nocobase:beta-full
```

Ensuite, utilisez cette image pour démarrer votre service NocoBase.

> **Note** : si vous n'utilisez pas l'image `full`, vous devrez peut-être installer manuellement le client de base de données `pg_dump` à l'intérieur du conteneur, ce qui est un processus fastidieux et instable.

**Étape 2 : activer le plugin «Gestionnaire de sauvegardes»**

1. Connectez-vous à votre système NocoBase.
2. Allez dans la **«Gestion des plugins»**.
3. Trouvez et activez le plugin **«Gestionnaire de sauvegardes»**.

**Étape 3 : restaurer à partir d'un fichier de sauvegarde local**

1. Après avoir activé le plugin, rafraîchissez la page.
2. Allez dans le menu de gauche **«Gestion du système»** -> **«Gestionnaire de sauvegardes»**.
3. Cliquez sur le bouton **«Restaurer depuis une sauvegarde locale»** en haut à droite.
4. Faites glisser le fichier de sauvegarde téléchargé dans la zone de téléchargement.
5. Cliquez sur **«Soumettre»** et attendez patiemment que le système termine la restauration. Ce processus peut prendre de quelques dizaines de secondes à plusieurs minutes.

### Précautions

* **Compatibilité de la base de données** : c'est le point le plus critique de cette méthode. La **version, le jeu de caractères et les paramètres de sensibilité à la casse** de votre base de données PostgreSQL doivent correspondre au fichier source de la sauvegarde. En particulier, le nom du `schema` doit être identique.
* **Correspondance des plugins commerciaux** : veuillez vous assurer que vous possédez et avez activé tous les plugins commerciaux requis par la solution, sinon la restauration sera interrompue.

---

## Méthode 2 : importer directement le fichier SQL (universel, plus adapté à l'édition Communautaire)

Cette méthode restaure les données en opérant directement sur la base de données, contournant le plugin «Gestionnaire de sauvegardes», et n'est donc pas limitée par les plugins des éditions Pro/Entreprise.

### Caractéristiques principales

* **Avantages** :
  1. **Aucune restriction de version** : convient à tous les utilisateurs de NocoBase, y compris l'édition Communautaire.
  2. **Haute compatibilité** : ne dépend pas de l'outil `dump` interne à l'application ; tant que vous pouvez vous connecter à la base de données, vous pouvez opérer.
  3. **Haute tolérance aux pannes** : si la solution contient des plugins commerciaux que vous n'avez pas, les fonctionnalités associées ne seront pas activées, mais cela n'affectera pas l'utilisation normale des autres fonctions et l'application pourra démarrer avec succès.
* **Limites** :
  1. **Nécessite des compétences en base de données** : l'utilisateur doit posséder des compétences de base en manipulation de base de données, comme l'exécution d'un fichier `.sql`.
  2. **Perte de fichiers système** : **cette méthode entraînera la perte de tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés via les champs de fichiers dans les collections, etc.

### Étapes de l'opération

**Étape 1 : préparer une base de données propre**

Préparez une base de données neuve et vide pour les données que vous allez importer.

**Étape 2 : importer le fichier `.sql` dans la base de données**

Récupérez le fichier de base de données téléchargé (généralement au format `.sql`) et importez son contenu dans la base de données préparée à l'étape précédente. Il existe plusieurs façons de procéder, selon votre environnement :

* **Option A : via la ligne de commande du serveur (exemple avec Docker)**
  Si vous utilisez Docker pour installer NocoBase et la base de données, vous pouvez télécharger le fichier `.sql` sur le serveur, puis utiliser la commande `docker exec` pour effectuer l'importation. Supposons que votre conteneur PostgreSQL se nomme `my-nocobase-db` et que le nom du fichier soit `nocobase_crm_v2_sql_260327.sql` :

  ```bash
  # Copier le fichier sql dans le conteneur
  docker cp nocobase_crm_v2_sql_260327.sql my-nocobase-db:/tmp/
  # Entrer dans le conteneur pour exécuter la commande d'importation
  docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_crm_v2_sql_260327.sql
  ```
* **Option B : via un client de base de données distant (Navicat, etc.)**
  Si le port de votre base de données est exposé, vous pouvez utiliser n'importe quel client de base de données graphique (tel que Navicat, DBeaver, pgAdmin, etc.) pour vous connecter à la base de données, puis :
  1. Faites un clic droit sur la base de données cible.
  2. Choisissez «Exécuter un fichier SQL» ou «Exécuter un script SQL».
  3. Sélectionnez le fichier `.sql` téléchargé et exécutez-le.

**Étape 3 : connecter la base de données et démarrer l'application**

Configurez vos paramètres de démarrage NocoBase (tels que les variables d'environnement `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) pour qu'ils pointent vers la base de données dans laquelle vous venez d'importer les données. Ensuite, démarrez normalement le service NocoBase.

### Précautions

* **Permissions de la base de données** : cette méthode nécessite que vous possédiez un compte et un mot de passe permettant d'opérer directement sur la base de données.
* **État des plugins** : après une importation réussie, bien que les données des plugins commerciaux inclus dans le système existent, si vous n'avez pas installé et activé les plugins correspondants localement, les fonctionnalités associées ne seront pas affichées ni utilisables, mais cela ne causera pas le plantage de l'application.

---

## Résumé et comparaison

| Caractéristique | Méthode 1 : gestionnaire de sauvegardes | Méthode 2 : importation directe SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Utilisateurs cibles** | Utilisateurs **Pro/Entreprise** | **Tous les utilisateurs** (y compris édition Communautaire) |
| **Facilité d'utilisation** | ⭐⭐⭐⭐⭐ (très simple, via UI) | ⭐⭐⭐ (nécessite des connaissances de base en base de données) |
| **Exigences environnementales** | **Strictes**, les versions de base de données et de système doivent être hautement compatibles | **Moyennes**, nécessite une compatibilité de base de données |
| **Dépendance aux plugins** | **Forte dépendance**, les plugins sont vérifiés lors de la restauration ; tout plugin manquant entraînera un **échec de la restauration**. | **Fonctionnalités fortement dépendantes des plugins**. Les données peuvent être importées indépendamment, le système dispose des fonctions de base. Mais s'il manque les plugins correspondants, les fonctions associées seront **totalement inutilisables**. |
| **Fichiers système** | **Entièrement conservés** (modèles d'impression, fichiers téléchargés, etc.) | **Seront perdus** (modèles d'impression, fichiers téléchargés, etc.) |
| **Scénarios recommandés** | Utilisateurs en entreprise, avec un environnement contrôlé et cohérent, nécessitant des fonctionnalités complètes | Manque de certains plugins, recherche d'une compatibilité et d'une flexibilité élevées, utilisateurs non Pro/Entreprise, acceptation de la perte des fonctions de fichiers |

---

## Questions fréquentes

### L'édition Pro fonctionne-t-elle ? Y aura-t-il des erreurs ?

Vous pouvez l'utiliser directement sans erreur. La démo utilise certains plugins de l'édition Entreprise (par exemple gestion des e-mails, journal d'audit, etc.) ; lorsque ces plugins sont manquants en édition Pro, les points d'entrée fonctionnels correspondants ne s'affichent pas, mais cela **n'affecte pas les autres fonctions du système**. Par exemple, l'entrée e-mail disparaît, mais les modules centraux comme prospects, opportunités, commandes, etc., fonctionnent parfaitement.

### Quelle version choisir après la restauration ?

Il est recommandé d'utiliser la dernière version de l'image `beta-full` (par exemple `nocobase/nocobase:beta-full`). L'image `full` intègre les dépendances comme le client de base de données, ce qui évite les échecs de restauration dus à des outils manquants.

### Le logo ne s'affiche pas après la restauration ?

Le logo de la démo officielle est configuré avec une restriction de domaine ; il ne peut pas être chargé depuis un domaine local. Allez dans **Paramètres système** et téléchargez à nouveau votre propre logo.

### Erreur de téléchargement de fichier (erreur de clé OSS) ?

Après une installation par SQL, le téléchargement de fichiers peut renvoyer des erreurs liées à OSS. Solution : allez dans **Gestion des plugins → Gestionnaire de fichiers**, définissez **Local Storage (stockage local)** comme espace de stockage par défaut, sauvegardez et le téléchargement fonctionnera normalement.

### Comment effectuer une mise à niveau incrémentale ?

Actuellement, les mises à niveau de version sont des remplacements complets ; les modifications personnalisées seront écrasées. Sauvegardez impérativement avant la mise à niveau. Une solution de migration incrémentale est en cours de planification et sera prise en charge en priorité pour les éditions Pro/Entreprise. L'édition Communautaire est plus difficile à prendre en charge pour le moment, faute de plugin de gestion de migration.

Nous espérons que ce tutoriel vous aidera à déployer avec succès le système CRM 2.0. Si vous rencontrez des problèmes lors de l'opération, n'hésitez pas à nous contacter !

---

*Last updated: 2026-04-02*
