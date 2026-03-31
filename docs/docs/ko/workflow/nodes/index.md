:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 개요

하나의 워크플로우는 일반적으로 여러 작업 단계가 연결되어 구성됩니다. 각 노드는 하나의 작업 단계를 나타내며, 워크플로우의 기본 논리 단위 역할을 합니다. 프로그래밍 언어와 마찬가지로, 다양한 유형의 노드는 각기 다른 명령을 나타내며 노드의 동작을 결정합니다. 워크플로우가 실행되면 시스템은 각 노드에 순서대로 진입하여 해당 노드의 명령을 실행합니다.

:::info{title=참고}
워크플로우의 트리거는 노드에 속하지 않습니다. 플로우차트에서 진입 노드 형태로 표시될 뿐이며, 노드와는 다른 개념입니다. 자세한 내용은 [트리거](../triggers/index.md) 문서를 참고해 주십시오.
:::

기능적인 관점에서 현재 구현된 노드들은 몇 가지 주요 범주로 나눌 수 있습니다 (총 29가지 노드):

- 인공지능
  - [대규모 언어 모델](../../ai-employees/workflow/nodes/llm/chat.md) (플러그인 @nocobase/plugin-workflow-llm 에서 제공)
- 워크플로우 제어
  - [조건 판단](./condition.md)
  - [다중 조건 분기](./multi-conditions.md)
  - [반복](./loop.md) (플러그인 @nocobase/plugin-workflow-loop 에서 제공)
  - [변수](./variable.md) (플러그인 @nocobase/plugin-workflow-variable 에서 제공)
  - [병렬 분기](./parallel.md) (플러그인 @nocobase/plugin-workflow-parallel 에서 제공)
  - [워크플로우 호출](./subflow.md) (플러그인 @nocobase/plugin-workflow-subflow 에서 제공)
  - [워크플로우 출력](./output.md) (플러그인 @nocobase/plugin-workflow-subflow 에서 제공)
  - [JSON 변수 매핑](./json-variable-mapping.md) (플러그인 @nocobase/plugin-workflow-json-variable-mapping 에서 제공)
  - [지연](./delay.md) (플러그인 @nocobase/plugin-workflow-delay 에서 제공)
  - [워크플로우 종료](./end.md)
- 계산
  - [계산](./calculation.md)
  - [날짜 계산](./date-calculation.md) (플러그인 @nocobase/plugin-workflow-date-calculation 에서 제공)
  - [JSON 계산](./json-query.md) (플러그인 @nocobase/plugin-workflow-json-query 에서 제공)
- 컬렉션 작업
  - [데이터 생성](./create.md)
  - [데이터 업데이트](./update.md)
  - [데이터 삭제](./destroy.md)
  - [데이터 조회](./query.md)
  - [집계 쿼리](./aggregate.md) (플러그인 @nocobase/plugin-workflow-aggregate 에서 제공)
  - [SQL 작업](./sql.md) (플러그인 @nocobase/plugin-workflow-sql 에서 제공)
- 수동 처리
  - [수동 처리](./manual.md) (플러그인 @nocobase/plugin-workflow-manual 에서 제공)
  - [승인](./approval.md) (플러그인 @nocobase/plugin-workflow-approval 에서 제공)
  - [참조](./cc.md) (플러그인 @nocobase/plugin-workflow-cc 에서 제공)
- 기타 확장
  - [HTTP 요청](./request.md) (플러그인 @nocobase/plugin-workflow-request 에서 제공)
  - [JavaScript](./javascript.md) (플러그인 @nocobase/plugin-workflow-javascript 에서 제공)
  - [이메일 전송](./mailer.md) (플러그인 @nocobase/plugin-workflow-mailer 에서 제공)
  - [알림](../../notification-manager/index.md#워크플로우-알림-노드) (플러그인 @nocobase/plugin-workflow-notification 에서 제공)
  - [응답](./response.md) (플러그인 @nocobase/plugin-workflow-webhook 에서 제공)
  - [응답 메시지](./response-message.md) (플러그인 @nocobase/plugin-workflow-response-message 에서 제공)