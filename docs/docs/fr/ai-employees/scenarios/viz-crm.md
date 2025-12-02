:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Agent IA · Viz : Guide de configuration pour les scénarios CRM

> En prenant l'exemple du CRM, découvrez comment permettre à votre analyste d'insights IA de véritablement comprendre votre activité et de libérer tout son potentiel.

## 1. Introduction : Faire passer Viz de la « lecture des données » à la « compréhension de l'activité »

Dans le système NocoBase, **Viz** est un analyste d'insights IA préconfiguré.
Il peut reconnaître le contexte de la page (comme les Leads, Opportunités, Comptes) et générer des graphiques de tendances, des entonnoirs de conversion et des cartes KPI.
Cependant, par défaut, il ne dispose que des capacités de requête les plus élémentaires :

| Outil                      | Description de la fonction    | Sécurité  |
| ----------------------- | ------- | ---- |
| Get Collection Names    | Obtenir la liste des collections | ✅ Sécurisé |
| Get Collection Metadata | Obtenir la structure des champs  | ✅ Sécurisé |

Ces outils permettent à Viz de « reconnaître la structure », mais pas encore de véritablement « comprendre le contenu ».
Pour lui permettre de générer des insights, de détecter des anomalies et d'analyser des tendances, vous devez lui **fournir des outils d'analyse plus adaptés**.

Dans la démo CRM officielle, nous avons utilisé deux méthodes :

