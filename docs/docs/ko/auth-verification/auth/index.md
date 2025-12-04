:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 사용자 인증

NocoBase의 사용자 인증 모듈은 크게 두 부분으로 구성됩니다.

- 코어(kernel)의 `@nocobase/auth`는 로그인, 회원가입, 검증 등 사용자 인증과 관련된 확장 가능한 인터페이스와 미들웨어를 정의하며, 다양한 확장 인증 방식을 등록하고 관리하는 데 사용됩니다.
- 플러그인 중 `@nocobase/plugin-auth`는 코어의 인증 관리 모듈을 초기화하고, 기본적인 사용자 이름(또는 이메일)/비밀번호 인증 방식을 제공합니다.

> [`@nocobase/plugin-users` 플러그인](/users-permissions/user)이 제공하는 사용자 관리 기능과 함께 사용해야 합니다.

이 외에도 NocoBase는 다양한 사용자 인증 방식 플러그인을 제공합니다.

- [@nocobase/plugin-auth-sms](/auth-verification/auth-sms/) - SMS 인증 로그인 기능
- [@nocobase/plugin-auth-saml](/auth-verification/auth-saml/) - SAML SSO 로그인 기능
- [@nocobase/plugin-auth-oidc](/auth-verification/auth-oidc/) - OIDC SSO 로그인 기능
- [@nocobase/plugin-auth-cas](/auth-verification/auth-cas/) - CAS SSO 로그인 기능
- [@nocobase/plugin-auth-ldap](/auth-verification/auth-ldap/) - LDAP SSO 로그인 기능
- [@nocobase/plugin-auth-wecom](/auth-verification/auth-wecom/) - WeCom 로그인 기능
- [@nocobase/plugin-auth-dingtalk](/auth-verification/auth-dingtalk/) - DingTalk 로그인 기능

위 플러그인들을 통해 관리자가 해당 인증 방식을 설정하면, 사용자는 Google Workspace, Microsoft Azure와 같은 플랫폼에서 제공하는 사용자 ID로 시스템에 직접 로그인할 수 있습니다. 또한, Auth0, Logto, Keycloak 등 다양한 플랫폼 도구와도 연동할 수 있습니다. 이 외에도 개발자는 NocoBase가 제공하는 기본 인터페이스를 활용하여 필요한 다른 인증 방식을 편리하게 확장할 수 있습니다.