:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/solution/ticket-system/design)을 참조하세요.
:::

# 티켓 솔루션 상세 설계

> **버전**: v2.0-beta

> **업데이트 날짜**: 2026-01-05

> **상태**: 미리보기 버전

## 1. 시스템 개요 및 설계 이념

### 1.1 시스템 포지셔닝

본 시스템은 NocoBase 저코드 플랫폼을 기반으로 구축된 **AI 구동 지능형 티켓 관리 플랫폼**입니다. 핵심 목표는 다음과 같습니다:

```
상담사가 번거로운 프로세스 작업이 아닌, 문제 해결에만 전념할 수 있도록 합니다.
```

### 1.2 설계 이념

#### 이념 1: T형 데이터 아키텍처

**T형 아키텍처란 무엇인가요?**

"T형 인재" 개념을 차용하여 가로 방향의 광범위함과 세로 방향의 깊이를 결합했습니다:

- **가로(메인 테이블)**: 모든 비즈니스 유형을 아우르는 공통 기능 — 번호, 상태, 처리자, SLA 등 핵심 필드
- **세로(확장 테이블)**: 특정 비즈니스에 특화된 전문 필드 — 장비 수리에는 일련번호, 고객 불만에는 보상 방안 등

![ticketing-imgs-2025-12-31-22-50-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-18-25.png)

**왜 이렇게 설계했나요?**

| 전통적인 방식 | T형 아키텍처 |
|----------|---------|
| 비즈니스별로 테이블 생성, 필드 중복 | 공통 필드 통합 관리, 비즈니스 필드는 필요에 따라 확장 |
| 통계 보고서 작성 시 여러 테이블 병합 필요 | 하나의 메인 테이블에서 모든 티켓 통계 직접 산출 |
| 프로세스 변경 시 여러 곳을 수정해야 함 | 핵심 프로세스는 한 곳만 수정 |
| 신규 비즈니스 추가 시 새 테이블 구축 필요 | 확장 테이블만 추가하면 되며, 메인 프로세스는 유지됨 |

#### 이념 2: AI 직원 팀

단순한 "AI 기능"이 아니라 "AI 직원"입니다. 각 AI는 명확한 역할, 성격, 책임을 가집니다:

| AI 직원 | 직책 | 핵심 책임 | 트리거 시나리오 |
|--------|------|----------|----------|
| **Sam** | 서비스 데스크 슈퍼바이저 | 티켓 분류 및 배정, 우선순위 평가, 에스컬레이션 결정 | 티켓 생성 시 자동 실행 |
| **Grace** | 고객 성공 전문가 | 답변 생성, 어조 조정, 불만 처리 | 상담사가 "AI 답변" 클릭 시 |
| **Max** | 지식 어시스턴트 | 유사 사례 검색, 지식 추천, 솔루션 종합 | 티켓 상세 페이지에서 자동 실행 |
| **Lexi** | 번역가 | 다국어 번역, 댓글 번역 | 외국어 감지 시 자동 실행 |

**왜 "AI 직원" 모델을 사용하나요?**

- **명확한 책임**: Sam은 분류를, Grace는 답변을 담당하여 혼선이 없습니다.
- **이해하기 쉬움**: 사용자에게 "분류 API 호출"이라고 하는 것보다 "Sam에게 분석을 맡기세요"라고 하는 것이 더 친숙합니다.
- **확장성**: 새로운 AI 기능 추가는 곧 신입 사원을 채용하는 것과 같습니다.

#### 이념 3: 지식 자가 순환

![ticketing-imgs-2025-12-31-22-51-09](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-19-13.png)

이는 **지식 축적 - 지식 활용**의 선순환 구조를 형성합니다.

---

## 2. 핵심 엔티티 및 데이터 모델

### 2.1 엔티티 관계 개요

![ticketing-imgs-2025-12-31-22-51-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-20-02.png)


### 2.2 핵심 테이블 상세 설명

#### 2.2.1 티켓 메인 테이블 (nb_tts_tickets)

시스템의 핵심으로, 자주 사용하는 필드를 모두 포함하는 "와이드 테이블(Wide Table)" 설계를 채택했습니다.

**기본 정보**

