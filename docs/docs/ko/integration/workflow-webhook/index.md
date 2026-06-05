:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 워크플로우 Webhook 통합

Webhook 트리거를 통해 NocoBase는 외부 시스템의 HTTP 호출을 받아 워크플로우를 자동으로 트리거하여, 외부 시스템과 원활하게 통합될 수 있습니다.

## 개요

Webhook은 특정 이벤트가 발생했을 때 외부 시스템이 NocoBase로 데이터를 능동적으로 전송할 수 있도록 하는 '역방향 API' 메커니즘입니다. 능동적인 폴링 방식과 비교하여 Webhook은 더 실시간적이고 효율적인 통합 방식을 제공합니다.

## 주요 활용 사례

### 양식 데이터 제출

외부 설문조사 시스템, 등록 양식, 고객 피드백 양식 등에서 사용자가 데이터를 제출하면 Webhook을 통해 NocoBase로 데이터가 전송됩니다. 그러면 자동으로 레코드가 생성되고, 확인 이메일 발송이나 작업 할당과 같은 후속 처리 워크플로우가 트리거됩니다.

### 메시지 알림

기업 위챗, 딩톡, 슬랙과 같은 타사 메시징 플랫폼의 이벤트(새 메시지, @멘션, 승인 완료 등)는 Webhook을 통해 NocoBase 내의 자동화된 처리 워크플로우를 트리거할 수 있습니다.

### 데이터 동기화

CRM, ERP와 같은 외부 시스템의 데이터가 변경될 때, Webhook을 통해 NocoBase로 실시간으로 업데이트가 전송되어 데이터 동기화를 유지합니다.

### 타사 서비스 통합

- **GitHub**: 코드 푸시, PR 생성 등 이벤트로 자동화 워크플로우 트리거
- **GitLab**: CI/CD 파이프라인 상태 알림
- **양식 제출**: 외부 양식 시스템에서 NocoBase로 데이터 제출
- **IoT 장치**: 장치 상태 변경, 센서 데이터 보고

## 주요 기능

### 유연한 트리거 메커니즘

- GET, POST, PUT, DELETE 등 HTTP 메서드를 지원합니다.
- JSON, 양식 데이터 등 일반적인 형식을 자동으로 파싱합니다.
- 신뢰할 수 있는 소스인지 확인하기 위해 요청 유효성 검사를 구성할 수 있습니다.

### 데이터 처리 기능

- 수신된 데이터는 워크플로우 내에서 변수로 사용할 수 있습니다.
- 복잡한 데이터 변환 및 처리 로직을 지원합니다.
- 다른 워크플로우 노드와 결합하여 복잡한 비즈니스 로직을 구현할 수 있습니다.

### 보안 보장

- 위조된 요청을 방지하기 위한 서명 검증을 지원합니다.
- IP 화이트리스트를 구성할 수 있습니다.
- HTTPS 암호화 전송을 지원합니다.

## 사용 단계

### 1. 플러그인 설치

플러그인 관리자에서 **[워크플로우: Webhook 트리거](/plugins/@nocobase/plugin-workflow-webhook/)** 플러그인을 찾아 설치합니다.

> 참고: 이 플러그인은 상용 플러그인이므로 별도로 구매하거나 구독해야 합니다.

### 2. Webhook 워크플로우 생성

1. **워크플로우 관리** 페이지로 이동합니다.
2. **워크플로우 생성**을 클릭합니다.
3. 트리거 유형으로 **Webhook 트리거**를 선택합니다.

