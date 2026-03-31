---
pkg: '@nocobase/plugin-auth-dingtalk'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: DingTalk

## 소개

인증: DingTalk 플러그인은 사용자가 DingTalk 계정을 사용하여 NocoBase에 로그인할 수 있도록 지원합니다.

## 플러그인 활성화

![](https://static-docs.nocobase.com/202406120929356.png)

## DingTalk 개발자 콘솔에서 API 권한 신청

<a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk 오픈 플랫폼 - 서드파티 웹사이트 로그인 구현</a> 문서를 참고하여 애플리케이션을 생성합니다.

애플리케이션 관리 콘솔로 이동하여 "개인 휴대폰 번호 정보"와 "주소록 개인 정보 읽기 권한"을 활성화합니다.

![](https://static-docs.nocobase.com/202406120006620.png)

## DingTalk 개발자 콘솔에서 인증 정보 가져오기

Client ID와 Client Secret을 복사합니다.

![](https://static-docs.nocobase.com/202406120000595.png)

## NocoBase에 DingTalk 인증 추가

사용자 인증 플러그인 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202406112348051.png)

추가 - DingTalk

![](https://static-docs.nocobase.com/202406112349664.png)

### 설정

![](https://static-docs.nocobase.com/202406120016896.png)

- Sign up automatically when the user does not exist - 휴대폰 번호로 기존 사용자를 찾을 수 없을 때, 새 사용자를 자동으로 생성할지 여부입니다.
- Client ID와 Client Secret - 이전 단계에서 복사한 정보를 입력합니다.
- Redirect URL - 콜백 URL입니다. 복사한 후 다음 단계로 진행합니다.

## DingTalk 개발자 콘솔에서 콜백 URL 설정

복사한 콜백 URL을 DingTalk 개발자 콘솔에 입력합니다.

![](https://static-docs.nocobase.com/202406120012221.png)

## 로그인

로그인 페이지에 접속하여 로그인 폼 아래의 버튼을 클릭하면 서드파티 로그인을 시작할 수 있습니다.

![](https://static-docs.nocobase.com/202406120014539.png)