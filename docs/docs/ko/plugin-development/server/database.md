:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Database

`Database`는 데이터베이스 타입의 `데이터 소스`(`DataSource`)에서 아주 중요한 부분입니다. 각 데이터베이스 타입의 `데이터 소스`는 `Database` 인스턴스를 하나씩 가지고 있으며, `dataSource.db`를 통해 접근할 수 있습니다. 메인 `데이터 소스`의 `Database` 인스턴스는 `app.db`라는 편리한 별칭으로도 접근 가능합니다. `db`의 주요 메서드들을 잘 알아두는 것은 서버 사이드 `플러그인`을 개발하는 데 필수적입니다.

## Database 구성 요소

일반적인 `Database`는 다음과 같은 부분들로 구성됩니다.

- **컬렉션**: 데이터 테이블 구조를 정의합니다.
- **Model**: ORM 모델에 해당하며, 주로 Sequelize에 의해 관리됩니다.
- **Repository**: 데이터 접근 로직을 캡슐화하는 저장소 계층으로, 더 높은 수준의 작업 메서드를 제공합니다.
- **FieldType**: 필드 타입입니다.
- **FilterOperator**: 필터링에 사용되는 연산자입니다.
- **Event**: 생명 주기 이벤트 및 데이터베이스 이벤트입니다.

## 플러그인에서의 사용 시점

### `beforeLoad` 단계에서 할 수 있는 작업

이 단계에서는 데이터베이스 작업을 할 수 없으며, 정적 클래스 등록이나 이벤트 리스닝에 적합합니다.

- `db.registerFieldTypes()` — 사용자 정의 필드 타입 등록
- `db.registerModels()` — 사용자 정의 모델 클래스 등록
- `db.registerRepositories()` — 사용자 정의 Repository 클래스 등록
- `db.registerOperators()` — 사용자 정의 필터 연산자 등록
- `db.on()` — 데이터베이스 관련 이벤트 리스닝

### `load` 단계에서 할 수 있는 작업

이 단계에서는 모든 선행 클래스 정의와 이벤트가 로드된 상태이므로, 데이터 테이블을 로드할 때 누락되거나 빠지는 부분이 없습니다.

- `db.defineCollection()` — 새로운 데이터 테이블 정의
- `db.extendCollection()` — 기존 데이터 테이블 설정 확장

`플러그인`의 내장 테이블을 정의하는 경우, `./src/server/collections` 디렉터리에 두는 것을 더 권장합니다. 자세한 내용은 [컬렉션](./collections.md)을 참조하세요.

## 데이터 작업

`Database`는 데이터를 접근하고 조작하는 두 가지 주요 방법을 제공합니다.

### Repository를 통한 작업

```ts
const repo = db.getRepository('users');
const user = await repo.findOne({ filter: { id: 1 } });
```

Repository 계층은 일반적으로 페이지네이션, 필터링, 권한 확인 등과 같은 비즈니스 로직을 캡슐화하는 데 사용됩니다.

### Model을 통한 작업

```ts
const UserModel = db.getModel('users');
const user = await UserModel.findByPk(1);
```

Model 계층은 ORM 엔티티에 직접적으로 해당하며, 낮은 수준의 데이터베이스 작업을 수행하는 데 적합합니다.

## 데이터베이스 작업이 가능한 단계는 무엇인가요?

### 플러그인 생명 주기

| 단계 | 데이터베이스 작업 가능 여부 |
|------|--------------------|
| `staticImport` | 아니요 |
| `afterAdd` | 아니요 |
| `beforeLoad` | 아니요 |
| `load` | 아니요 |
| `install` | 예 |
| `beforeEnable` | 예 |
| `afterEnable` | 예 |
| `beforeDisable` | 예 |
| `afterDisable` | 예 |
| `remove` | 예 |
| `handleSyncMessage` | 예 |

### App 이벤트

| 단계 | 데이터베이스 작업 가능 여부 |
|------|--------------------|
| `beforeLoad` | 아니요 |
| `afterLoad` | 아니요 |
| `beforeStart` | 예 |
| `afterStart` | 예 |
| `beforeInstall` | 아니요 |
| `afterInstall` | 예 |
| `beforeStop` | 예 |
| `afterStop` | 아니요 |
| `beforeDestroy` | 예 |
| `afterDestroy` | 아니요 |
| `beforeLoadPlugin` | 아니요 |
| `afterLoadPlugin` | 아니요 |
| `beforeEnablePlugin` | 예 |
| `afterEnablePlugin` | 예 |
| `beforeDisablePlugin` | 예 |
| `afterDisablePlugin` | 예 |
| `afterUpgrade` | 예 |

### Database 이벤트/훅

| 단계 | 데이터베이스 작업 가능 여부 |
|------|--------------------|
| `beforeSync` | 아니요 |
| `afterSync` | 예 |
| `beforeValidate` | 예 |
| `afterValidate` | 예 |
| `beforeCreate` | 예 |
| `afterCreate` | 예 |
| `beforeUpdate` | 예 |
| `afterUpdate` | 예 |
| `beforeSave` | 예 |
| `afterSave` | 예 |
| `beforeDestroy` | 예 |
| `afterDestroy` | 예 |
| `afterCreateWithAssociations` | 예 |
| `afterUpdateWithAssociations` | 예 |
| `afterSaveWithAssociations` | 예 |
| `beforeDefineCollection` | 아니요 |
| `afterDefineCollection` | 아니요 |
| `beforeRemoveCollection` | 아니요 |
| `afterRemoveCollection` | 아니요 |