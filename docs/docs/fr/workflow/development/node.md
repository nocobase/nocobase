:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Extension des types de nœuds

Le type d'un nœud est essentiellement une instruction opérationnelle. Des instructions différentes représentent des opérations différentes exécutées dans le **flux de travail**.

Similaire aux déclencheurs, l'extension des types de nœuds se divise également en deux parties : côté serveur et côté client. Le côté serveur doit implémenter la logique des instructions enregistrées, tandis que le côté client doit fournir la configuration de l'interface pour les paramètres du nœud où se trouve l'instruction.

## Côté serveur

### L'instruction de nœud la plus simple

Le cœur d'une instruction est une fonction, ce qui signifie que la méthode `run` de la classe d'instruction doit être implémentée pour exécuter la logique de l'instruction. Vous pouvez effectuer toutes les opérations nécessaires au sein de cette fonction, telles que des opérations de base de données, des opérations de fichiers, des appels à des API tierces, etc.

Toutes les instructions doivent dériver de la classe de base `Instruction`. L'instruction la plus simple ne nécessite que l'implémentation d'une fonction `run` :

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Et enregistrez cette instruction auprès du **plugin** de **flux de travail** :

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

La valeur de statut (`status`) dans l'objet de retour de l'instruction est obligatoire et doit être une valeur de la constante `JOB_STATUS`. Cette valeur détermine le déroulement du traitement ultérieur de ce nœud dans le **flux de travail**. Généralement, `JOB_STATUS.RESOVLED` est utilisé, indiquant que le nœud a été exécuté avec succès et que l'exécution se poursuivra vers les nœuds suivants. Si vous avez une valeur de résultat à sauvegarder à l'avance, vous pouvez également appeler la méthode `processor.saveJob` et retourner l'objet qu'elle renvoie. L'exécuteur générera un enregistrement du résultat d'exécution basé sur cet objet.

### Valeur de résultat du nœud

Si vous avez un résultat d'exécution spécifique, en particulier des données à préparer pour les nœuds suivants, vous pouvez le retourner via la propriété `result` et le sauvegarder dans l'objet de tâche du nœud :

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Ici, `node.config` est l'élément de configuration du nœud, qui peut être n'importe quelle valeur requise. Il sera sauvegardé en tant que champ de type `JSON` dans l'enregistrement de nœud correspondant dans la base de données.

### Gestion des erreurs d'instruction

Si des exceptions peuvent survenir pendant l'exécution, vous pouvez les intercepter à l'avance et retourner un statut d'échec :

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Si les exceptions prévisibles ne sont pas interceptées, le moteur de **flux de travail** les interceptera automatiquement et renverra un statut d'erreur pour éviter que des exceptions non gérées ne fassent planter le programme.

### Nœuds asynchrones

Lorsque vous avez besoin de contrôle de **flux de travail** ou d'opérations d'E/S asynchrones (longues), la méthode `run` peut retourner un objet avec un `status` de `JOB_STATUS.PENDING`. Cela indique à l'exécuteur d'attendre (de suspendre) jusqu'à ce qu'une opération asynchrone externe soit terminée, puis de notifier le moteur de **flux de travail** de poursuivre l'exécution. Si une valeur de statut `PENDING` est retournée dans la fonction `run`, l'instruction doit implémenter la méthode `resume`, sinon l'exécution du **flux de travail** ne pourra pas reprendre :

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Ici, `paymentService` fait référence à un service de paiement. Dans le rappel de ce service, le **flux de travail** est déclenché pour reprendre l'exécution de la tâche correspondante, et le processus actuel se termine d'abord. Ensuite, le moteur de **flux de travail** crée un nouveau processeur et le transmet à la méthode `resume` du nœud pour continuer l'exécution du nœud précédemment suspendu.

:::info{title=Conseil}
L'« opération asynchrone » mentionnée ici ne fait pas référence aux fonctions `async` de JavaScript, mais plutôt aux opérations qui ne renvoient pas de résultat immédiat lors de l'interaction avec d'autres systèmes externes, comme un service de paiement qui doit attendre une autre notification pour connaître le résultat.
:::