| 필드 | 유형 | 설명 | 예시 |
|------|------|------|------|
| id | BIGINT | 기본 키 | 1001 |
| ticket_no | VARCHAR | 티켓 번호 | TKT-20251229-0001 |
| title | VARCHAR | 제목 | 네트워크 연결 속도 저하 |
| description | TEXT | 문제 설명 | 오늘 아침부터 사무실 네트워크가... |
| biz_type | VARCHAR | 비즈니스 유형 | it_support |
| priority | VARCHAR | 우선순위 | P1 |
| status | VARCHAR | 상태 | processing |

**출처 추적**

| 필드 | 유형 | 설명 | 예시 |
|------|------|------|------|
| source_system | VARCHAR | 출처 시스템 | crm / email / iot |
| source_channel | VARCHAR | 유입 채널 | web / phone / wechat |
| external_ref_id | VARCHAR | 외부 참조 ID | CRM-2024-0001 |

**연락처 정보**

| 필드 | 유형 | 설명 |
|------|------|------|
| customer_id | BIGINT | 고객 ID |
| contact_name | VARCHAR | 연락처 성함 |
| contact_phone | VARCHAR | 연락처 전화번호 |
| contact_email | VARCHAR | 연락처 이메일 |
| contact_company | VARCHAR | 회사명 |

**처리자 정보**

| 필드 | 유형 | 설명 |
|------|------|------|
| assignee_id | BIGINT | 처리자 ID |
| assignee_department_id | BIGINT | 처리 부서 ID |
| transfer_count | INT | 전달 횟수 |

**시간 노드**

| 필드 | 유형 | 설명 | 트리거 시점 |
|------|------|------|----------|
| submitted_at | TIMESTAMP | 제출 시간 | 티켓 생성 시 |
| assigned_at | TIMESTAMP | 배정 시간 | 처리자 지정 시 |
| first_response_at | TIMESTAMP | 첫 응답 시간 | 고객에게 첫 답변 시 |
| resolved_at | TIMESTAMP | 해결 시간 | 상태가 resolved로 변경 시 |
| closed_at | TIMESTAMP | 종료 시간 | 상태가 closed로 변경 시 |

**SLA 관련**

| 필드 | 유형 | 설명 |
|------|------|------|
| sla_config_id | BIGINT | SLA 설정 ID |
| sla_response_due | TIMESTAMP | 응답 마감 시간 |
| sla_resolve_due | TIMESTAMP | 해결 마감 시간 |
| sla_paused_at | TIMESTAMP | SLA 일시 중지 시작 시간 |
| sla_paused_duration | INT | 누적 일시 중지 시간(분) |
| is_sla_response_breached | BOOLEAN | 응답 시간 위반 여부 |
| is_sla_resolve_breached | BOOLEAN | 해결 시간 위반 여부 |

**AI 분석 결과**

| 필드 | 유형 | 설명 | 작성 주체 |
|------|------|------|----------|
| ai_category_code | VARCHAR | AI 식별 분류 | Sam |
| ai_sentiment | VARCHAR | 감정 분석 | Sam |
| ai_urgency | VARCHAR | 긴급도 | Sam |
| ai_keywords | JSONB | 키워드 | Sam |
| ai_reasoning | TEXT | 추론 과정 | Sam |
| ai_suggested_reply | TEXT | 제안 답변 | Sam/Grace |
| ai_confidence_score | NUMERIC | 신뢰도 점수 | Sam |
| ai_analysis | JSONB | 전체 분석 결과 | Sam |

**다국어 지원**

| 필드 | 유형 | 설명 | 작성 주체 |
|------|------|------|----------|
| source_language_code | VARCHAR | 원본 언어 | Sam/Lexi |
| target_language_code | VARCHAR | 대상 언어 | 시스템 기본값 EN |
| is_translated | BOOLEAN | 번역 여부 | Lexi |
| description_translated | TEXT | 번역된 설명 | Lexi |

#### 2.2.2 비즈니스 확장 테이블

**장비 수리 (nb_tts_biz_repair)**

| 필드 | 유형 | 설명 |
|------|------|------|
| ticket_id | BIGINT | 관련 티켓 ID |
| equipment_model | VARCHAR | 장비 모델명 |
| serial_number | VARCHAR | 일련번호 |
| fault_code | VARCHAR | 고장 코드 |
| spare_parts | JSONB | 예비 부품 목록 |
| maintenance_type | VARCHAR | 유지보수 유형 |

