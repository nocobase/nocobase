# Chapitre 1 : Découvrir NocoBase — démarrer en 5 minutes

Dans cette série, nous partirons de zéro pour construire un **système de tickets minimaliste (HelpDesk)** avec NocoBase. L'ensemble du système ne nécessite que **2 [tables de données](/data-sources/data-modeling/collection)**, sans écrire la moindre ligne de code, et permet la soumission de tickets, la gestion des catégories, le suivi des modifications, le contrôle des permissions et un [tableau de bord](/data-visualization) de données.

Ce chapitre commence par un déploiement de NocoBase via [Docker](/get-started/installation/docker) en une commande, la première connexion, la compréhension de la différence entre [mode configuration et mode utilisation](/get-started/how-nocobase-works), et un aperçu général du système de tickets.


## 1.1 Qu'est-ce que NocoBase

Avez-vous déjà rencontré ce genre de situation :

- Votre équipe a besoin d'un système interne pour gérer son activité, mais les logiciels du marché ne correspondent jamais tout à fait
- Faire développer une solution sur mesure coûte cher, prend du temps, et les besoins évoluent sans cesse
- Vous bricolez avec Excel, mais les données deviennent confuses et la collaboration de plus en plus difficile

**NocoBase est né pour résoudre exactement ce problème.** C'est une plateforme de développement **AI no-code**, open source et hautement extensible. Vous pouvez construire votre propre système métier par configuration et glisser-déposer, sans écrire de code.

Comparé à d'autres outils no-code, NocoBase repose sur quelques principes fondamentaux :

- **Piloté par le modèle de données** : définissez d'abord les [data sources](/data-sources) et la structure des données, affichez ensuite les données via des [blocks](/interface-builder/blocks), puis traitez les données avec des [actions](/interface-builder/actions) — l'interface et les données sont totalement découplées
- **What you see is what you get** : la page est une toile, vous cliquez où vous voulez modifier, c'est aussi intuitif que de monter une page Notion
- **Tout est plugin** : toutes les fonctionnalités sont des [plugins](/development/plugin), à la manière de WordPress, à installer à la demande pour une extension flexible
- **L'IA intégrée au métier** : les [AI Employees](/ai-employees/quick-start) intégrés peuvent exécuter des tâches d'analyse, de traduction, de saisie, etc., et s'intègrent réellement à votre flux de travail
- **Open source + déploiement on-premise** : le code source est entièrement open source et vos données restent sur vos propres serveurs


## 1.2 Installer NocoBase

NocoBase prend en charge plusieurs méthodes d'installation. Nous choisissons la plus simple : l'**[installation Docker](/get-started/installation/docker)**.

### Prérequis

