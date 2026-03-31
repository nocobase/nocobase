:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# API 레퍼런스

## 서버 사이드

서버 사이드 패키지 구조에서 사용할 수 있는 API는 다음 코드와 같습니다:

```ts
import PluginWorkflowServer, {
  Trigger,
  Instruction,
  EXECUTION_STATUS,
  JOB_STATUS,
} from '@nocobase/plugin-workflow';
```

### `PluginWorkflowServer`

워크플로우 플러그인 클래스입니다.

일반적으로 애플리케이션 런타임 중에 `app` 인스턴스를 가져올 수 있는 모든 곳에서 `app.pm.get<PluginWorkflowServer>(PluginWorkflowServer)`를 호출하여 워크플로우 플러그인 인스턴스(이하 `plugin`으로 지칭)를 가져올 수 있습니다.

#### `registerTrigger()`

새로운 트리거 유형을 확장하고 등록합니다.

**시그니처**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger })`

**매개변수**

| 매개변수  | 타입                        | 설명             |
| --------- | --------------------------- | ---------------- |
| `type`    | `string`                    | 트리거 유형 식별자 |
| `trigger` | `typeof Trigger \| Trigger` | 트리거 유형 또는 인스턴스 |

**예시**

```ts
import PluginWorkflowServer, { Trigger } from '@nocobase/plugin-workflow';

function handler(this: MyTrigger, workflow: WorkflowModel, message: string) {
  // 워크플로우를 트리거합니다.
  this.workflow.trigger(workflow, { data: message.data });
}

class MyTrigger extends Trigger {
  messageHandlers: Map<number, WorkflowModel> = new Map();
  on(workflow: WorkflowModel) {
    const messageHandler = handler.bind(this, workflow);
    // 워크플로우를 트리거하기 위해 특정 이벤트를 수신합니다.
    process.on(
      'message',
      this.messageHandlers.set(workflow.id, messageHandler),
    );
  }

  off(workflow: WorkflowModel) {
    const messageHandler = this.messageHandlers.get(workflow.id);
    // 리스너를 제거합니다.
    process.off('message', messageHandler);
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // 워크플로우 플러그인 인스턴스를 가져옵니다.
    const workflowPlugin =
      this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // 트리거를 등록합니다.
    workflowPlugin.registerTrigger('myTrigger', MyTrigger);
  }
}
```

#### `registerInstruction()`

새로운 노드 유형을 확장하고 등록합니다.

**시그니처**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction })`

**매개변수**

| 매개변수      | 타입                                | 설명           |
| ------------- | ----------------------------------- | -------------- |
| `type`        | `string`                            | 명령어 유형 식별자 |
| `instruction` | `typeof Instruction \| Instruction` | 명령어 유형 또는 인스턴스 |

**예시**

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
    // 워크플로우 플러그인 인스턴스를 가져옵니다.
    const workflowPlugin = this.app.pm.get<PluginWorkflowServer>(PluginWorkflowServer);

    // 명령어를 등록합니다.
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

#### `trigger()`

특정 워크플로우를 트리거합니다. 주로 사용자 정의 트리거에서 특정 사용자 정의 이벤트가 수신될 때 해당 워크플로우를 트리거하는 데 사용됩니다.

**시그니처**

`trigger(workflow: Workflow, context: any)`

**매개변수**
| 매개변수 | 타입 | 설명 |
| --- | --- | --- |
| `workflow` | `WorkflowModel` | 트리거할 워크플로우 객체 |
| `context` | `object` | 트리거 시 제공되는 컨텍스트 데이터 |

:::info{title=팁}
`context`는 현재 필수 항목입니다. 제공하지 않으면 해당 워크플로우가 트리거되지 않습니다.
:::

