:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/interface-builder/fields/specific/js-item)을 참조하세요.
:::

# JS 아이템

## 소개

JS 아이템은 양식 내의 "사용자 정의 항목"(필드 바인딩 아님)에 사용됩니다. JavaScript/JSX를 사용하여 임의의 콘텐츠(팁, 통계, 미리보기, 버튼 등)를 렌더링하고 양식, 레코드 컨텍스트와 상호작용할 수 있으며, 실시간 미리보기, 설명 팁, 소형 인터랙티브 컴포넌트 등의 시나리오에 적합합니다.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## 런타임 컨텍스트 API (자주 사용됨)

- `ctx.element`: 현재 항목의 DOM 컨테이너(ElementProxy)이며, `innerHTML`, `querySelector`, `addEventListener` 등을 지원합니다.
- `ctx.form`: AntD Form 인스턴스이며, `getFieldValue / getFieldsValue / setFieldsValue / validateFields` 등을 수행할 수 있습니다.
- `ctx.blockModel`: 소속된 양식 블록 모델이며, `formValuesChange`를 수신하여 연동을 구현할 수 있습니다.
- `ctx.record` / `ctx.collection`: 현재 레코드와 컬렉션 메타 정보입니다(일부 시나리오에서 사용 가능).
- `ctx.requireAsync(url)`: URL에 따라 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
- `ctx.importAsync(url)`: URL에 따라 ESM 모듈을 동적으로 임포트합니다.
- `ctx.openView(viewUid, options)`: 구성된 뷰(서랍/대화 상자/페이지)를 엽니다.
- `ctx.message` / `ctx.notification`: 전역 메시지 및 알림입니다.
- `ctx.t()` / `ctx.i18n.t()`: 국제화입니다.
- `ctx.onRefReady(ctx.ref, cb)`: 컨테이너가 준비된 후 렌더링합니다.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`: 내장된 React / ReactDOM / Ant Design / Ant Design 아이콘 / dayjs / lodash / math.js / formula.js 등 공통 라이브러리가 포함되어 있으며, JSX 렌더링, 시간 처리, 데이터 조작 및 수학 연산에 사용됩니다. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd`는 호환성을 위해 여전히 유지됩니다.)
- `ctx.render(vnode)`: React 요소/HTML/DOM을 기본 컨테이너 `ctx.element`에 렌더링합니다. 여러 번 렌더링하면 Root를 재사용하고 컨테이너의 기존 내용을 덮어씁니다.

## 에디터 및 스니펫

- `Snippets`: 내장 코드 스니펫 목록을 열어 검색하고 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
- `Run`: 현재 코드를 직접 실행하고 실행 로그를 하단 `Logs` 패널에 출력합니다. `console.log/info/warn/error` 및 오류 하이라이트 위치 지정을 지원합니다.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- AI 직원과 결합하여 스크립트를 생성/수정할 수 있습니다: [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/features/built-in-employee)

## 일반적인 사용법 (精简示例)

### 1) 실시간 미리보기 (양식 값 읽기)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('Payable:')} ¥{(final || 0).toFixed(2)}</div>
    </div>
  );
};
render();
ctx.blockModel?.on?.('formValuesChange', () => render());
```

### 2) 뷰 열기 (서랍)

```js
ctx.render(
  <a onClick={async () => {
    const popupUid = ctx.model.uid + '-preview';
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Preview'), size: 'large' });
  }}>
    {ctx.t('Open preview')}
  </a>
);
```

### 3) 외부 라이브러리 로드 및 렌더링

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.form.getFieldValue('title') ?? ''))}</span>);
```

## 주의사항

- 외부 라이브러리 로드는 신뢰할 수 있는 CDN을 사용하는 것이 권장되며, 실패 시나리오에 대한 대비(예: `if (!lib) return;`)를 해야 합니다.
- 선택기는 `class` 또는 `[name=...]`를 우선적으로 사용하고, 여러 블록/팝업에서 `id`가 중복되는 것을 방지하기 위해 고정된 `id` 사용은 피하는 것이 좋습니다.
- 이벤트 정리: 양식 값이 빈번하게 변경되면 여러 번 렌더링이 트리거되므로, 이벤트를 바인딩하기 전에 정리하거나 중복을 제거해야 합니다(예: 먼저 `remove` 후 `add`, 또는 `{ once: true }`, 또는 `dataset` 마킹으로 중복 방지).

## 관련 문서

- [변수 및 컨텍스트](/interface-builder/variables)
- [연동 규칙](/interface-builder/linkage-rule)
- [뷰 및 팝업](/interface-builder/actions/types/view)