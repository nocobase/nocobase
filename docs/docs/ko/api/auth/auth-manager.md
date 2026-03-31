:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# AuthManager

## 개요

`AuthManager`는 NocoBase의 사용자 인증 관리 모듈로, 다양한 사용자 인증 유형을 등록하는 데 사용됩니다.

### 기본 사용법

```ts
const authManager = new AuthManager({
  // 요청 헤더에서 현재 인증기 식별자를 가져오는 데 사용됩니다.
  authKey: 'X-Authenticator',
});

// AuthManager가 인증기를 저장하고 가져오는 메서드를 설정합니다.
authManager.setStorer({
  get: async (name: string) => {
    return db.getRepository('authenticators').find({ filter: { name } });
  },
});

// 인증 유형을 등록합니다.
authManager.registerTypes('basic', {
  auth: BasicAuth,
  title: 'Password',
});

// 인증 미들웨어를 사용합니다.
app.resourceManager.use(authManager.middleware());
```

### 개념 설명

- **인증 유형 (`AuthType`)**: 비밀번호, SMS, OIDC, SAML 등 다양한 사용자 인증 방식을 의미합니다.
- **인증기 (`Authenticator`)**: 인증 방식의 엔티티로, 실제로는 데이터 컬렉션에 저장되며 특정 인증 유형 (`AuthType`)의 설정 레코드에 해당합니다. 하나의 인증 방식은 여러 개의 인증기를 가질 수 있으며, 이는 여러 설정에 해당하여 다양한 사용자 인증 방법을 제공합니다.
- **인증기 식별자 (`Authenticator name`)**: 인증기의 고유 식별자로, 현재 요청에서 사용되는 인증 방식을 결정하는 데 사용됩니다.

## 클래스 메서드

### `constructor()`

생성자 함수로, `AuthManager` 인스턴스를 생성합니다.

#### 시그니처

- `constructor(options: AuthManagerOptions)`

#### 타입

```ts
export interface JwtOptions {
  secret: string;
  expiresIn?: string;
}

export type AuthManagerOptions = {
  authKey: string;
  default?: string;
  jwt?: JwtOptions;
};
```

#### 세부 정보

##### AuthManagerOptions

| 속성      | 타입                        | 설명                                  | 기본값            |
| --------- | --------------------------- | ------------------------------------- | ----------------- |
| `authKey` | `string`                    | 선택 사항입니다. 요청 헤더에 현재 인증기 식별자를 저장하는 키입니다. | `X-Authenticator` |
| `default` | `string`                    | 선택 사항입니다. 기본 인증기 식별자입니다.                  | `basic`           |
| `jwt`     | [`JwtOptions`](#jwtoptions) | 선택 사항입니다. JWT를 사용하여 인증하는 경우 설정할 수 있습니다.   | -                 |

##### JwtOptions

| 속성        | 타입     | 설명               | 기본값            |
| ----------- | -------- | ------------------ | ----------------- |
| `secret`    | `string` | 토큰 비밀 키         | `X-Authenticator` |
| `expiresIn` | `string` | 선택 사항입니다. 토큰 만료 시간입니다. | `7d`              |

### `setStorer()`

인증기 데이터를 저장하고 가져오는 메서드를 설정합니다.

#### 시그니처

- `setStorer(storer: Storer)`

#### 타입

```ts
export interface Authenticator = {
  authType: string;
  options: Record<string, any>;
  [key: string]: any;
};

export interface Storer {
  get: (name: string) => Promise<Authenticator>;
}
```

#### 세부 정보

##### Authenticator

| 속성       | 타입                  | 설명           |
| ---------- | --------------------- | -------------- |
| `authType` | `string`              | 인증 유형       |
| `options`  | `Record<string, any>` | 인증기 관련 설정 |

##### Storer

`Storer`는 인증기 저장소 인터페이스이며, 하나의 메서드를 포함합니다.

- `get(name: string): Promise<Authenticator>` - 인증기 식별자를 통해 인증기를 가져옵니다. NocoBase에서는 실제로 [AuthModel](/auth-verification/auth/dev/api#authmodel) 타입이 반환됩니다.

### `registerTypes()`

인증 유형을 등록합니다.

#### 시그니처

- `registerTypes(authType: string, authConfig: AuthConfig)`

#### 타입

```ts
export type AuthExtend<T extends Auth> = new (config: Config) => T;

type AuthConfig = {
  auth: AuthExtend<Auth>; // 인증 클래스입니다.
  title?: string; // 인증 유형의 표시 이름입니다.
};
```

#### 세부 정보

| 속성    | 타입               | 설명                              |
| ------- | ------------------ | --------------------------------- |
| `auth`  | `AuthExtend<Auth>` | 인증 유형 구현체입니다. [Auth](./auth)를 참조하세요. |
| `title` | `string`           | 선택 사항입니다. 이 인증 유형이 프런트엔드에 표시될 제목입니다. |

### `listTypes()`

등록된 인증 유형 목록을 가져옵니다.

#### 시그니처

- `listTypes(): { name: string; title: string }[]`

#### 세부 정보

| 속성    | 타입     | 설명         |
| ------- | -------- | ------------ |
| `name`  | `string` | 인증 유형 식별자 |
| `title` | `string` | 인증 유형 제목 |

### `get()`

인증기를 가져옵니다.

#### 시그니처

- `get(name: string, ctx: Context)`

#### 세부 정보

| 속성   | 타입      | 설명       |
| ------ | --------- | ---------- |
| `name` | `string`  | 인증기 식별자 |
| `ctx`  | `Context` | 요청 컨텍스트 |

### `middleware()`

인증 미들웨어입니다. 현재 인증기를 가져와 사용자 인증을 수행합니다.