:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# ActionDefinition

ActionDefinition은 여러 워크플로우와 단계에서 참조할 수 있는 재사용 가능한 액션을 정의합니다. 액션은 워크플로우 엔진의 핵심 실행 단위이며, 특정 비즈니스 로직을 캡슐화합니다.

## 타입 정의

```ts
interface ActionDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> {
  name: string;
  title?: string;
  handler: (ctx: TCtx, params: any) => Promise<any> | any;
  uiSchema?: Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>);
  defaultParams?: Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>);
  beforeParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  afterParamsSave?: (ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>;
  useRawParams?: boolean | ((ctx: TCtx) => boolean | Promise<boolean>);
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>);
  scene?: ActionScene | ActionScene[];
  sort?: number;
}
```

## 등록 방법

```ts
// 전역 등록 (FlowEngine을 통해)
const engine = new FlowEngine();
engine.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    // 처리 로직
  }
});

// 모델 수준 등록 (FlowModel을 통해)
class MyModel extends FlowModel {}
MyModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    // 처리 로직
  }
});

// 워크플로우에서 사용
MyModel.registerFlow({
  key: 'dataFlow',
  steps: {
    step1: {
      use: 'loadDataAction',  // 전역 액션 참조
    },
    step2: {
      use: 'processDataAction', // 모델 수준 액션 참조
    }
  }
});
```

## 속성 설명

### name

**타입**: `string`  
**필수**: 예  
**설명**: 액션의 고유 식별자

단계에서 `use` 속성을 통해 액션을 참조할 때 사용됩니다.

**예시**:
```ts
name: 'loadDataAction'
name: 'processDataAction'
name: 'saveDataAction'
```

### title

**타입**: `string`  
**필수**: 아니요  
**설명**: 액션의 표시 제목

UI 표시 및 디버깅에 사용됩니다.

**예시**:
```ts
title: 'Load Data'
title: 'Process Information'
title: 'Save Results'
```

### handler

**타입**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**필수**: 예  
**설명**: 액션의 핸들러 함수

액션의 핵심 로직으로, 컨텍스트와 파라미터를 받아 처리 결과를 반환합니다.

**예시**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // 특정 로직 실행
    const result = await performAction(params);
    
    // 결과 반환
    return {
      success: true,
      data: result,
      message: 'Action completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### defaultParams

**타입**: `Record<string, any> | ((ctx: TCtx) => Record<string, any> | Promise<Record<string, any>>)`  
**필수**: 아니요  
**설명**: 액션의 기본 파라미터

액션이 실행되기 전에 파라미터에 기본값을 채워 넣습니다.

**예시**:
```ts
// 정적 기본 파라미터
defaultParams: {
  timeout: 5000,
  retries: 3,
  format: 'json'
}

// 동적 기본 파라미터
defaultParams: (ctx) => {
  return {
    userId: ctx.model.uid,
    timestamp: Date.now(),
    version: ctx.flowEngine.version
  }
}

// 비동기 기본 파라미터
defaultParams: async (ctx) => {
  const config = await loadConfiguration();
  return {
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: config.timeout
  }
}
```

### uiSchema

**타입**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**필수**: 아니요  
**설명**: 액션의 UI 구성 스키마

UI에서 액션이 표시되는 방식과 폼 구성을 정의합니다.

**예시**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical',
    labelCol: { span: 6 },
    wrapperCol: { span: 18 }
  },
  properties: {
    url: {
      type: 'string',
      title: 'API URL',
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      required: true
    },
    method: {
      type: 'string',
      title: 'HTTP 메서드',
      'x-component': 'Select',
      'x-decorator': 'FormItem',
      enum: ['GET', 'POST', 'PUT', 'DELETE'],
      default: 'GET'
    },
    timeout: {
      type: 'number',
      title: '타임아웃 (ms)',
      'x-component': 'InputNumber',
      'x-decorator': 'FormItem',
      default: 5000
    }
  }
}
```

### beforeParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 파라미터 저장 전 실행되는 훅 함수

액션 파라미터가 저장되기 전에 실행되며, 파라미터 유효성 검사 또는 변환에 사용될 수 있습니다.

**예시**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 파라미터 유효성 검사
  if (!params.url) {
    throw new Error('URL is required');
  }
  
  // 파라미터 변환
  params.url = params.url.trim();
  if (!params.url.startsWith('http')) {
    params.url = 'https://' + params.url;
  }
  
  // 변경 사항 기록
  console.log('Parameters changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 파라미터 저장 후 실행되는 훅 함수

액션 파라미터가 저장된 후에 실행되며, 다른 작업을 트리거하는 데 사용될 수 있습니다.

**예시**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 로그 기록
  console.log('Action params saved:', params);
  
  // 이벤트 트리거
  ctx.model.emitter.emit('actionParamsChanged', {
    actionName: 'loadDataAction',
    params,
    previousParams
  });
  
  // 캐시 업데이트
  ctx.model.updateCache('actionParams', params);
}
```

