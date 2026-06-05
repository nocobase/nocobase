:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Supprimer des données

Ce nœud permet de supprimer des données d'une collection qui remplissent certaines conditions.

L'utilisation du nœud de suppression est similaire à celle du nœud de mise à jour, à la différence qu'il ne nécessite pas d'affectation de champs. Il vous suffit de sélectionner la collection et les conditions de filtrage. Le résultat du nœud de suppression renvoie le nombre de lignes supprimées avec succès. Ce nombre est visible uniquement dans l'historique d'exécution et ne peut pas être utilisé comme variable dans les nœuds suivants.

:::info{title=Note}
Actuellement, le nœud de suppression ne prend pas en charge la suppression ligne par ligne ; il effectue des suppressions par lots. Il ne déclenchera donc aucun événement pour chaque suppression de donnée individuelle.
:::

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Supprimer des données » :

![Créer un nœud de suppression de données](https://static-docs.nocobase.com/e1d6b8728251fcdbed6c7f50e5570da2.png)

## Configuration du nœud

![Nœud de suppression_Configuration du nœud](https://static-docs.nocobase.com/580600c2b13ef4e01dfa48b23539648e.png)

### Collection

Sélectionnez la collection dont vous souhaitez supprimer des données.

### Conditions de filtrage

Similaires aux conditions de filtrage d'une requête de collection classique, vous pouvez utiliser les variables de contexte du flux de travail.

## Exemple

Par exemple, pour nettoyer régulièrement les données d'anciennes commandes annulées et invalides, vous pouvez utiliser le nœud de suppression :

![Nœud de suppression_Exemple_Configuration du nœud](https://static-docs.nocobase.com/b94b75077a17252f8523c3f13ce5f320.png)

Le flux de travail sera déclenché régulièrement et procédera à la suppression de toutes les données d'anciennes commandes annulées et invalides.