**IT 지원 (nb_tts_biz_it_support)**

| 필드 | 유형 | 설명 |
|------|------|------|
| ticket_id | BIGINT | 관련 티켓 ID |
| asset_number | VARCHAR | 자산 번호 |
| os_version | VARCHAR | OS 버전 |
| software_name | VARCHAR | 관련 소프트웨어 |
| remote_address | VARCHAR | 원격 주소 |
| error_code | VARCHAR | 에러 코드 |

**고객 불만 (nb_tts_biz_complaint)**

| 필드 | 유형 | 설명 |
|------|------|------|
| ticket_id | BIGINT | 관련 티켓 ID |
| related_order_no | VARCHAR | 관련 주문 번호 |
| complaint_level | VARCHAR | 불만 등급 |
| compensation_amount | DECIMAL | 보상 금액 |
| compensation_type | VARCHAR | 보상 방식 |
| root_cause | TEXT | 근본 원인 |

#### 2.2.3 댓글 테이블 (nb_tts_ticket_comments)

**핵심 필드**

| 필드 | 유형 | 설명 |
|------|------|------|
| id | BIGINT | 기본 키 |
| ticket_id | BIGINT | 티켓 ID |
| parent_id | BIGINT | 부모 댓글 ID (트리 구조 지원) |
| content | TEXT | 댓글 내용 |
| direction | VARCHAR | 방향: inbound(고객)/outbound(상담사) |
| is_internal | BOOLEAN | 내부 메모 여부 |
| is_first_response | BOOLEAN | 첫 응답 여부 |

**AI 검토 필드 (outbound용)**

| 필드 | 유형 | 설명 |
|------|------|------|
| source_language_code | VARCHAR | 원본 언어 |
| content_translated | TEXT | 번역된 내용 |
| is_translated | BOOLEAN | 번역 여부 |
| is_ai_blocked | BOOLEAN | AI 차단 여부 |
| ai_block_reason | VARCHAR | 차단 사유 |
| ai_block_detail | TEXT | 상세 설명 |
| ai_quality_score | NUMERIC | 품질 점수 |
| ai_suggestions | TEXT | 개선 제안 |

#### 2.2.4 평가 테이블 (nb_tts_ratings)

| 필드 | 유형 | 설명 |
|------|------|------|
| ticket_id | BIGINT | 티켓 ID (고유) |
| overall_rating | INT | 전체 만족도 (1-5) |
| response_rating | INT | 응답 속도 (1-5) |
| professionalism_rating | INT | 전문성 (1-5) |
| resolution_rating | INT | 문제 해결 (1-5) |
| nps_score | INT | NPS 점수 (0-10) |
| tags | JSONB | 빠른 태그 |
| comment | TEXT | 텍스트 평가 |

#### 2.2.5 지식 문서 테이블 (nb_tts_qa_articles)

| 필드 | 유형 | 설명 |
|------|------|------|
| article_no | VARCHAR | 문서 번호 KB-T0001 |
| title | VARCHAR | 제목 |
| content | TEXT | 내용(Markdown) |
| summary | TEXT | 요약 |
| category_code | VARCHAR | 분류 코드 |
| keywords | JSONB | 키워드 |
| source_type | VARCHAR | 출처: ticket/faq/manual |
| source_ticket_id | BIGINT | 원본 티켓 ID |
| ai_generated | BOOLEAN | AI 생성 여부 |
| ai_quality_score | NUMERIC | 품질 점수 |
| status | VARCHAR | 상태: draft/published/archived |
| view_count | INT | 조회수 |
| helpful_count | INT | 도움이 됨 수 |

### 2.3 데이터 테이블 목록

