:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Foire aux questions (FAQ)

## Sélection de graphiques
### Comment choisir le graphique approprié ?
Réponse : Choisissez en fonction de vos données et de vos objectifs :
- Tendances ou évolutions : graphique linéaire ou graphique en aires
- Comparaison de valeurs : graphique à barres (verticales) ou graphique à barres (horizontales)
- Composition ou proportion : graphique circulaire (camembert) ou graphique en anneau
- Corrélation ou distribution : nuage de points
- Structure hiérarchique ou progression par étapes : graphique en entonnoir

Pour plus de types de graphiques, consultez les [exemples ECharts](https://echarts.apache.org/examples).

### Quels types de graphiques NocoBase prend-il en charge ?
Réponse : Le mode de configuration visuelle intègre les graphiques courants (linéaire, en aires, à barres verticales, à barres horizontales, circulaire, en anneau, en entonnoir, nuage de points, etc.). Le mode de configuration personnalisée vous permet d'utiliser tous les types de graphiques ECharts.

## Questions sur les requêtes de données
### Les modes de configuration visuelle et SQL sont-ils interopérables ?
Réponse : Non, ils ne sont pas interopérables. Leurs configurations sont stockées indépendamment. Le mode de configuration utilisé lors de votre dernière sauvegarde est celui qui prend effet.

## Options de graphique
### Comment configurer les champs d'un graphique ?
Réponse : En mode de configuration visuelle, sélectionnez les champs de données correspondants au type de graphique. Par exemple, les graphiques linéaires ou à barres nécessitent la configuration des champs pour l'axe X et l'axe Y ; les graphiques circulaires nécessitent un champ de catégorie et un champ de valeur.
Nous vous recommandons d'exécuter d'abord la « Requête » pour vérifier si les données correspondent à vos attentes. Par défaut, les champs du graphique sont automatiquement mis en correspondance.

## Prévisualisation et sauvegarde
### Dois-je prévisualiser les modifications manuellement ?
Réponse : En mode de configuration visuelle, les modifications sont automatiquement prévisualisées. En modes SQL et de configuration personnalisée, pour éviter des actualisations fréquentes, veuillez terminer votre édition et cliquer manuellement sur « Prévisualiser ».

### Pourquoi l'aperçu du graphique disparaît-il après la fermeture de la fenêtre contextuelle ?
Réponse : L'aperçu est uniquement destiné à une visualisation temporaire. Après avoir modifié la configuration, veuillez d'abord enregistrer avant de fermer ; les modifications non enregistrées ne seront pas conservées.