:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/system-management/localization/index)을 참조하세요.
:::

# 현지화 관리

## 소개

현지화 관리 플러그인은 NocoBase의 현지화 리소스를 관리하고 구현하는 데 사용되며, 시스템의 메뉴, 컬렉션, 필드 및 모든 플러그인을 번역하여 특정 지역의 언어와 문화에 맞게 조정할 수 있습니다.

## 설치

이 플러그인은 내장 플러그인이므로 별도의 설치가 필요하지 않습니다.

## 사용 설명

### 플러그인 활성화

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### 현지화 관리 페이지 접속

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### 번역 항목 동기화

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

현재 다음 내용의 동기화를 지원합니다:

- 시스템 및 플러그인의 로컬 언어 팩
- 컬렉션 제목, 필드 제목 및 필드 옵션 레이블
- 메뉴 제목

동기화가 완료되면 시스템은 현재 언어의 모든 번역 가능한 항목을 나열합니다.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=팁}
모듈마다 동일한 원문 항목이 존재할 수 있으며, 각각 별도로 번역해야 합니다.
:::

### 항목 자동 생성

페이지 편집 시, 각 블록의 사용자 정의 문구는 자동으로 해당 항목을 생성하며, 현재 언어의 번역 내용도 동시에 생성됩니다.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=팁}
코드에서 문구를 정의할 때는 다음과 같이 수동으로 ns(namespace)를 지정해야 합니다: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### 번역 내용 편집

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### 번역 게시

번역이 완료되면 "게시" 버튼을 클릭해야 변경 사항이 적용됩니다.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### 다른 언어 번역

"시스템 설정"에서 다른 언어(예: 중국어 간체)를 활성화합니다.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

해당 언어 환경으로 전환합니다.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

항목을 동기화합니다.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

번역하고 게시합니다.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>