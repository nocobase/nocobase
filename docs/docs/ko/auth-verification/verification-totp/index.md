---
pkg: '@nocobase/plugin-verification-totp-authenticator'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: TOTP 인증기

## 소개

TOTP 인증기는 사용자가 TOTP (Time-based One-Time Password) 사양(<a href="https://www.rfc-editor.org/rfc/rfc6238" target="_blank">RFC-6238</a>)을 준수하는 모든 인증기를 바인딩하고, 시간 기반 일회용 비밀번호(TOTP)를 사용하여 신원을 인증할 수 있도록 지원합니다.

## 관리자 설정

인증 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202502271726791.png)

추가 - TOTP 인증기

![](https://static-docs.nocobase.com/202502271745028.png)

TOTP 인증기는 고유 식별자와 제목 외에 다른 설정이 필요하지 않습니다.

![](https://static-docs.nocobase.com/202502271746034.png)

## 사용자 바인딩

인증기를 추가한 후, 사용자는 개인 센터의 인증 관리에서 TOTP 인증기를 바인딩할 수 있습니다.

![](https://static-docs.nocobase.com/202502272252324.png)

:::warning
플러그인은 현재 복구 코드 메커니즘을 제공하지 않습니다. TOTP 인증기를 바인딩한 후에는 사용자가 안전하게 보관해야 합니다. 만약 인증기를 실수로 분실한 경우, 다른 인증 방식으로 신원을 확인하여 바인딩을 해제한 후 다시 바인딩할 수 있습니다.
:::

## 사용자 바인딩 해제

인증기를 해제하려면 이미 바인딩된 인증 방식으로 본인 확인을 진행해야 합니다.

![](https://static-docs.nocobase.com/202502282103205.png)