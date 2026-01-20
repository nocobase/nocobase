---
pkg: '@nocobase/plugin-auth-cas'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: CAS

## 소개

인증: CAS 플러그인은 CAS (Central Authentication Service) 프로토콜 표준을 따르며, 사용자가 타사 신원 인증 서비스 제공업체 (IdP)에서 제공하는 계정을 사용하여 NocoBase에 로그인할 수 있도록 합니다.

## 설치

## 사용 설명서

### 플러그인 활성화

![](https://static-docs.nocobase.com/469c48d9f2e8d41a088092c34ddb41f5.png)

### CAS 인증 추가

사용자 인증 관리 페이지에 접속합니다.

http://localhost:13000/admin/settings/auth/authenticators

CAS 인증 방식을 추가합니다.

![](https://static-docs.nocobase.com/a268500c5008d3b90e57ff1e2ea41aca.png)

CAS를 설정하고 활성화합니다.

![](https://static-docs.nocobase.com/2518b3fcc80d8a41391f3b629a510a02.png)

### 로그인 페이지 방문

http://localhost:13000/signin

![](https://static-docs.nocobase.com/49116aafbb2ed7218306f929ac8af967.png)