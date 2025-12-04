:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# API Referencyjne

## Po stronie serwera

Poniższy kod przedstawia interfejsy API dostępne w pakiecie po stronie serwera:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

Klasa wtyczki przepływu pracy.

Zazwyczaj, w trakcie działania aplikacji, mogą Państwo uzyskać instancję wtyczki przepływu pracy (nazywaną dalej `plugin`) wywołując `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)` w dowolnym miejscu, gdzie dostępna jest instancja aplikacji `app`.

#### `registerTrigger()`

Rozszerza i rejestruje nowy typ wyzwalacza.

**Sygnatura**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**Parametry**

| Parametr  | Typ                         | Opis                         |
| --------- | --------------------------- | ---------------------------- |
| `type`    | `string`                    | Identyfikator typu wyzwalacza |
| `trigger` | `typeof Trigger \| Trigger` | Typ lub instancja wyzwalacza |

**Przykład**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // wyzwala przepływ pracy
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // nasłuchuje zdarzenia, aby wyzwolić przepływ pracy
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // usuwa nasłuchiwanie
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // pobiera instancję wtyczki przepływu pracy
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // rejestruje wyzwalacz
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

Rozszerza i rejestruje nowy typ węzła.

**Sygnatura**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**Parametry**

| Parametr      | Typ                                 | Opis                     |
| ------------- | ----------------------------------- | ------------------------ |
| `type`        | `string`                            | Identyfikator typu instrukcji |
| `instruction` | `typeof Instruction \| Instruction` | Typ lub instancja instrukcji |

**Przykład**

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
    // pobiera instancję wtyczki przepływu pracy
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // rejestruje instrukcję
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

Wyzwala określony przepływ pracy. Stosowane głównie w niestandardowych wyzwalaczach, aby uruchomić odpowiedni przepływ pracy po nasłuchiwaniu konkretnego, niestandardowego zdarzenia.

**Sygnatura**

`trigger(workflow: Workflow, context: any)`

**Parametry**

| Parametr   | Typ           | Opis                               |
| ---------- | ------------- | ---------------------------------- |
| `workflow` | `WorkflowModel` | Obiekt przepływu pracy do wyzwolenia |
| `context`  | `object`      | Dane kontekstowe dostarczone w momencie wyzwolenia |

:::info{title=Wskazówka}
`context` jest obecnie wymaganym elementem. Jeśli nie zostanie dostarczony, przepływ pracy nie zostanie wyzwolony.
:::

