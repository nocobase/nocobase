:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# API 레퍼런스

## 서버 측

### Auth

코어 API, 참고: [Auth](/api/auth/auth)

### BaseAuth

코어 API, 참고: [BaseAuth](/api/auth/base-auth)

### AuthModel

#### 개요

`AuthModel`은 NocoBase 애플리케이션에서 사용되는 인증기(`Authenticator`, 참고: [AuthManager - setStorer](/api/auth/auth-manager#setstorer) 및 [Auth - constructor](/api/auth/auth#constructor)) 데이터 모델입니다. 이 모델은 사용자 데이터 컬렉션과 상호작용하는 몇 가지 메서드를 제공합니다. 또한, Sequelize Model이 제공하는 메서드도 사용할 수 있습니다.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser();
    this.authenticator.newUser();
    this.authenticator.findOrCreateUser();
    // ...
  }
}
```

#### 클래스 메서드

- `findUser(uuid: string): UserModel` - `uuid`를 통해 사용자를 조회합니다.
  - `uuid` - 현재 인증 유형의 고유 사용자 식별자

- `newUser(uuid: string, userValues?: any): UserModel` - 새 사용자를 생성하고, `uuid`를 통해 사용자를 현재 인증기와 연결합니다.
  - `uuid` - 현재 인증 유형의 고유 사용자 식별자
  - `userValues` - 선택 사항입니다. 사용자의 기타 정보입니다. 전달하지 않으면 `uuid`가 사용자 닉네임으로 사용됩니다.

- `findOrCreateUser(uuid: string, userValues?: any): UserModel` - 새 사용자를 찾거나 생성합니다. 생성 규칙은 위와 동일합니다.
  - `uuid` - 현재 인증 유형의 고유 사용자 식별자
  - `userValues` - 선택 사항입니다. 사용자의 기타 정보입니다.

## 클라이언트 측

### `plugin.registerType()`

인증 유형의 클라이언트를 등록합니다.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm,
        // SignInButton
        SignUpForm,
        AdminSettingsForm,
      },
    });
  }
}
```

#### 시그니처

- `registerType(authType: string, options: AuthOptions)`

#### 타입

```ts
export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: AuthenticatorType }>;
    SignInButton: ComponentType<{ authenticator: AuthenticatorType }>;
    SignUpForm: ComponentType<{ authenticatorName: string }>;
    AdminSettingsForm: ComponentType;
  }>;
};
```

#### 세부 정보

- `SignInForm` - 로그인 폼
- `SignInButton` - 로그인 (타사) 버튼, 로그인 폼 대신 사용할 수 있습니다.
- `SignUpForm` - 회원가입 폼
- `AdminSettingsForm` - 관리자 설정 폼

### Route

인증 플러그인에 등록된 프런트엔드 라우트는 다음과 같습니다:

- 인증 레이아웃
  - name: `auth`
  - path: `-`
  - component: `AuthLayout`

- 로그인 페이지
  - name: `auth.signin`
  - path: `/signin`
  - component: `SignInPage`

- 회원가입 페이지
  - name: `auth.signup`
  - path: `/signup`
  - component: `SignUpPage`