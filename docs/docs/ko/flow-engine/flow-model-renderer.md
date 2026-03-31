:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 렌더링하기

`FlowModelRenderer`는 `FlowModel`을 렌더링하는 핵심 React 컴포넌트입니다. 이 컴포넌트는 `FlowModel` 인스턴스를 시각적인 React 컴포넌트로 변환하는 역할을 합니다.

## 기본 사용법

### FlowModelRenderer

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

// 기본 사용법
<FlowModelRenderer model={myModel} />
```

### FieldModelRenderer

제어되는 필드 모델(Field Model)의 경우, `FieldModelRenderer`를 사용하여 렌더링합니다.

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

// 제어되는 필드 렌더링
<FieldModelRenderer model={fieldModel} />
```

## Props 매개변수

### FlowModelRendererProps

| 매개변수 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `model` | `FlowModel` | - | 렌더링할 `FlowModel` 인스턴스 |
| `uid` | `string` | - | 워크플로우 모델의 고유 식별자 |
| `fallback` | `React.ReactNode` | `<Skeleton.Button size="small" />` | 렌더링 실패 시 표시할 대체 콘텐츠 |
| `showFlowSettings` | `boolean \| object` | `false` | 워크플로우 설정 진입점을 표시할지 여부 |
| `flowSettingsVariant` | `'dropdown' \| 'contextMenu' \| 'modal' \| 'drawer'` | `'dropdown'` | 워크플로우 설정의 상호작용 스타일 |
| `hideRemoveInSettings` | `boolean` | `false` | 설정에서 제거 버튼을 숨길지 여부 |
| `showTitle` | `boolean` | `false` | 테두리 왼쪽 상단에 모델 제목을 표시할지 여부 |
| `skipApplyAutoFlows` | `boolean` | `false` | 자동 워크플로우 적용을 건너뛸지 여부 |
| `inputArgs` | `Record<string, any>` | - | `useApplyAutoFlows`에 전달할 추가 컨텍스트 |
| `showErrorFallback` | `boolean` | `true` | 최상위 레이어를 `FlowErrorFallback` 컴포넌트로 감쌀지 여부 |
| `settingsMenuLevel` | `number` | - | 설정 메뉴 레벨: 1=현재 모델만, 2=하위 모델 포함 |
| `extraToolbarItems` | `ToolbarItemConfig[]` | - | 추가 툴바 항목 |

### `showFlowSettings` 상세 설정

`showFlowSettings`가 객체일 경우, 다음 설정들을 지원합니다.

```tsx pure
showFlowSettings={{
  showBackground: true,    // 배경 표시
  showBorder: true,        // 테두리 표시
  showDragHandle: true,    // 드래그 핸들 표시
  style: {},              // 사용자 정의 툴바 스타일
  toolbarPosition: 'inside' // 툴바 위치: 'inside' | 'above' | 'below'
}}
```

## 렌더링 생명 주기

전체 렌더링 생명 주기 동안 다음 메서드들이 순서대로 호출됩니다.

1.  **model.dispatchEvent('beforeRender')** - 렌더링 전 이벤트
2.  **model.render()** - 모델 렌더링 메서드 실행
3.  **model.onMount()** - 컴포넌트 마운트 훅
4.  **model.onUnmount()** - 컴포넌트 언마운트 훅

## 사용 예시

### 기본 렌더링

```tsx pure
import { FlowModelRenderer } from '@nocobase/flow-engine';

function MyComponent() {
  const model = useFlowModel();
  
  return (
    <FlowModelRenderer 
      model={model}
      fallback={<div>로딩 중...</div>}
    />
  );
}
```

### 워크플로우 설정이 포함된 렌더링

```tsx pure
// 설정을 표시하지만 제거 버튼은 숨기기
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  hideRemoveInSettings={true}
/>

// 설정과 제목 표시
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  showTitle={true}
/>

// 컨텍스트 메뉴 모드 사용
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  flowSettingsVariant="contextMenu"
  hideRemoveInSettings={true}
/>
```

### 사용자 정의 툴바

```tsx pure
<FlowModelRenderer
  model={myModel}
  showFlowSettings={true}
  extraToolbarItems={[
    {
      key: 'custom-action',
      title: '사용자 정의 작업',
      icon: 'SettingOutlined',
      onClick: () => {
        console.log('사용자 정의 작업');
      }
    }
  ]}
/>
```

### 자동 워크플로우 건너뛰기

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
  showErrorFallback={false}
/>
```

### 필드 모델 렌더링

```tsx pure
import { FieldModelRenderer } from '@nocobase/flow-engine';

function FormField({ model, onChange, ...props }) {
  return (
    <FieldModelRenderer
      model={model}
      onChange={onChange}
      {...props}
    />
  );
}
```

## 오류 처리

`FlowModelRenderer`는 다음과 같은 포괄적인 오류 처리 메커니즘을 내장하고 있습니다.

-   **자동 오류 경계**: 기본적으로 `showErrorFallback={true}`가 활성화됩니다.
-   **자동 워크플로우 오류**: 자동 워크플로우 실행 중 발생하는 오류를 포착하고 처리합니다.
-   **렌더링 오류**: 모델 렌더링 실패 시 대체 콘텐츠를 표시합니다.

```tsx pure
<FlowModelRenderer
  model={myModel}
  showErrorFallback={true}
  fallback={<div>렌더링에 실패했습니다. 다시 시도해주세요.</div>}
/>
```

## 성능 최적화

### 자동 워크플로우 건너뛰기

자동 워크플로우가 필요 없는 시나리오에서는 성능 향상을 위해 이를 건너뛸 수 있습니다.

```tsx pure
<FlowModelRenderer
  model={myModel}
  skipApplyAutoFlows={true}
/>
```

### 반응형 업데이트

`FlowModelRenderer`는 `@formily/reactive-react`의 `observer`를 사용하여 반응형 업데이트를 수행합니다. 이를 통해 모델 상태가 변경될 때 컴포넌트가 자동으로 다시 렌더링되도록 보장합니다.

## 주의사항

1.  **모델 유효성 검사**: 전달되는 `model`에 유효한 `render` 메서드가 있는지 확인하세요.
2.  **생명 주기 관리**: 모델의 생명 주기 훅은 적절한 시기에 호출됩니다.
3.  **오류 경계**: 더 나은 사용자 경험을 제공하기 위해 프로덕션 환경에서 오류 경계를 활성화하는 것을 권장합니다.
4.  **성능 고려 사항**: 많은 수의 모델을 렌더링하는 시나리오에서는 `skipApplyAutoFlows` 옵션 사용을 고려해 보세요.