*   **Overall Analytics (Moteur d'analyse généraliste)** : Une solution modélisée, sécurisée et réutilisable ;
*   **SQL Execution (Moteur d'analyse spécialisé)** : Offre plus de flexibilité mais comporte des risques plus élevés.

Ces deux options ne sont pas les seules ; elles s'apparentent davantage à un **paradigme de conception** :

> Vous pouvez suivre ses principes pour créer une implémentation mieux adaptée à votre propre activité.

## 2. La structure de Viz : Personnalité stable + Tâches flexibles

Pour comprendre comment étendre Viz, vous devez d'abord comprendre sa conception interne en couches :

| Couche       | Description                                                 | Exemple    |
| -------- | ----------------------------------------------------------- | ----- |
| **Définition du rôle** | La personnalité et la méthode d'analyse de Viz : Comprendre → Interroger → Analyser → Visualiser | Fixe  |
| **Définition de la tâche** | Combinaisons d'invites et d'outils personnalisées pour un scénario métier spécifique             | Modifiable   |
| **Configuration de l'outil** | Le pont permettant à Viz d'appeler des sources de données externes ou des flux de travail              | Librement remplaçable |

Cette conception en couches permet à Viz de maintenir une personnalité stable (logique d'analyse cohérente),
tout en s'adaptant rapidement à différents scénarios métier (CRM, gestion hospitalière, analyse de canaux, opérations de production...).

## 3. Modèle un : Moteur d'analyse basé sur des modèles (Recommandé)

### 3.1 Aperçu du principe

**Overall Analytics** est le moteur d'analyse central de la démo CRM.
Il gère toutes les requêtes SQL via une **collection de modèles d'analyse de données (data_analysis)**.
Viz n'écrit pas directement de SQL, mais **appelle des modèles prédéfinis** pour générer les résultats.

Le flux d'exécution est le suivant :

```mermaid
flowchart TD
    A[Viz reçoit la tâche] --> B[Appelle le flux de travail Overall Analytics]
    B --> C[Fait correspondre le modèle en fonction de la page/tâche actuelle]
    C --> D[Exécute le SQL du modèle (en lecture seule)]
    D --> E[Retourne le résultat des données]
    E --> F[Viz génère le graphique + brève interprétation]
```

Ainsi, Viz peut générer des résultats d'analyse sécurisés et standardisés en quelques secondes,
et les administrateurs peuvent gérer et examiner de manière centralisée tous les modèles SQL.

### 3.2 Structure de la collection de modèles (data_analysis)

| Nom du champ                                               | Type       | Description            | Exemple                                                 |
| ------------------------------------------------- | -------- | ------------- | -------------------------------------------------- |
| **id**                                            | Integer  | Clé primaire            | 1                                                  |
| **name**                                          | Text     | Nom du modèle d'analyse        | Leads Data Analysis                                |
| **collection**                                    | Text     | Collection correspondante         | Lead                                               |
| **sql**                                           | Code     | Instruction SQL d'analyse (en lecture seule) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description**                                   | Markdown | Description ou définition du modèle       | "Compter les leads par étape"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Champ système     | Informations d'audit          | Généré automatiquement                                               |

#### Exemples de modèles dans la démo CRM

| Nom                             | Collection  | Description |
| -------------------------------- | ----------- | ----------- |
| Account Data Analysis            | Account     | Analyse des données de compte      |
| Contact Data Analysis            | Contact     | Analyse des contacts       |
| Leads Data Analysis              | Lead        | Analyse des tendances des leads      |
| Opportunity Data Analysis        | Opportunity | Entonnoir des étapes d'opportunités      |
| Task Data Analysis               | Todo Tasks  | Statistiques d'état des tâches à faire    |
| Users (Sales Reps) Data Analysis | Users       | Comparaison des performances des représentants commerciaux    |

### 3.3 Avantages de ce modèle

| Dimension       | Avantage                     |
| -------- | ---------------------- |
| **Sécurité**  | Toutes les requêtes SQL sont stockées et examinées, évitant la génération directe de requêtes. |
| **Maintenabilité** | Les modèles sont gérés de manière centralisée et mis à jour uniformément.            |
| **Réutilisabilité**  | Le même modèle peut être réutilisé par plusieurs tâches.           |
| **Portabilité** | Peut être facilement migré vers d'autres systèmes, ne nécessitant que la même structure de collection.    |
| **Expérience utilisateur** | Les utilisateurs métier n'ont pas à se soucier du SQL ; ils n'ont qu'à initier une demande d'analyse.  |

> 📘 Cette collection `data_analysis` n'est pas obligée de porter ce nom.
> L'essentiel est de : **stocker la logique d'analyse sous forme de modèle** et de la faire appeler uniformément par un flux de travail.

### 3.4 Comment faire en sorte que Viz l'utilise

Dans la définition de la tâche, vous pouvez explicitement indiquer à Viz :

```markdown
Bonjour Viz,

Veuillez analyser les données du module actuel.

**Priorité :** Utilisez l'outil Overall Analytics pour obtenir les résultats d'analyse de la collection de modèles.
**Si aucun modèle correspondant n'est trouvé :** Indiquez qu'un modèle est manquant et suggérez à l'administrateur d'en ajouter un.

Exigences de sortie :
- Générer un graphique distinct pour chaque résultat ;
- Inclure une brève description de 2 à 3 phrases sous le graphique ;
- Ne pas fabriquer de données ni faire d'hypothèses.
```

Ainsi, Viz appellera automatiquement le flux de travail, fera correspondre le SQL le plus approprié de la collection de modèles et générera le graphique.

## 4. Modèle deux : Exécuteur SQL spécialisé (À utiliser avec prudence)

### 4.1 Scénarios applicables

Lorsque vous avez besoin d'analyses exploratoires, de requêtes ad hoc ou d'agrégations JOIN sur plusieurs collections, vous pouvez demander à Viz d'appeler un outil **SQL Execution**.

Les caractéristiques de cet outil sont :

*   Viz peut générer directement des requêtes `SELECT` ;
*   Le système l'exécute et retourne le résultat ;
*   Viz est responsable de l'analyse et de la visualisation.

Exemple de tâche :

> "Veuillez analyser la tendance des taux de conversion des leads par région au cours des 90 derniers jours."

Dans ce cas, Viz pourrait générer :

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

### 4.2 Risques et recommandations de protection

| Point de risque    | Stratégie de protection            |
| ------ | --------------- |
| Génération d'opérations d'écriture  | Restreindre obligatoirement à `SELECT`  |
| Accès à des collections non pertinentes  | Valider l'existence du nom de la collection        |
| Risque de performance avec de grandes collections | Limiter la plage de temps, utiliser LIMIT pour le nombre de lignes |
| Traçabilité des opérations | Activer la journalisation des requêtes et l'audit       |
| Contrôle des permissions utilisateur | Seuls les administrateurs peuvent utiliser cet outil      |

> Recommandations générales :
>
> *   Les utilisateurs réguliers ne devraient avoir accès qu'à l'analyse basée sur des modèles (Overall Analytics) ;
> *   Seuls les administrateurs ou les analystes seniors devraient être autorisés à utiliser SQL Execution.

## 5. Si vous souhaitez créer votre propre « Overall Analytics »

Voici une approche simple et générale que vous pouvez reproduire dans n'importe quel système (sans dépendre de NocoBase) :

### Étape 1 : Concevoir la collection de modèles

Le nom de la collection peut être quelconque (par exemple, `analysis_templates`).
Elle doit simplement inclure les champs : `name`, `sql`, `collection` et `description`.

### Étape 2 : Écrire un service ou un flux de travail « Récupérer le modèle → Exécuter »

Logique :

1.  Recevoir la tâche ou le contexte de la page (par exemple, la collection actuelle) ;
2.  Faire correspondre un modèle ;
3.  Exécuter le SQL du modèle (en lecture seule) ;
4.  Retourner une structure de données standardisée (lignes + champs).

### Étape 3 : Demander à l'IA d'appeler cette interface

L'invite de tâche peut être rédigée comme suit :

```
Essayez d'abord d'appeler l'outil d'analyse de modèles. Si aucune analyse correspondante n'est trouvée dans les modèles, utilisez alors l'exécuteur SQL.
Veuillez vous assurer que toutes les requêtes sont en lecture seule et générez des graphiques pour afficher les résultats.
```

> De cette façon, votre système d'agent IA disposera de capacités d'analyse similaires à celles de la démo CRM, mais il sera entièrement indépendant et personnalisable.

## 6. Bonnes pratiques et recommandations de conception

| Recommandation                     | Description                                     |
| ---------------------- | -------------------------------------- |
| **Prioriser l'analyse basée sur des modèles**            | Sécurisée, stable et réutilisable                              |
| **Utiliser SQL Execution uniquement en complément** | Limité au débogage interne ou aux requêtes ad hoc                            |
| **Un graphique, un point clé**              | Garder la sortie claire et éviter l'encombrement excessif                            |
| **Nommage clair des modèles**             | Nommer selon la page/le domaine d'activité, par exemple `Leads-Stage-Conversion` |
| **Explications concises et claires**             | Accompagner chaque graphique d'un résumé de 2 à 3 phrases                          |
| **Indiquer l'absence de modèle**             | Informer l'utilisateur « Aucun modèle correspondant trouvé » au lieu de fournir une sortie vide                    |

## 7. De la démo CRM à votre scénario

Que vous travailliez avec un CRM hospitalier, la fabrication, la logistique d'entrepôt ou les admissions éducatives,
tant que vous pouvez répondre aux trois questions suivantes, Viz peut apporter de la valeur à votre système :

| Question             | Exemple                  |
| -------------- | ------------------- |
| **1. Que souhaitez-vous analyser ?** | Tendances des leads / Étapes de transaction / Taux d'utilisation des équipements |
| **2. Où se trouvent les données ?**   | Quelle collection, quels champs            |
| **3. Comment souhaitez-vous les présenter ?**  | Graphique linéaire, entonnoir, graphique circulaire, tableau comparatif        |

Une fois que vous avez défini ces éléments, il vous suffit de :

*   Écrire la logique d'analyse dans la collection de modèles ;
*   Attacher l'invite de tâche à la page ;
*   Viz pourra alors « prendre en charge » l'analyse de vos rapports.

## 8. Conclusion : Emportez le paradigme avec vous

« Overall Analytics » et « SQL Execution » ne sont que deux exemples d'implémentations.
Plus important encore est l'idée qui les sous-tend :

> **Faites en sorte que l'agent IA comprenne votre logique métier, au lieu de simplement exécuter des invites.**

Que vous utilisiez NocoBase, un système privé ou votre propre flux de travail personnalisé,
vous pouvez reproduire cette structure :

*   Modèles centralisés ;
*   Appels de flux de travail ;
*   Exécution en lecture seule ;
*   Présentation par l'IA.

De cette façon, Viz n'est plus seulement une « IA capable de générer des graphiques »,
mais un véritable analyste qui comprend vos données, vos définitions et votre activité.