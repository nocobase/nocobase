:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/solution/crm/design)을 참조하세요.
:::

# CRM 2.0 시스템 상세 설계


## 1. 시스템 개요 및 설계 이념

### 1.1 시스템 포지셔닝

본 시스템은 NocoBase 노코드 플랫폼을 기반으로 구축된 **CRM 2.0 영업 관리 플랫폼**입니다. 핵심 목표는 다음과 같습니다.

```
영업 담당자가 데이터 입력이나 반복적인 분석 대신 고객 관계 구축에 집중할 수 있도록 합니다.
```

시스템은 워크플로우를 통해 일상적인 업무를 자동화하고, AI를 활용하여 리드 점수 산정, 영업 기회 분석 등을 지원함으로써 영업 팀의 효율성을 높입니다.

### 1.2 설계 이념

#### 이념 1: 완전한 판매 깔때기 (Sales Funnel)

**엔드 투 엔드(End-to-End) 영업 프로세스:**
![design-2026-02-24-00-05-26](https://static-docs.nocobase.com/design-2026-02-24-00-05-26.png)

**왜 이렇게 설계했나요?**

| 전통적인 방식 | 통합형 CRM |
|---------|-----------|
| 단계별로 여러 시스템 사용 | 전체 수명 주기를 아우르는 단일 시스템 |
| 시스템 간 수동 데이터 전달 | 자동화된 데이터 흐름 및 전환 |
| 일관되지 않은 고객 뷰 | 통합된 고객 360도 뷰 |
| 분산된 데이터 분석 | 엔드 투 엔드 영업 파이프라인 분석 |

#### 이념 2: 구성 가능한 영업 파이프라인
![design-2026-02-24-00-06-04](https://static-docs.nocobase.com/design-2026-02-24-00-06-04.png)

산업군에 따라 코드 수정 없이 영업 파이프라인 단계를 사용자 정의할 수 있습니다.

#### 이념 3: 모듈화 설계

- 핵심 모듈(고객 + 영업 기회)은 필수이며, 기타 모듈은 필요에 따라 활성화할 수 있습니다.
- 모듈 비활성화 시 코드를 수정할 필요 없이 NocoBase 인터페이스 설정을 통해 가능합니다.
- 각 모듈은 독립적으로 설계되어 결합도를 낮췄습니다.

---

## 2. 모듈 아키텍처 및 커스터마이징

### 2.1 모듈 개요

CRM 시스템은 **모듈화 아키텍처** 설계를 채택하여, 비즈니스 요구사항에 따라 각 모듈을 독립적으로 활성화하거나 비활성화할 수 있습니다.
![design-2026-02-24-00-06-14](https://static-docs.nocobase.com/design-2026-02-24-00-06-14.png)

### 2.2 모듈 의존성

| 모듈 | 필수 여부 | 의존성 | 비활성화 조건 |
|-----|---------|--------|---------|
| **고객 관리** | ✅ 예 | - | 비활성화 불가 (핵심) |
| **영업 기회 관리** | ✅ 예 | 고객 관리 | 비활성화 불가 (핵심) |
| **리드 관리** | 선택 사항 | - | 리드 확보가 필요 없는 경우 |
| **견적 관리** | 선택 사항 | 영업 기회, 제품 | 공식 견적이 필요 없는 단순 거래 |
| **주문 관리** | 선택 사항 | 영업 기회 (또는 견적) | 주문/결제 추적이 필요 없는 경우 |
| **제품 관리** | 선택 사항 | - | 제품 카탈로그가 필요 없는 경우 |
| **이메일 통합** | 선택 사항 | 고객, 연락처 | 외부 이메일 시스템을 사용하는 경우 |

### 2.3 사전 구성 버전

| 버전 | 포함 모듈 | 사용 시나리오 | 컬렉션 수 |
|-----|---------|---------|-----------|
| **라이트 버전** | 고객 + 영업 기회 | 단순 거래 추적 | 6 |
| **표준 버전** | 라이트 버전 + 리드 + 견적 + 주문 + 제품 | 전체 영업 수명 주기 | 15 |
| **엔터프라이즈 버전** | 표준 버전 + 이메일 통합 | 이메일을 포함한 전체 기능 | 17 |

### 2.4 모듈-컬렉션 매핑

#### 핵심 모듈 컬렉션 (항상 필수)

| 컬렉션 | 모듈 | 설명 |
|-------|------|------|
| nb_crm_customers | 고객 관리 | 고객/회사 기록 |
| nb_crm_contacts | 고객 관리 | 연락처 |
| nb_crm_customer_shares | 고객 관리 | 고객 공유 권한 |
| nb_crm_opportunities | 영업 기회 관리 | 영업 기회 |
| nb_crm_opportunity_stages | 영업 기회 관리 | 단계 설정 |
| nb_crm_opportunity_users | 영업 기회 관리 | 영업 기회 협업자 |
| nb_crm_activities | 활동 관리 | 활동 기록 |
| nb_crm_comments | 활동 관리 | 댓글/메모 |
| nb_crm_tags | 핵심 | 공유 태그 |
| nb_cbo_currencies | 기초 데이터 | 통화 사전 |
| nb_cbo_regions | 기초 데이터 | 국가/지역 사전 |

### 2.5 모듈 비활성화 방법

NocoBase 관리자 화면에서 해당 모듈의 메뉴 항목을 숨기기만 하면 되며, 코드를 수정하거나 컬렉션을 삭제할 필요가 없습니다.

---

## 3. 핵심 엔티티 및 데이터 모델

### 3.1 엔티티 관계 개요
![design-2026-02-24-00-06-40](https://static-docs.nocobase.com/design-2026-02-24-00-06-40.png)

### 3.2 핵심 컬렉션 상세 정보

#### 3.2.1 리드 테이블 (nb_crm_leads)

간소화된 4단계 워크플로우를 적용한 리드 관리입니다.

**단계 프로세스:**
```
신규 → 진행 중 → 검증됨 → 고객/영업 기회로 전환
         ↓          ↓
      부적격      부적격
```

**주요 필드:**

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| lead_no | VARCHAR | 리드 번호 (자동 생성) |
| name | VARCHAR | 연락처 성함 |
| company | VARCHAR | 회사명 |
| title | VARCHAR | 직함 |
| email | VARCHAR | 이메일 |
| phone | VARCHAR | 전화번호 |
| mobile_phone | VARCHAR | 휴대폰 |
| website | TEXT | 웹사이트 |
| address | TEXT | 주소 |
| source | VARCHAR | 리드 소스: website/ads/referral/exhibition/telemarketing/email/social |
| industry | VARCHAR | 산업군 |
| annual_revenue | VARCHAR | 연간 매출 규모 |
| number_of_employees | VARCHAR | 직원 수 규모 |
| status | VARCHAR | 상태: new/working/qualified/unqualified |
| rating | VARCHAR | 등급: hot/warm/cold |
| owner_id | BIGINT | 담당자 (FK → users) |
| ai_score | INTEGER | AI 품질 점수 0-100 |
| ai_convert_prob | DECIMAL | AI 전환 확률 |
| ai_best_contact_time | VARCHAR | AI 추천 연락 시간 |
| ai_tags | JSONB | AI 생성 태그 |
| ai_scored_at | TIMESTAMP | AI 점수 산정 시간 |
| ai_next_best_action | TEXT | AI 다음 최적 행동 제안 |
| ai_nba_generated_at | TIMESTAMP | AI 제안 생성 시간 |
| is_converted | BOOLEAN | 전환 여부 플래그 |
| converted_at | TIMESTAMP | 전환 시간 |
| converted_customer_id | BIGINT | 전환된 고객 ID |
| converted_contact_id | BIGINT | 전환된 연락처 ID |
| converted_opportunity_id | BIGINT | 전환된 영업 기회 ID |
| lost_reason | TEXT | 유실 사유 |
| disqualification_reason | TEXT | 부적격 사유 |
| description | TEXT | 설명 |

#### 3.2.2 고객 테이블 (nb_crm_customers)

해외 비즈니스를 지원하는 고객/회사 관리입니다.

**주요 필드:**

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| name | VARCHAR | 고객명 (필수) |
| account_number | VARCHAR | 고객 번호 (자동 생성, 고유값) |
| phone | VARCHAR | 전화번호 |
| website | TEXT | 웹사이트 |
| address | TEXT | 주소 |
| industry | VARCHAR | 산업군 |
| type | VARCHAR | 유형: prospect/customer/partner/competitor |
| number_of_employees | VARCHAR | 직원 수 규모 |
| annual_revenue | VARCHAR | 연간 매출 규모 |
| level | VARCHAR | 등급: normal/important/vip |
| status | VARCHAR | 상태: potential/active/dormant/churned |
| country | VARCHAR | 국가 |
| region_id | BIGINT | 지역 (FK → nb_cbo_regions) |
| preferred_currency | VARCHAR | 선호 통화: CNY/USD/EUR |
| owner_id | BIGINT | 담당자 (FK → users) |
| parent_id | BIGINT | 모회사 (FK → self) |
| source_lead_id | BIGINT | 소스 리드 ID |
| ai_health_score | INTEGER | AI 건강도 점수 0-100 |
| ai_health_grade | VARCHAR | AI 건강도 등급: A/B/C/D |
| ai_churn_risk | DECIMAL | AI 이탈 위험도 0-100% |
| ai_churn_risk_level | VARCHAR | AI 이탈 위험 등급: low/medium/high |
| ai_health_dimensions | JSONB | AI 건강도 차원별 점수 |
| ai_recommendations | JSONB | AI 제안 목록 |
| ai_health_assessed_at | TIMESTAMP | AI 건강도 평가 시간 |
| ai_tags | JSONB | AI 생성 태그 |
| ai_best_contact_time | VARCHAR | AI 추천 연락 시간 |
| ai_next_best_action | TEXT | AI 다음 최적 행동 제안 |
| ai_nba_generated_at | TIMESTAMP | AI 제안 생성 시간 |
| description | TEXT | 설명 |
| is_deleted | BOOLEAN | 소프트 삭제 플래그 |

#### 3.2.3 영업 기회 테이블 (nb_crm_opportunities)

구성 가능한 파이프라인 단계를 적용한 영업 기회 관리입니다.

**주요 필드:**

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| opportunity_no | VARCHAR | 영업 기회 번호 (자동 생성, 고유값) |
| name | VARCHAR | 영업 기회 명칭 (필수) |
| amount | DECIMAL | 예상 금액 |
| currency | VARCHAR | 통화 |
| exchange_rate | DECIMAL | 환율 |
| amount_usd | DECIMAL | USD 환산 금액 |
| customer_id | BIGINT | 고객 (FK) |
| contact_id | BIGINT | 주요 연락처 (FK) |
| stage | VARCHAR | 단계 코드 (FK → stages.code) |
| stage_sort | INTEGER | 단계 정렬 (정렬 편의를 위한 중복 필드) |
| stage_entered_at | TIMESTAMP | 현재 단계 진입 시간 |
| days_in_stage | INTEGER | 현재 단계 체류 일수 |
| win_probability | DECIMAL | 수동 승률 |
| ai_win_probability | DECIMAL | AI 예측 승률 |
| ai_analyzed_at | TIMESTAMP | AI 분석 시간 |
| ai_confidence | DECIMAL | AI 예측 신뢰도 |
| ai_trend | VARCHAR | AI 예측 추세: up/stable/down |
| ai_risk_factors | JSONB | AI 식별 위험 요인 |
| ai_recommendations | JSONB | AI 제안 목록 |
| ai_predicted_close | DATE | AI 예측 수주 날짜 |
| ai_next_best_action | TEXT | AI 다음 최적 행동 제안 |
| ai_nba_generated_at | TIMESTAMP | AI 제안 생성 시간 |
| expected_close_date | DATE | 예상 수주 날짜 |
| actual_close_date | DATE | 실제 수주 날짜 |
| owner_id | BIGINT | 담당자 (FK → users) |
| last_activity_at | TIMESTAMP | 최종 활동 시간 |
| stagnant_days | INTEGER | 활동 없음 일수 |
| loss_reason | TEXT | 수주 실패 사유 |
| competitor_id | BIGINT | 경쟁사 (FK) |
| lead_source | VARCHAR | 리드 소스 |
| campaign_id | BIGINT | 마케팅 캠페인 ID |
| expected_revenue | DECIMAL | 예상 수익 = 금액 × 확률 |
| description | TEXT | 설명 |

#### 3.2.4 견적 테이블 (nb_crm_quotations)

다중 통화 및 승인 워크플로우를 지원하는 견적 관리입니다.

**상태 프로세스:**
```
초안 → 승인 대기 → 승인됨 → 발송됨 → 수락됨/거절됨/만료됨
           ↓
       반려됨 → 수정 → 초안
```

**주요 필드:**

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| quotation_no | VARCHAR | 견적 번호 (자동 생성, 고유값) |
| name | VARCHAR | 견적 명칭 |
| version | INTEGER | 버전 번호 |
| opportunity_id | BIGINT | 영업 기회 (FK, 필수) |
| customer_id | BIGINT | 고객 (FK) |
| contact_id | BIGINT | 연락처 (FK) |
| owner_id | BIGINT | 담당자 (FK → users) |
| currency_id | BIGINT | 통화 (FK → nb_cbo_currencies) |
| exchange_rate | DECIMAL | 환율 |
| subtotal | DECIMAL | 소계 |
| discount_rate | DECIMAL | 할인율 |
| discount_amount | DECIMAL | 할인 금액 |
| shipping_handling | DECIMAL | 운송비/수수료 |
| tax_rate | DECIMAL | 세율 |
| tax_amount | DECIMAL | 세액 |
| total_amount | DECIMAL | 총 금액 |
| total_amount_usd | DECIMAL | USD 환산 금액 |
| status | VARCHAR | 상태: draft/pending_approval/approved/sent/accepted/rejected/expired |
| submitted_at | TIMESTAMP | 제출 시간 |
| approved_by | BIGINT | 승인자 (FK → users) |
| approved_at | TIMESTAMP | 승인 시간 |
| rejected_at | TIMESTAMP | 반려 시간 |
| sent_at | TIMESTAMP | 발송 시간 |
| customer_response_at | TIMESTAMP | 고객 응답 시간 |
| expired_at | TIMESTAMP | 만료 시간 |
| valid_until | DATE | 유효 기간 |
| payment_terms | TEXT | 결제 조건 |
| terms_condition | TEXT | 약관 및 조건 |
| address | TEXT | 배송 주소 |
| description | TEXT | 설명 |

#### 3.2.5 주문 테이블 (nb_crm_orders)

결제 추적 기능이 포함된 주문 관리입니다.

**주요 필드:**

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| order_no | VARCHAR | 주문 번호 (자동 생성, 고유값) |
| customer_id | BIGINT | 고객 (FK) |
| contact_id | BIGINT | 연락처 (FK) |
| opportunity_id | BIGINT | 영업 기회 (FK) |
| quotation_id | BIGINT | 견적 (FK) |
| owner_id | BIGINT | 담당자 (FK → users) |
| currency | VARCHAR | 통화 |
| exchange_rate | DECIMAL | 환율 |
| order_amount | DECIMAL | 주문 금액 |
| paid_amount | DECIMAL | 결제 금액 |
| unpaid_amount | DECIMAL | 미결제 금액 |
| status | VARCHAR | 상태: pending/confirmed/in_progress/shipped/delivered/completed/cancelled |
| payment_status | VARCHAR | 결제 상태: unpaid/partial/paid |
| order_date | DATE | 주문 날짜 |
| delivery_date | DATE | 예상 배송 날짜 |
| actual_delivery_date | DATE | 실제 배송 날짜 |
| shipping_address | TEXT | 배송 주소 |
| logistics_company | VARCHAR | 물류 회사 |
| tracking_no | VARCHAR | 운송장 번호 |
| terms_condition | TEXT | 약관 및 조건 |
| description | TEXT | 설명 |

### 3.3 컬렉션 요약

#### CRM 비즈니스 컬렉션

| 순번 | 컬렉션명 | 설명 | 유형 |
|-----|------|------|------|
| 1 | nb_crm_leads | 리드 관리 | 비즈니스 |
| 2 | nb_crm_customers | 고객/회사 | 비즈니스 |
| 3 | nb_crm_contacts | 연락처 | 비즈니스 |
| 4 | nb_crm_opportunities | 영업 기회 | 비즈니스 |
| 5 | nb_crm_opportunity_stages | 단계 설정 | 설정 |
| 6 | nb_crm_opportunity_users | 영업 기회 협업자 (영업 팀) | 관계 |
| 7 | nb_crm_quotations | 견적서 | 비즈니스 |
| 8 | nb_crm_quotation_items | 견적 상세 | 비즈니스 |
| 9 | nb_crm_quotation_approvals | 승인 기록 | 비즈니스 |
| 10 | nb_crm_orders | 주문 | 비즈니스 |
| 11 | nb_crm_order_items | 주문 상세 | 비즈니스 |
| 12 | nb_crm_payments | 결제 기록 | 비즈니스 |
| 13 | nb_crm_products | 제품 카탈로그 | 비즈니스 |
| 14 | nb_crm_product_categories | 제품 분류 | 설정 |
| 15 | nb_crm_price_tiers | 단계별 가격 설정 | 설정 |
| 16 | nb_crm_activities | 활동 기록 | 비즈니스 |
| 17 | nb_crm_comments | 댓글/메모 | 비즈니스 |
| 18 | nb_crm_competitors | 경쟁사 | 비즈니스 |
| 19 | nb_crm_tags | 태그 | 설정 |
| 20 | nb_crm_lead_tags | 리드-태그 관계 | 관계 |
| 21 | nb_crm_contact_tags | 연락처-태그 관계 | 관계 |
| 22 | nb_crm_customer_shares | 고객 공유 권한 | 관계 |
| 23 | nb_crm_exchange_rates | 환율 이력 | 설정 |

#### 기초 데이터 컬렉션 (공통 모듈)

| 순번 | 컬렉션명 | 설명 | 유형 |
|-----|------|------|------|
| 1 | nb_cbo_currencies | 통화 사전 | 설정 |
| 2 | nb_cbo_regions | 국가/지역 사전 | 설정 |

### 3.4 보조 컬렉션

#### 3.4.1 댓글 테이블 (nb_crm_comments)

다양한 비즈니스 객체에 연결할 수 있는 범용 댓글/메모 테이블입니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| content | TEXT | 댓글 내용 |
| lead_id | BIGINT | 관련 리드 (FK) |
| customer_id | BIGINT | 관련 고객 (FK) |
| opportunity_id | BIGINT | 관련 영업 기회 (FK) |
| order_id | BIGINT | 관련 주문 (FK) |

#### 3.4.2 고객 공유 테이블 (nb_crm_customer_shares)

고객에 대한 다인 협업 및 권한 공유를 구현합니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| customer_id | BIGINT | 고객 (FK, 필수) |
| shared_with_user_id | BIGINT | 공유받은 사용자 (FK, 필수) |
| shared_by_user_id | BIGINT | 공유자 (FK) |
| permission_level | VARCHAR | 권한 수준: read/write/full |
| shared_at | TIMESTAMP | 공유 시간 |

#### 3.4.3 영업 기회 협업자 테이블 (nb_crm_opportunity_users)

영업 기회에 대한 영업 팀의 협업을 지원합니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| opportunity_id | BIGINT | 영업 기회 (FK, 복합 기본 키) |
| user_id | BIGINT | 사용자 (FK, 복합 기본 키) |
| role | VARCHAR | 역할: owner/collaborator/viewer |

#### 3.4.4 지역 테이블 (nb_cbo_regions)

국가/지역 기초 데이터 사전입니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| code_alpha2 | VARCHAR | ISO 3166-1 2자리 코드 (고유값) |
| code_alpha3 | VARCHAR | ISO 3166-1 3자리 코드 (고유값) |
| code_numeric | VARCHAR | ISO 3166-1 숫자 코드 |
| name | VARCHAR | 국가/지역 명칭 |
| is_active | BOOLEAN | 활성화 여부 |
| sort_order | INTEGER | 정렬 순서 |

---

## 4. 리드 수명 주기

리드 관리는 간소화된 4단계 워크플로우를 사용합니다. 새 리드가 생성되면 워크플로우를 통해 자동으로 AI 점수 산정이 트리거되어 영업 담당자가 고품질 리드를 빠르게 식별할 수 있도록 돕습니다.

### 4.1 상태 정의

| 상태 | 명칭 | 설명 |
|-----|------|------|
| new | 신규 | 방금 생성됨, 연락 대기 중 |
| working | 진행 중 | 적극적으로 후속 조치 중 |
| qualified | 검증됨 | 전환 준비 완료 |
| unqualified | 부적격 | 적합하지 않음 |

### 4.2 상태 흐름도

![design-2026-02-24-00-25-32](https://static-docs.nocobase.com/design-2026-02-24-00-25-32.png)

### 4.3 리드 전환 프로세스

전환 화면에서는 세 가지 옵션을 동시에 제공하며, 사용자는 생성 또는 연결을 선택할 수 있습니다.

- **고객**: 새 고객 생성 또는 기존 고객 연결
- **연락처**: 새 연락처 생성 (고객과 연결)
- **영업 기회**: 영업 기회 생성 필수
![design-2026-02-24-00-25-22](https://static-docs.nocobase.com/design-2026-02-24-00-25-22.png)

**전환 후 기록:**
- `converted_customer_id`: 연결된 고객 ID
- `converted_contact_id`: 연결된 연락처 ID
- `converted_opportunity_id`: 생성된 영업 기회 ID

---

## 5. 영업 기회 수명 주기

영업 기회 관리는 구성 가능한 파이프라인 단계를 사용합니다. 영업 기회 단계가 변경될 때 자동으로 AI 승률 예측이 트리거되어 영업 담당자가 위험과 기회를 식별할 수 있도록 돕습니다.

### 5.1 구성 가능한 단계

단계는 `nb_crm_opportunity_stages` 테이블에 저장되며 사용자 정의가 가능합니다.

| 코드 | 명칭 | 순서 | 기본 승률 |
|-----|------|------|---------|
| prospecting | 초기 접촉 | 1 | 10% |
| analysis | 요구 분석 | 2 | 30% |
| proposal | 제안서 제출 | 3 | 60% |
| negotiation | 비즈니스 협상 | 4 | 80% |
| won | 수주 성공 | 5 | 100% |
| lost | 수주 실패 | 6 | 0% |

### 5.2 파이프라인 흐름
![design-2026-02-24-00-20-31](https://static-docs.nocobase.com/design-2026-02-24-00-20-31.png)

### 5.3 정체 감지

활동이 없는 영업 기회는 다음과 같이 표시됩니다.

| 활동 없음 일수 | 조치 |
|-----------|------|
| 7일 | 노란색 경고 |
| 14일 | 담당자에게 주황색 알림 |
| 30일 | 매니저에게 빨간색 알림 |

```sql
-- 정체 일수 계산
UPDATE nb_crm_opportunities
SET stagnant_days = EXTRACT(DAY FROM NOW() - last_activity_at)
WHERE stage NOT IN ('won', 'lost');
```

### 5.4 수주 성공/실패 처리

**수주 성공 시:**
1. 단계를 'won'으로 업데이트
2. 실제 수주 날짜 기록
3. 고객 상태를 'active'로 업데이트
4. 주문 생성 트리거 (견적이 수락된 경우)

**수주 실패 시:**
1. 단계를 'lost'으로 업데이트
2. 수주 실패 사유 기록
3. 경쟁사 ID 기록 (경쟁사에게 패한 경우)
4. 매니저에게 통지

---

## 6. 견적 수명 주기

### 6.1 상태 정의

| 상태 | 명칭 | 설명 |
|-----|------|------|
| draft | 초안 | 준비 중 |
| pending_approval | 승인 대기 | 승인 기다리는 중 |
| approved | 승인됨 | 발송 가능 |
| sent | 발송됨 | 고객에게 발송됨 |
| accepted | 수락됨 | 고객이 수락함 |
| rejected | 거절됨 | 고객이 거절함 |
| expired | 만료됨 | 유효 기간 지남 |

### 6.2 승인 규칙 (미완성)

승인 워크플로우는 다음 조건에 따라 트리거됩니다.

| 조건 | 승인 레벨 |
|------|---------|
| 할인율 > 10% | 영업 매니저 |
| 할인율 > 20% | 영업 이사 |
| 금액 > $100K | 재무팀 + 총괄 매니저 |

### 6.3 다중 통화 지원

#### 설계 이념

모든 보고서 및 분석을 위해 **USD를 통합 기준 통화**로 사용합니다. 각 금액 기록에는 다음이 저장됩니다.
- 원본 통화 및 금액 (고객에게 보이는 금액)
- 거래 시점의 환율
- USD 환산 금액 (내부 비교용)

#### 통화 사전 테이블 (nb_cbo_currencies)

통화 설정은 공통 기초 데이터 테이블을 사용하여 동적 관리를 지원합니다. `current_rate` 필드는 현재 환율을 저장하며, `nb_crm_exchange_rates`의 최신 기록에서 스케줄러를 통해 업데이트됩니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| code | VARCHAR | 통화 코드 (고유값): USD/CNY/EUR/GBP/JPY |
| name | VARCHAR | 통화 명칭 |
| symbol | VARCHAR | 통화 기호 |
| decimal_places | INTEGER | 소수점 자리수 |
| current_rate | DECIMAL | 현재 USD 대비 환율 (이력 테이블에서 동기화) |
| is_active | BOOLEAN | 활성화 여부 |
| sort_order | INTEGER | 정렬 순서 |

#### 환율 이력 테이블 (nb_crm_exchange_rates)

과거 환율 데이터를 기록하며, 스케줄러가 최신 환율을 `nb_cbo_currencies.current_rate`로 동기화합니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| currency_code | VARCHAR | 통화 코드 (CNY/EUR/GBP/JPY) |
| rate_to_usd | DECIMAL(10,6) | USD 대비 환율 |
| effective_date | DATE | 발효 날짜 |
| source | VARCHAR | 환율 소스: manual/api |
| createdAt | TIMESTAMP | 생성 시간 |

> **설명**: 견적서는 `currency_id` 외래 키를 통해 `nb_cbo_currencies` 테이블과 연결되며, 환율은 `current_rate` 필드에서 직접 가져옵니다. 영업 기회와 주문은 `currency` VARCHAR 필드를 사용하여 통화 코드를 저장합니다.

#### 금액 필드 패턴

금액이 포함된 테이블은 다음 패턴을 따릅니다.

| 필드 | 유형 | 설명 |
|-----|------|------|
| currency | VARCHAR | 거래 통화 |
| amount | DECIMAL | 원본 통화 금액 |
| exchange_rate | DECIMAL | 거래 시점의 USD 대비 환율 |
| amount_usd | DECIMAL | USD 환산 금액 (계산 필드) |

**적용 대상:**
- `nb_crm_opportunities.amount` → `amount_usd`
- `nb_crm_quotations.total_amount` → `total_amount_usd`

#### 워크플로우 통합
![design-2026-02-24-00-21-00](https://static-docs.nocobase.com/design-2026-02-24-00-21-00.png)

**환율 획득 로직:**
1. 비즈니스 작업 시 `nb_cbo_currencies.current_rate`에서 직접 환율을 가져옵니다.
2. USD 거래: 환율 = 1.0, 조회 불필요.
3. `current_rate`는 스케줄러에 의해 `nb_crm_exchange_rates`의 최신 기록에서 동기화됩니다.

### 6.4 버전 관리

견적이 거절되거나 만료된 경우 새 버전으로 복사할 수 있습니다.

```
QT-20260119-001 v1 → 거절됨
QT-20260119-001 v2 → 발송됨
QT-20260119-001 v3 → 수락됨
```

---

## 7. 주문 수명 주기

### 7.1 주문 개요

주문은 견적이 수락될 때 생성되며, 확정된 비즈니스 약속을 나타냅니다.
![design-2026-02-24-00-21-21](https://static-docs.nocobase.com/design-2026-02-24-00-21-21.png)

### 7.2 주문 상태 정의

| 상태 | 코드 | 설명 | 허용 작업 |
|-----|------|------|---------|
| 초안 | `draft` | 주문이 생성되었으나 아직 확정되지 않음 | 수정, 확정, 취소 |
| 확정됨 | `confirmed` | 주문이 확정되어 이행 대기 중 | 이행 시작, 취소 |
| 처리 중 | `in_progress` | 주문이 처리/생산 중 | 진행 상황 업데이트, 발송, 취소(승인 필요) |
| 발송됨 | `shipped` | 제품이 고객에게 발송됨 | 배송 완료 표시 |
| 배송 완료 | `delivered` | 고객이 물건을 수령함 | 주문 완료 처리 |
| 완료됨 | `completed` | 주문이 완전히 완료됨 | 없음 |
| 취소됨 | `cancelled` | 주문이 취소됨 | 없음 |

### 7.3 주문 데이터 모델

#### nb_crm_orders

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| order_no | VARCHAR | 주문 번호 (자동 생성, 고유값) |
| customer_id | BIGINT | 고객 (FK) |
| contact_id | BIGINT | 연락처 (FK) |
| opportunity_id | BIGINT | 영업 기회 (FK) |
| quotation_id | BIGINT | 견적 (FK) |
| owner_id | BIGINT | 담당자 (FK → users) |
| status | VARCHAR | 주문 상태 |
| payment_status | VARCHAR | 결제 상태: unpaid/partial/paid |
| order_date | DATE | 주문 날짜 |
| delivery_date | DATE | 예상 배송 날짜 |
| actual_delivery_date | DATE | 실제 배송 날짜 |
| currency | VARCHAR | 주문 통화 |
| exchange_rate | DECIMAL | USD 대비 환율 |
| order_amount | DECIMAL | 주문 총액 |
| paid_amount | DECIMAL | 결제 완료 금액 |
| unpaid_amount | DECIMAL | 미결제 금액 |
| shipping_address | TEXT | 배송 주소 |
| logistics_company | VARCHAR | 물류 회사 |
| tracking_no | VARCHAR | 운송장 번호 |
| terms_condition | TEXT | 약관 및 조건 |
| description | TEXT | 설명 |

#### nb_crm_order_items

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| order_id | FK | 상위 주문 |
| product_id | FK | 제품 참조 |
| product_name | VARCHAR | 제품명 스냅샷 |
| quantity | INT | 주문 수량 |
| unit_price | DECIMAL | 단가 |
| discount_percent | DECIMAL | 할인율 |
| line_total | DECIMAL | 항목별 합계 |
| notes | TEXT | 항목별 메모 |

### 7.4 결제 추적

#### nb_crm_payments

| 필드 | 유형 | 설명 |
|-----|------|------|
| id | BIGINT | 기본 키 |
| order_id | BIGINT | 관련 주문 (FK, 필수) |
| customer_id | BIGINT | 고객 (FK) |
| payment_no | VARCHAR | 결제 번호 (자동 생성, 고유값) |
| amount | DECIMAL | 결제 금액 (필수) |
| currency | VARCHAR | 결제 통화 |
| payment_method | VARCHAR | 결제 수단: transfer/check/cash/credit_card/lc |
| payment_date | DATE | 결제 날짜 |
| bank_account | VARCHAR | 은행 계좌 |
| bank_name | VARCHAR | 은행명 |
| notes | TEXT | 결제 메모 |

---

## 8. 고객 수명 주기

### 8.1 고객 개요

고객은 리드 전환 시 또는 영업 기회 수주 시 생성됩니다. 시스템은 고객 확보부터 옹호자 단계까지의 전체 수명 주기를 추적합니다.
![design-2026-02-24-00-21-34](https://static-docs.nocobase.com/design-2026-02-24-00-21-34.png)

### 8.2 고객 상태 정의

| 상태 | 코드 | 건강도 | 설명 |
|-----|------|--------|------|
| 잠재 | `prospect` | 없음 | 전환된 리드, 아직 주문 없음 |
| 활성 | `active` | ≥70 | 유료 고객, 상호작용 양호 |
| 성장 | `growing` | ≥80 | 확장 기회가 있는 고객 |
| 위험 | `at_risk` | <50 | 이탈 징후를 보이는 고객 |
| 이탈 | `churned` | 없음 | 더 이상 활동하지 않는 고객 |
| 복귀 | `win_back` | 없음 | 재활성화 중인 이전 고객 |
| 옹호자 | `advocate` | ≥90 | 높은 만족도, 추천 제공 |

### 8.3 고객 건강도 점수

여러 요인을 기반으로 고객 건강도를 계산합니다.

| 요인 | 가중치 | 측정 지표 |
|-----|------|---------|
| 구매 최신성 | 25% | 마지막 주문 이후 경과 일수 |
| 구매 빈도 | 20% | 기간당 주문 수 |
| 금전적 가치 | 20% | 총 주문액 및 평균 주문액 |
| 상호작용 정도 | 15% | 이메일 오픈율, 미팅 참여도 |
| 지원 상태 | 10% | 티켓 수량 및 해결률 |
| 제품 사용 | 10% | 활성 사용 지표 (해당 시) |

**건강도 임계값:**

```javascript
if (health_score >= 90) status = 'advocate';
else if (health_score >= 70) status = 'active';
else if (health_score >= 50) status = 'growing';
else status = 'at_risk';
```

### 8.4 고객 세분화

#### 자동 세분화

| 세그먼트 | 조건 | 권장 조치 |
|-----|------|---------|
| VIP | 수명 주기 가치(LTV) > $100K | 전담 서비스, 경영진 후원 |
| 엔터프라이즈 | 회사 규모 > 500명 | 전담 고객 매니저 배정 |
| 중형 | 회사 규모 50-500명 | 정기적 방문, 규모에 맞는 지원 |
| 스타트업 | 회사 규모 < 50명 | 셀프 서비스 리소스, 커뮤니티 |
| 휴면 | 90일 이상 활동 없음 | 재활성화 마케팅 |

---

## 9. 이메일 통합

### 9.1 개요

NocoBase는 Gmail 및 Outlook을 지원하는 내장 이메일 통합 플러그인을 제공합니다. 이메일이 시스템으로 동기화되면 워크플로우를 통해 자동으로 AI가 이메일의 감정과 의도를 분석하여 영업 담당자가 고객의 태도를 빠르게 파악할 수 있도록 돕습니다.

### 9.2 이메일 동기화

**지원되는 메일 서비스:**
- Gmail (OAuth 2.0 사용)
- Outlook/Microsoft 365 (OAuth 2.0 사용)

**동기화 동작:**
- 송수신 이메일 양방향 동기화
- 이메일을 CRM 기록(리드, 연락처, 영업 기회)에 자동 연결
- 첨부 파일은 NocoBase 파일 시스템에 저장

### 9.3 이메일-CRM 연결 (미완성)
![design-2026-02-24-00-21-51](https://static-docs.nocobase.com/design-2026-02-24-00-21-51.png)

### 9.4 이메일 템플릿

영업 담당자는 사전 설정된 템플릿을 사용할 수 있습니다.

| 템플릿 카테고리 | 예시 |
|---------|------|
| 초기 접촉 | 콜드 메일, 소개 메일, 이벤트 후속 조치 |
| 후속 조치 | 미팅 후속, 제안서 후속, 무응답 시 재촉 |
| 견적 | 견적서 첨부, 견적 수정, 견적 만료 임박 |
| 주문 | 주문 확정, 발송 알림, 배송 완료 확인 |
| 고객 성공 | 환영 인사, 정기 점검, 리뷰 요청 |

---

## 10. AI 보조 기능

### 10.1 AI 직원 팀

CRM 시스템은 NocoBase AI 플러그인을 통합하여 다음의 내장 AI 직원을 활용하며, CRM 시나리오에 맞는 전용 작업을 설정합니다.

| ID | 이름 | 내장 직무 | CRM 확장 기능 |
|----|------|---------|-------------|
| viz | Viz | 데이터 분석가 | 영업 데이터 분석, 파이프라인 예측 |
| dara | Dara | 차트 전문가 | 데이터 시각화, 보고서 차트 개발, 대시보드 설계 |
| ellis | Ellis | 에디터 | 이메일 답장 초안 작성, 커뮤니케이션 요약, 비즈니스 메일 작성 |
| lexi | Lexi | 번역가 | 다국어 고객 소통, 콘텐츠 번역 |
| orin | Orin | 오거나이저 | 일일 우선순위 설정, 다음 단계 제안, 후속 계획 |

### 10.3 AI 작업 목록

AI 기능은 상호 독립적인 두 가지 범주로 나뉩니다.

#### 1. AI 직원 (프론트엔드 블록 트리거)

사용자는 프론트엔드 AI 직원 블록을 통해 AI와 직접 대화하며 분석 및 제안을 받습니다.

| 직원 | 작업 | 설명 |
|------|------|------|
| Viz | 영업 데이터 분석 | 파이프라인 추세 및 전환율 분석 |
| Viz | 파이프라인 예측 | 가중치 적용 파이프라인 기반 수익 예측 |
| Dara | 차트 생성 | 영업 보고서 차트 생성 |
| Dara | 대시보드 설계 | 데이터 대시보드 레이아웃 설계 |
| Ellis | 답장 초안 작성 | 전문적인 이메일 답장 생성 |
| Ellis | 커뮤니케이션 요약 | 이메일 스레드 요약 |
| Ellis | 비즈니스 메일 작성 | 미팅 요청, 후속 조치, 감사 메일 등 작성 |
| Orin | 일일 우선순위 | 당일 우선순위 작업 목록 생성 |
| Orin | 다음 단계 제안 | 각 영업 기회별 다음 행동 추천 |
| Lexi | 콘텐츠 번역 | 마케팅 자료, 제안서, 이메일 번역 |

#### 2. 워크플로우 LLM 노드 (백엔드 자동 실행)

워크플로우 내에 포함된 LLM 노드로, 테이블 이벤트, 작업 이벤트, 스케줄러 등을 통해 자동으로 트리거되며 AI 직원과는 별개로 작동합니다.

| 작업 | 트리거 방식 | 설명 | 쓰기 필드 |
|------|---------|------|---------|
| 리드 점수 산정 | 테이블 이벤트 (생성/업데이트) | 리드 품질 평가 | ai_score, ai_convert_prob |
| 승률 예측 | 테이블 이벤트 (단계 변경) | 영업 기회 성공 가능성 예측 | ai_win_probability, ai_risk_factors |

> **설명**: 워크플로우 LLM 노드는 프롬프트와 Schema 출력을 사용하여 구조화된 JSON을 생성하며, 이를 해석하여 사용자 개입 없이 비즈니스 데이터 필드에 기록합니다.

### 10.3 데이터베이스 내 AI 필드

| 테이블 | AI 필드 | 설명 |
|----|--------|------|
| nb_crm_leads | ai_score | AI 점수 0-100 |
| | ai_convert_prob | 전환 확률 |
| | ai_best_contact_time | 최적 연락 시간 |
| | ai_tags | AI 생성 태그 (JSONB) |
| | ai_scored_at | 점수 산정 시간 |
| | ai_next_best_action | 다음 최적 행동 제안 |
| | ai_nba_generated_at | 제안 생성 시간 |
| nb_crm_opportunities | ai_win_probability | AI 예측 승률 |
| | ai_analyzed_at | 분석 시간 |
| | ai_confidence | 예측 신뢰도 |
| | ai_trend | 추세: up/stable/down |
| | ai_risk_factors | 위험 요인 (JSONB) |
| | ai_recommendations | 제안 목록 (JSONB) |
| | ai_predicted_close | 예측 수주 날짜 |
| | ai_next_best_action | 다음 최적 행동 제안 |
| | ai_nba_generated_at | 제안 생성 시간 |
| nb_crm_customers | ai_health_score | 건강도 점수 0-100 |
| | ai_health_grade | 건강도 등급: A/B/C/D |
| | ai_churn_risk | 이탈 위험도 0-100% |
| | ai_churn_risk_level | 이탈 위험 등급: low/medium/high |
| | ai_health_dimensions | 차원별 점수 (JSONB) |
| | ai_recommendations | 제안 목록 (JSONB) |
| | ai_health_assessed_at | 건강도 평가 시간 |
| | ai_tags | AI 생성 태그 (JSONB) |
| | ai_best_contact_time | 최적 연락 시간 |
| | ai_next_best_action | 다음 최적 행동 제안 |
| | ai_nba_generated_at | 제안 생성 시간 |

---

## 11. 워크플로우 엔진

### 11.1 구현된 워크플로우

| 워크플로우 명칭 | 트리거 유형 | 상태 | 설명 |
|-----------|---------|------|------|
| Leads Created | 테이블 이벤트 | 활성 | 리드 생성 시 트리거 |
| CRM Overall Analytics | AI 직원 이벤트 | 활성 | CRM 전체 데이터 분석 |
| Lead Conversion | 작업 후 이벤트 | 활성 | 리드 전환 프로세스 |
| Lead Assignment | 테이블 이벤트 | 활성 | 리드 자동 배정 |
| Lead Scoring | 테이블 이벤트 | 비활성 | 리드 점수 산정 (미완성) |
| Follow-up Reminder | 스케줄러 | 비활성 | 후속 조치 알림 (미완성) |

### 11.2 구현 예정 워크플로우

| 워크플로우 | 트리거 유형 | 설명 |
|-------|---------|------|
| 영업 기회 단계 추진 | 테이블 이벤트 | 단계 변경 시 승률 업데이트 및 시간 기록 |
| 영업 기회 정체 감지 | 스케줄러 | 활동 없는 영업 기회 감지 및 알림 발송 |
| 견적 승인 | 작업 후 이벤트 | 다단계 승인 프로세스 |
| 주문 생성 | 작업 후 이벤트 | 견적 수락 후 자동 주문 생성 |

---

## 12. 메뉴 및 인터페이스 설계

### 12.1 백엔드 관리 구조

| 메뉴 | 유형 | 설명 |
|------|------|------|
| **Dashboards** | 그룹 | 대시보드 |
| - Dashboard | 페이지 | 기본 대시보드 |
| - SalesManager | 페이지 | 영업 매니저 뷰 |
| - SalesRep | 페이지 | 영업 담당자 뷰 |
| - Executive | 페이지 | 경영진 뷰 |
| **Leads** | 페이지 | 리드 관리 |
| **Customers** | 페이지 | 고객 관리 |
| **Opportunities** | 페이지 | 영업 기회 관리 |
| - Table | 탭 | 영업 기회 목록 |
| **Products** | 페이지 | 제품 관리 |
| - Categories | 탭 | 제품 분류 |
| **Orders** | 페이지 | 주문 관리 |
| **Settings** | 그룹 | 설정 |
| - Stage Settings | 페이지 | 영업 기회 단계 설정 |
| - Exchange Rate | 페이지 | 환율 설정 |
| - Activity | 페이지 | 활동 기록 |
| - Emails | 페이지 | 이메일 관리 |
| - Contacts | 페이지 | 연락처 관리 |
| - Data Analysis | 페이지 | 데이터 분석 |

### 12.2 대시보드 뷰

#### 영업 매니저 뷰

| 컴포넌트 | 유형 | 데이터 |
|-----|------|------|
| 파이프라인 가치 | KPI 카드 | 단계별 파이프라인 총액 |
| 팀 순위표 | 테이블 | 담당자별 실적 순위 |
| 위험 경보 | 경보 목록 | 고위험 영업 기회 |
| 승률 추세 | 꺾은선 그래프 | 월별 승률 |
| 정체된 거래 | 목록 | 주의가 필요한 거래 |

#### 영업 담당자 뷰

| 컴포넌트 | 유형 | 데이터 |
|-----|------|------|
| 내 할당량 진행률 | 진행 바 | 월별 실적 vs 할당량 |
| 처리 대기 영업 기회 | KPI 카드 | 내 처리 대기 영업 기회 수 |
| 이번 주 마감 예정 | 목록 | 곧 마감될 거래 |
| 지연된 활동 | 경보 | 기한이 지난 작업 |
| 빠른 작업 | 버튼 | 활동 기록, 영업 기회 생성 |

#### 경영진 뷰

| 컴포넌트 | 유형 | 데이터 |
|-----|------|------|
| 연간 수익 | KPI 카드 | 연간 누적 수익 |
| 파이프라인 가치 | KPI 카드 | 파이프라인 총액 |
| 승률 | KPI 카드 | 전체 승률 |
| 고객 건강도 | 분포도 | 건강도 점수 분포 |
| 예측 | 차트 | 월별 수익 예측 |

---

*문서 버전: v2.0 | 업데이트 날짜: 2026-02-06*