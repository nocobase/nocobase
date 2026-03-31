:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 노드 유형 확장하기

노드의 유형은 본질적으로 작업 지시입니다. 각기 다른 지시는 워크플로우에서 실행되는 다양한 작업을 나타냅니다.

트리거와 마찬가지로, 노드 유형 확장도 서버 측과 클라이언트 측 두 부분으로 나뉩니다. 서버 측에서는 등록된 지시에 대한 로직을 구현해야 하며, 클라이언트 측에서는 해당 지시가 있는 노드의 관련 파라미터에 대한 UI 설정을 제공해야 합니다.

## 서버 측

### 가장 간단한 노드 지시

지시의 핵심 내용은 함수입니다. 즉, 지시 클래스의 `run` 메서드는 지시의 로직을 실행하기 위해 반드시 구현되어야 합니다. 이 함수 안에서는 데이터베이스 작업, 파일 작업, 서드파티 API 호출 등 필요한 모든 작업을 수행할 수 있습니다.

모든 지시는 `Instruction` 기본 클래스에서 파생되어야 합니다. 가장 간단한 지시는 `run` 함수만 구현하면 됩니다.

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

그리고 이 지시를 워크플로우 플러그인에 등록합니다.

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

지시의 반환 객체에 포함된 상태 값(`status`)은 필수이며, `JOB_STATUS` 상수 중 하나여야 합니다. 이 값은 워크플로우 내에서 해당 노드의 후속 처리 흐름을 결정합니다. 일반적으로 `JOB_STATUS.RESOVLED`를 사용하여 노드가 성공적으로 실행되었고 다음 노드의 실행이 계속될 것임을 나타냅니다. 미리 저장해야 할 결과 값이 있다면 `processor.saveJob` 메서드를 호출하고 해당 메서드의 반환 객체를 반환할 수도 있습니다. 실행기는 이 객체를 기반으로 실행 결과 기록을 생성합니다.

### 노드 결과 값

특정 실행 결과, 특히 후속 노드에서 사용할 데이터를 준비하는 경우, `result` 속성을 통해 반환하고 노드의 작업 객체에 저장할 수 있습니다.

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

여기서 `node.config`는 노드의 설정 항목이며, 필요한 어떤 값이든 될 수 있습니다. 이 값은 데이터베이스의 해당 노드 기록에 `JSON` 타입 필드로 저장됩니다.

### 지시 오류 처리

실행 과정에서 예외가 발생할 수 있는 경우, 미리 예외를 포착하고 실패 상태를 반환할 수 있습니다.

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

예측 가능한 예외를 포착하지 않으면, 워크플로우 엔진이 자동으로 예외를 포착하고 오류 상태를 반환하여 포착되지 않은 예외로 인한 프로그램 충돌을 방지합니다.

### 비동기 노드

흐름 제어 또는 비동기(시간 소모적인) I/O 작업이 필요한 경우, `run` 메서드는 `status`가 `JOB_STATUS.PENDING`인 객체를 반환하여 실행기에게 대기(일시 중단)하도록 지시할 수 있습니다. 이는 특정 외부 비동기 작업이 완료된 후 워크플로우 엔진에 실행을 계속하도록 알리기 위함입니다. `run` 함수에서 대기 상태 값을 반환하는 경우, 해당 지시는 반드시 `resume` 메서드를 구현해야 합니다. 그렇지 않으면 워크플로우 실행을 재개할 수 없습니다.

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

여기서 `paymentService`는 특정 결제 서비스를 의미합니다. 서비스의 콜백에서 워크플로우는 해당 작업의 실행 흐름을 재개하도록 트리거되며, 현재 흐름은 먼저 종료됩니다. 이후 워크플로우 엔진은 새로운 프로세서를 생성하여 노드의 `resume` 메서드로 전달하고, 이전에 일시 중단되었던 노드를 계속 실행합니다.

:::info{title=팁}
여기서 말하는 "비동기 작업"은 JavaScript의 `async` 함수를 의미하는 것이 아니라, 다른 외부 시스템과 상호 작용할 때 즉시 결과를 반환하지 않는 특정 작업을 의미합니다. 예를 들어, 결제 서비스는 결과를 알기 위해 다른 알림을 기다려야 할 수 있습니다.
:::

### 노드 결과 상태

