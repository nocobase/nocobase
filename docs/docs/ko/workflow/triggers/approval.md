---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/workflow/triggers/approval)을 참조하세요.
:::

# 승인

## 소개

승인은 사람이 직접 시작하고 처리하여 관련 데이터의 상태를 결정하는 데 특화된 프로세스 형태입니다. 일반적으로 사무 자동화나 기타 수동 의사결정 업무의 프로세스 관리에 사용되며, 예를 들어 "휴가 신청", "경비 정산 승인", "원자재 구매 승인" 등과 같은 시나리오의 수동 프로세스를 생성하고 관리할 수 있습니다.

승인 플러그인은 전용 워크플로우 유형(트리거)인 "승인(이벤트)"과 해당 프로세스 전용 "승인" 노드를 제공합니다. NocoBase 특유의 사용자 정의 컬렉션 및 사용자 정의 블록과 결합하여 다양한 승인 시나리오를 빠르고 유연하게 생성하고 관리할 수 있습니다.

## 워크플로우 생성

워크플로우 생성 시 "승인" 유형을 선택하면 승인 워크플로우를 생성할 수 있습니다.

![승인 트리거_승인 워크플로우 생성](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

그 후 워크플로우 설정 인터페이스에서 트리거를 클릭하여 팝업 창을 열고 더 많은 설정을 진행합니다.

## 트리거 설정

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### 컬렉션 바인딩

NocoBase의 승인 플러그인은 유연성을 기반으로 설계되어 모든 사용자 정의 컬렉션과 함께 사용할 수 있습니다. 즉, 승인 설정 시 데이터 모델을 중복으로 설정할 필요 없이 이미 생성된 컬렉션을 직접 재사용합니다. 따라서 트리거 설정에 진입한 후 가장 먼저 컬렉션을 선택하여 해당 프로세스가 어떤 컬렉션의 데이터를 대상으로 승인을 진행할지 결정해야 합니다.

![승인 트리거_트리거 설정_컬렉션 선택](https://static-docs.nocobase.com/20251226103223.png)

### 트리거 방식

비즈니스 데이터에 대해 승인을 시작할 때 다음 두 가지 트리거 방식을 선택할 수 있습니다.

*   **데이터 저장 전**

    제출된 데이터가 저장되기 전에 승인을 시작합니다. 승인이 통과된 후에만 데이터를 저장해야 하는 시나리오에 적합합니다. 이 모드에서 승인 시작 시의 데이터는 임시 데이터일 뿐이며, 승인이 통과된 후에야 해당 컬렉션에 정식으로 저장됩니다.

*   **데이터 저장 후**

    제출된 데이터가 저장된 후에 승인을 시작합니다. 데이터를 먼저 저장한 후 승인을 진행할 수 있는 시나리오에 적합합니다. 이 모드에서 승인 시작 시의 데이터는 이미 해당 컬렉션에 저장되어 있으며, 승인 과정 중의 수정 사항도 저장됩니다.

### 승인 시작 위치

시스템 내에서 승인을 시작할 위치를 선택할 수 있습니다.

*   **데이터 블록에서만 시작**

    해당 표의 모든 양식 블록 작업을 이 워크플로우에 바인딩하여 승인을 시작할 수 있으며, 단일 데이터의 승인 블록에서 승인 과정을 처리하고 추적합니다. 일반적으로 비즈니스 데이터에 적합합니다.

*   **데이터 블록과 할 일 센터 모두에서 시작**

    데이터 블록 외에도 전역 할 일 센터에서 승인을 시작하고 처리할 수 있습니다. 이는 일반적으로 행정 데이터에 적합합니다.

### 승인 시작 권한

사용자 범위를 기반으로 권한을 설정하여 어떤 사용자가 해당 승인을 시작할 수 있는지 결정할 수 있습니다.

*   **모든 사용자**

    시스템 내의 모든 사용자가 해당 승인을 시작할 수 있습니다.

*   **선택된 사용자만**

    지정된 범위의 사용자만 해당 승인을 시작할 수 있으며, 다중 선택이 가능합니다.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### 승인 시작 양식 인터페이스 설정

마지막으로 시작자의 양식 인터페이스를 설정해야 합니다. 이 인터페이스는 승인 센터 블록에서 시작할 때와 사용자가 철회 후 다시 시작할 때의 제출 작업에 사용됩니다. 설정 버튼을 클릭하여 팝업 창을 엽니다.

![승인 트리거_트리거 설정_시작자 양식](https://static-docs.nocobase.com/20251226130239.png)

시작자 인터페이스에 바인딩된 컬렉션을 기반으로 하는 작성 양식을 추가하거나, 안내 및 유도를 위한 설명 문구(Markdown)를 추가할 수 있습니다. 양식은 반드시 추가해야 하며, 그렇지 않으면 시작자가 해당 인터페이스에 진입한 후 작업을 수행할 수 없습니다.

양식 블록을 추가한 후에는 일반 양식 설정 인터페이스와 마찬가지로 해당 컬렉션의 필드 컴포넌트를 추가할 수 있으며, 양식에 작성해야 할 내용을 구성하기 위해 자유롭게 배치할 수 있습니다.

![승인 트리거_트리거 설정_시작자 양식_필드 설정](https://static-docs.nocobase.com/20251226130339.png)

직접 제출하는 버튼과 달리 "초안 저장" 작업 버튼을 추가하여 임시 저장 처리 프로세스를 지원할 수도 있습니다.

![승인 트리거_트리거 설정_시작자 양식_작업 설정_저장](https://static-docs.nocobase.com/20251226130512.png)

승인 워크플로우에서 시작자의 철회를 허용하려면 시작자 인터페이스 설정에서 "철회" 버튼을 활성화해야 합니다.

![승인 트리거_트리거 설정_철회 허용](https://static-docs.nocobase.com/20251226130637.png)

활성화되면 해당 워크플로우로 시작된 승인은 승인자가 처리하기 전까지 시작자가 철회할 수 있습니다. 하지만 후속 승인 노드에 설정된 승인자가 처리한 후에는 더 이상 철회할 수 없습니다.

:::info{title=참고}
철회 버튼을 활성화하거나 삭제한 후에는 트리거 설정 팝업 창에서 저장 및 제출을 클릭해야 적용됩니다.
:::

### "내 신청" 카드 <Badge>2.0+</Badge>

할 일 센터의 "내 신청" 목록에 표시될 작업 카드를 설정하는 데 사용됩니다.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

카드에는 표시하고자 하는 비즈니스 필드(관계 필드 제외) 또는 승인 관련 정보를 자유롭게 설정할 수 있습니다.

승인 신청이 생성된 후, 할 일 센터 목록에서 사용자 정의된 작업 카드를 확인할 수 있습니다.

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### 프로세스 내 레코드 표시 모드

*   **스냅샷**

    승인 프로세스에서 신청자와 승인자가 진입 시점에 보는 레코드 상태이며, 제출 후에는 자신이 수정한 기록만 볼 수 있고 이후 다른 사람이 업데이트한 내용은 볼 수 없습니다.

*   **최신**

    승인 프로세스에서 신청자와 승인자가 전체 프로세스 동안 항상 레코드의 최신 버전을 봅니다. 그들이 작업하기 전의 레코드 상태와 관계없이 프로세스가 종료된 후에는 레코드의 최종 버전을 보게 됩니다.

## 승인 노드

승인 워크플로우에서는 전용 "승인" 노드를 사용하여 승인자가 시작된 승인을 처리(승인, 거부 또는 반환)하기 위한 작업 로직을 구성해야 합니다. "승인" 노드는 승인 워크플로우에서만 사용할 수 있습니다. 자세한 내용은 [승인 노드](../nodes/approval.md)를 참조하십시오.

:::info{title=참고}
승인 워크플로우에 "승인" 노드가 하나도 없는 경우, 해당 프로세스는 자동으로 통과됩니다.
:::

## 승인 시작 설정

승인 워크플로우를 설정하고 활성화한 후, 해당 컬렉션의 양식 제출 버튼에 이 워크플로우를 바인딩하여 사용자가 제출 시 승인을 시작하도록 할 수 있습니다.

![승인 시작_워크플로우 바인딩](https://static-docs.nocobase.com/20251226110710.png)

이후 사용자가 해당 양식을 제출하면 대응하는 승인 워크플로우가 트리거됩니다. 제출된 데이터는 해당 컬렉션에 저장될 뿐만 아니라 승인 흐름에 스냅샷으로 저장되어 후속 승인 인원이 조회할 수 있습니다.

:::info{title=참고}
승인 시작 버튼은 현재 추가 또는 업데이트 양식의 "제출"(또는 "저장") 버튼만 지원하며, "워크플로우 트리거" 버튼(해당 버튼은 "사용자 정의 작업 이벤트"에만 바인딩 가능)은 지원하지 않습니다.
:::

## 할 일 센터

할 일 센터는 사용자가 할 일 작업을 확인하고 처리할 수 있는 통합된 진입점을 제공합니다. 현재 사용자가 시작한 승인과 처리해야 할 작업은 상단 도구 모음의 할 일 센터를 통해 진입할 수 있으며, 왼쪽의 분류 내비게이션을 통해 다양한 유형의 할 일 작업을 확인할 수 있습니다.

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

데이터 블록에서 시작하는 경우 다음과 같이 호출할 수 있습니다(`posts` 컬렉션 생성 버튼 예시):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

여기서 URL 매개변수 `triggerWorkflows`는 워크플로우의 key이며, 여러 워크플로우는 쉼표로 구분합니다. 이 key는 워크플로우 캔버스 상단의 워크플로우 이름에 마우스를 올리면 확인할 수 있습니다.

![워크플로우_key_확인_방법](https://static-docs.nocobase.com/20240426135108.png)

호출에 성공하면 해당 `posts` 컬렉션의 승인 워크플로우가 트리거됩니다.

:::info{title="참고"}
외부 호출도 사용자 신원을 기반으로 해야 하므로, HTTP API를 통해 호출할 때 일반 인터페이스에서 보내는 요청과 동일하게 `Authorization` 헤더 또는 `token` 매개변수(로그인 시 획득한 토큰), 그리고 `X-Role` 헤더(사용자의 현재 역할 이름) 등 인증 정보를 제공해야 합니다.
:::

해당 작업에서 일대일 관계 데이터(일대다는 현재 지원되지 않음)에 대한 이벤트를 트리거해야 하는 경우, 매개변수에 `!`를 사용하여 관계 필드의 트리거 데이터를 지정할 수 있습니다.

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

위 호출에 성공하면 해당 `categories` 컬렉션의 승인 이벤트가 트리거됩니다.

:::info{title="참고"}
HTTP API 호출을 통해 작업 후 이벤트를 트리거할 때 워크플로우의 활성화 상태 및 컬렉션 설정 일치 여부에 주의해야 합니다. 그렇지 않으면 호출에 성공하지 못하거나 오류가 발생할 수 있습니다.
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

* `collectionName`: 승인을 시작할 대상 컬렉션 이름, 필수.
* `workflowId`: 승인 시작에 사용되는 워크플로우 ID, 필수.
* `data`: 승인 시작 시 생성되는 컬렉션 레코드 필드, 필수.
* `status`: 승인 시작 시 생성되는 레코드 상태, 필수. 선택 가능한 값:
  * `0`: 초안, 저장은 하지만 승인을 제출하지 않음을 의미.
  * `2`: 승인 제출, 시작자가 승인 신청을 제출하여 승인 프로세스에 진입함을 의미.

#### 저장 및 제출

시작(또는 철회)된 승인이 초안 상태일 때 다음 인터페이스를 통해 다시 저장하거나 제출할 수 있습니다.

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

시작자는 다음 인터페이스를 통해 현재 승인 중인 레코드를 철회할 수 있습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**매개변수**

* `<approval id>`: 철회할 승인 레코드 ID, 필수.

### 승인자

승인 프로세스가 승인 노드에 진입하면 현재 승인자를 위한 할 일 작업이 생성됩니다. 승인자는 인터페이스 작업을 통해 승인 작업을 완료하거나 HTTP API 호출을 통해 완료할 수 있습니다.

#### 승인 처리 기록 가져오기

할 일 작업은 곧 승인 처리 기록입니다. 다음 인터페이스를 통해 현재 사용자의 모든 승인 처리 기록을 가져올 수 있습니다.

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

여기서 `approvalRecords`는 컬렉션 리소스로서 `filter`, `sort`, `pageSize`, `page` 등 일반적인 쿼리 조건을 사용할 수 있습니다.

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

* `<record id>`: 승인 처리할 레코드 ID, 필수.
* `status`: 승인 처리 상태 필드, `2`는 "승인", `-1`은 "거부"를 의미, 필수.
* `comment`: 승인 처리 비고 정보, 선택.
* `data`: 승인 통과 후 현재 승인 노드가 위치한 컬렉션 레코드에 대한 수정을 의미, 선택(승인 시에만 유효).

#### 반환 <Badge>v1.9.0+</Badge>

v1.9.0 버전 이전에는 반환 시 "승인", "거부"와 동일한 인터페이스를 사용했으며, `"status": 1`로 반환을 나타냈습니다.

v1.9.0 버전부터 반환 전용 인터페이스가 생겼습니다.

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**매개변수**

* `<record id>`: 승인 처리할 레코드 ID, 필수.
* `returnToNodeKey`: 반환할 대상 노드 key, 선택. 노드에 반환 가능한 노드 범위가 설정된 경우 이 매개변수를 사용하여 반환할 노드를 지정할 수 있습니다. 설정되지 않은 경우 이 매개변수는 값을 전달할 필요가 없으며, 기본적으로 시작점으로 돌아가 시작자가 다시 제출하게 됩니다.

#### 위임

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**매개변수**

* `<record id>`: 승인 처리할 레코드 ID, 필수.
* `assignee`: 위임할 사용자 ID, 필수.

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

* `<record id>`: 승인 처리할 레코드 ID, 필수.
* `assignees`: 추가할 서명자 사용자 ID 목록, 필수.
* `order`: 추가 순서, `-1`은 "나"의 이전, `1`은 "나"의 이후를 의미.