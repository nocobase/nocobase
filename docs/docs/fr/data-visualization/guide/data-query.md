:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Requête de données

Le panneau de configuration des graphiques est divisé en trois sections principales : Requête de données, Options du graphique et Événements d'interaction, sans oublier les boutons Annuler, Prévisualiser et Enregistrer situés en bas.

Nous allons d'abord explorer le panneau « Requête de données » pour comprendre les deux modes de requête disponibles (Builder/SQL) et leurs fonctionnalités courantes.

## Structure du panneau

![clipboard-image-1761466636](https://static-docs.nocobase.com/clipboard-image-1761466636.png)

> Conseil : Pour faciliter la configuration du contenu actuel, vous pouvez d'abord réduire les autres panneaux.

En haut se trouve la barre d'actions :
- Mode : Builder (graphique, simple et pratique) / SQL (requêtes manuelles, plus flexible).
- Exécuter la requête : Cliquez pour lancer la requête de données.
- Voir le résultat : Ouvre le panneau des résultats de données, où vous pouvez basculer entre les vues Tableau/JSON. Cliquez à nouveau pour réduire le panneau.

De haut en bas, vous trouverez :
- Source de données et collection : Obligatoire. Sélectionnez la source de données et la collection.
- Mesures : Obligatoire. Les champs numériques à afficher.
- Dimensions : Regroupez par champs (par exemple, date, catégorie, région).
- Filtre : Définissez les conditions de filtrage (par exemple, =, ≠, >, <, contient, intervalle). Plusieurs conditions peuvent être combinées.
- Tri : Sélectionnez le champ de tri et l'ordre (croissant/décroissant).
- Pagination : Contrôlez la plage de données et l'ordre de retour.

## Mode Builder

### Sélectionner la source de données et la collection
- Dans le panneau « Requête de données », définissez le mode sur « Builder ».
- Sélectionnez une source de données et une collection. Si la collection n'est pas sélectionnable ou est vide, vérifiez d'abord les permissions et si elle a été créée.

### Configurer les mesures
- Sélectionnez un ou plusieurs champs numériques et définissez une agrégation : `Sum`, `Count`, `Avg`, `Max`, `Min`.
- Cas d'utilisation courants : `Count` pour compter les enregistrements, `Sum` pour calculer un total.

### Configurer les dimensions
- Sélectionnez un ou plusieurs champs comme dimensions de regroupement.
- Les champs de date et d'heure peuvent être formatés (par exemple, `YYYY-MM`, `YYYY-MM-DD`) pour faciliter le regroupement par mois ou par jour.

### Filtrer, trier et paginer
- Filtrer : Ajoutez des conditions (par exemple, =, ≠, contient, intervalle). Plusieurs conditions peuvent être combinées.
- Trier : Sélectionnez un champ et l'ordre de tri (croissant/décroissant).
- Paginer : Définissez `Limit` et `Offset` pour contrôler le nombre de lignes retournées. Il est recommandé de définir une petite `Limit` lors du débogage.

### Exécuter la requête et voir le résultat
- Cliquez sur « Exécuter la requête » pour l'exécuter. Une fois le résultat retourné, basculez entre `Table / JSON` dans « Voir le résultat » pour vérifier les colonnes et les valeurs.
- Avant de mapper les champs du graphique, confirmez les noms et les types de colonnes ici pour éviter un graphique vide ou des erreurs ultérieures.

![20251026174338](https://static-docs.nocobase.com/20251026174338.png)

### Mappage des champs par la suite

Par la suite, lors de la configuration des « Options du graphique », vous mapperez les champs en fonction des champs de la source de données et de la collection sélectionnées.

## Mode SQL

### Écrire la requête
- Basculez en mode « SQL », saisissez votre instruction de requête, puis cliquez sur « Exécuter la requête ».
- Exemple (montant total des commandes par date) :
```sql
SELECT
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

![20251026175952](https://static-docs.nocobase.com/20251026175952.png)

### Exécuter la requête et voir le résultat

- Cliquez sur « Exécuter la requête » pour l'exécuter. Une fois le résultat retourné, basculez entre `Table / JSON` dans « Voir le résultat » pour vérifier les colonnes et les valeurs.
- Avant de mapper les champs du graphique, confirmez les noms et les types de colonnes ici pour éviter un graphique vide ou des erreurs ultérieures.

### Mappage des champs par la suite

Par la suite, lors de la configuration des « Options du graphique », vous mapperez les champs en fonction des colonnes du résultat de la requête.

> [!TIP]
> Pour plus d'informations sur le mode SQL, veuillez consulter Utilisation avancée — Interroger les données en mode SQL.