:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS 블록

## 소개

JS 블록은 매우 유연한 '사용자 정의 렌더링 블록'입니다. JavaScript 스크립트를 직접 작성하여 인터페이스를 생성하고, 이벤트를 바인딩하며, 데이터 API를 호출하거나 서드파티 라이브러리를 통합할 수 있습니다. 이는 내장 블록으로는 구현하기 어려운 맞춤형 시각화, 임시 실험 및 경량 확장 시나리오에 적합합니다.

## 런타임 컨텍스트 API

JS 블록의 런타임 컨텍스트에는 자주 사용되는 기능들이 주입되어 있어 바로 사용할 수 있습니다.

- `ctx.element`: 블록의 DOM 컨테이너(ElementProxy로 안전하게 캡슐화됨)로, `innerHTML`, `querySelector`, `addEventListener` 등을 지원합니다.
- `ctx.requireAsync(url)`: URL을 통해 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
- `ctx.importAsync(url)`: URL을 통해 ESM 모듈을 동적으로 임포트합니다.
- `ctx.openView`: 구성된 뷰(팝업/드로어/페이지)를 엽니다.
- `ctx.useResource(...)` + `ctx.resource`: 리소스 방식으로 데이터에 접근합니다.
- `ctx.i18n.t()` / `ctx.t()`: 내장된 국제화 기능입니다.
- `ctx.onRefReady(ctx.ref, cb)`: 컨테이너가 준비된 후에 렌더링하여 타이밍 문제를 방지합니다.
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs`: JSX 렌더링 및 시간 처리를 위한 React, ReactDOM, Ant Design, Ant Design 아이콘, dayjs 등 내장된 범용 라이브러리입니다. (`ctx.React` / `ctx.ReactDOM` / `ctx.antd`는 호환성을 위해 여전히 유지됩니다.)
- `ctx.render(vnode)`: React 엘리먼트, HTML 문자열 또는 DOM 노드를 기본 컨테이너인 `ctx.element`에 렌더링합니다. 여러 번 호출해도 동일한 React Root를 재사용하며 컨테이너의 기존 내용을 덮어씁니다.

## 블록 추가

페이지 또는 팝업에 JS 블록을 추가할 수 있습니다.

![jsblock-add-20251029](https://static-docs.nocobase.com/jsblock-add-20251029.png)

## 에디터 및 스니펫

JS 블록의 스크립트 에디터는 구문 강조, 오류 힌트 및 내장 코드 스니펫(Snippets)을 지원하여 차트 렌더링, 버튼 이벤트 바인딩, 외부 라이브러리 로드, React/Vue 컴포넌트 렌더링, 타임라인, 정보 카드 등과 같은 일반적인 예시를 빠르게 삽입할 수 있습니다.

- `Snippets`: 내장 코드 스니펫 목록을 엽니다. 검색하여 선택한 스니펫을 코드 편집기의 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
- `Run`: 현재 에디터의 코드를 직접 실행하고, 실행 로그를 하단의 `Logs` 패널로 출력합니다. `console.log/info/warn/error` 표시를 지원하며, 오류는 강조 표시되고 특정 행과 열로 이동할 수 있습니다.

![jsblock-toolbars-20251029](https://static-docs.nocobase.com/jsblock-toolbars-20251029.png)

또한, 에디터 오른쪽 상단에서 AI 직원 "프런트엔드 엔지니어 · Nathan"을 직접 호출할 수 있습니다. Nathan은 현재 컨텍스트를 기반으로 스크립트를 작성하거나 수정하는 데 도움을 줄 수 있습니다. 그런 다음 한 번의 클릭으로 "Apply to editor"를 통해 에디터에 적용하고 코드를 실행하여 결과를 확인할 수 있습니다. 자세한 내용은 다음을 참조하십시오:

- [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/built-in/ai-coding)

## 런타임 환경 및 보안

- **컨테이너**: 시스템은 스크립트를 위해 안전한 DOM 컨테이너 `ctx.element`(ElementProxy)를 제공하며, 이는 현재 블록에만 영향을 미치고 페이지의 다른 영역을 방해하지 않습니다.
- **샌드박스**: 스크립트는 제어된 환경에서 실행됩니다. `window`/`document`/`navigator`는 안전한 프록시 객체를 사용하며, 일반적인 API는 사용 가능하지만 위험한 동작은 제한됩니다.
- **재렌더링**: 블록이 숨겨졌다가 다시 표시될 때 자동으로 재렌더링됩니다(초기 마운트 스크립트의 중복 실행 방지).

## 일반적인 사용법 (간략한 예시)

### 1) React (JSX) 렌더링

```js
const { Button } = ctx.libs.antd;
ctx.render(
  <div style={{ padding: 12 }}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Clicked!'))}>
      {ctx.t('Click')}
    </Button>
  </div>
);
```

### 2) API 요청 템플릿

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 3) ECharts 로드 및 렌더링

```js
const container = document.createElement('div');
container.style.height = '360px';
container.style.width = '100%';
ctx.element.replaceChildren(container);
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts not loaded');
const chart = echarts.init(container);
chart.setOption({ title: { text: ctx.t('ECharts') }, xAxis: {}, yAxis: {}, series: [{ type: 'bar', data: [5, 12, 9] }] });
chart.resize();
```

### 4) 뷰 열기 (드로어)

```js
const popupUid = ctx.model.uid + '-1';
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Sample drawer'), size: 'large' });
```

### 5) 리소스 읽기 및 JSON 렌더링

```js
const resource = ctx.createResource('SingleRecordResource');
resource.setDataSourceKey('main');
resource.setResourceName('users');
await resource.refresh();
ctx.render(`<pre style="padding:12px;background:#f5f5f5;border-radius:6px;">${JSON.stringify(resource.getData(), null, 2)}</pre>`);
```

## 주의사항

- 외부 라이브러리 로드 시 신뢰할 수 있는 CDN을 사용하는 것이 좋습니다.
- **선택자 사용 권장 사항**: `class` 또는 `[name=...]` 속성 선택자를 우선적으로 사용하십시오. 여러 블록/팝업에서 중복된 `id`로 인해 스타일 또는 이벤트 충돌이 발생할 수 있으므로 고정된 `id` 사용은 피하십시오.
- **이벤트 정리**: 블록은 여러 번 재렌더링될 수 있으므로, 이벤트 바인딩 전에 리스너를 정리하거나 중복을 제거하여 반복적인 트리거를 방지해야 합니다. "먼저 제거 후 추가" 방식, 일회성 리스너 또는 중복 방지 플래그를 사용할 수 있습니다.

## 관련 문서

- [변수 및 컨텍스트](/interface-builder/variables)
- [연동 규칙](/interface-builder/linkage-rule)
- [뷰 및 팝업](/interface-builder/actions/types/view)