:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/on)을 참조하세요.
:::

# ctx.on()

RunJS에서 컨텍스트 이벤트(필드 값 변경, 속성 변경, 리소스 새로고침 등)를 구독합니다. 이벤트는 유형에 따라 `ctx.element`의 사용자 정의 DOM 이벤트 또는 `ctx.resource` 내부 이벤트 버스로 매핑됩니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSField / JSEditableField** | 외부(폼, 연동 등)에서 필드 값이 변경될 때 UI를 동기적으로 업데이트하여 양방향 바인딩을 구현합니다. |
| **JSBlock / JSItem / JSColumn** | 컨테이너의 사용자 정의 이벤트를 수신하여 데이터나 상태 변화에 대응합니다. |
| **resource 관련** | 리소스 새로고침, 저장 등 생명주기 이벤트를 수신하여 데이터 업데이트 후 로직을 실행합니다. |

## 타입 정의

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## 주요 이벤트

| 이벤트명 | 설명 | 이벤트 소스 |
|--------|------|----------|
| `js-field:value-change` | 필드 값이 외부에서 수정됨 (예: 폼 연동, 기본값 업데이트) | `ctx.element`의 CustomEvent, `ev.detail`이 새 값임 |
| `resource:refresh` | 리소스 데이터가 새로고침됨 | `ctx.resource` 이벤트 버스 |
| `resource:saved` | 리소스 저장이 완료됨 | `ctx.resource` 이벤트 버스 |

> 이벤트 매핑 규칙: `resource:` 접두사가 붙은 이벤트는 `ctx.resource.on`을 통해 전달되며, 그 외에는 일반적으로 `ctx.element`의 DOM 이벤트(존재하는 경우)를 통해 전달됩니다.

## 예시

### 필드 양방향 바인딩 (React useEffect + 정리)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### 네이티브 DOM 수신 (ctx.on을 사용할 수 없는 경우의 대안)

```ts
// ctx.on이 제공되지 않을 경우, ctx.element를 직접 사용할 수 있습니다.
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// 정리 시: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### 리소스 새로고침 후 UI 업데이트

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // 데이터를 기반으로 렌더링 업데이트
});
```

## ctx.off와의 연계

- `ctx.on`으로 등록한 리스너는 메모리 누수나 중복 실행을 방지하기 위해 적절한 시점에 [ctx.off](./off.md)을 통해 제거해야 합니다.
- React에서는 일반적으로 `useEffect`의 클린업(cleanup) 함수에서 `ctx.off`를 호출합니다.
- `ctx.off`가 존재하지 않을 수도 있으므로, 호출 시 옵셔널 체이닝을 사용하는 것이 좋습니다: `ctx.off?.('eventName', handler)`.

## 주의사항

1. **쌍을 이루는 취소**: 모든 `ctx.on(eventName, handler)` 호출은 그에 대응하는 `ctx.off(eventName, handler)`가 있어야 하며, 전달되는 `handler` 참조는 동일해야 합니다.
2. **생명주기**: 컴포넌트가 언마운트되거나 컨텍스트가 소멸되기 전에 리스너를 제거하여 메모리 누수를 방지하세요.
3. **이벤트 가용성**: 컨텍스트 유형에 따라 지원되는 이벤트가 다르므로, 자세한 내용은 각 컴포넌트 문서를 참조하시기 바랍니다.

## 관련 문서

- [ctx.off](./off.md) - 이벤트 리스너 제거
- [ctx.element](./element.md) - 렌더링 컨테이너 및 DOM 이벤트
- [ctx.resource](./resource.md) - 리소스 인스턴스 및 해당 `on`/`off`
- [ctx.setValue](./set-value.md) - 필드 값 설정 (`js-field:value-change`를 트리거함)