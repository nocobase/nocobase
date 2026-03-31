:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# RelationRepository

`RelationRepository`는 관계(association) 유형의 `Repository` 객체입니다. `RelationRepository`를 사용하면 관계를 로드하지 않고도 관련 데이터를 조작할 수 있습니다. `RelationRepository`를 기반으로, 각 관계 유형은 다음과 같은 파생 구현을 가집니다:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## 생성자

**시그니처**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**매개변수**

| 매개변수 이름      | 타입               | 기본값 | 설명                                                |
| ------------------ | ------------------ | ------ | --------------------------------------------------- |
| `sourceCollection` | `Collection`       | -      | 관계 내에서 참조 관계(referencing relation)에 해당하는 컬렉션 |
| `association`      | `string`           | -      | 관계 이름                                           |
| `sourceKeyValue`   | `string \| number` | -      | 참조 관계에 해당하는 키 값                          |

## 기본 클래스 속성

### `db: Database`

데이터베이스 객체

### `sourceCollection`

관계 내에서 참조 관계(referencing relation)에 해당하는 컬렉션

### `targetCollection`

관계 내에서 참조되는 관계(referenced relation)에 해당하는 컬렉션

### `association`

현재 관계에 해당하는 Sequelize의 association 객체

### `associationField`

현재 관계에 해당하는 컬렉션의 필드

### `sourceKeyValue`

참조 관계에 해당하는 키 값