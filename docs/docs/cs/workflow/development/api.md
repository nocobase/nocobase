:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Referenční příručka API

## Na straně serveru

Níže je uveden kód, který ukazuje dostupná API ve struktuře serverového balíčku:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Třída `pluginu` pro pracovní postupy.

Během běhu aplikace můžete obvykle získat instanci `pluginu` pro pracovní postupy (dále jen `plugin`) voláním `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` kdekoli, kde je dostupná instance aplikace `app`.

#### `registerTrigger()`

Rozšiřuje a registruje nový typ `triggeru`.

**Podpis**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parametry**

| Parametr  | Typ                         | Popis                       |
| --------- | --------------------------- | --------------------------- |
| `type`    | `string`                    | Identifikátor typu `triggeru` |
| `trigger` | `typeof Trigger \| Trigger` | Typ nebo instance `triggeru` |

**Příklad**

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

Rozšiřuje a registruje nový typ uzlu.

**Podpis**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parametry**

| Parametr      | Typ                                 | Popis                         |
| ------------- | ----------------------------------- | ----------------------------- |
| `type`        | `string`                            | Identifikátor typu `instruction` |
| `instruction` | `typeof Instruction \| Instruction` | Typ nebo instance `instruction` |

**Příklad**

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

Spustí konkrétní pracovní postup. Používá se především v uživatelských `triggerech` k spuštění odpovídajícího pracovního postupu, když je detekována specifická uživatelská událost.

**Podpis**

`trigger(workflow: Workflow, context: any)`

**Parametry**
| Parametr   | Typ           | Popis                               |
| ---------- | ------------- | ----------------------------------- |
| `workflow` | `WorkflowModel` | Objekt pracovního postupu, který má být spuštěn |
| `context`  | `object`      | Kontextová data poskytnutá při spuštění |

:::info{title=Tip}
`context` je v současné době povinná položka. Pokud ji neposkytnete, pracovní postup se nespustí.
:::

**Příklad**

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

Obnoví provádění čekajícího pracovního postupu s konkrétní úlohou uzlu.

- Obnovit lze pouze pracovní postupy ve stavu spuštěno (`EXECUTION_STATUS.STARTED`), které čekají.
- Obnovit lze pouze úlohy uzlů v čekajícím stavu (`JOB_STATUS.PENDING`).

**Podpis**

`resume(job: JobModel)`

**Parametry**

| Parametr | Typ        | Popis                   |
| -------- | ---------- | ----------------------- |
| `job`    | `JobModel` | Aktualizovaný objekt úlohy |

:::info{title=Tip}
Předaný objekt úlohy je obvykle aktualizovaný objekt a jeho `status` se obvykle aktualizuje na hodnotu jinou než `JOB_STATUS.PENDING`, jinak bude nadále čekat.
:::

**Příklad**

