---
pkg: "@nocobase/plugin-action-bulk-edit"
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/interface-builder/actions/types/bulk-edit)을 참조하세요.
:::

# 일괄 편집

## 소개

일괄 편집은 데이터를 유연하게 대량으로 업데이트해야 하는 시나리오에 적합합니다. 일괄 편집 버튼을 클릭하면 팝업 창에서 일괄 편집 양식을 구성하고, 각 필드에 대해 서로 다른 업데이트 전략을 설정할 수 있습니다.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM.png)


## 작업 설정

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_13_AM%20(1).png)


## 사용 가이드

### 일괄 편집 양식 설정

1. 일괄 편집 버튼을 추가합니다.

2. 일괄 편집 범위를 설정합니다: 선택됨/전체, 기본값은 선택됨입니다.

![](https://static-docs.nocobase.com/Orders-02-12-2026_07_14_AM.png)

3. 일괄 편집 양식을 추가합니다.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_14_AM.png)

4. 편집할 필드를 구성하고 제출 버튼을 추가합니다.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM%20(1).png)

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_07_15_AM.png)

### 양식 제출

1. 편집할 행 데이터를 선택합니다.

2. 필드의 편집 모드를 선택하고 제출할 값을 입력합니다.

![](https://static-docs.nocobase.com/Bulk-edit-02-12-2026_10_33_AM.png)

:::info{title=사용 가능한 편집 모드}
* **업데이트 안 함**: 해당 필드를 변경하지 않고 유지합니다.
* **다음으로 변경**: 해당 필드를 제출된 값으로 업데이트합니다.
* **비우기**: 해당 필드의 데이터를 삭제합니다.

:::

3. 양식을 제출합니다.