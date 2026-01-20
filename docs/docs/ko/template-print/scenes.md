
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# "템플릿 인쇄" 기능으로 "공급 및 구매 계약서" 예시 생성하기

공급망 또는 무역 환경에서는 표준화된 "공급 및 구매 계약서"를 신속하게 생성하고, 데이터 소스의 구매자, 판매자, 상품 상세 정보 등을 기반으로 내용을 동적으로 채워야 하는 경우가 많습니다. 여기서는 간소화된 "계약" 사용 사례를 예로 들어, "템플릿 인쇄" 기능을 설정하고 사용하는 방법을 보여드리겠습니다. 이 기능을 통해 데이터 정보를 계약 템플릿의 플레이스홀더에 매핑하여 최종 계약 문서를 자동으로 생성할 수 있습니다.

---

## 1. 배경 및 데이터 구조 개요

이 예시에서는 다음과 같은 주요 컬렉션이 있습니다(관련 없는 다른 필드는 생략합니다).

- **parties**: 갑/을 당사자의 기업 또는 개인 정보(이름, 주소, 담당자, 전화번호 등)를 저장합니다.
- **contracts**: 특정 계약 기록(계약 번호, 구매자/판매자 외래 키, 서명자 정보, 시작/종료일, 은행 계좌 등)을 저장합니다.
- **contract_line_items**: 해당 계약의 여러 항목(상품명, 사양, 수량, 단가, 납품일 등)을 저장하는 데 사용됩니다.

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

현재 시스템은 단일 레코드 인쇄만 지원하므로, "계약 상세" 페이지에서 "인쇄"를 클릭하면 시스템이 해당 contracts 레코드와 연결된 parties 등의 정보를 자동으로 가져와 Word 또는 PDF 문서에 채워 넣습니다.

## 2. 준비 작업

### 2.1 플러그인 준비

참고로, "템플릿 인쇄"는 상용 플러그인입니다. 인쇄 작업을 수행하려면 구매 및 활성화가 필요합니다.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**플러그인 활성화 확인:**

아무 페이지에서나 상세 블록(예: users)을 생성하고, 작업 설정에 해당 템플릿 설정 옵션이 있는지 확인합니다.

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 컬렉션 생성

위에 설계된 주체 컬렉션, 계약 컬렉션, 상품 항목 컬렉션을 생성합니다(핵심 필드만 선택).

#### 계약 컬렉션 (Contracts)

| 필드 분류 | 필드 표시 이름 | 필드 이름 | 필드 인터페이스 |
|---------|-------------------|------------|-----------------|
| **PK 및 FK 필드** | | | |
| | ID | id | Integer |
| | 구매자 ID | buyer_id | Integer |
| | 판매자 ID | seller_id | Integer |
| **연관 필드** | | | |
| | 계약 항목 | contract_items | One to many |
| | 구매자 (갑) | buyer | Many to one |
| | 판매자 (을) | seller | Many to one |
| **일반 필드** | | | |
| | 계약 번호 | contract_no | Single line text |
| | 납품 시작일 | start_date | Datetime (with time zone) |
| | 납품 종료일 | end_date | Datetime (with time zone) |
| | 계약금 비율 (%) | deposit_ratio | Percent |
| | 납품 후 결제일 | payment_days_after | Integer |
| | 은행 계좌명 (수익자) | bank_account_name | Single line text |
| | 은행명 | bank_name | Single line text |
| | 은행 계좌 번호 (수익자) | bank_account_number | Single line text |
| | 총액 | total_amount | Number |
| | 통화 코드 | currency_codes | Single select |
| | 잔금 비율 (%) | balance_ratio | Percent |
| | 잔금 납부 후 일수 | balance_days_after | Integer |
| | 납품 장소 | delivery_place | Long text |
| | 갑 서명자 이름 | party_a_signatory_name | Single line text |
| | 갑 서명자 직책 | party_a_signatory_title | Single line text |
| | 을 서명자 이름 | party_b_signatory_name | Single line text |
| | 을 서명자 직책 | party_b_signatory_title | Single line text |
| **시스템 필드** | | | |
| | 생성일 | createdAt | Created at |
| | 생성자 | createdBy | Created by |
| | 최종 수정일 | updatedAt | Last updated at |
| | 최종 수정자 | updatedBy | Last updated by |

