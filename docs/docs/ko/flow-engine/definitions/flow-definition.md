:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowDefinition

FlowDefinition은 플로우의 기본 구조와 설정을 정의하며, 플로우 엔진의 핵심 개념 중 하나입니다. 플로우의 메타 정보, 트리거 조건, 실행 단계 등을 설명합니다.

## 타입 정의

```ts
interface FlowDefinitionOptions<TModel extends FlowModel = FlowModel> {
  key: string;
  title?: string;
  manual?: boolean;
  sort?: number;
  on?: FlowEvent<TModel>;
  steps: Record<string, StepDefinition<TModel>>;
  defaultParams?: Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>);
}
```

## 등록 방법

```ts
class MyModel extends FlowModel {}

// 모델 클래스를 통해 플로우를 등록합니다.
MyModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step'
    }
  },
  defaultParams: {
    step1: { param1: 'value1' }
  }
});
```

## 속성 설명

### key

**타입**: `string`  
**필수**: 예  
**설명**: 플로우의 고유 식별자입니다.

일관된 `xxxSettings` 스타일로 이름을 지정하는 것을 권장합니다. 예를 들어:
- `pageSettings`
- `tableSettings` 
- `cardSettings`
- `formSettings`
- `detailsSettings`
- `buttonSettings`
- `popupSettings`
- `deleteSettings`
- `datetimeSettings`
- `numberSettings`

이러한 명명 규칙은 식별 및 유지 관리에 용이하며, 전역적으로 통일하여 사용하는 것을 권장합니다.

**예시**:
```ts
key: 'pageSettings'
key: 'tableSettings'
key: 'deleteSettings'
```

### title

**타입**: `string`  
**필수**: 아니요  
**설명**: 사람이 읽을 수 있는 플로우 제목입니다.

`key`와 일관된 스타일로 `Xxx settings`와 같이 이름을 지정하는 것을 권장합니다. 예를 들어:
- `Page settings`
- `Table settings`
- `Card settings`
- `Form settings`
- `Details settings`
- `Button settings`
- `Popup settings`
- `Delete settings`
- `Datetime settings`
- `Number settings`

이러한 명명 규칙은 더 명확하고 이해하기 쉬워 UI 표시 및 팀 협업에 도움이 됩니다.

**예시**:
```ts
title: 'Page settings'
title: 'Table settings'
title: 'Delete settings'
```

### manual

**타입**: `boolean`  
**필수**: 아니요  
**기본값**: `false`  
**설명**: 플로우를 수동으로만 실행할지 여부를 나타냅니다.

- `true`: 플로우는 수동으로만 트리거되며, 자동으로 실행되지 않습니다.
- `false`: 플로우는 자동으로 실행될 수 있습니다. (`on` 속성이 없을 경우 기본적으로 자동 실행됩니다.)

**예시**:
```ts
manual: true  // 수동으로만 실행
manual: false // 자동으로 실행 가능
```

### sort

**타입**: `number`  
**필수**: 아니요  
**기본값**: `0`  
**설명**: 플로우의 실행 순서입니다. 값이 작을수록 먼저 실행됩니다.

음수를 사용하여 여러 플로우의 실행 순서를 제어할 수 있습니다.

**예시**:
```ts
sort: -1  // 우선적으로 실행
sort: 0   // 기본 순서
sort: 1   // 나중에 실행
```

### on

**타입**: `FlowEvent<TModel>`  
**필수**: 아니요  
**설명**: 이 플로우가 `dispatchEvent`에 의해 트리거될 수 있도록 허용하는 이벤트 설정입니다.

트리거 이벤트 이름(문자열 또는 `{ eventName }`)만 선언하는 데 사용되며, 핸들러 함수는 포함하지 않습니다.

**지원되는 이벤트 타입**:
- `'click'` - 클릭 이벤트
- `'submit'` - 제출 이벤트
- `'reset'` - 초기화 이벤트
- `'remove'` - 삭제 이벤트
- `'openView'` - 뷰 열기 이벤트
- `'dropdownOpen'` - 드롭다운 열기 이벤트
- `'popupScroll'` - 팝업 스크롤 이벤트
- `'search'` - 검색 이벤트
- `'customRequest'` - 사용자 정의 요청 이벤트
- `'collapseToggle'` - 접기/펼치기 토글 이벤트
- 또는 모든 사용자 정의 문자열

**예시**:
```ts
on: 'click'  // 클릭 시 트리거
on: 'submit' // 제출 시 트리거
on: { eventName: 'customEvent', defaultParams: { param1: 'value1' } }
```

### steps

**타입**: `Record<string, StepDefinition<TModel>>`  
**필수**: 예  
**설명**: 플로우 단계 정의입니다.

플로우에 포함된 모든 단계를 정의하며, 각 단계는 고유한 키를 가집니다.

**예시**:
```ts
steps: {
  step1: {
    use: 'actionName',
    title: 'First Step',
    sort: 0
  },
  step2: {
    use: 'anotherAction',
    title: 'Second Step',
    sort: 1
  }
}
```

### defaultParams

**타입**: `Record<string, any> | ((ctx: FlowModelContext) => StepParam | Promise<StepParam>)`  
**필수**: 아니요  
**설명**: 플로우 수준의 기본 파라미터입니다.

모델이 인스턴스화될 때(`createModel`), "현재 플로우"의 단계 파라미터에 초기값을 채웁니다. 누락된 값만 채우고 기존 값은 덮어쓰지 않습니다. 고정된 반환 형태는 `{ [stepKey]: params }`입니다.

**예시**:
```ts
// 정적 기본 파라미터
defaultParams: {
  step1: { param1: 'value1', param2: 'value2' },
  step2: { param3: 'value3' }
}

// 동적 기본 파라미터
defaultParams: (ctx) => {
  return {
    step1: { 
      param1: ctx.model.uid,
      param2: new Date().toISOString()
    }
  }
}

// 비동기 기본 파라미터
defaultParams: async (ctx) => {
  const data = await fetchSomeData();
  return {
    step1: { data }
  }
}
```

## 전체 예시

```ts
class PageModel extends FlowModel {}

PageModel.registerFlow({
  key: 'pageSettings',
  title: 'Page settings',
  manual: false,
  sort: 0,
  on: 'click',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true
    },
    processData: {
      use: 'processDataAction', 
      title: 'Process Data',
      sort: 1,
      paramsRequired: true
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data', 
      sort: 2,
      hideInSettings: false
    }
  },
  defaultParams: {
    loadData: { 
      source: 'api',
      cache: true 
    },
    processData: { 
      format: 'json' 
    }
  }
});
```