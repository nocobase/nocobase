:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Mécanisme de réactivité : Observable

:::info
Le mécanisme de réactivité Observable de NocoBase est fondamentalement similaire à [MobX](https://mobx.js.org/README.html). L'implémentation sous-jacente actuelle utilise [@formily/reactive](https://github.com/alibaba/formily/tree/next/packages/reactive), dont la syntaxe et les concepts sont hautement compatibles avec [MobX](https://mobx.js.org/README.html). Il n'a pas été directement utilisé pour des raisons historiques.
:::

Dans NocoBase 2.0, les objets réactifs `Observable` sont omniprésents. Ils sont au cœur du flux de données sous-jacent et de la réactivité de l'interface utilisateur, et sont largement utilisés dans des éléments tels que FlowContext, FlowModel, FlowStep, etc.

## Pourquoi choisir Observable ?

NocoBase a choisi Observable plutôt que d'autres solutions de gestion d'état comme Redux, Recoil, Zustand ou Jotai, pour les raisons principales suivantes :

-   **Extrêmement flexible** : Observable peut rendre réactif n'importe quel objet, tableau, Map, Set, etc. Il prend naturellement en charge les imbrications profondes et les structures dynamiques, ce qui le rend très adapté aux modèles métier complexes.
-   **Non-intrusif** : Vous pouvez manipuler directement l'objet original sans avoir à définir d'actions, de reducers ou de stores supplémentaires, offrant ainsi une excellente expérience de développement.
-   **Suivi automatique des dépendances** : En enveloppant un composant avec `observer`, celui-ci suit automatiquement les propriétés Observable qu'il utilise. Lorsque les données changent, l'interface utilisateur se rafraîchit automatiquement, sans nécessiter de gestion manuelle des dépendances.
-   **Adapté aux scénarios non-React** : Le mécanisme de réactivité Observable n'est pas seulement applicable à React, il peut également être combiné avec d'autres frameworks pour répondre à un éventail plus large de besoins en données réactives.

## Pourquoi utiliser observer ?

`observer` écoute les changements des objets Observable et déclenche automatiquement les mises à jour des composants React lorsque les données sont modifiées. Cela permet de maintenir votre interface utilisateur synchronisée avec vos données, sans avoir à appeler manuellement `setState` ou d'autres méthodes de mise à jour.

## Utilisation de base

```tsx
import React from 'react';
import { Input } from 'antd';
import { observer, observable } from '@nocobase/flow-engine';

const obs = observable.deep({
  value: 'aa'
});

const MyComponent = observer(() => {
  return (
    <div>
      <Input
        defaultValue={obs.value}
        onChange={(e) => {
          obs.value = e.target.value;
        }}
      />
      <div>{obs.value}</div>
    </div>
  );
});

export default MyComponent;
```

Pour en savoir plus sur l'utilisation réactive, veuillez consulter la documentation de [@formily/reactive](https://reactive.formilyjs.org/).