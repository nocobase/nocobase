:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/form)을 참조하세요.
:::

# ctx.form

현재 블록 내의 Ant Design Form 인스턴스입니다. 양식(폼) 필드의 읽기/쓰기, 유효성 검사 트리거 및 제출에 사용됩니다. `ctx.blockModel?.form`과 동일하며, 양식 블록(Form, EditForm, 하위 양식 등)에서 직접 사용할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField** | 다른 양식 필드를 읽거나 써서 연동을 구현하고, 다른 필드 값을 기반으로 계산 또는 유효성 검사를 수행합니다. |
| **JSItem** | 하위 테이블 항목에서 같은 행 또는 다른 필드를 읽고 써서 테이블 내 연동을 구현합니다. |
| **JSColumn** | 테이블 열에서 해당 행 또는 연관 필드 값을 읽어 렌더링에 사용합니다. |
| **양식 조작 / 이벤트 흐름** | 제출 전 유효성 검사, 필드 일괄 업데이트, 양식 초기화 등을 수행합니다. |

> 주의: `ctx.form`은 양식 블록(Form, EditForm, 하위 양식 등)과 관련된 RunJS 컨텍스트에서만 사용할 수 있습니다. 양식이 아닌 시나리오(예: 독립적인 JSBlock, 테이블 블록)에서는 존재하지 않을 수 있으므로, 사용 전 `ctx.form?.getFieldsValue()`와 같이 null 체크를 하는 것이 좋습니다.

## 유형 정의

```ts
form: FormInstance<any>;
```

`FormInstance`는 Ant Design Form의 인스턴스 유형입니다. 주요 메서드는 다음과 같습니다.

## 주요 메서드

### 양식 값 읽기

```ts
// 현재 등록된 필드의 값을 읽습니다 (기본적으로 렌더링된 필드만 포함)
const values = ctx.form.getFieldsValue();

// 모든 필드의 값을 읽습니다 (숨겨진 필드나 접힌 영역 내의 필드 등 렌더링되지 않은 필드 포함)
const allValues = ctx.form.getFieldsValue(true);

// 단일 필드 값을 읽습니다
const email = ctx.form.getFieldValue('email');

// 중첩된 필드(예: 하위 테이블)의 값을 읽습니다
const amount = ctx.form.getFieldValue(['orders', 0, 'amount']);
```

### 양식 값 쓰기

```ts
// 일괄 업데이트 (주로 연동에 사용)
ctx.form.setFieldsValue({
  status: 'active',
  updatedAt: new Date(),
});

// 단일 필드 업데이트
ctx.form.setFieldValue('remark', '메모 완료');
```

### 유효성 검사 및 제출

```ts
// 양식 유효성 검사 트리거
await ctx.form.validateFields();

// 양식 제출 트리거
ctx.form.submit();
```

### 초기화

```ts
// 모든 필드 초기화
ctx.form.resetFields();

// 특정 필드만 초기화
ctx.form.resetFields(['status', 'remark']);
```

## 관련 컨텍스트(Context)와의 관계

### ctx.getValue / ctx.setValue

| 시나리오 | 권장 용법 |
|------|----------|
| **현재 필드 읽기/쓰기** | `ctx.getValue()` / `ctx.setValue(v)` |
| **다른 필드 읽기/쓰기** | `ctx.form.getFieldValue(name)` / `ctx.form.setFieldValue(name, v)` |

현재 JS 필드 내에서는 본인 필드를 읽고 쓸 때 `getValue`/`setValue`를 우선적으로 사용하고, 다른 필드에 접근해야 할 때 `ctx.form`을 사용합니다.

### ctx.blockModel

| 요구 사항 | 권장 용법 |
|------|----------|
| **양식 필드 읽기/쓰기** | `ctx.form` (`ctx.blockModel?.form`과 동일하지만 더 간편함) |
| **부모 블록 접근** | `ctx.blockModel` (`컬렉션`, `리소스` 등 포함) |

