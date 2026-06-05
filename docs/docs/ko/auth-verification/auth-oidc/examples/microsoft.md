:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# Microsoft Entra ID

> https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app  
> https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc

## NocoBase에 인증기 추가하기

먼저 NocoBase에서 인증기를 새로 추가합니다. 경로는 '플러그인 설정' > '사용자 인증' > '추가' > 'OIDC'입니다.

콜백 URL을 복사합니다.

![](https://static-docs.nocobase.com/202412021504114.png)

## 애플리케이션 등록하기

Microsoft Entra 관리 센터를 열고 새 애플리케이션을 등록합니다.

![](https://static-docs.nocobase.com/202412021506837.png)

여기에 방금 복사한 콜백 URL을 붙여넣습니다.

![](https://static-docs.nocobase.com/202412021520696.png)

## 필요한 정보 확인 및 입력

방금 등록한 애플리케이션을 클릭하여 들어간 후, 개요 페이지에서 **Application (client) ID**와 **Directory (tenant) ID**를 복사합니다.

![](https://static-docs.nocobase.com/202412021522063.png)

`Certificates & secrets`를 클릭하여 새 클라이언트 암호(Client secrets)를 생성하고, 해당 **값(Value)**을 복사합니다.

![](https://static-docs.nocobase.com/202412021522846.png)

위에서 확인한 Microsoft Entra 정보와 NocoBase 인증기 설정 필드의 대응 관계는 다음과 같습니다.

| Microsoft Entra 정보        | NocoBase 인증기 필드                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application (client) ID     | Client ID                                                                                                                                        |
| Client secrets - 값(Value)  | Client secret                                                                                                                                    |
| Directory (tenant) ID       | Issuer:<br />https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration, 여기서 `{tenant}`는 해당 Directory (tenant) ID로 대체해야 합니다. |