# Gestion de la localisation

## Introduction

Le plugin de gestion de la localisation est utilisé pour gérer et implémenter les ressources de localisation de NocoBase. Il permet de traduire les menus du système, les collections, les champs ainsi que tous les plugins, afin de s'adapter à la langue et à la culture de régions spécifiques.

Si vous souhaitez contribuer aux traductions par défaut du système et des plugins officiels de NocoBase, consultez [Contribution aux traductions](/get-started/translations).

## Installation

Ce plugin est un plugin intégré, aucune installation supplémentaire n'est requise.

## Instructions d'utilisation

### Activer le plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Accéder à la page de gestion de la localisation

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Synchroniser les entrées de traduction

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Actuellement, la synchronisation des contenus suivants est prise en charge :

- Packs de langues locaux du système et des plugins
- Titres des collections, titres des champs et étiquettes d'options de champs
- Titres des menus

Une fois la synchronisation terminée, le système listera toutes les entrées traduisibles pour la langue actuelle.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Conseil}
Différents modules peuvent comporter les mêmes entrées de texte original, vous devez les traduire séparément.
:::

Si les traductions des entrées intégrées du système ou des plugins ont été modifiées manuellement ou remplacées par une traduction IA, cochez `Réinitialiser les traductions des entrées intégrées du système` lors de la synchronisation. Après la synchronisation, le système remplacera les traductions intégrées existantes de la langue actuelle par celles du pack de langue intégré afin de restaurer la traduction par défaut.

### Création automatique d'entrées

Lors de l'édition d'une page, les textes personnalisés dans chaque bloc créeront automatiquement les entrées correspondantes et généreront simultanément le contenu de la traduction pour la langue actuelle.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Conseil}
Lors de la définition de textes dans le code, vous devez spécifier manuellement le ns (namespace), par exemple : `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Modifier le contenu de la traduction

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Utiliser la traduction IA

La gestion de la localisation permet de traduire les entrées avec l'employée IA Lina. Après avoir activé les employés IA et configuré un service de modèle, vous pouvez utiliser la traduction IA sur la page de gestion de la localisation afin de générer des traductions par lots pour la langue actuelle.

![](https://static-docs.nocobase.com/202605121152196.png)

Périmètres de traduction pris en charge :

- **Traduction complète** : traduit toutes les entrées éligibles de la langue actuelle.
- **Traduction incrémentale** : traduit uniquement les entrées qui n'ont pas encore de traduction.
- **Traduction des éléments sélectionnés** : sélectionnez des entrées dans le tableau et traduisez uniquement le contenu sélectionné.

La traduction IA crée une tâche en arrière-plan. Vous pouvez suivre sa progression pendant l'exécution. Une fois terminée, les traductions sont écrites dans la langue correspondante et doivent encore être relues et corrigées selon le contexte réel.

Pour le guide complet, consultez [Employée IA - Lina](/ai-employees/built-in/lina).

:::warning{title=Remarque}
Les traductions générées par IA peuvent présenter des écarts de sens, une terminologie incohérente ou une compréhension insuffisante du contexte. Avant publication, relisez manuellement les pages importantes, les termes métier et les textes destinés aux utilisateurs.
:::

### Publier la traduction

Une fois la traduction terminée, vous devez cliquer sur le bouton "Publier" pour que les modifications prennent effet.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Traduire dans d'autres langues

Activez d'autres langues dans les "Paramètres système", par exemple le chinois simplifié.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Basculez vers cet environnement linguistique.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synchronisez les entrées.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Traduisez et publiez.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
