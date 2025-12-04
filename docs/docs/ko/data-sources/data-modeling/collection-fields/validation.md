:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 필드 유효성 검사
컬렉션의 데이터 정확성, 보안 및 일관성을 보장하기 위해 NocoBase는 필드 유효성 검사 기능을 제공합니다. 이 기능은 크게 두 가지 부분으로 나뉩니다: 규칙 설정과 규칙 적용입니다.

## 규칙 설정
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase 시스템 필드는 [Joi](https://joi.dev/api/) 규칙을 통합하며, 지원되는 내용은 다음과 같습니다.

### 문자열 타입
Joi 문자열 타입에 해당하는 NocoBase 필드 타입은 다음과 같습니다: 한 줄 텍스트, 여러 줄 텍스트, 휴대폰 번호, 이메일, URL, 비밀번호, UUID.
#### 공통 규칙
- 최소 길이
- 최대 길이
- 길이
- 정규 표현식
- 필수

#### 이메일
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[더 많은 옵션 보기](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[더 많은 옵션 보기](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[더 많은 옵션 보기](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### 숫자 타입
Joi 숫자 타입에 해당하는 NocoBase 필드 타입은 다음과 같습니다: 정수, 숫자, 백분율.
#### 공통 규칙
- 보다 큼
- 보다 작음
- 최대값
- 최소값
- 배수

#### 정수
공통 규칙 외에도, 정수 필드는 [정수 유효성 검사](https://joi.dev/api/?v=17.13.3#numberinteger)와 [안전하지 않은 정수 유효성 검사](https://joi.dev/api/?v=17.13.3#numberunsafeenabled)를 추가로 지원합니다.
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### 숫자 및 백분율
공통 규칙 외에도, 숫자 및 백분율 필드는 [정밀도 유효성 검사](https://joi.dev/api/?v=17.13.3#numberinteger)를 추가로 지원합니다.
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### 날짜 타입
Joi 날짜 타입에 해당하는 NocoBase 필드 타입은 다음과 같습니다: 날짜(시간대 포함), 날짜(시간대 미포함), 날짜만, Unix 타임스탬프.

지원되는 유효성 검사 규칙:
- 보다 큼
- 보다 작음
- 최대값
- 최소값
- 타임스탬프 형식 유효성 검사
- 필수

### 관계 필드
관계 필드는 필수 유효성 검사만 지원합니다. 관계 필드의 필수 유효성 검사는 현재 하위 폼 또는 하위 테이블 시나리오에서는 지원되지 않는다는 점에 유의하십시오.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## 유효성 검사 규칙 적용
필드 규칙을 설정하면 데이터를 추가하거나 수정할 때 해당 유효성 검사 규칙이 트리거됩니다.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

유효성 검사 규칙은 하위 테이블 및 하위 폼 컴포넌트에도 적용됩니다.
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

하위 폼 또는 하위 테이블 시나리오에서는 관계 필드의 필수 유효성 검사가 적용되지 않는다는 점에 유의하십시오.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## 클라이언트 측 필드 유효성 검사와의 차이점
클라이언트 측 및 서버 측 필드 유효성 검사는 서로 다른 적용 시나리오에 사용되며, 구현 방식과 규칙 트리거 시점에 상당한 차이가 있으므로 각각 별도로 관리해야 합니다.

### 설정 방식의 차이점
- **클라이언트 측 유효성 검사**: 편집 폼에서 규칙을 설정합니다(아래 그림 참조).
- **서버 측 필드 유효성 검사**: 데이터 소스 → 컬렉션 설정에서 필드 규칙을 설정합니다.
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### 유효성 검사 트리거 시점의 차이점
- **클라이언트 측 유효성 검사**: 사용자가 필드를 입력할 때 실시간으로 유효성 검사를 트리거하고, 즉시 오류 메시지를 표시합니다.
- **서버 측 필드 유효성 검사**: 데이터 제출 후, 서버 측에서 데이터가 데이터베이스에 저장되기 전에 유효성을 검사하며, 오류 메시지는 API 응답을 통해 반환됩니다.
- **적용 범위**: 서버 측 필드 유효성 검사는 폼 제출 시뿐만 아니라 워크플로우, 데이터 가져오기 등 데이터 추가 또는 수정과 관련된 모든 시나리오에서 트리거됩니다.
- **오류 메시지**: 클라이언트 측 유효성 검사는 사용자 정의 오류 메시지를 지원하지만, 서버 측 유효성 검사는 현재 사용자 정의 오류 메시지를 지원하지 않습니다.