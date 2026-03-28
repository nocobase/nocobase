:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/render)을 참조하세요.
:::

# 컨테이너 내 렌더링

`ctx.render()`를 사용하여 현재 컨테이너(`ctx.element`)에 콘텐츠를 렌더링합니다. 다음 세 가지 형식을 지원합니다.

## `ctx.render()`

### JSX 렌더링

```jsx
ctx.render(<button>Button</button>);
```

### DOM 노드 렌더링

```js
const div = document.createElement('div');
div.innerHTML = 'Hello World';
ctx.render(div);
```

### HTML 문자열 렌더링

```js
ctx.render('<h1>Hello World</h1>');
```

## JSX 설명

RunJS는 JSX를 직접 렌더링할 수 있습니다. 내장된 React 및 컴포넌트 라이브러리를 사용하거나, 필요에 따라 외부 종속성을 로드할 수 있습니다.

### 내장 React 및 컴포넌트 라이브러리 사용

```jsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### 외부 React 및 컴포넌트 라이브러리 사용

`ctx.importAsync()`를 통해 특정 버전을 필요에 따라 로드할 수 있습니다.

```jsx
const React = await ctx.importAsync('react@19.2.4');
const { Button } = await ctx.importAsync('antd@6.2.2?bundle');

ctx.render(<Button>Click</Button>);
```

특정 버전이나 서드파티 컴포넌트가 필요한 시나리오에 적합합니다.

## ctx.element

권장하지 않는 방식 (사용 중단됨):

```js
ctx.element.innerHTML = '<h1>Hello World</h1>';
```

권장하는 방식:

```js
ctx.render(<h1>Hello World</h1>);
```