**Przykład**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // rejestruje zdarzenie
    this.timer = setInterval(() => {
      // wyzwala przepływ pracy
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

Wznawia oczekujący przepływ pracy, używając określonego zadania węzła.

- Tylko przepływy pracy w stanie oczekiwania (`EXECUTION_STATUS.STARTED`) mogą zostać wznowione.
- Tylko zadania węzłów w stanie oczekującym (`JOB_STATUS.PENDING`) mogą zostać wznowione.

**Sygnatura**

`resume(job: JobModel)`

**Parametry**

| Parametr | Typ        | Opis                       |
| -------- | ---------- | -------------------------- |
| `job`    | `JobModel` | Zaktualizowany obiekt zadania |

:::info{title=Wskazówka}
Przekazany obiekt zadania jest zazwyczaj zaktualizowanym obiektem, a jego `status` jest zwykle aktualizowany do wartości innej niż `JOB_STATUS.PENDING`, w przeciwnym razie zadanie będzie nadal oczekiwać.
:::

**Przykład**

Szczegóły znajdą Państwo w [kodzie źródłowym](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99).

### `Trigger`

Klasa bazowa dla wyzwalaczy, służąca do rozszerzania niestandardowych typów wyzwalaczy.

| Parametr      | Typ                                                         | Opis                                     |
| ------------- | ----------------------------------------------------------- | ---------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | Konstruktor                              |
| `on?`         | `(workflow: WorkflowModel): void`                           | Obsługa zdarzeń po włączeniu przepływu pracy |
| `off?`        | `(workflow: WorkflowModel): void`                           | Obsługa zdarzeń po wyłączeniu przepływu pracy |

Metody `on`/`off` służą do rejestrowania/wyrejestrowywania nasłuchiwania zdarzeń, gdy przepływ pracy jest włączany/wyłączany. Przekazywanym parametrem jest instancja przepływu pracy odpowiadająca wyzwalaczowi, którą można przetwarzać zgodnie z konfiguracją. Niektóre typy wyzwalaczy, które już globalnie nasłuchują zdarzeń, mogą nie wymagać implementacji tych dwóch metod. Na przykład, w wyzwalaczu czasowym, mogą Państwo zarejestrować timer w metodzie `on` i wyrejestrować go w metodzie `off`.

### `Instruction`

Klasa bazowa dla typów instrukcji, służąca do rozszerzania niestandardowych typów instrukcji.

| Parametr      | Typ                                                             | Opis                                                                 |
| ------------- | --------------------------------------------------------------- | -------------------------------------------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | Konstruktor                                                          |
| `run`         | `Runner`                                                        | Logika wykonania przy pierwszym wejściu do węzła                     |
| `resume?`     | `Runner`                                                        | Logika wykonania przy wejściu do węzła po wznowieniu z przerwania     |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | Dostarcza zawartość zmiennych lokalnych dla gałęzi generowanych przez odpowiedni węzeł |

**Powiązane typy**

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

W przypadku `getScope` mogą Państwo zapoznać się z [implementacją węzła pętli](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83), która służy do dostarczania zawartości zmiennych lokalnych dla gałęzi.

### `EXECUTION_STATUS`

Tabela stałych dla statusów planu wykonania przepływu pracy, używana do identyfikacji bieżącego statusu odpowiedniego planu wykonania.

| Nazwa stałej                    | Znaczenie                          |
| ------------------------------- | ---------------------------------- |
| `EXECUTION_STATUS.QUEUEING`     | W kolejce                          |
| `EXECUTION_STATUS.STARTED`      | W trakcie wykonywania              |
| `EXECUTION_STATUS.RESOLVED`     | Pomyślnie zakończono               |
| `EXECUTION_STATUS.FAILED`       | Niepowodzenie                      |
| `EXECUTION_STATUS.ERROR`        | Błąd wykonania                     |
| `EXECUTION_STATUS.ABORTED`      | Przerwano                          |
| `EXECUTION_STATUS.CANCELED`     | Anulowano                         |
| `EXECUTION_STATUS.REJECTED`     | Odrzucono                          |
| `EXECUTION_STATUS.RETRY_NEEDED` | Nieudane wykonanie, wymagana ponowna próba |

Z wyjątkiem trzech pierwszych, wszystkie pozostałe reprezentują stan niepowodzenia, ale mogą być używane do opisywania różnych przyczyn niepowodzenia.

### `JOB_STATUS`

Tabela stałych dla statusów zadań węzłów przepływu pracy, używana do identyfikacji bieżącego statusu odpowiedniego zadania węzła. Status generowany przez węzeł wpływa również na status całego planu wykonania.

| Nazwa stałej                    | Znaczenie                                                              |
| ------------------------- | ---------------------------------------------------------------------- |
| `JOB_STATUS.PENDING`      | Oczekujące: Wykonanie dotarło do tego węzła, ale instrukcja wymaga zawieszenia i oczekiwania |
| `JOB_STATUS.RESOLVED`     | Pomyślnie zakończono                                                   |
| `JOB_STATUS.FAILED`       | Niepowodzenie: Wykonanie tego węzła nie spełniło warunków konfiguracji |
| `JOB_STATUS.ERROR`        | Błąd: Podczas wykonywania tego węzła wystąpił nieobsłużony błąd       |
| `JOB_STATUS.ABORTED`      | Zakończono: Wykonanie tego węzła zostało zakończone przez inną logikę po przejściu w stan oczekiwania |
| `JOB_STATUS.CANCELED`     | Anulowano: Wykonanie tego węzła zostało ręcznie anulowane po przejściu w stan oczekiwania |
| `JOB_STATUS.REJECTED`     | Odrzucono: Kontynuacja tego węzła została ręcznie odrzucona po przejściu w stan oczekiwania |
| `JOB_STATUS.RETRY_NEEDED` | Nieudane wykonanie, wymagana ponowna próba                             |

## Po stronie klienta

Poniższy kod przedstawia interfejsy API dostępne w strukturze pakietów po stronie klienta:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

Rejestruje panel konfiguracji dla typu wyzwalacza.

**Sygnatura**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**Parametry**

| Parametr  | Typ                         | Opis                                         |
| --------- | --------------------------- | -------------------------------------------- |
| `type`    | `string`                    | Identyfikator typu wyzwalacza, zgodny z identyfikatorem używanym do rejestracji |
| `trigger` | `typeof Trigger \| Trigger` | Typ lub instancja wyzwalacza                 |

#### `registerInstruction()`

Rejestruje panel konfiguracji dla typu węzła.

**Sygnatura**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**Parametry**

| Parametr      | Typ                                 | Opis                                         |
| ------------- | ----------------------------------- | -------------------------------------------- |
| `type`        | `string`                            | Identyfikator typu węzła, zgodny z identyfikatorem używanym do rejestracji |
| `instruction` | `typeof Instruction \| Instruction` | Typ lub instancja węzła                      |

#### `registerInstructionGroup()`

Rejestruje grupę typów węzłów. NocoBase domyślnie udostępnia 4 grupy typów węzłów:

*   `'control'`: Sterowanie
*   `'collection'`: Operacje na kolekcjach
*   `'manual'`: Przetwarzanie ręczne
*   `'extended'`: Inne rozszerzenia

Jeśli potrzebują Państwo rozszerzyć o inne grupy, mogą Państwo użyć tej metody do ich zarejestrowania.

**Sygnatura**

`registerInstructionGroup(type: string, group: { label: string }): void`

**Parametry**

| Parametr | Typ                 | Opis                                         |
| -------- | ------------------- | -------------------------------------------- |
| `type`   | `string`            | Identyfikator grupy węzłów, zgodny z identyfikatorem używanym do rejestracji |
| `group`  | `{ label: string }` | Informacje o grupie, obecnie zawierające tylko tytuł |

**Przykład**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

Klasa bazowa dla wyzwalaczy, służąca do rozszerzania niestandardowych typów wyzwalaczy.

| Parametr        | Typ                                                             | Opis                                                     |
| --------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| `title`         | `string`                                                        | Nazwa typu wyzwalacza                                    |
| `fieldset`      | `{ [key: string]: ISchema }`                                    | Kolekcja elementów konfiguracji wyzwalacza               |
| `scope?`        | `{ [key: string]: any }`                                        | Kolekcja obiektów, które mogą być używane w schemacie elementów konfiguracji |
| `components?`   | `{ [key: string]: React.FC }`                                   | Kolekcja komponentów, które mogą być używane w schemacie elementów konfiguracji |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | Akcesor wartości dla danych kontekstowych wyzwalacza     |

- Jeśli `useVariables` nie jest ustawione, oznacza to, że ten typ wyzwalacza nie zapewnia funkcji pobierania wartości, a dane kontekstowe wyzwalacza nie mogą być wybrane w węzłach przepływu pracy.

### `Instruction`

Klasa bazowa dla instrukcji, służąca do rozszerzania niestandardowych typów węzłów.

| Parametr             | Typ                                                     | Opis                                                                                               |
| -------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `group`              | `string`                                                | Identyfikator grupy typów węzłów, obecnie dostępne opcje: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | Kolekcja elementów konfiguracji węzła                                                              |
| `scope?`             | `Record<string, Function>`                              | Kolekcja obiektów, które mogą być używane w schemacie elementów konfiguracji                       |
| `components?`        | `Record<string, React.FC>`                              | Kolekcja komponentów, które mogą być używane w schemacie elementów konfiguracji                   |
| `Component?`         | `React.FC`                                              | Niestandardowy komponent renderujący dla węzła                                                     |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | Metoda dla węzła do dostarczania opcji zmiennych węzła                                             |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | Metoda dla węzła do dostarczania opcji zmiennych lokalnych gałęzi                                  |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | Metoda dla węzła do dostarczania opcji inicjalizatora                                              |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | Metoda do określania, czy węzeł jest dostępny                                                      |

**Powiązane typy**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- Jeśli `useVariables` nie jest ustawione, oznacza to, że ten typ węzła nie zapewnia funkcji pobierania wartości, a dane wynikowe tego typu węzła nie mogą być wybrane w węzłach przepływu pracy. Jeśli wartość wynikowa jest pojedyncza (niewybieralna), mogą Państwo zwrócić statyczną zawartość wyrażającą odpowiednie informacje (patrz: [kod źródłowy węzła obliczeniowego](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). Jeśli wymagany jest wybór (np. właściwość obiektu), mogą Państwo dostosować wyjście odpowiedniego komponentu wyboru (patrz: [kod źródłowy węzła tworzenia danych](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component` to niestandardowy komponent renderujący dla węzła. Gdy domyślne renderowanie węzła jest niewystarczające, można go całkowicie nadpisać i użyć do niestandardowego renderowania widoku węzła. Na przykład, jeśli chcą Państwo zapewnić więcej przycisków akcji lub innych interakcji dla węzła początkowego typu gałęzi, należy użyć tej metody (patrz: [kod źródłowy gałęzi równoległej](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers` służy do dostarczania metody inicjalizacji bloków. Na przykład, w węźle ręcznym mogą Państwo inicjalizować powiązane bloki użytkownika na podstawie węzłów nadrzędnych. Jeśli ta metoda zostanie dostarczona, będzie dostępna podczas inicjalizacji bloków w konfiguracji interfejsu węzła ręcznego (patrz: [kod źródłowy węzła tworzenia danych](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable` służy głównie do określenia, czy węzeł może być użyty (dodany) w bieżącym środowisku. Bieżące środowisko obejmuje bieżący przepływ pracy, węzły nadrzędne oraz bieżący indeks gałęzi.