---
pkg: '@nocobase/plugin-file-manager'
---
:::tip AI 번역 안내
이 문서는 AI로 자동 번역되었습니다.
:::

# 파일 미리보기

파일 필드(첨부 파일 필드 포함)가 있는 화면에서는 파일 썸네일이나 아이콘을 클릭하여 파일을 미리 볼 수 있습니다. 내장 미리보기 기능은 이미지, PDF 및 브라우저가 기본적으로 지원하는 대부분의 파일 형식을 지원합니다.

![20251129232307](https://static-docs.nocobase.com/20251129232307.png)

기본 미리보기를 지원하지 않는 파일 형식은 해당 파일 미리보기 플러그인을 설치하거나 확장하여 미리보기 기능을 활성화할 수 있습니다. 예를 들어 Office 파일 미리보기 플러그인을 설치하면 Word, Excel, PowerPoint 파일을 미리 볼 수 있습니다.

현재 NocoBase는 다음 파일 미리보기 플러그인을 제공합니다.

* Office 파일 미리보기 플러그인

## 외부 저장소의 PDF 미리보기

PDF 미리보기는 PDF.js를 사용하여 브라우저에서 파일을 렌더링합니다. 브라우저는 먼저 PDF 파일 내용을 읽은 다음 PDF.js에 전달하여 렌더링해야 합니다. 따라서 파일이 OSS, S3, COS, CDN과 같은 외부 저장소에 저장되어 있고 파일 접근 도메인이 NocoBase 사이트 도메인과 다른 경우, 외부 저장소는 NocoBase 사이트가 교차 출처로 파일을 읽을 수 있도록 허용해야 합니다.

CORS가 구성되어 있지 않아도 PDF 다운로드는 정상적으로 동작할 수 있지만, 미리보기는 파일 로드 오류로 실패할 수 있습니다.

외부 저장소 또는 CDN의 CORS 설정에는 다음 항목이 포함되는 것이 좋습니다.

```http
Access-Control-Allow-Origin: https://your-nocobase-domain
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Allow-Headers: *
Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges, Content-Disposition, Content-Type
```

`Access-Control-Allow-Origin`은 NocoBase에 실제로 접근하는 도메인으로 설정해야 합니다. 비공개 파일에는 장기적으로 `*`를 사용하지 않는 것이 좋습니다. 파일을 읽을 수 있는 사이트 범위가 넓어지기 때문입니다.
