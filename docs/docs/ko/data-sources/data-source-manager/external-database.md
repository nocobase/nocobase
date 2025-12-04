:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 외부 데이터베이스

## 소개

기존의 외부 데이터베이스를 데이터 소스로 활용할 수 있습니다. 현재 지원되는 외부 데이터베이스는 MySQL, MariaDB, PostgreSQL, MSSQL, Oracle입니다.

## 사용 방법

### 외부 데이터베이스 추가

플러그인을 활성화한 후, 데이터 소스 관리의 "Add new" 드롭다운 메뉴에서 외부 데이터베이스를 선택하고 추가할 수 있습니다.

![20240507204316](https://static-docs.nocobase.com/20240507204316.png)

연결할 데이터베이스 정보를 입력합니다.

![20240507204820](https://static-docs.nocobase.com/20240507204820.png)

### 컬렉션 동기화

외부 데이터베이스와 연결이 설정되면, 데이터 소스 내의 모든 컬렉션을 직접 읽어옵니다. 외부 데이터베이스는 컬렉션을 직접 추가하거나 테이블 구조를 수정하는 것을 지원하지 않습니다. 수정이 필요한 경우, 데이터베이스 클라이언트를 통해 작업을 수행한 다음, 인터페이스에서 "새로고침" 버튼을 클릭하여 동기화할 수 있습니다.

![20240507204725](https://static-docs.nocobase.com/20240507204725.png)

### 필드 구성

외부 데이터베이스는 기존 컬렉션의 필드를 자동으로 읽어와 표시합니다. 필드의 제목, 데이터 타입(Field type), UI 타입(Field interface)을 빠르게 확인하고 구성할 수 있으며, "편집" 버튼을 클릭하여 더 많은 설정을 수정할 수도 있습니다.

![20240507210537](https://static-docs.nocobase.com/20240507210537.png)

외부 데이터베이스는 테이블 구조 수정을 지원하지 않으므로, 새 필드를 추가할 때 선택할 수 있는 타입은 관계 필드뿐입니다. 관계 필드는 실제 필드가 아니라 컬렉션 간의 연결을 설정하는 데 사용됩니다.

![20240507220140](https://static-docs.nocobase.com/20240507220140.png)

더 자세한 내용은 [컬렉션 필드/개요](/data-sources/data-modeling/collection-fields) 섹션을 참조하십시오.

### 필드 타입 매핑

NocoBase는 외부 데이터베이스의 필드 타입을 해당 데이터 타입(Field type) 및 UI 타입(Field Interface)으로 자동으로 매핑합니다.

- 데이터 타입(Field type): 필드가 저장할 수 있는 데이터의 종류, 형식 및 구조를 정의합니다.
- UI 타입(Field interface): 사용자 인터페이스에서 필드 값을 표시하고 입력하는 데 사용되는 컨트롤 타입을 의미합니다.

| PostgreSQL | MySQL/MariaDB | NocoBase Data Type | NocoBase Interface Type |
| - | - | - | - |
| BOOLEAN | BOOLEAN<br/>TINYINT(1) | boolean | checkbox <br/> switch |
| SMALLINT<br/>INTEGER<br/>SERIAL<br/>SMALLSERIAL | TINYINT<br/>SMALLINT<br/>MEDIUMINT<br/>INTEGER | integer<br/>boolean<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup |
| BIGINT<br/>BIGSERIAL | BIGINT | bigInt<br/>sort | integer<br/>sort<br/>checkbox<br/>switch<br/>select<br/>radioGroup<br/>unixTimestamp<br/>createdAt<br/>updatedAt |
| REAL | FLOAT | float | number<br/>percent |
| DOUBLE PRECISION | DOUBLE PRECISION | double | number<br/>percent |
| DECIMAL<br/>NUMERIC | DECIMAL | decimal | number<br/>percent<br/>currency |
| VARCHAR<br/>CHAR | VARCHAR<br/>CHAR | string<br/>password<br/>uuid<br/>nanoid | input<br/>email<br/>phone<br/>password<br/>color<br/>icon<br/>select<br/>radioGroup<br/>uuid<br/>nanoid |
| TEXT | TEXT<br/>TINYTEXT<br/>MEDIUMTEXT<br/>LONGTEXT | text<br/>json | textarea<br/>markdown<br/>vditor<br/>richText<br/>url<br/>json |
| UUID | - | uuid | uuid |
| JSON<br/>JSONB | JSON | json | json |
| TIMESTAMP | DATETIME<br/>TIMESTAMP | date | date<br/>time<br/>createdAt<br/>updatedAt |
| DATE | DATE | dateOnly | datetime |
| TIME | TIME | time | time |
| - | YEAR |  | datetime |
| CIRCLE |  | circle | json<br/>circle |
| PATH<br/>GEOMETRY(LINESTRING) | LINESTRING | lineString | Json<br/>lineString |
| POINT<br/>GEOMETRY(POINT) | POINT | point | json<br/>point |
| POLYGON<br/>GEOMETRY(POLYGON) | POLYGON | polygon | json<br/>polygon |
| GEOMETRY | GEOMETRY |  -  |  -  |
| BLOB | BLOB | blob |  -  |
| ENUM | ENUM | enum | select<br/>radioGroup |
| ARRAY |  -  | array | multipleSelect<br/>checkboxGroup |
| BIT | BIT | - | - |
| SET | SET | set | multipleSelect<br/>checkboxGroup |
| RANGE | - | - | - |

### 지원되지 않는 필드 타입

지원되지 않는 필드 타입은 별도로 표시됩니다. 이러한 필드는 개발을 통해 적용된 후에 사용할 수 있습니다.

![20240507221854](https://static-docs.nocobase.com/20240507221854.png)

### 필터 대상 키

블록으로 표시되는 컬렉션은 필터 대상 키(Filter target key)가 구성되어 있어야 합니다. 필터 대상 키는 특정 필드를 기반으로 데이터를 필터링하는 데 사용되며, 필드 값은 고유해야 합니다. 필터 대상 키는 기본적으로 컬렉션의 기본 키 필드입니다. 뷰 또는 기본 키가 없는 컬렉션, 복합 기본 키를 가진 컬렉션의 경우, 사용자 정의 필터 대상 키를 정의해야 합니다.

![20240507210230](https://static-docs.nocobase.com/20240507210230.png)

필터 대상 키가 구성된 컬렉션만 페이지에 추가할 수 있습니다.

![20240507222827](https://static-docs.nocobase.com/20240507222827.png)