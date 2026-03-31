:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 확장 트리거 유형

모든 워크플로우는 프로세스 실행을 시작하는 진입점 역할을 하는 특정 트리거를 구성해야 합니다.

트리거 유형은 일반적으로 특정 시스템 환경 이벤트를 나타냅니다. 애플리케이션의 런타임 수명 주기 동안 구독 가능한 이벤트를 제공하는 모든 부분이 트리거 유형 정의에 사용될 수 있습니다. 예를 들어, 요청 수신, 컬렉션 작업, 스케줄링된 작업 등이 있습니다.

트리거 유형은 문자열 식별자를 기반으로 플러그인의 트리거 테이블에 등록됩니다. 워크플로우 플러그인에는 몇 가지 내장 트리거가 있습니다:

- `'collection'`：컬렉션 작업으로 트리거됩니다.
- `'schedule'`：스케줄링된 작업으로 트리거됩니다.
- `'action'`：작업 후 이벤트로 트리거됩니다.

확장 트리거 유형은 식별자가 고유해야 하며, 서버 측에서는 트리거의 구독/구독 취소 구현을 등록하고, 클라이언트 측에서는 인터페이스 구성 구현을 등록해야 합니다.

## 서버 측

모든 트리거는 `Trigger` 기본 클래스를 상속받고 `on`/`off` 메서드를 구현해야 합니다. 이 메서드들은 각각 특정 환경 이벤트를 구독하고 구독을 취소하는 데 사용됩니다. `on` 메서드에서는 최종적으로 이벤트를 트리거하기 위해 특정 이벤트 콜백 함수 내에서 `this.workflow.trigger()`를 호출해야 합니다. 또한 `off` 메서드에서는 구독 취소와 관련된 정리 작업을 수행해야 합니다.

`this.workflow`는 `Trigger` 기본 클래스의 생성자에 전달되는 워크플로우 플러그인 인스턴스입니다.

```ts
import { Trigger } from '@nocobase/plugin-workflow';

class MyTrigger extends Trigger {
  timer: NodeJS.Timeout;

  on(workflow) {
    // register event
    this.timer = setInterval(() => {
      // trigger workflow
      this.workflow.trigger(workflow, { date: new Date() });
    }, workflow.config.interval ?? 60000);
  }

  off(workflow) {
    // unregister event
    clearInterval(this.timer);
  }
}
```

그다음, 워크플로우를 확장하는 플러그인에서 트리거 인스턴스를 워크플로우 엔진에 등록합니다:

```ts
import WorkflowPlugin from '@nocobase/plugin-workflow';

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;

    // register trigger
    workflowPlugin.registerTrigger('interval', MyTrigger);
  }
}
```

서버가 시작되고 로드된 후에는 `'interval'` 유형의 트리거를 추가하고 실행할 수 있습니다.

## 클라이언트 측

클라이언트 측은 주로 트리거 유형에 필요한 구성 항목에 따라 구성 인터페이스를 제공합니다. 각 트리거 유형은 워크플로우 플러그인에 해당 유형 구성을 등록해야 합니다.

예를 들어, 위에 언급된 스케줄링된 실행 트리거의 경우, 구성 인터페이스 폼에 필요한 간격 시간 구성 항목(`interval`)을 정의합니다:

```ts
import { Trigger } from '@nocobase/workflow/client';

class MyTrigger extends Trigger {
  title = 'Interval timer trigger';
  // fields of trigger config
  fieldset = {
    interval: {
      type: 'number',
      title: 'Interval',
      name: 'config.interval',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      default: 60000,
    },
  };
}
```

그런 다음, 확장된 플러그인 내에서 이 트리거 유형을 워크플로우 플러그인 인스턴스에 등록합니다:

```ts
import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import MyTrigger from './MyTrigger';

export default class extends Plugin {
  // You can get and modify the app instance here
  async load() {
    const workflow = this.app.pm.get(WorkflowPlugin) as WorkflowPlugin;
    workflow.registerTrigger('interval', MyTrigger);
  }
}
```

그 후 워크플로우의 구성 인터페이스에서 새로운 트리거 유형을 확인할 수 있습니다.

:::info{title=팁}
클라이언트 측에 등록된 트리거 유형 식별자는 서버 측과 일치해야 합니다. 그렇지 않으면 오류가 발생합니다.
:::

트리거 유형 정의에 대한 자세한 내용은 [워크플로우 API 참조](./api#pluginregisterTrigger) 섹션을 참고하십시오.