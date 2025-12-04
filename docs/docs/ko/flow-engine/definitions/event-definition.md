:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# EventDefinition

`EventDefinition`은 워크플로우 내에서 특정 이벤트 트리거에 응답하는 이벤트 처리 로직을 정의합니다. 이벤트는 워크플로우 엔진에서 워크플로우 실행을 트리거하는 중요한 메커니즘입니다.

## 타입 정의

```ts
type EventDefinition<TModel extends FlowModel = FlowModel, TCtx extends FlowContext = FlowContext> = ActionDefinition<TModel, TCtx>;
```

`EventDefinition`은 실제로 `ActionDefinition`의 별칭(alias)이며, 따라서 동일한 속성과 메서드를 가집니다.

## 등록 방법

```ts
// 전역 등록 (FlowEngine을 통해)
const engine = new FlowEngine();
engine.registerEvent({
  name: 'clickEvent',
  title: 'Click Event',
  handler: async (ctx, params) => {
    // 이벤트 처리 로직
  }
});

// 모델 레벨 등록 (FlowModel을 통해)
class MyModel extends FlowModel {}
MyModel.registerEvent({
  name: 'submitEvent',
  title: 'Submit Event',
  handler: async (ctx, params) => {
    // 이벤트 처리 로직
  }
});

// 워크플로우에서 사용
MyModel.registerFlow({
  key: 'formFlow',
  on: 'submitEvent',  // 등록된 이벤트 참조
  steps: {
    step1: {
      use: 'processFormAction'
    }
  }
});
```

## 속성 설명

### name

**타입**: `string`  
**필수**: 예  
**설명**: 이벤트의 고유 식별자입니다.

워크플로우에서 `on` 속성을 통해 이벤트를 참조하는 데 사용됩니다.

**예시**:
```ts
name: 'clickEvent'
name: 'submitEvent'
name: 'customEvent'
```

### title

**타입**: `string`  
**필수**: 아니요  
**설명**: 이벤트의 표시 제목입니다.

UI 표시 및 디버깅에 사용됩니다.

**예시**:
```ts
title: 'Click Event'
title: 'Form Submit'
title: 'Data Change'
```

### handler

**타입**: `(ctx: TCtx, params: any) => Promise<any> | any`  
**필수**: 예  
**설명**: 이벤트의 핸들러 함수입니다.

이벤트의 핵심 로직으로, 컨텍스트와 파라미터를 받아 처리 결과를 반환합니다.

**예시**:
```ts
handler: async (ctx, params) => {
  const { model, flowEngine } = ctx;
  
  try {
    // 이벤트 처리 로직 실행
    const result = await handleEvent(params);
    
    // 결과 반환
    return {
      success: true,
      data: result,
      message: 'Event handled successfully'
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
**설명**: 이벤트의 기본 파라미터입니다.

이벤트가 트리거될 때 파라미터에 기본값을 채워 넣습니다.

**예시**:
```ts
// 정적 기본 파라미터
defaultParams: {
  preventDefault: true,
  stopPropagation: false
}

// 동적 기본 파라미터
defaultParams: (ctx) => {
  return {
    timestamp: Date.now(),
    userId: ctx.model.uid,
    eventSource: 'user'
  }
}

