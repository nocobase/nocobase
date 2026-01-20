---
pkg: '@nocobase/plugin-auth-wecom'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: WeCom

## 소개

**WeCom** 플러그인은 사용자가 WeCom 계정을 사용하여 NocoBase에 로그인할 수 있도록 지원합니다.

## 플러그인 활성화

![](https://static-docs.nocobase.com/202406272056962.png)

## WeCom 자체 구축 애플리케이션 생성 및 구성

WeCom 관리 콘솔에 접속하여 WeCom 자체 구축 애플리케이션을 생성합니다.

![](https://static-docs.nocobase.com/202406272101321.png)

![](https://static-docs.nocobase.com/202406272102087.png)

애플리케이션을 클릭하여 상세 페이지로 이동한 다음, 페이지를 아래로 스크롤하여 「WeCom 인증 로그인」을 클릭합니다.

![](https://static-docs.nocobase.com/202406272104655.png)

인증 콜백 도메인을 NocoBase 애플리케이션 도메인으로 설정합니다.

![](https://static-docs.nocobase.com/202406272105662.png)

애플리케이션 상세 페이지로 돌아가 「웹 인증 및 JS-SDK」를 클릭합니다.

![](https://static-docs.nocobase.com/202406272107063.png)

애플리케이션의 OAuth2.0 웹 인증 기능에 사용할 콜백 도메인을 설정하고 확인합니다.

![](https://static-docs.nocobase.com/202406272107899.png)

애플리케이션 상세 페이지에서 「기업 신뢰 IP」를 클릭합니다.

![](https://static-docs.nocobase.com/202406272108834.png)

NocoBase 애플리케이션 IP를 구성합니다.

![](https://static-docs.nocobase.com/202406272109805.png)

## WeCom 관리 콘솔에서 자격 증명 가져오기

WeCom 관리 콘솔 - 내 기업에서 「기업 ID」를 복사합니다.

![](https://static-docs.nocobase.com/202406272111637.png)

WeCom 관리 콘솔 - 애플리케이션 관리에서 이전 단계에서 생성한 애플리케이션의 상세 페이지로 이동하여 AgentId와 Secret을 복사합니다.

![](https://static-docs.nocobase.com/202406272122322.png)

## NocoBase에 WeCom 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202406272115044.png)

추가 - WeCom

![](https://static-docs.nocobase.com/202406272115805.png)

### 구성

![](https://static-docs.nocobase.com/202412041459250.png)

| 옵션                                                                                                | 설명                                                                                                 | 버전 요구 사항 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| 기존 사용자와 휴대폰 번호가 일치하지 않을 경우, <br />새 사용자를 자동으로 생성하시겠습니까? | 휴대폰 번호로 기존 사용자를 찾을 수 없을 때, 새 사용자를 자동으로 생성할지 여부를 설정합니다.                  | -        |
| 회사 ID                                                                                            | WeCom 관리 콘솔에서 가져온 회사 ID입니다.                                                                    | -        |
| AgentId                                                                                               | WeCom 관리 콘솔의 자체 구축 애플리케이션 설정에서 가져옵니다.                                                                 | -        |
| Secret                                                                                                | WeCom 관리 콘솔의 자체 구축 애플리케이션 설정에서 가져옵니다.                                                                 | -        |
| Origin                                                                                                | 현재 애플리케이션 도메인입니다.                                                                                       | -        |
| 워크벤치 애플리케이션 리디렉션 링크                                                                   | 로그인 성공 후 리디렉션될 애플리케이션 경로입니다.                                                                           | `v1.4.0` |
| 자동 로그인                                                                                       | WeCom 브라우저에서 애플리케이션 링크를 열 때 자동으로 로그인합니다. 여러 WeCom 인증기가 구성된 경우, 이 옵션은 하나만 활성화할 수 있습니다. | `v1.4.0` |
| 워크벤치 애플리케이션 홈페이지 링크                                                                 | 워크벤치 애플리케이션 홈페이지 링크입니다.                                                                                 | -        |

## WeCom 애플리케이션 홈페이지 구성

:::info
`v1.4.0` 이상 버전에서는 「자동 로그인」 옵션을 활성화한 경우, 애플리케이션 홈페이지 링크를 `https://<url>/<path>`와 같이 간소화할 수 있습니다. 예를 들어 `https://example.nocobase.com/admin`과 같습니다.

모바일과 PC 버전을 각각 다르게 설정할 수도 있습니다. 예를 들어 `https://example.nocobase.com/m` (모바일) 및 `https://example.nocobase.com/admin` (PC)과 같이 설정할 수 있습니다.
:::

WeCom 관리자 콘솔에 접속하여 복사한 워크벤치 애플리케이션 홈페이지 링크를 해당 애플리케이션의 홈페이지 주소 입력란에 붙여넣습니다.

![](https://static-docs.nocobase.com/202406272123631.png)

![](https://static-docs.nocobase.com/202406272123048.png)

## 로그인

로그인 페이지에 접속하여 로그인 양식 아래에 있는 버튼을 클릭하여 서드파티 로그인을 시작합니다.

![](https://static-docs.nocobase.com/202406272124608.png)

:::warning
WeCom은 휴대폰 번호와 같은 민감한 정보에 대한 권한 제한이 있으므로, 인증은 WeCom 클라이언트 내에서만 완료할 수 있습니다. WeCom으로 처음 로그인할 때는 아래 단계를 참고하여 WeCom 클라이언트 내에서 최초 로그인 인증을 완료해 주십시오.
:::

## 최초 로그인

WeCom 클라이언트에서 워크벤치로 이동하여 하단으로 스크롤한 다음, 애플리케이션을 클릭하여 이전에 설정한 애플리케이션 홈페이지로 들어갑니다. 이렇게 하면 최초 인증 로그인이 완료되며, 이후에는 NocoBase 애플리케이션 내에서 WeCom을 사용하여 로그인할 수 있습니다.

<img src="https://static-docs.nocobase.com/202406272131113.png" width="400" />