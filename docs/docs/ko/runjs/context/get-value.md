:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/get-value)을 참조하세요.
:::

# ctx.getValue()

JSField, JSItem 등 편집 가능한 필드 시나리오에서 현재 필드의 최신 값을 가져옵니다. `ctx.setValue(v)`와 함께 사용하여 폼(Form)과의 양방향 바인딩을 구현할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField** | 편집 가능한 사용자 정의 필드에서 사용자 입력 또는 폼의 현재 값을 읽습니다. |
| **JSItem** | 테이블/하위 테이블의 편집 가능한 항목에서 현재 셀의 값을 읽습니다. |
| **JSColumn** | 테이블 컬럼 렌더링 시 해당 행의 필드 값을 읽습니다. |

> **주의**: `ctx.getValue()`는 폼 바인딩이 있는 RunJS 컨텍스트에서만 사용할 수 있습니다. 워크플로우, 연동 규칙 등 필드 바인딩이 없는 시나리오에서는 이 메서드가 존재하지 않습니다.

## 타입 정의

```ts
getValue<T = any>(): T | undefined;
```

- **반환 값**: 현재 필드 값이며, 타입은 필드의 폼 항목 타입에 의해 결정됩니다. 필드가 등록되지 않았거나 입력되지 않은 경우 `undefined`일 수 있습니다.

## 값 취득 순서

`ctx.getValue()`는 다음 순서대로 값을 가져옵니다:

1. **폼 상태**: Ant Design Form의 현재 상태에서 우선적으로 읽습니다.
2. **폴백(Fallback) 값**: 폼에 해당 필드가 없는 경우, 필드의 초기값 또는 props로 폴백합니다.

> 폼 렌더링이 완료되지 않았거나 필드가 등록되지 않은 경우 `undefined`를 반환할 수 있습니다.

## 예시

### 현재 값에 따른 렌더링

```ts
const current = ctx.getValue();
if (current == null || current === '') {
  ctx.render(<span>먼저 내용을 입력해 주세요</span>);
} else {
  ctx.render(<span>현재 값: {current}</span>);
}
```

### setValue와 함께 사용하여 양방향 바인딩 구현

```tsx
const { Input } = ctx.libs.antd;

// 현재 값을 기본값으로 읽어오기
const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

## 관련 정보

- [ctx.setValue()](./set-value.md) - 현재 필드 값을 설정하며, `getValue`와 함께 사용하여 양방향 바인딩을 구현합니다.
- [ctx.form](./form.md) - Ant Design Form 인스턴스로, 다른 필드를 읽거나 쓸 수 있습니다.
- `js-field:value-change` - 외부 값이 변경될 때 트리거되는 컨테이너 이벤트로, 표시 내용을 업데이트하는 데 사용됩니다.