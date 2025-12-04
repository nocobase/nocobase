:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# SQL 모드에서 데이터 쿼리하기

"데이터 쿼리" 패널에서 SQL 모드로 전환하여 쿼리문을 작성하고 실행하세요. 반환된 결과를 바로 사용하여 차트를 매핑하고 렌더링할 수 있습니다.

![20251027075805](https://static-docs.nocobase.com/20251027075805.png)

## SQL 문 작성하기
- "데이터 쿼리" 패널에서 "SQL" 모드를 선택합니다.
- SQL을 입력하고 "쿼리 실행"을 클릭하여 실행합니다.
- 복잡한 다중 테이블 JOIN, VIEW 등을 포함한 완전한 SQL 문을 지원합니다.

예시: 월별 주문 금액 통계
```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon,
  SUM(total_amount) AS total
FROM "order"
GROUP BY mon
ORDER BY mon ASC
LIMIT 100;
```

## 결과 확인하기
- "데이터 보기"를 클릭하여 데이터 결과 미리보기 패널을 엽니다.

![20251027080014](https://static-docs.nocobase.com/20251027080014.png)

데이터는 페이지별로 표시되며, 테이블/JSON 간 전환하여 열 이름과 유형을 확인할 수 있습니다.
![20251027080100](https://static-docs.nocobase.com/20251027080100.png)

## 필드 매핑
- "차트 옵션" 설정에서 쿼리 데이터 결과 열을 기반으로 매핑을 완료합니다.
- 기본적으로 첫 번째 열은 차원의 역할(X축 또는 범주)을 하며, 두 번째 열은 측정값(Y축 또는 값)으로 사용됩니다. 따라서 SQL에서 필드 순서에 유의하세요.

```sql
SELECT 
  TO_CHAR(order_date, 'YYYY-MM') as mon, -- 첫 번째 열에 차원 필드
  SUM(total_amount) AS total -- 뒤에 측정값 필드
```

![clipboard-image-1761524022](https://static-docs.nocobase.com/clipboard-image-1761524022.png)

## 컨텍스트 변수 사용하기
SQL 편집기 오른쪽 상단에 있는 x 버튼을 클릭하여 컨텍스트 변수를 선택할 수 있습니다.

![20251027081752](https://static-docs.nocobase.com/20251027081752.png)

선택을 확인하면 SQL 텍스트 커서 위치(또는 선택된 내용 위치)에 변수 표현식이 삽입됩니다.

예를 들어 `{{ ctx.user.createdAt }}`와 같습니다. 따옴표를 직접 추가하지 마세요.

![20251027081957](https://static-docs.nocobase.com/20251027081957.png)

## 더 많은 예시
더 많은 사용 예시는 NocoBase [데모 앱](https://demo3.sg.nocobase.com/admin/5xrop8s0bui)을 참고하세요.

**권장 사항:**
- 나중에 오류가 발생하는 것을 방지하려면 열 이름을 안정화한 후에 차트 매핑을 진행하세요.
- 디버깅 단계에서는 `LIMIT`를 설정하여 반환되는 행 수를 줄이고 미리보기를 빠르게 할 수 있습니다.

## 미리보기, 저장 및 롤백
- "쿼리 실행"을 클릭하면 데이터를 요청하고 차트 미리보기를 새로 고칩니다.
- "저장"을 클릭하면 현재 SQL 텍스트 및 관련 설정을 데이터베이스에 저장합니다.
- "취소"를 클릭하면 마지막으로 저장된 상태로 돌아가고 현재 저장되지 않은 변경 사항을 버립니다.