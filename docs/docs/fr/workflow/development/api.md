---
title: "Référence de l'API"
description: "Référence de l'API d'extension du flux de travail : modèle de flux de travail, contexte d'exécution des nœuds, API des déclencheurs, passage de variables."
keywords: "flux de travail,référence API,modèle de flux de travail,contexte des nœuds,API des déclencheurs,NocoBase"
---

# Référence de l'API

## Côté serveur

Les API disponibles dans la structure du package côté serveur sont présentées dans le code suivant :

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Classe du plugin de flux de travail.

Généralement, pendant l'exécution de l'application, vous pouvez appeler `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` partout où vous pouvez obtenir l'instance d'application `app` pour récupérer l'instance du plugin de flux de travail (désignée ci-après par `plugin`).

#### `registerTrigger()`

Permet d'étendre et d'enregistrer un nouveau type de déclencheur.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Paramètres**

| Paramètre | Type                        | Description                        |
| --------- | --------------------------- | ---------------------------------- |
| `type`    | `string`                    | Identifiant du type de déclencheur |
| `trigger` | `typeof Trigger \| Trigger` | Type ou instance du déclencheur    |

**Exemple**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // trigger workflow
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // listen some event to trigger workflow
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // remove listener
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register trigger
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Permet d'étendre et d'enregistrer un nouveau type de nœud.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Paramètres**

| Paramètre     | Type                                | Description                       |
| ------------- | ----------------------------------- | --------------------------------- |
| `type`        | `string`                            | Identifiant du type d'instruction |
| `instruction` | `typeof Instruction \| Instruction` | Type ou instance de l'instruction |

**Exemple**

```ts
import PluginWorkflowServer, { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

class LogInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  },
};

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Déclenche un flux de travail spécifique. Cette méthode est principalement utilisée dans les déclencheurs personnalisés pour activer le flux de travail correspondant lorsqu'un événement personnalisé spécifique est détecté.

**Signature**

`trigger(workflow: Workflow, context: any)`

**Paramètres**

| Paramètre  | Type            | Description                                                    |
| ---------- | --------------- | -------------------------------------------------------------- |
| `workflow` | `WorkflowModel` | L'objet flux de travail à déclencher                           |
| `context`  | `object`        | Les données de contexte fournies lors du déclenchement          |

:::info{title=Remarque}
`context` est actuellement un paramètre obligatoire. Si vous ne le fournissez pas, le flux de travail ne sera pas déclenché.
:::

**Exemple**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Reprend l'exécution d'un flux de travail en attente à partir d'une tâche de nœud spécifique.

- Seuls les flux de travail en état d'attente (`EXECUTION_STATUS.STARTED`) peuvent être repris.
- Seules les tâches de nœud en état d'attente (`JOB_STATUS.PENDING`) peuvent être reprises.

**Signature**

`resume(job: JobModel)`

**Paramètres**

| Paramètre | Type       | Description              |
| --------- | ---------- | ------------------------ |
| `job`     | `JobModel` | L'objet tâche mis à jour |

:::info{title=Remarque}
L'objet tâche passé est généralement un objet mis à jour, et son `status` est généralement mis à jour avec une valeur autre que `JOB_STATUS.PENDING`, sinon il restera en attente.
:::

**Exemple**

Pour plus de détails, consultez le [code source](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Classe de base pour les déclencheurs, utilisée pour étendre les types de déclencheurs personnalisés.

```ts
import { Trigger } from '@nocobase/plugin-workflow';
```

| Paramètre     | Type                                                        | Description                                                      |
| ------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructeur                                                     |
| `on?`         | `(workflow: WorkflowModel): void`                           | Gestionnaire d'événements après l'activation d'un flux de travail  |
| `off?`        | `(workflow: WorkflowModel): void`                           | Gestionnaire d'événements après la désactivation d'un flux de travail |

`on`/`off` sont utilisés pour enregistrer/désenregistrer des écouteurs d'événements lors de l'activation/désactivation d'un flux de travail. Le paramètre passé est l'instance du flux de travail correspondant au déclencheur, qui peut être traitée selon la configuration. Certains types de déclencheurs qui écoutent déjà des événements globalement n'ont pas besoin d'implémenter ces deux méthodes. Par exemple, dans un déclencheur programmé, vous pouvez enregistrer un minuteur dans `on` et le désenregistrer dans `off`.

### `Instruction`

Classe de base pour les types d'instructions, utilisée pour étendre les types d'instructions personnalisés.

```ts
import { Instruction } from '@nocobase/plugin-workflow';
```

| Paramètre     | Type                                                            | Description                                                                          |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructeur                                                                         |
| `run`         | `Runner`                                                        | Logique d'exécution lors de la première entrée dans le nœud                          |
| `resume?`     | `Runner`                                                        | Logique d'exécution lors de l'entrée dans le nœud après une reprise d'interruption   |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`  | Fournit le contenu des variables locales pour la branche générée par le nœud correspondant |

