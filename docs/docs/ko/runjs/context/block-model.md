:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/block-model)을 참조하세요.
:::

# ctx.blockModel

현재 JS 필드 / JS 블록이 위치한 부모 블록 모델(BlockModel 인스턴스)입니다. JSField, JSItem, JSColumn 등의 시나리오에서 `ctx.blockModel`은 현재 JS 로직을 포함하고 있는 폼 블록이나 테이블 블록을 가리킵니다. 독립적인 JSBlock에서는 `null`이거나 `ctx.model`과 동일할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField** | 폼 필드 내에서 부모 폼 블록의 `form`, `컬렉션`, `resource`에 접근하여 연동이나 유효성 검사를 구현합니다. |
| **JSItem** | 하위 테이블 항목에서 부모 테이블/폼 블록의 리소스 및 컬렉션 정보에 접근합니다. |
| **JSColumn** | 테이블 컬럼에서 부모 테이블 블록의 `resource`(예: `getSelectedRows`) 및 `컬렉션`에 접근합니다. |
| **폼 작업 / 이벤트 흐름** | 제출 전 유효성 검사를 위해 `form`에 접근하거나, 새로고침을 위해 `resource`에 접근합니다. |

> 주의: `ctx.blockModel`은 부모 블록이 존재하는 RunJS 컨텍스트에서만 사용할 수 있습니다. 부모 폼/테이블이 없는 독립적인 JSBlock에서는 `null`일 수 있으므로, 사용 전에 null 체크를 권장합니다.

## 타입 정의

```ts
blockModel: BlockModel | FormBlockModel | TableBlockModel | CollectionBlockModel | DataBlockModel | null;
```

구체적인 타입은 부모 블록의 타입에 따라 달라집니다. 폼 블록은 주로 `FormBlockModel`, `EditFormModel`이며, 테이블 블록은 주로 `TableBlockModel`입니다.

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `uid` | `string` | 블록 모델의 고유 식별자 |
| `collection` | `Collection` | 현재 블록에 바인딩된 컬렉션 |
| `resource` | `Resource` | 블록에서 사용하는 리소스 인스턴스 (`SingleRecordResource` / `MultiRecordResource` 등) |
| `form` | `FormInstance` | 폼 블록: Ant Design Form 인스턴스로, `getFieldsValue`, `validateFields`, `setFieldsValue` 등을 지원합니다. |
| `emitter` | `EventEmitter` | 이벤트 이미터로, `formValuesChange`, `onFieldReset` 등을 리스닝할 수 있습니다. |

## ctx.model, ctx.form과의 관계

| 요구 사항 | 권장 용법 |
|------|----------|
| **현재 JS가 위치한 부모 블록** | `ctx.blockModel` |
| **폼 필드 읽기/쓰기** | `ctx.form` (`ctx.blockModel?.form`과 동일하며, 폼 블록에서 더 편리함) |
| **현재 실행 컨텍스트의 모델** | `ctx.model` (JSField에서는 필드 모델, JSBlock에서는 블록 모델) |

JSField에서 `ctx.model`은 필드 모델이며, `ctx.blockModel`은 해당 필드를 포함하는 폼 또는 테이블 블록입니다. `ctx.form`은 일반적으로 `ctx.blockModel.form`과 같습니다.

## 예시

### 테이블: 선택된 행 가져오기 및 처리

```ts
const rows = ctx.blockModel?.resource?.getSelectedRows?.() || [];
if (rows.length === 0) {
  ctx.message.warning('데이터를 먼저 선택해 주세요');
  return;
}
```

### 폼 시나리오: 유효성 검사 및 새로고침

```ts
if (ctx.blockModel?.form) {
  await ctx.blockModel.form.validateFields();
  await ctx.blockModel.resource?.refresh?.();
}
```

### 폼 변경 감지

```ts
ctx.blockModel?.emitter?.on?.('formValuesChange', (payload) => {
  // 최신 폼 값에 따라 연동 또는 다시 렌더링 수행
});
```

### 블록 다시 렌더링 트리거

```ts
ctx.blockModel?.rerender?.();
```

## 주의사항

- 부모 폼이나 테이블 블록이 없는 **독립적인 JSBlock**에서는 `ctx.blockModel`이 `null`일 수 있습니다. 속성에 접근하기 전에 옵셔널 체이닝을 사용하는 것이 좋습니다: `ctx.blockModel?.resource?.refresh?.()`.
- **JSField / JSItem / JSColumn**에서 `ctx.blockModel`은 현재 필드를 포함하는 폼 또는 테이블 블록을 가리킵니다. **JSBlock**에서는 실제 계층 구조에 따라 자기 자신 또는 상위 블록일 수 있습니다.
- `resource`는 데이터 블록에만 존재하며, `form`은 폼 블록에만 존재합니다. 테이블 블록에는 일반적으로 `form`이 없습니다.

## 관련 정보

- [ctx.model](./model.md): 현재 실행 컨텍스트의 모델
- [ctx.form](./form.md): 폼 인스턴스, 폼 블록에서 주로 사용
- [ctx.resource](./resource.md): 리소스 인스턴스 (`ctx.blockModel?.resource`와 동일하며, 존재할 경우 직접 사용 가능)
- [ctx.getModel()](./get-model.md): UID로 다른 블록 모델 가져오기