### Statut du résultat du nœud

L'état d'exécution d'un nœud affecte le succès ou l'échec de l'ensemble du **flux de travail**. Généralement, en l'absence de branches, l'échec d'un nœud entraîne directement l'échec de l'ensemble du **flux de travail**. Le scénario le plus courant est que si un nœud s'exécute avec succès, il passe au nœud suivant dans la table des nœuds, jusqu'à ce qu'il n'y ait plus de nœuds suivants, auquel cas l'exécution de l'ensemble du **flux de travail** se termine avec un statut de succès.

Si un nœud retourne un statut d'échec pendant l'exécution, le moteur le traitera différemment selon les deux situations suivantes :

1.  Le nœud qui retourne un statut d'échec se trouve dans le **flux de travail** principal, c'est-à-dire qu'il n'est pas dans une branche ouverte par un nœud en amont. Dans ce cas, l'ensemble du **flux de travail** principal est considéré comme ayant échoué et le processus se termine.

2.  Le nœud qui retourne un statut d'échec se trouve dans un **flux de travail** de branche. Dans ce cas, la responsabilité de déterminer l'état suivant du **flux de travail** est transférée au nœud qui a ouvert la branche. La logique interne de ce nœud décidera de l'état du **flux de travail** suivant, et cette décision se propagera récursivement jusqu'au **flux de travail** principal.

Finalement, l'état suivant de l'ensemble du **flux de travail** est déterminé au niveau des nœuds du **flux de travail** principal. Si un nœud du **flux de travail** principal retourne un échec, l'ensemble du **flux de travail** se termine avec un statut d'échec.

Si un nœud retourne un statut « en attente » après exécution, l'ensemble du processus d'exécution sera temporairement interrompu et suspendu, en attente d'un événement défini par le nœud correspondant pour déclencher la reprise du **flux de travail**. Par exemple, un nœud manuel, une fois exécuté, se mettra en pause à ce nœud avec un statut « en attente », attendant une intervention humaine pour décider de l'approbation. Si le statut saisi manuellement est « approuvé », les nœuds suivants du **flux de travail** continueront ; sinon, il sera traité selon la logique d'échec décrite précédemment.

Pour plus de statuts de retour d'instruction, veuillez consulter la section Référence de l'API des **flux de travail**.

### Sortie anticipée

Dans certains **flux de travail** spéciaux, il peut être nécessaire de terminer directement le **flux de travail** au sein d'un nœud. Vous pouvez retourner `null` pour indiquer la sortie du **flux de travail** actuel, et les nœuds suivants ne seront pas exécutés.

Cette situation est courante dans les nœuds de contrôle de **flux de travail**, tels que le nœud de branche parallèle ([référence du code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)), où le **flux de travail** du nœud actuel se termine, mais de nouveaux **flux de travail** sont démarrés pour chaque sous-branche et continuent leur exécution.

:::warn{title=Attention}
La planification des **flux de travail** de branche avec des nœuds étendus présente une certaine complexité et nécessite une manipulation prudente ainsi que des tests approfondis.
:::

### En savoir plus

Pour les définitions des différents paramètres de définition des types de nœuds, consultez la section Référence de l'API des **flux de travail**.

## Côté client

Similaire aux déclencheurs, le formulaire de configuration d'une instruction (type de nœud) doit être implémenté côté client.

### L'instruction de nœud la plus simple

Toutes les instructions doivent dériver de la classe de base `Instruction`. Les propriétés et méthodes associées sont utilisées pour configurer et utiliser le nœud.

Par exemple, si nous devons fournir une interface de configuration pour le nœud de type chaîne de caractères numériques aléatoires (`randomString`) défini côté serveur, qui possède un élément de configuration `digit` représentant le nombre de chiffres pour le nombre aléatoire, nous utiliserions un champ de saisie numérique dans le formulaire de configuration pour recueillir l'entrée de l'utilisateur.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Conseil}
L'identifiant du type de nœud enregistré côté client doit être cohérent avec celui du côté serveur, sinon cela entraînera des erreurs.
:::

### Fournir les résultats du nœud comme variables

