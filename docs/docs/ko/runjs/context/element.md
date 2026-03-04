:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/element)을 참조하세요.
:::

# ctx.element

`ctx.render()`의 기본 렌더링 대상인 샌드박스 DOM 컨테이너를 가리키는 `ElementProxy` 인스턴스입니다. `JSBlock`, `JSField`, `JSItem`, `JSColumn` 등 렌더링 컨테이너가 있는 시나리오에서 사용할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | 블록의 DOM 컨테이너로, 커스텀 블록 콘텐츠를 렌더링합니다. |
| **JSField / JSItem / FormJSFieldItem** | 필드/폼 항목의 렌더링 컨테이너입니다(보통 `<span>`). |
| **JSColumn** | 테이블 셀의 DOM 컨테이너로, 커스텀 열 콘텐츠를 렌더링합니다. |

> 주의: `ctx.element`는 렌더링 컨테이너가 존재하는 RunJS 컨텍스트에서만 사용할 수 있습니다. UI 컨텍스트가 없는 시나리오(예: 순수 백엔드 로직)에서는 `undefined`일 수 있으므로, 사용 전 null 체크를 권장합니다.

## 타입 정의

```typescript
element: ElementProxy | undefined;

// ElementProxy는 원본 HTMLElement에 대한 프록시로, 안전한 API를 노출합니다.
class ElementProxy {
  __el: HTMLElement;  // 내부적으로 보유한 네이티브 DOM 요소 (특정 시나리오에서만 접근 필요)
  innerHTML: string;  // 읽기/쓰기 시 DOMPurify로 정화됨
  outerHTML: string; // 위와 동일
  appendChild(child: HTMLElement | string): void;
  // 기타 HTMLElement 메서드 전달 (직접 사용은 권장하지 않음)
}
```

## 보안 요구 사항

**권장: 모든 렌더링은 `ctx.render()`를 통해 수행하십시오.** `ctx.element`의 DOM API(`innerHTML`, `appendChild`, `querySelector` 등)를 직접 사용하지 마십시오.

### 왜 ctx.render()를 권장하나요?

| 장점 | 설명 |
|------|------|
| **보안** | 보안 제어를 중앙 집중화하여 XSS 및 부적절한 DOM 조작을 방지합니다. |
| **React 지원** | JSX, React 컴포넌트 및 생명주기를 완벽하게 지원합니다. |
| **컨텍스트 상속** | 애플리케이션의 `ConfigProvider`, 테마 등을 자동으로 상속합니다. |
| **충돌 처리** | React 루트 생성/해제를 자동으로 관리하여 다중 인스턴스 충돌을 방지합니다. |

### ❌ 권장하지 않음: ctx.element 직접 조작

```ts
// ❌ 권장하지 않음: ctx.element의 API를 직접 사용
ctx.element.innerHTML = '<div>내용</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML`은 더 이상 사용되지 않으므로(deprecated), 대신 `ctx.render()`를 사용하십시오.

### ✅ 권장: ctx.render() 사용

```ts
// ✅ React 컴포넌트 렌더링
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('환영')}>
    <Button type="primary">클릭</Button>
  </Card>
);

// ✅ HTML 문자열 렌더링
ctx.render('<div style="padding:16px;">' + ctx.t('내용') + '</div>');

// ✅ DOM 노드 렌더링
const div = document.createElement('div');
div.textContent = ctx.t('안녕하세요');
ctx.render(div);
```

## 특례: 팝오버 앵커로 사용

현재 요소를 앵커(Anchor)로 하여 팝오버(Popover)를 열어야 할 때, `ctx.element?.__el`에 접근하여 네이티브 DOM을 `target`으로 가져올 수 있습니다.

```ts
// ctx.viewer.popover는 네이티브 DOM을 target으로 필요로 합니다.
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>팝업 내용</div>,
});
```

> '현재 컨테이너를 앵커로 사용'하는 시나리오에서만 `__el`을 사용하십시오. 그 외의 경우에는 DOM을 직접 조작하지 마십시오.

## ctx.render와의 관계

- `ctx.render(vnode)` 호출 시 `container`를 전달하지 않으면 기본적으로 `ctx.element` 컨테이너 내에 렌더링됩니다.
- `ctx.element`가 없고 `container`도 전달되지 않은 경우 오류가 발생합니다.
- 컨테이너를 명시적으로 지정할 수 있습니다: `ctx.render(vnode, customContainer)`.

## 주의 사항

- `ctx.element`는 `ctx.render()`의 내부 컨테이너로만 사용되며, 속성이나 메서드에 직접 접근하거나 수정하는 것은 권장하지 않습니다.
- 렌더링 컨테이너가 없는 컨텍스트에서 `ctx.element`는 `undefined`입니다. `ctx.render()`를 호출하기 전에 컨테이너를 사용할 수 있는지 확인하거나 `container`를 수동으로 전달해야 합니다.
- `ElementProxy`의 `innerHTML`/`outerHTML`은 DOMPurify로 정화되지만, 여전히 통합된 렌더링 관리를 위해 `ctx.render()` 사용을 권장합니다.

## 관련 문서

- [ctx.render](./render.md): 컨테이너에 콘텐츠 렌더링
- [ctx.view](./view.md): 현재 뷰 컨트롤러
- [ctx.modal](./modal.md): 모달 바로가기 API