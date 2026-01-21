:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Filtres de page et liaison

Le filtre de page (bloc de filtre) permet de saisir des conditions de filtrage de manière unifiée au niveau de la page et de les fusionner dans les requêtes des graphiques, afin d'assurer un filtrage cohérent et une liaison entre plusieurs graphiques.

## Aperçu des fonctionnalités
- Ajoutez un « bloc de filtre » à la page pour offrir un point d'entrée de filtrage unifié à tous les graphiques de la page actuelle.
- Utilisez les boutons « Filtrer », « Réinitialiser » et « Replier » pour appliquer, vider et replier les filtres.
- Si le filtre sélectionne des champs associés à un graphique, leurs valeurs sont automatiquement fusionnées dans la requête du graphique, ce qui déclenche une actualisation de celui-ci.
- Les filtres peuvent également créer des champs personnalisés et les enregistrer dans des variables de contexte, afin qu'ils puissent être référencés dans les graphiques, les tableaux, les formulaires et d'autres blocs de données.

![clipboard-image-1761487702](https://static-docs.nocobase.com/clipboard-image-1761487702.png)

Pour plus d'informations sur l'utilisation des filtres de page et leur liaison avec les graphiques ou d'autres blocs de données, veuillez consulter la documentation sur les filtres de page.

## Utilisation des valeurs de filtre de page dans les requêtes de graphique
- Mode Constructeur (recommandé)
  - Fusion automatique : Lorsque la source de données et la collection correspondent, vous n'avez pas besoin d'écrire de variables supplémentaires dans la requête du graphique ; les filtres de page sont fusionnés avec `$and`.
  - Sélection manuelle : Vous pouvez également sélectionner manuellement les valeurs des « champs personnalisés » du bloc de filtre de page dans les conditions de filtrage du graphique.

- Mode SQL (par injection de variable)
  - Dans les requêtes SQL, utilisez « Choisir une variable » pour insérer les valeurs des « champs personnalisés » du filtre de page.