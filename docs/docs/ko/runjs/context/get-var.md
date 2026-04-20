:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/get-var)을 참조하세요.
:::

# ctx.getVar()

현재 런타임 컨텍스트에서 변수 값을 **비동기**로 읽어옵니다. 변수 소스는 SQL 및 템플릿의 `{{ctx.xxx}}` 파싱 방식과 동일하며, 일반적으로 현재 사용자, 현재 레코드, 뷰 파라미터, 팝업 컨텍스트 등에서 가져옵니다.

## 사용 사례

| 시나리오 | 설명 |
|------|------|
| **JSBlock / JSField** | 렌더링이나 로직 판단을 위해 현재 레코드, 사용자, 리소스 등의 정보를 가져옵니다. |
| **연동 규칙 / 워크플로우** | 조건 판단을 위해 `ctx.record`, `ctx.formValues` 등을 읽어옵니다. |
| **공식 / 템플릿** | `{{ctx.xxx}}`와 동일한 변수 파싱 규칙을 사용합니다. |

## 타입 정의

```ts
getVar(path: string): Promise<any>;
```

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `path` | `string` | 변수 경로이며, **반드시 `ctx.`으로 시작해야 합니다.** 점 표기법(dot notation)과 배열 인덱스를 지원합니다. |

**반환값**: `Promise<any>`. `await`를 사용하여 파싱된 값을 가져와야 합니다. 변수가 존재하지 않으면 `undefined`를 반환합니다.

> `ctx.`으로 시작하지 않는 경로를 전달하면 오류가 발생합니다: `ctx.getVar(path) expects an expression starting with "ctx.", got: "..."`.

## 주요 변수 경로

| 경로 | 설명 |
|------|------|
| `ctx.record` | 현재 레코드 (폼/상세 블록이 레코드에 바인딩된 경우 사용 가능) |
| `ctx.record.id` | 현재 레코드 기본 키(PK) |
| `ctx.formValues` | 현재 폼 값 (연동 규칙, 워크플로우에서 자주 사용됩니다. 폼 시나리오에서는 실시간 읽기를 위해 `ctx.form.getFieldsValue()`를 우선 사용하십시오.) |
| `ctx.user` | 현재 로그인한 사용자 |
| `ctx.user.id` | 현재 사용자 ID |
| `ctx.user.nickname` | 현재 사용자 닉네임 |
| `ctx.user.roles.name` | 현재 사용자 역할 이름 (배열) |
| `ctx.popup.record` | 팝업 내 레코드 |
| `ctx.popup.record.id` | 팝업 내 레코드 기본 키 |
| `ctx.urlSearchParams` | URL 쿼리 파라미터 (`?key=value`에서 파싱됨) |
| `ctx.token` | 현재 API 토큰 |
| `ctx.role` | 현재 역할 |

## ctx.getVarInfos()

현재 컨텍스트에서 파싱 가능한 변수의 **구조 정보**(타입, 제목, 하위 속성 등)를 가져와 사용 가능한 경로를 쉽게 탐색할 수 있도록 합니다. 반환값은 `meta` 기반의 정적 설명이며, 실제 런타임 값은 포함하지 않습니다.

### 타입 정의

```ts
getVarInfos(options?: { path?: string | string[]; maxDepth?: number }): Promise<Record<string, any>>;
```

반환값의 각 키(key)는 변수 경로이며, 값(value)은 해당 경로에 대한 구조 정보(`type`, `title`, `properties` 등 포함)입니다.

### 파라미터

| 파라미터 | 타입 | 설명 |
|------|------|------|
| `path` | `string \| string[]` | 경로 필터링입니다. 해당 경로 하위의 변수 구조만 수집합니다. `'record'`, `'record.id'`, `'ctx.record'`, `'{{ ctx.record }}'`를 지원하며, 배열은 여러 경로의 병합을 의미합니다. |
| `maxDepth` | `number` | 최대 확장 깊이이며, 기본값은 `3`입니다. path를 전달하지 않으면 최상위 속성의 depth가 1이 되고, path를 전달하면 해당 경로의 노드 depth가 1이 됩니다. |

### 예제

