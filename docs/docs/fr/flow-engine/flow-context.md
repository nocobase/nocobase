:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/flow-engine/flow-context).
:::

# Aperçu du système de contexte

Le système de contexte du moteur de flux de travail de NocoBase est divisé en trois couches, correspondant à des portées différentes. Une utilisation raisonnable permet de réaliser un partage et une isolation flexibles des services, des configurations et des données, améliorant ainsi la maintenabilité et l'extensibilité de vos activités.

- **FlowEngineContext (contexte global)** : Unique au niveau global, accessible par tous les modèles et flux de travail, adapté à l'enregistrement de services globaux, de configurations, etc.
- **FlowModelContext (contexte de modèle)** : Utilisé pour partager le contexte au sein de l'arborescence de modèles, les sous-modèles délèguent automatiquement au contexte du modèle parent, prend en charge la surcharge par le même nom, adapté à l'isolation de la logique et des données au niveau du modèle.
- **FlowRuntimeContext (contexte d'exécution de flux de travail)** : Créé à chaque exécution de flux de travail, traverse tout le cycle d'exécution du flux de travail, adapté à la transmission de données, au stockage de variables, à l'enregistrement de l'état d'exécution, etc. Prend en charge deux modes `mode: 'runtime' | 'settings'`, correspondant respectivement à l'état d'exécution et à l'état de configuration.

Tous les `FlowEngineContext` (contexte global), `FlowModelContext` (contexte de modèle), `FlowRuntimeContext` (contexte d'exécution de flux de travail), etc., sont des sous-classes ou des instances de `FlowContext`.

---

## 🗂️ Diagramme hiérarchique

```text
FlowEngineContext (contexte global)
│
├── FlowModelContext (contexte de modèle)
│     ├── Sous FlowModelContext (sous-modèle)
│     │     ├── FlowRuntimeContext (contexte d'exécution de flux de travail)
│     │     └── FlowRuntimeContext (contexte d'exécution de flux de travail)
│     └── FlowRuntimeContext (contexte d'exécution de flux de travail)
│
├── FlowModelContext (contexte de modèle)
│     └── FlowRuntimeContext (contexte d'exécution de flux de travail)
│
└── FlowModelContext (contexte de modèle)
      ├── Sous FlowModelContext (sous-modèle)
      │     └── FlowRuntimeContext (contexte d'exécution de flux de travail)
      └── FlowRuntimeContext (contexte d'exécution de flux de travail)
```

- `FlowModelContext` peut accéder aux propriétés et méthodes de `FlowEngineContext` via un mécanisme de délégation (delegate), réalisant le partage des capacités globales.
- Le `FlowModelContext` d'un sous-modèle peut accéder au contexte du modèle parent (relation synchrone) via un mécanisme de délégation (delegate), prenant en charge la surcharge par le même nom.
- Les modèles parents-enfants asynchrones n'établissent pas de relation de délégation (delegate) afin d'éviter la pollution d'état.
- `FlowRuntimeContext` accède toujours à son `FlowModelContext` correspondant via un mécanisme de délégation (delegate), mais ne remonte pas les informations vers le haut.

---

## 🧭 État d'exécution et état de configuration (mode)

`FlowRuntimeContext` prend en charge deux modes, distingués par le paramètre `mode` :

- `mode: 'runtime'` (état d'exécution) : Utilisé pour la phase d'exécution réelle du flux de travail, les propriétés et méthodes renvoient des données réelles. Par exemple :
  ```js
  console.log(runtimeCtx.steps.step1.result); // 42
  ```

- `mode: 'settings'` (état de configuration) : Utilisé pour la phase de conception et de configuration du flux de travail, l'accès aux propriétés renvoie une chaîne de modèle de variable, facilitant les expressions et la sélection de variables. Par exemple :
  ```js
  console.log(settingsCtx.steps.step1.result); // '{{ ctx.steps.step1.result }}'
  ```

Cette conception à double mode garantit à la fois la disponibilité des données au moment de l'exécution et facilite la référence aux variables et la génération d'expressions lors de la configuration, améliorant la flexibilité et la facilité d'utilisation du moteur de flux de travail.

---

## 🤖 Informations de contexte pour les outils/LLM

Dans certains scénarios (par exemple, l'édition de code RunJS de JS*Model, le codage IA), il est nécessaire de permettre à l'« appelant » de comprendre, sans exécuter le code :

- Quelles sont les **capacités statiques** sous le `ctx` actuel (documentation API, paramètres, exemples, liens de documentation, etc.)
- Quelles sont les **variables optionnelles** dans l'interface/l'état d'exécution actuel (par exemple, des structures dynamiques telles que « enregistrement actuel », « enregistrement de la fenêtre contextuelle actuelle », etc.)
- Un **instantané de petite taille** de l'environnement d'exécution actuel (utilisé pour le prompt)

### 1) `await ctx.getApiInfos(options?)` (Informations API statiques)

### 2) `await ctx.getVarInfos(options?)` (Informations sur la structure des variables)

- Construit sur la base de `defineProperty(...).meta` (incluant la factory meta)
- Prend en charge le découpage par `path` et le contrôle de la profondeur par `maxDepth`
- Ne se déploie vers le bas qu'en cas de besoin

Paramètres courants :

- `maxDepth` : Niveau d'expansion maximal (par défaut 3)
- `path: string | string[]` : Découpage, ne produit que la sous-arborescence du chemin spécifié

### 3) `await ctx.getEnvInfos()` (Instantané de l'environnement d'exécution)

Structure du nœud (simplifiée) :

```ts
type EnvNode = {
  description?: string;
  getVar?: string; // Peut être utilisé directement pour await ctx.getVar(getVar), commençant par "ctx."
  value?: any; // Valeur statique résolue/sérialisable
  properties?: Record<string, EnvNode>;
};
```