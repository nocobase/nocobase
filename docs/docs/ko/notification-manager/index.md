---
pkg: '@nocobase/plugin-notification-manager'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 알림 관리

## 소개

알림 관리는 다양한 알림 채널을 통합하는 중앙 집중식 서비스입니다. 통합된 채널 설정, 발송 관리 및 로그 기록 기능을 제공하며 유연한 확장을 지원합니다.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- **보라색 부분**: 알림 관리는 채널 설정, 로그 기록 등의 기능을 포함하는 통합 관리 서비스를 제공하며, 알림 채널은 확장 가능합니다.
- **초록색 부분**: 앱 내 메시지(In-App Message)는 내장된 채널로, 사용자가 애플리케이션 내에서 직접 알림을 받을 수 있도록 지원합니다.
- **빨간색 부분**: 이메일(Email)은 확장 가능한 채널로, 사용자가 이메일을 통해 알림을 받을 수 있도록 합니다.

## 채널 관리

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

현재 지원되는 채널은 다음과 같습니다:

- [앱 내 메시지](/notification-manager/notification-in-app-message)
- [이메일](/notification-manager/notification-email) (내장된 SMTP 전송 방식 사용)

더 많은 채널 알림으로 확장할 수도 있습니다. 자세한 내용은 [채널 확장](/notification-manager/development/extension) 문서를 참조하십시오.

## 알림 로그

각 알림의 발송 상세 정보와 상태를 자세히 기록하여 분석 및 문제 해결에 용이합니다.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## 워크플로우 알림 노드

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)