// 비동기 기본 파라미터
defaultParams: async (ctx) => {
  const userInfo = await getUserInfo();
  return {
    user: userInfo,
    session: await getSessionInfo()
  }
}
```

### uiSchema

**타입**: `Record<string, ISchema> | ((ctx: TCtx) => Record<string, ISchema> | Promise<Record<string, ISchema>>)`  
**필수**: 아니요  
**설명**: 이벤트의 UI 구성 스키마입니다.

UI에서 이벤트의 표시 방식과 폼 구성을 정의합니다.

**예시**:
```ts
uiSchema: {
  'x-component': 'Form',
  'x-component-props': {
    layout: 'vertical'
  },
  properties: {
    preventDefault: {
      type: 'boolean',
      title: 'Prevent Default',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    stopPropagation: {
      type: 'boolean',
      title: 'Stop Propagation',
      'x-component': 'Switch',
      'x-decorator': 'FormItem'
    },
    customData: {
      type: 'object',
      title: 'Custom Data',
      'x-component': 'Form',
      'x-decorator': 'FormItem',
      properties: {
        key: {
          type: 'string',
          title: 'Key',
          'x-component': 'Input'
        },
        value: {
          type: 'string',
          title: 'Value',
          'x-component': 'Input'
        }
      }
    }
  }
}
```

### beforeParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 파라미터 저장 전 실행되는 훅 함수입니다.

이벤트 파라미터가 저장되기 전에 실행되며, 파라미터 유효성 검사 또는 변환에 사용될 수 있습니다.

**예시**:
```ts
beforeParamsSave: (ctx, params, previousParams) => {
  // 파라미터 유효성 검사
  if (!params.eventType) {
    throw new Error('Event type is required');
  }
  
  // 파라미터 변환
  params.eventType = params.eventType.toLowerCase();
  
  // 변경 사항 기록
  console.log('Event params changed:', {
    from: previousParams,
    to: params
  });
}
```

### afterParamsSave

**타입**: `(ctx: FlowSettingsContext<TModel>, params: any, previousParams: any) => void | Promise<void>`  
**필수**: 아니요  
**설명**: 파라미터 저장 후 실행되는 훅 함수입니다.

이벤트 파라미터가 저장된 후에 실행되며, 다른 작업을 트리거하는 데 사용될 수 있습니다.

**예시**:
```ts
afterParamsSave: (ctx, params, previousParams) => {
  // 로그 기록
  console.log('Event params saved:', params);
  
  // 이벤트 트리거
  ctx.model.emitter.emit('eventConfigChanged', {
    eventName: 'clickEvent',
    params,
    previousParams
  });
  
  // 캐시 업데이트
  ctx.model.updateCache('eventConfig', params);
}
```

### uiMode

**타입**: `StepUIMode | ((ctx: FlowRuntimeContext<TModel>) => StepUIMode | Promise<StepUIMode>)`  
**필수**: 아니요  
**설명**: 이벤트의 UI 표시 모드입니다.

UI에서 이벤트가 표시되는 방식을 제어합니다.

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
    width: 600,
    title: 'Event Configuration'
  }
}

// 동적 모드
uiMode: (ctx) => {
  return ctx.model.isMobile ? 'drawer' : 'dialog';
}
```

## 내장 이벤트 타입

워크플로우 엔진에는 다음과 같은 일반적인 이벤트 타입이 내장되어 있습니다:

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

## 전체 예시

```ts
class FormModel extends FlowModel {}

// 폼 제출 이벤트 등록
FormModel.registerEvent({
  name: 'formSubmitEvent',
  title: 'Form Submit Event',
  handler: async (ctx, params) => {
    const { formData, validation } = params;
    
    try {
      // 폼 데이터 유효성 검사
      if (validation && !validateFormData(formData)) {
        throw new Error('Form validation failed');
      }
      
      // 폼 제출 처리
      const result = await submitForm(formData);
      
      return {
        success: true,
        data: result,
        message: 'Form submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: {
    validation: true,
    preventDefault: true,
    stopPropagation: false
  },
  uiSchema: {
    'x-component': 'Form',
    properties: {
      validation: {
        type: 'boolean',
        title: 'Enable Validation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      preventDefault: {
        type: 'boolean',
        title: 'Prevent Default',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: true
      },
      stopPropagation: {
        type: 'boolean',
        title: 'Stop Propagation',
        'x-component': 'Switch',
        'x-decorator': 'FormItem',
        default: false
      },
      customHandlers: {
        type: 'array',
        title: 'Custom Handlers',
        'x-component': 'ArrayItems',
        'x-decorator': 'FormItem',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              title: 'Handler Name',
              'x-component': 'Input'
            },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
              'x-component': 'Switch'
            }
          }
        }
      }
    }
  },
  beforeParamsSave: (ctx, params) => {
    if (params.validation && !params.formData) {
      throw new Error('Form data is required when validation is enabled');
    }
  },
  afterParamsSave: (ctx, params) => {
    ctx.model.emitter.emit('formEventConfigChanged', params);
  },
  uiMode: 'dialog'
});

// 데이터 변경 이벤트 등록
FormModel.registerEvent({
  name: 'dataChangeEvent',
  title: 'Data Change Event',
  handler: async (ctx, params) => {
    const { field, oldValue, newValue } = params;
    
    try {
      // 데이터 변경 기록
      await logDataChange({
        field,
        oldValue,
        newValue,
        timestamp: Date.now(),
        userId: ctx.model.uid
      });
      
      // 관련 작업 트리거
      ctx.model.emitter.emit('dataChanged', {
        field,
        oldValue,
        newValue
      });
      
      return {
        success: true,
        message: 'Data change logged successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  defaultParams: (ctx) => ({
    logLevel: 'info',
    notify: true,
    timestamp: Date.now()
  }),
  uiMode: 'embed'
});

// 워크플로우에서 이벤트 사용
FormModel.registerFlow({
  key: 'formProcessing',
  title: 'Form Processing',
  on: 'formSubmitEvent',
  steps: {
    validate: {
      use: 'validateFormAction',
      title: 'Validate Form',
      sort: 0
    },
    process: {
      use: 'processFormAction',
      title: 'Process Form',
      sort: 1
    },
    save: {
      use: 'saveFormAction',
      title: 'Save Form',
      sort: 2
    }
  }
});
```