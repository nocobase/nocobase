:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/get-started/translations)을 참조하세요.
:::

# 번역 기여

NocoBase의 기본 언어는 영어입니다. 현재 기본 애플리케이션은 영어, 이탈리아어, 네덜란드어, 중국어 간체 및 일본어를 지원합니다. 전 세계 사용자가 더욱 편리하게 NocoBase를 경험할 수 있도록 다른 언어 번역에 기여해 주시기를 진심으로 초대합니다.

---

## I. 시스템 현지화

### 1. 시스템 인터페이스 및 플러그인 번역

#### 1.1 번역 범위
NocoBase 시스템 인터페이스 및 플러그인의 현지화에만 적용되며, 기타 사용자 정의 콘텐츠(컬렉션 또는 Markdown 블록 등)는 포함되지 않습니다.

![bbb6e0b44aeg](https://static-docs.nocobase.com/img_v3_02kh_8d429938-3aca-44b6-a437-bbb6e0b44aeg.jpg)

![20250319220127](https://static-docs.nocobase.com/20250319220127.png)


#### 1.2 현지화 콘텐츠 개요
NocoBase는 Git을 사용하여 현지화 콘텐츠를 관리합니다. 주요 저장소는 다음과 같습니다:
https://github.com/nocobase/nocobase/tree/main/locales

각 언어는 언어 코드로 명명된 JSON 파일로 표시됩니다(예: de-DE.json, fr-FR.json). 파일 구조는 플러그인 모듈별로 구성되며, 키-값 쌍을 사용하여 번역을 저장합니다. 예를 들어:

```json
{
  // 클라이언트 플러그인
  "@nocobase/client": {
    "(Fields only)": "(Fields only)",
    "12 hour": "12 hour",
    "24 hour": "24 hour"
    // ...기타 키-값 쌍
  },
  "@nocobase/plugin-acl": {
    // 이 플러그인의 키-값 쌍
  }
  // ...기타 플러그인 모듈
}
```

번역 시, 다음과 유사한 구조로 점진적으로 변환해 주십시오:

```json
{
  // 클라이언트 플러그인
  "@nocobase/client": {
    "(Fields only)": "(필드만 - 번역됨)",
    "12 hour": "12시간",
    "24 hour": "24시간"
    // ...기타 키-값 쌍
  },
  "@nocobase/plugin-acl": {
    // 이 플러그인의 키-값 쌍
  }
  // ...기타 플러그인 모듈
}
```

#### 1.3 번역 테스트 및 동기화
- 번역을 완료한 후, 모든 텍스트가 올바르게 표시되는지 테스트하고 확인하십시오.
번역 확인 플러그인인 `Locale tester`를 플러그인 마켓플레이스에서 검색하여 설치할 수 있습니다.
![20250422233152](https://static-docs.nocobase.com/20250422233152.png)
설치 후, Git 저장소의 해당 현지화 파일에서 JSON 내용을 복사하여 붙여넣은 다음, 확인을 클릭하여 번역 내용이 적용되는지 확인합니다.
![20250422233950](https://static-docs.nocobase.com/20250422233950.png)

- 제출 후, 시스템 스크립트가 현지화 콘텐츠를 코드 저장소에 자동으로 동기화합니다.

#### 1.4 NocoBase 2.0 현지화 플러그인

> **주의:** 이 섹션은 개발 중입니다. NocoBase 2.0의 현지화 플러그인은 1.x 버전과 몇 가지 차이점이 있습니다. 자세한 내용은 향후 업데이트에서 제공될 예정입니다.

<!-- TODO: 2.0 현지화 플러그인 차이점에 대한 세부 정보 추가 -->

## II. 문서 현지화 (NocoBase 2.0)

NocoBase 2.0의 문서는 새로운 구조로 관리됩니다. 문서 소스 파일은 NocoBase 메인 저장소에 위치합니다:

https://github.com/nocobase/nocobase/tree/next/docs

### 2.1 문서 구조

문서는 정적 사이트 생성기로 [Rspress](https://rspress.dev/)를 사용하며 22개 언어를 지원합니다. 구조는 다음과 같이 구성됩니다:

```
docs/
├── docs/
│   ├── en/                    # 영어 (원본 언어)
│   ├── cn/                    # 중국어 간체
│   ├── ja/                    # 일본어
│   ├── ko/                    # 한국어
│   ├── de/                    # 독일어
│   ├── fr/                    # 프랑스어
│   ├── es/                    # 스페인어
│   ├── pt/                    # 포르투갈어
│   ├── ru/                    # 러시아어
│   ├── it/                    # 이탈리아어
│   ├── tr/                    # 터키어
│   ├── uk/                    # 우크라이나어
│   ├── vi/                    # 베트남어
│   ├── id/                    # 인도네시아어
│   ├── th/                    # 태국어
│   ├── pl/                    # 폴란드어
│   ├── nl/                    # 네덜란드어
│   ├── cs/                    # 체코어
│   ├── ar/                    # 아랍어
│   ├── he/                    # 히브리어
│   ├── hi/                    # 힌디어
│   ├── sv/                    # 스웨덴어
│   └── public/                # 공유 리소스 (이미지 등)
├── theme/                     # 사용자 정의 테마
├── rspress.config.ts          # Rspress 설정
└── package.json
```

### 2.2 번역 워크플로우

1. **영어 원본과 동기화**: 모든 번역은 영어 문서(`docs/en/`)를 기반으로 해야 합니다. 영어 문서가 업데이트되면 번역도 그에 따라 업데이트되어야 합니다.

2. **브랜치 전략**:
   - `develop` 또는 `next` 브랜치를 최신 영어 콘텐츠의 참조로 사용하십시오.
   - 대상 브랜치에서 번역 브랜치를 생성하십시오.

3. **파일 구조**: 각 언어 디렉토리는 영어 디렉토리 구조를 미러링해야 합니다. 예를 들어:
   ```
   docs/en/get-started/index.md    →    docs/ko/get-started/index.md
   docs/en/api/acl/acl.md          →    docs/ko/api/acl/acl.md
   ```

### 2.3 번역 기여하기

1. 저장소 Fork: https://github.com/nocobase/nocobase
2. Fork한 저장소를 클론하고 `develop` 또는 `next` 브랜치를 체크아웃합니다.
3. `docs/docs/` 디렉토리로 이동합니다.
4. 기여하려는 언어 디렉토리를 찾습니다 (예: 한국어는 `ko/`).
5. 영어 버전과 동일한 파일 구조를 유지하면서 markdown 파일을 번역합니다.
6. 로컬에서 변경 사항을 테스트합니다:
   ```bash
   cd docs
   yarn install
   yarn dev
   ```
7. 메인 저장소로 Pull Request를 제출합니다.

### 2.4 번역 가이드라인

- **포맷 일관성 유지**: 원본과 동일한 markdown 구조, 제목, 코드 블록 및 링크를 유지하십시오.
- **Frontmatter 보존**: 파일 상단의 YAML frontmatter는 번역 가능한 콘텐츠가 포함되어 있지 않은 한 변경하지 않고 유지하십시오.
- **이미지 참조**: `docs/public/`의 동일한 이미지 경로를 사용하십시오. 이미지는 모든 언어 간에 공유됩니다.
- **내부 링크**: 내부 링크가 올바른 언어 경로를 가리키도록 업데이트하십시오.
- **코드 예제**: 일반적으로 코드 예제는 번역하지 않지만, 코드 내의 주석은 번역할 수 있습니다.

### 2.5 내비게이션 설정

각 언어의 내비게이션 구조는 각 언어 디렉토리 내의 `_nav.json` 및 `_meta.json` 파일에 정의되어 있습니다. 새 페이지나 섹션을 추가할 때 이러한 설정 파일을 반드시 업데이트하십시오.

## III. 공식 홈페이지 현지화

공식 홈페이지 페이지와 모든 콘텐츠는 다음 위치에 저장됩니다:
https://github.com/nocobase/website

### 3.1 시작하기 및 참조 리소스

새 언어를 추가할 때 기존 언어 페이지를 참조하십시오:
- 영어: https://github.com/nocobase/website/tree/main/src/pages/en
- 중국어: https://github.com/nocobase/website/tree/main/src/pages/cn
- 일본어: https://github.com/nocobase/website/tree/main/src/pages/ja

![공식 홈페이지 현지화 도식](https://static-docs.nocobase.com/20250319121600.png)

전역 스타일 수정 위치:
- 영어: https://github.com/nocobase/website/blob/main/src/layouts/BaseEN.astro
- 중국어: https://github.com/nocobase/website/blob/main/src/layouts/BaseCN.astro
- 일본어: https://github.com/nocobase/website/blob/main/src/layouts/BaseJA.astro

![전역 스타일 도식](https://static-docs.nocobase.com/20250319121501.png)

공식 홈페이지의 전역 컴포넌트 현지화 위치:
https://github.com/nocobase/website/tree/main/src/components

![공식 홈페이지 컴포넌트 도식](https://static-docs.nocobase.com/20250319122940.png)

### 3.2 콘텐츠 구조 및 현지화 방법

우리는 혼합 콘텐츠 관리 방식을 채택하고 있습니다. 영어, 중국어, 일본어의 콘텐츠와 리소스는 CMS 시스템에서 정기적으로 동기화되어 덮어씌워지지만, 다른 언어는 로컬 파일에서 직접 편집할 수 있습니다. 로컬 콘텐츠는 `content` 디렉토리에 저장되며 다음과 같이 구성됩니다:

```
/content
  /articles        # 블로그 기사
    /article-slug
      index.md     # 영어 콘텐츠 (기본)
      index.cn.md  # 중국어 콘텐츠
      index.ja.md  # 일본어 콘텐츠
      metadata.json # 메타데이터 및 기타 현지화 속성
  /tutorials       # 튜토리얼
  /releases        # 릴리스 정보
  /pages           # 일부 정적 페이지
  /categories      # 카테고리 정보
    /article-categories.json  # 기사 카테고리 목록
    /category-slug            # 개별 카테고리 상세 정보
      /category.json
  /tags            # 태그 정보
    /article-tags.json        # 기사 태그 목록
    /release-tags.json        # 릴리스 태그 목록
    /tag-slug                 # 개별 태그 상세 정보
      /tag.json
  /help-center     # 고객 센터 콘텐츠
    /help-center-tree.json    # 고객 센터 내비게이션 구조
  ....
```

### 3.3 콘텐츠 번역 가이드라인

- Markdown 콘텐츠 번역 관련

1. 기본 파일을 기반으로 새 언어 파일을 생성합니다 (예: `index.md`를 `index.ko.md`로)
2. JSON 파일의 해당 필드에 현지화 속성을 추가합니다.
3. 파일 구조, 링크 및 이미지 참조의 일관성을 유지합니다.

- JSON 콘텐츠 번역
많은 콘텐츠 메타데이터가 JSON 파일에 저장되며, 일반적으로 다국어 필드를 포함합니다:

```json
{
  "id": 123,
  "title": "English Title",       // 영어 제목 (기본)
  "title_cn": "中文标题",          // 중국어 제목
  "title_ja": "日本語タイトル",    // 일본어 제목
  "description": "English description",
  "description_cn": "中文描述",
  "description_ja": "日本語の説明",
  "slug": "article-slug",         // URL 경로 (일반적으로 번역하지 않음)
  "status": "published",
  "publishedAt": "2025-03-19T12:00:00Z"
}
```

**번역 주의 사항:**

1. **필드 명명 규칙**: 번역 필드는 일반적으로 `{원래 필드}_{언어 코드}` 형식을 사용합니다.
   - 예: title_ko (한국어 제목), description_ko (한국어 설명)

2. **새 언어 추가 시**:
   - 번역이 필요한 각 필드에 대해 해당 언어 접미사 버전을 추가합니다.
   - 원래 필드 값(title, description 등)은 기본 언어(영어) 콘텐츠로 사용되므로 수정하지 마십시오.

3. **CMS 동기화 메커니즘**:
   - CMS 시스템은 영어, 중국어, 일본어 콘텐츠를 정기적으로 업데이트합니다.
   - 시스템은 이 세 가지 언어의 콘텐츠(JSON의 일부 속성)만 업데이트/덮어쓰며, 다른 기여자가 추가한 언어 필드는 **삭제하지 않습니다**.
   - 예: 한국어 번역(title_ko)을 추가한 경우, CMS 동기화는 이 필드에 영향을 주지 않습니다.


### 3.4 새 언어 지원 설정

새 언어에 대한 지원을 추가하려면 `src/utils/index.ts` 파일의 `SUPPORTED_LANGUAGES` 설정을 수정해야 합니다:

```typescript
export const SUPPORTED_LANGUAGES = {
  en: {
    code: 'en',
    locale: 'en-US',
    name: 'English',
    default: true
  },
  cn: {
    code: 'cn',
    locale: 'zh-CN',
    name: 'Chinese'
  },
  ja: {
    code: 'ja',
    locale: 'ja-JP',
    name: 'Japanese'
  },
  // 새 언어 추가 예시:
  ko: {
    code: 'ko',
    locale: 'ko-KR',
    name: 'Korean'
  }
};
```

### 3.5 레이아웃 파일 및 스타일

각 언어에는 해당 레이아웃 파일이 필요합니다:

1. 새 레이아웃 파일을 생성합니다 (예: 한국어의 경우 `src/layouts/BaseKO.astro` 생성).
2. 기존 레이아웃 파일(예: `BaseEN.astro`)을 복사하여 번역할 수 있습니다.
3. 레이아웃 파일에는 내비게이션 메뉴, 푸터 등 전역 요소의 번역이 포함됩니다.
4. 언어 전환기(Language Switcher) 설정이 새로 추가된 언어로 올바르게 전환되도록 업데이트해야 합니다.

### 3.6 언어 페이지 디렉토리 생성

새 언어를 위한 독립적인 페이지 디렉토리를 생성합니다:

1. `src` 디렉토리에 언어 코드로 명명된 폴더를 생성합니다 (예: `src/ko/`).
2. 다른 언어 디렉토리(예: `src/en/`)에서 페이지 구조를 복사합니다.
3. 페이지 콘텐츠를 업데이트하여 제목, 설명 및 텍스트를 대상 언어로 번역합니다.
4. 페이지가 올바른 레이아웃 컴포넌트를 사용하는지 확인합니다 (예: `.layout: '@/layouts/BaseKO.astro'`).

### 3.7 컴포넌트 현지화

일부 공통 컴포넌트도 번역이 필요합니다:

1. `src/components/` 디렉토리의 컴포넌트를 확인합니다.
2. 고정된 텍스트가 있는 컴포넌트(내비게이션 바, 푸터 등)에 특히 주의하십시오.
3. 컴포넌트는 조건부 렌더링을 사용하여 다른 언어의 콘텐츠를 표시할 수 있습니다:

```astro
{Astro.url.pathname.startsWith('/en') && <p>English content</p>}
{Astro.url.pathname.startsWith('/ko') && <p>한국어 콘텐츠</p>}
{Astro.url.pathname.startsWith('/fr') && <p>Contenu français</p>}
```

### 3.8 테스트 및 검증

번역을 완료한 후 철저한 테스트를 수행하십시오:

1. 로컬에서 웹사이트를 실행합니다 (일반적으로 `yarn dev` 사용).
2. 모든 페이지가 새 언어에서 어떻게 표시되는지 확인합니다.
3. 언어 전환 기능이 정상적으로 작동하는지 확인합니다.
4. 모든 링크가 올바른 언어 버전 페이지를 가리키는지 확인합니다.
5. 반응형 레이아웃을 확인하여 번역된 텍스트가 페이지 디자인을 깨뜨리지 않는지 확인합니다.

## IV. 번역 시작 방법

NocoBase에 새로운 언어 번역을 기여하고 싶다면 다음 단계를 따르십시오:

| 구성 요소 | 저장소 | 브랜치 | 비고 |
|------|------|------|------|
| 시스템 인터페이스 | https://github.com/nocobase/nocobase/tree/main/locales | main | JSON 현지화 파일 |
| 문서 (2.0) | https://github.com/nocobase/nocobase | develop / next | `docs/docs/<lang>/` 디렉토리 |
| 공식 홈페이지 | https://github.com/nocobase/website | main | 제3절 참조 |

번역을 완료한 후 NocoBase에 Pull Request를 제출하십시오. 새 언어는 시스템 설정에 나타나며, 표시할 언어를 선택할 수 있게 됩니다.

![언어 활성화 도식](https://static-docs.nocobase.com/20250319123452.png)

## NocoBase 1.x 문서

NocoBase 1.x 번역 가이드는 다음을 참조하십시오:

https://docs.nocobase.com/welcome/community/translations