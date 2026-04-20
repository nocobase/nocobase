:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/render)을 참조하세요.
:::

# ctx.render()

React 엘리먼트, HTML 문자열 또는 DOM 노드를 지정된 컨테이너에 렌더링합니다. `container`를 전달하지 않으면 기본적으로 `ctx.element`에 렌더링되며, 애플리케이션의 ConfigProvider, 테마 등 컨텍스트를 자동으로 상속합니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | 블록 사용자 정의 콘텐츠(차트, 목록, 카드 등) 렌더링 |
| **JSField / JSItem / JSColumn** | 편집 가능한 필드 또는 테이블 컬럼의 사용자 정의 표시 렌더링 |
| **상세 블록** | 상세 페이지 필드의 표시 형식 사용자 정의 |

> 주의: `ctx.render()`는 렌더링 컨테이너가 필요합니다. `container`를 전달하지 않고 `ctx.element`가 존재하지 않는 경우(UI가 없는 순수 로직 시나리오 등) 에러가 발생합니다.

## 타입 정의

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | 렌더링할 내용 |
| `container` | `Element` \| `DocumentFragment` (선택 사항) | 렌더링 대상 컨테이너, 기본값은 `ctx.element` |

**반환값**:

- **React 엘리먼트**를 렌더링할 때: 이후 `root.render()`를 호출하여 업데이트할 수 있도록 `ReactDOMClient.Root`를 반환합니다.
- **HTML 문자열** 또는 **DOM 노드**를 렌더링할 때: `null`을 반환합니다.

## vnode 타입 설명

| 타입 | 동작 |
|------|------|
| `React.ReactElement` (JSX) | React의 `createRoot`를 사용하여 렌더링하며, 전체 React 기능을 지원하고 애플리케이션 컨텍스트를 자동으로 상속합니다. |
| `string` | DOMPurify로 정제한 후 컨테이너의 `innerHTML`을 설정합니다. 기존 React 루트는 먼저 언마운트(unmount)됩니다. |
| `Node` (Element, Text 등) | 컨테이너를 비운 후 `appendChild`로 추가합니다. 기존 React 루트는 먼저 언마운트됩니다. |
| `DocumentFragment` | 프래그먼트의 자식 노드들을 컨테이너에 추가합니다. 기존 React 루트는 먼저 언마운트됩니다. |

## 예시

### React 엘리먼트(JSX) 렌더링

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('제목')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('클릭됨'))}>
      {ctx.t('버튼')}
    </Button>
  </Card>
);
```

### HTML 문자열 렌더링

```ts
ctx.render('<h1>Hello World</h1>');

// ctx.t를 결합하여 다국어 지원
ctx.render('<div style="padding:16px">' + ctx.t('내용') + '</div>');

// 조건부 렌더링
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('No data') + '</span>');
```

### DOM 노드 렌더링

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// 먼저 빈 컨테이너를 렌더링한 후, 제3자 라이브러리(예: ECharts)에 전달하여 초기화
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### 사용자 정의 컨테이너 지정

```ts
// 지정된 DOM 엘리먼트에 렌더링
const customEl = document.getElementById('my-container');
ctx.render(<div>내용</div>, customEl);
```

### 여러 번 호출 시 내용 교체

```ts
// 두 번째 호출은 컨테이너 내의 기존 내용을 교체합니다.
ctx.render(<div>첫 번째</div>);
ctx.render(<div>두 번째</div>);  // "두 번째"만 표시됩니다.
```

## 주의사항

- **여러 번 호출 시 교체됨**: `ctx.render()`를 호출할 때마다 컨테이너의 기존 내용을 교체하며, 추가되지 않습니다.
- **HTML 문자열 보안**: 전달된 HTML은 DOMPurify를 통해 정제되어 XSS 위험을 줄이지만, 신뢰할 수 없는 사용자 입력을 직접 연결하는 것은 피하는 것이 좋습니다.
- **ctx.element를 직접 조작하지 마세요**: `ctx.element.innerHTML`은 더 이상 권장되지 않으며(deprecated), 일관되게 `ctx.render()`를 사용해야 합니다.
- **기본 컨테이너가 없을 때 container 전달**: `ctx.element`가 `undefined`인 시나리오(`ctx.importAsync`로 로드된 모듈 내부 등)에서는 `container`를 명시적으로 전달해야 합니다.

## 관련 정보

- [ctx.element](./element.md) - 기본 렌더링 컨테이너, `ctx.render()`에 container가 전달되지 않았을 때 사용됩니다.
- [ctx.libs](./libs.md) - JSX 렌더링에 사용되는 React, antd 등 내장 라이브러리입니다.
- [ctx.importAsync()](./import-async.md) - 외부 React/컴포넌트 라이브러리를 필요에 따라 로드한 후 `ctx.render()`와 함께 사용합니다.