#### 주체 컬렉션 (Parties)

| 필드 분류 | 필드 표시 이름 | 필드 이름 | 필드 인터페이스 |
|---------|-------------------|------------|-----------------|
| **PK 및 FK 필드** | | | |
| | ID | id | Integer |
| **일반 필드** | | | |
| | 당사자 이름 | party_name | Single line text |
| | 주소 | address | Single line text |
| | 담당자 | contact_person | Single line text |
| | 연락처 | contact_phone | Phone |
| | 직책 | position | Single line text |
| | 이메일 | email | Email |
| | 웹사이트 | website | URL |
| **시스템 필드** | | | |
| | 생성일 | createdAt | Created at |
| | 생성자 | createdBy | Created by |
| | 최종 수정일 | updatedAt | Last updated at |
| | 최종 수정자 | updatedBy | Last updated by |

#### 계약 항목 컬렉션 (Contract Line Items)

| 필드 분류 | 필드 표시 이름 | 필드 이름 | 필드 인터페이스 |
|---------|-------------------|------------|-----------------|
| **PK 및 FK 필드** | | | |
| | ID | id | Integer |
| | 계약 ID | contract_id | Integer |
| **연관 필드** | | | |
| | 계약 | contract | Many to one |
| **일반 필드** | | | |
| | 상품명 | product_name | Single line text |
| | 사양 / 모델 | spec | Single line text |
| | 수량 | quantity | Integer |
| | 단가 | unit_price | Number |
| | 총액 | total_amount | Number |
| | 납품일 | delivery_date | Datetime (with time zone) |
| | 비고 | remark | Long text |
| **시스템 필드** | | | |
| | 생성일 | createdAt | Created at |
| | 생성자 | createdBy | Created by |
| | 최종 수정일 | updatedAt | Last updated at |
| | 최종 수정자 | updatedBy | Last updated by |

### 2.3 인터페이스 설정

**예시 데이터 입력:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**연동 규칙은 다음과 같이 설정하여 총액과 후불 항목을 자동으로 계산합니다:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**보기 블록을 생성하고 데이터를 확인한 후, "템플릿 인쇄" 작업을 활성화합니다:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 템플릿 인쇄 플러그인 설정

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

"공급 및 구매 계약서"와 같은 템플릿 설정을 새로 추가합니다.

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

다음으로 필드 목록 탭으로 이동하면 현재 객체의 모든 필드를 볼 수 있습니다. 잠시 후 "복사"를 클릭하면 템플릿을 채울 수 있습니다.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 계약 파일 준비

**Word 계약 템플릿 파일**

미리 계약서 양식(.docx 파일)을 준비합니다. 예: `SUPPLY AND PURCHASE CONTRACT.docx`

이 예시에서는 샘플 플레이스홀더가 포함된 간소화된 "공급 및 구매 계약서"를 제공합니다.

- `{d.contract_no}`: 계약 번호
- `{d.buyer.party_name}`、`{d.seller.party_name}`: 구매자, 판매자 이름
- `{d.total_amount}`: 계약 총액
- 그리고 "담당자", "주소", "전화번호" 등 다른 플레이스홀더도 있습니다.

다음으로, 생성한 컬렉션의 필드를 복사하여 Word에 붙여넣을 수 있습니다.

---

## 3. 템플릿 변수 가이드

### 3.1 기본 변수, 연관 객체 속성 채우기

**기본 필드 채우기:**

