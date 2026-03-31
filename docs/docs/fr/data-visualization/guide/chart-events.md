:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Événements d'interaction personnalisés

Dans l'éditeur d'événements, écrivez du JavaScript pour enregistrer des interactions via l'instance ECharts `chart` et créer des comportements liés. Par exemple, vous pouvez naviguer vers une nouvelle page ou ouvrir une boîte de dialogue pour une analyse approfondie.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Enregistrer et désenregistrer des événements
- Enregistrer : `chart.on(eventName, handler)`
- Désenregistrer : `chart.off(eventName, handler)` ou `chart.off(eventName)` pour supprimer les événements du même nom.

**Remarque :** Pour des raisons de sécurité, nous vous recommandons fortement de désenregistrer un événement avant de l'enregistrer à nouveau !

## Structure des données du paramètre `params` de la fonction `handler`

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Les champs couramment utilisés incluent `params.data` et `params.name`.

## Exemple : Clic pour sélectionner et surligner
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Surligne le point de données actuel
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Désélectionne les autres
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Exemple : Clic pour naviguer vers une page
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Option 1 : Navigation interne sans rechargement complet de la page (recommandé), nécessite uniquement un chemin relatif
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Option 2 : Naviguer vers une page externe, URL complète requise
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Option 3 : Ouvrir une page externe dans un nouvel onglet, URL complète requise
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Exemple : Clic pour ouvrir une boîte de dialogue de détails (analyse approfondie)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Enregistre les variables de contexte pour la nouvelle boîte de dialogue
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Dans la boîte de dialogue nouvellement ouverte, utilisez les variables de contexte du graphique via `ctx.view.inputArgs.XXX`.

## Prévisualiser et enregistrer
- Cliquez sur « Prévisualiser » pour charger et exécuter le code de l'événement.
- Cliquez sur « Enregistrer » pour sauvegarder la configuration actuelle de l'événement.
- Cliquez sur « Annuler » pour revenir à l'état enregistré précédent.

**Recommandations :**
- Utilisez toujours `chart.off('event')` avant de lier un événement pour éviter les exécutions en double ou l'augmentation de l'utilisation de la mémoire.
- Dans les gestionnaires d'événements, privilégiez les opérations légères (par exemple, `dispatchAction`, `setOption`) pour éviter de bloquer le processus de rendu.
- Validez avec les options du graphique et les requêtes de données pour vous assurer que les champs traités par l'événement sont cohérents avec les données actuelles.