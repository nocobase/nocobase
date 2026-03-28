:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/modal)을 참조하세요.
:::

# ctx.modal

Ant Design Modal을 기반으로 한 단축 API로, RunJS에서 모달창(정보 안내, 확인 팝업 등)을 능동적으로 열기 위해 사용됩니다. `ctx.viewer` / 뷰 시스템에 의해 구현됩니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField** | 사용자 상호작용 후 작업 결과, 오류 메시지 또는 2차 확인 표시 |
| **워크플로우 / 작업 이벤트** | 제출 전 확인 팝업을 표시하고, 사용자가 취소를 선택하면 `ctx.exit()`를 통해 후속 단계를 중단 |
| **연동 규칙** | 유효성 검사 실패 시 사용자에게 팝업으로 안내 |

> 주의: `ctx.modal`은 뷰 컨텍스트가 존재하는 RunJS 환경(페이지 내 JSBlock, 워크플로우 등)에서 사용할 수 있습니다. 백엔드나 UI 컨텍스트가 없는 환경에서는 존재하지 않을 수 있으므로, 사용 시 옵셔널 체이닝(`ctx.modal?.confirm?.()`)을 사용하는 것을 권장합니다.

## 타입 정의

```ts
modal: {
  info: (config: ModalConfig) => Promise<void>;
  success: (config: ModalConfig) => Promise<void>;
  error: (config: ModalConfig) => Promise<void>;
  warning: (config: ModalConfig) => Promise<void>;
  confirm: (config: ModalConfig) => Promise<boolean>;  // 사용자가 확인을 클릭하면 true, 취소하면 false 반환
};
```

`ModalConfig`는 Ant Design `Modal`의 정적 메서드 설정과 동일합니다.

## 주요 메서드

| 메서드 | 반환값 | 설명 |
|------|--------|------|
| `info(config)` | `Promise<void>` | 정보 안내 모달 |
| `success(config)` | `Promise<void>` | 성공 안내 모달 |
| `error(config)` | `Promise<void>` | 오류 안내 모달 |
| `warning(config)` | `Promise<void>` | 경고 안내 모달 |
| `confirm(config)` | `Promise<boolean>` | 확인 모달, 사용자가 확인을 클릭하면 `true`, 취소하면 `false` 반환 |

## 설정 파라미터

Ant Design `Modal`과 동일하며, 주요 필드는 다음과 같습니다:

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `title` | `ReactNode` | 제목 |
| `content` | `ReactNode` | 내용 |
| `okText` | `string` | 확인 버튼 문구 |
| `cancelText` | `string` | 취소 버튼 문구 (`confirm` 전용) |
| `onOk` | `() => void \| Promise<void>` | 확인 클릭 시 실행할 함수 |
| `onCancel` | `() => void` | 취소 클릭 시 실행할 함수 |

## ctx.message, ctx.openView와의 관계

| 용도 | 추천 사용법 |
|------|----------|
| **가벼운 임시 안내** | `ctx.message`, 자동으로 사라짐 |
| **정보/성공/오류/경고 모달** | `ctx.modal.info` / `success` / `error` / `warning` |
| **2차 확인 (사용자 선택 필요)** | `ctx.modal.confirm`, `ctx.exit()`와 함께 사용하여 흐름 제어 |
| **복잡한 폼, 리스트 등 상호작용** | `ctx.openView`를 사용하여 커스텀 뷰(페이지/서랍/모달) 열기 |

## 예시

### 간단한 정보 모달

```ts
ctx.modal.info({
  title: '안내',
  content: '작업이 완료되었습니다.',
});
```

### 확인 모달 및 흐름 제어

```ts
const confirmed = await ctx.modal.confirm({
  title: '삭제 확인',
  content: '이 레코드를 정말로 삭제하시겠습니까?',
  okText: '확인',
  cancelText: '취소',
});
if (!confirmed) {
  ctx.exit();  // 사용자가 취소할 경우 후속 단계 중단
  return;
}
await ctx.runAction('destroy', { filterByTk: ctx.record?.id });
```

### onOk를 포함한 확인 모달

```ts
await ctx.modal.confirm({
  title: '제출 확인',
  content: '제출 후에는 수정할 수 없습니다. 계속하시겠습니까?',
  async onOk() {
    await ctx.form.submit();
  },
});
```

### 오류 안내

```ts
try {
  await someOperation();
  ctx.modal.success({ title: '성공', content: '작업이 완료되었습니다.' });
} catch (e) {
  ctx.modal.error({ title: '오류', content: e.message });
}
```

## 관련 문서

- [ctx.message](./message.md): 가벼운 임시 안내, 자동으로 사라짐
- [ctx.exit()](./exit.md): 사용자가 확인을 취소할 때 `if (!confirmed) ctx.exit()`를 사용하여 흐름을 중단하는 데 주로 사용
- [ctx.openView()](./open-view.md): 커스텀 뷰를 열며, 복잡한 상호작용에 적합