예를 들어, 최상단의 계약 번호나 계약 서명 주체 객체입니다. 복사를 클릭한 후 계약서의 해당 빈 공간에 직접 붙여넣으면 됩니다.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 데이터 형식 지정

#### 날짜 형식 지정

템플릿에서는 필드, 특히 날짜 필드의 형식을 지정해야 하는 경우가 많습니다. 직접 복사한 날짜 형식은 일반적으로 길기 때문에(예: Wed Jan 01 2025 00:00:00 GMT) 원하는 스타일로 표시하려면 형식 지정이 필요합니다.

날짜 필드의 경우 `formatD()` 함수를 사용하여 출력 형식을 지정할 수 있습니다.

```
{필드 이름:formatD(형식 지정 스타일)}
```

**예시:**

예를 들어, 복사한 원본 필드가 `{d.created_at}`이고 날짜를 `2025-01-01` 형식으로 지정해야 하는 경우, 이 필드를 다음과 같이 변경합니다.

```
{d.created_at:formatD(YYYY-MM-DD)}  // 출력: 2025-01-01
```

**일반적인 날짜 형식 지정 스타일:**

- `YYYY` - 연도 (네 자리 숫자)
- `MM` - 월 (두 자리)
- `DD` - 일 (두 자리)
- `HH` - 시 (24시간 형식)
- `mm` - 분
- `ss` - 초

