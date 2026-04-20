:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/flow-engine/runjs-extension-points)을 참조하세요.
:::

# RunJS 플러그인 확장 포인트 (ctx 문서 / 스니펫 / 시나리오 매핑)

플러그인이 RunJS 기능을 추가하거나 확장할 때, **공식 확장 포인트**를 통해 "컨텍스트 매핑 / `ctx` 문서 / 예제 코드"를 함께 등록하는 것이 좋습니다. 이를 통해 다음과 같은 이점을 얻을 수 있습니다:

- CodeEditor에서 `ctx.xxx.yyy` 자동 완성이 가능해집니다.
- AI 코딩 시 구조화된 `ctx` API 레퍼런스 및 예제를 제공받을 수 있습니다.

이 장에서는 두 가지 확장 포인트를 소개합니다:

- `registerRunJSContextContribution(...)`
- `registerRunJSSnippet(...)`

## 1. `registerRunJSContextContribution`

RunJS의 "컨트리뷰션(contribution)"을 등록하는 데 사용됩니다. 주요 용도는 다음과 같습니다:

- `RunJSContextRegistry` 매핑 추가/덮어쓰기 (`modelClass` -> `RunJSContext`, `scenes` 포함)
- `FlowRunJSContext` 또는 사용자 정의 RunJSContext를 위한 `RunJSDocMeta` 확장 (`ctx` API의 설명/예제/완성 템플릿)

### 동작 설명

- 컨트리뷰션은 `setupRunJSContexts()` 단계에서 일괄 실행됩니다.
- 만약 `setupRunJSContexts()`가 이미 완료된 상태에서 **나중에 등록되면 즉시 한 번 실행**됩니다 (setup을 다시 실행할 필요 없음).
- 각 컨트리뷰션은 각 `RunJSVersion`에 대해 **최대 한 번만 실행**됩니다.

### 예제: JS 작성이 가능한 새로운 모델 컨텍스트 추가

```ts
import { registerRunJSContextContribution, FlowRunJSContext, RunJSContextRegistry } from '@nocobase/flow-engine';

registerRunJSContextContribution(({ version, FlowRunJSContext: BaseCtx, RunJSContextRegistry: Registry }) => {
  if (version !== 'v1') return;

  class MyPluginRunJSContext extends BaseCtx {}

  // 1) ctx 문서/자동 완성 (RunJSDocMeta)
  MyPluginRunJSContext.define({
    label: 'MyPlugin RunJS context',
    properties: {
      myPlugin: {
        description: 'My plugin namespace',
        detail: 'object',
        properties: {
          hello: {
            description: 'Say hello',
            detail: '(name: string) => string',
            completion: { insertText: `ctx.myPlugin.hello('World')` },
          },
        },
      },
    },
  });

  // 2) model -> context 매핑 (scene은 에디터 자동 완성/스니펫 필터링에 영향을 줌)
  Registry.register('v1', 'MyPluginJSModel', MyPluginRunJSContext, { scenes: ['block'] });
});
```

## 2. `registerRunJSSnippet`

RunJS의 예제 코드 스니펫(snippets)을 등록하는 데 사용되며, 다음 용도로 활용됩니다:

- CodeEditor 스니펫 자동 완성
- AI 코딩의 예제/참고 자료 (시나리오/버전/로케일에 따라 필터링 가능)

### 권장 ref 명명 규칙

다음과 같은 형식을 권장합니다: `plugin/<pluginName>/<topic>`, 예:

- `plugin/plugin-my/foo`
- `plugin/plugin-my/api-request-example`

코어의 `global/*`, `scene/*`와 충돌하지 않도록 주의하십시오.

### 충돌 전략

- 기본적으로 기존 `ref`를 덮어쓰지 않습니다 (에러를 발생시키지 않고 `false` 반환).
- 덮어쓰기가 필요한 경우 `{ override: true }`를 명시적으로 전달합니다.

### 예제: 스니펫 등록

