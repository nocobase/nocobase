:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/ai-employees/configuration/admin-configuration).
:::

# Employé IA · Guide de configuration pour les administrateurs

> Cette documentation vous aide à comprendre rapidement comment configurer et gérer les employés IA, en vous guidant étape par étape à travers l'ensemble du processus, du service de modèle à la mise en service des tâches.


## I. Avant de commencer

### 1. Exigences du système

Avant la configuration, veuillez vous assurer que votre environnement remplit les conditions suivantes :

* **NocoBase 2.0 ou version ultérieure** installée
* **Plugin Employé IA** activé
* Au moins un **service de modèle de langage étendu (LLM)** disponible (ex: OpenAI, Claude, DeepSeek, GLM, etc.)


### 2. Comprendre la conception à deux niveaux des employés IA

Les employés IA sont divisés en deux niveaux : **"Définition du rôle"** et **"Personnalisation des tâches"**.

| Niveau | Description | Caractéristiques | Rôle |
| -------- | ------------ | ---------- | ------- |
| **Définition du rôle** | Personnalité de base et capacités clés de l'employé | Stable et immuable, comme un "CV" | Assure la cohérence du rôle |
| **Personnalisation des tâches** | Configuration pour différents scénarios métier | Ajustement flexible | S'adapte aux tâches spécifiques |

**Compréhension simple :**

> La "Définition du rôle" détermine qui est cet employé,
> la "Personnalisation des tâches" détermine ce qu'il doit faire actuellement.

Les avantages de cette conception sont :

* Le rôle reste inchangé, mais peut assumer différents scénarios
* La mise à jour ou le remplacement des tâches n'affecte pas l'employé lui-même
* Le contexte et les tâches sont indépendants, facilitant la maintenance


## II. Processus de configuration (5 étapes)

### Étape 1 : Configurer le service de modèle

Le service de modèle équivaut au cerveau de l'employé IA et doit être configuré en premier.

> 💡 Pour des instructions de configuration détaillées, veuillez consulter : [Configurer le service LLM](/ai-employees/features/llm-service)

**Chemin :**
`Paramètres système → Employé IA → LLM service`

![Entrer dans la page de configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-40-47.png)

Cliquez sur **Ajouter**, et remplissez les informations suivantes :

| Élément | Description | Remarques |
| ------ | -------------------------- | --------- |
| Provider | Ex: OpenAI, Claude, Gemini, Kimi, etc. | Compatible avec les services aux spécifications identiques |
| Clé API | Clé fournie par le fournisseur de services | Gardez-la confidentielle et changez-la régulièrement |
| Base URL | API Endpoint (optionnel) | À modifier lors de l'utilisation d'un proxy |
| Enabled Models | Modèles recommandés / Sélectionner / Saisie manuelle | Détermine la gamme de modèles commutables dans la session |

![Créer un service de grand modèle](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-15-45-27.png)

Après la configuration, veuillez utiliser `Test flight` pour **tester la connexion**.
En cas d'échec, vérifiez le réseau, la clé ou le nom du modèle.

![Tester la connexion](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-18-25.png)


### Étape 2 : Créer un employé IA

> 💡 Pour des instructions détaillées, veuillez consulter : [Créer un employé IA](/ai-employees/features/new-ai-employees)

Chemin : `Gestion des employés IA → Créer un employé`

Remplissez les informations de base :

| Champ | Requis | Exemple |
| ----- | -- | -------------- |
| Nom | ✓ | viz, dex, cole |
| Surnom | ✓ | Viz, Dex, Cole |
| État d'activation | ✓ | Activé |
| Introduction | - | "Expert en analyse de données" |
| Prompt principal | ✓ | Voir le guide d'ingénierie des prompts |
| Message de bienvenue | - | "Bonjour, je suis Viz…" |

![Configuration des informations de base](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-21-09.png)

La phase de création de l'employé complète principalement la configuration du rôle et des compétences. Le modèle réellement utilisé peut être choisi dans la session via le `Model Switcher`.

**Suggestions pour la rédaction des prompts :**

* Énoncez clairement le rôle, le ton et les responsabilités de l'employé
* Utilisez des mots comme "doit" ou "jamais" pour souligner les règles
* Essayez d'inclure des exemples pour éviter les descriptions abstraites
* Limitez-vous à 500–1000 caractères

