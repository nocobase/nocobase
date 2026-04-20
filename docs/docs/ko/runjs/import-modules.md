:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/import-modules)을 참조하세요.
:::

# 모듈 가져오기

RunJS에서는 두 가지 유형의 모듈을 사용할 수 있습니다: **내장 모듈**(`ctx.libs`를 통해 직접 사용하며 import 불필요)과 **외부 모듈**(`ctx.importAsync()` 또는 `ctx.requireAsync()`를 통해 필요에 따라 로드).

---

## 내장 모듈 - ctx.libs (import 불필요)

RunJS에는 자주 사용되는 라이브러리가 내장되어 있어 `ctx.libs`를 통해 직접 액세스할 수 있으며, `import`나 비동기 로드가 **필요하지 않습니다**.

| 속성 | 설명 |
|------|------|
| **ctx.libs.React** | React 본체, JSX 및 Hooks용 |
| **ctx.libs.ReactDOM** | ReactDOM (`createRoot` 등이 필요한 경우 함께 사용 가능) |
| **ctx.libs.antd** | Ant Design 컴포넌트 라이브러리 |
| **ctx.libs.antdIcons** | Ant Design 아이콘 |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): 수학 표현식, 행렬 연산 등 |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): Excel 스타일 공식 (SUM, AVERAGE 등) |

### 예시: React와 antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>클릭</Button>);
```

### 예시: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// result === 14
```

### 예시: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## 외부 모듈

제3자(Third-party) 라이브러리가 필요한 경우, 모듈 형식에 따라 로드 방식을 선택합니다:

- **ESM 모듈** → `ctx.importAsync()` 사용
- **UMD/AMD 모듈** → `ctx.requireAsync()` 사용

---

### ESM 모듈 가져오기

**`ctx.importAsync()`**를 사용하여 URL별로 ESM 모듈을 동적으로 로드합니다. JS 블록, JS 필드, JS 작업 등의 시나리오에 적합합니다.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: ESM 모듈 주소입니다. `<패키지명>@<버전>` 또는 하위 경로가 포함된 `<패키지명>@<버전>/<파일 경로>`(예: `vue@3.4.0`, `lodash@4/lodash.js`)와 같은 약어 형식을 지원하며, 설정된 CDN 접두사가 붙습니다. 전체 URL도 지원합니다.
- **반환값**: 해석된 모듈 네임스페이스 객체입니다.

#### 기본값: https://esm.sh

별도로 설정하지 않으면 약어 형식은 **https://esm.sh**를 CDN 접두사로 사용합니다. 예:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// https://esm.sh/vue@3.4.0에서 로드하는 것과 동일합니다.
```

#### 자체 esm.sh 서비스 구축

내부 네트워크나 자체 CDN이 필요한 경우, esm.sh 프로토콜과 호환되는 서비스를 배포하고 환경 변수를 통해 지정할 수 있습니다:

- **ESM_CDN_BASE_URL**: ESM CDN 기본 주소 (기본값 `https://esm.sh`)
- **ESM_CDN_SUFFIX**: 선택적 접미사 (예: jsDelivr의 `/+esm`)

자체 서비스 구축은 다음을 참고하세요: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### UMD/AMD 모듈 가져오기

**`ctx.requireAsync()`**를 사용하여 URL별로 UMD/AMD 모듈 또는 전역 객체에 마운트되는 스크립트를 비동기적으로 로드합니다.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: 두 가지 형식을 지원합니다:
  - **약어 경로**: `<패키지명>@<버전>/<파일 경로>`로, `ctx.importAsync()`와 동일하게 현재 ESM CDN 설정에 따라 해석됩니다. 해석 시 `?raw`가 추가되어 해당 경로의 원본 파일(주로 UMD 빌드)을 직접 요청합니다. 예를 들어 `echarts@5/dist/echarts.min.js`는 실제로 `https://esm.sh/echarts@5/dist/echarts.min.js?raw`를 요청합니다(기본값으로 esm.sh를 사용할 때).
  - **전체 URL**: 임의의 CDN 전체 주소 (예: `https://cdn.jsdelivr.net/npm/xxx`).
- **반환값**: 로드된 라이브러리 객체 (구체적인 형식은 해당 라이브러리의 내보내기 방식에 따라 다름).

로드 후 많은 UMD 라이브러리가 전역 객체(예: `window.xxx`)에 할당되므로, 해당 라이브러리의 문서를 참고하여 사용하면 됩니다.

**예시**

```ts
// 약어 경로 (esm.sh를 통해 ...?raw로 해석됨)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// 전체 URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**주의**: 라이브러리가 ESM 버전을 함께 제공하는 경우, 더 나은 모듈 시맨틱과 트리 쉐이킹(Tree-shaking)을 위해 `ctx.importAsync()`를 우선적으로 사용하십시오.