| 번호 | 테이블명 | 설명 | 기록 유형 |
|------|------|------|----------|
| 1 | nb_tts_tickets | 티켓 메인 테이블 | 비즈니스 데이터 |
| 2 | nb_tts_biz_repair | 장비 수리 확장 | 비즈니스 데이터 |
| 3 | nb_tts_biz_it_support | IT 지원 확장 | 비즈니스 데이터 |
| 4 | nb_tts_biz_complaint | 고객 불만 확장 | 비즈니스 데이터 |
| 5 | nb_tts_customers | 고객 메인 테이블 | 비즈니스 데이터 |
| 6 | nb_tts_customer_contacts | 고객 연락처 | 비즈니스 데이터 |
| 7 | nb_tts_ticket_comments | 티켓 댓글 | 비즈니스 데이터 |
| 8 | nb_tts_ratings | 만족도 평가 | 비즈니스 데이터 |
| 9 | nb_tts_qa_articles | 지식 문서 | 지식 데이터 |
| 10 | nb_tts_qa_article_relations | 문서 연관 관계 | 지식 데이터 |
| 11 | nb_tts_faqs | 자주 묻는 질문 | 지식 데이터 |
| 12 | nb_tts_tickets_categories | 티켓 분류 | 설정 데이터 |
| 13 | nb_tts_sla_configs | SLA 설정 | 설정 데이터 |
| 14 | nb_tts_skill_configs | 기술 설정 | 설정 데이터 |
| 15 | nb_tts_business_types | 비즈니스 유형 | 설정 데이터 |

---

## 3. 티켓 생애주기

### 3.1 상태 정의

| 상태 | 명칭 | 설명 | SLA 타이머 | 색상 |
|------|------|------|---------|------|
| new | 신규 | 생성 직후, 배정 대기 중 | 시작 | 🔵 파란색 |
| assigned | 배정됨 | 처리자 지정됨, 접수 대기 중 | 계속 | 🔷 청록색 |
| processing | 처리 중 | 처리 진행 중 | 계속 | 🟠 주황색 |
| pending | 보류 | 고객 피드백 대기 중 | **일시 중지** | ⚫ 회색 |
| transferred | 전달됨 | 다른 담당자에게 전달됨 | 계속 | 🟣 보라색 |
| resolved | 해결됨 | 고객 확인 대기 중 | 정지 | 🟢 초록색 |
| closed | 종료 | 티켓 종료 | 정지 | ⚫ 회색 |
| cancelled | 취소 | 티켓 취소 | 정지 | ⚫ 회색 |

### 3.2 상태 흐름도

**메인 프로세스 (왼쪽에서 오른쪽으로)**

![ticketing-imgs-2025-12-31-22-51-45](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-21-01.png)

**분기 프로세스**

![ticketing-imgs-2025-12-31-22-52-42](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-14.png)

![ticketing-imgs-2025-12-31-22-52-53](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-22-32.png)


**전체 상태 머신**

![ticketing-imgs-2025-12-31-22-54-23](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-13.png)

### 3.3 주요 상태 전환 규칙

| 이전 상태 | 다음 상태 | 트리거 조건 | 시스템 동작 |
|----|----|---------|---------|
| new | assigned | 처리자 지정 | assigned_at 기록 |
| assigned | processing | 처리자가 "접수" 클릭 | 없음 |
| processing | pending | "보류" 클릭 | sla_paused_at 기록 |
| pending | processing | 고객 답변 / 수동 복구 | 일시 중지 시간 계산, paused_at 초기화 |
| processing | resolved | "해결" 클릭 | resolved_at 기록 |
| resolved | closed | 고객 확인 / 3일 경과 | closed_at 기록 |
| * | cancelled | 티켓 취소 | 없음 |


---

## 4. SLA 서비스 수준 관리

### 4.1 우선순위 및 SLA 설정

| 우선순위 | 명칭 | 응답 시간 | 해결 시간 | 경고 임계값 | 전형적인 시나리오 |
|--------|------|----------|----------|----------|----------|
| P0 | 긴급 | 15분 | 2시간 | 80% | 시스템 다운, 생산 라인 중단 |
| P1 | 높음 | 1시간 | 8시간 | 80% | 주요 기능 고장 |
| P2 | 중간 | 4시간 | 24시간 | 80% | 일반적인 문제 |
| P3 | 낮음 | 8시간 | 72시간 | 80% | 단순 문의, 제안 |

### 4.2 SLA 계산 로직

![ticketing-imgs-2025-12-31-22-53-54](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-23-46.png)

#### 티켓 생성 시