> Plus le prompt est clair, plus la performance de l'IA est stable.
> Vous pouvez vous référer au [Guide d'ingénierie des prompts](./prompt-engineering-guide.md).


### Étape 3 : Configurer les compétences

Les compétences déterminent ce que l'employé "peut faire".

> 💡 Pour des instructions détaillées, veuillez consulter : [Compétences](/ai-employees/features/tools)

| Type | Portée des capacités | Exemple | Niveau de risque |
| ---- | ------- | --------- | ------ |
| Frontend | Interaction avec la page | Lire les données du bloc, remplir un formulaire | Faible |
| Modèle de données | Requête et analyse de données | Statistiques agrégées | Moyen |
| Flux de travail | Exécuter des processus métier | Outils personnalisés | Dépend du flux de travail |
| Autre | Extensions externes | Recherche en ligne, opérations sur fichiers | Selon le cas |

**Suggestions de configuration :**

* 3 à 5 compétences par employé est idéal
* Il n'est pas recommandé de tout sélectionner pour éviter la confusion
* Pour les opérations importantes, il est conseillé d'utiliser la permission `Ask` plutôt que `Allow`

![Configurer les compétences](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-26-06.png)


### Étape 4 : Configurer la base de connaissances (facultatif)

Si votre employé IA a besoin de mémoriser ou de se référer à une grande quantité de documents, comme des manuels de produits ou des FAQ, vous pouvez configurer une base de connaissances.

> 💡 Pour des instructions détaillées, veuillez consulter :
> - [Présentation de la base de connaissances IA](/ai-employees/knowledge-base/index)
> - [Base de données vectorielle](/ai-employees/knowledge-base/vector-database)
> - [Configuration de la base de connaissances](/ai-employees/knowledge-base/knowledge-base)
> - [RAG (Génération augmentée par récupération)](/ai-employees/knowledge-base/rag)

Cela nécessite l'installation supplémentaire du plugin de base de données vectorielle.

![Configurer la base de connaissances](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-32-54.png)

**Scénarios d'application :**

* Faire comprendre à l'IA les connaissances de l'entreprise
* Soutenir les questions-réponses sur documents et la recherche
* Former des assistants spécialisés dans un domaine


### Étape 5 : Vérifier l'effet

Une fois terminé, vous verrez l'avatar du nouvel employé dans le coin inférieur droit de la page.

![Vérifier la configuration](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-36-54.png)

Veuillez vérifier chaque point :

* ✅ L'icône s'affiche-t-elle normalement
* ✅ Peut-il mener une conversation de base
* ✅ Les compétences peuvent-elles être appelées correctement

Si tout est validé, la configuration est réussie 🎉


## III. Configuration des tâches : Mettre l'IA au travail

L'étape précédente était la "création de l'employé",
il s'agit maintenant de les "faire travailler".

Les tâches IA définissent le comportement de l'employé sur une page ou un bloc spécifique.

> 💡 Pour des instructions détaillées, veuillez consulter : [Tâches](/ai-employees/features/task)


### 1. Tâches au niveau de la page

S'applique à l'ensemble de la page, par exemple "Analyser les données de cette page".

**Entrée de configuration :**
`Paramètres de la page → Employé IA → Ajouter une tâche`

| Champ | Description | Exemple |
| ---- | -------- | --------- |
| Titre | Nom de la tâche | Analyse de conversion par étape |
| Contexte | Contexte de la page actuelle | Page de liste des Leads |
| Message par défaut | Conversation prédéfinie | "Veuillez analyser les tendances de ce mois" |
| Bloc par défaut | Associer auto. une collection | Table leads |
| Compétences | Outils disponibles | Requête de données, génération de graphiques |

![Configuration de tâche au niveau de la page](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-40-34.png)

**Support multi-tâches :**
Un même employé IA peut être configuré avec plusieurs tâches, proposées sous forme d'options à l'utilisateur :

![Support multi-tâches](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-46-00.png)

Suggestions :

* Une tâche doit se concentrer sur un seul objectif
* Le nom doit être clair et compréhensible
* Contrôler le nombre de tâches entre 5 et 7


### 2. Tâches au niveau du bloc

Convient pour opérer sur un bloc spécifique, comme "Traduire le formulaire actuel".

**Méthode de configuration :**

1. Ouvrir la configuration des actions du bloc
2. Ajouter "Employé IA"

![Bouton ajouter employé IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-51-06.png)

3. Lier l'employé cible

![Sélectionner employé IA](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-52-26.png)

![Configuration de tâche au niveau du bloc](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-16-53-35.png)

| Point de comparaison | Niveau page | Niveau bloc |
| ---- | ---- | --------- |
| Portée des données | Page entière | Bloc actuel |
| Granularité | Analyse globale | Traitement détaillé |
| Usage typique | Analyse de tendances | Traduction de formulaire, extraction de champs |


## IV. Meilleures pratiques

### 1. Suggestions de configuration

| Élément | Suggestion | Raison |
| ---------- | ----------- | -------- |
| Nombre de compétences | 3–5 | Haute précision, réponse rapide |
| Mode de permission (Ask / Allow) | Ask pour modifier les données | Prévenir les erreurs de manipulation |
| Longueur du prompt | 500–1000 caractères | Équilibre entre vitesse et qualité |
| Objectif de la tâche | Unique et clair | Éviter la confusion de l'IA |
| Flux de travail | Utiliser après encapsulation | Taux de réussite plus élevé |


### 2. Suggestions pratiques

**Du plus petit au plus grand, optimiser progressivement :**

1. Créer d'abord des employés de base (ex: Viz, Dex)
2. Activer 1–2 compétences clés pour tester
3. Confirmer que les tâches s'exécutent normalement
4. Étendre progressivement vers plus de compétences et de tâches

**Processus d'optimisation continue :**

1. Faire fonctionner la version initiale
2. Collecter les retours d'utilisation
3. Optimiser les prompts et la configuration des tâches
4. Tester et améliorer en boucle


## V. Foire aux questions

### 1. Phase de configuration

**Q : Que faire si l'enregistrement échoue ?**
R : Vérifiez si tous les champs obligatoires sont remplis, en particulier le service de modèle et le prompt.

**Q : Quel modèle choisir ?**

* Type code → Claude, GPT-4
* Type analyse → Claude, DeepSeek
* Sensible au coût → Qwen, GLM
* Texte long → Gemini, Claude


### 2. Phase d'utilisation

**Q : La réponse de l'IA est trop lente ?**

* Réduire le nombre de compétences
* Optimiser le prompt
* Vérifier la latence du service de modèle
* Envisager de changer de modèle

**Q : L'exécution de la tâche est imprécise ?**

* Prompt pas assez explicite
* Trop de compétences causant de la confusion
* Diviser en petites tâches, ajouter des exemples

**Q : Quand choisir Ask / Allow ?**

* Les tâches de requête peuvent utiliser `Allow`
* Les tâches de modification de données suggèrent `Ask`

**Q : Comment faire traiter un formulaire spécifique par l'IA ?**

R : S'il s'agit d'une configuration au niveau de la page, vous devez sélectionner manuellement le bloc.

![Sélection manuelle du bloc](https://static-docs.nocobase.com/00_QuickStart_cn-2025-09-29-17-02-22.png)

S'il s'agit d'une configuration de tâche au niveau du bloc, le contexte des données est automatiquement lié.


## VI. Lectures complémentaires

Pour rendre vos employés IA plus puissants, vous pouvez continuer la lecture des documents suivants :

**Liés à la configuration :**

* [Guide d'ingénierie des prompts](./prompt-engineering-guide.md) - Techniques et meilleures pratiques pour rédiger des prompts de haute qualité
* [Configurer le service LLM](/ai-employees/features/llm-service) - Instructions détaillées sur les services de grands modèles
* [Créer un employé IA](/ai-employees/features/new-ai-employees) - Création et configuration de base des employés IA
* [Collaborer avec les employés IA](/ai-employees/features/collaborate) - Comment dialoguer efficacement avec les employés IA

**Fonctionnalités avancées :**

* [Compétences](/ai-employees/features/tools) - Comprendre en profondeur la configuration et l'usage des compétences
* [Tâches](/ai-employees/features/task) - Techniques avancées de configuration des tâches
* [Sélectionner un bloc](/ai-employees/features/pick-block) - Comment spécifier des blocs de données pour l'employé IA
* Source de données - Veuillez vous référer à la documentation du plugin de source de données correspondant
* [Recherche en ligne](/ai-employees/features/web-search) - Configurer la capacité de recherche web de l'employé IA

**Base de connaissances et RAG :**

* [Présentation de la base de connaissances IA](/ai-employees/knowledge-base/index) - Introduction aux fonctionnalités de base de connaissances
* [Base de données vectorielle](/ai-employees/knowledge-base/vector-database) - Configuration de la base de données vectorielle
* [Base de connaissances](/ai-employees/knowledge-base/knowledge-base) - Comment créer et gérer une base de connaissances
* [RAG (Génération augmentée par récupération)](/ai-employees/knowledge-base/rag) - Application de la technologie RAG

**Intégration des flux de travail :**

* [Nœud LLM - Dialogue textuel](/ai-employees/workflow/nodes/llm/chat) - Utiliser le dialogue textuel dans un flux de travail
* [Nœud LLM - Dialogue multimodal](/ai-employees/workflow/nodes/llm/multimodal-chat) - Traiter des entrées multimodales comme des images ou des fichiers
* [Nœud LLM - Sortie structurée](/ai-employees/workflow/nodes/llm/structured-output) - Obtenir des réponses IA structurées


## Conclusion

Le plus important lors de la configuration des employés IA est : **faire fonctionner d'abord, optimiser ensuite**.
Laissez d'abord le premier employé prendre son poste avec succès, puis étendez et ajustez progressivement.

L'ordre de dépannage peut suivre cette séquence :

1. Le service de modèle est-il connecté
2. Le nombre de compétences est-il excessif
3. Le prompt est-il explicite
4. L'objectif de la tâche est-il clair

En procédant étape par étape, vous pourrez bâtir une équipe IA véritablement efficace.
