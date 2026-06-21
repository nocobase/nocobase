# Guide de déploiement de la démo CRM

Pour vous permettre de déployer rapidement et facilement cette démo dans votre propre environnement NocoBase, nous proposons deux méthodes de restauration. Choisissez celle qui correspond à votre version utilisateur et à votre niveau technique.

Avant de commencer, vérifiez que :

- Vous disposez déjà d'un environnement NocoBase de base. Pour l'installation principale, reportez-vous à la [documentation officielle d'installation](https://docs-cn.nocobase.com/welcome/getting-started/installation), plus détaillée.
- Vous avez téléchargé les fichiers correspondants de notre démo CRM (version chinoise) :
  - **Fichier de sauvegarde** (environ 21,2 Mo) : [nocobase_crm_demo_cn.nbdata](https://static-docs.nocobase.com/nocobase_crm_demo_cn.nbdata) — pour la méthode 1
  - **Fichier SQL** (environ 9 Mo une fois compressé) : [nocobase_crm_demo_cn.zip](https://static-docs.nocobase.com/nocobase_crm_demo_cn.zip) — pour la méthode 2

**Important** : la démo a été produite avec une base **PostgreSQL** ; vérifiez bien que votre environnement utilise PostgreSQL.

---

### Méthode 1 : restauration via le gestionnaire de sauvegardes (recommandé pour les utilisateurs Pro / Enterprise)

Cette méthode utilise le plugin natif « [Backup Manager](https://docs-cn.nocobase.com/handbook/backups) » de NocoBase (Pro / Enterprise) pour une restauration en un clic. Très simple, mais soumise à quelques contraintes d'environnement et de version.

#### Caractéristiques principales

* **Avantages** :
  1. **Très simple** : tout se fait depuis l'UI, et restaure intégralement la configuration y compris les plugins.
  2. **Restauration complète** : **restaure tous les fichiers système**, y compris les modèles d'impression et les fichiers téléversés via les champs « fichier » des tables, ce qui garantit l'intégrité fonctionnelle de la démo.
* **Limites** :
  1. **Réservé aux versions Pro / Enterprise** : le plugin « Backup Manager » est un plugin entreprise, disponible uniquement pour les utilisateurs Pro / Enterprise.
  2. **Exigences strictes sur l'environnement** : votre environnement de base de données (version, sensibilité à la casse, etc.) doit être très compatible avec celui dans lequel la sauvegarde a été créée.
  3. **Dépendances de plugins** : si la démo contient des plugins commerciaux que vous n'avez pas localement, la restauration échouera.

#### Étapes

**Étape 1 : [très recommandé] Démarrer l'application avec l'image `full`**

Pour éviter les échecs de restauration dus à un client de base de données manquant, nous vous conseillons fortement d'utiliser la version `full` de l'image Docker. Elle embarque tous les programmes nécessaires, sans configuration supplémentaire. (Note : nos images sont produites depuis la 1.9.0-alpha.1, vérifiez la compatibilité de version.)

Exemple de commande pour récupérer l'image :

```bash
docker pull nocobase/nocobase:1.9.0-alpha.3-full
```

Démarrez ensuite votre service NocoBase avec cette image.

> **Note** : sans l'image `full`, vous devrez peut-être installer manuellement le client `pg_dump` dans le conteneur, ce qui est fastidieux et instable.

**Étape 2 : activer le plugin « Backup Manager »**

1. Connectez-vous à votre système NocoBase.
2. Allez dans **`Gestion des plugins`**.
3. Recherchez et activez le plugin **`Backup Manager`**.

![20250711014113](https://static-docs.nocobase.com/20250711014113.png)

**Étape 3 : restaurer depuis un fichier de sauvegarde local**

1. Une fois le plugin activé, rafraîchissez la page.
2. Allez dans le menu de gauche **`Administration système`** -\> **`Backup Manager`**.
3. Cliquez sur le bouton **`Restaurer depuis une sauvegarde locale`** en haut à droite.
   ![20250711014216](https://static-docs.nocobase.com/20250711014216.png)
4. Glissez-déposez dans la zone d'upload le fichier de sauvegarde de la démo que nous vous avons fourni (généralement au format `.zip`).
5. Cliquez sur **`Soumettre`** et patientez le temps que la restauration se termine ; cela peut prendre de quelques dizaines de secondes à plusieurs minutes.
   ![20250711014250](https://static-docs.nocobase.com/20250711014250.png)

#### ⚠️ Points d'attention

* **Compatibilité de la base de données** : c'est le point le plus important. La **version, le jeu de caractères et la sensibilité à la casse** de votre base PostgreSQL doivent correspondre à ceux de la sauvegarde source. En particulier, le nom du `schema` doit être identique.
* **Compatibilité des plugins commerciaux** : vérifiez que vous possédez et avez activé tous les plugins commerciaux nécessaires à la démo, sinon la restauration s'arrêtera.

---

### Méthode 2 : import SQL direct (universelle, plus adaptée à la version Community)

Cette méthode restaure les données directement via la base de données, sans passer par le plugin « Backup Manager », et n'a donc pas la limitation des versions Pro / Enterprise.

#### Caractéristiques principales

* **Avantages** :
  1. **Pas de limite de version** : convient à tous les utilisateurs NocoBase, y compris la version Community.
  2. **Bonne compatibilité** : ne dépend pas de l'outil `dump` de l'application ; il suffit de pouvoir se connecter à la base.
  3. **Tolérance aux erreurs élevée** : si la démo contient des plugins commerciaux que vous n'avez pas (par exemple les graphiques ECharts), les fonctionnalités correspondantes ne sont simplement pas activées, sans empêcher le reste de fonctionner ; l'application démarre malgré tout.
* **Limites** :
  1. **Compétences DB requises** : vous devez savoir manipuler une base de données et exécuter un fichier `.sql`.
  2. **⚠️ Perte des fichiers système** : **cette méthode fait perdre tous les fichiers système**, dont les modèles d'impression et les fichiers téléversés via les champs « fichier » des tables. Ce qui implique :
     - Les modèles d'impression peuvent ne pas fonctionner correctement
     - Les images, documents, etc. déjà téléversés seront perdus
     - Les fonctionnalités impliquant des champs « fichier » seront dégradées

#### Étapes

**Étape 1 : préparer une base de données vierge**

Préparez une base de données neuve et vide pour l'import des données de la démo.

**Étape 2 : importer le fichier `.sql` dans la base**

Récupérez le fichier de base de données fourni (généralement au format `.sql`) et importez son contenu dans la base que vous venez de préparer. Plusieurs façons de faire selon votre environnement :

* **Option A : ligne de commande sur le serveur (avec Docker)**
  Si vous utilisez Docker pour NocoBase et la base, vous pouvez transférer le fichier `.sql` sur le serveur, puis utiliser `docker exec` pour effectuer l'import. Si votre conteneur PostgreSQL s'appelle `my-nocobase-db` et le fichier `crm_demo.sql` :

  ```bash
  # Copier le fichier sql dans le conteneur
  docker cp crm_demo.sql my-nocobase-db:/tmp/
  # Entrer dans le conteneur et exécuter l'import
  docker exec -it my-nocobase-db psql -U your_username -d your_database_name -f /tmp/crm_demo.sql
  ```
* **Option B : via un client de base distant**
  Si le port de la base est exposé, vous pouvez utiliser n'importe quel client graphique (DBeaver, Navicat, pgAdmin, etc.) pour vous connecter à la base, ouvrir une fenêtre de requête, coller l'intégralité du fichier `.sql` et l'exécuter.

**Étape 3 : connecter la base et démarrer l'application**

Configurez les paramètres de démarrage de NocoBase (variables d'environnement `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) pour pointer vers la base que vous venez d'alimenter, puis démarrez NocoBase normalement.

![img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag](https://static-docs.nocobase.com/img_v3_02o3_eb637bd2-88c3-400b-8421-1ac2057d1aag.png)

#### ⚠️ Points d'attention

* **Permissions sur la base** : cette méthode nécessite un compte qui peut manipuler directement la base.
* **Statut des plugins** : après l'import, les données des plugins commerciaux présents dans le système existent bien, mais si les plugins correspondants ne sont pas installés et activés en local, leurs fonctionnalités (graphiques ECharts, champs spécifiques, etc.) ne seront pas affichées ni utilisables ; cela ne fait toutefois pas planter l'application.

---

### Bilan et comparatif


| Caractéristique               | Méthode 1 : Backup Manager                                                                          | Méthode 2 : import SQL direct                                                                                              |
| :----------------------------- | :--------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Utilisateurs visés**         | Utilisateurs **Pro / Enterprise**                                                                    | **Tous les utilisateurs** (y compris Community)                                                                            |
| **Facilité d'utilisation**     | ⭐⭐⭐⭐⭐ (très simple, via l'UI)                                                                  | ⭐⭐⭐ (connaissances DB de base requises)                                                                                  |
| **Exigences environnement**    | **Strictes** ; la base et la version du système doivent être très compatibles                        | **Modérées** ; il faut une base compatible                                                                                 |
| **Dépendances plugins**        | **Fortes** ; la restauration vérifie les plugins, et l'absence d'un plugin entraîne un **échec**.    | **Fonctionnellement dépendantes des plugins**. Les données s'importent indépendamment ; le système conserve ses fonctions de base, mais sans le plugin correspondant, les fonctionnalités associées seront **totalement indisponibles**. |
| **Fichiers système**           | **✅ Conservés intégralement** (modèles d'impression, fichiers téléversés, etc.)                      | **❌ Perdus** (modèles d'impression, fichiers téléversés, etc.)                                                            |
| **Scénarios recommandés**      | Utilisateurs entreprise, environnement maîtrisé et homogène, démonstration fonctionnelle complète    | Plugins partiellement absents, recherche de compatibilité et de souplesse, utilisateurs non Pro / Enterprise, perte de fichiers acceptable |

Nous espérons que ce tutoriel vous aidera à déployer la démo CRM sans accroc. Si vous rencontrez le moindre souci, n'hésitez pas à nous contacter !
