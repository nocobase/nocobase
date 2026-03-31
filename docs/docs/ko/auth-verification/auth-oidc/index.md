---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: OIDC

## 소개

인증: OIDC 플러그인은 OIDC (Open ConnectID) 프로토콜 표준을 따르며, 권한 부여 코드 플로우 (Authorization Code Flow)를 사용하여 사용자가 타사 ID 공급자 (IdP)에서 제공하는 계정으로 NocoBase에 로그인할 수 있도록 지원합니다.

## 플러그인 활성화

![](https://static-docs.nocobase.com/202411122358790.png)

## OIDC 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202411130004459.png)

추가 - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## 설정

### 기본 설정

![](https://static-docs.nocobase.com/202411130006341.png)

| 설정                                               | 설명                                                                                                                            | 버전           |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| Sign up automatically when the user does not exist | 일치하는 기존 사용자를 찾을 수 없는 경우 새 사용자를 자동으로 생성할지 여부를 설정합니다.                                             | -              |
| Issuer                                             | IdP에서 제공하는 Issuer로, 일반적으로 `/.well-known/openid-configuration`으로 끝납니다.                                                           | -              |
| Client ID                                          | 클라이언트 ID                                                                                                                        | -              |
| Client Secret                                      | 클라이언트 Secret                                                                                                                      | -              |
| scope                                              | 선택 사항이며, 기본값은 `openid email profile`입니다.                                                                                           | -              |
| id_token signed response algorithm                 | `id_token`의 서명 알고리즘이며, 기본값은 `RS256`입니다.                                                                                           | -              |
| Enable RP-initiated logout                         | RP 시작 로그아웃을 활성화합니다. 사용자가 로그아웃할 때 IdP 로그인 상태도 로그아웃됩니다. IdP 로그아웃 콜백은 [사용법](#사용법) 섹션에 제공된 Post logout redirect URL을 사용해야 합니다. | `v1.3.44-beta` |

### 필드 매핑

![](https://static-docs.nocobase.com/92d3c8f6f4082b50d9f475674cb5650.png)

| 설정                            | 설명                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | 필드 매핑입니다. NocoBase에서 현재 매핑할 수 있는 필드는 닉네임, 이메일, 휴대폰 번호입니다. 기본 닉네임은 `openid`를 사용합니다.                                 |
| Use this field to bind the user | 기존 사용자와 일치시키고 바인딩하는 데 사용되는 필드입니다. 이메일 또는 사용자 이름을 선택할 수 있으며, 기본값은 이메일입니다. IdP는 `email` 또는 `username` 필드를 포함한 사용자 정보를 제공해야 합니다. |

### 고급 설정

![](https://static-docs.nocobase.com/202411130013306.png)

| 설정                                                              | 설명                                                                                                                                                                                     | 버전           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| HTTP                                                              | NocoBase 콜백 URL이 HTTP 프로토콜을 사용하는지 여부를 설정합니다. 기본값은 `https`입니다.                                                                                                                                        | -              |
| Port                                                              | NocoBase 콜백 URL의 포트입니다. 기본값은 `443/80`입니다.                                                                                                                                                 | -              |
| State token                                                       | 요청 출처를 확인하고 CSRF 공격을 방지하는 데 사용됩니다. 고정 값을 입력할 수 있지만, **비워두어 기본적으로 임의의 값이 생성되도록 하는 것을 강력히 권장합니다. 고정 값을 사용하려면 사용 환경과 보안 위험을 직접 평가해야 합니다.**                                           | -              |
| Pass parameters in the authorization code grant exchange          | 코드를 토큰으로 교환할 때 일부 IdP는 클라이언트 ID 또는 클라이언트 Secret을 매개변수로 전달하도록 요구할 수 있습니다. 이 옵션을 선택하고 해당 매개변수 이름을 입력할 수 있습니다.                                                               | -              |
| Method to call the user info endpoint                             | 사용자 정보 API를 요청할 때 사용되는 HTTP 메서드입니다.                                                                                                                                                  | -              |
| Where to put the access token when calling the user info endpoint | 사용자 정보 API를 호출할 때 액세스 토큰 전달 방식입니다.<br/>- Header - 요청 헤더 (기본값)<br />- Body - 요청 본문, `POST` 메서드와 함께 사용<br />- Query parameters - 쿼리 매개변수, `GET` 메서드와 함께 사용 | -              |
| Skip SSL verification                                             | IdP API를 요청할 때 SSL 확인을 건너뜠니다. **이 옵션은 시스템을 중간자 공격 위험에 노출시킬 수 있으므로, 이 옵션의 용도를 명확히 이해하는 경우에만 선택하십시오. 프로덕션 환경에서는 이 설정을 사용하지 않는 것을 강력히 권장합니다.**                         | `v1.3.40-beta` |

### 사용법

![](https://static-docs.nocobase.com/202411130019570.png)

| 설정                     | 설명                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| Redirect URL             | IdP의 콜백 URL 설정에 사용됩니다.                                                 |
| Post logout redirect URL | RP 시작 로그아웃이 활성화된 경우, IdP의 로그아웃 후 리다이렉트 URL 설정에 사용됩니다. |

:::info
로컬 테스트 시, URL은 `localhost` 대신 `127.0.0.1`을 사용하십시오. OIDC 로그인 방식은 보안 검증을 위해 클라이언트 쿠키에 state를 기록해야 합니다. 로그인 시 창이 잠깐 나타났다가 사라지면서 로그인이 성공하지 않는 경우, 서버 로그에 state 불일치 기록이 있는지, 그리고 요청 쿠키에 state 매개변수가 포함되어 있는지 확인하십시오. 이러한 상황은 일반적으로 클라이언트 쿠키의 state와 요청에 포함된 state가 일치하지 않아 발생합니다.
:::

## 로그인

로그인 페이지에 접속하여 로그인 폼 아래의 버튼을 클릭하면 타사 로그인을 시작할 수 있습니다.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)