**Types associés**

```ts
export type Job =
  | {
      status: JOB_STATUS[keyof JOB_STATUS];
      result?: unknown;
      [key: string]: unknown;
    }
  | JobModel
  | null;

export type InstructionResult = Job | Promise<Job>;

export type Runner = (
  node: FlowNodeModel,
  input: JobModel,
  processor: Processor,
) => InstructionResult;

export class Instruction {
  run: Runner;
  resume?: Runner;
}
```

Pour `getScope`, vous pouvez vous référer à l'[implémentation du nœud de boucle](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), qui est utilisée pour fournir le contenu des variables locales pour les branches.

### `EXECUTION_STATUS`

Tableau de constantes pour les statuts des plans d'exécution de flux de travail, utilisé pour identifier l'état actuel du plan d'exécution correspondant.

```ts
import { EXECUTION_STATUS } from '@nocobase/plugin-workflow';
```

| Nom de la constante             | Signification                                        |
| ------------------------------- | ---------------------------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | En file d'attente                                    |
| `EXECUTION_STATUS.STARTED`      | Démarré                                              |
| `EXECUTION_STATUS.RESOLVED`     | Terminé avec succès                                  |
| `EXECUTION_STATUS.FAILED`       | Échec                                                |
| `EXECUTION_STATUS.ERROR`        | Erreur                                               |
| `EXECUTION_STATUS.ABORTED`      | Interrompu                                           |
| `EXECUTION_STATUS.CANCELED`     | Annulé                                               |
| `EXECUTION_STATUS.REJECTED`     | Rejeté                                               |
| `EXECUTION_STATUS.RETRY_NEEDED` | Exécution non réussie, nouvelle tentative nécessaire |

À l'exception des trois premiers, tous les autres représentent un état d'échec, mais peuvent être utilisés pour décrire différentes raisons d'échec.

### `JOB_STATUS`

Tableau de constantes pour les statuts des tâches de nœud de flux de travail, utilisé pour identifier l'état actuel de la tâche de nœud correspondante. Le statut généré par le nœud affecte également le statut de l'ensemble du plan d'exécution.

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';
```

| Nom de la constante        | Signification                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `JOB_STATUS.PENDING`      | En attente : l'exécution a atteint ce nœud, mais l'instruction demande une suspension et une attente |
| `JOB_STATUS.RESOLVED`     | Terminé avec succès                                                                                  |
| `JOB_STATUS.FAILED`       | Échec : l'exécution de ce nœud n'a pas satisfait les conditions configurées                          |
| `JOB_STATUS.ERROR`        | Erreur : une erreur non gérée est survenue lors de l'exécution de ce nœud                            |
| `JOB_STATUS.ABORTED`      | Abandonné : l'exécution de ce nœud a été interrompue par une autre logique après avoir été en attente |
| `JOB_STATUS.CANCELED`     | Annulé : l'exécution de ce nœud a été annulée manuellement après avoir été en attente                |
| `JOB_STATUS.REJECTED`     | Rejeté : la poursuite de ce nœud a été refusée manuellement après avoir été en attente               |
| `JOB_STATUS.RETRY_NEEDED` | Exécution non réussie, nouvelle tentative nécessaire                                                 |

## Côté client

Les API disponibles dans la structure du package côté client sont présentées dans le code suivant :

```ts
import PluginWorkflowClientV2, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client-v2';
```

### `PluginWorkflowClientV2`

Classe du plugin client de flux de travail. Elle est généralement obtenue via `this.app.pm.get('workflow')`.

#### `registerTrigger()`

Enregistre le panneau de configuration pour un type de déclencheur.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Paramètres**

| Paramètre | Type                        | Description                                                                          |
| --------- | --------------------------- | ------------------------------------------------------------------------------------ |
| `type`    | `string`                    | Identifiant du type de déclencheur, cohérent avec celui enregistré côté serveur       |
| `trigger` | `typeof Trigger \| Trigger` | Type ou instance du déclencheur                                                      |

#### `registerInstruction()`

Enregistre le panneau de configuration pour un type de nœud.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Paramètres**

| Paramètre     | Type                                | Description                                                                    |
| ------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `type`        | `string`                            | Identifiant du type de nœud, cohérent avec celui enregistré côté serveur        |
| `instruction` | `typeof Instruction \| Instruction` | Type ou instance de l'instruction                                              |

#### `registerInstructionGroup()`

Enregistre un groupe de types de nœuds. NocoBase propose par défaut 4 groupes de types de nœuds :

* `'control'` : Contrôle
* `'collection'` : Opérations sur les collections
* `'manual'` : Traitement manuel
* `'extended'` : Autres extensions

Si vous avez besoin d'étendre d'autres groupes, vous pouvez utiliser cette méthode pour les enregistrer.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Paramètres**

| Paramètre | Type                | Description                                                    |
| --------- | ------------------- | -------------------------------------------------------------- |
| `type`    | `string`            | Identifiant du groupe de nœuds                                 |
| `group`   | `{ label: string }` | Informations sur le groupe, ne contient actuellement que le titre |

**Exemple**

```ts
import { Plugin } from '@nocobase/client-v2';

