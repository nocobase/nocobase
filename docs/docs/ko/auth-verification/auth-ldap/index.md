---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# 인증: LDAP

## 소개

인증: LDAP 플러그인은 LDAP (Lightweight Directory Access Protocol) 프로토콜 표준을 따르며, 사용자가 LDAP 서버의 계정 정보로 NocoBase에 로그인할 수 있도록 지원합니다.

## 플러그인 활성화

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## LDAP 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

추가 - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## 설정

### 기본 설정

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- Sign up automatically when the user does not exist - 일치하는 기존 사용자를 찾을 수 없을 때 새 사용자를 자동으로 생성할지 여부를 설정합니다.
- LDAP URL - LDAP 서버 주소
- Bind DN - 서버 연결 테스트 및 사용자 검색에 사용되는 DN입니다.
- Bind password - Bind DN의 비밀번호
- Test connection - 버튼을 클릭하여 서버 연결 및 Bind DN 유효성을 테스트합니다.

### 검색 설정

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- Search DN - 사용자 검색에 사용되는 DN입니다.
- Search filter - 사용자 검색을 위한 필터링 조건입니다. 로그인 시 사용되는 사용자 계정은 `{{account}}`로 나타냅니다.
- Scope - `Base`, `One level`, `Subtree` 중 선택합니다. 기본값은 `Subtree`입니다.
- Size limit - 검색 페이지 크기

### 속성 매핑

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- Use this field to bind the user - 기존 사용자를 바인딩하는 데 사용되는 필드입니다. 로그인 계정이 사용자 이름인 경우 '사용자 이름'을 선택하고, 이메일인 경우 '이메일'을 선택합니다. 기본값은 '사용자 이름'입니다.
- Attribute map - 사용자 속성과 NocoBase 사용자 테이블 필드의 매핑입니다.

## 로그인

로그인 페이지로 이동하여 로그인 폼에 LDAP 사용자 이름과 비밀번호를 입력하여 로그인합니다.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>