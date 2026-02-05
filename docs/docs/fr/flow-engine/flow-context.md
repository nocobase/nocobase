# Vue d'ensemble du système de contexte

Le système de contexte du moteur de flux de travail NocoBase est divisé en trois couches, chacune correspondant à une portée différente. Une utilisation appropriée permet un partage et une isolation flexibles des services, des configurations et des données, améliorant ainsi la maintenabilité et l'évolutivité de vos applications.

- **FlowEngineContext (Contexte global)** : Contexte global, unique à l'échelle de l'application, accessible par tous les modèles et flux de travail. Idéal pour enregistrer des services ou des configurations globales.
- **FlowModelContext (Contexte de modèle)** : Utilisé pour partager le contexte au sein d'une arborescence de modèles. Les sous-modèles délèguent automatiquement au contexte du modèle parent et supportent la surcharge de noms identiques. Convient pour l'isolation logique et des données au niveau du modèle.
- **FlowRuntimeContext (Contexte d'exécution de flux de travail)** : Créé à chaque exécution d'un flux de travail et persiste tout au long de son cycle de vie. Idéal pour le passage de données, le stockage de variables et l'enregistrement de l'état d'exécution au sein du flux de travail. Il prend en charge deux modes : `mode: 'runtime' | 'settings'`, correspondant respectivement au mode d'exécution et au mode de configuration.

Tous les `FlowEngineContext` (contexte global), `FlowModelContext` (contexte de modèle), `FlowRuntimeContext` (contexte d'exécution de flux de travail), etc., sont des sous-classes ou des instances de `FlowContext`.

---

## 🗂️ Diagramme hiérarchique

```text
FlowEngineContext (Contexte global)
│
├── FlowModelContext (Contexte de modèle)
│     ├── Sub FlowModelContext (Sous-modèle)
│     │     ├── FlowRuntimeContext (Contexte d'exécution de flux de travail)
│     │     └── FlowRuntimeContext (Contexte d'exécution de flux de travail)
│     └── FlowRuntimeContext (Contexte d'exécution de flux de travail)
│
├── FlowModelContext (Contexte de modèle)
│     └── FlowRuntimeContext (Contexte d'exécution de flux de travail)
│
└── FlowModelContext (Contexte de modèle)
      ├── Sub FlowModelContext (Sous-modèle)
      │     └── FlowRuntimeContext (Contexte d'exécution de flux de travail)
      └── FlowRuntimeContext (Contexte d'exécution de flux de travail)
```

- `FlowModelContext` peut accéder aux propriétés et méthodes de `FlowEngineContext` via un mécanisme de délégation, permettant ainsi le partage des capacités globales.
- Le `FlowModelContext` d'un sous-modèle peut accéder au contexte du modèle parent (relation synchrone) via un mécanisme de délégation, supportant la surcharge de noms identiques.
- Les modèles parents-enfants asynchrones n'établissent pas de relation de délégation pour éviter la pollution d'état.
- `FlowRuntimeContext` accède toujours à son `FlowModelContext` correspondant via un mécanisme de délégation, mais ne propage pas les changements vers le haut.

---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



## 🧭 Modes d'exécution et de configuration (`mode`)

`FlowRuntimeContext` prend en charge deux modes, distingués par le paramètre `mode` :

- `mode: 'runtime'` (Mode d'exécution) : Utilisé pendant la phase d'exécution réelle du flux de travail. Les propriétés et méthodes renvoient des données réelles. Par exemple :
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (Mode de configuration) : Utilisé pendant les phases de conception et de configuration du flux de travail. L'accès aux propriétés renvoie une chaîne de modèle de variable, facilitant la sélection d'expressions et de variables. Par exemple :
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Cette conception à double mode assure la disponibilité des données au moment de l'exécution et facilite la référence aux variables ainsi que la génération d'expressions lors de la configuration, améliorant ainsi la flexibilité et la convivialité du moteur de flux de travail.