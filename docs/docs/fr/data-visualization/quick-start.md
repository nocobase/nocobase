:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Démarrage rapide

Ce guide vous montrera comment configurer un graphique de A à Z en utilisant les fonctionnalités essentielles. Les capacités optionnelles seront abordées dans les chapitres suivants.

Prérequis :
- Une source de données et une collection (table) doivent être configurées, et vous devez disposer des droits de lecture.

## Ajouter un bloc de graphique

Dans le concepteur de page, cliquez sur « Ajouter un bloc », sélectionnez « Graphique », puis ajoutez un bloc de graphique.

![clipboard-image-1761554593](https://static-docs.nocobase.com/clipboard-image-1761554593.png)

Après l'avoir ajouté, cliquez sur « Configurer » en haut à droite du bloc.

![clipboard-image-1761554709](https://static-docs.nocobase.com/clipboard-image-1761554709.png)

Le panneau de configuration du graphique s'ouvre sur la droite. Il comprend trois sections : Requête de données, Options du graphique et Événements.

![clipboard-image-1761554848](https://static-docs.nocobase.com/clipboard-image-1761554848.png)

## Configurer la requête de données
Dans le panneau « Requête de données », vous pouvez configurer la source de données, les filtres de requête et d'autres options.

- Sélectionnez d'abord la source de données et la collection
  - Dans le panneau « Requête de données », choisissez la source de données et la collection qui serviront de base à votre requête.
  - Si la collection n'est pas sélectionnable ou est vide, vérifiez d'abord si elle a été créée et si votre utilisateur dispose des autorisations nécessaires.

- Configurez les mesures (Measures)
  - Sélectionnez un ou plusieurs champs numériques comme mesures.
  - Définissez l'agrégation pour chaque mesure : Somme / Compte / Moyenne / Max / Min.

- Configurez les dimensions (Dimensions)
  - Sélectionnez un ou plusieurs champs comme dimensions de regroupement (date, catégorie, région, etc.).
  - Pour les champs de date/heure, vous pouvez définir un format (par exemple, `YYYY-MM`, `YYYY-MM-DD`) pour assurer une présentation cohérente.

![clipboard-image-1761555060](https://static-docs.nocobase.com/clipboard-image-1761555060.png)

D'autres options comme le filtrage, le tri et la pagination sont facultatives.

## Exécuter la requête et afficher les données

- Cliquez sur « Exécuter la requête » pour récupérer les données et afficher un aperçu du graphique directement sur la gauche.
- Vous pouvez cliquer sur « Afficher les données » pour prévisualiser les résultats renvoyés ; vous pouvez basculer entre les formats Table et JSON. Cliquez à nouveau pour masquer l'aperçu des données.
- Si le résultat est vide ou ne correspond pas à vos attentes, revenez au panneau de requête et vérifiez les autorisations de la collection, les mappages de champs pour les mesures/dimensions et les types de données.

![clipboard-image-1761555228](https://static-docs.nocobase.com/clipboard-image-1761555228.png)

## Configurer les options du graphique

Dans le panneau « Options du graphique », choisissez le type de graphique et configurez ses options.

- Sélectionnez d'abord un type de graphique (ligne/aire, colonne/barre, secteur/anneau, nuage de points, etc.).
- Complétez les mappages de champs principaux :
  - Ligne/aire/colonne/barre : `xField` (dimension), `yField` (mesure), `seriesField` (série, facultatif)
  - Secteur/anneau : `Category` (dimension catégorielle), `Value` (mesure)
  - Nuage de points : `xField`, `yField` (deux mesures ou dimensions)
  - Pour plus de paramètres de graphique, consultez la documentation ECharts : [Axis](https://echarts.apache.org/handbook/en/concepts/axis)
- Après avoir cliqué sur « Exécuter la requête », les mappages de champs sont automatiquement renseignés par défaut. Si vous modifiez les dimensions/mesures, veuillez reconfirmer les mappages.

![clipboard-image-1761555586](https://static-docs.nocobase.com/clipboard-image-1761555586.png)

## Prévisualiser et enregistrer
Les modifications de configuration mettent à jour l'aperçu en temps réel sur la gauche, mais elles ne sont pas réellement enregistrées tant que vous n'avez pas cliqué sur le bouton « Enregistrer ».

Vous pouvez également utiliser les boutons situés en bas :

- Prévisualiser : Les modifications de configuration actualisent automatiquement l'aperçu en temps réel. Vous pouvez également cliquer sur le bouton « Prévisualiser » en bas pour déclencher une actualisation manuelle.
- Annuler : Si vous ne souhaitez pas conserver les modifications actuelles, cliquez sur le bouton « Annuler » en bas ou actualisez la page pour revenir à l'état enregistré précédent.
- Enregistrer : Cliquez sur « Enregistrer » pour sauvegarder définitivement la configuration actuelle de la requête et du graphique dans la base de données ; elle prendra alors effet pour tous les utilisateurs.

![clipboard-image-1761555803](https://static-docs.nocobase.com/clipboard-image-1761555803.png)

## Conseils courants

- Configuration minimale viable : Sélectionnez une collection et au moins une mesure ; il est recommandé d'ajouter des dimensions pour un affichage groupé.
- Pour les dimensions de date, il est conseillé de définir un format approprié (par exemple, `YYYY-MM` pour une statistique mensuelle) afin d'éviter un axe X discontinu ou désordonné.
- Si la requête est vide ou que le graphique ne s'affiche pas :
  - Vérifiez la collection/les autorisations et les mappages de champs ;
  - Utilisez « Afficher les données » pour confirmer que les noms de colonnes et les types correspondent au mappage du graphique.
- L'aperçu est temporaire : Il sert uniquement à la validation et aux ajustements. Il ne prendra effet officiellement qu'après avoir cliqué sur « Enregistrer ».