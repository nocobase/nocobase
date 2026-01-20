:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Un-à-plusieurs

La relation entre une classe et ses étudiants est un exemple de relation un-à-plusieurs : une classe peut avoir plusieurs étudiants, mais chaque étudiant n'appartient qu'à une seule classe.

Diagramme ER :

![alt text](https://static-docs.nocobase.com/9475f044d123d28ac8e56a077411f8dc.png)

Configuration du champ :

![alt text](https://static-docs.nocobase.com/a608ce54821172dad7e8ab760107ff4e.png)

## Description des paramètres

### collection source

La collection source est la collection où se trouve le champ actuel.

### collection cible

La collection cible est la collection à laquelle vous souhaitez l'associer.

### Clé source

Le champ de la collection source qui est référencé par la clé étrangère. Il doit être unique.

### Clé étrangère

Le champ de la collection cible utilisé pour établir l'association entre les deux collections.

### Clé cible

Le champ de la collection cible utilisé pour visualiser chaque enregistrement dans le bloc de relation, généralement un champ unique.

### ON DELETE

ON DELETE fait référence aux règles appliquées aux références de clés étrangères dans les collections enfants associées lorsque des enregistrements sont supprimés dans la collection parente. C'est une option utilisée lors de la définition d'une contrainte de clé étrangère. Les options ON DELETE courantes incluent :

-   **CASCADE** : Lorsque vous supprimez un enregistrement dans la collection parente, tous les enregistrements associés dans la collection enfant sont automatiquement supprimés.
-   **SET NULL** : Lorsque vous supprimez un enregistrement dans la collection parente, les valeurs des clés étrangères dans les enregistrements associés de la collection enfant sont définies sur NULL.
-   **RESTRICT** : L'option par défaut. Elle empêche la suppression d'un enregistrement de la collection parente s'il existe des enregistrements associés dans la collection enfant.
-   **NO ACTION** : Similaire à RESTRICT. Elle empêche la suppression d'un enregistrement de la collection parente s'il existe des enregistrements associés dans la collection enfant.