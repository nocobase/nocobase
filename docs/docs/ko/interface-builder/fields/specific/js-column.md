:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS Column

## 소개

JS Column은 테이블의 "사용자 정의 열"로 사용되며, JavaScript를 통해 각 행의 셀 내용을 렌더링합니다. 특정 필드에 묶이지 않아 파생 열, 여러 필드를 조합한 표시, 상태 배지, 버튼 작업, 원격 데이터 집계 등 다양한 시나리오에 활용할 수 있습니다.

![jscolumn-add-20251029](https://static-docs.nocobase.com/jscolumn-add-20251029.png)

## 런타임 컨텍스트 API

JS Column의 각 셀을 렌더링할 때 다음 컨텍스트 API를 사용할 수 있습니다.

- `ctx.element`: 현재 셀의 DOM 컨테이너(ElementProxy)입니다. `innerHTML`, `querySelector`, `addEventListener` 등을 지원합니다.
- `ctx.record`: 현재 행의 레코드 객체(읽기 전용)입니다.
- `ctx.recordIndex`: 현재 페이지 내의 행 인덱스(0부터 시작하며, 페이지네이션의 영향을 받을 수 있습니다).
- `ctx.collection`: 테이블에 바인딩된 **컬렉션**의 메타 정보(읽기 전용)입니다.
- `ctx.requireAsync(url)`: URL을 통해 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
- `ctx.importAsync(url)`: URL을 통해 ESM 모듈을 동적으로 임포트합니다.
- `ctx.openView(options)`: 설정된 뷰(모달/드로어/페이지)를 엽니다.
- `ctx.i18n.t()` / `ctx.t()`: 국제화 기능을 제공합니다.
- `ctx.onRefReady(ctx.ref, cb)`: 컨테이너가 준비된 후에 렌더링합니다.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX 렌더링 및 시간 처리를 위한 내장 React, ReactDOM, Ant Design, Ant Design 아이콘, dayjs 등 범용 라이브러리입니다. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd`는 호환성을 위해 유지됩니다.)
- `ctx.render(vnode)`: React 엘리먼트/HTML/DOM을 기본 컨테이너인 `ctx.element`(현재 셀)에 렌더링합니다. 여러 번 렌더링할 경우 Root를 재사용하며 컨테이너의 기존 내용을 덮어씁니다.

## 에디터와 스니펫

JS Column의 스크립트 에디터는 문법 강조, 오류 알림 및 내장 코드 스니펫을 지원합니다.

- `Snippets`: 내장 코드 스니펫 목록을 열어 검색하고 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
- `Run`: 현재 코드를 직접 실행합니다. 실행 로그는 하단의 `Logs` 패널에 출력되며, `console.log/info/warn/error` 및 오류 하이라이팅을 지원합니다.

![jscolumn-toolbars-20251029](https://static-docs.nocobase.com/jscolumn-toolbars-20251029.png)

AI 직원을 활용하여 코드를 생성할 수도 있습니다.

- [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/built-in/ai-coding)

## 일반적인 사용법

### 1) 기초 렌더링 (현재 행 레코드 읽기)

```js
ctx.render(<span className="nb-js-col-name">{ctx.record?.name ?? '-'}</span>);
```

### 2) JSX를 사용하여 React 컴포넌트 렌더링

```js
const { Tag } = ctx.libs.antd;
const status = ctx.record?.status ?? 'unknown';
const color = status === 'active' ? 'green' : status === 'blocked' ? 'red' : 'default';
ctx.render(
  <div style={{ padding: 4 }}>
    <Tag color={color}>{String(status)}</Tag>
  </div>
);
```

### 3) 셀에서 모달/드로어 열기 (보기/편집)

```js
const tk = ctx.collection?.getFilterByTK?.(ctx.record);
ctx.render(
  <a onClick={async () => {
    await ctx.openView('target-view-uid', {
      navigation: false,
      mode: 'drawer',
      dataSourceKey: ctx.collection?.dataSourceKey,
      collectionName: ctx.collection?.name,
      filterByTk: tk,
    });
  }}>보기</a>
);
```

### 4) 서드파티 라이브러리 로드 (AMD/UMD 또는 ESM)

```js
// AMD/UMD
const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const items = _.take(Object.keys(ctx.record || {}), 3);
ctx.render(<code>{items.join(', ')}</code>);

// ESM
const { default: dayjs } = await ctx.importAsync('https://cdn.jsdelivr.net/npm/dayjs/+esm');
ctx.render(<span>{dayjs().format('YYYY-MM-DD')}</span>);
```

## 주의사항

- 외부 라이브러리 로드 시에는 신뢰할 수 있는 CDN을 사용하는 것이 좋으며, 실패 상황에 대비한 대체 로직(예: `if (!lib) return;`)을 마련해야 합니다.
- 셀렉터는 여러 블록이나 모달에서 `id` 중복을 방지하기 위해 고정된 `id` 대신 `class` 또는 `[name=...]`를 우선적으로 사용하는 것이 좋습니다.
- 이벤트 정리: 테이블 행은 페이지네이션이나 새로고침에 따라 동적으로 변경될 수 있으며, 이로 인해 셀이 여러 번 렌더링될 수 있습니다. 이벤트 바인딩 전에 중복 트리거를 피하기 위해 이벤트 리스너를 정리하거나 중복을 제거해야 합니다.
- 성능 팁: 각 셀에서 대규모 라이브러리를 반복적으로 로드하는 것을 피해야 합니다. 대신, 상위 레벨(예: 전역 변수 또는 테이블 레벨 변수)에 라이브러리를 캐시한 후 재사용하는 것이 좋습니다.