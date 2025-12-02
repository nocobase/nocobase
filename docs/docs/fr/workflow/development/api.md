:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

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

Classe de plugin de flux de travail.

Généralement, pendant l'exécution de l'application, vous pouvez appeler `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` partout où vous pouvez obtenir l'instance d'application `app` pour récupérer l'instance du plugin de flux de travail (désignée ci-après par `plugin`).

#### `registerTrigger()`

Permet d'étendre et d'enregistrer un nouveau type de déclencheur.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Paramètres**

| Paramètre | Type                        | Description                      |
| --------- | --------------------------- | -------------------------------- |
| `type`    | `string`                    | Identifiant du type de déclencheur |
| `trigger` | `typeof Trigger \| Trigger` | Type ou instance du déclencheur  |

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

| Paramètre   | Type                                | Description                     |
| ----------- | ----------------------------------- | ------------------------------- |
| `type`      | `string`                            | Identifiant du type d'instruction |
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

| Paramètre  | Type          | Description                                  |
| ---------- | ------------- | -------------------------------------------- |
| `workflow` | `WorkflowModel` | L'objet flux de travail à déclencher         |
| `context`  | `object`      | Les données de contexte fournies lors du déclenchement |

:::info{title=Conseil}
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

:::info{title=Conseil}
L'objet tâche passé est généralement un objet mis à jour, et son `status` est généralement mis à jour avec une valeur autre que `JOB_STATUS.PENDING`, sinon il restera en attente.
:::

**Exemple**

