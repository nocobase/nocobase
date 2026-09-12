# Chapitre 1 : Découverte de NocoBase

<iframe width="800" height="450" src="https://player.bilibili.com/player.html?isOutside=true&aid=113592322098790&bvid=BV18qzRYyErc&cid=27170310323&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>

## 1.1 Découverte rapide

Tout d'abord, nous vous recommandons de découvrir rapidement NocoBase pour en mesurer la puissance. Vous pouvez vous rendre sur la [démo en ligne](https://demo-cn.nocobase.com/new), saisir votre adresse e-mail et les informations demandées, puis cliquer pour activer. Vous recevrez alors un environnement d'essai valide 2 jours, comprenant l'ensemble des plugins commerciaux :

![](https://static-docs.nocobase.com/Solution/202411052322391730820159.png)

![](https://static-docs.nocobase.com/Solution/202411052328231730820503.png)

Après réception de l'e-mail officiel de NocoBase, vous pouvez explorer librement et apprécier la flexibilité et la puissance de NocoBase. N'hésitez pas à manipuler à votre guise dans cet environnement d'essai, sans aucune crainte.

## 1.2 L'interface de base de NocoBase

Bienvenue dans NocoBase ! Lors de votre première utilisation, l'interface peut sembler un peu déroutante : on ne sait pas par où commencer. Pas d'inquiétude, familiarisons-nous pas à pas avec les principales zones fonctionnelles pour vous aider à prendre vos marques rapidement.

### 1.2.1 **Configuration de l'interface**

Lorsque vous accédez pour la première fois à NocoBase, vous voyez une interface principale claire et intuitive. En haut à droite se trouve le bouton [**Configuration de l'interface**](https://docs-cn.nocobase.com/handbook/ui/ui-editor) ; en cliquant dessus, le système bascule en mode configuration. C'est l'espace de travail principal pour construire les pages de votre système.

![Mode de configuration de l'interface](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152031029.png)

**Étapes :**

1. **Passer en mode configuration** : cliquez sur le bouton « Configuration de l'interface » en haut à droite pour entrer en mode configuration.
2. **Ajouter une page de [menu](https://docs-cn.nocobase.com/handbook/ui/menus)** :
   - Cliquez sur « Ajouter un élément de menu ».
   - Saisissez le nom du menu (par exemple « Page de test »), puis cliquez sur Confirmer.
   - Le système crée automatiquement la page et y redirige.

![demov4-001.gif](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032346.gif)

3. **Créer un [bloc](https://docs-cn.nocobase.com/handbook/ui/blocks)** :
   - Sur la page de test, cliquez sur le bouton « Créer un bloc ».
   - Parmi les types de blocs, choisissez un bloc de données, par exemple « Bloc Tableau ».
   - Reliez-le à une table de données, comme la table « Utilisateurs » fournie par défaut.
   - Sélectionnez les champs que vous souhaitez afficher, puis cliquez sur Confirmer.
4. Voilà, un bloc Tableau qui affiche la liste des utilisateurs est prêt !

![Créer un bloc](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152032964.gif)

N'est-ce pas très simple ? La conception des blocs de NocoBase s'inspire de Notion, mais avec encore plus de puissance, ce qui permet de bâtir des systèmes plus complexes. Dans la suite du tutoriel, nous explorerons en détail les fonctionnalités des différents blocs, restez à l'écoute !

### 1.2.2 **Gestionnaire de plugins**

Les plugins sont l'outil clé pour étendre les fonctionnalités de NocoBase. Dans le [**gestionnaire de plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager), vous pouvez consulter, installer, activer ou désactiver divers plugins selon vos besoins.

Grâce aux plugins, vous pouvez réaliser des intégrations pratiques voire inattendues, ce qui facilite davantage votre travail de création et de développement.

![Gestionnaire de plugins](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152034703.png)

**Étapes :**

1. **Voir les plugins installés** : cliquez sur « Gestionnaire de plugins » pour voir la liste de tous les plugins actuellement installés.
2. **Activer un plugin** :
   - Trouvez le plugin souhaité, par exemple le plugin « Theme Editor ».
   - Cliquez sur le bouton « Activer » pour activer le plugin.
3. **Tester le plugin** :
   - Une fois « Theme Editor » activé, dans le centre personnel en haut à droite, vous pouvez changer rapidement le thème du système.
     ![Changer le thème du système](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035380.gif)
   - Dans le centre des paramètres, vous trouverez l'interface de l'éditeur de thème, où vous pouvez personnaliser le thème : couleurs, polices, etc.
     ![Interface de l'éditeur de thème](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152035889.png)

### 1.2.3 **Page des paramètres**

La **page des paramètres** regroupe les options de configuration du système et de plusieurs plugins, pour vous aider à gérer NocoBase dans tous ses aspects.

![Page des paramètres](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036847.png)

**Quelques options de configuration de plugins fréquemment utilisées :**

- [**Gestion des sources de données**](https://docs-cn.nocobase.com/handbook/data-source-manager) : gérer toutes les tables de données, configurer la base principale ou des bases externes.
- [**Paramètres système**](https://docs-cn.nocobase.com/handbook/system-settings) : modifier le nom du système, le logo, la langue et autres informations de base.
- [**Utilisateurs et permissions**](https://docs-cn.nocobase.com/handbook/users) : gérer les comptes utilisateurs, configurer les permissions des différents rôles.
- [**Paramètres des plugins**](https://docs-cn.nocobase.com/handbook/plugin-manager) : configurer et gérer en détail les plugins installés.

### 1.2.4 **Informations de version et support**

En haut à droite de l'interface, vous trouverez les **informations de version de NocoBase**. Si vous avez des questions au cours de l'utilisation, n'hésitez pas à consulter la **page d'accueil** et le **manuel utilisateur** pour obtenir de l'aide.

![Informations de version](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036065.png)

### 1.2.5 **Menu du centre personnel**

Le menu du centre personnel se trouve en haut à droite de l'interface. Il permet de **modifier les informations personnelles**, de **changer de rôle** et d'effectuer d'autres opérations système importantes.
Bien sûr, certains plugins étendent également les capacités proposées ici.

![Menu du centre personnel](https://static-docs.nocobase.com/nocobase_tutorials_zh/202412152036889.png)

## 1.3 Installer NocoBase

Une fois décidé(e) à approfondir l'utilisation de NocoBase, il faut l'installer sur votre ordinateur ou votre serveur. NocoBase propose plusieurs modes d'installation : choisissez celui qui vous convient pour entamer sereinement votre voyage no-code.

### 1.3.1 **Modes d'installation**

1. **Installation Docker (recommandée)**

   - **Avantages** : rapide et simple, adapté aux utilisateurs familiers de Docker.
   - **Choix de version** :
     - **main & latest** : la version la plus stable à ce jour, adaptée à la plupart des utilisateurs.
     - **next** : version bêta interne, pour les utilisateurs qui veulent tester les nouveautés. Attention, cette version peut ne pas être totalement stable ; nous vous recommandons de sauvegarder vos données importantes avant de l'utiliser.
   - **Étapes** :
     - Suivez le [guide officiel d'installation](https://docs-cn.nocobase.com/welcome/getting-started/installation/docker-compose) pour déployer NocoBase via Docker Compose.
2. **Installation via Create-NocoBase-App**

   - **Public concerné** : développeurs front-end ou utilisateurs familiers de npm.
   - **Étapes** :
     - Suivez le [guide d'installation](https://docs-cn.nocobase.com/welcome/getting-started/installation/create-nocobase-app) pour installer via le package npm.
3. **Installation depuis les sources**

   - **Public concerné** : développeurs ayant besoin de personnaliser NocoBase en profondeur.
   - **Étapes** :
     - Suivez le [guide d'installation](https://docs-cn.nocobase.com/welcome/getting-started/installation/git-clone), clonez le code source depuis GitHub, puis installez selon vos besoins de personnalisation.

### 1.3.2 **Guide d'installation détaillé (exemple Docker)**

Quel que soit le mode choisi, vous trouverez les étapes détaillées et les explications dans la **documentation d'installation de NocoBase**. Voici un résumé de l'installation Docker pour vous aider à démarrer rapidement :

1. **Installer Docker** : assurez-vous que Docker est installé sur votre système. Sinon, rendez-vous sur le [site officiel Docker](https://www.docker.com/) pour le télécharger et l'installer.
2. **Récupérer le fichier Docker Compose** :

   - Ouvrez un terminal ou une invite de commande.
   - Créez un dossier nocobase et la configuration Docker Compose.

```bash
mkdir nocobase
cd nocobase
vim docker-compose.yml
```

3. Une fois dans `docker-compose.yml`, collez la configuration ci-dessous, ajustez-la selon vos besoins puis enregistrez le fichier.

```bash
version: "3"

networks:
  nocobase:
        driver: bridge

services:
  app:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
        networks:
          - nocobase
        depends_on:
          - postgres
        environment:
          # Clé secrète de l'application, utilisée pour générer les tokens utilisateur, etc.
          # Si APP_KEY change, les anciens tokens deviennent invalides
          # Peut être une chaîne aléatoire quelconque ; ne la divulguez pas
          - APP_KEY=your-secret-key
          # Type de base de données ; supporte postgres, mysql, mariadb, sqlite
          - DB_DIALECT=postgres
          # Hôte de la base de données ; remplaçable par l'IP d'un serveur de base existant
          - DB_HOST=postgres
          # Nom de la base
          - DB_DATABASE=nocobase
          # Utilisateur de la base
          - DB_USER=nocobase
          # Mot de passe de la base
          - DB_PASSWORD=nocobase
          # Fuseau horaire
          - TZ=Asia/Shanghai
        volumes:
          - ./storage:/app/nocobase/storage
        ports:
          - "13000:80"
        # init: true

  # Si vous utilisez un service de base de données existant, vous pouvez ne pas démarrer postgres
  postgres:
        image: registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
        restart: always
        command: postgres -c wal_level=logical
        environment:
          POSTGRES_USER: nocobase
          POSTGRES_DB: nocobase
          POSTGRES_PASSWORD: nocobase
        volumes:
          - ./storage/db/postgres:/var/lib/postgresql/data
        networks:
          - nocobase
```

4. **Démarrer NocoBase** :
   - Dans le dossier nocobase, exécutez la commande suivante pour démarrer le service :

```bash
docker-compose up -d
```

- Cela télécharge les images nécessaires et lance le service NocoBase.

5. **Accéder à NocoBase** :
   - Ouvrez votre navigateur et accédez à `http://localhost:13000` (l'adresse peut varier selon votre configuration) pour voir l'écran de connexion de NocoBase.

Une fois ces étapes réalisées, vous avez installé et démarré NocoBase avec succès ! Vous pouvez maintenant suivre le tutoriel pour commencer à construire votre propre application.

---

Au fil de ces étapes, j'espère que vous vous êtes familiarisé(e) avec l'interface de base et l'installation de NocoBase. Dans le [chapitre suivant (chapitre 2 : Concevoir le système de gestion de tâches)](https://www.nocobase.com/cn/tutorials/task-tutorial-system-design), nous explorerons plus avant la puissance de NocoBase et bâtirons des applications encore plus riches. Avançons d'un pas et lançons-nous dans l'aventure no-code !
