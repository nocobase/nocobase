:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/off)을 참조하세요.
:::

# ctx.off()

`ctx.on(eventName, handler)`를 통해 등록된 이벤트 리스너를 제거합니다. 주로 [ctx.on](./on.md)과 함께 사용되며, 적절한 시점에 구독을 취소하여 메모리 누수나 중복 트리거를 방지합니다.

## 사용 사례

| 시나리오 | 설명 |
|------|------|
| **React useEffect 정리(Cleanup)** | `useEffect`의 cleanup 함수에서 호출하여, 컴포넌트가 언마운트될 때 리스너를 제거합니다. |
| **JSField / JSEditableField** | 필드 양방향 바인딩 시, `js-field:value-change`에 대한 구독을 취소합니다. |
| **resource 관련** | `ctx.resource.on`을 통해 등록된 `refresh`, `saved` 등의 리스너 구독을 취소합니다. |

## 타입 정의

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## 예제

### React useEffect에서 쌍으로 사용

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### 리소스 이벤트 구독 취소

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// 적절한 시점에 호출
ctx.resource?.off('refresh', handler);
```

## 주의 사항

1. **handler 참조 일치**: `ctx.off` 호출 시 전달하는 `handler`는 `ctx.on` 호출 시와 동일한 참조여야 합니다. 그렇지 않으면 올바르게 제거되지 않습니다.
2. **적시 정리**: 메모리 누수를 방지하기 위해 컴포넌트가 언마운트되거나 context가 파괴되기 전에 `ctx.off`를 호출하십시오.

## 관련 문서

- [ctx.on](./on.md) - 이벤트 구독
- [ctx.resource](./resource.md) - 리소스 인스턴스 및 해당 `on`/`off` 메서드