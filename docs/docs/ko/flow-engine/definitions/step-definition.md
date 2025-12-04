:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# StepDefinition

`StepDefinition`은 워크플로우 내의 개별 단계를 정의합니다. 각 단계는 액션, 이벤트 처리 또는 다른 작업이 될 수 있습니다. 단계는 워크플로우의 기본 실행 단위입니다.

## 타입 정의

```ts
interface StepDefinition<TModel extends FlowModel = FlowModel>
  extends Partial<Omit<ActionDefinition<TModel, FlowRuntimeContext<TModel>>, 'name'>> {
  key?: string;
  isAwait?: boolean;
  use?: string;
  sort?: number;
  preset?: boolean;
  paramsRequired?: boolean;
  hideInSettings?: boolean;
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
}
```

## 사용 방법

```ts
class MyModel extends FlowModel {}

MyModel.registerFlow({
  key: 'pageSettings',
  steps: {
    step1: {
      use: 'actionName',
      title: 'First Step',
      sort: 0,
      preset: true
    },
    step2: {
      handler: async (ctx, params) => {
        // 사용자 정의 처리 로직
        return { result: 'success' };
      },
      title: 'Second Step',
      sort: 1
    }
  }
});
```

## 속성 설명

### key

**타입**: `string`  
**필수**: 아니요  
**설명**: 워크플로우 내에서 단계의 고유 식별자입니다.

이 값을 제공하지 않으면 `steps` 객체에 있는 단계의 키 이름이 사용됩니다.

**예시**:
```ts
steps: {
  loadData: {  // key는 'loadData'
    use: 'loadDataAction'
  }
}
```

### use

**타입**: `string`  
**필수**: 아니요  
**설명**: 사용할 등록된 ActionDefinition의 이름입니다.

`use` 속성을 통해 등록된 액션을 참조하여 중복 정의를 피할 수 있습니다.

**예시**:
```ts
// 먼저 액션을 등록합니다.
MyModel.registerAction({
  name: 'loadDataAction',
  handler: async (ctx, params) => {
    // 데이터 로딩 로직
  }
});

// 단계에서 사용
steps: {
  step1: {
    use: 'loadDataAction',  // 등록된 액션 참조
    title: 'Load Data'
  }
}
```

### title

**타입**: `string`  
**필수**: 아니요  
**설명**: 단계의 표시 제목입니다.

UI 표시 및 디버깅에 사용됩니다.

**예시**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### sort

**타입**: `number`  
**필수**: 아니요  
**설명**: 단계의 실행 순서입니다. 값이 작을수록 먼저 실행됩니다.

동일한 워크플로우 내 여러 단계의 실행 순서를 제어하는 데 사용됩니다.

**예시**:
```ts
steps: {
  step1: { sort: 0 },  // 가장 먼저 실행
  step2: { sort: 1 },  // 다음으로 실행
  step3: { sort: 2 }   // 마지막으로 실행
}
```

### handler

**타입**: `(ctx: FlowRuntimeContext<TModel>, params: any) => Promise<any> | any`  
**필수**: 아니요  
**설명**: 단계의 처리 함수입니다.

`use` 속성을 사용하지 않을 때 처리 함수를 직접 정의할 수 있습니다.

**예시**:
```ts
handler: async (ctx, params) => {
  // 컨텍스트 정보 가져오기
  const { model, flowEngine } = ctx;
  
  // 처리 로직
  const result = await processData(params);
  
  // 결과 반환
  return { success: true, data: result };
}
```

### defaultParams

**타입**: `Record<string, any> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, any> | Promise<Record<string, any>>)`  
**필수**: 아니요  
**설명**: 단계의 기본 매개변수입니다.

단계가 실행되기 전에 매개변수에 기본값을 채워 넣습니다.

**예시**:
```ts
// 정적 기본 매개변수
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// 동적 기본 매개변수
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now()
  }
}

// 비동기 기본 매개변수
defaultParams: async (ctx) => {
  const config = await loadConfig();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey
  }
}
```

### uiSchema

**타입**: `Record<string, ISchema> | ((ctx: FlowRuntimeContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**필수**: 아니요  
**설명**: 단계의 UI 구성 스키마입니다.

단계가 인터페이스에 표시되는 방식과 폼 구성을 정의합니다.

**예시**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    name: {
      type: 'string',
      title: 'Name',
      'x-component': 'Input'
    },
    age: {
      type: 'number',
      title: 'Age',
      'x-component': 'InputNumber'
    }
  }
}
```

### beforeParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 매개변수 저장 전 실행되는 훅 함수입니다.

단계 매개변수가 저장되기 전에 실행되며, 매개변수 유효성 검사 또는 변환에 사용될 수 있습니다.

**예시**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 매개변수 유효성 검사
  if (!params.name) {
    throw new Error('Name is required');
  }
  
  // 매개변수 변환
  params.name = params.name.trim().toLowerCase();
}
```

### afterParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 매개변수 저장 후 실행되는 훅 함수입니다.

단계 매개변수가 저장된 후 실행되며, 다른 작업을 트리거하는 데 사용될 수 있습니다.

**예시**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 로그 기록
  console.log('Step params saved:', params);
  
  // 다른 작업 트리거
  ctx.model.emitter.emit('paramsChanged', params);
}
```

### uiMode

**타입**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**필수**: 아니요  
**설명**: 단계의 UI 표시 모드입니다.

단계가 인터페이스에 표시되는 방식을 제어합니다.

**지원되는 모드**:
- `'dialog'` - 다이얼로그 모드
- `'drawer'` - 드로어 모드
- `'embed'` - 임베드 모드
- 또는 사용자 정의 설정 객체

**예시**:
```ts
// 간단한 모드
uiMode: 'dialog'

// 사용자 정의 설정
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: 'Step Configuration'
  }
}

// 동적 모드
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### preset

**타입**: `boolean`  
**필수**: 아니요  
**설명**: 사전 설정 단계인지 여부입니다.

`preset: true`로 설정된 단계의 매개변수는 생성 시점에 입력해야 합니다. 이 플래그가 없는 단계는 모델 생성 후에 입력할 수 있습니다.

**예시**:
```ts
steps: {
  step1: {
    preset: true,  // 생성 시 매개변수 필수 입력
    use: 'requiredAction'
  },
  step2: {
    preset: false, // 나중에 매개변수 입력 가능
    use: 'optionalAction'
  }
}
```

### paramsRequired

**타입**: `boolean`  
**필수**: 아니요  
**설명**: 단계 매개변수가 필수인지 여부입니다.

`true`로 설정하면 모델을 추가하기 전에 설정 다이얼로그가 열립니다.

**예시**:
```ts
paramsRequired: true  // 모델 추가 전 매개변수 필수 설정
paramsRequired: false // 나중에 매개변수 설정 가능
```

### hideInSettings

**타입**: `boolean`  
**필수**: 아니요  
**설명**: 설정 메뉴에서 단계를 숨길지 여부입니다.

**예시**:
```ts
hideInSettings: true  // 설정에서 숨기기
hideInSettings: false // 설정에서 표시 (기본값)
```

### isAwait

**타입**: `boolean`  
**필수**: 아니요  
**기본값**: `true`  
**설명**: 처리 함수가 완료될 때까지 기다릴지 여부입니다.

**예시**:
```ts
isAwait: true  // 처리 함수 완료까지 대기 (기본값)
isAwait: false // 대기하지 않고 비동기 실행
```

## 전체 예시

```ts
class DataProcessingModel extends FlowModel {}

DataProcessingModel.registerFlow({
  key: 'dataProcessing',
  title: 'Data Processing',
  steps: {
    loadData: {
      use: 'loadDataAction',
      title: 'Load Data',
      sort: 0,
      preset: true,
      paramsRequired: true,
      defaultParams: {
        source: 'api',
        timeout: 5000
      },
      uiMode: 'dialog'
    },
    processData: {
      handler: async (ctx, params) => {
        const data = await ctx.model.getData();
        return processData(data, params);
      },
      title: 'Process Data',
      sort: 1,
      defaultParams: (ctx) => ({
        userId: ctx.model.uid,
        timestamp: Date.now()
      }),
      beforeParamsSave: (ctx, params) => {
        if (!params.processor) {
          throw new Error('Processor is required');
        }
      },
      afterParamsSave: (ctx, params) => {
        ctx.model.emitter.emit('dataProcessed', params);
      }
    },
    saveData: {
      use: 'saveDataAction',
      title: 'Save Data',
      sort: 2,
      hideInSettings: false,
      uiMode: {
        type: 'drawer',
        props: {
          width: 600,
          title: 'Save Configuration'
        }
      }
    }
  }
});
```