```ts
import { registerRunJSSnippet } from '@nocobase/flow-engine';

registerRunJSSnippet('plugin/plugin-my/hello', async () => ({
  default: {
    label: 'Hello (My Plugin)',
    description: 'Minimal example for my plugin',
    prefix: 'my-hello',
    versions: ['v1'],
    scenes: ['block'],
    contexts: ['*'],
    content: `
// My plugin snippet
ctx.message.success('Hello from plugin');
`,
  },
}));
```

## 3. 베스트 프랙티스

- **문서 + 스니펫 계층적 유지보수**:
  - `RunJSDocMeta`: 설명/자동 완성 템플릿 (짧고 구조화된 형태)
  - 스니펫: 긴 예제 (재사용 가능, 시나리오/버전별 필터링 가능)
- **프롬프트 길이 최적화**: 예제는 너무 많지 않게 유지하며, "최소 실행 가능 템플릿" 위주로 구성하십시오.
- **시나리오 우선순위**: JS 코드가 주로 폼/테이블 등의 시나리오에서 실행된다면, 자동 완성 및 예제의 관련성을 높이기 위해 `scenes`를 정확히 입력하십시오.

## 4. 실제 ctx 기반 자동 완성 숨기기: `hidden(ctx)`

일부 `ctx` API는 특정 시나리오에서만 유효합니다 (예: `ctx.popup`은 팝업/서랍이 열려 있을 때만 사용 가능). 자동 완성 시 이러한 사용할 수 없는 API를 숨기려면 `RunJSDocMeta`의 해당 항목에 `hidden(ctx)`를 정의할 수 있습니다.

- `true` 반환: 현재 노드 및 하위 트리 숨김
- `string[]` 반환: 현재 노드 아래의 특정 하위 경로 숨김 (여러 경로 반환 가능, 상대 경로 기준, 접두사 매칭으로 하위 트리 숨김)

`hidden(ctx)`는 `async`를 지원합니다. `await ctx.getVar('ctx.xxx')`를 사용하여 판단할 수 있습니다. 가급적 빠르고 부작용이 없는 로직(네트워크 요청 지양)을 권장합니다.