Podrobnosti naleznete ve [zdrojovém kódu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Základní třída pro `triggery`, sloužící k rozšíření vlastních typů `triggerů`.

| Parametr      | Typ                                                         | Popis                                |
| ------------- | ----------------------------------------------------------- | ------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor                          |
| `on?`         | `(workflow: WorkflowModel): void`                           | Obsluha událostí po povolení pracovního postupu |
| `off?`        | `(workflow: WorkflowModel): void`                           | Obsluha událostí po zakázání pracovního postupu |

`on`/`off` se používají k registraci/zrušení registrace posluchačů událostí při povolení/zakázání pracovního postupu. Předaný parametr je instance pracovního postupu odpovídajícího `triggeru`, kterou lze zpracovat podle příslušné konfigurace. Některé typy `triggerů`, které již mají globálně naslouchající události, nemusí tyto dvě metody implementovat. Například u časovaného `triggeru` můžete zaregistrovat časovač v `on` a zrušit jeho registraci v `off`.

### `Instruction`

Základní třída `instruction`, sloužící k rozšíření vlastních typů uzlů.

| Parametr      | Typ                                                             | Popis                                      |
| ------------- | --------------------------------------------------------------- | ------------------------------------------ |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor                                |
| `run`         | `Runner`                                                        | Logika provádění při prvním vstupu do uzlu |
| `resume?`     | `Runner`                                                        | Logika provádění při vstupu do uzlu po obnovení z přerušení |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Poskytuje obsah lokálních proměnných pro větev generovanou odpovídajícím uzlem |

**Související typy**

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

Pro `getScope` se můžete podívat na [implementaci uzlu cyklu](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), která slouží k poskytování obsahu lokálních proměnných pro větve.

### `EXECUTION_STATUS`

Tabulka konstant pro stavy plánu provádění pracovního postupu, sloužící k identifikaci aktuálního stavu odpovídajícího plánu provádění.

| Název konstanty                 | Význam                             |
| ------------------------------- | ---------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | Ve frontě                          |
| `EXECUTION_STATUS.STARTED`      | Spuštěno                           |
| `EXECUTION_STATUS.RESOLVED`     | Úspěšně dokončeno                  |
| `EXECUTION_STATUS.FAILED`       | Selhalo                            |
| `EXECUTION_STATUS.ERROR`        | Chyba provádění                    |
| `EXECUTION_STATUS.ABORTED`      | Přerušeno                          |
| `EXECUTION_STATUS.CANCELED`     | Zrušeno                            |
| `EXECUTION_STATUS.REJECTED`     | Odmítnuto                          |
| `EXECUTION_STATUS.RETRY_NEEDED` | Nebylo úspěšně provedeno, je potřeba opakovat |

Kromě prvních tří představují všechny ostatní stavy selhání, ale mohou být použity k popisu různých důvodů selhání.

### `JOB_STATUS`

Tabulka konstant pro stavy úloh uzlů pracovního postupu, sloužící k identifikaci aktuálního stavu odpovídající úlohy uzlu. Stav generovaný uzlem zároveň ovlivňuje stav celého plánu provádění.

| Název konstanty             | Význam                                     |
| ------------------------- | ------------------------------------------ |
| `JOB_STATUS.PENDING`      | Čekající: Provádění dosáhlo tohoto uzlu, ale `instruction` vyžaduje pozastavení a čekání |
| `JOB_STATUS.RESOLVED`     | Úspěšně dokončeno                          |
| `JOB_STATUS.FAILED`       | Selhalo: Provádění tohoto uzlu nesplnilo konfigurované podmínky |
| `JOB_STATUS.ERROR`        | Chyba: Během provádění tohoto uzlu došlo k neošetřené chybě |
| `JOB_STATUS.ABORTED`      | Přerušeno: Provádění tohoto uzlu bylo ukončeno jinou logikou poté, co bylo v čekajícím stavu |
| `JOB_STATUS.CANCELED`     | Zrušeno: Provádění tohoto uzlu bylo ručně zrušeno poté, co bylo v čekajícím stavu |
| `JOB_STATUS.REJECTED`     | Odmítnuto: Pokračování tohoto uzlu bylo ručně odmítnuto poté, co bylo v čekajícím stavu |
| `JOB_STATUS.RETRY_NEEDED` | Nebylo úspěšně provedeno, je potřeba opakovat |

## Na straně klienta

Níže je uveden kód, který ukazuje dostupná API ve struktuře klientského balíčku:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Registruje konfigurační panel pro odpovídající typ `triggeru`.

**Podpis**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parametry**

| Parametr  | Typ                         | Popis                                        |
| --------- | --------------------------- | -------------------------------------------- |
| `type`    | `string`                    | Identifikátor typu `triggeru`, konzistentní s identifikátorem použitým pro registraci |
| `trigger` | `typeof Trigger \| Trigger` | Typ nebo instance `triggeru`                 |

#### `registerInstruction()`

Registruje konfigurační panel pro odpovídající typ uzlu.

**Podpis**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parametry**

| Parametr      | Typ                                 | Popis                                        |
| ------------- | ----------------------------------- | -------------------------------------------- |
| `type`        | `string`                            | Identifikátor typu uzlu, konzistentní s identifikátorem použitým pro registraci |
| `instruction` | `typeof Instruction \| Instruction` | Typ nebo instance `instruction`              |

#### `registerInstructionGroup()`

Registruje skupinu typů uzlů. NocoBase ve výchozím nastavení poskytuje 4 skupiny typů uzlů:

*   `'control'`：Řídicí
*   `'collection'`：Operace s `kolekcemi`
*   `'manual'`：Ruční zpracování
*   `'extended'`：Další rozšíření

Pokud potřebujete rozšířit další skupiny, můžete je zaregistrovat pomocí této metody.

**Podpis**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parametry**

| Parametr | Typ                 | Popis                                        |
| -------- | ------------------- | -------------------------------------------- |
| `type`   | `string`            | Identifikátor skupiny uzlů, konzistentní s identifikátorem použitým pro registraci |
| `group`  | `{ label: string }` | Informace o skupině, v současné době obsahuje pouze název |

**Příklad**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Základní třída pro `triggery`, sloužící k rozšíření vlastních typů `triggerů`.

| Parametr        | Typ                                                             | Popis                                        |
| --------------- | --------------------------------------------------------------- | -------------------------------------------- |
| `title`         | `string`                                                        | Název typu `triggeru`                        |
| `fieldset`      | `{ [key: string]: ISchema }`                                    | Sada konfiguračních položek `triggeru`       |
| `scope?`        | `{ [key: string]: any }`                                        | Sada objektů, které mohou být použity ve `Schema` konfiguračních položek |
| `components?`   | `{ [key: string]: React.FC }`                                   | Sada komponent, které mohou být použity ve `Schema` konfiguračních položek |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Přistupovač hodnot pro kontextová data `triggeru` |

-   Pokud `useVariables` není nastaveno, znamená to, že tento typ `triggeru` neposkytuje funkci pro získání hodnot a kontextová data `triggeru` nelze vybrat v uzlech pracovního postupu.

### `Instruction`

Základní třída `instruction`, sloužící k rozšíření vlastních typů uzlů.

| Parametr             | Typ                                                     | Popis                                                                                              |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `group`              | `string`                                                | Identifikátor skupiny typů uzlů, aktuálně dostupné možnosti: `'control'`/`'kolekce'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Sada konfiguračních položek uzlu                                                                   |
| `scope?`             | `Record<string, Function>`                              | Sada objektů, které mohou být použity ve `Schema` konfiguračních položek                         |
| `components?`        | `Record<string, React.FC>`                              | Sada komponent, které mohou být použity ve `Schema` konfiguračních položek                       |
| `Component?`         | `React.FC`                                              | Vlastní komponenta pro vykreslování uzlu                                                           |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Metoda pro uzel k poskytování možností proměnných uzlu                                             |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Metoda pro uzel k poskytování možností lokálních proměnných větve                                  |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Metoda pro uzel k poskytování možností inicializátoru                                              |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Metoda pro určení, zda je uzel dostupný                                                            |

**Související typy**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

-   Pokud `useVariables` není nastaveno, znamená to, že tento typ uzlu neposkytuje funkci pro získání hodnot a data výsledku tohoto typu uzlu nelze vybrat v uzlech pracovního postupu. Pokud je výsledná hodnota singulární (nelze ji vybrat), můžete vrátit statický obsah, který vyjadřuje odpovídající informaci (viz: [zdrojový kód uzlu pro výpočet](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Pokud je potřeba, aby byla volitelná (např. vlastnost objektu), můžete přizpůsobit výstup odpovídající komponenty pro výběr (viz: [zdrojový kód uzlu pro vytvoření dat](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
-   `Component` je vlastní komponenta pro vykreslování uzlu. Pokud výchozí vykreslování uzlu není dostatečné, lze ji zcela přepsat a použít pro vlastní vykreslování pohledu uzlu. Například, pokud potřebujete poskytnout více akčních tlačítek nebo jiných interakcí pro počáteční uzel typu větve, použijte tuto metodu (viz: [zdrojový kód paralelní větve](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
-   `useInitializers` se používá k poskytování metody pro inicializaci bloků. Například v manuálním uzlu můžete inicializovat související uživatelské bloky na základě předchozích uzlů. Pokud je tato metoda poskytnuta, bude dostupná při inicializaci bloků v konfiguraci rozhraní manuálního uzlu (viz: [zdrojový kód uzlu pro vytvoření dat](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
-   `isAvailable` se primárně používá k určení, zda lze uzel použít (přidat) v aktuálním prostředí. Aktuální prostředí zahrnuje aktuální pracovní postup, předchozí uzly a index aktuální větve.