:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS 액션

## 소개

JS 액션은 버튼 클릭 시 JavaScript를 실행하여 원하는 비즈니스 로직을 구현할 수 있도록 돕습니다. 폼 툴바, 테이블 툴바 (컬렉션 수준), 테이블 행 (레코드 수준) 등 다양한 위치에서 유효성 검사, 알림 표시, API 호출, 팝업/드로어 열기, 데이터 새로고침 등의 작업을 수행할 수 있습니다.

![jsaction-add-20251029](https://static-docs.nocobase.com/jsaction-add-20251029.png)

## 런타임 컨텍스트 API (자주 사용됨)

- `ctx.api.request(options)`: HTTP 요청을 보냅니다.
- `ctx.openView(viewUid, options)`: 설정된 뷰 (드로어/다이얼로그/페이지)를 엽니다.
- `ctx.message` / `ctx.notification`: 전역 메시지 및 알림을 표시합니다.
- `ctx.t()` / `ctx.i18n.t()`: 국제화를 처리합니다.
- `ctx.resource`: `getSelectedRows()` 및 `refresh()`와 같은 메서드를 포함하는 컬렉션 수준 컨텍스트의 데이터 리소스입니다 (예: 테이블 툴바).
- `ctx.record`: 레코드 수준 컨텍스트의 현재 행 레코드입니다 (예: 테이블 행 버튼).
- `ctx.form`: 폼 수준 컨텍스트의 AntD Form 인스턴스입니다 (예: 폼 툴바 버튼).
- `ctx.collection`: 현재 컬렉션의 메타 정보입니다.
- 코드 에디터는 `Snippets` (코드 조각) 및 `Run` (사전 실행)을 지원합니다 (아래 참조).

- `ctx.requireAsync(url)`: URL을 통해 AMD/UMD 라이브러리를 비동기적으로 로드합니다.
- `ctx.importAsync(url)`: URL을 통해 ESM 모듈을 동적으로 임포트합니다.

> 실제로 사용 가능한 변수는 버튼의 위치에 따라 달라질 수 있습니다. 위 목록은 일반적인 기능에 대한 개요입니다.

## 에디터 및 코드 조각

- `Snippets`: 내장된 코드 조각 목록을 열어 검색하고 현재 커서 위치에 한 번의 클릭으로 삽입할 수 있습니다.
- `Run`: 현재 코드를 직접 실행하고 실행 로그를 하단의 `Logs` 패널에 출력합니다. `console.log/info/warn/error`를 지원하며 오류 위치를 강조 표시합니다.

![jsaction-toolbars-20251029](https://static-docs.nocobase.com/jsaction-toolbars-20251029.png)

- AI 직원을 활용하여 스크립트를 생성/수정할 수 있습니다: [AI 직원 · Nathan: 프런트엔드 엔지니어](/ai-employees/built-in/ai-coding)

## 일반적인 사용법 (간단한 예시)

### 1) API 요청 및 알림

```js
const resp = await ctx.api.request({ url: 'users:list', method: 'get', params: { pageSize: 10 } });
ctx.message.success(ctx.t('Request finished'));
console.log(ctx.t('Response data:'), resp?.data);
```

### 2) 컬렉션 버튼: 선택 유효성 검사 및 처리

```js
const rows = ctx.resource?.getSelectedRows?.() || [];
if (!rows.length) {
  ctx.message.warning(ctx.t('Please select records'));
  return;
}
// TODO: Implement business logic...
ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
```

### 3) 레코드 버튼: 현재 행 레코드 읽기

```js
if (!ctx.record) {
  ctx.message.error(ctx.t('No record'));
} else {
  ctx.message.success(ctx.t('Record ID: {id}', { id: ctx.record.id }))
}
```

### 4) 뷰 열기 (드로어/다이얼로그)

```js
const popupUid = ctx.model.uid + '-open'; // 현재 버튼에 바인딩하여 안정성 유지
await ctx.openView(popupUid, { mode: 'drawer', title: ctx.t('Details'), size: 'large' });
```

### 5) 제출 후 데이터 새로고침

```js
// 일반적인 새로고침: 테이블/목록 리소스를 우선하고, 그 다음으로 폼이 포함된 블록의 리소스를 새로고침합니다.
if (ctx.resource?.refresh) await ctx.resource.refresh();
else if (ctx.blockModel?.resource?.refresh) await ctx.blockModel.resource.refresh();
```

## 주의사항

- **멱등성 동작**: 반복 클릭으로 인한 여러 번의 제출을 방지하려면 로직에 상태 플래그를 추가하거나 버튼을 비활성화할 수 있습니다.
- **오류 처리**: API 호출에 `try/catch` 블록을 추가하고 사용자에게 친숙한 피드백을 제공하십시오.
- **뷰 연동**: `ctx.openView`를 사용하여 팝업/드로어를 열 때, 명시적으로 매개변수를 전달하는 것이 좋습니다. 필요한 경우 제출 성공 후 상위 리소스를 직접 새로고침하십시오.

## 관련 문서

- [변수 및 컨텍스트](/interface-builder/variables)
- [연동 규칙](/interface-builder/linkage-rule)
- [뷰 및 팝업](/interface-builder/actions/types/view)