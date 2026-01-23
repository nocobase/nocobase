---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 구글 설정

### 사전 준비 사항

사용자가 NocoBase에 구글 메일 계정을 연결하려면, 구글 서비스에 접근 가능한 서버에 NocoBase를 배포해야 합니다. NocoBase 백엔드에서 Google API를 호출하기 때문입니다.
    
### 계정 등록

1. https://console.cloud.google.com/welcome 에 접속하여 Google Cloud로 이동합니다.
2. 처음 접속하는 경우 관련 약관에 동의해야 합니다.
    
![](https://static-docs.nocobase.com/mail-1733818617807.png)

### 앱 생성

1. 상단의 "Select a project"를 클릭합니다.
    
![](https://static-docs.nocobase.com/mail-1733818618126.png)

2. 팝업 창에서 "NEW PROJECT" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818618329.png)

3. 프로젝트 정보를 입력합니다.
    
![](https://static-docs.nocobase.com/mail-1733818618510.png)

4. 프로젝트 생성 완료 후 해당 프로젝트를 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818618828.png)

![](https://static-docs.nocobase.com/mail-1733818619044.png)

### Gmail API 활성화

1. "APIs & Services" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818619230.png)

2. APIs & Services 대시보드로 이동합니다.

![](https://static-docs.nocobase.com/mail-1733818619419.png)

3. "mail"을 검색합니다.

![](https://static-docs.nocobase.com/mail-1733818619810.png)

![](https://static-docs.nocobase.com/mail-1733818620020.png)

4. "ENABLE" 버튼을 클릭하여 Gmail API를 활성화합니다.

![](https://static-docs.nocobase.com/mail-1733818620589.png)

![](https://static-docs.nocobase.com/mail-1733818620885.png)

### OAuth 동의 화면 설정

1. 왼쪽 메뉴에서 "OAuth consent screen"을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818621104.png)

2. "External"을 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818621322.png)

3. 프로젝트 정보를 입력하고 (이 정보는 나중에 승인 페이지에 표시됩니다) 저장을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818621538.png)

4. 개발자 연락처 정보를 입력하고 계속을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818621749.png)

5. 계속을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818622121.png)

6. 앱 게시 전 테스트를 위해 테스트 사용자를 추가합니다.

![](https://static-docs.nocobase.com/mail-1733818622332.png)

![](https://static-docs.nocobase.com/mail-1733818622537.png)

7. 계속을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818622753.png)

8. 요약 정보를 확인하고 대시보드로 돌아갑니다.

![](https://static-docs.nocobase.com/mail-1733818622984.png)

### 사용자 인증 정보 생성

1. 왼쪽 메뉴에서 "Credentials"를 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818623168.png)

2. "CREATE CREDENTIALS" 버튼을 클릭하고 "OAuth client ID"를 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818623386.png)

3. "Web application"을 선택합니다.

![](https://static-docs.nocobase.com/mail-1733818623758.png)

4. 애플리케이션 정보를 입력합니다.

![](https://static-docs.nocobase.com/mail-1733818623992.png)

5. 프로젝트가 최종 배포될 도메인을 입력합니다 (여기서는 NocoBase 테스트 주소를 예시로 사용합니다).

![](https://static-docs.nocobase.com/mail-1733818624188.png)

6. 승인된 리디렉션 URI를 추가합니다. `도메인 + "/admin/settings/mail/oauth2"` 형식이어야 합니다. 예시: `https://pr-1-mail.test.nocobase.com/admin/settings/mail/oauth2`

![](https://static-docs.nocobase.com/mail-1733818624449.png)

7. 생성을 클릭하면 OAuth 정보를 확인할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733818624701.png)

8. Client ID와 Client secret을 각각 복사하여 메일 설정 페이지에 붙여넣습니다.

![](https://static-docs.nocobase.com/mail-1733818624923.png)

9. 저장을 클릭하면 설정이 완료됩니다.

### 앱 게시

위 과정을 완료하고 테스트 사용자 승인 로그인, 메일 발송 등의 기능 테스트를 마친 후 앱을 게시할 수 있습니다.

1. "OAuth consent screen" 메뉴를 클릭합니다.

![](https://static-docs.nocobase.com/mail-1733818625124.png)

2. "EDIT APP" 버튼을 클릭한 다음, 하단의 "SAVE AND CONTINUE" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1735633686380.png)

![](https://static-docs.nocobase.com/mail-1735633686750.png)

3. "ADD OR REMOVE SCOPES" 버튼을 클릭하여 사용자 권한 범위를 선택합니다.

![](https://static-docs.nocobase.com/mail-1735633687054.png)

4. "Gmail API"를 검색한 다음, "Gmail API"를 선택합니다 (Scope 값이 "https://mail.google.com/"인 Gmail API인지 확인하세요).

![](https://static-docs.nocobase.com/mail-1735633687283.png)

5. 하단의 "UPDATE" 버튼을 클릭하여 저장합니다.

![](https://static-docs.nocobase.com/mail-1735633687536.png)

6. 각 페이지 하단의 "SAVE AND CONTINUE" 버튼을 클릭하고, 마지막으로 "BACK TO DASHBOARD" 버튼을 클릭하여 대시보드 페이지로 돌아갑니다.

![](https://static-docs.nocobase.com/mail-1735633687744.png)

![](https://static-docs.nocobase.com/mail-1735633687912.png)

![](https://static-docs.nocobase.com/mail-1735633688075.png)

7. "PUBLISH APP" 버튼을 클릭하면 게시를 위해 필요한 관련 내용이 나열된 게시 확인 페이지가 나타납니다. 이어서 "CONFIRM" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1735633688257.png)

8. 다시 콘솔 페이지로 돌아가면 게시 상태가 "In production"으로 표시되는 것을 확인할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1735633688425.png)

9. "PREPARE FOR VERIFICATION" 버튼을 클릭하고 필수 정보를 입력한 다음, "SAVE AND CONTINUE" 버튼을 클릭합니다 (이미지 내 데이터는 예시일 뿐입니다).

![](https://static-docs.nocobase.com/mail-1735633688634.png)

![](https://static-docs.nocobase.com/mail-1735633688827.png)

10. 계속해서 필요한 정보를 입력합니다 (이미지 내 데이터는 예시일 뿐입니다).

![](https://static-docs.nocobase.com/mail-1735633688993.png)

11. "SAVE AND CONTINUE" 버튼을 클릭합니다.

![](https://static-docs.nocobase.com/mail-1735633689159.png)

12. "SUBMIT FOR VERIFICATION" 버튼을 클릭하여 인증을 제출합니다.

![](https://static-docs.nocobase.com/mail-1735633689318.png)

13. 승인 결과를 기다립니다.

![](https://static-docs.nocobase.com/mail-1735633689494.png)

14. 승인이 아직 완료되지 않은 경우, 사용자는 안전하지 않은 링크를 클릭하여 승인 후 로그인할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1735633689645.png)