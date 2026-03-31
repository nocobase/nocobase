:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 인증 유형 확장

## 개요

NocoBase는 필요에 따라 사용자 인증 유형을 확장할 수 있도록 지원합니다. 사용자 인증은 크게 두 가지 유형으로 나눌 수 있습니다. 첫 번째는 NocoBase 애플리케이션 내에서 사용자 신원을 확인하는 방식으로, 비밀번호 로그인, SMS 로그인 등이 있습니다. 두 번째는 타사 서비스가 사용자 신원을 확인하고 그 결과를 콜백을 통해 NocoBase 애플리케이션에 알리는 방식으로, OIDC, SAML과 같은 인증 방법이 여기에 해당합니다. NocoBase에서 이 두 가지 인증 유형의 기본 인증 흐름은 다음과 같습니다.

### 타사 콜백이 필요 없는 경우

1. 클라이언트는 NocoBase SDK를 사용하여 로그인 인터페이스 `api.auth.signIn()`을 호출하고, `auth:signIn` 로그인 인터페이스를 요청합니다. 이때 현재 사용 중인 인증기 식별자를 `X-Authenticator` 요청 헤더를 통해 백엔드로 전달합니다.
2. `auth:signIn` 인터페이스는 요청 헤더의 인증기 식별자를 기반으로 해당 인증 유형으로 요청을 전달하며, 해당 인증 유형에 등록된 인증 클래스의 `validate` 메서드가 관련 로직을 처리합니다.
3. 클라이언트는 `auth:signIn` 인터페이스 응답에서 사용자 정보와 인증 `token`을 받아 `token`을 로컬 스토리지에 저장하여 로그인을 완료합니다. 이 단계는 SDK 내부에서 자동으로 처리됩니다.

<img src="https://static-docs.nocobase.com/202404211852848.png"/>

### 타사 콜백에 의존하는 경우

1. 클라이언트는 자체 등록된 인터페이스(예: `auth:getAuthUrl`)를 통해 타사 로그인 URL을 가져오고, 프로토콜에 따라 애플리케이션 이름, 인증기 식별자 등의 정보를 전달합니다.
2. 타사 URL로 리디렉션하여 로그인을 완료하면, 타사 서비스는 NocoBase 애플리케이션의 콜백 인터페이스(예: `auth:redirect`, 직접 등록해야 함)를 호출하여 인증 결과를 반환합니다. 이때 애플리케이션 이름, 인증기 식별자 등의 정보도 함께 반환됩니다.
3. 콜백 인터페이스 메서드는 매개변수를 파싱하여 인증기 식별자를 얻고, `AuthManager`를 통해 해당 인증 클래스를 가져와 `auth.signIn()` 메서드를 직접 호출합니다. `auth.signIn()` 메서드는 `validate()` 메서드를 호출하여 인증 로직을 처리합니다.
4. 콜백 메서드는 인증 `token`을 받은 후, 302 리디렉션을 통해 프런트엔드 페이지로 돌아가며, URL 매개변수에 `token`과 인증기 식별자(`?authenticator=xxx&token=yyy`)를 포함합니다.

<img src="https://static-docs.nocobase.com/202404211852377.png"/>

다음으로, 서버 측 인터페이스와 클라이언트 사용자 인터페이스를 등록하는 방법을 설명합니다.

## 서버

### 인증 인터페이스

NocoBase 커널은 확장 인증 유형의 등록 및 관리를 제공합니다. 로그인 플러그인을 확장하는 핵심 로직을 처리하려면 커널의 `Auth` 추상 클래스를 상속하고 해당 표준 인터페이스를 구현해야 합니다.  
전체 API는 [Auth](/api/auth/auth)를 참조하십시오.

```typescript
import { Auth } from '@nocobase/auth';

class CustomAuth extends Auth {
  set user(user) {}
  get user() {}

  async check() {}
  async signIn() {}
}
```

커널은 사용자 인증과 관련된 기본 리소스 작업도 등록합니다.

| API            | 설명             |
| -------------- | ---------------- |
| `auth:check`   | 사용자 로그인 여부 확인 |
| `auth:signIn`  | 로그인             |
| `auth:signUp`  | 회원가입             |
| `auth:signOut` | 로그아웃         |

대부분의 경우, 확장된 사용자 인증 유형은 기존 JWT 인증 로직을 사용하여 API 접근을 위한 사용자 자격 증명을 생성할 수 있습니다. 커널의 `BaseAuth` 클래스는 `Auth` 추상 클래스에 대한 기본 구현을 제공합니다. [BaseAuth](../../../api/auth/base-auth.md)를 참조하십시오. 플러그인은 `BaseAuth` 클래스를 직접 상속하여 일부 로직 코드를 재사용하고 개발 비용을 절감할 수 있습니다.

```javascript
import { BaseAuth } from '@nocobase/auth';

class CustomAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    // 사용자 컬렉션 설정
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  // 사용자 인증 로직 구현
  async validate() {}
}
```

### 사용자 데이터