```
응답 마감 시간 = 제출 시간 + 응답 시한(분)
해결 마감 시간 = 제출 시간 + 해결 시한(분)
```

#### 보류 시 (pending)

```
SLA 일시 중지 시작 시간 = 현재 시간
```

#### 복구 시 (pending에서 processing으로 복귀)

```
-- 이번 일시 중지 기간 계산
이번 일시 중지 시간 = 현재 시간 - SLA 일시 중지 시작 시간

-- 누적 일시 중지 시간에 합산
누적 일시 중지 시간 = 누적 일시 중지 시간 + 이번 일시 중지 시간

-- 마감 시간 연장 (보류 기간은 SLA에 포함하지 않음)
응답 마감 시간 = 응답 마감 시간 + 이번 일시 중지 시간
해결 마감 시간 = 해결 마감 시간 + 이번 일시 중지 시간

-- 일시 중지 시작 시간 초기화
SLA 일시 중지 시작 시간 = NULL
```

#### SLA 위반 판정

```
-- 응답 위반 판정
응답 위반 여부 = (첫 응답 시간이 비어 있고 현재 시간 > 응답 마감 시간)
               또는 (첫 응답 시간 > 응답 마감 시간)

-- 해결 위반 판정
해결 위반 여부 = (해결 시간이 비어 있고 현재 시간 > 해결 마감 시간)
               또는 (해결 시간 > 해결 마감 시간)
```

### 4.3 SLA 경고 메커니즘

| 경고 등급 | 조건 | 알림 대상 | 알림 방식 |
|----------|------|----------|----------|
| 황색 경고 | 남은 시간 < 20% | 처리자 | 사내 알림 |
| 적색 경고 | 시간 초과 발생 | 처리자 + 관리자 | 사내 알림 + 이메일 |
| 에스컬레이션 경고 | 초과 후 1시간 경과 | 부서장 | 이메일 + SMS |

### 4.4 SLA 대시보드 지표

| 지표 | 계산 공식 | 정상 임계값 |
|------|----------|----------|
| 응답 달성률 | 미위반 티켓 수 / 전체 티켓 수 | > 95% |
| 해결 달성률 | 해결 미위반 수 / 해결된 티켓 수 | > 90% |
| 평균 응답 시간 | SUM(응답 시간) / 티켓 수 | < SLA의 50% |
| 평균 해결 시간 | SUM(해결 시간) / 티켓 수 | < SLA의 80% |

---

## 5. AI 능력 및 직원 시스템

### 5.1 AI 직원 팀

시스템에는 8명의 AI 직원이 설정되어 있으며, 두 가지 범주로 나뉩니다:

**신규 직원 (티켓 시스템 전용)**

| ID | 성함 | 직책 | 핵심 능력 |
|----|------|------|----------|
| sam | Sam | 서비스 데스크 슈퍼바이저 | 티켓 분류, 우선순위 평가, 에스컬레이션 결정, SLA 리스크 식별 |
| grace | Grace | 고객 성공 전문가 | 전문적인 답변 생성, 어조 조정, 불만 처리, 만족도 회복 |
| max | Max | 지식 어시스턴트 | 유사 사례 검색, 지식 추천, 솔루션 종합 |

**재사용 직원 (공통 능력)**

| ID | 성함 | 직책 | 핵심 능력 |
|----|------|------|----------|
| dex | Dex | 데이터 정리사 | 이메일/전화의 티켓화, 대량 데이터 정제 |
| ellis | Ellis | 이메일 전문가 | 이메일 감정 분석, 스레드 요약, 답변 초안 작성 |
| lexi | Lexi | 번역가 | 티켓 번역, 답변 번역, 실시간 대화 번역 |
| cole | Cole | NocoBase 전문가 | 시스템 사용 가이드, 워크플로우 설정 지원 |
| vera | Vera | 연구 분석가 | 기술 솔루션 연구, 제품 정보 확인 |

### 5.2 AI 작업 목록

각 AI 직원은 4개의 구체적인 작업을 수행하도록 설정됩니다:

#### Sam의 작업

