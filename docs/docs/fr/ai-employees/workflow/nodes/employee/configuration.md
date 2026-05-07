# Nœud AI Employee

## Présentation

Le nœud AI Employee permet d'assigner un AI Employee à une tâche spécifique dans un workflow puis de produire des informations structurées en sortie.

Après avoir créé un workflow, vous pouvez sélectionner le nœud AI Employee lors de l'ajout d'un nœud de workflow.

![20260420142250](https://static-docs.nocobase.com/20260420142250.png)

## Configuration du nœud
### Préparation

Avant de configurer un nœud AI Employee, vous devez comprendre comment construire un workflow, comment configurer les services LLM, ainsi que le rôle des AI Employees intégrés et la création d'AI Employees.

Vous pouvez consulter les documents suivants :
  - [Workflow](/workflow)
  - [Configurer les services LLM](/ai-employees/features/llm-service)
  - [AI Employees intégrés](/ai-employees/features/built-in-employee)
  - [Créer un AI Employee](/ai-employees/features/new-ai-employees)

### Tâche
#### Sélectionner un AI Employee

Sélectionnez un AI Employee chargé de traiter la tâche de ce nœud. Choisissez dans la liste déroulante un AI Employee intégré activé dans le système ou un AI Employee que vous avez créé.

![20260420143554](https://static-docs.nocobase.com/20260420143554.png)

#### Sélectionner un modèle

Sélectionnez le grand modèle de langage qui pilotera l'AI Employee. Choisissez dans la liste déroulante un modèle fourni par un service LLM configuré dans le système.

![20260420145057](https://static-docs.nocobase.com/20260420145057.png)

#### Sélectionner l'opérateur

Sélectionnez un utilisateur du système pour fournir à l'AI Employee les autorisations d'accès aux données. Lors de l'interrogation des données, l'AI Employee sera limité aux autorisations de cet utilisateur.

Si le déclencheur fournit un opérateur (comme `Custom action event`), les autorisations de cet opérateur seront utilisées en priorité.

![20260420145244](https://static-docs.nocobase.com/20260420145244.png)

#### Prompts et description de la tâche

`Background` est utilisé comme prompt système envoyé à l'IA. Il est généralement utilisé pour décrire le contexte et les contraintes de la tâche.

`Default user message` est le prompt utilisateur envoyé à l'IA, généralement utilisé pour décrire le contenu de la tâche et indiquer à l'IA ce qu'elle doit faire.

![20260420174515](https://static-docs.nocobase.com/20260420174515.png)

#### Pièces jointes

`Attachments` est envoyé à l'IA en même temps que `Default user message`. Il s'agit généralement de documents ou d'images à traiter dans la tâche.

Deux types de pièces jointes sont pris en charge :

1. `File(load via Files collection)` utilise la clé primaire pour récupérer les données depuis une collection de fichiers spécifiée et les utiliser comme pièce jointe envoyée à l'IA.

![20260420150933](https://static-docs.nocobase.com/20260420150933.png)

2. `File via URL` récupère un fichier à partir d'une URL spécifiée et l'utilise comme pièce jointe envoyée à l'IA.

![20260420151702](https://static-docs.nocobase.com/20260420151702.png)

#### Compétences et outils

Habituellement, un AI Employee est associé à plusieurs compétences et outils. Vous pouvez ici limiter l'utilisation à certaines compétences ou outils dans la tâche courante.

La valeur par défaut est `Preset`, qui utilise les compétences et outils prédéfinis de l'AI Employee. Définir sur `Customer` permet de sélectionner uniquement certaines compétences ou outils de l'AI Employee.

![20260426231701](https://static-docs.nocobase.com/20260426231701.png)

#### Recherche en ligne

Le commutateur `Web search` contrôle si l'IA du nœud courant utilise la capacité de recherche en ligne. Pour en savoir plus sur la recherche en ligne des AI Employees, consultez : [Recherche en ligne](/ai-employees/features/web-search)

![20260426231945](https://static-docs.nocobase.com/20260426231945.png)

### Retour et notification
#### Sortie structurée

Vous pouvez définir la structure de données finale produite par le nœud AI Employee selon la spécification [JSON Schema](https://json-schema.org/).

![20260426232117](https://static-docs.nocobase.com/20260426232117.png)

Lorsque les autres nœuds du workflow récupèrent les données du nœud AI Employee, les options seront générées selon ce `JSON Schema`.

![20260426232509](https://static-docs.nocobase.com/20260426232509.png)

##### Valeur par défaut

La définition `JSON Schema` suivante est fournie par défaut. Elle définit un objet avec une propriété nommée result de type chaîne, et un titre Result lui est attribué.

```json
{
  "type": "object",
  "properties": {
    "result": {
      "title": "Result",
      "type": "string",
      "description": "The text message sent to the user"
    }
  }
}
```

Selon cette définition, le nœud AI Employee produira des données JSON conformes à la définition.

```json
{
  result: "Some text generated from LLM "
}
```

#### Configuration de l'approbation

Le nœud prend en charge trois modes d'approbation :

- `No required` : le contenu produit par l'IA ne nécessite pas de validation manuelle. Une fois la sortie de l'IA terminée, le workflow continue automatiquement.
- `Human decision` : le contenu produit par l'IA doit obligatoirement être notifié aux approbateurs pour validation manuelle. Le workflow ne continue qu'après validation.
- `AI decision` : l'IA décide elle-même s'il faut notifier les approbateurs pour valider le contenu produit.

![20260426232232](https://static-docs.nocobase.com/20260426232232.png)

Si le mode d'approbation n'est pas `No required`, vous devez configurer un ou plusieurs approbateurs pour le nœud.

Une fois que l'IA du nœud AI Employee a produit tout son contenu, une notification est envoyée à tous les approbateurs configurés pour ce nœud. Il suffit qu'un seul des approbateurs notifiés effectue l'approbation pour que le workflow continue.

![20260426232319](https://static-docs.nocobase.com/20260426232319.png)
