:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 워크플로우 HTTP 요청 연동

HTTP 요청 노드를 통해 NocoBase 워크플로우는 모든 HTTP 서비스에 능동적으로 요청을 보내 외부 시스템과의 데이터 교환 및 비즈니스 연동을 구현할 수 있습니다.

## 개요

HTTP 요청 노드는 워크플로우의 핵심 연동 컴포넌트입니다. 워크플로우 실행 중에 서드파티 API, 내부 서비스 인터페이스 또는 기타 웹 서비스를 호출하여 데이터를 가져오거나 외부 작업을 트리거할 수 있습니다.

## 주요 활용 사례

### 데이터 가져오기

- **서드파티 데이터 조회**: 날씨 API, 환율 API 등에서 실시간 데이터를 가져옵니다.
- **주소 분석**: 지도 서비스 API를 호출하여 주소 분석 및 지오코딩을 수행합니다.
- **기업 데이터 동기화**: CRM, ERP 시스템에서 고객, 주문 등의 데이터를 가져옵니다.

### 비즈니스 트리거

- **메시지 푸시**: SMS, 이메일, 위챗(企业微信) 등 서비스를 호출하여 알림을 보냅니다.
- **결제 요청**: 결제 게이트웨이에 결제, 환불 등의 작업을 요청합니다.
- **주문 처리**: 물류 시스템에 운송장을 제출하고 물류 상태를 조회합니다.

### 시스템 연동

- **마이크로서비스 호출**: 마이크로서비스 아키텍처에서 다른 서비스의 API를 호출합니다.
- **데이터 보고**: 데이터 분석 플랫폼, 모니터링 시스템에 비즈니스 데이터를 보고합니다.
- **서드파티 서비스**: AI 서비스, OCR 인식, 음성 합성 등을 연동합니다.

### 자동화 작업

- **정기 작업**: 외부 API를 주기적으로 호출하여 데이터를 동기화합니다.
- **이벤트 응답**: 데이터 변경 시 외부 API를 자동으로 호출하여 관련 시스템에 알립니다.
- **승인 워크플로우**: 승인 시스템 API를 호출하여 승인 요청을 제출합니다.

## 기능 특징

### 완벽한 HTTP 지원

- GET, POST, PUT, PATCH, DELETE 등 모든 HTTP 메서드를 지원합니다.
- 사용자 정의 요청 헤더(Headers)를 지원합니다.
- JSON, 폼 데이터, XML 등 다양한 데이터 형식을 지원합니다.
- URL 파라미터, 경로 파라미터, 요청 본문 등 다양한 파라미터 전달 방식을 지원합니다.

### 유연한 데이터 처리

- **변수 참조**: 워크플로우 변수를 사용하여 요청을 동적으로 구성합니다.
- **응답 파싱**: JSON 응답을 자동으로 파싱하여 필요한 데이터를 추출합니다.
- **데이터 변환**: 요청 데이터와 응답 데이터의 형식을 변환합니다.
- **오류 처리**: 재시도 전략, 타임아웃 설정, 오류 처리 로직을 구성합니다.

### 보안 인증

- **Basic Auth**: HTTP 기본 인증
- **Bearer Token**: 토큰 인증
- **API Key**: 사용자 정의 API 키 인증
- **사용자 정의 Headers**: 모든 인증 방식을 지원합니다.

## 사용 단계

### 1. 플러그인 활성화 확인

HTTP 요청 노드는 워크플로우 플러그인의 내장 기능입니다. **[워크플로우](/plugins/@nocobase/plugin-workflow/)** 플러그인이 활성화되어 있는지 확인하세요.

### 2. 워크플로우에 HTTP 요청 노드 추가

1. 워크플로우를 생성하거나 편집합니다.
2. 필요한 위치에 **HTTP 요청** 노드를 추가합니다.