노드의 실행 상태는 전체 워크플로우의 성공 또는 실패에 영향을 미칩니다. 일반적으로 분기가 없는 경우, 특정 노드의 실패는 전체 워크플로우의 실패로 직접 이어집니다. 가장 일반적인 시나리오는 노드가 성공적으로 실행되면 노드 테이블의 다음 노드로 진행하며, 더 이상 후속 노드가 없으면 전체 워크플로우 실행이 성공 상태로 완료되는 것입니다.

실행 중 특정 노드가 실행 실패 상태를 반환하면, 엔진은 다음 두 가지 상황에 따라 다르게 처리합니다.

1.  실패 상태를 반환한 노드가 주 워크플로우에 있는 경우, 즉 상위 노드에 의해 시작된 어떤 분기 워크플로우에도 속하지 않는 경우, 전체 주 워크플로우는 실패로 간주되고 프로세스가 종료됩니다.

2.  실패 상태를 반환한 노드가 특정 분기 워크플로우 내에 있는 경우, 워크플로우의 다음 상태를 결정하는 책임은 분기를 시작한 노드에게 넘어갑니다. 해당 노드의 내부 로직이 후속 워크플로우의 상태를 결정하며, 이 결정은 주 워크플로우로 재귀적으로 전파됩니다.

결국 전체 워크플로우의 다음 상태는 주 워크플로우의 노드에서 결정됩니다. 주 워크플로우의 노드에서 실패가 반환되면 전체 워크플로우는 실패 상태로 종료됩니다.

어떤 노드든 실행 후 "대기(pending)" 상태를 반환하면, 전체 실행 프로세스는 일시적으로 중단되고 보류됩니다. 이는 해당 노드에 의해 정의된 이벤트가 트리거되어 워크플로우 실행이 재개될 때까지 기다립니다. 예를 들어, 수동 노드는 이 노드에 도달하면 "대기" 상태로 일시 중지되며, 수동 개입을 통해 승인 여부를 결정할 때까지 기다립니다. 수동으로 입력된 상태가 승인이라면 후속 워크플로우 노드가 계속 진행되고, 그렇지 않으면 앞서 설명한 실패 로직에 따라 처리됩니다.

더 많은 지시 반환 상태는 워크플로우 API 참조 부분을 확인해 주세요.

### 조기 종료

특정 워크플로우에서는 특정 노드에서 직접 프로세스를 종료해야 할 수 있습니다. 이때 `null`을 반환하여 현재 워크플로우를 종료하고 후속 노드를 더 이상 실행하지 않도록 할 수 있습니다.

이러한 상황은 병렬 분기 노드와 같은 일부 흐름 제어 유형의 노드에서 흔히 발생합니다([코드 참고](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)). 현재 노드의 워크플로우는 종료되지만, 하위 분기마다 새로운 워크플로우가 시작되어 계속 실행됩니다.

:::warn{title=경고}
확장 노드를 사용하여 분기 워크플로우를 스케줄링하는 것은 복잡성이 따르므로, 신중하게 처리하고 충분한 테스트를 수행해야 합니다.
:::

### 더 알아보기

노드 유형을 정의하는 다양한 파라미터에 대한 자세한 내용은 워크플로우 API 참조 부분을 확인해 주세요.

## 클라이언트 측

트리거와 마찬가지로, 지시(노드 유형)의 설정 폼은 프런트엔드에서 구현해야 합니다.

### 가장 간단한 노드 지시

모든 지시는 `Instruction` 기본 클래스에서 파생되어야 합니다. 관련 속성과 메서드는 노드를 설정하고 사용하는 데 사용됩니다.

예를 들어, 위에서 서버 측에 정의된 랜덤 숫자 문자열 유형(`randomString`) 노드에 대한 설정 UI를 제공해야 한다고 가정해 봅시다. 이 노드에는 랜덤 숫자의 자릿수를 나타내는 `digit`이라는 설정 항목이 있으며, 설정 폼에서는 숫자 입력 상자를 사용하여 사용자 입력을 받습니다.

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

:::info{title=팁}
클라이언트 측에 등록된 노드 유형 식별자는 서버 측과 일치해야 합니다. 그렇지 않으면 오류가 발생합니다.
:::

### 노드 결과를 변수로 제공하기

