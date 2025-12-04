---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# 인증: SAML 2.0

## 소개

인증: SAML 2.0 플러그인은 SAML 2.0 (Security Assertion Markup Language 2.0) 프로토콜 표준을 따르며, 사용자가 타사 신원 인증 서비스 제공업체(IdP)에서 제공하는 계정으로 NocoBase에 로그인할 수 있도록 지원합니다.

## 플러그인 활성화

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## SAML 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202411130004459.png)

추가 - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## 설정

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - IdP에서 제공하며, 싱글 사인온(SSO)에 사용되는 URL입니다.
- 공개 인증서 (Public Certificate) - IdP에서 제공합니다.
- 엔티티 ID (IdP Issuer) - 선택 사항이며, IdP에서 제공합니다.
- http - NocoBase 애플리케이션이 HTTP 프로토콜을 사용하는 경우, 이 옵션을 선택하세요.
- 사용자 바인딩 필드 - 기존 사용자와 매칭 및 바인딩하는 데 사용되는 필드입니다. 이메일 또는 사용자 이름을 선택할 수 있으며, 기본값은 이메일입니다. IdP에서 제공하는 사용자 정보에 `email` 또는 `username` 필드가 포함되어야 합니다.
- 사용자가 없을 때 자동 가입 - 매칭되는 기존 사용자를 찾을 수 없을 때, 새 사용자를 자동으로 생성할지 여부입니다.
- 사용법 - `SP Issuer / EntityID`와 `ACS URL`은 IdP의 해당 설정에 복사하여 붙여넣는 데 사용됩니다.

## 필드 매핑

필드 매핑은 IdP의 설정 플랫폼에서 구성해야 합니다. [예시](./examples/google.md)를 참고하세요.

NocoBase에서 매핑 가능한 필드는 다음과 같습니다:

- email (필수)
- phone (scope에 `phone`을 지원하는 플랫폼(예: 알리바바 클라우드, Feishu)에만 적용됩니다.)
- nickname
- username
- firstName
- lastName

`nameID`는 SAML 프로토콜에 의해 전달되며, 매핑할 필요 없이 고유한 사용자 식별자로 저장됩니다.
새 사용자 닉네임 사용 규칙의 우선순위는 다음과 같습니다: `nickname` > `firstName lastName` > `username` > `nameID`
현재 사용자 조직 및 역할 매핑은 지원되지 않습니다.

## 로그인

로그인 페이지로 이동하여, 로그인 양식 아래의 버튼을 클릭하면 타사 로그인을 시작할 수 있습니다.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)