**예시**

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // 이벤트를 등록합니다.
    this.timer = setInterval(() => {
      // 워크플로우를 트리거합니다.
      this.plugin.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }
}
```

#### `resume()`

특정 노드 작업을 통해 대기 중인 워크플로우의 실행을 재개합니다.

- 대기 상태(`EXECUTION_STATUS.STARTED`)에 있는 워크플로우만 실행을 재개할 수 있습니다.
- 대기 상태(`JOB_STATUS.PENDING`)에 있는 노드 작업만 실행을 재개할 수 있습니다.

**시그니처**

`resume(job: JobModel)`

**매개변수**

| 매개변수  | 타입       | 설명             |
| ----- | ---------- | ---------------- |
| `job` | `JobModel` | 업데이트된 작업 객체 |

:::info{title=팁}
전달되는 작업 객체는 일반적으로 업데이트된 객체이며, 보통 `status`를 `JOB_STATUS.PENDING`이 아닌 값으로 업데이트해야 합니다. 그렇지 않으면 계속 대기 상태로 유지됩니다.
:::

**예시**

자세한 내용은 [소스 코드](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-manual/src/server/actions.ts#L99)를 참조하십시오.

### `Trigger`

사용자 정의 트리거 유형을 확장하는 데 사용되는 트리거 기본 클래스입니다.

| 매개변수          | 타입                                                        | 설명                   |
| ------------- | ----------------------------------------------------------- | ---------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Trigger` | 생성자                 |
| `on?`         | `(workflow: WorkflowModel): void`                           | 워크플로우 활성화 후 이벤트 처리 |
| `off?`        | `(workflow: WorkflowModel): void`                           | 워크플로우 비활성화 후 이벤트 처리 |

`on`/`off`는 워크플로우가 활성화/비활성화될 때 이벤트 리스너를 등록/등록 해제하는 데 사용됩니다. 전달되는 매개변수는 해당 트리거의 워크플로우 인스턴스이며, 관련 설정에 따라 처리할 수 있습니다. 일부 트리거 유형이 이미 전역적으로 이벤트를 수신하고 있는 경우, 이 두 메서드를 구현할 필요가 없을 수도 있습니다. 예를 들어, 타이머 트리거에서는 `on`에서 타이머를 등록하고 `off`에서 타이머를 등록 해제할 수 있습니다.

### `Instruction`

사용자 정의 명령어 유형을 확장하는 데 사용되는 명령어 기본 클래스입니다.

| 매개변수          | 타입                                                            | 설명                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------- |
| `constructor` | `(public readonly workflow: PluginWorkflowServer): Instruction` | 생성자                             |
| `run`         | `Runner`                                                        | 노드에 처음 진입할 때의 실행 로직  |
| `resume?`     | `Runner`                                                        | 중단 후 실행 재개 시 노드 진입 로직 |
| `getScope?`   | `(node: FlowNodeModel, data: any, processor: Processor): any`   | 해당 노드에서 생성된 브랜치의 지역 변수 내용 제공 |

**관련 타입**

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