Vous devez avoir [Docker](https://docs.docker.com/get-docker/) et Docker Compose installés sur votre machine, et le service Docker en cours d'exécution. Windows / Mac / Linux sont tous pris en charge.

### Étape 1 : télécharger le fichier de configuration

Ouvrez un terminal (PowerShell sous Windows, Terminal sous Mac) et exécutez :

```bash
# Créer le répertoire du projet et y entrer
mkdir my-project && cd my-project

# Télécharger docker-compose.yml (utilise PostgreSQL par défaut)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **Une autre base de données ?** Remplacez `postgres` dans le lien ci-dessus par `mysql` ou `mariadb`.
> Vous pouvez aussi choisir une autre version : `latest` (stable), `beta`, `alpha` (développement). Voir la [documentation officielle d'installation](https://docs.nocobase.com/get-started/installation/docker).
>
> | Base de données | Lien de téléchargement |
> |--------|---------|
> | PostgreSQL (recommandé) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Étape 2 : démarrer

```bash
# Récupérer les images
docker compose pull

# Démarrer en arrière-plan (l'installation s'exécute automatiquement au premier lancement)
docker compose up -d

# Consulter les logs pour confirmer le démarrage
docker compose logs -f app
```

Lorsque vous voyez la ligne suivante, c'est que le démarrage est réussi :

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Étape 3 : se connecter

Ouvrez votre navigateur à l'adresse `http://localhost:13000` et connectez-vous avec le compte par défaut :

- **Identifiant** : `admin@nocobase.com`
- **Mot de passe** : `admin123`

> Pensez à changer le mot de passe par défaut juste après votre première connexion.


## 1.3 Découvrir l'interface

Une fois connecté, vous voyez une interface initiale épurée. Pas d'inquiétude — commençons par découvrir les deux concepts les plus importants.

### Mode configuration vs mode utilisation

L'interface de NocoBase a deux modes :

| Mode | Description | Pour qui |
|------|------|------|
| **Mode utilisation** | L'interface utilisée par les utilisateurs au quotidien | Tout le monde |
| **Mode configuration** | Le mode design pour construire et ajuster l'interface | Les administrateurs |

Pour basculer : cliquez sur le bouton **« [UI Editor](/get-started/how-nocobase-works) »** en haut à droite (icône en forme de surligneur).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Une fois le mode configuration activé, de nombreux éléments de la page s'entourent de **cadres orange en surbrillance** — ce qui signifie qu'ils sont configurables. Une petite icône apparaît dans le coin supérieur droit de chaque élément configurable ; il suffit de cliquer dessus pour le paramétrer.

Regardons un système de démo pour voir l'effet :

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Comme illustré ci-dessus : le menu, la barre d'actions du tableau, et le bas de la page affichent tous des indications oranges ; un clic ouvre les options de création.

> **Retenez ce principe** : dans NocoBase, pour modifier l'écran, passez en mode configuration, repérez la petite icône en haut à droite de l'élément et cliquez dessus.

### Structure de base de l'interface

L'interface de NocoBase se compose de trois zones :

```
┌──────────────────────────────────────────┐
│         Barre de navigation               │
├──────────┬───────────────────────────────┤
│          │                               │
│  Menu    │      Zone de contenu           │
│  latéral │   (où sont placés les blocks)  │
│ (group)  │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Barre de navigation** : contient les menus de premier niveau pour basculer entre les modules
- **Menu latéral (group)** : pour les menus en groupes, contient les sous-menus de second niveau qui organisent la hiérarchie des pages
- **Zone de contenu** : le corps principal de la page, où l'on place les **blocks** pour afficher et manipuler les données

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Pour l'instant, c'est encore vide — pas de souci, dès le prochain chapitre nous commencerons à le remplir.


## 1.4 Ce que nous allons construire

Dans la suite du tutoriel, nous allons construire pas à pas un **système de tickets IT**, capable de :

- ✅ Soumettre des tickets : les [utilisateurs](/users-permissions/user) renseignent un titre, une description, une catégorie et une priorité
- ✅ Liste de tickets : filtrage par statut et catégorie, vue d'ensemble immédiate
- ✅ Contrôle des [permissions](/users-permissions/acl/role) : les utilisateurs ordinaires ne voient que leurs propres tickets, les administrateurs voient tout
- ✅ Tableau de bord : statistiques en temps réel sur la répartition et les tendances des tickets
- ✅ Journal des opérations sur les données (intégré)

L'ensemble du système ne nécessite que **2 tables** :

| Table | Rôle | Champs personnalisés |
|--------|------|--------|
| Catégories de tickets | Catégories de tickets (ex. : problème réseau, panne logicielle) | 2 |
| Tickets | Table principale, qui enregistre chaque ticket | 7-8 |

Vous avez bien lu : seulement 2 tables. Pour les capacités transversales comme les utilisateurs, les permissions, la gestion des fichiers, voire les départements, l'e-mail, ou les journaux d'opérations, NocoBase fournit des plugins prêts à l'emploi — pas besoin de réinventer la roue. Nous pouvons donc nous concentrer sur nos données métier.


## Récapitulatif

Dans ce chapitre, vous avez :

1. Découvert ce qu'est NocoBase — une plateforme no-code open source
2. Installé et démarré NocoBase en une commande avec Docker
3. Compris les deux modes de l'interface (configuration / utilisation) et la structure de base
4. Eu un aperçu du système de tickets que nous allons construire

**Au prochain chapitre**, nous passerons à l'action — entrer dans la gestion des data sources et créer notre première table de données. C'est la charpente de tout le système et la capacité la plus centrale de NocoBase.

À bientôt au prochain chapitre !

## Ressources associées

- [Installation Docker en détail](/get-started/installation/docker) — options d'installation complètes et variables d'environnement
- [Configuration requise](/get-started/system-requirements) — prérequis matériels et logiciels
- [Comment fonctionne NocoBase](/get-started/how-nocobase-works) — concepts clés : data sources, blocks, actions
