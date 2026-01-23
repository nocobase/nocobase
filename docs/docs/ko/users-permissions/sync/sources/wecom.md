---
pkg: "@nocobase/plugin-wecom"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# WeChat Work에서 사용자 데이터 동기화

## 소개

**WeChat Work** 플러그인은 사용자가 WeChat Work에서 사용자 및 부서 데이터를 동기화할 수 있도록 지원합니다.

## WeChat Work 자체 구축 애플리케이션 생성 및 구성

먼저 WeChat Work 관리 콘솔에서 자체 구축 애플리케이션을 생성하고 **기업 ID**, **AgentId**, **Secret**을(를) 얻어야 합니다.

[사용자 인증 - WeChat Work](/auth-verification/auth-wecom/)을(를) 참고하세요.

## NocoBase에 동기화 데이터 소스 추가

사용자 및 권한 - 동기화 - 추가로 이동하여 획득한 관련 정보를 입력합니다.

![](https://static-docs.nocobase.com/202412041251867.png)

## 연락처 동기화 구성

WeChat Work 관리 콘솔로 이동하여 보안 및 관리 - 관리 도구에서 연락처 동기화를 클릭합니다.

![](https://static-docs.nocobase.com/202412041249958.png)

그림과 같이 설정하고 기업의 신뢰할 수 있는 IP를 설정합니다.

![](https://static-docs.nocobase.com/202412041250776.png)

이제 사용자 데이터 동기화를 진행할 수 있습니다.

## 이벤트 수신 서버 설정

WeChat Work 측의 사용자 및 부서 데이터 변경 사항이 NocoBase 애플리케이션에 즉시 동기화되기를 원한다면, 추가 설정을 진행할 수 있습니다.

이전 구성 정보를 입력한 후, 연락처 콜백 알림 URL을 복사할 수 있습니다.

![](https://static-docs.nocobase.com/202412041256547.png)

WeChat Work 설정에 입력하고, Token과 EncodingAESKey를 획득하여 NocoBase 사용자 동기화 데이터 소스 구성을 완료합니다.

![](https://static-docs.nocobase.com/202412041257947.png)