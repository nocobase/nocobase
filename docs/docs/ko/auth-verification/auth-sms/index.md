---
pkg: '@nocobase/plugin-auth-sms'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# SMS 인증

## 소개

SMS 인증 플러그인은 사용자가 SMS를 통해 회원가입하고 NocoBase에 로그인할 수 있도록 지원합니다.

> [`@nocobase/plugin-verification` 플러그인](/auth-verification/verification/)에서 제공하는 SMS 인증 코드 기능과 함께 사용해야 합니다.

## SMS 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202502282112517.png)

추가 - SMS

![](https://static-docs.nocobase.com/202502282113553.png)

## 새 버전 설정

:::info{title=참고}
새로운 설정은 `1.6.0-alpha.30` 버전부터 도입되었으며, `1.7.0` 버전부터 안정적으로 지원될 예정입니다.
:::

![](https://static-docs.nocobase.com/202502282114821.png)

**검증기 (Verificator):** SMS 인증 코드를 전송하는 데 사용되는 SMS 검증기를 바인딩합니다. 사용 가능한 검증기가 없는 경우, 먼저 검증 관리 페이지로 이동하여 SMS 검증기를 생성해야 합니다.
참고:

- [검증](../verification/index.md)
- [검증: SMS](../verification/sms/index.md)

**사용자가 존재하지 않을 때 자동으로 가입 (Sign up automatically when the user does not exist):** 이 옵션을 선택하면, 사용자가 입력한 휴대폰 번호가 존재하지 않을 경우, 해당 휴대폰 번호를 닉네임으로 사용하여 새 사용자를 등록합니다.

## 이전 버전 설정

![](https://static-docs.nocobase.com/a4d35ec63ba22ae2ea9e3e8e1cbb783d.png)

SMS 로그인 인증 기능은 설정되어 있고 기본값으로 지정된 SMS 인증 코드 Provider를 사용하여 SMS를 전송합니다.

**사용자가 존재하지 않을 때 자동으로 가입 (Sign up automatically when the user does not exist):** 이 옵션을 선택하면, 사용자가 입력한 휴대폰 번호가 존재하지 않을 경우, 해당 휴대폰 번호를 닉네임으로 사용하여 새 사용자를 등록합니다.

## 로그인

로그인 페이지에서 사용할 수 있습니다.

![](https://static-docs.nocobase.com/8d630739201bc27d8b0de076ab4f75e2.png)