:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 상세 필드

## 소개

상세 블록, 목록 블록, 그리드 블록 등의 필드 설정은 기본적으로 동일하며, 주로 읽기 모드에서 필드가 어떻게 표시될지 제어합니다.

![20251025172851](https://static-docs.nocobase.com/20251025172851.png)

## 필드 설정 옵션

### 날짜 필드 형식 지정

![20251025173005](https://static-docs.nocobase.com/20251025173005.png)

더 자세한 내용은 [날짜 형식 지정](/interface-builder/fields/specific/date-picker)을 참고하세요.

### 숫자 필드 형식 지정

![20251025173242](https://static-docs.nocobase.com/20251025173242.png)

간단한 단위 변환, 천 단위 구분 기호, 접두사 및 접미사, 정밀도, 과학적 표기법을 지원합니다.

더 자세한 내용은 [숫자 형식 지정](/interface-builder/fields/field-settings/number-format)을 참고하세요.

### 클릭하여 열기 활성화

관계 필드 외에도 클릭 시 팝업을 여는 기능을 지원하며, 일반 필드도 클릭하여 팝업을 여는 진입점으로 설정할 수 있습니다. 또한 팝업 열기 방식(서랍, 대화 상자, 하위 페이지)을 설정할 수 있습니다.

![20251025173549](https://static-docs.nocobase.com/20251025173549.gif)

### 콘텐츠 오버플로 표시 방식

필드 내용이 너비를 초과할 때 오버플로 방식을 설정할 수 있습니다.

- 생략 표시 (기본값)
- 줄 바꿈

![20251025173917](https://static-docs.nocobase.com/20251025173917.png)

### 필드 컴포넌트

일부 필드는 다양한 표시 형태를 지원하며, 필드 컴포넌트를 전환하여 구현할 수 있습니다.

예를 들어: `URL` 컴포넌트를 `Preview` 컴포넌트로 전환할 수 있습니다.

![20251025174042](https://static-docs.nocobase.com/20251025174042.png)

예를 들어: 관계 필드는 다양한 방식으로 표시될 수 있으며, 제목 필드 컴포넌트에서 `하위 상세`로 전환하여 더 많은 관계 필드 내용을 표시할 수 있습니다.

![20251025174311](https://static-docs.nocobase.com/20251025174311.gif)

- [필드 제목 편집](/interface-builder/fields/field-settings/edit-title)
- [필드 설명 편집](/interface-builder/fields/field-settings/edit-description)
- [필드 툴팁 편집](/interface-builder/fields/field-settings/edit-tooltip)