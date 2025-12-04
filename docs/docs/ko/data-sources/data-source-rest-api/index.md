---
pkg: "@nocobase/plugin-data-source-rest-api"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# REST API 데이터 소스

## 소개
이 플러그인은 REST API 소스의 데이터를 원활하게 통합할 수 있도록 도와줍니다.

## 설치
이 플러그인은 상업용 플러그인이므로, 플러그인 관리자를 통해 업로드하고 활성화해야 합니다.

![20240323162741](https://static-docs.nocobase.com/20240323162741.png)

## REST API 데이터 소스 추가
플러그인을 활성화한 후, 데이터 소스 관리의 '새로 추가(Add new)' 드롭다운 메뉴에서 'REST API'를 선택합니다.

![20240721171420](https://static-docs.nocobase.com/20240721171420.png)

REST API 데이터 소스를 설정합니다.

![20240721171507](https://static-docs.nocobase.com/20240721171507.png)

## 컬렉션 추가
NocoBase에서 RESTful 리소스는 컬렉션으로 매핑됩니다. 예를 들어, Users 리소스는 다음과 같습니다.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

이러한 API 엔드포인트는 NocoBase API에서 다음과 같이 설정됩니다.

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

NocoBase API 설계 사양에 대한 자세한 내용은 API 문서를 참조하십시오.

![20240716213344](https://static-docs.nocobase.com/20240716213344.png)

"NocoBase API - Core" 챕터를 확인하십시오.

![20240716213258](https://static-docs.nocobase.com/20240716213258.png)

REST API 데이터 소스의 컬렉션 설정은 다음과 같습니다.

### List
리소스 목록을 조회하는 인터페이스를 매핑합니다.

![20240716211351](https://static-docs.nocobase.com/20240716211351.png)

### Get
리소스 상세 정보를 조회하는 인터페이스를 매핑합니다.

![20240716211532](https://static-docs.nocobase.com/20240716211532.png)

### Create
리소스를 생성하는 인터페이스를 매핑합니다.

![20240716211634](https://static-docs.nocobase.com/20240716211634.png)

### Update
리소스를 업데이트하는 인터페이스를 매핑합니다.
![20240716211733](https://static-docs.nocobase.com/20240716211733.png)

### Destroy
리소스를 삭제하는 인터페이스를 매핑합니다.

![20240716211808](https://static-docs.nocobase.com/20240716211808.png)

List와 Get 인터페이스는 필수로 설정해야 합니다.

## API 디버깅

### 요청 파라미터 연동
예시: List 인터페이스에 페이지네이션 파라미터를 설정합니다. (만약 서드파티 API가 자체적으로 페이지네이션을 지원하지 않는다면, 가져온 목록 데이터를 기준으로 페이지네이션이 적용됩니다.)

![20241121205229](https://static-docs.nocobase.com/20241121205229.png)

인터페이스에 추가된 변수만 적용됩니다.

| 서드파티 API 파라미터 이름 | NocoBase 파라미터           |
| ------------------------- | --------------------------- |
| page                      | {{request.params.page}}     |
| limit                     | {{request.params.pageSize}} |

'Try it out'을 클릭하여 디버깅하고 응답 결과를 확인할 수 있습니다.

![20241121210320](https://static-docs.nocobase.com/20241121210320.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### 응답 형식 변환
서드파티 API의 응답 형식이 NocoBase 표준과 다를 수 있으므로, 프런트엔드에 올바르게 표시되려면 변환이 필요합니다.

![20241121214638](https://static-docs.nocobase.com/20241121214638.png)

서드파티 API의 응답 형식에 따라 변환 규칙을 조정하여 NocoBase 출력 표준에 맞도록 합니다.

![20241121215100](https://static-docs.nocobase.com/20241121215100.png)

디버깅 프로세스 설명

![20240717110051](https://static-docs.nocobase.com/20240717110051.png)

## 변수
REST API 데이터 소스는 API 연동을 위해 세 가지 유형의 변수를 제공합니다.

- 데이터 소스 사용자 지정 변수
- NocoBase 요청 변수
- 서드파티 응답 변수

### 데이터 소스 사용자 지정 변수

![20240716221937](https://static-docs.nocobase.com/20240716221937.png)

![20240716221858](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase 요청 변수

- Params: URL 쿼리 파라미터(Search Params)이며, 각 인터페이스마다 다를 수 있습니다.
- Headers: 요청 헤더로, 주로 NocoBase에서 정의한 특정 X- 정보를 제공합니다.
- Body: 요청 본문입니다.
- Token: 현재 NocoBase 요청의 API 토큰입니다.

![20240716222042](https://static-docs.nocobase.com/20240716222042.png)

### 서드파티 응답 변수

현재는 응답 본문만 제공됩니다.

![20240716222303](https://static-docs.nocobase.com/20240716222303.png)

각 인터페이스 연동 시 사용 가능한 변수는 다음과 같습니다.

### List

| 파라미터                | 설명                                               |
| ----------------------- | -------------------------------------------------- |
| request.params.page     | 현재 페이지 번호                                   |
| request.params.pageSize | 페이지당 항목 수                                   |
| request.params.filter   | 필터 조건 (NocoBase 필터 형식에 부합해야 합니다)   |
| request.params.sort     | 정렬 규칙 (NocoBase 정렬 형식에 부합해야 합니다)   |
| request.params.appends  | 필요에 따라 로드되는 필드 (주로 관계 필드에 사용) |
| request.params.fields   | 인터페이스에서 출력할 필드 (화이트리스트)          |
| request.params.except   | 제외할 필드 (블랙리스트)                           |

### Get

| 파라미터                    | 설명                                               |
| --------------------------- | -------------------------------------------------- |
| request.params.filterByTk | 필수, 일반적으로 현재 데이터의 ID                  |
| request.params.filter     | 필터 조건 (NocoBase 필터 형식에 부합해야 합니다)   |
| request.params.appends    | 필요에 따라 로드되는 필드 (주로 관계 필드에 사용) |
| request.params.fields     | 인터페이스에서 출력할 필드 (화이트리스트)          |
| request.params.except     | 제외할 필드 (블랙리스트)                           |

### Create

| 파라미터                   | 설명             |
| -------------------------- | ---------------- |
| request.params.whiteList | 화이트리스트     |
| request.params.blacklist | 블랙리스트       |
| request.body             | 생성할 초기 데이터 |

### Update

| 파라미터                    | 설명                                               |
| --------------------------- | -------------------------------------------------- |
| request.params.filterByTk | 필수, 일반적으로 현재 데이터의 ID                  |
| request.params.filter     | 필터 조건 (NocoBase 필터 형식에 부합해야 합니다)   |
| request.params.whiteList  | 화이트리스트                                       |
| request.params.blacklist  | 블랙리스트                                         |
| request.body              | 업데이트할 데이터                                  |

### Destroy

| 파라미터                    | 설명                                               |
| --------------------------- | -------------------------------------------------- |
| request.params.filterByTk | 필수, 일반적으로 현재 데이터의 ID                  |
| request.params.filter     | 필터 조건 (NocoBase 필터 형식에 부합해야 합니다)   |

## 필드 설정
연동된 리소스의 CRUD 인터페이스 데이터에서 필드 메타데이터(Fields)를 추출하여 컬렉션의 필드로 사용합니다.

![20240716223636](https://static-docs.nocobase.com/20240716223636.png)

필드 메타데이터를 추출합니다.

![20241121230436](https://static-docs.nocobase.com/20241121230436.png)

필드 및 미리보기입니다.

![20240716224403](https://static-docs.nocobase.com/20240716224403.png)

필드를 편집합니다 (다른 데이터 소스와 유사한 방식입니다).

![20240716224704](https://static-docs.nocobase.com/20240716224704.png)

## REST API 데이터 소스 블록 추가
컬렉션 설정이 완료되면, 인터페이스에 블록을 추가할 수 있습니다.

![20240716225120](https://static-docs.nocobase.com/20240716225120.png)