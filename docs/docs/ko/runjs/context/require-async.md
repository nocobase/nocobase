:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/require-async)을 참조하세요.
:::

# ctx.requireAsync()

URL을 통해 **UMD/AMD** 또는 전역(global)으로 마운트된 스크립트를 비동기적으로 로드하며, **CSS**도 로드할 수 있습니다. ECharts, Chart.js, FullCalendar(UMD 버전), jQuery 플러그인 등 UMD/AMD 라이브러리를 사용해야 하는 RunJS 시나리오에 적합합니다. `.css` 주소를 전달하면 스타일을 로드하고 주입합니다. 라이브러리가 ESM 버전도 제공하는 경우 [ctx.importAsync()](./import-async.md)를 우선적으로 사용하십시오.

## 적용 시나리오

JSBlock, JSField, JSItem, JSColumn, 워크플로우, JSAction 등 RunJS에서 UMD/AMD/global 스크립트나 CSS를 필요에 따라 로드해야 하는 모든 시나리오에서 사용할 수 있습니다. 전형적인 용도: ECharts 차트, Chart.js, FullCalendar(UMD), dayjs(UMD), jQuery 플러그인 등.

## 타입 정의

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

## 매개변수

| 매개변수 | 타입 | 설명 |
|----------|------|------|
| `url` | `string` | 스크립트 또는 CSS 주소입니다. **단축 경로** `<패키지명>@<버전>/<파일 경로>`(ESM CDN을 통해 해석될 때 원본 UMD 파일을 가져오기 위해 `?raw`가 추가됨) 또는 **전체 URL**을 지원합니다. `.css`를 전달하면 스타일을 로드하고 주입합니다. |

## 반환값

- 로드된 라이브러리 객체(UMD/AMD 콜백의 첫 번째 모듈 값)입니다. 많은 UMD 라이브러리는 `window`에 직접 할당되므로(예: `window.echarts`), 반환값이 `undefined`일 수 있습니다. 실제 사용 시에는 라이브러리 문서에 따라 전역 변수에 접근하면 됩니다.
- `.css`를 전달한 경우 `loadCSS`의 결과를 반환합니다.

## URL 형식 설명

- **단축 경로**: 예: `echarts@5/dist/echarts.min.js`. 기본 ESM CDN(esm.sh) 환경에서는 `https://esm.sh/echarts@5/dist/echarts.min.js?raw`를 요청합니다. `?raw`는 ESM 래퍼가 아닌 원본 UMD 파일을 가져오는 데 사용됩니다.
- **전체 URL**: `https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js`와 같이 임의의 CDN 주소를 직접 작성할 수 있습니다.
- **CSS**: `.css`로 끝나는 URL을 전달하면 페이지에 스타일을 로드하고 주입합니다.

## ctx.importAsync()와의 차이점

- **ctx.requireAsync()**: **UMD/AMD/global** 스크립트를 로드합니다. ECharts, Chart.js, FullCalendar(UMD), jQuery 플러그인 등에 적합합니다. 로드 후 라이브러리가 보통 `window`에 할당되며, 반환값은 라이브러리 객체이거나 `undefined`일 수 있습니다.
- **ctx.importAsync()**: **ESM 모듈**을 로드하고 모듈 네임스페이스를 반환합니다. 라이브러리가 ESM을 동시에 제공한다면 더 나은 모듈 시맨틱과 Tree-shaking을 위해 `ctx.importAsync()`를 우선 사용하십시오.

## 예시

### 기본 사용법

```javascript
// 단축 경로 (ESM CDN을 통해 ...?raw로 해석됨)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 전체 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');

// CSS 로드 및 페이지 주입
await ctx.requireAsync('https://cdn.example.com/theme.css');
```

### ECharts 차트

```javascript
const container = document.createElement('div');
container.style.height = '400px';
container.style.width = '100%';
ctx.render(container);

const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');
if (!echarts) throw new Error('ECharts library not loaded');

const chart = echarts.init(container);
chart.setOption({
  title: { text: ctx.t('판매 개요') },
  series: [{ type: 'pie', data: [{ value: 1, name: ctx.t('A') }] }],
});
chart.resize();
```

### Chart.js 막대 그래프

```javascript
async function renderChart() {
  const loaded = await ctx.requireAsync('chart.js@4.4.0/dist/chart.umd.min.js');
  const Chart = loaded?.Chart || loaded?.default?.Chart || loaded?.default;
  if (!Chart) throw new Error('Chart.js not loaded');

  const container = document.createElement('canvas');
  ctx.render(container);

  new Chart(container, {
    type: 'bar',
    data: {
      labels: ['A', 'B', 'C'],
      datasets: [{ label: ctx.t('수량'), data: [12, 19, 3] }],
    },
  });
}
await renderChart();
```

### dayjs (UMD)

```javascript
const dayjs = await ctx.requireAsync('dayjs@1/dayjs.min.js');
console.log(dayjs?.default || dayjs);
```

## 주의사항

- **반환값 형태**: UMD 라이브러리의 내보내기 방식은 다양하므로 반환값이 라이브러리 객체일 수도 있고 `undefined`일 수도 있습니다. `undefined`인 경우 라이브러리 문서에 따라 `window`에서 접근하십시오.
- **네트워크 의존성**: CDN 접근이 필요합니다. 내부망 환경에서는 **ESM_CDN_BASE_URL**을 통해 자체 구축된 서비스를 가리키도록 설정할 수 있습니다.
- **importAsync와의 선택**: 라이브러리가 ESM과 UMD를 모두 제공하는 경우 `ctx.importAsync()`를 우선 사용하십시오.

## 관련 정보

- [ctx.importAsync()](./import-async.md) - ESM 모듈 로드, Vue, dayjs(ESM) 등에 적합
- [ctx.render()](./render.md) - 차트 등을 컨테이너에 렌더링
- [ctx.libs](./libs.md) - React, antd, dayjs 등이 내장되어 있어 비동기 로드가 필요 없음