:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# NocoBase에서 API 키 사용하기

이 가이드에서는 실제 "할 일" 예시를 통해 NocoBase에서 API 키를 사용하여 데이터를 가져오는 방법을 보여드립니다. 아래 단계별 지침에 따라 전체 워크플로우를 이해해 보세요.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1. API 키 이해하기

API 키는 승인된 사용자로부터의 API 요청을 인증하는 보안 토큰입니다. 웹 애플리케이션, 모바일 앱 또는 백엔드 스크립트를 통해 NocoBase 시스템에 접근할 때 요청자의 신원을 확인하는 자격 증명 역할을 합니다.

HTTP 요청 헤더 형식은 다음과 같습니다:

```txt
Authorization: Bearer {API 키}
```

"Bearer" 접두사는 뒤에 오는 문자열이 요청자의 권한을 확인하는 데 사용되는 인증된 API 키임을 나타냅니다.

### 일반적인 사용 사례

API 키는 일반적으로 다음과 같은 상황에서 사용됩니다:

1.  **클라이언트 애플리케이션 접근**: 웹 브라우저와 모바일 앱은 API 키를 사용하여 사용자 신원을 인증하고, 승인된 사용자만 데이터에 접근할 수 있도록 보장합니다.
2.  **자동화된 작업 실행**: 백그라운드 프로세스와 예약된 작업은 API 키를 사용하여 업데이트, 데이터 동기화 및 로깅 작업을 안전하게 실행합니다.
3.  **개발 및 테스트**: 개발자는 디버깅 및 테스트 중에 API 키를 사용하여 인증된 요청을 시뮬레이션하고 API 응답을 확인합니다.

API 키는 신원 확인, 사용 모니터링, 요청 속도 제한, 위협 방지 등 다양한 보안 이점을 제공하여 NocoBase의 안정적이고 안전한 운영을 보장합니다.

## 2. NocoBase에서 API 키 생성하기

### 2.1. 인증: API 키 플러그인 활성화

내장된 [인증: API 키](/plugins/@nocobase/plugin-api-keys/) 플러그인이 활성화되어 있는지 확인해 주세요. 활성화되면 시스템 설정에 새로운 API 키 설정 페이지가 나타납니다.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2. 테스트용 컬렉션 생성

데모를 위해 `todos`라는 이름의 컬렉션을 만들고 다음 필드를 포함합니다:

-   `id`
-   `제목 (title)`
-   `완료 여부 (completed)`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

컬렉션에 몇 가지 샘플 레코드를 추가합니다:

-   밥 먹기
-   잠자기
-   게임하기

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3. 역할 생성 및 할당

API 키는 사용자 역할에 바인딩되며, 시스템은 할당된 역할에 따라 요청 권한을 결정합니다. API 키를 생성하기 전에 역할을 만들고 적절한 권한을 구성해야 합니다. "할 일 API 역할"이라는 이름의 역할을 생성하고, `todos` 컬렉션에 대한 모든 접근 권한을 부여합니다.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

API 키 생성 시 "할 일 API 역할"을 사용할 수 없다면, 현재 사용자에게 이 역할이 할당되었는지 확인해 주세요:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

역할 할당 후, 페이지를 새로고침하고 API 키 관리 페이지로 이동합니다. "API 키 추가"를 클릭하여 역할 선택에 "할 일 API 역할"이 나타나는지 확인합니다.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

더 나은 접근 제어를 위해 API 키 관리 및 테스트 전용 사용자 계정(예: "할 일 API 사용자")을 생성하는 것을 고려해 보세요. 이 사용자에게 "할 일 API 역할"을 할당합니다.
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4. API 키 생성 및 저장

폼을 제출하면 시스템은 확인 메시지와 새로 생성된 API 키를 표시합니다. **중요**: 보안상의 이유로 이 키는 다시 표시되지 않으므로, 즉시 복사하여 안전하게 보관하세요.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

API 키 예시:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5. 중요 사항

-   API 키의 유효 기간은 생성 시 구성된 만료 설정에 따라 결정됩니다.
-   API 키의 생성 및 유효성 검사는 `APP_KEY` 환경 변수에 의존합니다. **이 변수를 수정하지 마세요.** 수정할 경우 시스템의 모든 기존 API 키가 무효화됩니다.

## 3. API 키 인증 테스트하기

### 3.1. API 문서 플러그인 사용

