---
title: "Système de gestion tout-en-un - Installation"
description: "Installation et déploiement du système de gestion tout-en-un : restauration en un clic du fichier de sauvegarde .nbdata via le Gestionnaire de sauvegardes. Nécessite NocoBase v2.1.0-alpha.40 ou supérieure, PostgreSQL 16, DB_UNDERSCORED ne doit pas être à true."
keywords: "installation système tout-en-un, All-in-One, restauration de sauvegarde, Gestionnaire de sauvegardes, nbdata, PostgreSQL, NocoBase"
---

# Installation

Le système de gestion tout-en-un couvre six modules : **CRM (gestion clients), gestion commerciale, help desk (tickets), gestion de projet, gestion d'actifs et RH**. Grâce au plugin « Gestionnaire de sauvegardes » intégré à NocoBase, vous restaurez le fichier de sauvegarde `.nbdata` en un clic pour récupérer l'ensemble des données.

:::tip Prérequis

- Un environnement NocoBase fonctionnel. Pour l'installation du système principal, voir la [documentation d'installation officielle](https://docs-cn.nocobase.com/welcome/getting-started/installation)
- NocoBase en version **v2.1.0-alpha.40 ou supérieure** (open source depuis cette version, disponible en édition communautaire)
- Le fichier de sauvegarde a été téléchargé : [nocobase_all_in_one_backup_260521.nbdata](https://static-docs.nocobase.com/nocobase_all_in_one_backup_260521.nbdata)

:::

:::warning Attention

- Cette solution est conçue sur **PostgreSQL 16**, l'environnement doit utiliser PostgreSQL 16
- **`DB_UNDERSCORED` ne doit pas être à `true`** — vérifiez `docker-compose.yml`, si la variable est à `true` la restauration échouera
- **La restauration écrase TOUTES les données de l'application cible** — si l'environnement cible contient déjà des données, sauvegardez d'abord l'application actuelle puis effectuez la restauration avec prudence

:::

La version actuelle est déployée par **restauration de sauvegarde** ; les versions futures passeront à la migration incrémentale pour faciliter l'intégration dans un système NocoBase existant.

---

## Étapes

### Étape 1 : Démarrer l'application avec l'image `full`

Utilisez fortement l'image Docker en version `full`, qui embarque le client de base de données et tous les outils nécessaires sans configuration supplémentaire :

```bash
docker pull nocobase/nocobase:alpha-full
```

Démarrez ensuite le service NocoBase avec cette image.

:::tip

Sans l'image `full`, vous devrez installer manuellement le client `pg_dump` dans le conteneur, ce qui est laborieux et instable.

:::

### Étape 2 : Activer le plugin « Gestionnaire de sauvegardes »

1. Connectez-vous à NocoBase
2. Allez dans **Gestionnaire de plugins**
3. Localisez et activez le plugin **Gestionnaire de sauvegardes**

### Étape 3 : Restaurer depuis un fichier de sauvegarde local

1. Après activation, rafraîchissez la page
2. Allez dans le menu **Administration système / Gestionnaire de sauvegardes**

   ![Interface principale du Backup Manager](https://static-docs.nocobase.com/202510302154966.png)

3. Cliquez sur **Restaurer depuis une sauvegarde locale** en haut à droite
4. Glissez-déposez le fichier `nocobase_all_in_one_backup_260521.nbdata` dans la zone d'upload

   ![Restaurer depuis un fichier de sauvegarde local (dialogue d'upload)](https://static-docs.nocobase.com/202510302155602.png)

5. Cliquez sur **Soumettre** et attendez la fin de la restauration, généralement de quelques dizaines de secondes à quelques minutes

---

## Remarques

- **Compatibilité de la base de données** — version PostgreSQL, jeu de caractères et sensibilité à la casse doivent correspondre à la source, le nom du `schema` notamment doit être identique
- **Correspondance des plugins commerciaux** — tous les plugins commerciaux utilisés par la sauvegarde doivent être activés localement, sinon la restauration s'interrompt. La solution tout-en-un implique notamment : Gestionnaire d'e-mails, Journal d'audit, AI Employees. En édition Community, les points d'entrée correspondants ne s'affichent pas si ces plugins sont absents, sans affecter les autres modules

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

### L'édition Community fonctionne-t-elle ? Y a-t-il des erreurs ?

Oui, vous pouvez l'utiliser directement sans erreur. Le Gestionnaire de sauvegardes est open source depuis `v2.1.0-alpha.40` et installable en édition Community. La Demo utilise quelques plugins Enterprise (Gestionnaire d'e-mails, Journal d'audit, AI Employees, etc.) ; si l'édition Community ne les a pas, les points d'entrée correspondants ne s'affichent pas, sans affecter les autres modules. Par exemple, l'entrée Journal d'audit disparaît, mais CRM, gestion commerciale, tickets, projets, actifs et RH fonctionnent normalement.

### Quelle version utiliser après la restauration ?

Utilisez la dernière image `alpha-full` (`nocobase/nocobase:alpha-full`). L'image `full` intègre le client de base de données et les dépendances, ce qui évite les échecs de restauration par manque d'outils.

### Le logo ne s'affiche pas après la restauration ?

Le logo de la Demo officielle est restreint à un domaine et ne se charge pas sur les domaines locaux. Allez dans **Paramètres système** et téléversez votre propre logo.

### Erreur lors de l'upload de fichiers (erreur clé OSS) ?

Le moteur de stockage préconfiguré dans la sauvegarde Demo pointe vers notre OSS de démo, dont la clé n'est pas publique. Allez dans **Gestionnaire de plugins / Gestionnaire de fichiers**, définissez **Local Storage (stockage local)** comme moteur par défaut et sauvegardez : l'upload fonctionnera normalement.

Détails dans la section [Moteur de stockage de fichiers](#1-moteur-de-stockage-de-fichiers-oss--local) ci-dessus.

### Comment changer de langue ?

La solution tout-en-un est localisée dans plus de 20 langues (espace de noms `nb_demo`). Après restauration, le chinois est la langue par défaut ; pour basculer : **Paramètres système / activer la langue souhaitée**.

### Et les mises à jour incrémentales ?

Pour le moment, les mises à jour sont en mode remplacement intégral et les personnalisations sont écrasées. Sauvegardez impérativement avant toute mise à jour. Une solution de migration incrémentale est en cours de planification.