| 작업 ID | 명칭 | 트리거 방식 | 설명 |
|--------|------|----------|------|
| SAM-01 | 티켓 분석 및 분류 | 워크플로우 자동 | 새 티켓 생성 시 자동 분석 |
| SAM-02 | 우선순위 재평가 | 프런트엔드 상호작용 | 새로운 정보에 따라 우선순위 조정 |
| SAM-03 | 에스컬레이션 결정 | 프런트엔드/워크플로우 | 에스컬레이션 필요 여부 판단 |
| SAM-04 | SLA 리스크 평가 | 워크플로우 자동 | 시간 초과 리스크 식별 |

#### Grace의 작업

| 작업 ID | 명칭 | 트리거 방식 | 설명 |
|--------|------|----------|------|
| GRACE-01 | 전문 답변 생성 | 프런트엔드 상호작용 | 문맥에 맞는 답변 생성 |
| GRACE-02 | 답변 어조 조정 | 프런트엔드 상호작용 | 기존 답변의 어조 최적화 |
| GRACE-03 | 불만 완화 처리 | 프런트엔드/워크플로우 | 고객 불만 해소 지원 |
| GRACE-04 | 만족도 회복 | 프런트엔드/워크플로우 | 부정적 경험 후 후속 조치 |

#### Max의 작업

| 작업 ID | 명칭 | 트리거 방식 | 설명 |
|--------|------|----------|------|
| MAX-01 | 유사 사례 검색 | 프런트엔드/워크플로우 | 과거 유사 티켓 검색 |
| MAX-02 | 지식 문서 추천 | 프런트엔드/워크플로우 | 관련 지식 문서 추천 |
| MAX-03 | 솔루션 종합 | 프런트엔드 상호작용 | 다중 소스 기반 솔루션 종합 |
| MAX-04 | 문제 해결 가이드 | 프런트엔드 상호작용 | 체계적인 점검 프로세스 생성 |

#### Lexi의 작업

| 작업 ID | 명칭 | 트리거 방식 | 설명 |
|--------|------|----------|------|
| LEXI-01 | 티켓 번역 | 워크플로우 자동 | 티켓 내용 번역 |
| LEXI-02 | 답변 번역 | 프런트엔드 상호작용 | 상담사 답변 번역 |
| LEXI-03 | 대량 번역 | 워크플로우 자동 | 대량 데이터 번역 처리 |
| LEXI-04 | 실시간 대화 번역 | 프런트엔드 상호작용 | 실시간 대화 내용 번역 |

### 5.3 AI 직원과 티켓 생애주기

![ticketing-imgs-2025-12-31-22-55-04](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-22.png)

### 5.4 AI 응답 예시

#### SAM-01 티켓 분석 응답

```json
{
  "category_code": "COMPUTER",
  "sentiment": "NEGATIVE",
  "urgency": "HIGH",
  "keywords": ["ERP", "로그인 실패", "시간 초과", "월말 결산"],
  "confidence": 0.92,
  "reasoning": "해당 티켓은 ERP 시스템 로그인 문제를 설명하며, 재무 부서의 월말 결산에 영향을 미치므로 긴급도가 높음",
  "suggested_reply": "고객님, 해당 문제를 접수해 주셔서 감사합니다...",
  "source_language_code": "zh",
  "is_translated": true,
  "description_translated": "안녕하세요, 저희 ERP 시스템에 로그인할 수 없습니다..."
}
```

#### GRACE-01 답변 생성 응답

```
장 선생님께,

ERP 로그인 문제로 연락해 주셔서 감사합니다. 이번 문제가 귀사의 월말 결산 업무에 지장을 주고 있다는 점을 충분히 이해하고 있으며, 해당 건을 최우선 순위로 지정하여 처리 중입니다.

현재 상황:
- 기술 팀에서 서버 연결 문제를 조사하고 있습니다.
- 30분 이내에 진행 상황을 다시 안내해 드리겠습니다.

그동안 다음 방법을 시도해 보실 수 있습니다:
1. 예비 주소로 접속: https://erp-backup.company.com
2. 긴급한 보고서가 필요한 경우, 저희에게 연락해 주시면 내보내기를 도와드리겠습니다.

다른 문의 사항이 있으시면 언제든지 말씀해 주십시오.

기술 지원 팀 드림
```

### 5.5 AI 감성 방화벽

