---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# Microsoft 구성

### 필수 조건
사용자가 Outlook 메일함을 NocoBase에 연결하려면, Microsoft 서비스에 접근할 수 있는 서버에 NocoBase를 배포해야 합니다. 백엔드에서 Microsoft API를 호출할 것입니다.

### 계정 등록

1. https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account 에 접속합니다.
    
2. Microsoft 계정에 로그인합니다.
    
![](https://static-docs.nocobase.com/mail-1733818625779.png)

### 테넌트 생성

1. https://azure.microsoft.com/zh-cn/pricing/purchase-options/azure-account?icid=azurefreeaccount 에 접속하여 계정에 로그인합니다.
    
2. 기본 정보를 입력하고 인증 코드를 받습니다.

![](https://static-docs.nocobase.com/mail-1733818625984.png)

3. 나머지 정보를 입력하고 계속 진행합니다.

![](https://static-docs.nocobase.com/mail-1733818626352.png)

4. 신용카드 관련 정보를 입력합니다 (지금은 생성하지 않아도 됩니다).

![](https://static-docs.nocobase.com/mail-1733818626622.png)

### 클라이언트 ID 가져오기

1. 상단 메뉴를 클릭하고 "Microsoft Entra ID"를 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818626871.png)

2. 왼쪽에서 "App registrations"를 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818627097.png)

3. 상단의 "New registration"을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818627309.png)

4. 정보를 입력하고 제출합니다.

이름은 자유롭게 지정할 수 있습니다. 계정 유형은 아래 이미지에 표시된 옵션을 참조하여 선택하고, 리디렉션 URI는 지금은 비워두어도 됩니다.

![](https://static-docs.nocobase.com/mail-1733818627555.png)

5. 클라이언트 ID를 확인합니다.

![](https://static-docs.nocobase.com/mail-1733818627797.png)

### API 권한 부여

1. 왼쪽의 "API permissions" 메뉴를 엽니다.

![](https://static-docs.nocobase.com/mail-1733818628178.png)

2. "Add a permission" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818628448.png)

3. "Microsoft Graph"를 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818628725.png)

![](https://static-docs.nocobase.com/mail-1733818628927.png)

4. 다음 권한들을 검색하여 추가합니다. 최종 결과는 아래 이미지와 같아야 합니다.
    
    1. `"email"`
    2. `"offline_access"`
    3. `"IMAP.AccessAsUser.All"`
    4. `"SMTP.Send"`
    5. `"offline_access"`
    6. `"User.Read"` (기본값)

![](https://static-docs.nocobase.com/mail-1733818629130.png)

### 클라이언트 비밀 가져오기

1. 왼쪽의 "Certificates & secrets"를 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818629369.png)

2. "New client secret" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818629554.png)

3. 설명과 만료 시간을 입력하고 추가합니다.

![](https://static-docs.nocobase.com/mail-1733818630292.png)

4. 비밀 키 ID를 확인합니다.

![](https://static-docs.nocobase.com/mail-1733818630535.png)

5. 클라이언트 ID와 클라이언트 비밀을 각각 복사하여 메일 설정 페이지에 입력합니다.

![](https://static-docs.nocobase.com/mail-1733818630710.png)