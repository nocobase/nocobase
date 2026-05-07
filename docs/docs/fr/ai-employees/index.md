---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/index).
:::

# Aperçu

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

Les employés IA (`AI Employees`) sont des capacités d'agents intelligents profondément intégrées dans les systèmes métier de NocoBase.

Ce ne sont pas des robots qui "savent seulement discuter", mais des "collègues numériques" capables de comprendre le contexte directement dans l'interface métier et d'exécuter des opérations :

- **Comprennent le contexte métier** : perçoivent la page actuelle, les blocs, la structure des données et le contenu sélectionné.
- **Peuvent exécuter directement des actions** : peuvent appeler des compétences pour accomplir des tâches de requête, d'analyse, de saisie, de configuration, de génération, etc.
- **Collaboration par rôles** : configurez différents employés selon les postes et changez de modèle au sein d'une conversation pour collaborer.

## Parcours de prise en main en 5 minutes

Consultez d'abord le [Démarrage rapide](/ai-employees/quick-start) et suivez l'ordre ci-dessous pour compléter la configuration minimale utilisable :

1. Configurez au moins un [service LLM](/ai-employees/features/llm-service).
2. Activez au moins un [employé IA](/ai-employees/features/enable-ai-employee).
3. Ouvrez une session et commencez à [collaborer avec les employés IA](/ai-employees/features/collaborate).
4. Activez la [recherche en ligne](/ai-employees/features/web-search) et les [tâches rapides](/ai-employees/features/task) selon vos besoins.

## Carte des fonctionnalités

### A. Configuration de base (Administrateur)

- [Configurer le service LLM](/ai-employees/features/llm-service) : connectez les fournisseurs (Provider), configurez et gérez les modèles disponibles.
- [Activer les employés IA](/ai-employees/features/enable-ai-employee) : activez ou désactivez les employés intégrés, contrôlez la portée de disponibilité.
- [Créer un nouvel employé IA](/ai-employees/features/new-ai-employees) : définissez le rôle, la personnalité, le message d'accueil et les limites de capacités.
- [Utiliser des compétences](/ai-employees/features/tools) : configurez les permissions des compétences (`Ask` / `Allow`) pour contrôler les risques d'exécution.

### B. Collaboration quotidienne (Utilisateurs métier)

- [Collaborer avec les employés IA](/ai-employees/features/collaborate) : changez d'employé et de modèle au sein d'une session pour une collaboration continue.
- [Ajouter du contexte - Blocs](/ai-employees/features/pick-block) : envoyez des blocs de page comme contexte à l'IA.
- [Tâches rapides](/ai-employees/features/task) : prédéfinissez des tâches courantes sur les pages/blocs et exécutez-les en un clic.
- [Recherche en ligne](/ai-employees/features/web-search) : activez la recherche augmentée pour obtenir des réponses basées sur des informations récentes.

### C. Capacités avancées (Extensions)

- [Employés IA intégrés](/ai-employees/features/built-in-employee) : découvrez le positionnement et les scénarios d'application des employés prédéfinis.
- [Contrôle des permissions](/ai-employees/permission) : contrôlez l'accès aux employés, aux compétences et aux données selon le modèle de permissions de l'organisation.
- [Base de connaissances IA](/ai-employees/knowledge-base/index) : introduisez les connaissances de l'entreprise pour améliorer la stabilité et la traçabilité des réponses.
- [Nœud LLM de flux de travail](/ai-employees/workflow/nodes/llm/chat) : orchestrez les capacités de l'IA dans des processus automatisés.

## Concepts clés (recommandé d'unifier d'abord)

Les termes suivants sont cohérents avec le glossaire ; il est recommandé de les unifier au sein de votre équipe :

- **Employé IA (AI Employee)** : un agent exécutable composé d'une personnalité (Role setting) et de compétences (Tool / Skill).
- **Service LLM (LLM Service)** : unité d'accès aux modèles et de configuration des capacités, utilisée pour gérer les fournisseurs (Provider) et la liste des modèles.
- **Fournisseur (Provider)** : le fournisseur de modèles derrière un service LLM.
- **Modèles activés (Enabled Models)** : l'ensemble des modèles que le service LLM actuel permet de choisir dans une session.
- **Sélecteur d'employé IA (AI Employee Switcher)** : permet de changer l'employé collaborateur actuel au sein d'une session.
- **Sélecteur de modèle (Model Switcher)** : permet de changer de modèle au sein d'une session et mémorise les préférences par employé.
- **Compétence (Tool / Skill)** : unité de capacité d'exécution que l'IA peut appeler.
- **Permission de compétence (Permission: Ask / Allow)** : indique si une confirmation humaine est requise avant l'appel d'une compétence.
- **Contexte (Context)** : informations sur l'environnement métier telles que les pages, les blocs et les structures de données.
- **Session (Chat)** : un processus d'interaction continue entre l'utilisateur et un employé IA.
- **Recherche en ligne (Web Search)** : capacité à compléter les réponses avec des informations en temps réel basées sur une recherche externe.
- **Base de connaissances (Knowledge Base / RAG)** : introduction des connaissances de l'entreprise via la génération augmentée par récupération.
- **Stockage vectoriel (Vector Store)** : stockage vectorisé offrant des capacités de recherche sémantique pour la base de connaissances.

## Instructions d'installation

L'employé IA est un plugin intégré de NocoBase (`@nocobase/plugin-ai`), prêt à l'emploi sans installation séparée.
