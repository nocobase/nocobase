:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Interroger des données

Permet de rechercher et de récupérer des enregistrements de données dans une collection qui répondent à des conditions spécifiques.

Vous pouvez configurer ce nœud pour interroger un seul enregistrement ou plusieurs. Le résultat de la requête peut être utilisé comme variable dans les nœuds suivants. Lorsque vous interrogez plusieurs enregistrements, le résultat est un tableau. Si le résultat de la requête est vide, vous pouvez choisir de poursuivre ou non l'exécution des nœuds suivants.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus ("+") dans le flux pour ajouter un nœud "Interroger des données" :

![Add Query Data Node](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Configuration du nœud

![Query Node Configuration](https://static-docs.nocobase.com/20240520131324.png)

### Collection

Sélectionnez la collection à partir de laquelle vous souhaitez interroger des données.

### Type de résultat

Le type de résultat est divisé en "Enregistrement unique" et "Plusieurs enregistrements" :

-   **Enregistrement unique** : Le résultat est un objet, correspondant uniquement au premier enregistrement trouvé, ou `null`.
-   **Plusieurs enregistrements** : Le résultat sera un tableau contenant les enregistrements qui correspondent aux conditions. Si aucun enregistrement ne correspond, le tableau sera vide. Vous pouvez les traiter un par un à l'aide d'un nœud de boucle.

### Conditions de filtrage

Similaire aux conditions de filtrage d'une requête de collection classique, vous pouvez utiliser les variables de contexte du flux de travail.

### Tri

Lors de l'interrogation d'un ou plusieurs enregistrements, vous pouvez utiliser des règles de tri pour contrôler le résultat souhaité. Par exemple, pour interroger le dernier enregistrement, vous pouvez trier par le champ "Heure de création" dans l'ordre décroissant.

### Pagination

Lorsque l'ensemble des résultats peut être très volumineux, vous pouvez utiliser la pagination pour contrôler le nombre de résultats de la requête. Par exemple, pour interroger les 10 derniers enregistrements, vous pouvez trier par le champ "Heure de création" dans l'ordre décroissant, puis configurer la pagination sur 1 page avec 10 enregistrements.

### Gestion des résultats vides

En mode "Enregistrement unique", si aucune donnée ne correspond aux conditions, le résultat de la requête sera `null`. En mode "Plusieurs enregistrements", il s'agira d'un tableau vide (`[]`). Vous pouvez choisir de cocher ou non l'option "Quitter le flux de travail si le résultat de la requête est vide". Si cette option est cochée et que le résultat de la requête est vide, les nœuds suivants ne seront pas exécutés et le flux de travail se terminera prématurément avec un statut d'échec.