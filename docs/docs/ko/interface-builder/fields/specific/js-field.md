:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS Field

## 소개

JS Field는 필드 위치에서 JavaScript를 사용하여 콘텐츠를 사용자 정의 렌더링하는 데 사용됩니다. 주로 상세 블록, 폼의 읽기 전용 항목, 또는 테이블 컬럼의 "기타 사용자 정의 항목"에서 찾아볼 수 있습니다. 개인화된 표시, 파생 정보 조합, 상태 배지, 리치 텍스트 또는 차트 등을 렌더링하는 데 적합합니다.

![jsfield-readonly-add-20251029](https://static-docs.nocobase.com/jsfield-readonly-add-20251029.png)

## 타입

-   **읽기 전용**: 편집할 수 없는 표시를 위해 사용되며, `ctx.value`를 읽어 출력을 렌더링합니다.
-   **편집 가능**: 사용자 정의 입력 상호작용을 위해 사용됩니다. `ctx.getValue()`/`ctx.setValue(v)`와 컨테이너 이벤트 `js-field:value-change`를 제공하여 폼 값과의 양방향 동기화를 용이하게 합니다.

## 사용 시나리오

-   **읽기 전용**
    -   **상세 블록**: 계산 결과, 상태 배지, 리치 텍스트 스니펫, 차트 등 읽기 전용 콘텐츠를 표시합니다.
    -   **테이블 블록**: "기타 사용자 정의 컬럼 > JS Field"로 사용되어 읽기 전용으로 표시됩니다 (필드에 바인딩되지 않은 컬럼이 필요한 경우 JS Column을 사용하십시오).

-   **편집 가능**
    -   **폼 블록 (CreateForm/EditForm)**: 사용자 정의 입력 컨트롤 또는 복합 입력을 위해 사용되며, 폼 유효성 검사 및 제출과 함께 작동합니다.
    -   **적합한 시나리오**: 외부 라이브러리 입력 컴포넌트, 리치 텍스트/코드 편집기, 복잡한 동적 컴포넌트 등.

## 런타임 컨텍스트 API

JS Field 런타임 코드는 다음 컨텍스트 기능을 직접 사용할 수 있습니다.

-   `ctx.element`: 필드의 DOM 컨테이너 (ElementProxy)이며, `innerHTML`, `querySelector`, `addEventListener` 등을 지원합니다.
-   `ctx.value`: 현재 필드 값 (읽기 전용).
-   `ctx.record`: 현재 레코드 객체 (읽기 전용).
-   `ctx.collection`: 필드가 속한 컬렉션의 메타 정보 (읽기 전용).
-   `ctx.requireAsync(url)`: URL을 통해 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
-   `ctx.importAsync(url)`: URL을 통해 ESM 모듈을 동적으로 임포트합니다.
-   `ctx.openView(options)`: 구성된 뷰 (팝업/드로어/페이지)를 엽니다.
-   `ctx.i18n.t()` / `ctx.t()`: 국제화.
-   `ctx.onRefReady(ctx.ref, cb)`: 컨테이너가 준비된 후 렌더링합니다.
-   `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX 렌더링 및 시간 처리를 위한 내장 React / ReactDOM / Ant Design / Ant Design 아이콘 / dayjs 등 범용 라이브러리입니다. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd`는 호환성을 위해 유지됩니다.)
-   `ctx.render(vnode)`: React 엘리먼트, HTML 문자열 또는 DOM 노드를 기본 컨테이너 `ctx.element`에 렌더링합니다. 반복 렌더링 시 Root를 재사용하고 컨테이너의 기존 내용을 덮어씁니다.

**편집 가능 타입 (JSEditableField)에만 해당:**

-   `ctx.getValue()`: 현재 폼 값을 가져옵니다 (폼 상태를 우선 사용하고, 필드 props로 폴백합니다).
-   `ctx.setValue(v)`: 폼 값과 필드 props를 설정하여 양방향 동기화를 유지합니다.
-   컨테이너 이벤트 `js-field:value-change`: 외부 값이 변경될 때 트리거되어 스크립트가 입력 표시를 업데이트하기 용이하게 합니다.

## 편집기 및 스니펫

JS Field 스크립트 편집기는 구문 강조, 오류 힌트 및 내장 코드 스니펫(Snippets)을 지원합니다.

-   `Snippets`: 내장 코드 스니펫 목록을 열고, 검색하여 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
-   `Run`: 현재 코드를 직접 실행합니다. 실행 로그는 하단의 `Logs` 패널에 출력되며, `console.log/info/warn/error` 및 오류 하이라이트 위치 지정을 지원합니다.

![jsfield-readonly-toolbars-20251029](https://static-docs.nocobase.com/jsfield-readonly-toolbars-20251029.png)

AI 직원과 함께 코드를 생성할 수 있습니다.

-   [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/built-in/ai-coding)

## 일반적인 사용법

### 1) 기본 렌더링 (필드 값 읽기)

```js
ctx.render(<span className="nb-js-field">{String(ctx.value ?? '')}</span>);
```

### 2) JSX를 사용하여 React 컴포넌트 렌더링

```js
const { Tag } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={ctx.value ? 'green' : 'default'}>{String(ctx.value ?? '')}</Tag>
  </div>
);
```

### 3) 서드파티 라이브러리 로드 (AMD/UMD 또는 ESM)

```js
// AMD/UMD
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
ctx.render(<span>{dayjs().format('YYYY-MM-DD HH:mm')}</span>);

// ESM
const { default: he } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/he/+esm');
ctx.render(<span>{he.encode(String(ctx.value ?? ''))}</span>);
```

### 4) 클릭하여 팝업/드로어 열기 (openView)

```js
ctx.element.innerHTML = `<a class="open-detail">상세 보기</a>`;
const a = ctx.element.querySelector('.open-detail');
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
a?.addEventListener('click', async () => {
  await ctx.openView('target-view-uid', {
    navigation: false,
    mode: 'drawer',
    dataSourceKey: ctx.collection?.dataSourceKey,
    collectionName: ctx.collection?.name,
    filterByTk: tk,
  });
});
```

### 5) 편집 가능한 입력 (JSEditableFieldModel)

```js
// JSX를 사용하여 간단한 입력을 렌더링하고 폼 값을 동기화합니다.
function InputView() {
  return (
    <input
      className="nb-js-editable"
      style={{ width: '100%', padding: '4px 8px' }}
      defaultValue={String(ctx.getValue() ?? '')}
      onInput={(e) => ctx.setValue(e.currentTarget.value)}
    />
  );
}

// 외부 값 변경 시 입력에 동기화 (선택 사항)
ctx.element.addEventListener('js-field:value-change', (ev) => {
  const el = ctx.element.querySelector('.nb-js-editable');
  if (el) el.value = ev.detail ?? '';
});

ctx.render(<InputView />);
```

## 주의사항

-   외부 라이브러리 로드 시 신뢰할 수 있는 CDN을 사용하는 것이 좋으며, 실패 시나리오에 대비한 폴백(예: `if (!lib) return;`)을 마련해야 합니다.
-   셀렉터는 `class` 또는 `[name=...]`를 우선 사용하는 것이 좋으며, 고정된 `id` 사용은 여러 블록/팝업에서 `id` 중복을 방지하기 위해 피해야 합니다.
-   이벤트 정리: 필드는 데이터 변경 또는 뷰 전환으로 인해 여러 번 다시 렌더링될 수 있으므로, 이벤트를 바인딩하기 전에 정리하거나 중복을 제거하여 반복 트리거를 방지해야 합니다. "먼저 remove한 다음 add"하는 방식을 사용할 수 있습니다.