![HTTP 요청_추가](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. 요청 파라미터를 구성합니다.

### 3. 요청 파라미터 구성

![HTTP 요청 노드_노드 구성](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### 기본 구성

- **요청 URL**: 대상 API 주소이며, 변수 사용을 지원합니다.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **요청 메서드**: GET, POST, PUT, DELETE 등을 선택합니다.

- **요청 헤더**: HTTP Headers를 구성합니다.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **요청 파라미터**:
  - **Query 파라미터**: URL 쿼리 파라미터
  - **Body 파라미터**: 요청 본문 데이터(POST/PUT)

#### 고급 구성

- **타임아웃 시간**: 요청 타임아웃을 설정합니다(기본 30초).
- **실패 시 재시도**: 재시도 횟수와 재시도 간격을 구성합니다.
- **실패 무시**: 요청이 실패하더라도 워크플로우를 계속 실행합니다.
- **프록시 설정**: HTTP 프록시를 구성합니다(필요한 경우).

### 4. 응답 데이터 사용

HTTP 요청 노드 실행 후, 응답 데이터는 다음 노드에서 사용할 수 있습니다.

- `{{$node.data.status}}`: HTTP 상태 코드
- `{{$node.data.headers}}`: 응답 헤더
- `{{$node.data.data}}`: 응답 본문 데이터
- `{{$node.data.error}}`: 오류 메시지(요청 실패 시)

![HTTP 요청 노드_응답 결과 사용](https://static-docs.nocobase.com/20240529110610.png)

## 예시 시나리오

### 예시 1: 날씨 정보 가져오기

```javascript
// 구성
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// 응답 사용
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### 예시 2: 위챗(企业微信) 메시지 보내기

```javascript
// 구성
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "주문 {{$context.orderId}}이(가) 발송되었습니다."
  }
}
```

### 예시 3: 결제 상태 조회

```javascript
// 구성
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// 조건 판단
만약 {{$node.data.data.status}}가 "paid"와 같다면
  - 주문 상태를 "결제 완료"로 업데이트합니다.
  - 결제 성공 알림을 보냅니다.
그렇지 않고 만약 {{$node.data.data.status}}가 "pending"과 같다면
  - 주문 상태를 "결제 대기 중"으로 유지합니다.
그렇지 않다면
  - 결제 실패 로그를 기록합니다.
  - 관리자에게 예외 처리를 알립니다.
```

### 예시 4: CRM으로 데이터 동기화

```javascript
// 구성
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## 인증 방식 구성

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// Header에
Headers:
  X-API-Key: your-api-key

// 또는 Query에
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

먼저 access_token을 획득한 다음 사용합니다.

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## 오류 처리 및 디버깅

### 일반적인 오류

1. **연결 타임아웃**: 네트워크 연결을 확인하고 타임아웃 시간을 늘립니다.
2. **401 권한 없음**: 인증 정보가 올바른지 확인합니다.
3. **404 찾을 수 없음**: URL이 올바른지 확인합니다.
4. **500 서버 오류**: API 제공자의 서비스 상태를 확인합니다.

### 디버깅 팁

1. **로그 노드 사용**: HTTP 요청 전후에 로그 노드를 추가하여 요청 및 응답 데이터를 기록합니다.

2. **실행 로그 확인**: 워크플로우 실행 로그에는 자세한 요청 및 응답 정보가 포함되어 있습니다.

3. **테스트 도구**: Postman, cURL 등의 도구를 사용하여 API를 먼저 테스트합니다.

4. **오류 처리**: 다양한 응답 상태를 처리하기 위한 조건 로직을 추가합니다.

```javascript
만약 {{$node.data.status}}가 200 이상이고 {{$node.data.status}}가 300 미만이라면
  - 성공 로직을 처리합니다.
그렇지 않다면
  - 실패 로직을 처리합니다.
  - 오류 기록: {{$node.data.error}}
```

## 성능 최적화 권장 사항

### 1. 비동기 처리 사용

즉시 결과를 받을 필요가 없는 요청의 경우, 비동기 워크플로우 사용을 고려해 보세요.

### 2. 합리적인 타임아웃 구성

API의 실제 응답 시간을 기반으로 타임아웃을 설정하여 과도한 대기를 피합니다.

### 3. 캐싱 전략 구현

자주 변경되지 않는 데이터(예: 구성, 사전)의 경우 응답 결과를 캐싱하는 것을 고려해 보세요.

### 4. 배치 처리

동일한 API를 여러 번 호출해야 하는 경우, API의 배치 인터페이스(지원하는 경우) 사용을 고려해 보세요.

### 5. 오류 재시도

합리적인 재시도 전략을 구성하되, 과도한 재시도로 인해 API 속도 제한이 발생하지 않도록 주의하세요.

## 보안 모범 사례

### 1. 민감한 정보 보호

- URL에 민감한 정보를 노출하지 마세요.
- HTTPS를 사용하여 암호화된 전송을 합니다.
- API 키와 같은 민감한 정보는 환경 변수 또는 구성 관리를 사용합니다.

### 2. 응답 데이터 유효성 검사

```javascript
// 응답 상태 유효성 검사
if (![200, 201].includes($node.data.status)) {
  throw new Error('API 요청에 실패했습니다.');
}

// 데이터 형식 유효성 검사
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('유효하지 않은 응답 데이터입니다.');
}
```

### 3. 요청 빈도 제한

서드파티 API의 속도 제한을 준수하여 차단되지 않도록 합니다.

### 4. 로그 비식별화

로그를 기록할 때 민감한 정보(비밀번호, 키 등)를 비식별화 처리하는 데 주의하세요.

## Webhook과의 비교

| 특징 | HTTP 요청 노드 | Webhook 트리거 |
|------|-------------|---------------|
| 방향 | NocoBase가 외부를 능동적으로 호출 | 외부가 NocoBase를 능동적으로 호출 |
| 시점 | 워크플로우 실행 시 | 외부 이벤트 발생 시 |
| 용도 | 데이터 가져오기, 외부 작업 트리거 | 외부 알림, 이벤트 수신 |
| 주요 시나리오 | 결제 API 호출, 날씨 조회 | 결제 콜백, 메시지 알림 |

이 두 기능은 서로 보완하여 완전한 시스템 연동 솔루션을 구축합니다.

## 관련 자료

- [워크플로우 플러그인 문서](/plugins/@nocobase/plugin-workflow/)
- [워크플로우: HTTP 요청 노드](/workflow/nodes/request)
- [워크플로우: Webhook 트리거](/integration/workflow-webhook/)
- [API 키 인증](/integration/api-keys/)
- [API 문서 플러그인](/plugins/@nocobase/plugin-api-doc/)