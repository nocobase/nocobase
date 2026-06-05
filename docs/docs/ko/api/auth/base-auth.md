:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# BaseAuth

## 개요

`BaseAuth`는 [Auth](./auth) 추상 클래스를 상속받아 JWT를 인증 방식으로 사용하는 사용자 인증 타입의 기본 구현체입니다. 대부분의 경우, 사용자 인증 타입을 확장할 때는 `BaseAuth`를 상속하여 확장하면 되며, `Auth` 추상 클래스를 직접 상속할 필요는 없습니다.

```ts
class BasicAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // 사용자 컬렉션을 설정합니다.
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // `auth.signIn`에서 호출되는 사용자 인증 로직입니다.
  // 사용자 데이터를 반환합니다.
  async validate() {
    const ctx = this.ctx;
    const { values } = ctx.action.params;
    // ...
    return user;
  }
}
```

## 클래스 메서드

### `constructor()`

생성자 함수로, `BaseAuth` 인스턴스를 생성합니다.

#### 시그니처

- `constructor(config: AuthConfig & { userCollection: Collection })`

#### 세부 정보

| 매개변수         | 타입         | 설명                                                                                                |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------- |
| `config`         | `AuthConfig` | [Auth - AuthConfig](./auth#authconfig)를 참고하세요.                                                |
| `userCollection` | `Collection` | 사용자 데이터 컬렉션, 예: `db.getCollection('users')`. [DataBase - Collection](../database/collection)을 참고하세요. |

### `user()`

접근자(accessor)로, 사용자 정보를 설정하고 가져옵니다. 기본적으로 `ctx.state.currentUser` 객체를 사용하여 접근합니다.

#### 시그니처

- `set user()`
- `get user()`

### `check()`

요청 토큰을 통해 인증하고, 사용자 정보를 반환합니다.

### `signIn()`

사용자 로그인 시 토큰을 생성합니다.

### `signUp()`

사용자 회원가입을 처리합니다.

### `signOut()`

사용자 로그아웃 시 토큰을 만료시킵니다.

### `validate()` \*

핵심 인증 로직으로, `signIn` 인터페이스에서 호출되어 사용자가 성공적으로 로그인할 수 있는지 판단합니다.