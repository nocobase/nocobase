:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 컨텍스트 변수 사용하기

컨텍스트 변수를 사용하면 현재 페이지, 사용자, 시간, 필터 조건 등의 정보를 직접 재사용하여 컨텍스트에 따라 차트를 렌더링하고 연동할 수 있습니다.

## 적용 범위
- 데이터 쿼리 빌더 모드의 필터 조건에서 변수를 선택하여 사용합니다.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- 데이터 쿼리 SQL 모드에서 구문을 작성할 때 변수를 선택하고 표현식을 삽입합니다(예: `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- 차트 옵션의 커스텀(Custom) 모드에서 JS 표현식을 직접 작성합니다.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- 상호 작용 이벤트(예: 드릴다운 클릭으로 팝업을 열고 데이터를 전달하는 경우)에서 JS 표현식을 직접 작성합니다.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**주의:**
- `{{ ... }}`에 단일/이중 따옴표를 추가하지 마세요. 바인딩 시 시스템이 변수 유형(문자열, 숫자, 시간, NULL)에 따라 안전하게 처리합니다.
- 변수가 `NULL`이거나 정의되지 않은 경우, SQL에서 `COALESCE(...)` 또는 `IS NULL`을 사용하여 명시적으로 NULL 값을 처리하세요.