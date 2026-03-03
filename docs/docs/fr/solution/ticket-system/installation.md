:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/solution/ticket-system/installation).
:::

# Comment installer

> La version actuelle utilise le format **sauvegarde et restauration** pour le déploiement. Dans les versions ultérieures, nous pourrions passer à un format de **migration incrémentielle** afin de faciliter l'intégration de la solution dans vos systèmes existants.

Pour vous permettre de déployer la solution de tickets rapidement et sans encombre dans votre propre environnement NocoBase, nous proposons deux méthodes de restauration. Veuillez choisir celle qui convient le mieux à votre version utilisateur et à votre bagage technique.

Avant de commencer, veuillez vous assurer que :

- Vous disposez déjà d'un environnement d'exécution NocoBase de base. Pour l'installation du système principal, veuillez vous référer au [document d'installation officiel](https://docs-cn.nocobase.com/welcome/getting-started/installation) plus détaillé.
- Version de NocoBase **2.0.0-beta.5 et supérieure**
- Vous avez téléchargé les fichiers correspondants au système de tickets :
  - **Fichier de sauvegarde** : [nocobase_tts_v2_backup_260302.nbdata](https://static-docs.nocobase.com/nocobase_tts_v2_backup_260302.nbdata) - Applicable à la méthode 1
  - **Fichier SQL** : [nocobase_tts_v2_sql_260302.zip](https://static-docs.nocobase.com/nocobase_tts_v2_sql_260302.zip) - Applicable à la méthode 2

**Remarques importantes** :
- Cette solution est basée sur la base de données **PostgreSQL 16**, veuillez vous assurer que votre environnement utilise PostgreSQL 16.
- **DB_UNDERSCORED ne peut pas être true** : Veuillez vérifier votre fichier `docker-compose.yml` et vous assurer que la variable d'environnement `DB_UNDERSCORED` n'est pas définie sur `true`, sinon cela entrera en conflit avec la sauvegarde de la solution et entraînera l'échec de la restauration.

---

## Méthode 1 : Restaurer via le gestionnaire de sauvegarde (recommandé pour les utilisateurs Pro/Entreprise)

Cette méthode utilise le plugin intégré de NocoBase "[Gestionnaire de sauvegarde](https://docs-cn.nocobase.com/handbook/backups)" (Pro/Entreprise) pour une restauration en un clic, ce qui est l'opération la plus simple. Cependant, elle impose certaines exigences sur l'environnement et la version de l'utilisateur.

### Caractéristiques principales

* **Avantages** :
  1. **Opération pratique** : Peut être effectuée via l'interface utilisateur, permettant de restaurer l'intégralité des configurations, y compris les plugins.
  2. **Restauration complète** : **Capable de restaurer tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés dans les champs de fichiers des tables, etc., garantissant l'intégrité fonctionnelle.
* **Limites** :
  1. **Limité aux versions Pro/Entreprise** : Le "Gestionnaire de sauvegarde" est un plugin de niveau entreprise, disponible uniquement pour les utilisateurs Pro/Entreprise.
  2. **Exigences environnementales strictes** : Nécessite que votre environnement de base de données (version, paramètres de sensibilité à la casse, etc.) soit hautement compatible avec l'environnement où la sauvegarde a été créée.
  3. **Dépendance aux plugins** : Si la solution contient des plugins commerciaux qui ne sont pas présents dans votre environnement local, la restauration échouera.

### Étapes

**Étape 1 : [Fortement recommandé] Démarrer l'application avec l'image `full`**

Pour éviter les échecs de restauration dus à l'absence de clients de base de données, nous vous recommandons vivement d'utiliser la version `full` de l'image Docker. Elle intègre tous les programmes d'accompagnement nécessaires, vous évitant ainsi toute configuration supplémentaire.

Exemple de commande pour récupérer l'image :

```bash
docker pull nocobase/nocobase:beta-full
```

Ensuite, utilisez cette image pour démarrer votre service NocoBase.

> **Note** : Si vous n'utilisez pas l'image `full`, vous devrez peut-être installer manuellement le client de base de données `pg_dump` à l'intérieur du conteneur, un processus fastidieux et instable.

**Étape 2 : Activer le plugin "Gestionnaire de sauvegarde"**

1. Connectez-vous à votre système NocoBase.
2. Allez dans **`Gestion des plugins`**.
3. Trouvez et activez le plugin **`Gestionnaire de sauvegarde`**.

**Étape 3 : Restaurer à partir du fichier de sauvegarde local**

1. Après avoir activé le plugin, rafraîchissez la page.
2. Allez dans le menu de gauche **`Administration du système`** -> **`Gestionnaire de sauvegarde`**.
3. Cliquez sur le bouton **`Restaurer à partir d'une sauvegarde locale`** en haut à droite.
4. Faites glisser le fichier de sauvegarde téléchargé vers la zone de téléchargement.
5. Cliquez sur **`Soumettre`** et attendez patiemment que le système termine la restauration ; ce processus peut prendre de quelques dizaines de secondes à plusieurs minutes.

### Observations

* **Compatibilité de la base de données** : C'est le point le plus critique de cette méthode. La **version, le jeu de caractères et les paramètres de sensibilité à la casse** de votre base de données PostgreSQL doivent correspondre au fichier source de la sauvegarde. En particulier, le nom du `schema` doit être identique.
* **Correspondance des plugins commerciaux** : Veuillez vous assurer que vous possédez et avez activé tous les plugins commerciaux requis par la solution, sinon la restauration sera interrompue.

---

## Méthode 2 : Importer directement le fichier SQL (universel, plus adapté à la version Community)

Cette méthode restaure les données en opérant directement sur la base de données, contournant le plugin "Gestionnaire de sauvegarde", et n'est donc pas soumise aux restrictions des plugins Pro/Entreprise.

### Caractéristiques principales

* **Avantages** :
  1. **Aucune restriction de version** : Applicable à tous les utilisateurs de NocoBase, y compris la version Community.
  2. **Haute compatibilité** : Ne dépend pas de l'outil `dump` de l'application ; fonctionne tant que vous pouvez vous connecter à la base de données.
  3. **Haute tolérance aux pannes** : Si la solution contient des plugins commerciaux que vous n'avez pas, les fonctionnalités associées ne seront pas activées, mais cela n'affectera pas le fonctionnement des autres fonctionnalités et l'application pourra démarrer avec succès.
* **Limites** :
  1. **Nécessite des compétences en base de données** : L'utilisateur doit posséder des compétences de base en manipulation de base de données, comme l'exécution d'un fichier `.sql`.
  2. **Perte des fichiers système** : **Cette méthode entraînera la perte de tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés dans les champs de fichiers des tables, etc.

### Étapes

**Étape 1 : Préparer une base de données propre**

Préparez une base de données entièrement nouvelle et vide pour les données que vous allez importer.

**Étape 2 : Importer le fichier `.sql` dans la base de données**

Obtenez le fichier de base de données téléchargé (généralement au format `.sql`) et importez son contenu dans la base de données préparée à l'étape précédente. Il existe plusieurs façons de procéder, selon votre environnement :

* **Option A : Via la ligne de commande du serveur (exemple Docker)**
  Si vous utilisez Docker pour installer NocoBase et la base de données, vous pouvez télécharger le fichier `.sql` sur le serveur, puis utiliser la commande `docker exec` pour effectuer l'importation. En supposant que votre conteneur PostgreSQL se nomme `my-nocobase-db` et que le fichier se nomme `ticket_system.sql` :

  ```bash
  # Copier le fichier sql dans le conteneur
  docker cp ticket_system.sql my-nocobase-db:/tmp/
  # Entrer dans le conteneur pour exécuter la commande d'importation
  docker exec -it my-nocobase-db psql -U votre_nom_utilisateur -d votre_nom_de_base_de_données -f /tmp/ticket_system.sql
  ```
* **Option B : Via un client de base de données distant**
  Si le port de votre base de données est exposé, vous pouvez utiliser n'importe quel client de base de données graphique (tel que DBeaver, Navicat, pgAdmin, etc.) pour vous connecter à la base de données, ouvrir une nouvelle fenêtre de requête, y coller tout le contenu du fichier `.sql`, puis l'exécuter.

**Étape 3 : Connecter la base de données et démarrer l'application**

Configurez vos paramètres de démarrage NocoBase (tels que les variables d'environnement `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) pour qu'ils pointent vers la base de données dans laquelle vous venez d'importer les données. Ensuite, démarrez normalement le service NocoBase.

### Observations

* **Permissions de la base de données** : Cette méthode nécessite que vous disposiez d'un compte et d'un mot de passe permettant d'opérer directement sur la base de données.
* **État des plugins** : Après une importation réussie, bien que les données des plugins commerciaux existent dans le système, si vous n'avez pas installé et activé les plugins correspondants localement, les fonctionnalités associées ne seront ni affichées ni utilisables, mais cela ne provoquera pas de plantage de l'application.

---

## Résumé et comparaison

| Caractéristique | Méthode 1 : Gestionnaire de sauvegarde | Méthode 2 : Importation directe SQL |
| :-------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- |
| **Utilisateurs cibles** | Utilisateurs **Pro/Entreprise** | **Tous les utilisateurs** (y compris Community) |
| **Facilité d'utilisation** | ⭐⭐⭐⭐⭐ (Très simple, via l'interface) | ⭐⭐⭐ (Nécessite des connaissances de base en base de données) |
| **Exigences environnementales** | **Strictes**, les versions de base de données et du système doivent être hautement compatibles | **Moyennes**, nécessite une compatibilité de base de données |
| **Dépendance aux plugins** | **Forte dépendance**, les plugins sont vérifiés lors de la restauration ; l'absence d'un plugin entraînera l'**échec de la restauration**. | **Les fonctionnalités dépendent des plugins**. Les données peuvent être importées indépendamment, le système dispose des fonctions de base. Mais sans les plugins correspondants, les fonctions associées seront **totalement inutilisables**. |
| **Fichiers système** | **Entièrement conservés** (modèles d'impression, fichiers téléchargés, etc.) | **Seront perdus** (modèles d'impression, fichiers téléchargés, etc.) |
| **Scénarios recommandés** | Utilisateurs en entreprise, avec un environnement contrôlé et cohérent, nécessitant des fonctionnalités complètes | Absence de certains plugins, recherche de haute compatibilité et flexibilité, utilisateurs non Pro/Entreprise, acceptation de la perte des fonctions de fichiers |

J'espère que ce tutoriel vous aidera à déployer avec succès le système de tickets. Si vous rencontrez des problèmes au cours du processus, n'hésitez pas à nous contacter !