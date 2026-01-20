:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# JS 온라인 작성 및 실행

NocoBase에서 **RunJS**는 **빠른 실험 및 임시 로직 처리**와 같은 상황에 적합한 가벼운 확장 방법을 제공합니다. 플러그인을 생성하거나 소스 코드를 수정할 필요 없이, JavaScript를 통해 인터페이스나 상호 작용을 맞춤 설정할 수 있습니다.

이를 통해 UI 빌더에서 JS 코드를 직접 입력하여 다음을 구현할 수 있습니다:

- 사용자 지정 렌더링 콘텐츠 (필드, 블록, 열, 항목 등)
- 사용자 지정 상호 작용 로직 (버튼 클릭, 이벤트 연동)
- 컨텍스트 데이터와 결합하여 동적 동작 구현

## 지원되는 시나리오

### JS 블록

JS를 통해 블록 렌더링을 사용자 지정하여 블록의 구조와 스타일을 완벽하게 제어할 수 있습니다. 이는 사용자 지정 컴포넌트, 통계 차트, 타사 콘텐츠 등 매우 유연한 시나리오에 적합합니다.

![20250916105031](https://static-docs.nocobase.com/20250916105031.png)

문서: [JS 블록](/interface-builder/blocks/other-blocks/js-block)

### JS 액션

JS를 통해 액션 버튼의 클릭 로직을 사용자 지정하여 모든 프런트엔드 또는 API 요청 작업을 실행할 수 있습니다. 예를 들어, 값을 동적으로 계산하거나, 사용자 지정 데이터를 제출하거나, 팝업을 트리거하는 등의 작업이 가능합니다.

![20250916105123](https://static-docs.nocobase.com/20250916105123.png)

문서: [JS 액션](/interface-builder/actions/types/js-action)

### JS 필드

JS를 통해 필드의 렌더링 로직을 사용자 지정합니다. 필드 값에 따라 다양한 스타일, 콘텐츠 또는 상태를 동적으로 표시할 수 있습니다.

![20250916105354](https://static-docs.nocobase.com/20250916105354.png)

문서: [JS 필드](/interface-builder/fields/specific/js-field)

### JS 항목

JS를 통해 특정 필드에 바인딩되지 않은 독립적인 항목을 렌더링합니다. 주로 사용자 지정 정보 블록을 표시하는 데 사용됩니다.

![20250916104848](https://static-docs.nocobase.com/20250916104848.png)

문서: [JS 항목](/interface-builder/fields/specific/js-item)

### JS 테이블 열

JS를 통해 테이블 열 렌더링을 사용자 지정합니다. 진행률 표시줄, 상태 레이블 등 복잡한 셀 표시 로직을 구현할 수 있습니다.

![20250916105443](https://static-docs.nocobase.com/20250916105443.png)

문서: [JS 테이블 열](/interface-builder/fields/specific/js-column)

### 연동 규칙

JS를 통해 양식이나 페이지에서 필드 간의 연동 로직을 제어합니다. 예를 들어, 한 필드가 변경될 때 다른 필드의 값이나 가시성을 동적으로 수정할 수 있습니다.

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

문서: [연동 규칙](/interface-builder/linkage-rule)

### 이벤트 플로우

JS를 통해 이벤트 플로우의 트리거 조건과 실행 로직을 사용자 지정하여 더 복잡한 프런트엔드 상호 작용 체인을 구축할 수 있습니다.

![](https://static-docs.nocobase.com/20251031092755.png)

문서: [이벤트 플로우](/interface-builder/event-flow)