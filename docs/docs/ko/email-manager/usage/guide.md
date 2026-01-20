---
pkg: "@nocobase/plugin-email-manager"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



# 이메일 센터

## 소개
이메일 플러그인을 활성화하면, 기본적으로 이메일 센터가 제공됩니다. 이메일 센터에서는 계정 연결, 이메일 관리, 기능 설정 등을 할 수 있습니다.

오른쪽 상단에 있는 이메일 메시지 아이콘을 클릭하면 이메일 관리 페이지로 이동합니다.

![](https://static-docs.nocobase.com/mail-1733816161753.png)

## 계정 연결

### 계정 연결하기

"Account setting" 버튼을 클릭하고, 열리는 팝업에서 "Link account" 버튼을 클릭하여 연결할 이메일 계정 유형을 선택합니다.

![](https://static-docs.nocobase.com/mail-1733816162279.png)

브라우저가 해당 이메일 로그인 페이지를 자동으로 엽니다. 계정에 로그인하고 필요한 권한을 승인해 주세요.

![](https://static-docs.nocobase.com/mail-1733816162534.png)

인증이 완료되면 NocoBase 페이지로 다시 리디렉션되어 계정 연결 및 데이터 동기화가 진행됩니다 (첫 동기화는 시간이 다소 걸릴 수 있으니 잠시 기다려 주세요).

![](https://static-docs.nocobase.com/mail-1733816162794.png)

데이터 동기화가 완료되면 현재 페이지는 자동으로 닫히고 원래 이메일 메시지 페이지로 돌아갑니다. 이제 계정이 연결된 것을 확인할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816163177.png)

오버레이 영역을 클릭하여 팝업을 닫으면 이메일 목록을 볼 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816163503.png)

### 계정 삭제하기

"Delete" 버튼을 클릭하면 계정과 연결된 이메일이 모두 삭제됩니다.

![](https://static-docs.nocobase.com/mail-1733816163758.png)

## 이메일 관리

### 이메일 필터링

이메일 관리 페이지에서 왼쪽은 필터 영역이고 오른쪽은 이메일 목록 영역입니다. 페이지에 접속하면 기본적으로 받은 편지함이 표시됩니다.

![](https://static-docs.nocobase.com/mail-1733816165536.png)

동일한 제목의 이메일은 병합되어 처리되며, 제목 필드 뒤에 해당 대화에 포함된 총 이메일 수가 표시됩니다.
동일한 제목의 이메일 중 일부가 필터 조건과 일치하면, 해당 대화의 '루트 이메일'이 표시되고 제목 필드 옆에 현재 루트 이메일의 유형이 함께 표시됩니다.

![](https://static-docs.nocobase.com/mail-1733816165797.png)

읽지 않은 이메일 제목은 굵게 표시되며, 상단의 이메일 아이콘 옆에는 읽지 않은 이메일 수가 배지로 표시됩니다.

![](https://static-docs.nocobase.com/mail-1733816166067.png)

### 이메일 수동 동기화

현재 이메일 동기화 간격은 5분입니다. 이메일을 강제로 동기화하려면 "Refresh" 버튼을 클릭하세요.

![](https://static-docs.nocobase.com/mail-1733816166364.png)

### 읽음 상태 변경

"Mark as read" 및 "Mark as unread" 버튼을 사용하여 이메일의 읽음 상태를 일괄적으로 변경할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816166621.png)

### 이메일 보내기

상단의 "Write email" 버튼을 클릭하면 이메일 작성 패널이 열립니다.

![](https://static-docs.nocobase.com/mail-1733816166970.png)

관련 정보를 입력한 후 이메일을 보낼 수 있습니다. 현재 첨부 파일은 3MB 이하만 지원됩니다.

![](https://static-docs.nocobase.com/mail-1733816167214.png)

### 이메일 보기

행에 있는 "View" 버튼을 클릭하면 이메일 상세 정보를 볼 수 있습니다. 현재 두 가지 형식으로 제공되는데, 하나는 단일 이메일로 상세 정보를 바로 확인할 수 있는 형식입니다.

![](https://static-docs.nocobase.com/mail-1733816167456.png)

다른 하나는 동일한 제목의 여러 이메일로, 기본적으로 목록 형태로 표시되며 클릭하여 펼치거나 접을 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816167750.png)

이메일 상세 정보를 확인하면 기본적으로 읽음 상태로 변경됩니다. 다시 읽지 않음 상태로 변경하려면 오른쪽의 "..." 버튼을 클릭한 후 "Mark as unread"를 선택하세요.

### 이메일 답장하기

이메일 상세 정보로 들어가면 하단에 "Reply" 버튼이 있어 답장할 수 있습니다. 여러 사람이 관련된 경우 "Reply all"을 클릭하여 모든 사람에게 답장할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816167998.png)

### 이메일 전달하기

하단의 "Forward" 버튼을 클릭하여 다른 사람에게 이메일을 전달할 수 있습니다.

![](https://static-docs.nocobase.com/mail-1733816168241.png)