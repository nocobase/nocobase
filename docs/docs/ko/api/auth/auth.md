:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Auth

## 개요

`Auth`는 사용자 인증 타입의 추상 클래스입니다. 사용자 인증을 완료하는 데 필요한 인터페이스를 정의하며, 새로운 사용자 인증 타입을 확장하려면 `Auth` 클래스를 상속받아 해당 메서드를 구현해야 합니다. 기본적인 구현은 다음을 참고해 주세요: [BaseAuth](./base-auth.md).

```ts
interface IAuth {
  user: Model;
  // 인증 상태를 확인하고 현재 사용자를 반환합니다.
  check(): Promise<Model>;
  signIn(): Promise<any>;
  signUp(): Promise<any>;
  signOut(): Promise<any>;
}

export abstract class Auth implements IAuth {
  abstract user: Model;
  abstract check(): Promise<Model>;
  // ...
}

class CustomAuth extends Auth {
  // check: 인증
  async check() {
    // ...
  }
}
```

## 인스턴스 속성

### `user`

인증된 사용자 정보입니다.

#### 시그니처

- `abstract user: Model`

## 클래스 메서드

### `constructor()`

`Auth` 인스턴스를 생성하는 생성자입니다.

#### 시그니처

- `constructor(config: AuthConfig)`

#### 타입

```ts
export type AuthConfig = {
  authenticator: Authenticator;
  options: {
    [key: string]: any;
  };
  ctx: Context;
};
```

#### 상세 정보

##### AuthConfig

| 속성            | 타입                                            | 설명                                                                                                  |
| --------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `authenticator` | [`Authenticator`](./auth-manager#authenticator) | 인증기 데이터 모델입니다. NocoBase 애플리케이션에서 실제 타입은 [AuthModel](/auth-verification/auth/dev/api#authmodel)입니다. |
| `options`       | `Record<string, any>`                           | 인증기와 관련된 설정입니다.                                                                           |
| `ctx`           | `Context`                                       | 요청 컨텍스트입니다.                                                                                  |

### `check()`

사용자 인증을 수행하고 사용자 정보를 반환합니다. 모든 인증 타입이 반드시 구현해야 하는 추상 메서드입니다.

#### 시그니처

- `abstract check(): Promise<Model>`

### `signIn()`

사용자 로그인입니다.

#### 시그니처

- `signIn(): Promise<any>`

### `signUp()`

사용자 회원가입입니다.

#### 시그니처

- `signUp(): Promise<any>`

### `signOut()`

사용자 로그아웃입니다.

#### 시그니처

- `signOut(): Promise<any>`