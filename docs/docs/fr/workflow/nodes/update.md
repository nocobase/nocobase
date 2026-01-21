:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mettre à jour des données

Permet de mettre à jour les données d'une `collection` qui remplissent des conditions spécifiques.

La configuration de la `collection` et l'assignation des champs sont identiques à celles du nœud "Ajouter des données". La principale différence avec le nœud "Mettre à jour des données" est l'ajout de conditions de filtrage et la nécessité de choisir un mode de mise à jour. De plus, le nœud "Mettre à jour des données" renvoie le nombre de lignes mises à jour avec succès. Ce résultat est visible uniquement dans l'historique d'exécution et ne peut pas être utilisé comme variable dans les nœuds suivants.

## Créer le nœud

Dans l'interface de configuration du `flux de travail`, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud "Mettre à jour des données" :

![Ajouter un nœud de mise à jour de données](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Configuration du nœud

![Configuration du nœud de mise à jour de données](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

### Collection

Sélectionnez la `collection` où les données doivent être mises à jour.

### Mode de mise à jour

Il existe deux modes de mise à jour :

*   **Mise à jour en masse** : Ne déclenche pas d'événements de `collection` pour chaque enregistrement mis à jour. Elle offre de meilleures performances et convient aux opérations de mise à jour de grands volumes de données.
*   **Mise à jour individuelle** : Déclenche des événements de `collection` pour chaque enregistrement mis à jour. Cependant, cela peut entraîner des problèmes de performance avec de grands volumes de données et doit être utilisé avec prudence.

Le choix dépend généralement des données cibles à mettre à jour et de la nécessité de déclencher d'autres événements de `flux de travail`. Si vous mettez à jour un seul enregistrement basé sur la clé primaire, la "Mise à jour individuelle" est recommandée. Si vous mettez à jour plusieurs enregistrements basés sur des conditions, la "Mise à jour en masse" est recommandée.

### Conditions de filtrage

Similaires aux conditions de filtrage d'une requête de `collection` normale, vous pouvez utiliser les variables de contexte du `flux de travail`.

### Valeurs des champs

Similaire à l'assignation des champs dans le nœud "Ajouter des données", vous pouvez utiliser les variables de contexte du `flux de travail` ou saisir manuellement des valeurs statiques.

**Remarque :** Les données mises à jour par le nœud "Mettre à jour des données" dans un `flux de travail` ne gèrent pas automatiquement le champ "Dernière modification par". Vous devez configurer vous-même la valeur de ce champ si nécessaire.

## Exemple

Par exemple, lorsqu'un nouvel « Article » est créé, vous pouvez mettre à jour automatiquement le champ « Nombre d'articles » dans la `collection` « Catégorie d'articles » en utilisant le nœud "Mettre à jour des données" :

![Configuration de l'exemple du nœud de mise à jour de données](https://static-docs.nocobase.com/98e0f941c57275fc835f08260d0b2e86.png)

Une fois le `flux de travail` déclenché, le champ « Nombre d'articles » de la `collection` « Catégorie d'articles » sera automatiquement mis à jour avec la valeur actuelle + 1.