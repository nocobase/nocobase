:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/libs)을 참조하세요.
:::

# ctx.libs

`ctx.libs`는 RunJS 내장 라이브러리의 통합 네임스페이스이며, React, Ant Design, dayjs, lodash 등 자주 사용되는 라이브러리를 포함하고 있습니다. **`import`나 비동기 로드가 필요 없으며**, `ctx.libs.xxx`를 통해 직접 사용할 수 있습니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField / JSItem / JSColumn** | React + Ant Design을 사용하여 UI를 렌더링하고, dayjs로 날짜를 처리하며, lodash로 데이터를 처리합니다. |
| **공식 / 계산** | formula 또는 math를 사용하여 Excel 스타일의 공식이나 수학 표현식을 연산합니다. |
| **이벤트 흐름 / 연동 규칙** | 순수 로직 시나리오에서 lodash, dayjs, formula 등의 유틸리티 라이브러리를 호출합니다. |

## 내장 라이브러리 목록

| 속성 | 설명 | 문서 |
|------|------|------|
| `ctx.libs.React` | React 본체, JSX 및 Hooks 사용 시 필요 | [React](https://react.dev/) |
| `ctx.libs.ReactDOM` | ReactDOM 클라이언트 API (`createRoot` 포함), React와 함께 렌더링 시 사용 | [React DOM](https://react.dev/reference/react-dom) |
| `ctx.libs.antd` | Ant Design 컴포넌트 라이브러리 (Button, Card, Table, Form, Input, Modal 등) | [Ant Design](https://ant.design/components/overview/) |
| `ctx.libs.antdIcons` | Ant Design 아이콘 라이브러리 (예: PlusOutlined, UserOutlined) | [@ant-design/icons](https://ant.design/components/icon/) |
| `ctx.libs.dayjs` | 날짜 및 시간 유틸리티 라이브러리 | [dayjs](https://day.js.org/) |
| `ctx.libs.lodash` | 유틸리티 라이브러리 (get, set, debounce 등) | [Lodash](https://lodash.com/docs/) |
| `ctx.libs.formula` | Excel 스타일 공식 함수 라이브러리 (SUM, AVERAGE, IF 등) | [Formula.js](https://formulajs.info/functions/) |
| `ctx.libs.math` | 수학 표현식 및 계산 라이브러리 | [Math.js](https://mathjs.org/docs/) |

## 최상위 별칭(Alias)

기존 코드와의 호환성을 위해 일부 라이브러리는 `ctx.React`, `ctx.ReactDOM`, `ctx.antd`, `ctx.dayjs`와 같이 최상위 레벨에도 노출되어 있습니다. 유지보수 및 문서 검색의 편의를 위해 **`ctx.libs.xxx` 형식을 통일해서 사용하는 것을 권장합니다.**

## 지연 로딩 (Lazy Loading)

`lodash`, `formula`, `math` 등은 **지연 로딩** 방식을 사용합니다. `ctx.libs.lodash`에 처음 접근할 때 동적 import가 발생하며, 이후에는 캐시된 인스턴스를 재사용합니다. `React`, `antd`, `dayjs`, `antdIcons`는 컨텍스트에 미리 설정되어 있어 즉시 사용할 수 있습니다.

## 예시

### React와 Ant Design 렌더링

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title="제목">
    <Button type="primary">클릭</Button>
  </Card>
);
```

### Hooks 사용

```tsx
const { React } = ctx.libs;
const { useState } = React;
const { Button } = ctx.libs.antd;

const App = () => {
  const [count, setCount] = useState(0);
  return <Button onClick={() => setCount((c) => c + 1)}>{count}</Button>;
};
ctx.render(<App />);
```

### 아이콘 사용

```tsx
const { Button } = ctx.libs.antd;
const { UserOutlined, HeartOutlined } = ctx.libs.antdIcons;

ctx.render(<Button icon={<UserOutlined />}>사용자</Button>);
```

### dayjs 날짜 처리

```ts
const now = ctx.libs.dayjs();
const formatted = now.format('YYYY-MM-DD HH:mm:ss');
ctx.message.info(formatted);
```

### lodash 유틸리티 함수

```ts
const user = { profile: { name: 'Alice' } };
const name = ctx.libs.lodash.get(user, 'profile.name', 'Unknown');
```

### formula 공식 계산

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

### math 수학 표현식

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

## 주의사항

- **ctx.importAsync와 혼용 시**: `ctx.importAsync('react@19')`를 통해 외부 React를 로드한 경우, JSX는 해당 인스턴스를 사용합니다. 이때 **`ctx.libs.antd`와 혼용하지 마십시오.** antd는 해당 React 버전과 호환되는 버전을 함께 로드해야 합니다 (예: `ctx.importAsync('antd@5.x')`, `ctx.importAsync('@ant-design/icons@5.x')`).
- **다중 React 인스턴스**: "Invalid hook call"이 발생하거나 hook dispatcher가 null인 경우, 대개 여러 개의 React 인스턴스가 존재하기 때문입니다. `ctx.libs.React`를 읽거나 Hooks를 호출하기 전에 `await ctx.importAsync('react@버전')`을 먼저 실행하여 페이지와 동일한 React 인스턴스를 공유하도록 하십시오.

## 관련 문서

- [ctx.importAsync()](./import-async.md) - 외부 ESM 모듈(특정 버전의 React, Vue 등)을 필요에 따라 로드
- [ctx.render()](./render.md) - 컨테이너에 콘텐츠 렌더링