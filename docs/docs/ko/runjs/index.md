:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/index)을 참조하세요.
:::

# RunJS 개요

RunJS는 NocoBase에서 **JS 블록**, **JS 필드**, **JS 작업** 등의 시나리오에 사용되는 JavaScript 실행 환경입니다. 코드는 제한된 샌드박스 내에서 실행되며, `ctx`(컨텍스트 API)에 안전하게 접근할 수 있고 다음과 같은 기능을 제공합니다:

- 최상위 await (Top-level `await`)
- 외부 모듈 가져오기
- 컨테이너 내 렌더링
- 전역 변수

## 최상위 await (Top-level await)

RunJS는 최상위 `await`를 지원하므로 코드를 IIFE(즉시 실행 함수)로 감쌀 필요가 없습니다.

**권장하지 않음**

```jsx
async function test() {}
(async () => {
  await test();
})();
```

**권장함**

```js
async function test() {}
await test();
```

## 외부 모듈 가져오기

- ESM 모듈은 `ctx.importAsync()`를 사용합니다 (권장).
- UMD/AMD 모듈은 `ctx.requireAsync()`를 사용합니다.

## 컨테이너 내 렌더링

`ctx.render()`를 사용하여 현재 컨테이너(`ctx.element`)에 콘텐츠를 렌더링하며, 다음 세 가지 형식을 지원합니다:

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

## 전역 변수

- `window`
- `document`
- `navigator`
- `ctx`