Pour plus de détails, consultez le [code source](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Classe de base pour les déclencheurs, utilisée pour étendre les types de déclencheurs personnalisés.

| Paramètre   | Type                                                        | Description                                |
| ----------- | ----------------------------------------------------------- | ------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Constructeur                               |
| `on?`         | `(workflow: WorkflowModel): void`                           | Gestionnaire d'événements après l'activation d'un flux de travail |
| `off?`        | `(workflow: WorkflowModel): void`                           | Gestionnaire d'événements après la désactivation d'un flux de travail |

`on`/`off` sont utilisés pour enregistrer/désenregistrer des écouteurs d'événements lors de l'activation/désactivation d'un flux de travail. Le paramètre passé est l'instance du flux de travail correspondant au déclencheur, qui peut être traitée selon la configuration. Certains types de déclencheurs qui écoutent déjà des événements globalement n'ont pas besoin d'implémenter ces deux méthodes. Par exemple, dans un déclencheur programmé, vous pouvez enregistrer un minuteur dans `on` et le désenregistrer dans `off`.

### `Instruction`

Classe de base pour les types d'instructions, utilisée pour étendre les types d'instructions personnalisés.

| Paramètre   | Type                                                            | Description                                            |
| ----------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Constructeur                                           |
| `run`         | `Runner`                                                        | Logique d'exécution lors de la première entrée dans le nœud |
| `resume?`     | `Runner`                                                        | Logique d'exécution lors de l'entrée dans le nœud après une reprise d'interruption |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Fournit le contenu des variables locales pour la branche générée par le nœud correspondant |

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

| Nom de la constante             | Signification                                |
| ------------------------------- | -------------------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | En file d'attente                            |
| `EXECUTION_STATUS.STARTED`      | Démarré                                      |
| `EXECUTION_STATUS.RESOLVED`     | Terminé avec succès                          |
| `EXECUTION_STATUS.FAILED`       | Échec                                        |
| `EXECUTION_STATUS.ERROR`        | Erreur d'exécution                           |
| `EXECUTION_STATUS.ABORTED`      | Interrompu                                   |
| `EXECUTION_STATUS.CANCELED`     | Annulé                                       |
| `EXECUTION_STATUS.REJECTED`     | Rejeté                                       |
| `EXECUTION_STATUS.RETRY_NEEDED` | Exécution non réussie, nouvelle tentative nécessaire |

À l'exception des trois premiers, tous les autres représentent un état d'échec, mais peuvent être utilisés pour décrire différentes raisons d'échec.

### `JOB_STATUS`

Tableau de constantes pour les statuts des tâches de nœud de flux de travail, utilisé pour identifier l'état actuel de la tâche de nœud correspondante. Le statut généré par le nœud affecte également le statut de l'ensemble du plan d'exécution.

| Nom de la constante       | Signification                                                              |
| ------------------------- | -------------------------------------------------------------------------- |
| `JOB_STATUS.PENDING`      | En attente : L'exécution a atteint ce nœud, mais l'instruction demande une suspension |
| `JOB_STATUS.RESOLVED`     | Terminé avec succès                                                        |
| `JOB_STATUS.FAILED`       | Échec : L'exécution de ce nœud n'a pas satisfait les conditions configurées |
| `JOB_STATUS.ERROR`        | Erreur : Une erreur non gérée est survenue lors de l'exécution de ce nœud  |
| `JOB_STATUS.ABORTED`      | Abandonné : L'exécution de ce nœud a été interrompue par une autre logique après avoir été en attente |
| `JOB_STATUS.CANCELED`     | Annulé : L'exécution de ce nœud a été annulée manuellement après avoir été en attente |
| `JOB_STATUS.REJECTED`     | Rejeté : La poursuite de ce nœud a été refusée manuellement après avoir été en attente |
| `JOB_STATUS.RETRY_NEEDED` | Exécution non réussie, nouvelle tentative nécessaire                        |

## Côté client

Les API disponibles dans la structure du package côté client sont présentées dans le code suivant :

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Enregistre le panneau de configuration correspondant au type de déclencheur.

**Signature**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Paramètres**

| Paramètre | Type                        | Description                                          |
| --------- | --------------------------- | ---------------------------------------------------- |
| `type`    | `string`                    | Identifiant du type de déclencheur, cohérent avec celui utilisé pour l'enregistrement |
| `trigger` | `typeof Trigger \| Trigger` | Type ou instance du déclencheur                      |

#### `registerInstruction()`

Enregistre le panneau de configuration correspondant au type de nœud.

**Signature**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Paramètres**

| Paramètre   | Type                                | Description                                          |
| ----------- | ----------------------------------- | ---------------------------------------------------- |
| `type`      | `string`                            | Identifiant du type de nœud, cohérent avec celui utilisé pour l'enregistrement |
| `instruction` | `typeof Instruction \| Instruction` | Type ou instance de l'instruction                    |

#### `registerInstructionGroup()`

Enregistre un groupe de types de nœuds. NocoBase propose par défaut 4 groupes de types de nœuds :

*   `'control'` : Contrôle
*   `'collection'` : Opérations sur les collections
*   `'manual'` : Traitement manuel
*   `'extended'` : Autres extensions

Si vous avez besoin d'étendre d'autres groupes, vous pouvez utiliser cette méthode pour les enregistrer.

**Signature**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Paramètres**

| Paramètre | Type                | Description                                          |
| --------- | ------------------- | ---------------------------------------------------- |
| `type`    | `string`            | Identifiant du groupe de nœuds, cohérent avec celui utilisé pour l'enregistrement |
| `group`   | `{ label: string }` | Informations sur le groupe, ne contient actuellement que le titre |

**Exemple**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Classe de base pour les déclencheurs, utilisée pour étendre les types de déclencheurs personnalisés.

| Paramètre       | Type                                                             | Description                                            |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| `title`         | `string`                                                         | Nom du type de déclencheur                             |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | Collection d'éléments de configuration du déclencheur  |
| `scope?`        | `{ [key: string]: any }`                                         | Collection d'objets pouvant être utilisés dans le schéma des éléments de configuration |
| `components?`   | `{ [key: string]: React.FC }`                                    | Collection de composants pouvant être utilisés dans le schéma des éléments de configuration |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Accesseur de valeur pour les données de contexte du déclencheur |

- Si `useVariables` n'est pas défini, cela signifie que ce type de déclencheur ne fournit pas de fonction de récupération de valeur, et les données de contexte du déclencheur ne peuvent pas être sélectionnées dans les nœuds du flux de travail.

### `Instruction`

Classe de base pour les instructions, utilisée pour étendre les types de nœuds personnalisés.

| Paramètre          | Type                                                    | Description                                                                    |
| ------------------ | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`            | `string`                                                | Identifiant du groupe de types de nœuds, options actuellement disponibles : `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`         | `Record<string, ISchema>`                               | Collection d'éléments de configuration du nœud                                 |
| `scope?`           | `Record<string, Function>`                              | Collection d'objets pouvant être utilisés dans le schéma des éléments de configuration |
| `components?`      | `Record<string, React.FC>`                              | Collection de composants pouvant être utilisés dans le schéma des éléments de configuration |
| `Component?`       | `React.FC`                                              | Composant de rendu personnalisé pour le nœud                                   |
| `useVariables?`    | `(node, options: UseVariableOptions) => VariableOption` | Méthode pour que le nœud fournisse des options de variables de nœud            |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Méthode pour que le nœud fournisse des options de variables locales de branche |
| `useInitializers?` | `(node) => SchemaInitializerItemType`                   | Méthode pour que le nœud fournisse des options d'initialisation                |
| `isAvailable?`     | `(ctx: NodeAvailableContext) => boolean`                | Méthode pour déterminer si le nœud est disponible                              |

**Types associés**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Si `useVariables` n'est pas défini, cela signifie que ce type de nœud ne fournit pas de fonction de récupération de valeur, et les données de résultat de ce type de nœud ne peuvent pas être sélectionnées dans les nœuds du flux de travail. Si la valeur de résultat est unique (non sélectionnable), vous pouvez simplement retourner un contenu statique qui exprime l'information correspondante (voir : [code source du nœud de calcul](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Si elle doit être sélectionnable (par exemple, une propriété d'un objet), vous pouvez personnaliser la sortie du composant de sélection correspondant (voir : [code source du nœud de création de données](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` est un composant de rendu personnalisé pour le nœud. Lorsque le rendu par défaut du nœud n'est pas suffisant, il peut être entièrement remplacé pour un rendu de vue de nœud personnalisé. Par exemple, si vous devez fournir plus de boutons d'action ou d'autres interactions pour le nœud de début d'un type de branche, vous devrez utiliser cette méthode (voir : [code source de la branche parallèle](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` est utilisé pour fournir une méthode d'initialisation des blocs. Par exemple, dans un nœud manuel, vous pouvez initialiser des blocs utilisateur pertinents en fonction des nœuds en amont. Si cette méthode est fournie, elle sera disponible lors de l'initialisation des blocs dans la configuration de l'interface du nœud manuel (voir : [code source du nœud de création de données](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` est principalement utilisé pour déterminer si un nœud peut être utilisé (ajouté) dans l'environnement actuel. L'environnement actuel comprend le flux de travail en cours, les nœuds en amont et l'index de la branche actuelle.