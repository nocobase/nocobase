---
pkg: '@nocobase/plugin-verification'
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 인증: SMS

## 소개

SMS 인증 코드는 일회성 동적 비밀번호(OTP)를 생성하여 사용자에게 SMS로 전송하는 데 사용되는 내장된 인증 유형입니다.

## SMS 인증기 추가

인증 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/202502271726791.png)

추가 - SMS OTP

![](https://static-docs.nocobase.com/202502271726056.png)

## 관리자 설정

![](https://static-docs.nocobase.com/202502271727711.png)

현재 지원되는 SMS 서비스 제공업체는 다음과 같습니다:

- <a href="https://www.aliyun.com/product/sms" target="_blank">알리윈 SMS</a>
- <a href="https://cloud.tencent.com/product/sms" target="_blank">텐센트 클라우드 SMS</a>

서비스 제공업체 관리자 패널에서 SMS 템플릿을 설정할 때, SMS 인증 코드를 위한 매개변수를 예약해야 합니다.

- 알리윈 설정 예시: `Your verification code is: ${code}`

- 텐센트 클라우드 설정 예시: `Your verification code is: {1}`

개발자는 플러그인 형태로 다른 SMS 서비스 제공업체를 확장할 수도 있습니다. 참고: [SMS 서비스 제공업체 확장](./dev/sms-type)

## 사용자 바인딩

인증기를 추가한 후, 사용자는 개인 인증 관리에서 인증용 휴대폰 번호를 바인딩할 수 있습니다.

![](https://static-docs.nocobase.com/202502271737016.png)

![](https://static-docs.nocobase.com/202502271737769.png)

![](https://static-docs.nocobase.com/202502271738515.png)

바인딩이 성공하면, 해당 인증기가 바인딩된 인증 시나리오에서 신원 인증을 수행할 수 있습니다.

![](https://static-docs.nocobase.com/202502271739607.png)

## 사용자 바인딩 해제

휴대폰 번호 바인딩을 해제하려면 이미 바인딩된 인증 방식을 통해 인증을 진행해야 합니다.

![](https://static-docs.nocobase.com/202502282103205.png)