Grace가 담당하는 답변 품질 검토는 다음과 같은 문제를 차단합니다:

| 문제 유형 | 원문 예시 | AI 제안 |
|----------|----------|--------|
| 부정적 어조 | "안 됩니다. 보증 범위 밖입니다." | "해당 고장은 현재 무상 보증 범위에 포함되지 않으나, 유상 수리 방안을 안내해 드릴 수 있습니다." |
| 고객 비난 | "직접 고장 내신 거잖아요." | "확인 결과, 해당 고장은 우발적인 파손으로 분류됩니다." |
| 책임 회피 | "저희 문제가 아닙니다." | "문제 원인을 더 자세히 파악할 수 있도록 도와드리겠습니다." |
| 무성의한 표현 | "모릅니다." | "관련 정보를 확인하여 안내해 드리겠습니다." |
| 민감 정보 | "비밀번호는 abc123입니다." | [차단] 민감 정보가 포함되어 전송할 수 없습니다. |

---

## 6. 지식베이스 체계

### 6.1 지식 출처

![ticketing-imgs-2025-12-31-22-55-20](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-24-57.png)


### 6.2 티켓의 지식화 프로세스

![ticketing-imgs-2025-12-31-22-55-38](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-18.png)

**평가 차원**:
- **범용성**: 자주 발생하는 문제인가?
- **완결성**: 솔루션이 명확하고 완전한가?
- **재사용성**: 단계를 다시 활용할 수 있는가?

### 6.3 지식 추천 메커니즘

상담사가 티켓 상세 정보를 열면 Max가 자동으로 관련 지식을 추천합니다:

