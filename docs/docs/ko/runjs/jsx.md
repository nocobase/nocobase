:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/jsx)을 참조하세요.
:::

# JSX

RunJS는 JSX 문법을 지원하여 React 컴포넌트를 작성하는 것과 같이 코드를 작성할 수 있으며, JSX는 실행 전 자동으로 컴파일됩니다.

## 컴파일 설명

- [sucrase](https://github.com/alangpierce/sucrase)를 사용하여 JSX를 변환합니다.
- JSX는 `ctx.libs.React.createElement` 및 `ctx.libs.React.Fragment`로 컴파일됩니다.
- **React를 import할 필요가 없습니다**: JSX를 직접 작성하면 컴파일 후 자동으로 `ctx.libs.React`를 사용하게 됩니다.
- `ctx.importAsync('react@x.x.x')`를 통해 외부 React를 로드할 경우, JSX는 해당 인스턴스의 `createElement`를 사용하도록 변경됩니다.

## 내장 React 및 컴포넌트 사용

RunJS에는 React 및 주요 UI 라이브러리가 내장되어 있어, `import` 없이 `ctx.libs`를 통해 직접 사용할 수 있습니다.

- **ctx.libs.React** — React 본체
- **ctx.libs.ReactDOM** — ReactDOM (필요 시 createRoot와 함께 사용 가능)
- **ctx.libs.antd** — Ant Design 컴포넌트
- **ctx.libs.antdIcons** — Ant Design 아이콘

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>클릭</Button>);
```

JSX를 직접 작성할 때는 React를 구조 분해(destructure)할 필요가 없습니다. 다만 **Hooks**(`useState`, `useEffect` 등)나 **Fragment**(`<>...</>`)를 사용할 때만 `ctx.libs`에서 구조 분해하여 사용합니다.

```tsx
const { React } = ctx.libs;
const { useState } = React;

const Counter = () => {
  const [count, setCount] = useState(0);
  return <div>Count: {count}</div>;
};

ctx.render(<Counter />);
```

**주의**: 내장 React와 `ctx.importAsync()`를 통해 가져온 외부 React는 **혼용할 수 없습니다**. 외부 UI 라이브러리를 사용하는 경우, React도 외부에서 함께 가져와야 합니다.

## 외부 React 및 컴포넌트 사용

`ctx.importAsync()`를 통해 특정 버전의 React와 UI 라이브러리를 로드하면, JSX는 해당 React 인스턴스를 사용합니다.

```tsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>클릭</Button>);
```

antd가 react/react-dom에 의존하는 경우, 여러 인스턴스가 생성되는 것을 방지하기 위해 `deps`를 통해 동일한 버전을 지정할 수 있습니다.

```tsx
const React = await ctx.importAsync('react@18.2.0');
const { Button } = await ctx.importAsync('antd@5.29.3?bundle&deps=react@18.2.0,react-dom@18.2.0');

ctx.render(<Button>Button</Button>);
```

**주의**: 외부 React를 사용할 때는 antd 등의 UI 라이브러리도 `ctx.importAsync()`를 통해 가져와야 하며, `ctx.libs.antd`와 혼용해서는 안 됩니다.

## JSX 문법 요점

- **컴포넌트와 props**: `<Button type="primary">텍스트</Button>`
- **Fragment**: `<>...</>` 또는 `<React.Fragment>...</React.Fragment>` (Fragment 사용 시 `const { React } = ctx.libs` 구조 분해가 필요합니다)
- **표현식**: JSX 내에서 `{표현식}`을 사용하여 변수나 연산을 삽입합니다. 예: `{ctx.user.name}`, `{count + 1}`. `{{ }}` 템플릿 문법을 사용하지 마세요.
- **조건부 렌더링**: `{flag && <span>내용</span>}` 또는 `{flag ? <A /> : <B />}`
- **리스트 렌더링**: `array.map()`을 사용하여 요소 리스트를 반환하고, 각 요소에 고유한 `key`를 설정합니다.

```tsx
const { React } = ctx.libs;
const items = ['a', 'b', 'c'];

ctx.render(
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
```