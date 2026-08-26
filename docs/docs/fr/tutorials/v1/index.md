# Présentation du système de gestion de tâches

## Introduction

Bienvenue dans le monde de **NocoBase** ! Dans l'environnement commercial actuel en évolution rapide, les entreprises et les équipes de développement font souvent face aux défis suivants :

- **Des besoins métier qui changent fréquemment**, auxquels le développement traditionnel a du mal à répondre rapidement.
- **Des délais de livraison serrés**, des processus complexes et une faible efficacité.
- **Des plateformes no-code aux capacités limitées**, peinant à répondre aux exigences complexes.
- **La confidentialité des données et la stabilité du système** difficiles à garantir.
- **L'intégration avec les systèmes existants** qui pose problème et impacte l'efficacité globale.
- **La facturation à l'utilisateur ou à l'application**, avec des coûts difficiles à maîtriser.

**NocoBase** est né précisément pour résoudre ces problèmes. En tant que **plateforme de développement no-code extrêmement extensible**, NocoBase présente les avantages uniques suivants :

- **Gratuit et open source, flexible et rapide** : code source ouvert, communauté active. Installation et mise en ligne en quelques minutes, développement et déploiement instantanés.
- **Hautement extensible** : architecture micro-noyau, conception modulaire, toutes les fonctionnalités sont fournies sous forme de plugins.
- **Concepts fondamentaux uniques** : construction du système via la combinaison de sources de données, blocs et actions, pour une expérience fluide et naturelle.
- **WYSIWYG** : éditeur d'interface intuitif, conception aisée des écrans.
- **Pilotée par les données** : prise en charge de plusieurs sources de données, séparation entre la structure des données et l'interface.

## Les objectifs de conception de NocoBase

NocoBase trouve un meilleur équilibre entre **simplicité d'utilisation**, **puissance fonctionnelle** et **faible complexité**. Elle propose non seulement des modules riches répondant à divers besoins complexes, mais conserve aussi une interface utilisateur claire et intuitive qui vous permet de prendre la main facilement. De plus, le **mécanisme de plugins** permet aux utilisateurs de dépasser les limites de la plateforme et de réaliser des extensions hautement personnalisées, garantissant la flexibilité et la pérennité du système.

---

Avec cette introduction, vous avez certainement déjà une première idée de **NocoBase**. Cette série de tutoriels privilégie la pratique projet et vous guidera pas à pas pour maîtriser les concepts clés et le processus de construction de NocoBase, jusqu'à vous permettre de bâtir aisément un système de gestion de tâches simple et efficace.

## Pourquoi un système de gestion de tâches ?

Un système de gestion de tâches est un projet d'initiation idéal pour les débutants :

- d'une part, il est étroitement lié à nos besoins quotidiens ;
- d'autre part, sa structure est simple mais fortement extensible : à partir d'une simple gestion de tâches, vous pouvez progressivement le faire évoluer vers un système complet de gestion de projet.

Ce tutoriel commence par les fonctionnalités de base et couvre les modules et opérations clés de NocoBase, notamment la création de tâches, les interactions par commentaires, la gestion des permissions, la configuration des notifications, etc., afin de vous donner une vue d'ensemble des fonctionnalités fondamentales de NocoBase.

### Concepts clés et gestion de tâches

Au fil des chapitres, nous explorerons par la pratique certains concepts clés de NocoBase, notamment :

- **Tables de données (collections)** : la structure de données de base du système. Des tables comme tâches, utilisateurs, commentaires fournissent le socle informationnel.
- **Blocs (blocks)** : ils affichent les données dans la page et prennent en charge plusieurs styles de présentation. Grâce aux blocs, vous pouvez présenter dynamiquement les données dans les scénarios de création, d'édition, de consultation ou de gestion des tâches, et étendre les fonctionnalités via des plugins (par exemple, un bloc de commentaires).
- **Actions** : opérations CRUD et contrôles de gestion. Les utilisateurs peuvent créer, filtrer, mettre à jour ou supprimer les tâches et les commentaires, pour répondre à divers cas d'usage.
- **Extensions par plugins** : toutes les fonctionnalités de NocoBase sont intégrées via des plugins, ce qui rend la plateforme hautement extensible. Ce tutoriel introduira les plugins Markdown et de commentaires pour enrichir la description des tâches et la collaboration en équipe.
- **Workflows** : l'un des points forts de NocoBase. Ce tutoriel vous fera pratiquer un workflow d'automatisation simple, comme le rappel au responsable d'une tâche, pour vous donner un avant-goût de la puissance des workflows.
- ......

Prêt(e) ? Démarrons ensemble depuis [l'interface et l'installation](https://www.nocobase.com/cn/tutorials/task-tutorial-beginners-guide) et construisons votre propre système de gestion de tâches étape par étape !
