:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Employé IA · Guide de configuration pour les administrateurs

> Ce document vous aide à comprendre rapidement comment configurer et gérer les employés IA, en vous guidant étape par étape à travers l'ensemble du processus, des services de modèle à l'affectation des tâches.

## I. Avant de commencer

### 1. Prérequis système

Avant toute configuration, assurez-vous que votre environnement remplit les conditions suivantes :

* NocoBase 2.0 ou une version ultérieure est installé(e)
* Le **plugin employé IA** est activé
* Au moins un **service de modèle de langage étendu** (LLM) disponible (par exemple, OpenAI, Claude, DeepSeek, GLM, etc.)

### 2. Comprendre la conception en deux couches des employés IA

Les employés IA sont structurés en deux couches : la **« Définition du rôle »** et la **« Personnalisation des tâches »**.

| Couche                     | Description                                    | Caractéristiques                  | Fonction                    |
| -------------------------- | ---------------------------------------------- | --------------------------------- | --------------------------- |
| **Définition du rôle**     | La personnalité de base et les compétences essentielles de l'employé | Stable et immuable, comme un « CV » | Assure la cohérence du rôle |
| **Personnalisation des tâches** | Configuration pour différents scénarios métier | Flexible et ajustable             | S'adapte aux tâches spécifiques |

**Pour faire simple :**

> La « Définition du rôle » détermine qui est cet employé,
> la « Personnalisation des tâches » détermine ce qu'il fait à un instant T.

Les avantages de cette conception sont :

* Le rôle reste constant, mais peut s'adapter à différents scénarios.
* La mise à jour ou le remplacement des tâches n'affecte pas l'employé lui-même.
* Le contexte et les tâches sont indépendants, ce qui facilite la maintenance.

## II. Processus de configuration (en 5 étapes)

### Étape 1 : Configurer le service de modèle

Le service de modèle est le cerveau de l'employé IA ; il doit être configuré en premier.

> 💡 Pour des instructions de configuration détaillées, veuillez consulter : [Configurer le service LLM](/ai-employees/quick-start/llm-service)

**Chemin :**
`Paramètres système → Employé IA → Service de modèle`