**예시 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // 출력: 2025-01-01 14:30:00
```

#### 금액 형식 지정

계약서의 `{d.total_amount}`와 같은 금액 필드가 있다고 가정해 봅시다. `formatN()` 함수를 사용하여 숫자의 형식을 지정하고 소수점 이하 자릿수와 천 단위 구분 기호를 지정할 수 있습니다.

**구문:**

```
{필드 이름:formatN(소수점 이하 자릿수, 천 단위 구분 기호)}
```

- **소수점 이하 자릿수**: 소수점 이하 몇 자리까지 유지할지 지정할 수 있습니다. 예를 들어, `2`는 소수점 이하 두 자리를 의미합니다.
- **천 단위 구분 기호**: 천 단위 구분 기호 사용 여부를 지정하며, 일반적으로 `true` 또는 `false`입니다.

**예시 1: 천 단위 구분 기호와 소수점 이하 두 자리로 금액 형식 지정**

```
{d.amount:formatN(2, true)}  // 출력: 1,234.56
```

이는 `d.amount`를 소수점 이하 두 자리로 형식 지정하고 천 단위 구분 기호를 추가합니다.

**예시 2: 소수점 이하 자릿수 없이 정수로 금액 형식 지정**

```
{d.amount:formatN(0, true)}  // 출력: 1,235
```

이는 `d.amount`를 정수로 형식 지정하고 천 단위 구분 기호를 추가합니다.

**예시 3: 천 단위 구분 기호 없이 소수점 이하 두 자리로 금액 형식 지정**

```
{d.amount:formatN(2, false)}  // 출력: 1234.56
```

여기서는 천 단위 구분 기호를 비활성화하고 소수점 이하 두 자리만 유지합니다.

**기타 금액 형식 지정 요구 사항:**

- **통화 기호**: Carbone 자체는 통화 기호 형식 지정 기능을 직접 제공하지 않지만, 데이터 또는 템플릿에 통화 기호를 직접 추가하여 구현할 수 있습니다. 예를 들어:
  ```
  {d.amount:formatN(2, true)} 원  // 출력: 1,234.56 원
  ```

#### 문자열 형식 지정

문자열 필드의 경우 `:upperCase`를 사용하여 대소문자 변환과 같은 텍스트 형식을 지정할 수 있습니다.

**구문:**

```
{필드 이름:upperCase:기타 명령}
```

**일반적인 변환 방식:**

- `upperCase` - 전체 대문자로 변환
- `lowerCase` - 전체 소문자로 변환
- `upperCase:ucFirst` - 첫 글자만 대문자로 변환

**예시:**

```
{d.party_a_signatory_name:upperCase}  // 출력: JOHN DOE
```

### 3.3 반복 인쇄

#### 하위 객체 목록(예: 상품 상세 정보)을 인쇄하는 방법

여러 하위 항목(예: 상품 상세 정보)이 포함된 테이블을 인쇄해야 할 때, 일반적으로 반복 인쇄 방식을 사용해야 합니다. 이렇게 하면 시스템은 목록의 각 항목에 대해 한 줄의 내용을 생성하며, 모든 항목을 순회할 때까지 계속됩니다.

`contract_items`와 같은 상품 목록이 있고, 이 목록에 여러 상품 객체가 포함되어 있다고 가정해 봅시다. 각 상품 객체에는 상품명, 사양, 수량, 단가, 총액, 비고와 같은 여러 속성이 있습니다.

**단계 1: 테이블의 첫 번째 행에 필드 채우기**

먼저, 테이블의 첫 번째 행(헤더 아님)에 템플릿 변수를 직접 복사하여 채웁니다. 이 변수들은 해당 데이터로 대체되어 출력에 표시됩니다.

예를 들어, 테이블의 첫 번째 행은 다음과 같습니다.

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

여기서 `d.contract_items[i]`는 상품 목록의 i번째 항목을 나타내며, `i`는 현재 상품의 순서를 나타내는 인덱스입니다.

**단계 2: 두 번째 행에서 인덱스 수정**

다음으로, 테이블의 두 번째 행에서 필드의 인덱스를 `i+1`로 수정하고 첫 번째 속성만 채웁니다. 이는 반복 인쇄 시 목록에서 다음 데이터를 가져와 다음 행에 표시해야 하기 때문입니다.

예를 들어, 두 번째 행은 다음과 같이 채웁니다.
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

이 예시에서는 `[i]`를 `[i+1]`로 변경하여 목록의 다음 상품 데이터를 가져올 수 있습니다.

**단계 3: 템플릿 렌더링 시 자동 반복 인쇄**

시스템이 이 템플릿을 처리할 때 다음 논리에 따라 작동합니다.

1. 첫 번째 행은 템플릿에 설정한 필드에 따라 채워집니다.
2. 그런 다음 시스템은 두 번째 행을 자동으로 삭제하고 `d.contract_items`에서 데이터를 추출하여 테이블 형식으로 각 행을 반복적으로 채우며, 모든 상품 상세 정보가 인쇄될 때까지 계속됩니다.

각 행의 `i`는 증가하여 각 행에 다른 상품 정보가 표시되도록 합니다.

---

## 4. 계약 템플릿 업로드 및 설정

### 4.1 템플릿 업로드

1. "템플릿 추가" 버튼을 클릭하고 "공급 및 구매 계약서 템플릿"과 같은 템플릿 이름을 입력합니다.
2. 모든 플레이스홀더가 포함된 준비된 [Word 계약 파일(.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx)을 업로드합니다.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. 완료되면 시스템은 해당 템플릿을 선택 가능한 템플릿 목록에 표시하여 나중에 사용할 수 있도록 합니다.
4. "사용"을 클릭하여 이 템플릿을 활성화합니다.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

이 시점에서 현재 팝업을 종료하고 템플릿 다운로드를 클릭하면 생성된 완전한 템플릿을 얻을 수 있습니다.

**팁:**

- 템플릿이 `.doc` 또는 다른 형식을 사용하는 경우, 플러그인 지원 여부에 따라 `.docx`로 변환해야 할 수 있습니다.
- Word 파일에서 렌더링 오류를 방지하기 위해 플레이스홀더를 여러 단락이나 텍스트 상자로 분할하지 않도록 주의하세요.

---

잘 활용하시길 바랍니다! "템플릿 인쇄" 기능을 통해 계약 관리에서 반복 작업을 크게 줄이고, 수동 복사-붙여넣기 오류를 방지하며, 계약의 표준화 및 자동 출력을 실현할 수 있습니다.