### useRawParams

**타입**: `boolean | ((ctx: TCtx) => boolean | Promise<boolean>)`  
**필수**: 아니요  
**설명**: 원시(Raw) 파라미터 사용 여부

`true`인 경우, 원시 파라미터가 어떤 처리도 거치지 않고 핸들러 함수에 직접 전달됩니다.

**예시**:
```ts
// 정적 설정
useRawParams: true

// 동적 설정
useRawParams: (ctx) => {
  return ctx.model.isDebugMode;
}
```

### uiMode

**타입**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**필수**: 아니요  
**설명**: 액션의 UI 표시 모드

UI에서 액션이 표시되는 방식을 제어합니다.

**지원되는 모드**:
- `'dialog'` - 대화 상자 모드
- `'drawer'` - 드로어 모드
- `'embed'` - 임베드 모드
- 또는 사용자 정의 설정 객체

**예시**:
```ts
// 단순 모드
uiMode: 'dialog'

// 사용자 정의 설정
uiMode: {
  type: 'dialog',
  props: {
    width: 800,
    title: '액션 설정',
    maskClosable: false
  }
}

// 동적 모드
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

### scene

**타입**: `ActionScene | ActionScene[]`  
**필수**: 아니요  
**설명**: 액션의 사용 시나리오

특정 시나리오에서만 액션을 사용하도록 제한합니다.

**지원되는 시나리오**:
- `'settings'` - 설정 시나리오
- `'runtime'` - 런타임 시나리오
- `'design'` - 디자인 타임 시나리오

**예시**:
```ts
scene: 'settings'  // 설정 시나리오에서만 사용
scene: ['settings', 'runtime']  // 설정 및 런타임 시나리오에서 사용
```

### sort

**타입**: `number`  
**필수**: 아니요  
**설명**: 액션의 정렬 가중치

목록에서 액션의 표시 순서를 제어합니다. 값이 작을수록 앞에 표시됩니다.

**예시**:
```ts
sort: 0  // 가장 앞
sort: 10 // 중간 위치
sort: 100 // 뒤쪽
```

## 전체 예시

```ts
class DataProcessingModel extends FlowModel {}

// 데이터 로딩 액션 등록
DataProcessingModel.registerAction({
  name: 'loadDataAction',
  title: 'Load Data',
  handler: async (ctx, params) => {
    const { url, method = 'GET', timeout = 5000 } = params;
    
    try {
      const response = await fetch(url, {
        method,
        timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        message: 'Data loaded successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    method: 'GET',
    timeout: 5000
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      url: {
        type: 'string',
        title: 'API URL',
        'x-component': 'Input',
        'x-decorator': 'FormItem',
        required: true
      },
      method: {
        type: 'string',
        title: 'HTTP 메서드',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['GET', 'POST', 'PUT', 'DELETE']
      },
      timeout: {
        type: 'number',
        title: '타임아웃 (ms)',
        'x-component': 'InputNumber',
        'x-decorator': 'FormItem'
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (!params.url) {
      throw new Error('URL is required');
    }
    params.url = params.url.trim();
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('dataSourceChanged', params);
  },
  uiMode: 'dialog',
  scene: ['settings', 'runtime'],
  sort: 0
});

// 데이터 처리 액션 등록
DataProcessingModel.registerAction({
  name: 'processDataAction',
  title: 'Process Data',
  handler: async (ctx, params) => {
    const { data, processor, options = {} } = params;
    
    try {
      const processedData = await processData(data, processor, options);
      
      return {
        success: true,
        data: processedData,
        message: 'Data processed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    processor: 'default',
    options: {
      format: 'json',
      encoding: 'utf8'
    }
  }),
  uiSchema: {
    'x-component': 'Form',
    properties: {
      processor: {
        type: 'string',
        title: '프로세서',
        'x-component': 'Select',
        'x-decorator': 'FormItem',
        enum: ['default', 'advanced', 'custom']
      },
      options: {
        type: 'object',
        title: '옵션',
        'x-component': 'Form',
        'x-decorator': 'FormItem',
        properties: {
          format: {
            type: 'string',
            title: '포맷',
            'x-component': 'Select',
            enum: ['json', 'xml', 'csv']
          },
          encoding: {
            type: 'string',
            title: '인코딩',
            'x-component': 'Select',
            enum: ['utf8', 'ascii', 'latin1']
          }
        }
      }
    }
  },
  scene: 'runtime',
  sort: 1
});
```