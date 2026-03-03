:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/set-value)을 참조하세요.
:::

# ctx.setValue()

JSField, JSItem 등 편집 가능한 필드 시나리오에서 현재 필드의 값을 설정합니다. `ctx.getValue()`와 함께 사용하여 폼(Form)과의 양방향 바인딩을 구현할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField** | 편집 가능한 사용자 정의 필드에 사용자가 선택하거나 계산한 값을 입력합니다. |
| **JSItem** | 테이블/하위 테이블의 편집 가능한 항목에서 현재 셀의 값을 업데이트합니다. |
| **JSColumn** | 테이블 컬럼 렌더링 시 로직에 따라 해당 행의 필드 값을 업데이트합니다. |

> 주의: `ctx.setValue(v)`는 폼 바인딩이 있는 RunJS 컨텍스트에서만 사용할 수 있습니다. 워크플로우(Workflow), 연동 규칙, JSBlock 등 필드 바인딩이 없는 시나리오에서는 이 메서드가 존재하지 않으므로, 사용 전 옵셔널 체이닝(`ctx.setValue?.(value)`)을 사용하는 것을 권장합니다.

## 타입 정의

```ts
setValue<T = any>(value: T): void;
```

- **매개변수**: `value`는 입력할 필드 값이며, 타입은 필드의 폼 항목 타입에 따라 결정됩니다.

## 동작 설명

- `ctx.setValue(v)`는 Ant Design Form 내의 현재 필드 값을 업데이트하고, 관련 폼 연동 및 유효성 검사 로직을 트리거합니다.
- 폼 렌더링이 완료되지 않았거나 필드가 등록되지 않은 경우 호출이 무효할 수 있습니다. `ctx.getValue()`와 함께 사용하여 입력 결과를 확인하는 것이 좋습니다.

## 예시

### getValue와 함께 사용하여 양방향 바인딩 구현

```tsx
const { Input } = ctx.libs.antd;

const defaultValue = ctx.getValue() ?? '';

ctx.render(
  <Input
    defaultValue={defaultValue}
    onChange={(e) => ctx.setValue(e.target.value)}
  />
);
```

### 조건에 따라 기본값 설정

```ts
const status = ctx.getValue();
if (status == null || status === '') {
  ctx.setValue?.('draft');
}
```

### 다른 필드와 연동하여 현재 필드 값 업데이트

```ts
// 특정 필드가 변경될 때 현재 필드를 동기적으로 업데이트
const otherValue = ctx.form?.getFieldValue('type');
if (otherValue === 'custom') {
  ctx.setValue?.({ label: '사용자 정의', value: 'custom' });
}
```

## 주의사항

- 편집 불가능한 필드(예: JSField 상세 모드, JSBlock)에서는 `ctx.setValue`가 `undefined`일 수 있습니다. 에러를 방지하기 위해 `ctx.setValue?.(value)`를 사용하는 것이 좋습니다.
- 관계 필드(M2O, O2M 등)에 값을 설정할 때는 필드 타입과 일치하는 구조(예: `{ id, [titleField]: label }`)를 전달해야 하며, 구체적인 내용은 필드 설정에 따릅니다.

## 관련 정보

- [ctx.getValue()](./get-value.md) - 현재 필드 값을 가져오며, setValue와 함께 사용하여 양방향 바인딩을 구현합니다.
- [ctx.form](./form.md) - Ant Design Form 인스턴스로, 다른 필드를 읽거나 쓸 수 있습니다.
- `js-field:value-change` - 외부 값이 변경될 때 트리거되는 컨테이너 이벤트로, 표시 내용을 업데이트하는 데 사용됩니다.