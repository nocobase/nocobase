:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Auth

## 개요

`Auth` 클래스는 주로 클라이언트 측에서 사용자 정보에 접근하고 사용자 인증 관련 API를 요청하는 데 사용됩니다.

## 인스턴스 속성

### `locale`

현재 사용자가 사용하는 언어입니다.

### `role`

현재 사용자가 사용하는 역할입니다.

### `token`

API `token`입니다.

### `authenticator`

현재 사용자 인증에 사용되는 인증기입니다. [사용자 인증](/auth-verification/auth/)을 참조하십시오.

## 클래스 메서드

### `signIn()`

사용자 로그인입니다.

#### 시그니처

- `async signIn(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 상세 정보

| 매개변수 이름   | 타입     | 설명                     |
| --------------- | -------- | ------------------------ |
| `values`        | `any`    | 로그인 API 요청 매개변수 |
| `authenticator` | `string` | 로그인에 사용되는 인증기 식별자 |

### `signUp()`

사용자 회원가입입니다.

#### 시그니처

- `async signUp(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 상세 정보

| 매개변수 이름   | 타입     | 설명                       |
| --------------- | -------- | -------------------------- |
| `values`        | `any`    | 회원가입 API 요청 매개변수 |
| `authenticator` | `string` | 회원가입에 사용되는 인증기 식별자 |

### `signOut()`

로그아웃입니다.

#### 시그니처

- `async signOut(values: any, authenticator?: string): Promise<AxiosResponse<any>>`

#### 상세 정보

| 매개변수 이름   | 타입     | 설명                     |
| --------------- | -------- | ------------------------ |
| `values`        | `any`    | 로그아웃 API 요청 매개변수 |
| `authenticator` | `string` | 로그아웃에 사용되는 인증기 식별자 |