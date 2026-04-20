:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/model)을 참조하세요.
:::

# ctx.model

현재 RunJS 실행 컨텍스트가 위치한 `FlowModel` 인스턴스로, JSBlock, JSField, JSAction 등의 시나리오에서 기본 엔트리 포인트 역할을 합니다. 구체적인 타입은 컨텍스트에 따라 `BlockModel`, `ActionModel`, `JSEditableFieldModel` 등의 하위 클래스로 달라질 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | `ctx.model`은 현재 블록 모델이며, `resource`, `컬렉션`, `setProps` 등에 접근할 수 있습니다. |
| **JSField / JSItem / JSColumn** | `ctx.model`은 필드 모델이며, `setProps`, `dispatchEvent` 등에 접근할 수 있습니다. |
| **작업 이벤트 / ActionModel** | `ctx.model`은 액션 모델이며, 단계 파라미터를 읽고 쓰거나 이벤트를 디스패치할 수 있습니다. |

> 팁: 만약 **현재 JS를 포함하는 부모 블록**(예: 폼/테이블 블록)에 접근해야 한다면 `ctx.blockModel`을 사용하고, **다른 모델**에 접근해야 한다면 `ctx.getModel(uid)`를 사용하세요.

## 타입 정의

```ts
model: FlowModel;
```

`FlowModel`은 기본 클래스이며, 실제 런타임 시에는 다양한 하위 클래스(`BlockModel`, `FormBlockModel`, `TableBlockModel`, `JSEditableFieldModel`, `ActionModel` 등)의 인스턴스가 됩니다. 사용 가능한 속성과 메서드는 타입에 따라 다릅니다.

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `uid` | `string` | 모델의 고유 식별자입니다. `ctx.getModel(uid)`나 팝업 UID 바인딩에 사용할 수 있습니다. |
| `collection` | `Collection` | 현재 모델에 바인딩된 컬렉션입니다 (블록/필드가 데이터에 바인딩된 경우 존재). |
| `resource` | `Resource` | 연결된 리소스 인스턴스로, 새로고침이나 선택된 행 가져오기 등에 사용됩니다. |
| `props` | `object` | 모델의 UI/동작 설정입니다. `setProps`를 사용하여 업데이트할 수 있습니다. |
| `subModels` | `Record<string, FlowModel>` | 하위 모델 집합입니다 (예: 폼 내의 필드, 테이블 내의 컬럼). |
| `parent` | `FlowModel` | 부모 모델입니다 (있는 경우). |

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `setProps(partialProps: any): void` | 모델 설정을 업데이트하고 리렌더링을 트리거합니다 (예: `ctx.model.setProps({ loading: true })`). |
| `dispatchEvent(eventName: string, payload?: any, options?: any): Promise<any[]>` | 모델에 이벤트를 디스패치하여, 해당 모델에 설정된 해당 이벤트 이름의 워크플로우를 트리거합니다. 선택 사항인 `payload`는 워크플로우 핸들러로 전달되며, `options.debounce`로 디바운싱을 활성화할 수 있습니다. |
| `getStepParams?.(flowKey, stepKey)` | 설정된 워크플로우의 단계 파라미터를 읽습니다 (설정 패널, 사용자 정의 액션 등의 시나리오). |
| `setStepParams?.(flowKey, stepKey, params)` | 설정된 워크플로우의 단계 파라미터를 씁니다. |

## ctx.blockModel, ctx.getModel과의 관계

| 요구사항 | 추천 용법 |
|------|----------|
| **현재 실행 컨텍스트의 모델** | `ctx.model` |
| **현재 JS의 부모 블록** | `ctx.blockModel` (주로 `resource`, `form`, `컬렉션` 접근 시 사용) |
| **UID로 임의의 모델 가져오기** | `ctx.getModel(uid)` 또는 `ctx.getModel(uid, true)` (뷰 스택 전체 검색) |

JSField에서 `ctx.model`은 필드 모델이며, `ctx.blockModel`은 해당 필드를 포함하는 폼/테이블 블록입니다.

## 예시

### 블록/액션 상태 업데이트

```ts
ctx.model.setProps({ loading: true });
await doSomething();
ctx.model.setProps({ loading: false });
```

### 모델 이벤트 디스패치

```ts
// 이벤트를 디스패치하여, 해당 모델에 설정된 해당 이벤트 이름의 워크플로우를 트리거합니다.
await ctx.model.dispatchEvent('remove');
// payload와 함께 전달하면 워크플로우 핸들러의 ctx.inputArgs로 전달됩니다.
await ctx.model.dispatchEvent('customEvent', { id: 123 });
```

### UID를 사용한 팝업 바인딩 또는 교차 모델 접근

```ts
const myUid = ctx.model.uid;
// 팝업 설정에서 openerUid: myUid를 전달하여 연관시킬 수 있습니다.
const other = ctx.getModel('other-block-uid');
if (other) other.rerender?.();
```

## 관련 문서

- [ctx.blockModel](./block-model.md): 현재 JS가 포함된 부모 블록 모델
- [ctx.getModel()](./get-model.md): UID로 다른 모델 가져오기