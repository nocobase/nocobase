:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/runjs/context/collection)을 참조하세요.
:::

# ctx.collection

현재 RunJS 실행 컨텍스트와 연결된 컬렉션(Collection) 인스턴스로, 컬렉션의 메타데이터, 필드 정의 및 기본 키(Primary Key) 등의 설정에 접근하는 데 사용됩니다. 일반적으로 `ctx.blockModel.collection` 또는 `ctx.collectionField?.collection`에서 가져옵니다.

## 적용 시나리오

| 시나리오 | 설명 |
|------|------|
| **JSBlock** | 블록에 바인딩된 컬렉션입니다. `name`, `getFields`, `filterTargetKey` 등에 접근할 수 있습니다. |
| **JSField / JSItem / JSColumn** | 현재 필드가 속한 컬렉션(또는 상위 블록 컬렉션)입니다. 필드 목록, 기본 키 등을 가져오는 데 사용됩니다. |
| **테이블 열 / 상세 블록** | 컬렉션 구조에 따라 렌더링하거나, 팝업을 열 때 `filterByTk` 등을 전달할 때 사용됩니다. |

> 주의: `ctx.collection`은 데이터 블록, 폼 블록, 테이블 블록 등 컬렉션이 바인딩된 시나리오에서 사용할 수 있습니다. 컬렉션이 바인딩되지 않은 독립적인 JSBlock의 경우 `null`일 수 있으므로, 사용 전 null 체크를 권장합니다.

## 타입 정의

```ts
collection: Collection | null | undefined;
```

## 주요 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `name` | `string` | 컬렉션 이름 (예: `users`, `orders`) |
| `title` | `string` | 컬렉션 제목 (다국어 포함) |
| `filterTargetKey` | `string \| string[]` | 기본 키 필드명, `filterByTk` 및 `getFilterByTK`에 사용됨 |
| `dataSourceKey` | `string` | 데이터 소스 키 (예: `main`) |
| `dataSource` | `DataSource` | 소속된 데이터 소스 인스턴스 |
| `template` | `string` | 컬렉션 템플릿 (예: `general`, `file`, `tree`) |
| `titleableFields` | `CollectionField[]` | 제목으로 표시 가능한 필드 목록 |
| `titleCollectionField` | `CollectionField` | 제목 필드 인스턴스 |

## 주요 메서드

| 메서드 | 설명 |
|------|------|
| `getFields(): CollectionField[]` | 모든 필드 가져오기 (상속 포함) |
| `getField(name: string): CollectionField \| undefined` | 필드 이름으로 단일 필드 가져오기 |
| `getFieldByPath(path: string): CollectionField \| undefined` | 경로로 필드 가져오기 (관계 지원, 예: `user.name`) |
| `getAssociationFields(types?): CollectionField[]` | 관계 필드 가져오기, `types`는 `['one']`, `['many']` 등이 될 수 있음 |
| `getFilterByTK(record): any` | 레코드에서 기본 키 값을 추출하여 API의 `filterByTk`에 사용 |

## ctx.collectionField, ctx.blockModel과의 관계

| 요구사항 | 권장 용법 |
|------|----------|
| **현재 컨텍스트와 연결된 컬렉션** | `ctx.collection` (`ctx.blockModel?.collection` 또는 `ctx.collectionField?.collection`과 동일) |
| **현재 필드의 컬렉션 정의** | `ctx.collectionField?.collection` (필드가 속한 컬렉션) |
| **관계 대상 컬렉션** | `ctx.collectionField?.targetCollection` (관계 필드의 대상 컬렉션) |

하위 테이블 등의 시나리오에서 `ctx.collection`은 관계 대상 컬렉션일 수 있습니다. 일반적인 폼/테이블에서는 보통 블록에 바인딩된 컬렉션입니다.

## 예시

### 기본 키 가져오기 및 팝업 열기

```ts
const primaryKey = ctx.collection?.filterTargetKey ?? 'id';
await ctx.openView(popupUid, {
  mode: 'dialog',
  params: {
    filterByTk: ctx.record?.[primaryKey],
    record: ctx.record,
  },
});
```

### 필드를 순회하며 유효성 검사 또는 연동 수행

```ts
const fields = ctx.collection?.getFields() ?? [];
const requiredFields = fields.filter((f) => f.options?.required);
for (const f of requiredFields) {
  const v = ctx.form?.getFieldValue(f.name);
  if (v == null || v === '') {
    ctx.message.warning(`${f.title}은(는) 필수 항목입니다`);
    return;
  }
}
```

### 관계 필드 가져오기

```ts
const oneToMany = ctx.collection?.getAssociationFields(['many']) ?? [];
// 하위 테이블, 관계 리소스 등을 구성하는 데 사용
```

## 주의사항

- `filterTargetKey`는 컬렉션의 기본 키 필드명입니다. 일부 컬렉션은 `string[]` 형태의 복합 키를 가질 수 있으며, 설정되지 않은 경우 보통 `'id'`를 기본값으로 사용합니다.
- **하위 테이블, 관계 필드** 등의 시나리오에서 `ctx.collection`은 관계 대상 컬렉션을 가리킬 수 있으며, 이는 `ctx.blockModel.collection`과 다를 수 있습니다.
- `getFields()`는 상속된 컬렉션의 필드를 병합하며, 자신의 필드가 동일한 이름의 상속된 필드를 덮어씁니다.

## 관련 정보

- [ctx.collectionField](./collection-field.md): 현재 필드의 컬렉션 필드 정의
- [ctx.blockModel](./block-model.md): 현재 JS를 포함하는 부모 블록, `collection` 포함
- [ctx.model](./model.md): 현재 모델, `collection`을 포함할 수 있음