예제: `popup.uid`가 존재할 때만 `ctx.popup.*` 자동 완성 표시

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => !(await ctx.getVar('ctx.popup'))?.uid,
      properties: {
        uid: 'Popup uid',
      },
    },
  },
});
```

예제: popup은 사용 가능하지만 일부 하위 경로만 숨김 (상대 경로만 사용, 예: `record`와 `parent.record` 숨김)

```ts
FlowRunJSContext.define({
  properties: {
    popup: {
      description: 'Popup context (async)',
      hidden: async (ctx) => {
        const popup = await ctx.getVar('ctx.popup');
        if (!popup?.uid) return true;
        const hidden: string[] = [];
        if (!popup?.record) hidden.push('record');
        if (!popup?.parent?.record) hidden.push('parent.record');
        return hidden;
      },
      properties: {
        uid: 'Popup uid',
        record: 'Popup record',
        parent: {
          properties: {
            record: 'Parent record',
          },
        },
      },
    },
  },
});
```

참고: CodeEditor는 항상 실제 `ctx`를 기반으로 자동 완성 필터링을 활성화합니다 (fail-open 방식, 에러 미발생).

## 5. 런타임 `info/meta` 및 컨텍스트 정보 API (자동 완성 및 대규모 언어 모델용)

`FlowRunJSContext.define()`을 통한 정적 문서 관리 외에도, 런타임에 `FlowContext.defineProperty/defineMethod`를 통해 **info/meta**를 주입할 수 있습니다. 또한 다음 API를 통해 CodeEditor나 AI 모델이 사용할 수 있는 **직렬화 가능한** 컨텍스트 정보를 출력할 수 있습니다.

- `await ctx.getApiInfos(options?)`: 정적 API 정보
- `await ctx.getVarInfos(options?)`: 변수 구조 정보 (`meta` 기반, path/maxDepth 전개 지원)
- `await ctx.getEnvInfos()`: 런타임 환경 스냅샷

### 5.1 `defineMethod(name, fn, info?)`

`info`에서 지원하는 필드 (모두 선택 사항):

- `description` / `detail` / `examples`
- `ref: string | { url: string; title?: string }`
- `params` / `returns` (JSDoc 스타일)

> 주의: `getApiInfos()` 출력은 정적 API 문서이므로 `deprecated` / `disabled` / `disabledReason` 등의 필드는 포함되지 않습니다.

예제: `ctx.refreshTargets()`에 문서 링크 제공

```ts
ctx.defineMethod('refreshTargets', async () => {
  // ...
}, {
  description: '대상 블록의 데이터를 새로고침합니다.',
  detail: '() => Promise<void>',
  ref: { url: 'https://docs.nocobase.com/', title: 'Docs' },
});
```

### 5.2 `defineProperty(key, { meta?, info? })`

- `meta`: 변수 선택기 UI (`getPropertyMetaTree` / `FlowContextSelector`)에서 사용되며, 표시 여부, 트리 구조, 비활성화 등을 결정합니다 (함수/async 지원).
  - 주요 필드: `title` / `type` / `properties` / `sort` / `hidden` / `disabled` / `disabledReason` / `buildVariablesParams`
- `info`: 정적 API 문서(`getApiInfos`) 및 AI 모델용 설명에 사용되며, 변수 선택기 UI에는 영향을 주지 않습니다 (함수/async 지원).
  - 주요 필드: `title` / `type` / `interface` / `description` / `examples` / `ref` / `params` / `returns`

`meta`만 제공되고 `info`가 제공되지 않은 경우:

- `getApiInfos()`는 해당 키를 반환하지 않습니다 (정적 API 문서는 `meta`에서 추론하지 않음).
- `getVarInfos()`는 `meta`를 기반으로 변수 구조를 구축합니다 (변수 선택기/동적 변수 트리용).

### 5.3 컨텍스트 정보 API

"사용 가능한 컨텍스트 기능 정보"를 출력하는 데 사용됩니다.

```ts
type FlowContextInfosEnvNode = {
  description?: string;
  getVar?: string; // await ctx.getVar(getVar)에 직접 사용 가능, "ctx."으로 시작하는 것을 권장
  value?: any; // 해석된 정적 값 (직렬화 가능, 추론 가능할 때만 반환)
  properties?: Record<string, FlowContextInfosEnvNode>;
};

type FlowContextApiInfos = Record<string, any>; // 정적 문서 (최상위 계층)
type FlowContextVarInfos = Record<string, any>; // 변수 구조 (path/maxDepth에 따라 전개 가능)
type FlowContextEnvInfos = {
  popup?: FlowContextInfosEnvNode;
  block?: FlowContextInfosEnvNode;
  flowModel?: FlowContextInfosEnvNode;
  resource?: FlowContextInfosEnvNode;
  record?: FlowContextInfosEnvNode;
  currentViewBlocks?: FlowContextInfosEnvNode;
};
```

주요 파라미터:

- `getApiInfos({ version })`: RunJS 문서 버전 (기본값 `v1`)
- `getVarInfos({ path, maxDepth })`: 필터링 및 최대 전개 깊이 (기본값 3)

참고: 위 API의 반환 결과에는 함수가 포함되지 않으므로 AI 모델에 직접 직렬화하여 전달하기에 적합합니다.

### 5.4 `await ctx.getVar(path)`

설정이나 사용자 입력으로부터 받은 "변수 경로 문자열"을 통해 해당 변수의 런타임 값을 직접 가져오고 싶을 때 `getVar`를 사용합니다.

- 예제: `const v = await ctx.getVar('ctx.record.roles.id')`
- `path`는 `ctx.`으로 시작하는 표현식 경로입니다 (예: `ctx.record.id` / `ctx.record.roles[0].id`).

추가 사항: 밑줄 `_`로 시작하는 메서드나 속성은 비공개 멤버로 간주되어 `getApiInfos()` 또는 `getVarInfos()`의 출력에 포함되지 않습니다.