Vous remarquerez la méthode `useVariables` dans l'exemple ci-dessus. Si vous avez besoin d'utiliser le résultat du nœud (la partie `result`) comme variable pour les nœuds suivants, vous devez implémenter cette méthode dans la classe d'instruction héritée et retourner un objet conforme au type `VariableOption`. Cet objet sert de description structurelle du résultat d'exécution du nœud, fournissant un mappage des noms de variables pour leur sélection et leur utilisation dans les nœuds suivants.

Le type `VariableOption` est défini comme suit :

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

L'élément central est la propriété `value`, qui représente la valeur du chemin segmenté du nom de la variable. `label` est utilisé pour l'affichage dans l'interface, et `children` est utilisé pour représenter une structure de variable à plusieurs niveaux, ce qui est utile lorsque le résultat du nœud est un objet profondément imbriqué.

Une variable utilisable est représentée en interne dans le système comme une chaîne de caractères de chemin séparée par des points, par exemple, `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Ici, `jobsMapByNodeKey` représente l'ensemble des résultats de tous les nœuds (défini en interne, pas besoin de le gérer), `2dw92cdf` est la `key` du nœud, et `abc` est une propriété personnalisée dans l'objet de résultat du nœud.

De plus, étant donné que le résultat d'un nœud peut également être une valeur simple, lors de la fourniture de variables de nœud, le premier niveau **doit** être la description du nœud lui-même :

```ts
{
  value: node.key,
  label: node.title,
}
```

C'est-à-dire que le premier niveau est la `key` et le titre du nœud. Par exemple, pour la [référence du code](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) du nœud de calcul, lorsque vous utilisez le résultat de ce nœud, les options de l'interface sont les suivantes :

![Résultat du nœud de calcul](https://static-docs.nocobase.com/20240514230014.png)

Lorsque le résultat du nœud est un objet complexe, vous pouvez utiliser `children` pour continuer à décrire les propriétés imbriquées. Par exemple, une instruction personnalisée pourrait retourner les données JSON suivantes :

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Vous pouvez alors le retourner via la méthode `useVariables` comme suit :

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

De cette manière, dans les nœuds suivants, vous pourrez utiliser l'interface suivante pour sélectionner les variables :

![Variables de résultat mappées](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Conseil"}
Lorsqu'une structure dans le résultat est un tableau d'objets profondément imbriqués, vous pouvez également utiliser `children` pour décrire le chemin, mais cela ne peut pas inclure d'indices de tableau. En effet, dans la gestion des variables des **flux de travail** NocoBase, la description du chemin de variable pour un tableau d'objets est automatiquement aplatie en un tableau de valeurs profondes lors de l'utilisation, et vous ne pouvez pas accéder à une valeur spécifique par son index.
:::

### Disponibilité du nœud

Par défaut, tout nœud peut être ajouté à un **flux de travail**. Cependant, dans certains cas, un nœud peut ne pas être applicable dans certains types de **flux de travail** ou de branches. Dans ces situations, vous pouvez configurer la disponibilité du nœud à l'aide de `isAvailable` :

```ts
// Type definition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Workflow plugin instance
  engine: WorkflowPlugin;
  // Workflow instance
  workflow: object;
  // Upstream node
  upstream: object;
  // Whether it is a branch node (branch number)
  branchIndex: number;
};
```

La méthode `isAvailable` retourne `true` si le nœud est disponible, et `false` s'il ne l'est pas. Le paramètre `ctx` contient les informations contextuelles du nœud actuel, qui peuvent être utilisées pour déterminer sa disponibilité.

En l'absence d'exigences particulières, vous n'avez pas besoin d'implémenter la méthode `isAvailable`, car les nœuds sont disponibles par défaut. Le scénario de configuration le plus courant est lorsqu'un nœud peut être une opération longue et ne convient pas à une exécution dans un **flux de travail** synchrone. Vous pouvez utiliser la méthode `isAvailable` pour restreindre son utilisation. Par exemple :

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### En savoir plus

Pour les définitions des différents paramètres de définition des types de nœuds, consultez la section Référence de l'API des **flux de travail**.