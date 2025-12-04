:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Google Workspace

## Google을 IdP로 설정하기

[Google 관리 콘솔](https://admin.google.com/) - 앱 - 웹 및 모바일 앱

![](https://static-docs.nocobase.com/0812780b990a97a63c14ea8991959827.png)

앱 설정을 마친 후, **SSO URL**, **엔티티 ID**, 그리고 **인증서**를 복사합니다.

![](https://static-docs.nocobase.com/aafd20a794730e85411c0c8f368637e0.png)

## NocoBase에 새 인증기 추가하기

플러그인 설정 - 사용자 인증 - 추가 - SAML

![](https://static-docs.nocobase.com/5bc18c7952b8f15828e26bb07251a335.png)

방금 복사한 정보를 다음 순서대로 입력합니다.

- SSO URL: SSO URL
- Public Certificate: 인증서
- idP Issuer: 엔티티 ID
- http: 로컬 HTTP 환경에서 테스트하는 경우 체크합니다.

그다음, Usage 섹션에서 SP Issuer/EntityID와 ACS URL을 복사합니다.

## Google에 SP 정보 입력하기

Google 콘솔로 돌아가서, **서비스 제공업체 세부정보** 페이지에서 방금 복사한 ACS URL과 엔티티 ID를 입력하고 **서명된 응답**을 체크합니다.

![](https://static-docs.nocobase.com/1536268bf8df4a5ebc72384317172191.png)

![](https://static-docs.nocobase.com/c7de1f8b84c1335de110e5a7c96255c4.png)

**속성 매핑** 섹션에서 매핑을 추가하여 해당 속성을 매핑할 수 있습니다.

![](https://static-docs.nocobase.com/27180f2f46480c3fee3016df86d6fdb8.png)