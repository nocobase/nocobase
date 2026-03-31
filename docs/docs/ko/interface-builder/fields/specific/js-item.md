:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS 아이템

## 소개

JS 아이템은 폼에서 "사용자 정의 항목"(필드에 바인딩되지 않음)으로 사용됩니다. JavaScript/JSX를 사용하여 팁, 통계, 미리보기, 버튼 등 어떤 내용이든 렌더링할 수 있으며, 폼 및 레코드 컨텍스트와 상호작용할 수 있습니다. 실시간 미리보기, 설명 팁, 작은 인터랙티브 컴포넌트와 같은 시나리오에 적합합니다.

![jsitem-add-20251929](https://static-docs.nocobase.com/jsitem-add-20251929.png)

## 런타임 컨텍스트 API (자주 사용됨)

- `ctx.element`: 현재 항목의 DOM 컨테이너(ElementProxy)입니다. `innerHTML`, `querySelector`, `addEventListener` 등을 지원합니다.
- `ctx.form`: AntD 폼 인스턴스로, `getFieldValue / getFieldsValue / setFieldsValue / validateFields` 등의 작업을 수행할 수 있습니다.
- `ctx.blockModel`: 해당 폼 블록의 모델입니다. `formValuesChange`를 수신하여 연동 기능을 구현할 수 있습니다.
- `ctx.record` / `ctx.collection`: 현재 레코드 및 컬렉션 메타 정보입니다 (일부 시나리오에서 사용 가능).
- `ctx.requireAsync(url)`: URL을 통해 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
- `ctx.importAsync(url)`: URL을 통해 ESM 모듈을 동적으로 임포트합니다.
- `ctx.openView(viewUid, options)`: 구성된 뷰(서랍/대화 상자/페이지)를 엽니다.
- `ctx.message` / `ctx.notification`: 전역 메시지 및 알림입니다.
- `ctx.t()` / `ctx.i18n.t()`: 국제화 기능입니다.
- `ctx.onRefReady(ctx.ref, cb)`: 컨테이너가 준비된 후 렌더링합니다.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX 렌더링 및 시간 처리에 사용되는 React, ReactDOM, Ant Design, Ant Design 아이콘, dayjs 등 내장된 범용 라이브러리입니다. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd`는 호환성을 위해 여전히 유지됩니다.)
- `ctx.render(vnode)`: React 엘리먼트/HTML/DOM을 기본 컨테이너인 `ctx.element`에 렌더링합니다. 여러 번 렌더링할 경우 Root를 재사용하고 컨테이너의 기존 내용을 덮어씁니다.

## 에디터 및 스니펫

- `Snippets`: 내장 코드 스니펫 목록을 열어 검색하고 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
- `Run`: 현재 코드를 직접 실행하고 실행 로그를 하단의 `Logs` 패널에 출력합니다. `console.log/info/warn/error` 및 오류 하이라이트 위치 지정을 지원합니다.

![jsitem-toolbars-20251029](https://static-docs.nocobase.com/jsitem-toolbars-20251029.png)

- AI 직원과 함께 스크립트를 생성/수정할 수 있습니다: [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/built-in/ai-coding)

## 일반적인 사용법 (간단한 예시)

### 1) 실시간 미리보기 (폼 값 읽기)

```js
const render = () => {
  const { price = 0, quantity = 1, discount = 0 } = ctx.form.getFieldsValue();
  const total = Number(price) * Number(quantity);
  const final = total * (1 - Number(discount || 0));
  ctx.render(
    <div style={{ padding: 8, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
      <div style={{ fontWeight: 600, color: '#389e0d' }}>{ctx.t('결제 금액:')} ¥{(final || 0).toFixed(2)}</div>
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
    await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('미리보기'), size: 'large' });
  }}>
    {ctx.t('미리보기 열기')}
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

- 외부 라이브러리 로드 시 신뢰할 수 있는 CDN을 사용하는 것이 좋습니다. 실패 시나리오에 대비하여 폴백(예: `if (!lib) return;`)을 준비해야 합니다.
- 셀렉터는 `class` 또는 `[name=...]`를 우선적으로 사용하는 것이 좋습니다. 여러 블록/팝업에서 `id`가 중복되는 것을 방지하기 위해 고정된 `id` 사용은 피해야 합니다.
- 이벤트 정리: 폼 값이 자주 변경되면 여러 번 렌더링이 트리거될 수 있습니다. 이벤트를 바인딩하기 전에 정리하거나 중복을 제거해야 합니다 (예: `remove` 후 `add`, `{ once: true }` 사용, 또는 `dataset` 속성으로 중복 방지).

## 관련 문서

- [변수 및 컨텍스트](/interface-builder/variables)
- [연동 규칙](/interface-builder/linkage-rule)
- [뷰 및 팝업](/interface-builder/actions/types/view)