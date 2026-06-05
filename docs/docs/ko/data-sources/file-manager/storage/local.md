:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 로컬 스토리지

업로드된 파일은 서버의 로컬 디렉토리에 저장됩니다. 이 방식은 시스템에서 관리하는 전체 파일 수가 적거나 실험적인 환경에 적합합니다.

## 설정 옵션

![파일 스토리지 엔진 설정 예시](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=참고}
이 섹션에서는 로컬 스토리지 엔진의 전용 파라미터만 다룹니다. 공통 파라미터는 [엔진 공통 파라미터](./index.md#general-engine-parameters)를 참고해 주세요.
:::

### 경로

경로는 서버에 저장된 파일의 상대 경로와 URL 접근 경로를 동시에 나타냅니다. 예를 들어, "`user/avatar`"(시작과 끝에 슬래시(`/`)를 포함하지 않음)는 다음을 의미합니다.

1. 업로드된 파일이 서버에 저장되는 상대 경로: `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. 파일 접근 시 사용되는 URL 접두사: `http://localhost:13000/storage/uploads/user/avatar`.