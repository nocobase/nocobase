:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/ai-employees/quick-start)을 참조하세요.
:::

# 빠른 시작

5분 만에 AI 직원의 최소 가용 구성을 완료해 보겠습니다.

## 플러그인 설치

AI 직원은 NocoBase 내장 플러그인(`@nocobase/plugin-ai`)으로, 별도의 설치가 필요하지 않습니다.

## 모델 설정

다음 중 하나의 경로를 통해 LLM 서비스를 설정할 수 있습니다.

1. 관리자 설정: `시스템 설정 -> AI 직원 -> LLM 서비스(LLM service)`.
2. 프론트엔드 바로가기: AI 대화 패널의 `Model Switcher`에서 모델을 선택할 때, "LLM 서비스 추가" 바로가기를 클릭하여 직접 이동할 수 있습니다.

![quick-start-model-switcher-add-llm-service.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/quick-start-model-switcher-add-llm-service.png)

일반적으로 다음 사항을 확인해야 합니다.
1. 제공자(Provider) 선택.
2. API 키 입력.
3. `활성화된 모델(Enabled Models)` 설정 (기본적으로 Recommend를 사용하면 됩니다).

## 내장 직원 활성화

내장된 AI 직원은 기본적으로 모두 활성화되어 있으며, 보통 일일이 수동으로 켤 필요가 없습니다.

사용 범위를 조정(특정 직원 활성화/비활성화)해야 하는 경우, `시스템 설정 -> AI 직원` 목록 페이지에서 `활성화(Enabled)` 스위치를 수정할 수 있습니다.

![ai-employee-list-enable-switch.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-list-enable-switch.png)

## 협업 시작하기

애플리케이션 페이지 우측 하단의 바로가기 아이콘에 마우스를 올리고 AI 직원을 선택합니다.
![ai-employees-entry-bottom-right.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employees-entry-bottom-right.png)

클릭하여 AI 대화창을 엽니다.

![chat-footer-employee-switcher-and-model-switcher.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/chat-footer-employee-switcher-and-model-switcher.png)

다음과 같은 작업도 가능합니다.
* 블록 추가
* 첨부 파일 추가
* 웹 검색 활성화
* AI 직원 전환
* 모델 선택

AI 직원은 페이지 구조를 컨텍스트로 자동 가져올 수도 있습니다. 예를 들어, 폼 블록에 있는 Dex는 폼의 필드 구조를 자동으로 파악하고 적절한 스킬을 호출하여 페이지 작업을 수행합니다.

## 바로가기 작업

각 AI 직원에 대해 현재 위치에서 자주 사용하는 작업을 미리 설정할 수 있습니다. 클릭 한 번으로 작업을 시작할 수 있어 빠르고 편리합니다.

<video controls class="rounded shadow"><source src="https://static-docs.nocobase.com/z-2025-11-02-12.19.33-2025-11-02-12-19-49.mp4" type="video/mp4"></video>

## 내장 직원 목록

NocoBase는 다양한 시나리오에 특화된 여러 내장 AI 직원을 제공합니다.

다음 단계만 거치면 됩니다.

1. LLM 서비스를 설정합니다.
2. 필요에 따라 직원의 활성화 상태를 조정합니다(기본적으로 활성화됨).
3. 대화에서 모델을 선택하고 협업을 시작합니다.

| 직원 이름 | 역할 정의 | 핵심 역량 |
| :--- | :--- | :--- |
| **Cole** | NocoBase 어시스턴트 | 제품 사용 Q&A, 문서 검색 |
| **Ellis** | 이메일 전문가 | 이메일 작성, 요약 생성, 회신 제안 |
| **Dex** | 데이터 정리 전문가 | 필드 번역, 포맷팅, 정보 추출 |
| **Viz** | 인사이트 분석가 | 데이터 인사이트, 트렌드 분석, 핵심 지표 해석 |
| **Lexi** | 번역 어시스턴트 | 다국어 번역, 커뮤니케이션 지원 |
| **Vera** | 리서치 분석가 | 웹 검색, 정보 취합, 심층 연구 |
| **Dara** | 데이터 시각화 전문가 | 차트 설정, 시각화 보고서 생성 |
| **Orin** | 데이터 모델링 전문가 | 컬렉션 구조 설계 지원, 필드 제안 |
| **Nathan** | 프론트엔드 엔지니어 | 프론트엔드 코드 스니펫 작성 지원, 스타일 조정 |

**참고**

일부 내장 AI 직원은 전용 작업 시나리오가 있어 우측 하단 목록에 나타나지 않습니다.

- Orin: 데이터 모델링 페이지.
- Dara: 차트 설정 블록.
- Nathan: JS 블록 등 코드 에디터.