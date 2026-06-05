:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Google로 로그인

> https://developers.google.com/identity/openid-connect/openid-connect

## Google OAuth 2.0 사용자 인증 정보 가져오기

[Google Cloud Console](https://console.cloud.google.com/apis/credentials)로 이동하여 '사용자 인증 정보 만들기'를 선택한 후 'OAuth 클라이언트 ID'를 클릭합니다.

![](https://static-docs.nocobase.com/0f2946c8643565ecc4ac13249882638c.png)

설정 화면으로 이동하여 승인된 리디렉션 URL을 입력합니다. 이 리디렉션 URL은 NocoBase에서 인증기를 추가할 때 확인할 수 있으며, 일반적으로 `http(s)://host:port/api/oidc:redirect` 형식입니다. 자세한 내용은 [사용자 매뉴얼 - 설정](../index.md#configuration) 섹션을 참고하세요.

![](https://static-docs.nocobase.com/24078bf52ec966a16334894cb3d9d126.png)

## NocoBase에서 인증기 추가하기

플러그인 설정 > 사용자 인증 > 추가 > OIDC

![](https://static-docs.nocobase.com/0e4b1acdef6335aaee2139ae6629977b.png)

[사용자 매뉴얼 - 설정](../index.md#configuration)에서 설명하는 매개변수를 참고하여 인증기 설정을 완료합니다.