![Enter configuration page](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Cliquez sur **Ajouter** et renseignez les informations suivantes :

| Élément         | Description                                        | Remarques                                 |
| --------------- | -------------------------------------------------- | ----------------------------------------- |
| Type d'interface | Par exemple, OpenAI, Claude, etc.                  | Compatible avec les services utilisant la même spécification |
| Clé API         | La clé fournie par le fournisseur de services      | Gardez-la confidentielle et changez-la régulièrement |
| Adresse du service | Point d'accès API (Endpoint)                       | À modifier en cas d'utilisation d'un proxy |
| Nom du modèle   | Nom spécifique du modèle (par exemple, gpt-4, claude-opus) | Influence les capacités et le coût        |

![Create a large model service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Après la configuration, veuillez **tester la connexion**.
En cas d'échec, vérifiez votre réseau, votre clé API ou le nom du modèle.

![Test connection](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)

### Étape 2 : Créer un employé IA

> 💡 Pour des instructions détaillées, veuillez consulter : [Créer un employé IA](/ai-employees/quick-start/ai-employees)

**Chemin :** `Gestion des employés IA → Créer un employé`

Renseignez les informations de base :

| Champ                | Obligatoire | Exemple                    |
| -------------------- | ----------- | -------------------------- |
| Nom                  | ✓           | viz, dex, cole             |
| Surnom               | ✓           | Viz, Dex, Cole             |
| Statut d'activation  | ✓           | Activé                     |
| Description          | -           | « Expert en analyse de données » |
| Prompt principal     | ✓           | Voir le guide d'ingénierie des prompts |
| Message de bienvenue | -           | « Bonjour, je suis Viz… »  |

![Basic information configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

Ensuite, liez le **service de modèle** que vous venez de configurer.

![Bind large model service](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-22-27.png)

**Suggestions pour la rédaction des prompts :**

* Décrivez clairement le rôle, le ton et les responsabilités de l'employé.
* Utilisez des mots comme « doit » et « ne doit jamais » pour souligner les règles.
* Incluez des exemples autant que possible pour éviter les descriptions abstraites.
* Maintenez la longueur entre 500 et 1000 caractères.

> Plus le prompt est clair, plus la performance de l'IA est stable.
> Vous pouvez vous référer au [Guide d'ingénierie des prompts](./prompt-engineering-guide.md).

### Étape 3 : Configurer les compétences

Les compétences déterminent ce qu'un employé « peut faire ».

> 💡 Pour des instructions détaillées, veuillez consulter : [Compétences](/ai-employees/advanced/skill)

| Type          | Champ de compétences        | Exemple                          | Niveau de risque      |
| ------------- | --------------------------- | -------------------------------- | --------------------- |
| Frontend      | Interaction avec la page    | Lire les données de bloc, remplir des formulaires | Faible                |
| Modèle de données | Requête et analyse de données | Statistiques agrégées            | Moyen                 |
| Flux de travail | Exécuter des processus métier | Outils personnalisés             | Dépend du flux de travail |
| Autre         | Extensions externes         | Recherche web, opérations sur fichiers | Variable              |

**Suggestions de configuration :**

* 3 à 5 compétences par employé est le nombre le plus approprié.
* Il n'est pas recommandé de sélectionner toutes les compétences, cela peut entraîner de la confusion.
* Désactivez l'utilisation automatique (Auto usage) avant les opérations importantes.

![Configure skills](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)

### Étape 4 : Configurer la base de connaissances (facultatif)

Si votre employé IA doit mémoriser ou référencer une grande quantité de matériel, comme des manuels de produits, des FAQ, etc., vous pouvez configurer une base de connaissances.

> 💡 Pour des instructions détaillées, veuillez consulter :
> - [Présentation de la base de connaissances IA](/ai-employees/knowledge-base/index)
> - [Base de données vectorielle](/ai-employees/knowledge-base/vector-database)
> - [Configuration de la base de connaissances](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Génération augmentée par récupération)](/ai-employees/knowledge-base/rag)

Ceci nécessite l'installation du plugin de base de données vectorielle.

![Configure knowledge base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Scénarios applicables :**

* Permettre à l'IA de comprendre les connaissances de l'entreprise.
* Prendre en charge les questions-réponses et la récupération de documents.
* Former des assistants spécifiques à un domaine.

### Étape 5 : Vérifier le résultat

Une fois l'opération terminée, vous verrez l'avatar du nouvel employé dans le coin inférieur droit de la page.

![Verify configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Veuillez vérifier chaque point :

* ✅ L'icône s'affiche-t-elle correctement ?
* ✅ Peut-il mener une conversation de base ?
* ✅ Les compétences peuvent-elles être appelées correctement ?

Si toutes les vérifications sont positives, la configuration est réussie 🎉

## III. Configuration des tâches : Mettre l'IA au travail

Jusqu'à présent, nous avons « créé un employé ». L'étape suivante consiste à le « mettre au travail ».

Les tâches IA définissent le comportement de l'employé sur une page ou un bloc spécifique.

> 💡 Pour des instructions détaillées, veuillez consulter : [Tâches](/ai-employees/advanced/task)

### 1. Tâches au niveau de la page

Applicable à l'ensemble de la page, par exemple pour « Analyser les données de cette page ».

**Point d'entrée de la configuration :**
`Paramètres de la page → Employé IA → Ajouter une tâche`

| Champ         | Description                           | Exemple                      |
| ------------- | ------------------------------------- | ---------------------------- |
| Titre         | Nom de la tâche                       | Analyse de la conversion par étape |
| Contexte      | Le contexte de la page actuelle       | Page de liste des leads      |
| Message par défaut | Début de conversation prédéfini       | « Veuillez analyser les tendances de ce mois » |
| Bloc par défaut | Associer automatiquement à une collection | tableau des leads            |
| Compétences   | Outils disponibles                    | Interroger les données, générer des graphiques |

![Page-level task configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Prise en charge de plusieurs tâches :**
Un même employé IA peut être configuré avec plusieurs tâches, présentées sous forme d'options à l'utilisateur :

![Multi-task support](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggestions :

* Une tâche doit se concentrer sur un seul objectif.
* Le nom doit être clair et facile à comprendre.
* Maintenez le nombre de tâches entre 5 et 7.

### 2. Tâches au niveau du bloc

Convient pour opérer sur un bloc spécifique, comme « Traduire le formulaire actuel ».

**Méthode de configuration :**

1. Ouvrez la configuration des actions du bloc.
2. Ajoutez « Employé IA ».

![Add AI Employee button](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Liez l'employé cible.

![Select AI Employee](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Block-level task configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Comparaison | Niveau page    | Niveau bloc             |
| ----------- | -------------- | ----------------------- |
| Portée des données | Page entière   | Bloc actuel             |
| Granularité | Analyse globale | Traitement détaillé     |
| Utilisation typique | Analyse des tendances | Traduction de formulaire, extraction de champs |

## IV. Bonnes pratiques

### 1. Suggestions de configuration

| Élément               | Suggestion                         | Raison                         |
| --------------------- | ---------------------------------- | ------------------------------ |
| Nombre de compétences | 3 à 5                              | Haute précision, réponse rapide |
| Utilisation automatique | Activer avec prudence              | Évite les opérations accidentelles |
| Longueur du prompt    | 500 à 1000 caractères              | Équilibre vitesse et qualité   |
| Objectif de la tâche  | Unique et clair                    | Évite de désorienter l'IA      |
| Flux de travail       | Utiliser après avoir encapsulé des tâches complexes | Taux de réussite plus élevé    |

### 2. Suggestions pratiques

**Commencez petit, optimisez progressivement :**

1. Créez d'abord des employés de base (par exemple, Viz, Dex).
2. Activez 1 à 2 compétences clés pour les tests.
3. Confirmez que les tâches peuvent être exécutées normalement.
4. Ensuite, étendez progressivement avec plus de compétences et de tâches.

**Processus d'optimisation continue :**

1. Faites fonctionner la version initiale.
2. Recueillez les retours des utilisateurs.
3. Optimisez les prompts et les configurations de tâches.
4. Testez et itérez.

## V. Questions fréquentes

### 1. Phase de configuration

**Q : Que faire si l'enregistrement échoue ?**
R : Vérifiez si tous les champs obligatoires sont remplis, en particulier le service de modèle et le prompt.

**Q : Quel modèle dois-je choisir ?**

* Lié au code → Claude, GPT-4
* Lié à l'analyse → Claude, DeepSeek
* Sensible au coût → Qwen, GLM
* Texte long → Gemini, Claude

### 2. Phase d'utilisation

**Q : La réponse de l'IA est trop lente ?**

* Réduisez le nombre de compétences.
* Optimisez le prompt.
* Vérifiez la latence du service de modèle.
* Envisagez de changer de modèle.

**Q : L'exécution de la tâche est imprécise ?**

* Le prompt n'est pas assez clair.
* Trop de compétences entraînent de la confusion.
* Décomposez la tâche en plus petites parties, ajoutez des exemples.

**Q : Quand l'utilisation automatique (Auto usage) doit-elle être activée ?**

* Elle peut être activée pour les tâches de type requête.
* Il est recommandé de la désactiver pour les tâches de modification de données.

**Q : Comment faire en sorte que l'IA traite un formulaire spécifique ?**

R : Pour les configurations au niveau de la page, vous devez sélectionner manuellement le bloc.

![Manually select block](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

Pour les configurations de tâches au niveau du bloc, le contexte de données est automatiquement lié.

## VI. Pour aller plus loin

Pour rendre vos employés IA encore plus performants, vous pouvez consulter les documents suivants :

**Configuration :**

* [Guide d'ingénierie des prompts](./prompt-engineering-guide.md) - Techniques et bonnes pratiques pour la rédaction de prompts de haute qualité
* [Configurer le service LLM](/ai-employees/quick-start/llm-service) - Instructions détaillées pour la configuration des services de modèle de langage étendu
* [Créer un employé IA](/ai-employees/quick-start/ai-employees) - Création et configuration de base des employés IA
* [Collaborer avec un employé IA](/ai-employees/quick-start/collaborate) - Comment avoir des conversations efficaces avec les employés IA

**Fonctionnalités avancées :**

* [Compétences](/ai-employees/advanced/skill) - Comprendre en profondeur la configuration et l'utilisation des différentes compétences
* [Tâches](/ai-employees/advanced/task) - Techniques avancées pour la configuration des tâches
* [Sélectionner un bloc](/ai-employees/advanced/pick-block) - Comment spécifier des blocs de données pour les employés IA
* [Source de données](/ai-employees/advanced/datasource) - Configuration et gestion des sources de données
* [Recherche web](/ai-employees/advanced/web-search) - Configuration de la capacité de recherche web pour les employés IA

**Base de connaissances et RAG :**

* [Présentation de la base de connaissances IA](/ai-employees/knowledge-base/index) - Introduction à la fonctionnalité de base de connaissances
* [Base de données vectorielle](/ai-employees/knowledge-base/vector-database) - Configuration de la base de données vectorielle
* [Base de connaissances](/ai-employees/knowledge-base/knowledge-base) - Comment créer et gérer une base de connaissances
* [RAG (Génération augmentée par récupération)](/ai-employees/knowledge-base/rag) - Application de la technologie RAG

**Intégration du flux de travail :**

* [Nœud LLM - Chat](/ai-employees/workflow/nodes/llm/chat) - Utilisation du chat textuel dans les flux de travail
* [Nœud LLM - Chat multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Gestion des entrées multimodales comme les images et les fichiers
* [Nœud LLM - Sortie structurée](/ai-employees/workflow/nodes/llm/structured-output) - Obtenir des réponses IA structurées

## Conclusion

Le plus important lors de la configuration des employés IA est : **faites-le fonctionner d'abord, puis optimisez**.
Faites d'abord en sorte que votre premier employé soit opérationnel, puis étendez et ajustez progressivement.

Vous pouvez dépanner dans l'ordre suivant :

1. Le service de modèle est-il connecté ?
2. Y a-t-il trop de compétences ?
3. Le prompt est-il clair ?
4. L'objectif de la tâche est-il bien défini ?

En procédant étape par étape, vous pourrez bâtir une équipe IA véritablement efficace.