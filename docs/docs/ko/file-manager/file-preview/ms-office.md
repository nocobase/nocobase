---
pkg: '@nocobase/plugin-file-previewer-office'
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/file-manager/file-preview/ms-office)을 참조하세요.
:::

# Office 파일 미리보기 <Badge>v1.8.11+</Badge>

Office 파일 미리보기 플러그인은 Word, Excel, PowerPoint 등과 같은 Office 형식의 파일을 NocoBase 애플리케이션에서 미리 볼 수 있도록 지원합니다.  
이 플러그인은 Microsoft에서 제공하는 공개 온라인 서비스를 기반으로 하며, 공개 URL을 통해 접근 가능한 파일을 미리보기 인터페이스에 임베드하여 사용자가 파일을 다운로드하거나 Office 애플리케이션을 설치하지 않고도 브라우저에서 바로 확인할 수 있게 합니다.

## 사용 설명서

기본적으로 이 플러그인은 **비활성화** 상태입니다. 플러그인 관리자에서 활성화한 후 별도의 설정 없이 바로 사용할 수 있습니다.

![플러그인 활성화 화면](https://static-docs.nocobase.com/20250731140048.png)

컬렉션의 파일 필드에 Office 파일(Word / Excel / PowerPoint)을 성공적으로 업로드한 후, 해당 파일 아이콘이나 링크를 클릭하면 팝업 또는 임베드된 미리보기 화면에서 파일 내용을 확인할 수 있습니다.

![미리보기 작업 예시](https://static-docs.nocobase.com/20250731143231.png)

## 구현 원리

이 플러그인에 임베드된 미리보기는 Microsoft의 공개 온라인 서비스(Office Web Viewer)에 의존하며, 주요 프로세스는 다음과 같습니다.

- 프런트엔드에서 사용자가 업로드한 파일에 대해 공개적으로 접근 가능한 URL(S3 서명된 URL 포함)을 생성합니다.
- 플러그인은 iframe 내에서 다음 주소를 사용하여 파일 미리보기를 로드합니다.

  ```
  https://view.officeapps.live.com/op/embed.aspx?src=<공개 파일 URL>
  ```

- Microsoft 서비스가 해당 URL로 파일 내용을 요청하고, 이를 렌더링하여 볼 수 있는 페이지로 반환합니다.

## 주의 사항

- 이 플러그인은 Microsoft의 온라인 서비스에 의존하므로 네트워크 연결이 정상적이어야 하며, Microsoft 관련 서비스에 접근할 수 있어야 합니다.
- Microsoft는 제공된 파일 URL에 접근하며, 파일 내용은 미리보기 페이지 렌더링을 위해 해당 서버에 일시적으로 캐시됩니다. 따라서 일정 수준의 개인정보 보호 리스크가 존재하므로, 이에 대해 우려가 있는 경우 이 플러그인에서 제공하는 미리보기 기능을 사용하지 않는 것을 권장합니다[^1].
- 미리보기 대상 파일은 반드시 공개적으로 접근 가능한 URL이어야 합니다. 일반적으로 NocoBase에 업로드된 파일은 자동으로 접근 가능한 공개 링크(S3-Pro 플러그인에서 생성된 서명된 URL 포함)가 생성되지만, 파일에 접근 권한이 설정되어 있거나 내부 네트워크 환경에 저장된 경우에는 미리보기가 불가능합니다[^2].
- 이 서비스는 로그인 인증이나 프라이빗 저장소의 리소스를 지원하지 않습니다. 예를 들어, 내부 네트워크에서만 접근 가능하거나 로그인이 필요한 파일은 이 미리보기 기능을 사용할 수 없습니다.
- 파일 내용이 Microsoft 서비스에 의해 수집된 후 짧은 시간 동안 캐시될 수 있습니다. 원본 파일이 삭제되더라도 미리보기 내용은 일정 기간 동안 계속 접근 가능할 수 있습니다.
- 파일 크기에 대한 권장 제한이 있습니다. 미리보기의 안정성을 위해 Word 및 PowerPoint 파일은 10MB 이하, Excel 파일은 5MB 이하를 권장합니다[^3].
- 현재 이 서비스에 대한 공식적이고 명확한 상업적 이용 라이선스 설명이 없으므로, 사용 시 위험 요소를 직접 평가하시기 바랍니다[^4].

## 지원되는 파일 형식

플러그인은 파일의 MIME 유형 또는 파일 확장자를 기준으로 다음 Office 파일 형식의 미리보기만 지원합니다.

- Word 문서:
  `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`) 또는 `application/msword` (`.doc`)
- Excel 스프레드시트:
  `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (`.xlsx`) 또는 `application/vnd.ms-excel` (`.xls`)
- PowerPoint 프레젠테이션:
  `application/vnd.openxmlformats-officedocument.presentationml.presentation` (`.pptx`) 또는 `application/vnd.ms-powerpoint` (`.ppt`)
- OpenDocument 텍스트: `application/vnd.oasis.opendocument.text` (`.odt`)

기타 형식의 파일은 이 플러그인의 미리보기 기능이 활성화되지 않습니다.

[^1]: [What is the status of view.officeapps.live.com?](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com)
[^2]: [Microsoft Q&A - Access denied or non-public files cannot be previewed](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx)
[^3]: [Microsoft Q&A - File size limits for Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/1411722/https-view-officeapps-live-com-op-embed-aspx#file-size-limits)
[^4]: [Microsoft Q&A - Commercial use of Office Web Viewer](https://learn.microsoft.com/en-us/answers/questions/5191451/what-is-the-status-of-view-officeapps-live-com#commercial-use)