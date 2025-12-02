:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Utiliser les variables

## Concepts clés

Tout comme les variables dans un langage de programmation, les **variables** dans un flux de travail sont un outil essentiel pour connecter et organiser les processus.

Lors de l'exécution de chaque nœud après le déclenchement d'un flux de travail, certains éléments de configuration peuvent utiliser des variables. La source de ces variables est constituée des données des nœuds en amont du nœud actuel, et elles se répartissent en plusieurs catégories :

-   **Données de contexte du déclencheur** : Dans des situations telles que les déclencheurs d'action ou de collection, un objet de données de ligne unique peut être utilisé comme variable par tous les nœuds. Les spécificités varient selon l'implémentation de chaque déclencheur.
-   **Données des nœuds en amont** : Lorsque le processus atteint un nœud quelconque, il s'agit des données résultantes des nœuds précédemment exécutés.
-   **Variables locales** : Lorsqu'un nœud se trouve dans des structures de branchement spécifiques, il peut utiliser des variables locales propres à cette branche. Par exemple, dans une structure de boucle, l'objet de données de chaque itération peut être utilisé.
-   **Variables système** : Certains paramètres système intégrés, tels que l'heure actuelle.

Nous avons déjà utilisé la fonctionnalité des variables à plusieurs reprises dans [Démarrage rapide](../getting-started.md). Par exemple, dans un nœud de calcul, nous pouvons utiliser des variables pour référencer les données de contexte du déclencheur afin d'effectuer des calculs :

![Nœud de calcul utilisant des fonctions et des variables](https://static-docs.nocobase.com/837e4851a4c70a1932542caadef3431b.png)

Dans un nœud de mise à jour, utilisez les données de contexte du déclencheur comme variable pour la condition de filtrage, et référencez le résultat du nœud de calcul comme variable pour la valeur du champ à mettre à jour :

![Variables du nœud de mise à jour des données](https://static-docs.nocobase.com/2e147c93643e7ebc709b9b7ab4f3af8c.png)

## Structure des données

Une variable est, en interne, une structure JSON. Vous pouvez généralement utiliser une partie spécifique des données en suivant son chemin JSON. Étant donné que de nombreuses variables sont basées sur la structure des collections de NocoBase, les données d'association seront structurées hiérarchiquement comme des propriétés d'objet, formant une structure arborescente. Par exemple, vous pouvez sélectionner la valeur d'un champ spécifique à partir des données d'association des données interrogées. De plus, lorsque les données d'association ont une structure de type "plusieurs à plusieurs", la variable peut être un tableau.

Lorsque vous sélectionnez une variable, vous devrez le plus souvent choisir l'attribut de valeur de dernier niveau, qui est généralement un type de données simple comme un nombre ou une chaîne de caractères. Cependant, lorsqu'il y a un tableau dans la hiérarchie des variables, l'attribut de dernier niveau sera également mappé à un tableau. Les données de tableau ne pourront être traitées correctement que si le nœud correspondant prend en charge les tableaux. Par exemple, dans un nœud de calcul, certains moteurs de calcul disposent de fonctions spécifiquement conçues pour gérer les tableaux. Autre exemple, dans un nœud de boucle, l'objet de boucle peut également être directement un tableau.

Par exemple, lorsqu'un nœud de requête interroge plusieurs données, le résultat du nœud sera un tableau contenant plusieurs lignes de données homogènes :

```json
[
  {
    "id": 1,
    "title": "Titre 1"
  },
  {
    "id": 2,
    "title": "Titre 2"
  }
]
```

Cependant, si vous l'utilisez comme variable dans les nœuds suivants et que la variable sélectionnée est sous la forme `Données du nœud/Nœud de requête/Titre`, vous obtiendrez un tableau mappé aux valeurs de champ correspondantes :

```json
["Titre 1", "Titre 2"]
```

S'il s'agit d'un tableau multidimensionnel (comme un champ d'association plusieurs à plusieurs), vous obtiendrez un tableau unidimensionnel avec le champ correspondant aplati.

## Variables système intégrées

### Heure système

Permet d'obtenir l'heure système au moment de l'exécution du nœud. Le fuseau horaire de cette heure est celui configuré sur le serveur.

### Paramètres de plage de dates

Peut être utilisé lors de la configuration des conditions de filtrage des champs de date dans les nœuds de requête, de mise à jour et de suppression. Il est uniquement pris en charge pour les comparaisons "est égal à". Les heures de début et de fin de la plage de dates sont toutes deux basées sur le fuseau horaire défini sur le serveur.

![Paramètres de plage de dates](https://static-docs.nocobase.com/20240817175354.png)