export default class YourPluginClient extends Plugin {
  async load() {
    const pluginWorkflow = this.app.pm.get('workflow');
    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

#### `isWorkflowSync()`

Détermine si un flux de travail est en mode synchrone.

**Signature**

`isWorkflowSync(workflow: object): boolean`

### `Trigger`

Classe de base pour les déclencheurs, utilisée pour étendre les types de déclencheurs personnalisés.

| Paramètre                  | Type                                                                          | Description                                                      |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `title`                    | `string`                                                                      | Nom du type de déclencheur                                       |
| `description?`             | `string`                                                                      | Description du type de déclencheur                               |
| `PresetFieldsetLoader?`    | `LoaderOf`                                                                    | Formulaire de configuration prédéfini à la création (chargé en différé) |
| `FieldsetLoader?`          | `LoaderOf`                                                                    | Formulaire complet de configuration du déclencheur (chargé en différé) |
| `TriggerFieldsetLoader?`   | `LoaderOf`                                                                    | Formulaire de saisie pour l'exécution manuelle (chargé en différé) |
| `validate`                 | `(config: Record<string, unknown>) => boolean`                                | Validation de la configuration ; retourne `true` si la configuration est valide |
| `createDefaultConfig?`     | `() => Record<string, unknown>`                                               | Fournit les valeurs de configuration par défaut                  |
| `useVariables?`            | `(config, options?: UseVariableOptions) => VariableOption[] \| null`           | Options de variables pour les données de contexte du déclencheur |
| `getCreateModelMenuItem?`  | `(args) => SubModelItem \| SubModelItem[] \| null`                            | Éléments de menu pour la création de sous-modèles sur le canevas |
| `useTempAssociationSource?`| `(config, workflow?) => TriggerTempAssociationSource \| null`                  | Fournit une source de données d'association temporaire           |

**Types associés**

```ts
export type LoaderOf<P = {}> = () => Promise<{ default: ComponentType<P> }>;
```

- Si `useVariables` n'est pas défini, cela signifie que ce type de déclencheur ne fournit pas de fonction de récupération de valeur, et les données de contexte du déclencheur ne peuvent pas être sélectionnées dans les nœuds du flux de travail.

### `Instruction`

Classe de base pour les instructions, utilisée pour étendre les types de nœuds personnalisés.

| Paramètre                  | Type                                                                          | Description                                                                          |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `title`                    | `string`                                                                      | Nom du type de nœud                                                                  |
| `type`                     | `string`                                                                      | Identifiant du type de nœud                                                          |
| `group`                    | `string`                                                                      | Identifiant du groupe du type de nœud, options : `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `description?`             | `string`                                                                      | Description du type de nœud                                                          |
| `icon?`                    | `JSX.Element`                                                                 | Icône du nœud                                                                        |
| `FieldsetLoader?`          | `LoaderOf`                                                                    | Formulaire du tiroir de configuration du nœud (chargé en différé)                    |
| `PresetFieldsetLoader?`    | `LoaderOf`                                                                    | Formulaire de configuration prédéfini à la création (chargé en différé)              |
| `ComponentLoader?`         | `LoaderOf<{ data: any }>`                                                     | Rendu personnalisé du nœud sur le canevas (chargé en différé), utilisé pour les nœuds de branche et les cas nécessitant un rendu spécial |
| `branching?`               | `boolean \| object \| ((config) => boolean \| object)`                        | Déclare si le nœud est un nœud de branche                                           |
| `end?`                     | `boolean \| ((node) => boolean)`                                              | Déclare si le nœud est un nœud terminal                                              |
| `testable?`                | `boolean`                                                                     | Déclare si le nœud prend en charge les exécutions de test                            |
| `createDefaultConfig?`     | `() => object`                                                                | Fournit les valeurs de configuration par défaut                                      |
| `useVariables?`            | `(node, options?: UseVariableOptions) => VariableOption`                      | Méthode pour que le nœud fournisse des options de variables                          |
| `useScopeVariables?`       | `(node, options?) => VariableOption[] \| MetaTreeNode[]`                      | Méthode pour que le nœud fournisse des options de variables dans le périmètre de la branche |
| `isAvailable?`             | `(ctx: NodeAvailableContext) => boolean`                                      | Méthode pour déterminer si le nœud est disponible                                    |
| `getCreateModelMenuItem?`  | `({ node, workflow }) => SubModelItem \| null`                                | Éléments de menu pour la création de sous-modèles sur le canevas                     |
| `useTempAssociationSource?`| `(node) => TempAssociationSource \| null`                                     | Fournit une source de données d'association temporaire                               |

**Types associés**

```ts
export type NodeAvailableContext = {
  engine: WorkflowPlugin;
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Si `useVariables` n'est pas défini, cela signifie que ce type de nœud ne fournit pas de fonction de récupération de valeur, et les données de résultat de ce type de nœud ne peuvent pas être sélectionnées dans les nœuds du flux de travail. Si la valeur de résultat est unique (non sélectionnable), vous pouvez simplement retourner un contenu statique qui exprime l'information correspondante (voir : [code source du nœud de calcul](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/calculation.tsx)). Si elle doit être sélectionnable (par exemple, une propriété d'un objet), vous pouvez personnaliser la sortie du composant de sélection correspondant (voir : [code source du nœud de requête de données](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/query.tsx)).
- `ComponentLoader` est un composant de rendu personnalisé pour le nœud. Lorsque le rendu par défaut du nœud n'est pas suffisant, il peut être entièrement remplacé pour un rendu de vue de nœud personnalisé. Par exemple, pour fournir un rendu de branche supplémentaire pour les nœuds de type branche (voir : [code source du nœud de condition](https://github.com/nocobase/nocobase/blob/develop/packages/plugins/%40nocobase/plugin-workflow/src/client-v2/nodes/condition.tsx)).
- `isAvailable` est principalement utilisé pour déterminer si un nœud peut être utilisé (ajouté) dans l'environnement actuel. L'environnement actuel comprend l'instance du plugin de flux de travail, le flux de travail en cours, les nœuds en amont et l'index de la branche actuelle.

### Composants de saisie de variables

Le flux de travail fournit un ensemble de composants de saisie de variables permettant aux utilisateurs de sélectionner des variables de flux de travail dans les formulaires de configuration des nœuds et des déclencheurs.

```ts
import {
  WorkflowVariableInput,
  WorkflowVariableTextArea,
  WorkflowTypedVariableInput,
  WorkflowVariableWrapper,
} from '@nocobase/plugin-workflow/client-v2';
```

#### `WorkflowVariableInput`

Champ de saisie de variable permettant de sélectionner une variable et de continuer à saisir du contenu. Adapté aux scénarios de saisie sur une seule ligne nécessitant un mélange de références de variables et de texte libre.

```tsx
import { WorkflowVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'target']} label="Target">
  <WorkflowVariableInput />
</Form.Item>
```

![WorkflowVariableInput](https://static-docs.nocobase.com/20260701160110.png)

**Props**

| Paramètre          | Type                              | Description                                                    |
| ------------------- | --------------------------------- | -------------------------------------------------------------- |
| `value?`            | `string`                          | Valeur du chemin de variable, par ex. `{{$jobsMapByNodeKey.xxx.field}}` |
| `onChange?`          | `(value: string) => void`         | Rappel lors du changement de valeur                            |
| `variableOptions?`  | `UseWorkflowVariableOptions`      | Options de filtrage des variables (filtrage par type, profondeur, etc.) |
| `disabled?`          | `boolean`                         | Indique si le champ est désactivé                              |
| `placeholder?`       | `string`                          | Texte indicatif                                                |

#### `WorkflowVariableTextArea`

Zone de texte multiligne permettant d'insérer des références de variables à n'importe quelle position du curseur. Adaptée aux scénarios de texte libre tels que le corps HTTP, le texte de modèle, etc.

```tsx
import { WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'body']} label="Body">
  <WorkflowVariableTextArea autoSize={{ minRows: 5 }} />
</Form.Item>
```

![WorkflowVariableTextArea](https://static-docs.nocobase.com/20260701160242.png)

**Props**

| Paramètre          | Type                              | Description                                                    |
| ------------------- | --------------------------------- | -------------------------------------------------------------- |
| `value?`            | `string`                          | Valeur du texte (peut contenir des références de variables)    |
| `onChange?`          | `(value: string) => void`         | Rappel lors du changement de valeur                            |
| `variableOptions?`  | `UseWorkflowVariableOptions`      | Options de filtrage des variables                              |
| `delimiters?`       | `readonly [string, string]`       | Délimiteurs de variables, par défaut `['{{', '}}']`            |

Hérite des autres Props du composant `TextArea` d'antd (tels que `autoSize`, `placeholder`, etc.).

#### `WorkflowTypedVariableInput`

Champ de saisie typé qui bascule entre les modes "constante" et "référence de variable". En mode variable, vous ne pouvez que sélectionner une variable ; il est impossible de continuer la saisie après la sélection. En mode constante, cinq types sont pris en charge : `string`, `number`, `boolean`, `date` et `object`.

```tsx
import { WorkflowTypedVariableInput } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'value']} label="Value">
  <WorkflowTypedVariableInput />
</Form.Item>
```

![WorkflowTypedVariableInput](https://static-docs.nocobase.com/20260701160608.png)

**Props**

| Paramètre          | Type                              | Description                                                    |
| ------------------- | --------------------------------- | -------------------------------------------------------------- |
| `variableOptions?`  | `UseWorkflowVariableOptions`      | Options de filtrage des variables                              |

Hérite des autres Props de `TypedVariableInput` (à l'exclusion de `extraNodes`, `metaTree`, `namespaces` utilisés en interne).

#### `WorkflowVariableWrapper`

Composant d'encapsulation générique permettant de substituer différents composants de saisie selon les contextes. Par exemple, lorsque le même champ nécessite des méthodes de saisie différentes dans la configuration du nœud déclencheur et dans le tiroir de configuration du nœud, vous pouvez utiliser ce composant pour encapsuler un champ de saisie natif dans un champ pouvant basculer en mode variable.

```tsx
import { WorkflowVariableWrapper } from '@nocobase/plugin-workflow/client-v2';

<Form.Item name={['config', 'timeout']} label="Timeout">
  <WorkflowVariableWrapper
    render={({ value, onChange }) => (
      <InputNumber value={value} onChange={onChange} min={0} />
    )}
  />
</Form.Item>
```

**Props**

| Paramètre          | Type                                                  | Description                                                                              |
| ------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `value?`            | `TValue \| string \| null`                            | Valeur actuelle (valeur constante ou chaîne de chemin de variable)                        |
| `onChange?`          | `(value: TValue \| string \| null) => void`           | Rappel lors du changement de valeur                                                      |
| `variableOptions?`  | `UseWorkflowVariableOptions`                          | Options de filtrage des variables                                                        |
| `render`            | `(props: { value?, onChange? }) => ReactNode`          | Effectue le rendu du composant de saisie natif                                           |
| `clearValue?`       | `TValue \| null`                                      | Valeur initiale lors du retour du mode variable au mode constante, par défaut `null`     |

### Composants liés aux collections

Le flux de travail fournit également un ensemble de composants utilitaires liés aux collections :

```ts
import {
  CollectionCascader,
  AppendsSelect,
  FieldsSelect,
  SortFieldsInput,
  PaginationFields,
} from '@nocobase/plugin-workflow/client-v2';
```

- `CollectionCascader` -- Sélecteur de collection avec prise en compte de la source de données (cascade)
- `AppendsSelect` -- Sélecteur de préchargement des champs d'association (sélection arborescente)
- `FieldsSelect` -- Sélecteur multiple de champs de collection
- `SortFieldsInput` -- Champ de saisie pour le tri
- `PaginationFields` -- Éléments de formulaire pour les paramètres de pagination
