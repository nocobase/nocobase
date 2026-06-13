# Comment installer

> La version actuelle utilise le format **sauvegarde et restauration** pour le déploiement. Dans les versions ultérieures, nous pourrions passer à un format de **migration incrémentielle** afin de faciliter l'intégration de la solution dans vos systèmes existants.

> **Le plugin Gestionnaire de sauvegarde est désormais open source** : le plugin «[Gestionnaire de sauvegarde](https://docs-cn.nocobase.com/handbook/backups)» nécessaire à la restauration de la solution est désormais open source et disponible pour toutes les éditions (y compris l'édition Communautaire). Nous recommandons de restaurer directement via ce plugin.

Avant de commencer, veuillez vous assurer que :

- Vous disposez déjà d'un environnement d'exécution NocoBase de base. Pour l'installation du système principal, veuillez vous référer au [document d'installation officiel](https://docs-cn.nocobase.com/welcome/getting-started/installation) plus détaillé.
- Version de NocoBase **2.0.0-beta.5 et supérieure**
- Vous avez téléchargé le fichier de sauvegarde du système de tickets : [nocobase_tickets_v2_backup_260324.nbdata](https://static-docs.nocobase.com/nocobase_tickets_v2_backup_260324.nbdata)

**Remarques importantes** :
- Cette solution est basée sur la base de données **PostgreSQL 16**, veuillez vous assurer que votre environnement utilise PostgreSQL 16.
- **DB_UNDERSCORED ne peut pas être true** : Veuillez vérifier votre fichier `docker-compose.yml` et vous assurer que la variable d'environnement `DB_UNDERSCORED` n'est pas définie sur `true`, sinon cela entrera en conflit avec la sauvegarde de la solution et entraînera l'échec de la restauration.

---

## Restaurer via le gestionnaire de sauvegarde

Cette méthode utilise le plugin intégré de NocoBase "[Gestionnaire de sauvegarde](https://docs-cn.nocobase.com/handbook/backups)" pour une restauration en un clic, ce qui est l'opération la plus simple. Ce plugin est désormais open source et disponible pour toutes les éditions (y compris l'édition Communautaire).

### Caractéristiques principales

* **Avantages** :
  1. **Opération pratique** : Peut être effectuée via l'interface utilisateur, permettant de restaurer l'intégralité des configurations, y compris les plugins.
  2. **Restauration complète** : **Capable de restaurer tous les fichiers système**, y compris les fichiers d'impression de modèles, les fichiers téléchargés dans les champs de fichiers des tables, etc., garantissant l'intégrité fonctionnelle.
* **Limites** :
  1. **Exigences environnementales strictes** : Nécessite que votre environnement de base de données (version, paramètres de sensibilité à la casse, etc.) soit hautement compatible avec l'environnement où la sauvegarde a été créée.
  2. **Dépendance aux plugins** : Si la solution contient des plugins commerciaux qui ne sont pas présents dans votre environnement local, la restauration échouera.

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

J'espère que ce tutoriel vous aidera à déployer avec succès le système de tickets. Si vous rencontrez des problèmes au cours du processus, n'hésitez pas à nous contacter !
---

*Last updated: 2026-03-24*
