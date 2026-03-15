:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/get-model)을 참조하세요.
:::

# ctx.getModel()

모델 `uid`를 기반으로 현재 엔진 또는 뷰 스택에서 모델 인스턴스(예: BlockModel, PageModel, ActionModel 등)를 가져옵니다. RunJS에서 블록, 페이지 또는 팝업 간에 다른 모델에 액세스할 때 사용합니다.

현재 실행 컨텍스트가 위치한 모델이나 블록만 필요한 경우, `ctx.getModel` 대신 `ctx.model` 또는 `ctx.blockModel`을 우선적으로 사용하십시오.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSAction** | 알려진 `uid`를 기반으로 다른 블록의 모델을 가져와 `resource`, `form`, `setProps` 등을 읽거나 씁니다. |
| **팝업 내 RunJS** | 팝업을 연 페이지의 특정 모델에 액세스해야 할 때 `searchInPreviousEngines: true`를 전달하여 사용합니다. |
| **사용자 정의 작업** | 뷰 스택 전체에서 `uid`로 설정 패널의 폼이나 하위 모델을 찾아 구성 또는 상태를 읽습니다. |

## 타입 정의

```ts
getModel<T extends FlowModel = FlowModel>(
  uid: string,
  searchInPreviousEngines?: boolean
): T | undefined
```

## 매개변수

| 매개변수 | 타입 | 설명 |
|------|------|------|
| `uid` | `string` | 대상 모델 인스턴스의 고유 식별자입니다. 구성 또는 생성 시 지정됩니다(예: `ctx.model.uid`). |
| `searchInPreviousEngines` | `boolean` | 선택 사항이며 기본값은 `false`입니다. `true`인 경우 「뷰 스택」의 현재 엔진에서 루트 방향으로 검색하여 상위 엔진(예: 팝업을 연 페이지)의 모델을 가져올 수 있습니다. |

## 반환값

- 모델을 찾으면 해당 `FlowModel` 하위 클래스 인스턴스(예: `BlockModel`, `FormBlockModel`, `ActionModel`)를 반환합니다.
- 찾지 못한 경우 `undefined`를 반환합니다.

## 검색 범위

- **기본값 (`searchInPreviousEngines: false`)**: **현재 엔진** 내에서만 `uid`로 검색합니다. 팝업이나 다단계 뷰에서 각 뷰는 독립된 엔진을 가지며, 기본적으로 현재 뷰 내의 모델만 검색합니다.
- **`searchInPreviousEngines: true`**: 현재 엔진부터 시작하여 `previousEngine` 체인을 따라 위로 검색하며, 일치하는 항목을 발견하면 즉시 반환합니다. 현재 팝업을 연 페이지의 모델에 액세스할 때 유용합니다.

## 예제

### 다른 블록 가져오기 및 새로고침

```ts
const block = ctx.getModel('list-block-uid');
if (block?.resource) {
  await block.resource.refresh();
}
```

### 팝업에서 페이지의 모델 액세스

```ts
// 팝업 내에서 팝업을 연 페이지의 블록에 액세스해야 하는 경우
const pageBlock = ctx.getModel('page-block-uid', true);
if (pageBlock) {
  pageBlock.rerender?.();
}
```

### 교차 모델 읽기/쓰기 및 리렌더링 트리거

```ts
const target = ctx.getModel('other-block-uid');
if (target) {
  target.setProps({ loading: true });
  target.rerender?.();
}
```

### 안전성 검사

```ts
const model = ctx.getModel(someUid);
if (!model) {
  ctx.message.warning('대상 모델이 존재하지 않습니다');
  return;
}
```

## 관련 정보

- [ctx.model](./model.md): 현재 실행 컨텍스트가 위치한 모델
- [ctx.blockModel](./block-model.md): 현재 JS가 위치한 부모 블록 모델로, 일반적으로 `getModel` 없이도 액세스 가능합니다.