```ts
// record 하위의 변수 구조 가져오기 (최대 3단계 확장)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });

// popup.record의 구조 가져오기
const vars = await ctx.getVarInfos({ path: 'popup.record', maxDepth: 3 });

// 전체 최상위 변수 구조 가져오기 (기본 maxDepth=3)
const vars = await ctx.getVarInfos();
```

## ctx.getValue와의 차이점

| 메서드 | 사용 사례 | 설명 |
|------|----------|------|
| `ctx.getValue()` | JSField, JSItem 등 편집 가능한 필드 | **현재 필드**의 값을 동기적으로 가져옵니다. 폼 바인딩이 필요합니다. |
| `ctx.getVar(path)` | 모든 RunJS 컨텍스트 | **임의의 ctx 변수**를 비동기적으로 가져옵니다. 경로는 반드시 `ctx.`으로 시작해야 합니다. |

JSField에서 현재 필드를 읽고 쓰려면 `getValue`/`setValue`를 사용하고, 다른 컨텍스트 변수(예: record, user, formValues)에 접근하려면 `getVar`를 사용합니다.

## 주의 사항

- **경로는 반드시 `ctx.`으로 시작해야 합니다**: 예: `ctx.record.id`. 그렇지 않으면 오류가 발생합니다.
- **비동기 메서드**: 반드시 `await`를 사용하여 결과를 가져와야 합니다. 예: `const id = await ctx.getVar('ctx.record.id')`.
- **변수가 존재하지 않는 경우**: `undefined`를 반환합니다. 결과 뒤에 `??`를 사용하여 기본값을 설정할 수 있습니다: `(await ctx.getVar('ctx.user.nickname')) ?? '방문자'`.
- **폼 값**: `ctx.formValues`는 `await ctx.getVar('ctx.formValues')`를 통해 가져와야 하며, `ctx.formValues`로 직접 노출되지 않습니다. 폼 컨텍스트에서는 최신 값을 실시간으로 읽기 위해 `ctx.form.getFieldsValue()`를 사용하는 것이 좋습니다.

## 예제

### 현재 레코드 ID 가져오기

```ts
const recordId = await ctx.getVar('ctx.record.id');
if (recordId) {
  ctx.message.info(`현재 레코드: ${recordId}`);
}
```

### 팝업 내 레코드 가져오기

```ts
const recordId = await ctx.getVar('ctx.popup.record.id');
if (recordId) {
  ctx.message.info(`현재 팝업 레코드: ${recordId}`);
}
```

### 배열 필드의 하위 항목 읽기

```ts
const roleNames = await ctx.getVar('ctx.user.roles.name');
// 역할 이름 배열 반환, 예: ['admin', 'member']
```

### 기본값 설정하기

```ts
// getVar에는 defaultValue 파라미터가 없으므로 결과 뒤에 ??를 사용합니다.
const userName = (await ctx.getVar('ctx.user.nickname')) ?? '방문자';
```

### 폼 필드 값 읽기

```ts
// ctx.formValues와 ctx.form은 모두 폼 시나리오에서 사용되며, getVar로 중첩된 필드를 읽을 수 있습니다.
const status = await ctx.getVar('ctx.formValues.status');
if (status === 'draft') {
  // ...
}
```

### URL 쿼리 파라미터 읽기

```ts
const id = await ctx.getVar('ctx.urlSearchParams.id'); // ?id=xxx 에 대응
```

### 사용 가능한 변수 탐색하기

```ts
// record 하위의 변수 구조 가져오기 (최대 3단계 확장)
const vars = await ctx.getVarInfos({ path: 'record', maxDepth: 3 });
// vars 형식: { 'record.id': { type: 'string', title: 'id' }, ... }
```

## 관련 정보

- [ctx.getValue()](./get-value.md) - 현재 필드 값을 동기적으로 가져오기 (JSField/JSItem 전용)
- [ctx.form](./form.md) - 폼 인스턴스, `ctx.form.getFieldsValue()`로 폼 값을 실시간으로 읽기 가능
- [ctx.model](./model.md) - 현재 실행 컨텍스트가 속한 모델
- [ctx.blockModel](./block-model.md) - 현재 JS가 위치한 부모 블록
- [ctx.resource](./resource.md) - 현재 컨텍스트의 리소스 인스턴스
- SQL / 템플릿의 `{{ctx.xxx}}` - `ctx.getVar('ctx.xxx')`와 동일한 파싱 규칙 사용지됨