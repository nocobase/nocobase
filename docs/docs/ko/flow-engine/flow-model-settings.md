:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# FlowModel 이벤트 플로우 및 설정

FlowModel은 '이벤트 플로우(Flow)' 기반의 접근 방식을 제공하여 컴포넌트의 설정 로직을 구현합니다. 이를 통해 컴포넌트의 동작과 설정을 더욱 확장 가능하고 시각적으로 관리할 수 있습니다.

## 사용자 정의 모델

`FlowModel`을 상속받아 사용자 정의 컴포넌트 모델을 생성할 수 있습니다. 모델은 컴포넌트의 렌더링 로직을 정의하기 위해 `render()` 메서드를 구현해야 합니다.

```ts
class MyModel extends FlowModel {
  render() {
    return <Button {...this.props} />;
  }
}
```

## 플로우(Flow) 등록

각 모델은 컴포넌트의 설정 로직과 상호작용 단계를 설명하기 위해 하나 이상의 **플로우(Flow)**를 등록할 수 있습니다.

```ts
MyModel.registerFlow({
  key: 'buttonSettings',
  title: '버튼 설정',
  steps: {
    general: {
      title: '일반 설정',
      uiSchema: {
        title: {
          type: 'string',
          title: '버튼 제목',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
        },
      },
      defaultParams: {
        type: 'primary',
      },
      handler(ctx, params) {
        ctx.model.setProps('children', params.title);
        ctx.model.setProps('type', params.type);
      },
    },
  },
});
```

설명

-   `key`: 플로우의 고유 식별자입니다.
-   `title`: UI 표시에 사용되는 플로우의 이름입니다.
-   `steps`: 설정 단계(Step)를 정의합니다. 각 단계는 다음을 포함합니다:
    -   `title`: 단계 제목입니다.
    -   `uiSchema`: 설정 폼 구조입니다 (Formily Schema와 호환됩니다).
    -   `defaultParams`: 기본 매개변수입니다.
    -   `handler(ctx, params)`: 저장 시 트리거되며, 모델 상태를 업데이트하는 데 사용됩니다.

## 모델 렌더링

컴포넌트 모델을 렌더링할 때, `showFlowSettings` 매개변수를 사용하여 설정 기능을 활성화할지 여부를 제어할 수 있습니다. `showFlowSettings`가 활성화되면, 컴포넌트 우측 상단에 설정 진입점(예: 설정 아이콘 또는 버튼)이 자동으로 표시됩니다.

```ts
<FlowModelRenderer model={model} showFlowSettings />
```

## openFlowSettings를 사용하여 설정 폼 수동으로 열기

내장된 상호작용 진입점을 통해 설정 폼을 여는 것 외에도, 코드에서 `openFlowSettings()`를 수동으로 호출할 수 있습니다.

``` ts
flowSettings.open(options: FlowSettingsOpenOptions): Promise<boolean>;
model.openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>): Promise<boolean>;
```

### 매개변수 정의

``` ts
interface FlowSettingsOpenOptions {
  model: FlowModel;               // 필수, 해당 모델 인스턴스
  preset?: boolean;               // `preset=true`로 표시된 단계만 렌더링합니다 (기본값은 `false`).
  flowKey?: string;               // 단일 플로우를 지정합니다.
  flowKeys?: string[];            // 여러 플로우를 지정합니다 (`flowKey`가 함께 제공되면 무시됩니다).
  stepKey?: string;               // 단일 단계를 지정합니다 (일반적으로 `flowKey`와 함께 사용됩니다).
  uiMode?: 'dialog' | 'drawer';   // 폼 표시 컨테이너이며, 기본값은 `'dialog'`입니다.
  onCancel?: () => void;          // 취소 버튼 클릭 시 호출되는 콜백 함수입니다.
  onSaved?: () => void;           // 설정이 성공적으로 저장된 후 호출되는 콜백 함수입니다.
}
```

### 예시: Drawer 모드로 특정 플로우의 설정 폼 열기

``` ts
await model.openFlowSettings({
  flowKey: 'buttonSettings',
  uiMode: 'drawer',
  onSaved: () => {
    console.log('버튼 설정이 저장되었습니다');
  },
});
```