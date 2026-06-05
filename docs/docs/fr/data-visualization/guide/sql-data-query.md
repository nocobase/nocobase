:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Interroger les données en mode SQL

Dans le panneau de Requête de données, passez en mode SQL, rédigez et exécutez la requête, puis utilisez directement le résultat obtenu pour le mappage et le rendu des graphiques.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## Rédiger des requêtes SQL
- Dans le panneau de Requête de données, sélectionnez le mode SQL.
- Saisissez votre requête SQL et cliquez sur « Exécuter la requête ».
- Le système prend en charge les requêtes SQL complètes, y compris les JOINs multi-tables complexes et les VIEWs.

Exemple : Statistiques du montant des commandes par mois
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## Afficher les résultats
- Cliquez sur « Afficher les données » pour ouvrir le panneau de prévisualisation des résultats.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

Les données sont paginées ; vous pouvez basculer entre les vues Tableau et JSON pour vérifier les noms et les types de colonnes.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## Mappage des champs
- Dans les options du graphique, mappez les champs en fonction des colonnes de résultats de votre requête.
- Par défaut, la première colonne est utilisée comme dimension (axe X ou catégorie), et la deuxième colonne comme mesure (axe Y ou valeur). Faites donc attention à l'ordre des colonnes dans votre requête SQL :

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- champ de dimension en première colonne
  SUM(total_amount) AS total -- champ de mesure ensuite
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## Utiliser les variables de contexte
Cliquez sur le bouton « x » en haut à droite de l'éditeur SQL pour sélectionner des variables de contexte.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

Après confirmation, l'expression de la variable est insérée à la position du curseur (ou remplace le texte sélectionné) dans votre requête SQL.

Par exemple, `{{ ctx.user.createdAt }}`. Attention à ne pas ajouter de guillemets supplémentaires.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## Plus d'exemples
Pour plus d'exemples d'utilisation, vous pouvez consulter l'[application de démonstration](https://demo3.sg.nocobase.com/admin/5xrop8s0bui) NocoBase.

**Conseils :**
- Stabilisez les noms de colonnes avant de les mapper aux graphiques pour éviter les erreurs ultérieures.
- Pendant la phase de débogage, utilisez `LIMIT` pour réduire le nombre de lignes renvoyées et accélérer la prévisualisation.

## Prévisualisation, enregistrement et annulation
- Cliquez sur « Exécuter la requête » pour demander les données et actualiser la prévisualisation du graphique.
- Cliquez sur « Enregistrer » pour sauvegarder le texte SQL actuel et la configuration associée dans la base de données.
- Cliquez sur « Annuler » pour revenir à l'état enregistré précédent et annuler les modifications non sauvegardées.