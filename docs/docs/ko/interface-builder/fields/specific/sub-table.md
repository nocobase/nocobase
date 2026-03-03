:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/interface-builder/fields/specific/sub-table)을 참조하세요.
:::

# 서브 테이블(인라인 편집)

## 소개

서브 테이블은 다대 관계 필드를 처리하는 데 적합하며, 대상 컬렉션 데이터를 일괄 생성한 후 연결하거나 기존 데이터에서 선택하여 연결하는 것을 지원합니다.

## 사용 설명

![20251027223350](https://static-docs.nocobase.com/20251027223350.png)

서브 테이블의 서로 다른 유형의 필드는 서로 다른 필드 컴포넌트를 표시하며, 큰 필드(리치 텍스트, JSON, 여러 줄 텍스트 등)는 플로팅 팝업을 통해 편집합니다.

![20251027223426](https://static-docs.nocobase.com/20251027223426.png)

서브 테이블의 관계 필드입니다.

주문 (일대다) > Order Products (일대일) > Opportunity

![20251027223530](https://static-docs.nocobase.com/20251027223530.png)

관계 필드 컴포넌트의 기본값은 드롭다운 선택기입니다(드롭다운 선택기/데이터 선택기 지원).

![20251027223754](https://static-docs.nocobase.com/20251027223754.png)

## 필드 설정 항목

### 기존 데이터 선택 허용(기본적으로 활성화)

기존 데이터에서 선택하여 연결하는 것을 지원합니다.
![20251027224008](https://static-docs.nocobase.com/20251027224008.png)

![20251027224023](https://static-docs.nocobase.com/20251027224023.gif)

### 필드 컴포넌트

[필드 컴포넌트](/interface-builder/fields/association-field): 드롭다운 선택, 데이터 선택기 등 다른 관계 필드 컴포넌트로 전환합니다.

### 기존 데이터 연결 해제 허용

> 편집 양식 내 관계 필드 데이터의 기존 데이터 연결 해제 허용 여부입니다.

![20251028153425](https://static-docs.nocobase.com/20251028153425.gif)