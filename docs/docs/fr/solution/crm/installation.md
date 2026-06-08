---
title: "Comment installer CRM 2.0"
description: "Installation et déploiement de CRM 2.0 : restauration en un clic via le gestionnaire de sauvegardes désormais open source, nécessite PostgreSQL 16, DB_UNDERSCORED ne doit pas être à true."
keywords: "installation CRM, restauration de sauvegarde, gestionnaire de sauvegardes, PostgreSQL, NocoBase"
---

# Comment installer

> La version actuelle est déployée sous forme de **sauvegarde et restauration**. Dans les versions ultérieures, nous pourrions passer à une forme de **migration incrémentale** afin de faciliter l'intégration de la solution dans vos systèmes existants.

> **Le plugin Gestionnaire de sauvegardes est désormais open source** : le plugin «[Gestionnaire de sauvegardes](https://docs-cn.nocobase.com/handbook/backups)» nécessaire à la restauration de la solution est désormais open source et disponible pour toutes les éditions (y compris l'édition Communautaire). Nous recommandons de restaurer directement via ce plugin.

Avant de commencer, veuillez vous assurer que :

- Vous disposez déjà d'un environnement d'exécution NocoBase de base. Pour l'installation du système principal, veuillez vous référer à la [documentation d'installation officielle](https://docs-cn.nocobase.com/welcome/getting-started/installation) plus détaillée.
- Version de NocoBase **v2.1.0-beta.2 ou supérieure**
- Vous avez déjà téléchargé le fichier de sauvegarde du système CRM : [nocobase_crm_v2_backup_260523.nbdata](https://static-docs.nocobase.com/nocobase_crm_v2_backup_260523.nbdata)

**Remarques importantes** :
- Cette solution est basée sur la base de données **PostgreSQL 16** ; veuillez vous assurer que votre environnement utilise PostgreSQL 16.
- **DB_UNDERSCORED ne peut pas être à true** : veuillez vérifier votre fichier `docker-compose.yml` et vous assurer que la variable d'environnement `DB_UNDERSCORED` n'est pas définie sur `true`, sinon cela entrera en conflit avec la sauvegarde de la solution et entraînera l'échec de la restauration.

---

## Restaurer via le gestionnaire de sauvegardes

Cette méthode utilise le plugin «[Gestionnaire de sauvegardes](https://docs-cn.nocobase.com/handbook/backups)» intégré à NocoBase pour une restauration en un clic, ce qui est l'opération la plus simple. Ce plugin est désormais open source et disponible pour toutes les éditions (y compris l'édition Communautaire).

### Caractéristiques principales

* **Avantages** :
  1. **Opération pratique** : peut être effectuée via l'interface utilisateur (UI), permettant de restaurer l'intégralité des configurations, y compris les plugins.
  2. **Restauration complète** : **capable de restaurer tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés via les champs de fichiers dans les collections, etc., garantissant l'intégrité fonctionnelle.
* **Limites** :
  1. **Exigences environnementales strictes** : nécessite que votre environnement de base de données (version, paramètres de sensibilité à la casse, etc.) soit hautement compatible avec l'environnement où la sauvegarde a été créée.
  2. **Dépendance aux plugins** : si la solution contient des plugins commerciaux que vous n'avez pas dans votre environnement local, la restauration échouera.

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

## Questions fréquentes

### L'édition Pro fonctionne-t-elle ? Y aura-t-il des erreurs ?

Vous pouvez l'utiliser directement sans erreur. La démo utilise certains plugins de l'édition Entreprise (par exemple gestion des e-mails, journal d'audit, etc.) ; lorsque ces plugins sont manquants en édition Pro, les points d'entrée fonctionnels correspondants ne s'affichent pas, mais cela **n'affecte pas les autres fonctions du système**. Par exemple, l'entrée e-mail disparaît, mais les modules centraux comme prospects, opportunités, commandes, etc., fonctionnent parfaitement.

### Quelle version choisir après la restauration ?

Il est recommandé d'utiliser la dernière version de l'image `beta-full` (par exemple `nocobase/nocobase:beta-full`). L'image `full` intègre les dépendances comme le client de base de données, ce qui évite les échecs de restauration dus à des outils manquants.

### Le logo ne s'affiche pas après la restauration ?

Le logo de la démo officielle est configuré avec une restriction de domaine ; il ne peut pas être chargé depuis un domaine local. Allez dans **Paramètres système** et téléchargez à nouveau votre propre logo.

### Comment effectuer une mise à niveau incrémentale ?

Actuellement, les mises à niveau de version sont des remplacements complets ; les modifications personnalisées seront écrasées. Sauvegardez impérativement avant la mise à niveau. Une solution de migration incrémentale est en cours de planification et sera prise en charge en priorité pour les éditions Pro/Entreprise. L'édition Communautaire est plus difficile à prendre en charge pour le moment, faute de plugin de gestion de migration.

Nous espérons que ce tutoriel vous aidera à déployer avec succès le système CRM 2.0. Si vous rencontrez des problèmes lors de l'opération, n'hésitez pas à nous contacter !

---

*Last updated: 2026-04-02*