`getScope`는 브랜치의 지역 변수 내용을 제공하는 데 사용되며, [루프 노드의 구현](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-loop/src/server/LoopInstruction.ts#L83)을 참조할 수 있습니다.

### `EXECUTION_STATUS`

워크플로우 실행 계획 상태에 대한 상수 테이블로, 해당 실행 계획의 현재 상태를 식별하는 데 사용됩니다.

| 상수명                          | 의미                 |
| ------------------------------- | -------------------- |
| `EXECUTION_STATUS.QUEUEING`     | 대기열에 추가됨      |
| `EXECUTION_STATUS.STARTED`      | 실행 중              |
| `EXECUTION_STATUS.RESOLVED`     | 성공적으로 완료됨    |
| `EXECUTION_STATUS.FAILED`       | 실패                 |
| `EXECUTION_STATUS.ERROR`        | 실행 오류            |
| `EXECUTION_STATUS.ABORTED`      | 중단됨               |
| `EXECUTION_STATUS.CANCELED`     | 취소됨               |
| `EXECUTION_STATUS.REJECTED`     | 거부됨               |
| `EXECUTION_STATUS.RETRY_NEEDED` | 성공적으로 실행되지 않음, 재시도 필요 |

처음 세 가지를 제외하고는 모두 실패 상태를 나타내지만, 다양한 실패 원인을 설명하는 데 사용될 수 있습니다.

### `JOB_STATUS`

워크플로우 노드 작업 상태에 대한 상수 테이블로, 해당 노드 작업의 현재 상태를 식별하는 데 사용됩니다. 노드에서 생성된 상태는 전체 실행 계획의 상태에도 영향을 미칩니다.

| 상수명                    | 의미                                     |
| ------------------------- | ---------------------------------------- |
| `JOB_STATUS.PENDING`      | 대기 중: 이 노드까지 실행되었으나, 명령어가 일시 중단을 요청함 |
| `JOB_STATUS.RESOLVED`     | 성공적으로 완료됨                        |
| `JOB_STATUS.FAILED`       | 실패: 이 노드 실행이 구성 조건을 충족하지 못함 |
| `JOB_STATUS.ERROR`        | 오류: 이 노드 실행 중 처리되지 않은 오류가 발생함 |
| `JOB_STATUS.ABORTED`      | 중단됨: 이 노드가 대기 상태 후 다른 로직에 의해 실행이 중단됨 |
| `JOB_STATUS.CANCELED`     | 취소됨: 이 노드가 대기 상태 후 수동으로 실행이 취소됨 |
| `JOB_STATUS.REJECTED`     | 거부됨: 이 노드가 대기 상태 후 수동으로 계속 진행이 거부됨 |
| `JOB_STATUS.RETRY_NEEDED` | 성공적으로 실행되지 않음, 재시도 필요    |

## 클라이언트 사이드

클라이언트 사이드 패키지 구조에서 사용할 수 있는 API는 다음 코드와 같습니다:

```ts
import PluginWorkflowClient, {
  Trigger,
  Instruction,
} from '@nocobase/plugin-workflow/client';
```

### `PluginWorkflowClient`

#### `registerTrigger()`

트리거 유형에 해당하는 설정 패널을 등록합니다.

**시그니처**

`registerTrigger(type: string, trigger: typeof Trigger | Trigger): void`

**매개변수**

| 매개변수  | 타입                        | 설명                                 |
| --------- | --------------------------- | ------------------------------------ |
| `type`    | `string`                    | 트리거 유형 식별자, 등록에 사용된 식별자와 일치해야 합니다 |
| `trigger` | `typeof Trigger \| Trigger` | 트리거 유형 또는 인스턴스 |

#### `registerInstruction()`

노드 유형에 해당하는 설정 패널을 등록합니다.

**시그니처**

`registerInstruction(type: string, instruction: typeof Instruction | Instruction): void`

**매개변수**

| 매개변수      | 타입                                | 설명                               |
| ------------- | ----------------------------------- | ---------------------------------- |
| `type`        | `string`                            | 노드 유형 식별자, 등록에 사용된 식별자와 일치해야 합니다 |
| `instruction` | `typeof Instruction \| Instruction` | 노드 유형 또는 인스턴스            |

#### `registerInstructionGroup()`

노드 유형 그룹을 등록합니다. NocoBase는 기본적으로 4가지 노드 유형 그룹을 제공합니다:

* `'control'`: 제어
* `'collection'`: 컬렉션 작업
* `'manual'`: 수동 처리
* `'extended'`: 기타 확장

다른 그룹을 확장해야 하는 경우 이 메서드를 사용하여 등록할 수 있습니다.

**시그니처**

`registerInstructionGroup(type: string, group: { label: string }): void`

**매개변수**

| 매개변수  | 타입               | 설명                           |
| --------- | ----------------- | ----------------------------- |
| `type`    | `string`          | 노드 그룹 식별자, 등록에 사용된 식별자와 일치해야 합니다 |
| `group` | `{ label: string }` | 그룹 정보, 현재는 제목만 포함합니다 |

**예시**

```js
export default class YourPluginClient extends Plugin {
  load() {
    const pluginWorkflow = this.app.pm.get(PluginWorkflowClient);

    pluginWorkflow.registerInstructionGroup('ai', { label: `{{t("AI", { ns: "${NAMESPACE}" })}}` });
  }
}
```

### `Trigger`

사용자 정의 트리거 유형을 확장하는 데 사용되는 트리거 기본 클래스입니다.

| 매개변수            | 타입                                                             | 설명                               |
| --------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `title`         | `string`                                                         | 트리거 유형 이름                   |
| `fieldset`      | `{ [key: string]: ISchema }`                                     | 트리거 설정 항목 컬렉션            |
| `scope?`        | `{ [key: string]: any }`                                         | 설정 항목 Schema에서 사용될 수 있는 객체 컬렉션 |
| `components?`   | `{ [key: string]: React.FC }`                                    | 설정 항목 Schema에서 사용될 수 있는 컴포넌트 컬렉션 |
| `useVariables?` | `(config: any, options: UseVariableOptions ) => VariableOptions` | 트리거 컨텍스트 데이터의 값 접근자 |

- `useVariables`가 설정되지 않은 경우, 해당 트리거 유형은 값 검색 기능을 제공하지 않으며, 워크플로우 노드에서 트리거의 컨텍스트 데이터를 선택할 수 없습니다.

### `Instruction`

사용자 정의 노드 유형을 확장하는 데 사용되는 명령어 기본 클래스입니다.

| 매개변수                 | 타입                                                    | 설명                                                                           |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `group`              | `string`                                                | 노드 유형 그룹 식별자, 현재 사용 가능한 옵션: `'control'`/`'collection'`/`'manual'`/`'extended'` |
| `fieldset`           | `Record<string, ISchema>`                               | 노드 설정 항목 컬렉션                                                          |
| `scope?`             | `Record<string, Function>`                              | 설정 항목 Schema에서 사용될 수 있는 객체 컬렉션                                |
| `components?`        | `Record<string, React.FC>`                              | 설정 항목 Schema에서 사용될 수 있는 컴포넌트 컬렉션                            |
| `Component?`         | `React.FC`                                              | 노드 사용자 정의 렌더링 컴포넌트                                               |
| `useVariables?`      | `(node, options: UseVariableOptions) => VariableOption` | 노드 변수 옵션을 제공하는 메서드                                               |
| `useScopeVariables?` | `(node, options?) => VariableOptions`                   | 브랜치 지역 변수 옵션을 제공하는 메서드                                        |
| `useInitializers?`   | `(node) => SchemaInitializerItemType`                   | 초기화기 옵션을 제공하는 메서드                                                |
| `isAvailable?`       | `(ctx: NodeAvailableContext) => boolean`                | 노드 사용 가능 여부를 판단하는 메서드                                          |

**관련 타입**

```ts
export type NodeAvailableContext = {
  workflow: object;
  upstream: object;
  branchIndex: number;
};
```

- `useVariables`가 설정되지 않은 경우, 해당 노드 유형은 값 검색 기능을 제공하지 않으며, 워크플로우 노드에서 해당 유형 노드의 결과 데이터를 선택할 수 없습니다. 결과 값이 단일(선택 불가능)한 경우, 해당 정보를 표현하는 정적 콘텐츠를 반환하면 됩니다(참조: [연산 노드 소스 코드](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L68)). 객체의 특정 속성과 같이 선택 가능해야 하는 경우, 해당 선택 컴포넌트 출력을 사용자 정의할 수 있습니다(참조: [데이터 추가 노드 소스 코드](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L41)).
- `Component`는 노드 사용자 정의 렌더링 컴포넌트입니다. 기본 노드 렌더링이 충분하지 않을 때 완전히 대체하여 사용자 정의 노드 뷰를 렌더링하는 데 사용할 수 있습니다. 예를 들어, 브랜치 유형의 시작 노드에 더 많은 작업 버튼이나 다른 상호 작용을 제공해야 하는 경우 이 메서드를 사용해야 합니다(참조: [병렬 브랜치 소스 코드](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow-parallel/src/client/ParallelInstruction.tsx)).
- `useInitializers`는 초기화 블록을 제공하는 데 사용됩니다. 예를 들어, 수동 노드에서 상위 노드를 기반으로 관련 사용자 블록을 초기화할 수 있습니다. 이 메서드가 제공되면 수동 노드 인터페이스 설정에서 블록을 초기화할 때 사용할 수 있습니다(참조: [데이터 추가 노드 소스 코드](https://github.com/nocobase/nocobase/blob/main/packages/plugins/@nocobase/plugin-workflow/src/client/nodes/create.tsx#L71)).
- `isAvailable`은 주로 노드가 현재 환경에서 사용(추가)될 수 있는지 여부를 판단하는 데 사용됩니다. 현재 환경에는 현재 워크플로우, 상위 노드 및 현재 브랜치 인덱스 등이 포함됩니다.