위 예시에서 `useVariables` 메서드를 보셨을 겁니다. 노드의 결과(`result` 부분)를 후속 노드에서 사용할 변수로 제공해야 하는 경우, 상속받은 지시 클래스에서 이 메서드를 구현하고 `VariableOption` 타입에 맞는 객체를 반환해야 합니다. 이 객체는 노드 실행 결과의 구조를 설명하며, 후속 노드에서 선택하여 사용할 수 있도록 변수 이름 매핑을 제공합니다.

`VariableOption` 타입 정의는 다음과 같습니다.

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

핵심은 변수 이름의 분할된 경로 값을 나타내는 `value` 속성입니다. `label`은 UI에 표시하는 데 사용되며, `children`은 노드 결과가 깊은 계층의 객체일 때 사용되는 다단계 변수 구조를 나타냅니다.

사용 가능한 변수는 시스템 내부적으로 `.`으로 구분된 경로 템플릿 문자열로 표현됩니다. 예를 들어 `{{jobsMapByNodeKey.2dw92cdf.abc}}`와 같습니다. 여기서 `jobsMapByNodeKey`는 모든 노드의 결과 집합을 나타내며(내부적으로 정의되어 처리할 필요 없음), `2dw92cdf`는 노드의 `key`이고, `abc`는 노드의 결과 객체에 있는 사용자 정의 속성입니다.

또한, 노드의 결과는 단순한 값일 수도 있으므로, 노드 변수를 제공할 때 첫 번째 계층은 **반드시** 노드 자체에 대한 설명이어야 합니다.

```ts
{
  value: node.key,
  label: node.title,
}
```

즉, 첫 번째 계층은 노드의 `key`와 제목입니다. 예를 들어, 연산 노드의 [코드 참고](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77)를 보면, 연산 노드의 결과를 사용할 때 UI 옵션은 다음과 같습니다.

![연산 노드의 결과](https://static-docs.nocobase.com/20240514230014.png)

노드의 결과가 복잡한 객체인 경우, `children`을 사용하여 깊은 계층의 속성을 계속 설명할 수 있습니다. 예를 들어, 사용자 정의 지시가 다음과 같은 JSON 데이터를 반환한다고 가정해 봅시다.

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

그러면 다음과 같이 `useVariables` 메서드를 통해 반환할 수 있습니다.

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

이렇게 하면 후속 노드에서 다음 UI를 사용하여 변수를 선택할 수 있습니다.

![매핑된 결과 변수](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="팁"}
결과 내의 특정 구조가 깊은 계층의 객체 배열인 경우에도 `children`을 사용하여 경로를 설명할 수 있지만, 배열 인덱스를 포함할 수는 없습니다. NocoBase 워크플로우의 변수 처리에서는 객체 배열에 대한 변수 경로 설명이 사용될 때 자동으로 깊은 계층 값의 배열로 평탄화되며, 인덱스를 통해 특정 값을 접근할 수 없기 때문입니다.
:::

### 노드 가용성

기본적으로 워크플로우에는 어떤 노드든 자유롭게 추가할 수 있습니다. 하지만 특정 상황에서는 노드가 특정 유형의 워크플로우나 분기 내에서 적합하지 않을 수 있습니다. 이때 `isAvailable`을 사용하여 노드의 가용성을 설정할 수 있습니다.

```ts
// 타입 정의
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // 워크플로우 플러그인 인스턴스
  engine: WorkflowPlugin;
  // 워크플로우 인스턴스
  workflow: object;
  // 상위 노드
  upstream: object;
  // 분기 노드 여부 (분기 번호)
  branchIndex: number;
};
```

`isAvailable` 메서드가 `true`를 반환하면 노드를 사용할 수 있음을 의미하고, `false`를 반환하면 사용할 수 없음을 의미합니다. `ctx` 파라미터에는 현재 노드의 컨텍스트 정보가 포함되어 있으며, 이 정보를 기반으로 노드의 가용성을 판단할 수 있습니다.

특별한 요구 사항이 없는 경우, `isAvailable` 메서드를 구현할 필요는 없습니다. 노드는 기본적으로 사용 가능합니다. 가장 흔하게 설정이 필요한 경우는 노드가 시간이 많이 소요되는 작업이어서 동기 워크플로우에서 실행하기에 적합하지 않을 때입니다. 이때 `isAvailable` 메서드를 사용하여 노드 사용을 제한할 수 있습니다. 예를 들어:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### 더 알아보기

노드 유형을 정의하는 다양한 파라미터에 대한 자세한 내용은 워크플로우 API 참조 부분을 확인해 주세요.