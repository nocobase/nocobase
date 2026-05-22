---
title: "Système de gestion tout-en-un - Installation"
description: "Installation et déploiement du système de gestion tout-en-un : restauration via le Gestionnaire de sauvegardes (édition Pro/Enterprise) ou import du fichier SQL (édition Community), nécessite PostgreSQL 16, DB_UNDERSCORED ne doit pas être à true."
keywords: "installation système tout-en-un, All-in-One, restauration de sauvegarde, Gestionnaire de sauvegardes, import SQL, PostgreSQL, NocoBase"
---

# Installation

Le système de gestion tout-en-un couvre six modules : **CRM (gestion clients), gestion commerciale, help desk (tickets), gestion de projet, gestion d'actifs et RH**. Deux modes de restauration sont proposés ; choisissez celui qui correspond à votre édition de NocoBase et à votre profil technique.

:::tip Prérequis

- Un environnement NocoBase fonctionnel. Pour l'installation du système principal, voir la [documentation d'installation officielle](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- NocoBase en version **v2.1.0-alpha.34 ou supérieure**
- Un des fichiers de la solution tout-en-un téléchargé :
  - **Sauvegarde nbdata** : [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata) — pour la méthode 1
  - **Archive SQL** : [nocobase_all_in_one_sql_260521.zip](https://static-docs.nocobase.com/nocobase_all_in_one_sql_260521.zip) — pour la méthode 2

:::

:::warning Attention

- Cette solution est conçue sur **PostgreSQL 16**, l'environnement doit utiliser PostgreSQL 16
- **`DB_UNDERSCORED` ne doit pas être à `true`** — vérifiez `docker-compose.yml`, si la variable est à `true` la restauration échouera

:::

En règle générale, si vous disposez du plugin Gestionnaire de sauvegardes, choisissez la méthode 1 ; sinon, la méthode 2. La version actuelle est déployée par **restauration de sauvegarde** ; les versions futures passeront à la migration incrémentale pour faciliter l'intégration dans un système NocoBase existant.

---

## Méthode 1 : Restauration avec le Gestionnaire de sauvegardes (recommandé pour Pro/Enterprise)

Cette méthode utilise le plugin « [Gestionnaire de sauvegardes](https://docs-cn.nocobase.com/handbook/backups) » intégré à NocoBase pour une restauration en un clic. C'est l'option la plus simple, mais elle impose des contraintes strictes sur l'environnement et les plugins.

### Caractéristiques

**Avantages :**

- **Simplicité** — tout se fait dans l'UI, y compris la restauration de la configuration des plugins
- **Restauration intégrale** — tous les fichiers système sont restaurés : modèles d'impression, fichiers des champs pièces jointes, avatars des AI Employees, etc.

**Limites :**

- **Réservé à Pro/Enterprise** — le Gestionnaire de sauvegardes est un plugin entreprise, non disponible en Community
- **Exigences strictes sur l'environnement** — version de base de données, sensibilité à la casse et autres paramètres doivent être très compatibles avec la source
- **Forte dépendance aux plugins** — les plugins commerciaux de la sauvegarde doivent être présents en local, sinon la restauration échoue

### Étapes

**Étape 1 : Démarrer l'application avec l'image `full`**

Utilisez fortement l'image Docker en version `full`, qui embarque le client de base de données et tous les outils nécessaires sans configuration supplémentaire :

```bash
docker pull nocobase/nocobase:alpha-full
```

Démarrez ensuite le service NocoBase avec cette image.

:::tip

Sans l'image `full`, vous devrez installer manuellement le client `pg_dump` dans le conteneur, ce qui est laborieux et instable.

:::

**Étape 2 : Activer le plugin « Gestionnaire de sauvegardes »**

1. Connectez-vous à NocoBase
2. Allez dans **Gestionnaire de plugins**
3. Localisez et activez le plugin **Gestionnaire de sauvegardes**

**Étape 3 : Restaurer depuis un fichier de sauvegarde local**

1. Après activation, rafraîchissez la page
2. Allez dans le menu **Administration système / Gestionnaire de sauvegardes**
3. Cliquez sur **Restaurer depuis une sauvegarde locale** en haut à droite
4. Glissez-déposez le fichier `nocobase_all_in_one_backup_260521.nbdata` dans la zone d'upload
5. Cliquez sur **Soumettre** et attendez la fin de la restauration, généralement de quelques dizaines de secondes à quelques minutes

### Remarques

- **Compatibilité de la base de données** — version PostgreSQL, jeu de caractères et sensibilité à la casse doivent correspondre à la source, le nom du `schema` notamment doit être identique
- **Correspondance des plugins commerciaux** — tous les plugins commerciaux utilisés par la sauvegarde doivent être activés localement, sinon la restauration s'interrompt. La solution tout-en-un implique : Gestionnaire de sauvegardes, Gestionnaire d'e-mails, Journal d'audit, AI Employees, etc.

---

## Méthode 2 : Import direct du fichier SQL (universel)

Cette méthode manipule directement la base de données, contourne le Gestionnaire de sauvegardes et n'a pas de contraintes de version ni de plugins.

### Caractéristiques

**Avantages :**

- **Pas de restriction d'édition** — compatible avec tous les utilisateurs NocoBase, Community inclus
- **Haute compatibilité** — ne dépend pas de l'outil `dump` interne, il suffit de pouvoir se connecter à la base
- **Tolérance aux erreurs** — les plugins commerciaux absents en local ne sont simplement pas activés, sans empêcher le reste de fonctionner

**Limites :**

- **Compétences en base de données requises** — savoir exécuter un fichier `.sql`
- **Perte des fichiers système** — cette méthode entraîne la perte de tous les fichiers système : modèles d'impression, fichiers des champs pièces jointes, avatars des AI Employees, etc.

### Étapes

**Étape 1 : Préparer une base de données vide**

Préparez une nouvelle base de données vide (PostgreSQL 16) pour recevoir les données.

**Étape 2 : Importer le fichier `.sql` dans la base**

Décompressez `nocobase_all_in_one_sql_260521.zip` pour obtenir le fichier `.sql`, puis importez-le dans la base préparée. Deux façons de l'exécuter :

**Option A : Ligne de commande sur le serveur (exemple Docker)**

Si NocoBase et la base de données sont déployés via Docker, transférez le fichier `.sql` sur le serveur et importez-le avec `docker exec`. En supposant que le conteneur PostgreSQL s'appelle `my-nocobase-db` :

```bash
# Copier le fichier sql dans le conteneur
docker cp nocobase_all_in_one_sql_260521.sql my-nocobase-db:/tmp/
# Exécuter l'import dans le conteneur
docker exec -it my-nocobase-db psql -U nocobase -d nocobase -f /tmp/nocobase_all_in_one_sql_260521.sql
```

**Option B : Client de base de données distant (Navicat, etc.)**

Si la base expose un port, utilisez n'importe quel client graphique (Navicat, DBeaver, pgAdmin, etc.) pour vous y connecter, puis :

1. Faites un clic droit sur la base de données cible
2. Choisissez **Exécuter un fichier SQL** ou **Exécuter un script SQL**
3. Sélectionnez le fichier `.sql` décompressé et exécutez-le

**Étape 3 : Connecter la base et démarrer l'application**

Configurez les paramètres de démarrage de NocoBase (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD`, etc.) pour pointer vers la base où les données viennent d'être importées, puis démarrez normalement le service NocoBase.

### Remarques

- **Droits sur la base de données** — cette méthode requiert un compte avec les droits d'opérer directement sur la base
- **État des plugins** — après l'import, les données des plugins commerciaux sont présentes mais les fonctionnalités correspondantes sont inutilisables tant que les plugins ne sont pas installés. L'application ne plante pas

---

## Comparaison des deux méthodes

| Caractéristique | Méthode 1 : Gestionnaire de sauvegardes | Méthode 2 : Import SQL direct |
| :--- | :--- | :--- |
| **Public cible** | Pro/Enterprise | Tous les utilisateurs (Community inclus) |
| **Simplicité** | ⭐⭐⭐⭐⭐ (opération en UI) | ⭐⭐⭐ (connaissances BDD requises) |
| **Exigences environnement** | Strictes, compatibilité élevée requise sur BDD et système | Moyennes, simple compatibilité de la base suffit |
| **Dépendance aux plugins** | Forte, un plugin manquant fait échouer la restauration | Données importables indépendamment, mais fonctionnalités liées aux plugins absents inutilisables |
| **Fichiers système** | Conservation intégrale (modèles d'impression, fichiers téléchargés, avatars, etc.) | Perte (modèles d'impression, fichiers téléchargés, avatars, etc.) |
| **Scénarios recommandés** | Clients entreprise, environnement contrôlé | Plugins partiels, recherche de compatibilité, Community |

---

## Configuration nécessaire après l'installation

Une fois la restauration terminée, le système est accessible, mais deux configurations **pointent vers notre environnement de démo** et doivent être remplacées par les vôtres.

### 1. Moteur de stockage de fichiers (OSS / local)

Le moteur de stockage par défaut de la sauvegarde Demo pointe vers notre OSS Alibaba Cloud de démo, dont les Access Keys ne sont pas publiques : tout upload (champs pièces jointes, modèles d'impression, avatars des AI Employees) échouera.

En général, basculer sur le stockage local suffit ; n'utilisez votre propre OSS qu'en cas de besoin de CDN ou de gros fichiers.

**Étapes de bascule :**

1. Allez dans **Gestionnaire de plugins / Gestionnaire de fichiers** (ou directement `/admin/settings/file-manager`)

2. **Option A — Stockage local** (le plus simple, adapté aux déploiements autonomes) :

   - Trouvez l'entrée **Local Storage (stockage local)** créée automatiquement
   - Cliquez sur **Modifier**, cochez **Définir comme moteur de stockage par défaut** en bas du panneau, puis soumettez

   ![Configuration générique du moteur de stockage (bas « Définir comme moteur de stockage par défaut »)](https://static-docs.nocobase.com/20240529115151.png)

   :::warning Attention

   En déploiement Docker, le stockage local est dans le conteneur ; la suppression du conteneur entraîne la perte des fichiers. En production, montez un volume ou utilisez un stockage cloud.

   :::

3. **Option B — Votre propre OSS / S3 / COS** :

   - Cliquez sur **Ajouter**, choisissez le type correspondant (Alibaba Cloud OSS / Amazon S3 / Tencent Cloud COS / S3 Pro)
   - Renseignez Access Key, Bucket, Region, domaine, etc., cochez **Définir comme moteur de stockage par défaut** et soumettez

   ![Exemple de configuration du moteur OSS Alibaba Cloud](https://static-docs.nocobase.com/20240712220011.png)

4. Supprimez ou désactivez l'entrée OSS préconfigurée par la Demo pour éviter toute confusion

Voir les paramètres détaillés dans [Aperçu des moteurs de stockage](../../file-manager/storage/index.md).

### 2. Clés de service LLM des AI Employees

La sauvegarde Demo contient plusieurs services LLM préconfigurés (OpenAI, Claude, Gemini, DeepSeek, Qwen, Kimi, etc.) avec nos clés API, **qui ne fonctionnent pas en externe**. Les AI Employees sont inutilisables tant que ces clés ne sont pas remplacées.

**Étapes de configuration :**

1. Allez dans **Paramètres système / AI Employees / LLM service** (ou `/admin/settings/ai/llm-services`)

   ![Accéder à la page de configuration LLM service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

2. Dans la liste préconfigurée, vous pouvez réorganiser par glisser-déposer et activer/désactiver via le bouton `Enabled`

   ![Liste des services LLM (activation et tri)](https://static-docs.nocobase.com/ai-employees/2026-02-14/llm-service-list-enabled-and-sort.png)

3. Pour chaque service à utiliser :

   - Cliquez sur **Modifier**
   - Remplacez **API Key** par votre propre clé (depuis le compte du fournisseur : OpenAI, Anthropic, Google AI Studio, DeepSeek, Qwen, Kimi, etc.)
   - Si vous passez par un proxy ou un relais, ajustez la **Base URL**
   - Dans **Enabled Models**, gardez les modèles à utiliser et retirez les autres

   ![Édition d'un service LLM (API Key, Base URL, Enabled Models)](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

4. Cliquez sur **Test flight** en bas pour vérifier la connectivité, puis sur **Submit** pour sauvegarder

   ![Test flight de la connexion](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

5. Désactivez simplement les services non utilisés, pas besoin de les supprimer

Voir la configuration détaillée dans [Configurer le service LLM](../../ai-employees/features/llm-service.md).

:::tip

Ce sont les deux points à modifier après la restauration de la Demo. Les autres réglages (logo du site, SMTP, plugins Enterprise, etc.) se font à la demande.

:::

---

## Questions fréquentes

### L'édition Pro fonctionne-t-elle ? Y a-t-il des erreurs ?

Oui, vous pouvez l'utiliser directement sans erreur. La Demo utilise des plugins Enterprise (Gestionnaire d'e-mails, Journal d'audit, AI Employees, etc.) ; en Pro, les points d'entrée correspondants ne s'affichent pas, sans affecter les autres modules. Par exemple, l'entrée Journal d'audit disparaît, mais CRM, gestion commerciale, tickets, projets, actifs et RH fonctionnent normalement.

### Quelle version utiliser après la restauration ?

Utilisez la dernière image `alpha-full` (`nocobase/nocobase:alpha-full`). L'image `full` intègre le client de base de données et les dépendances, ce qui évite les échecs de restauration par manque d'outils.

### Le logo ne s'affiche pas après la restauration ?

Le logo de la Demo officielle est restreint à un domaine et ne se charge pas sur les domaines locaux. Allez dans **Paramètres système** et téléversez votre propre logo.

### Erreur lors de l'upload de fichiers (erreur clé OSS) ?

Après installation par SQL, l'upload de fichiers peut renvoyer des erreurs liées à OSS. Allez dans **Gestionnaire de plugins / Gestionnaire de fichiers**, définissez **Local Storage (stockage local)** comme moteur par défaut et sauvegardez : l'upload fonctionnera normalement.

Détails dans la section [Moteur de stockage de fichiers](#1-moteur-de-stockage-de-fichiers-oss--local) ci-dessus.

### Comment changer de langue ?

La solution tout-en-un est localisée dans plus de 20 langues (espace de noms `nb_demo`). Après restauration, le chinois est la langue par défaut ; pour basculer : **Paramètres système / activer la langue souhaitée**.

### Et les mises à jour incrémentales ?

Pour le moment, les mises à jour sont en mode remplacement intégral et les personnalisations sont écrasées. Sauvegardez impérativement avant toute mise à jour. Une solution de migration incrémentale est en cours de planification ; elle sera disponible en priorité pour les éditions Pro/Enterprise. L'édition Community, dépourvue du plugin Gestionnaire de migrations, est plus difficile à prendre en charge pour l'instant.