[API 문서](/plugins/@nocobase/plugin-api-doc/) 플러그인을 열어 각 API 엔드포인트의 요청 메서드, URL, 매개변수 및 요청 헤더를 확인합니다.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2. 기본 CRUD 작업 이해하기

NocoBase는 데이터 조작을 위한 표준 CRUD(생성, 읽기, 업데이트, 삭제) API를 제공합니다:

-   **목록 조회 (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    요청 헤더:
    - Authorization: Bearer <API 키>

    ```
-   **레코드 생성 (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    요청 헤더:
    - Authorization: Bearer <API 키>

    요청 본문 (JSON 형식), 예시:
        {
            "title": "123"
        }
    ```
-   **레코드 수정 (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    요청 헤더:
    - Authorization: Bearer <API 키>

    요청 본문 (JSON 형식), 예시:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **레코드 삭제 (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    요청 헤더:
    - Authorization: Bearer <API 키>
    ```

여기서:
-   `{baseURL}`: NocoBase 시스템 URL
-   `{collectionName}`: 컬렉션 이름

예시: 로컬 인스턴스 `localhost:13000`, 컬렉션 이름 `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3. Postman으로 테스트하기

Postman에서 GET 요청을 생성하고 다음과 같이 구성합니다:
-   **URL**: 요청 엔드포인트 (예: `http://localhost:13000/api/todos:list`)
-   **Headers**: `Authorization` 요청 헤더를 추가하고 값으로 다음을 입력합니다:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**성공 응답:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**오류 응답 (유효하지 않거나 만료된 API 키):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**문제 해결**: 인증에 실패하면 역할 권한, API 키 바인딩 및 토큰 형식을 확인해 주세요.

### 3.4. 요청 코드 내보내기

Postman은 다양한 형식으로 요청을 내보낼 수 있도록 지원합니다. cURL 명령어 예시:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4. JS 블록에서 API 키 사용하기

NocoBase 2.0은 페이지에서 JS 블록을 사용하여 네이티브 JavaScript 코드를 직접 작성하는 것을 지원합니다. 이 예시는 API 키를 사용하여 외부 API 데이터를 가져오는 방법을 보여줍니다.

### JS 블록 생성

NocoBase 페이지에 JS 블록을 추가하고 다음 코드를 사용하여 할 일 데이터를 가져옵니다:

```javascript
// API 키를 사용하여 할 일 데이터 가져오기
async function fetchTodos() {
  try {
    // 로딩 메시지 표시
    ctx.message.loading('데이터를 가져오는 중...');

    // HTTP 요청을 위한 axios 라이브러리 로드
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('HTTP 라이브러리 로드 실패');
      return;
    }

    // API 키 (실제 API 키로 교체하세요)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // API 요청 보내기
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // 결과 표시
    console.log('할 일 목록:', response.data);
    ctx.message.success(`${response.data.data.length}개의 데이터를 성공적으로 가져왔습니다.`);

    // 여기서 데이터를 처리할 수 있습니다.
    // 예: 테이블에 표시, 폼 필드 업데이트 등

  } catch (error) {
    console.error('데이터 가져오기 오류:', error);
    ctx.message.error('데이터 가져오기 실패: ' + error.message);
  }
}

// 함수 실행
fetchTodos();
```

### 주요 요점

-   **ctx.requireAsync()**: HTTP 요청을 위해 외부 라이브러리(예: axios)를 동적으로 로드합니다.
-   **ctx.message**: 사용자 알림(로딩 중, 성공, 오류 메시지)을 표시합니다.
-   **API 키 인증**: `Authorization` 요청 헤더에 `Bearer` 접두사를 사용하여 API 키를 전달합니다.
-   **응답 처리**: 필요에 따라 반환된 데이터를 처리합니다(표시, 변환 등).

## 5. 요약

이 가이드에서는 NocoBase에서 API 키를 사용하는 전체 워크플로우를 다루었습니다:

1.  **설정**: API 키 플러그인을 활성화하고 테스트용 컬렉션 생성
2.  **구성**: 적절한 권한을 가진 역할을 생성하고 API 키 생성
3.  **테스트**: Postman 및 API 문서 플러그인을 사용하여 API 키 인증 확인
4.  **통합**: JS 블록에서 API 키 사용

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**추가 자료:**
- [API 키 플러그인 문서](/plugins/@nocobase/plugin-api-keys/)
- [API 문서 플러그인](/plugins/@nocobase/plugin-api-doc/)