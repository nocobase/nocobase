:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/ai-employees/features/new-ai-employees)을 참조하세요.
:::

# 새로운 AI 직원 생성

기본으로 제공되는 AI 직원이 요구 사항에 맞지 않는 경우, 자신만의 AI 직원을 직접 생성하고 맞춤 설정할 수 있습니다.

## 생성 시작하기

`AI employees` 관리 페이지로 이동하여 `New AI employee`를 클릭합니다.

## 기본 정보 설정

`Profile` 탭에서 다음 항목을 설정합니다:

- `Username`: 고유 식별자입니다.
- `Nickname`: 표시되는 이름입니다.
- `Position`: 직무 설명입니다.
- `Avatar`: 직원의 아바타 이미지입니다.
- `Bio`: 간단한 소개입니다.
- `About me`: 시스템 프롬프트입니다.
- `Greeting message`: 대화 시작 시의 환영 메시지입니다.

![ai-employee-create-without-model-settings-tab.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-create-without-model-settings-tab.png)

## 역할 설정 (Role setting)

`Role setting` 탭에서 직원의 시스템 프롬프트(System Prompt)를 설정합니다. 이 내용은 대화 중 직원의 정체성, 목표, 업무 범위 및 출력 스타일을 정의합니다.

다음 내용을 포함하는 것을 권장합니다:

- 역할 정의 및 책임 범위.
- 작업 처리 원칙 및 답변 구조.
- 금지 사항, 정보 범위 및 어조/스타일.

필요에 따라 변수(예: 현재 사용자, 현재 역할, 현재 언어, 시간)를 삽입하여 프롬프트가 다양한 대화 상황에 맞춰 자동으로 조정되도록 할 수 있습니다.

![ai-employee-role-setting-system-prompt.png](https://static-docs.nocobase.com/ai-employees/2026-02-14/ai-employee-role-setting-system-prompt.png)

## 기술 및 지식 설정

`Skills` 탭에서 기술 권한을 설정합니다. 지식 베이스 기능이 활성화된 경우, 관련 탭에서 설정을 이어갈 수 있습니다.

## 생성 완료

`Submit`을 클릭하여 생성을 완료합니다.