### ctx.getVar('ctx.formValues')

양식 값은 `await ctx.getVar('ctx.formValues')`를 통해 가져와야 하며, `ctx.formValues`로 직접 노출되지 않습니다. 양식 컨텍스트 내에서는 실시간 최신 값을 읽기 위해 `ctx.form.getFieldsValue()`를 사용하는 것이 좋습니다.

## 주의 사항

- `getFieldsValue()`는 기본적으로 렌더링된 필드만 반환합니다. 렌더링되지 않은 필드(예: 접힌 영역, 조건부 표시로 숨겨진 필드)를 포함하려면 `true`를 전달해야 합니다: `getFieldsValue(true)`.
- 하위 테이블과 같은 중첩 필드의 경로는 배열 형태입니다(예: `['orders', 0, 'amount']`). `ctx.namePath`를 사용하여 현재 필드의 경로를 가져오고, 이를 통해 같은 행의 다른 열 경로를 구성할 수 있습니다.
- `validateFields()`는 유효성 검사 실패 시 `errorFields` 등의 정보를 포함한 에러 객체를 던집니다(throw). 제출 전 검사에 실패했을 때 `ctx.exit()`를 사용하여 후속 단계를 중단할 수 있습니다.
- 이벤트 흐름이나 연동 규칙 등 비동기 시나리오에서는 `ctx.form`이 아직 준비되지 않았을 수 있으므로, 선택적 체이닝(Optional Chaining)이나 null 체크를 사용하는 것이 권장됩니다.

## 예시

### 필드 연동: 유형에 따라 다른 내용 표시

```ts
const type = ctx.form.getFieldValue('type');
if (type === 'vip') {
  ctx.form.setFieldsValue({ discount: 0.8 });
} else {
  ctx.form.setFieldsValue({ discount: 1 });
}
```

### 다른 필드를 기반으로 현재 필드 계산

```ts
const quantity = ctx.form.getFieldValue('quantity') ?? 0;
const price = ctx.form.getFieldValue('price') ?? 0;
ctx.setValue(quantity * price);
```

### 하위 테이블 내에서 같은 행의 다른 열 읽기/쓰기

```ts
// ctx.namePath는 양식 내 현재 필드의 경로입니다. 예: ['orders', 0, 'amount']
// 같은 행의 status 읽기: ['orders', 0, 'status']
const rowIndex = ctx.namePath?.[1];
const status = ctx.form.getFieldValue(['orders', rowIndex, 'status']);
```

### 제출 전 유효성 검사

```ts
try {
  await ctx.form.validateFields();
  // 유효성 검사 통과, 제출 로직 계속 진행
} catch (e) {
  ctx.message.error('양식 입력을 확인해 주세요');
  ctx.exit();
}
```

### 확인 후 제출

```ts
const confirmed = await ctx.modal.confirm({
  title: '제출 확인',
  content: '제출 후에는 수정할 수 없습니다. 계속하시겠습니까?',
  okText: '확인',
  cancelText: '취소',
});
if (confirmed) {
  await ctx.form.validateFields();
  ctx.form.submit();
} else {
  ctx.exit(); // 사용자가 취소하면 중단
}
```

## 관련 항목

- [ctx.getValue()](./get-value.md) / [ctx.setValue()](./set-value.md): 현재 필드 값 읽기 및 쓰기
- [ctx.blockModel](./block-model.md): 부모 블록 모델, `ctx.form`은 `ctx.blockModel?.form`과 동일함
- [ctx.modal](./modal.md): 확인 팝업, 주로 `ctx.form.validateFields()`, `ctx.form.submit()`과 함께 사용됨
- [ctx.exit()](./exit.md): 유효성 검사 실패 또는 사용자 취소 시 프로세스 종료
- `ctx.namePath`: 양식 내 현재 필드의 경로(배열), 중첩 필드에서 `getFieldValue` / `setFieldValue`의 이름을 구성할 때 사용됨