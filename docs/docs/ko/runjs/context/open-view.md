:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/open-view)을 참조하세요.
:::

# ctx.openView()

프로그래밍 방식으로 지정된 뷰(서랍, 팝업, 내장 페이지 등)를 엽니다. `FlowModelContext`에서 제공하며, `JSBlock`, 테이블 셀, 워크플로우 등의 시나리오에서 구성된 `ChildPage` 또는 `PopupAction` 뷰를 여는 데 사용됩니다.

## 적용 사례

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | 버튼 클릭 후 상세/편집 팝업을 열고, 현재 행의 `filterByTk`를 전달합니다. |
| **테이블 셀** | 셀 내에 버튼을 렌더링하고, 클릭 시 행 상세 팝업을 엽니다. |
| **이벤트 흐름 / JSAction** | 작업 성공 후 다음 뷰나 팝업을 엽니다. |
| **연관 필드** | `ctx.runAction('openView', params)`를 통해 선택/편집 팝업을 엽니다. |

> 주의: `ctx.openView`는 `FlowModel` 컨텍스트가 존재하는 RunJS 환경에서 사용할 수 있습니다. `uid`에 해당하는 모델이 존재하지 않으면 `PopupActionModel`이 자동으로 생성되고 유지됩니다.

## 시그니처

```ts
openView(uid: string, options?: OpenViewOptions): Promise<void>
```

## 매개변수 설명

### uid

뷰 모델의 고유 식별자입니다. 존재하지 않으면 자동으로 생성되어 저장됩니다. 동일한 팝업을 여러 번 열 때 구성을 재사용할 수 있도록 `${ctx.model.uid}-detail`과 같은 고정된 UID를 사용하는 것이 좋습니다.

### options 주요 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `mode` | `drawer` / `dialog` / `embed` | 여는 방식: 서랍, 팝업, 내장. 기본값은 `drawer`입니다. |
| `size` | `small` / `medium` / `large` | 팝업/서랍 크기. 기본값은 `medium`입니다. |
| `title` | `string` | 뷰 제목 |
| `params` | `Record<string, any>` | 뷰에 전달할 임의의 매개변수 |
| `filterByTk` | `any` | 기본 키 값으로, 단일 레코드 상세/편집 시나리오에서 사용됩니다. |
| `sourceId` | `string` | 원본 레코드 ID로, 연관 시나리오에서 사용됩니다. |
| `dataSourceKey` | `string` | 데이터 소스 |
| `collectionName` | `string` | 컬렉션 이름 |
| `associationName` | `string` | 연관 필드 이름 |
| `navigation` | `boolean` | 라우트 내비게이션 사용 여부. `defineProperties` / `defineMethods`를 전달할 경우 강제로 `false`로 설정됩니다. |
| `preventClose` | `boolean` | 닫기 방지 여부 |
| `defineProperties` | `Record<string, PropertyOptions>` | 뷰 내부 모델에 속성을 동적으로 주입합니다. |
| `defineMethods` | `Record<string, Function>` | 뷰 내부 모델에 메서드를 동적으로 주입합니다. |

## 예제

### 기본 사용법: 서랍 열기

```ts
const popupUid = `${ctx.model.uid}-detail`;
await ctx.openView(popupUid, {
  mode: 'drawer',
  size: 'medium',
  title: ctx.t('상세'),
});
```

### 현재 행 컨텍스트 전달

```ts
const primaryKey = ctx.collection?.primaryKey || 'id';
await ctx.openView(`${ctx.model.uid}-1`, {
  mode: 'dialog',
  title: ctx.t('행 상세'),
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### runAction을 통해 열기

모델에 `openView` 액션(연관 필드, 클릭 가능한 필드 등)이 구성되어 있는 경우 다음과 같이 호출할 수 있습니다.

```ts
await ctx.runAction('openView', {
  navigation: false,
  mode: 'dialog',
  collectionName: 'users',
  filterByTk: ctx.record?.id,
});
```

### 사용자 정의 컨텍스트 주입

```ts
await ctx.openView(`${ctx.model.uid}-edit`, {
  mode: 'drawer',
  filterByTk: ctx.record?.id,
  defineProperties: {
    onSaved: {
      get: () => () => ctx.resource?.refresh?.(),
      cache: false,
    },
  },
});
```

## ctx.viewer, ctx.view와의 관계

| 용도 | 권장 사용법 |
|------|----------|
| **구성된 워크플로우 뷰 열기** | `ctx.openView(uid, options)` |
| **사용자 정의 콘텐츠 열기 (워크플로우 없음)** | `ctx.viewer.dialog()` / `ctx.viewer.drawer()` |
| **현재 열려 있는 뷰 조작** | `ctx.view.close()`, `ctx.view.inputArgs` |

`ctx.openView`는 `FlowPage`(`ChildPageModel`)를 열며 내부적으로 전체 워크플로우 페이지를 렌더링합니다. `ctx.viewer`는 임의의 React 콘텐츠를 엽니다.

## 주의 사항

- `uid`는 여러 블록 간의 충돌을 피하기 위해 `ctx.model.uid`와 연관시키는 것이 좋습니다(예: `${ctx.model.uid}-xxx`).
- `defineProperties` / `defineMethods`를 전달할 때, 새로고침 후 컨텍스트 손실을 방지하기 위해 `navigation`은 강제로 `false`로 설정됩니다.
- 팝업 내의 `ctx.view`는 현재 뷰 인스턴스를 가리키며, `ctx.view.inputArgs`를 통해 열 때 전달된 매개변수를 읽을 수 있습니다.

## 관련 문서

- [ctx.view](./view.md): 현재 열려 있는 뷰 인스턴스
- [ctx.model](./model.md): 고정된 `popupUid`를 생성하는 데 사용되는 현재 모델