```
┌────────────────────────────────────────────────────────────┐
│ 📚 추천 지식                                    [펼치기/접기]  │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ KB-T0042 CNC 서보 시스템 고장 진단 가이드        일치도: 94%    │ │
│ │ 포함 내용: 알람 코드 해석, 서보 드라이버 점검 단계                  │ │
│ │ [보기] [답변에 적용] [도움이 됨 표시]                        │ │
│ ├────────────────────────────────────────────────────────┤ │
│ │ KB-T0038 XYZ-CNC3000 시리즈 유지보수 매뉴얼        일치도: 87%    │ │
│ │ 포함 내용: 주요 고장 사례, 예방적 유지보수 계획                  │ │
│ │ [보기] [답변에 적용] [도움이 됨 표시]                        │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 7. 워크플로우 엔진

### 7.1 워크플로우 분류

| 번호 | 분류 | 설명 | 트리거 방식 |
|------|------|------|----------|
| WF-T | 티켓 프로세스 | 티켓 생애주기 관리 | 폼 이벤트 |
| WF-S | SLA 프로세스 | SLA 계산 및 경고 | 폼 이벤트/스케줄러 |
| WF-C | 댓글 프로세스 | 댓글 처리 및 번역 | 폼 이벤트 |
| WF-R | 평가 프로세스 | 평가 요청 및 통계 | 폼 이벤트/스케줄러 |
| WF-N | 알림 프로세스 | 알림 발송 | 이벤트 기반 |
| WF-AI | AI 프로세스 | AI 분석 및 생성 | 폼 이벤트 |

### 7.2 핵심 워크플로우

#### WF-T01: 티켓 생성 프로세스

![ticketing-imgs-2025-12-31-22-55-51](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-25-48.png)

#### WF-AI01: 티켓 AI 분석

![ticketing-imgs-2025-12-31-22-56-03](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-14.png)

#### WF-AI04: 댓글 번역 및 검토

![ticketing-imgs-2025-12-31-22-56-19](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-38.png)

#### WF-AI03: 지식 생성

![ticketing-imgs-2025-12-31-22-56-37](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-26-54.png)

### 7.3 예약 작업 (스케줄러)

| 작업 | 실행 주기 | 설명 |
|------|----------|------|
| SLA 경고 점검 | 5분마다 | 마감 임박 티켓 확인 |
| 티켓 자동 종료 | 매일 | resolved 상태로 3일 경과 시 자동 종료 |
| 평가 요청 발송 | 매일 | 종료 24시간 후 평가 요청 발송 |
| 통계 데이터 업데이트 | 매시간 | 고객별 티켓 통계 업데이트 |

---

## 8. 메뉴 및 인터페이스 설계

### 8.1 백엔드 관리자 화면

![ticketing-imgs-2025-12-31-22-59-10](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-19.png)

### 8.2 고객 포털 화면

![ticketing-imgs-2025-12-31-22-59-32](https://static-docs.nocobase.com/ticketing-imgs-en-2025-12-31-23-27-35.png)

### 8.3 대시보드 설계

#### 경영진 뷰 (Executive View)

| 컴포넌트 | 유형 | 데이터 설명 |
|------|------|----------|
| SLA 달성률 | 게이지 차트 | 이번 달 응답/해결 달성률 |
| 만족도 추이 | 선형 차트 | 최근 30일 만족도 변화 |
| 티켓량 추이 | 막대 차트 | 최근 30일 티켓 발생량 |
| 비즈니스 유형 분포 | 파이 차트 | 비즈니스 유형별 비중 |

#### 관리자 뷰 (Supervisor View)

| 컴포넌트 | 유형 | 데이터 설명 |
|------|------|----------|
| 시간 초과 경고 | 목록 | 마감 임박/초과 티켓 |
| 인원별 업무량 | 막대 차트 | 팀원별 처리 티켓 수 |
| 미처리 분포 | 누적 차트 | 상태별 티켓 수량 |
| 처리 시효 | 히트맵 | 평균 처리 시간 분포 |

#### 상담사 뷰 (Agent View)

| 컴포넌트 | 유형 | 데이터 설명 |
|------|------|----------|
| 나의 할 일 | 숫자 카드 | 처리 대기 중인 티켓 수 |
| 우선순위 분포 | 파이 차트 | P0/P1/P2/P3 분포 |
| 오늘의 통계 | 지표 카드 | 오늘 처리/해결 수 |
| SLA 카운트다운 | 목록 | 가장 긴급한 티켓 5건 |

---

## 부록

### A. 비즈니스 유형 설정

| 유형 코드 | 명칭 | 아이콘 | 관련 확장 테이블 |
|----------|------|------|------------|
| repair | 장비 수리 | 🔧 | nb_tts_biz_repair |
| it_support | IT 지원 | 💻 | nb_tts_biz_it_support |
| complaint | 고객 불만 | 📢 | nb_tts_biz_complaint |
| consultation | 문의 및 제안 | ❓ | 없음 |
| other | 기타 | 📝 | 없음 |

### B. 분류 코드

| 코드 | 명칭 | 설명 |
|------|------|------|
| CONVEYOR | 컨베이어 시스템 | 컨베이어 시스템 문제 |
| PACKAGING | 포장기 | 포장기 문제 |
| WELDING | 용접 장비 | 용접 장비 문제 |
| COMPRESSOR | 공기 압축기 | 공기 압축기 문제 |
| COLD_STORE | 냉동고 | 냉동고 문제 |
| CENTRAL_AC | 중앙 냉난방 | 중앙 냉난방 문제 |
| FORKLIFT | 지게차 | 지게차 문제 |
| COMPUTER | 컴퓨터 | 컴퓨터 하드웨어 문제 |
| PRINTER | 프린터 | 프린터 문제 |
| PROJECTOR | 프로젝터 | 프로젝터 문제 |
| INTERNET | 네트워크 | 네트워크 연결 문제 |
| EMAIL | 이메일 | 이메일 시스템 문제 |
| ACCESS | 권한 | 계정 권한 문제 |
| PROD_INQ | 제품 문의 | 제품 관련 문의 |
| COMPLAINT | 일반 불만 | 일반적인 고객 불만 |
| DELAY | 배송 지연 | 물류 배송 지연 불만 |
| DAMAGE | 포장 파손 | 포장 파손 관련 불만 |
| QUANTITY | 수량 부족 | 제품 수량 부족 불만 |
| SVC_ATTITUDE | 서비스 태도 | 서비스 태도 관련 불만 |
| PROD_QUALITY | 제품 품질 | 제품 품질 관련 불만 |
| TRAINING | 교육 | 교육 요청 |
| RETURN | 반품 | 반품 요청 |

---

*문서 버전: 2.0 | 최종 업데이트: 2026-01-05*