![Webhook 워크플로우 생성](https://static-docs.nocobase.com/20241210105049.png)

4. Webhook 매개변수를 구성합니다.

![Webhook 트리거 구성](https://static-docs.nocobase.com/20241210105441.png)
   - **요청 경로**: 사용자 지정 Webhook URL 경로
   - **요청 메서드**: 허용되는 HTTP 메서드(GET/POST/PUT/DELETE)를 선택합니다.
   - **동기/비동기**: 워크플로우 실행이 완료될 때까지 결과를 기다릴지 여부를 선택합니다.
   - **유효성 검사**: 서명 검증 또는 기타 보안 메커니즘을 구성합니다.

### 3. 워크플로우 노드 구성

비즈니스 요구 사항에 따라 다음과 같은 워크플로우 노드를 추가합니다.

- **컬렉션 작업**: 데이터 생성, 업데이트, 삭제
- **조건부 로직**: 수신된 데이터에 따라 조건부 분기
- **HTTP 요청**: 다른 API 호출
- **알림**: 이메일, SMS 등 발송
- **사용자 지정 코드**: JavaScript 코드 실행

### 4. Webhook URL 획득

워크플로우 생성 후, 시스템은 일반적으로 다음 형식의 고유한 Webhook URL을 생성합니다.

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. 타사 시스템에 구성

생성된 Webhook URL을 타사 시스템에 구성합니다.

- 양식 시스템에서 데이터 제출 콜백 주소 설정
- GitHub/GitLab에서 Webhook 구성
- 기업 위챗/딩톡에서 이벤트 푸시 주소 구성

### 6. Webhook 테스트

Postman, cURL과 같은 도구를 사용하여 Webhook을 테스트합니다.

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## 요청 데이터 접근

워크플로우에서 변수를 통해 Webhook이 수신한 데이터에 접근할 수 있습니다.

- `{{$context.data}}`: 요청 본문 데이터
- `{{$context.headers}}`: 요청 헤더 정보
- `{{$context.query}}`: URL 쿼리 매개변수
- `{{$context.params}}`: 경로 매개변수

![요청 매개변수 파싱](https://static-docs.nocobase.com/20241210111155.png)

![요청 본문 파싱](https://static-docs.nocobase.com/20241210112529.png)

## 응답 구성

![응답 설정](https://static-docs.nocobase.com/20241210114312.png)

### 동기 모드

워크플로우 실행이 완료된 후 결과가 반환되며, 다음을 구성할 수 있습니다.

- **응답 상태 코드**: 200, 201 등
- **응답 데이터**: 사용자 지정 JSON 응답
- **응답 헤더**: 사용자 지정 HTTP 헤더

### 비동기 모드

즉시 확인 응답을 반환하고 워크플로우는 백그라운드에서 실행됩니다. 다음 경우에 적합합니다.

- 장시간 실행되는 워크플로우
- 실행 결과가 필요 없는 시나리오
- 높은 동시성 시나리오

## 보안 모범 사례

### 1. 서명 검증 활성화

대부분의 타사 서비스는 서명 메커니즘을 지원합니다.

```javascript
// 예시: GitHub Webhook 서명 검증
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. HTTPS 사용

NocoBase가 HTTPS 환경에 배포되어 데이터 전송 보안을 보호하는지 확인합니다.

### 3. 요청 소스 제한

IP 화이트리스트를 구성하여 신뢰할 수 있는 소스의 요청만 허용합니다.

### 4. 데이터 유효성 검사

워크플로우에 데이터 유효성 검사 로직을 추가하여 수신된 데이터의 형식이 올바르고 내용이 유효한지 확인합니다.

### 5. 감사 로깅

모든 Webhook 요청을 기록하여 추적 및 문제 해결에 용이하게 합니다.

## 문제 해결

### Webhook이 트리거되지 않습니까?

1. Webhook URL이 올바른지 확인합니다.
2. 워크플로우 상태가 "활성화됨"인지 확인합니다.
3. 타사 시스템의 전송 로그를 확인합니다.
4. 방화벽 및 네트워크 구성을 확인합니다.

### Webhook을 어떻게 디버그합니까?

1. 워크플로우 실행 기록에서 요청 및 호출 결과에 대한 자세한 정보를 확인합니다.
2. Webhook 테스트 도구(예: Webhook.site)를 사용하여 요청을 검증합니다.
3. 실행 기록에서 주요 데이터와 오류 메시지를 확인합니다.

### 재시도를 어떻게 처리합니까?

일부 타사 서비스는 성공적인 응답을 받지 못하면 재전송을 시도합니다.

- 워크플로우가 멱등성을 갖도록 합니다.
- 고유 식별자를 사용하여 중복을 제거합니다.
- 처리된 요청 ID를 기록합니다.

### 성능 최적화 팁

- 시간이 많이 소요되는 작업은 비동기 모드를 사용합니다.
- 처리할 필요가 없는 요청을 필터링하기 위해 조건부 로직을 추가합니다.
- 높은 동시성 시나리오를 처리하기 위해 메시지 큐 사용을 고려합니다.

## 예시 시나리오

### 외부 양식 제출 처리

```javascript
// 1. 데이터 소스 검증
// 2. 양식 데이터 파싱
const formData = context.data;

// 3. 고객 레코드 생성
// 4. 관련 담당자에게 할당
// 5. 제출자에게 확인 이메일 발송
if (formData.email) {
  // 이메일 알림 발송
}
```

### GitHub 코드 푸시 알림

```javascript
// 1. 푸시 데이터 파싱
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. 메인 브랜치인 경우
if (branch === 'main') {
  // 3. 배포 워크플로우 트리거
  // 4. 팀원에게 알림
}
```

![Webhook 워크플로우 예시](https://static-docs.nocobase.com/20241210120655.png)

## 관련 자료

- [워크플로우 플러그인 문서](/plugins/@nocobase/plugin-workflow/)
- [워크플로우: Webhook 트리거](/workflow/triggers/webhook)
- [워크플로우: HTTP 요청 노드](/integration/workflow-http-request/)
- [API 키 인증](/integration/api-keys/)