사용자 인증 로직을 구현할 때 일반적으로 사용자 데이터 처리가 포함됩니다. NocoBase 애플리케이션에서 관련 컬렉션은 기본적으로 다음과 같이 정의됩니다.

| 컬렉션                | 설명                                               | 플러그인                                                           |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| `users`               | 이메일, 닉네임, 비밀번호 등 사용자 정보 저장                   | [사용자 플러그인 (`@nocobase/plugin-users`)](/users-permissions/user) |
| `authenticators`      | 인증기(인증 유형 엔티티) 정보, 해당 인증 유형 및 구성 저장 | 사용자 인증 플러그인 (`@nocobase/plugin-auth`)                         |
| `usersAuthenticators` | 사용자와 인증기를 연결하고, 해당 인증기 아래의 사용자 정보 저장     | 사용자 인증 플러그인 (`@nocobase/plugin-auth`)                         |

일반적으로 확장된 로그인 방식은 `users`와 `usersAuthenticators`를 사용하여 해당 사용자 데이터를 저장하면 됩니다. 특별한 경우에만 새로운 컬렉션을 추가해야 합니다.

`usersAuthenticators`의 주요 필드는 다음과 같습니다.

| 필드            | 설명                                                 |
| --------------- | ---------------------------------------------------- |
| `uuid`          | 해당 인증 방식의 고유 사용자 식별자 (예: 휴대폰 번호, 위챗 openid 등) |
| `meta`          | JSON 필드, 저장해야 할 기타 정보                        |
| `userId`        | 사용자 ID                                              |
| `authenticator` | 인증기 이름 (고유 식별자)                               |

사용자 조회 및 생성 작업을 위해 `authenticators` 데이터 모델인 `AuthModel`은 몇 가지 메서드를 캡슐화하고 있으며, `CustomAuth` 클래스에서 `this.authenticator[메서드명]`을 통해 사용할 수 있습니다. 전체 API는 [AuthModel](./api#authmodel)을 참조하십시오.

```ts
import { AuthModel } from '@nocobase/plugin-auth';

class CustomAuth extends BaseAuth {
  async validate() {
    // ...
    const authenticator = this.authenticator as AuthModel;
    this.authenticator.findUser(); // 사용자 조회
    this.authenticator.newUser(); // 새 사용자 생성
    this.authenticator.findOrCreateUser(); // 사용자 조회 또는 생성
    // ...
  }
}
```

### 인증 유형 등록

확장된 인증 방식은 인증 관리 모듈에 등록해야 합니다.

```javascript
class CustomAuthPlugin extends Plugin {
  async load() {
    this.app.authManager.registerTypes('custom-auth-type', {
      auth: CustomAuth,
    });
  }
}
```

## 클라이언트

클라이언트 사용자 인터페이스는 사용자 인증 플러그인 클라이언트가 제공하는 `registerType` 인터페이스를 통해 등록됩니다.

```ts
import AuthPlugin from '@nocobase/plugin-auth/client';

class CustomAuthPlugin extends Plugin {
  async load() {
    const auth = this.app.pm.get(AuthPlugin);
    auth.registerType('custom-auth-type', {
      components: {
        SignInForm, // 로그인 폼
        SignInButton, // 로그인 (타사) 버튼, 로그인 폼과 둘 중 하나를 선택할 수 있습니다.
        SignUpForm, // 회원가입 폼
        AdminSettingsForm, // 관리자 설정 폼
      },
    });
  }
}
```

### 로그인 폼

![](https://static-docs.nocobase.com/33afe18f229c3db45c7a1921c2c050b7.png)

여러 인증기에 해당하는 인증 유형이 모두 로그인 폼을 등록한 경우, 탭 형태로 표시됩니다. 탭 제목은 백엔드에서 설정된 인증기 제목이 됩니다.

![](https://static-docs.nocobase.com/ada6d7add744be0c812359c23bf4c7fc.png)

### 로그인 버튼

![](https://static-docs.nocobase.com/e706f7785782adc77b0f4ee4faadfab8.png)

일반적으로 타사 로그인 버튼이지만, 실제로는 어떤 컴포넌트도 될 수 있습니다.

### 회원가입 폼

![](https://static-docs.nocobase.com/f95c53431bf21ec312fcfd51923f0b42.png)

로그인 페이지에서 회원가입 페이지로 이동해야 하는 경우, 로그인 컴포넌트 내에서 직접 처리해야 합니다.

### 관리자 설정 폼

![](https://static-docs.nocobase.com/f4b544b5b0f4afee5621ad4abf66b24f.png)

위쪽은 일반적인 인증기 설정이며, 아래쪽은 등록 가능한 사용자 정의 설정 폼 부분입니다.

### API 요청

클라이언트에서 사용자 인증 관련 API 요청을 시작하려면 NocoBase가 제공하는 SDK를 사용할 수 있습니다.

```ts
import { useAPIClient } from '@nocobase/client';

// 컴포넌트에서 사용
const api = useAPIClient();
api.auth.signIn(data, authenticator);
```

자세한 API는 [@nocobase/sdk - Auth](/api/sdk/auth)를 참조하십시오.