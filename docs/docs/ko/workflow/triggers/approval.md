---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 승인

## 소개

승인은 사람이 직접 시작하고 처리하여 관련 데이터의 상태를 결정하는 데 특화된 프로세스 유형입니다. 주로 사무 자동화나 사람이 직접 결정해야 하는 업무의 프로세스 관리에 활용됩니다. 예를 들어, "휴가 신청", "경비 정산 승인", "원자재 구매 승인"과 같은 시나리오에서 수동 워크플로우를 생성하고 관리할 수 있습니다.

승인 플러그인은 전용 워크플로우 유형(트리거)인 "승인(이벤트)"과 이 프로세스에 특화된 "승인" 노드를 제공합니다. NocoBase의 고유한 사용자 지정 컬렉션과 사용자 지정 블록을 함께 활용하면 다양한 승인 시나리오를 빠르고 유연하게 생성하고 관리할 수 있습니다.

## 워크플로우 생성

워크플로우를 생성할 때 "승인" 유형을 선택하면 승인 워크플로우를 생성할 수 있습니다.

![승인 트리거_승인 워크플로우 생성](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

그 후, 워크플로우 설정 화면에서 트리거를 클릭하여 팝업 창을 열고 추가 설정을 진행합니다.

## 트리거 설정

### 컬렉션 바인딩

NocoBase의 승인 플러그인은 유연성을 기반으로 설계되어 어떤 사용자 지정 컬렉션과도 함께 사용할 수 있습니다. 즉, 승인 설정을 위해 데이터 모델을 다시 구성할 필요 없이 이미 생성된 컬렉션을 직접 재사용합니다. 따라서 트리거 설정에 진입한 후에는 먼저 컬렉션을 선택하여 어떤 컬렉션의 데이터가 생성되거나 업데이트될 때 이 워크플로우가 트리거될지 결정해야 합니다.

![승인 트리거_트리거 설정_컬렉션 선택](https://static-docs.nocobase.com/8732a4419b1e28d2752b8f601132c82d.png)

그런 다음, 해당 컬렉션의 데이터 생성(또는 편집) 양식에서 이 워크플로우를 제출 버튼에 바인딩합니다.

![승인 시작_워크플로우 바인딩](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

이후 사용자가 이 양식을 제출하면 해당 승인 워크플로우가 트리거됩니다. 제출된 데이터는 해당 컬렉션에 저장될 뿐만 아니라 승인 흐름에 스냅샷으로 저장되어 후속 승인자들이 검토하고 사용할 수 있습니다.

### 철회

승인 워크플로우에서 시작자가 철회할 수 있도록 허용하려면 시작자 인터페이스 설정에서 "철회" 버튼을 활성화해야 합니다.

![승인 트리거_트리거 설정_철회 허용](https://static-docs.nocobase.com/20251029232544.png)

활성화되면 이 워크플로우로 시작된 승인은 어떤 승인자도 처리하기 전에 시작자가 철회할 수 있습니다. 하지만 후속 승인 노드에 설정된 승인자가 처리한 후에는 더 이상 철회할 수 없습니다.

:::info{title=참고}
철회 버튼을 활성화하거나 삭제한 후에는 트리거 설정 팝업 창에서 변경 사항을 적용하려면 저장 및 제출 버튼을 클릭해야 합니다.
:::

### 승인 시작 양식 인터페이스 설정

마지막으로 시작자의 양식 인터페이스를 설정해야 합니다. 이 인터페이스는 승인 센터 블록에서 승인을 시작하거나 사용자가 철회 후 다시 시작할 때 제출 작업에 사용됩니다. 설정 버튼을 클릭하여 팝업 창을 엽니다.

![승인 트리거_트리거 설정_시작자 양식](https://static-docs.nocobase.com/ca8b7e362d912138cf7d73bb60b37ac1.png)

시작자 인터페이스에 바인딩된 컬렉션을 기반으로 하는 작성 양식을 추가하거나 안내 및 지침을 위한 설명 텍스트(Markdown)를 추가할 수 있습니다. 양식은 필수로 추가해야 하며, 그렇지 않으면 시작자가 이 인터페이스에 진입한 후 아무런 작업을 수행할 수 없습니다.

양식 블록을 추가한 후에는 일반 양식 설정 인터페이스와 마찬가지로 해당 컬렉션의 필드 컴포넌트를 추가하고 양식에 채워야 할 내용을 구성하기 위해 원하는 대로 배열할 수 있습니다.

![승인 트리거_트리거 설정_시작자 양식_필드 설정](https://static-docs.nocobase.com/5a1e7f9c9d8de092c7b55585dad7d633.png)

직접 제출 버튼 외에도 "임시 저장" 작업 버튼을 추가하여 임시 저장 처리 프로세스를 지원할 수 있습니다.

![승인 트리거_트리거 설정_시작자 양식_작업 설정](https://static-docs.nocobase.com/2f4850d2078e94538995a9df70d3d2d1.png)

## 승인 노드

승인 워크플로우에서는 시작된 승인을 처리(승인, 거부 또는 반환)하기 위한 승인자의 작업 로직을 구성하려면 전용 "승인" 노드를 사용해야 합니다. "승인" 노드는 승인 워크플로우에서만 사용할 수 있습니다. 자세한 내용은 [승인 노드](../nodes/approval.md)를 참조하십시오.

## 승인 시작 설정

승인 워크플로우를 설정하고 활성화한 후에는 해당 컬렉션의 양식 제출 버튼에 이 워크플로우를 바인딩하여 사용자가 제출 시 승인을 시작할 수 있도록 할 수 있습니다.

![승인 시작_워크플로우 바인딩](https://static-docs.nocobase.com/2872ff108c61d7bf6d0bfb19886774c6.png)

워크플로우를 바인딩한 후, 사용자가 현재 양식을 제출하면 승인이 시작됩니다.

:::info{title=참고}
현재 승인 시작 버튼은 생성 또는 업데이트 양식의 "제출"(또는 "저장") 버튼만 지원합니다. "워크플로우로 제출" 버튼은 지원하지 않습니다(이 버튼은 "작업 후 이벤트"에만 바인딩할 수 있습니다).
:::

## 할 일 센터

할 일 센터는 사용자가 할 일 작업을 확인하고 처리할 수 있는 통합된 진입점을 제공합니다. 현재 사용자가 시작한 승인과 대기 중인 작업은 상단 도구 모음의 할 일 센터를 통해 접근할 수 있으며, 왼쪽의 분류 탐색을 통해 다양한 유형의 할 일 작업을 확인할 수 있습니다.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### 내 신청 내역

#### 제출된 승인 확인

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### 새 승인 직접 시작

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### 내 할 일

#### 할 일 목록

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### 할 일 상세 정보

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### 시작자

#### 컬렉션에서 시작

데이터 블록에서 시작하려면 다음과 같이 호출할 수 있습니다(`posts` 컬렉션의 생성 버튼을 예시로 들면).

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

여기서 URL 매개변수 `triggerWorkflows`는 워크플로우의 키이며, 여러 워크플로우 키는 쉼표로 구분됩니다. 이 키는 워크플로우 캔버스 상단의 워크플로우 이름에 마우스를 올리면 확인할 수 있습니다.

![워크플로우_키_확인_방법](https://static-docs.nocobase.com/20240426135108.png)

호출이 성공하면 해당 `posts` 컬렉션의 승인 워크플로우가 트리거됩니다.

:::info{title="참고"}
외부 호출도 사용자 신원을 기반으로 해야 하므로, HTTP API를 통해 호출할 때에는 일반 인터페이스에서 전송되는 요청과 마찬가지로 인증 정보가 제공되어야 합니다. 여기에는 `Authorization` 헤더 또는 `token` 매개변수(로그인 시 얻은 토큰)와 `X-Role` 헤더(사용자의 현재 역할 이름)가 포함됩니다.
:::

이 작업에서 일대일 관계 데이터(일대다 관계는 아직 지원되지 않음)에 대한 이벤트를 트리거해야 하는 경우, 매개변수에 `!`를 사용하여 관계 필드의 트리거 데이터를 지정할 수 있습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

위 호출이 성공하면 해당 `categories` 컬렉션의 승인 이벤트가 트리거됩니다.

:::info{title="참고"}
HTTP API를 통해 작업 후 이벤트를 트리거할 때, 워크플로우의 활성화 상태와 컬렉션 설정이 일치하는지 주의해야 합니다. 그렇지 않으면 호출이 성공하지 않거나 오류가 발생할 수 있습니다.
:::

#### 승인 센터에서 시작

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**매개변수**

*   `collectionName`: 승인을 시작할 대상 컬렉션의 이름입니다. 필수입니다.
*   `workflowId`: 승인을 시작하는 데 사용되는 워크플로우 ID입니다. 필수입니다.
*   `data`: 승인 시작 시 생성되는 컬렉션 레코드 필드입니다. 필수입니다.
*   `status`: 승인 시작 시 생성되는 레코드의 상태입니다. 필수입니다. 가능한 값은 다음과 같습니다.
    *   `0`: 초안. 승인 제출 없이 저장됨을 나타냅니다.
    *   `1`: 승인 제출. 시작자가 승인 요청을 제출하여 승인 프로세스에 진입함을 나타냅니다.

#### 저장 및 제출

시작(또는 철회)된 승인이 초안 상태일 때, 다음 API를 통해 다시 저장하거나 제출할 수 있습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### 제출된 승인 목록 가져오기

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### 철회

시작자는 다음 API를 통해 현재 승인 중인 레코드를 철회할 수 있습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**매개변수**

*   `<approval id>`: 철회할 승인 레코드의 ID입니다. 필수입니다.

### 승인자

승인 워크플로우가 승인 노드에 진입하면 현재 승인자를 위한 할 일 작업이 생성됩니다. 승인자는 인터페이스 작업을 통해 승인 작업을 완료하거나 HTTP API 호출을 통해 완료할 수 있습니다.

#### 승인 처리 기록 가져오기

할 일 작업은 승인 처리 기록입니다. 다음 API를 통해 현재 사용자의 모든 승인 처리 기록을 가져올 수 있습니다.

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

여기서 `approvalRecords`는 컬렉션 리소스이므로 `filter`, `sort`, `pageSize`, `page` 등과 같은 일반적인 쿼리 조건을 사용할 수 있습니다.

#### 단일 승인 처리 기록 가져오기

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### 승인 및 거부

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**매개변수**

*   `<record id>`: 승인 처리할 레코드의 ID입니다. 필수입니다.
*   `status`: 승인 처리 상태를 나타내는 필드입니다. `2`는 "승인", `-1`은 "거부"를 의미합니다. 필수입니다.
*   `comment`: 승인 처리의 비고 정보입니다. 선택 사항입니다.
*   `data`: 승인 후 현재 승인 노드가 속한 컬렉션 레코드에 대한 수정 사항을 나타냅니다. 선택 사항입니다(승인 시에만 유효).

#### 반환 <Badge>v1.9.0+</Badge>

v1.9.0 버전 이전에는 반환이 "승인" 및 "거부"와 동일한 API를 사용했으며, `"status": 1`은 반환을 의미했습니다.

v1.9.0 버전부터는 반환에 대한 별도의 API가 생겼습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**매개변수**

*   `<record id>`: 승인 처리할 레코드의 ID입니다. 필수입니다.
*   `returnToNodeKey`: 반환할 대상 노드의 키입니다. 선택 사항입니다. 노드에 반환 가능한 노드 범위가 설정된 경우, 이 매개변수를 사용하여 반환할 노드를 지정할 수 있습니다. 설정되지 않은 경우, 이 매개변수는 값을 전달할 필요가 없으며, 기본적으로 시작점으로 돌아가 시작자가 다시 제출하게 됩니다.

#### 위임

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**매개변수**

*   `<record id>`: 승인 처리할 레코드의 ID입니다. 필수입니다.
*   `assignee`: 위임할 사용자 ID입니다. 필수입니다.

#### 서명자 추가

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**매개변수**

*   `<record id>`: 승인 처리할 레코드의 ID입니다. 필수입니다.
*   `assignees`: 추가 서명자로 지정할 사용자 ID 목록입니다. 필수입니다.
*   `order`: 추가 서명자의 순서입니다. `-1`은 "나"보다 이전, `1`은 "나"보다 이후를 나타냅니다.