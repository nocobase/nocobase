---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 이메일 발송

## 소개

이메일을 발송하는 데 사용되며, 텍스트 및 HTML 형식의 메일 내용을 지원합니다.

## 노드 생성

워크플로우 설정 화면에서, 워크플로우 내의 더하기("+"") 버튼을 클릭하여 “이메일 발송” 노드를 추가합니다.

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## 노드 설정

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

각 옵션은 워크플로우 컨텍스트의 변수를 사용할 수 있습니다. 민감한 정보의 경우, 전역 변수 및 시크릿(secrets)을 사용할 수도 있습니다.

## 자주 묻는 질문

### Gmail 발송 빈도 제한

일부 이메일을 발송할 때 다음과 같은 오류가 발생할 수 있습니다:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

이는 Gmail이 지정되지 않은 발송 도메인에서 오는 요청에 대해 빈도 제한을 적용하기 때문입니다. 따라서 애플리케이션을 배포할 때, 서버의 호스트 이름을 Gmail에 연결된 발송 도메인으로 설정해야 합니다. 예를 들어, Docker 배포 시에는 다음과 같습니다:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Gmail에 연결된 발송 도메인으로 설정하세요.
```

참고: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)