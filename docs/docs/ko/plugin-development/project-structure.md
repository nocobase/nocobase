:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 프로젝트 디렉토리 구조

Git을 통해 소스 코드를 클론하거나 `create-nocobase-app`을 사용하여 프로젝트를 초기화하든, 생성된 NocoBase 프로젝트는 본질적으로 **Yarn Workspace** 기반의 모노레포입니다.

## 최상위 디렉토리 개요

다음 예시는 `my-nocobase-app/`을 프로젝트 디렉토리로 사용합니다. 환경에 따라 약간의 차이가 있을 수 있습니다:

```bash
my-nocobase-app/
├── packages/              # 프로젝트 소스 코드
│   ├── plugins/           # 개발 중인 플러그인 소스 코드 (미컴파일)
├── storage/               # 런타임 데이터 및 동적으로 생성된 콘텐츠
│   ├── apps/
│   ├── db/
│   ├── logs/
│   ├── uploads/
│   ├── plugins/           # 컴파일된 플러그인 (UI를 통해 업로드된 플러그인 포함)
│   └── tar/               # 플러그인 패키지 파일 (.tar)
├── scripts/               # 유틸리티 스크립트 및 도구 명령
├── .env*                  # 다양한 환경 변수 설정
├── lerna.json             # Lerna 워크스페이스 설정
├── package.json           # 루트 패키지 설정, 워크스페이스 및 스크립트 선언
├── tsconfig*.json         # TypeScript 설정 (프론트엔드, 백엔드, 경로 매핑)
├── vitest.config.mts      # Vitest 유닛 테스트 설정
└── playwright.config.ts   # Playwright E2E 테스트 설정
```

## packages/ 하위 디렉토리 설명

`packages/` 디렉토리에는 NocoBase의 핵심 모듈과 확장 가능한 패키지가 포함되어 있습니다. 내용은 프로젝트 소스에 따라 달라집니다:

- **`create-nocobase-app`을 통해 생성된 프로젝트**: 기본적으로 `packages/plugins/`만 포함하며, 사용자 정의 플러그인 소스 코드를 저장하는 데 사용됩니다. 각 하위 디렉토리는 독립적인 npm 패키지입니다.
- **공식 소스 코드 저장소를 클론한 경우**: `core/`, `plugins/`, `pro-plugins/`, `presets/` 등 더 많은 하위 디렉토리를 볼 수 있으며, 각각 프레임워크 핵심, 내장 플러그인, 공식 사전 설정 솔루션에 해당합니다.

어떤 경우든, `packages/plugins`는 사용자 정의 플러그인을 개발하고 디버깅하는 주요 위치입니다.

## storage/ 런타임 디렉토리

`storage/`는 런타임에 생성된 데이터와 빌드 결과물을 저장합니다. 일반적인 하위 디렉토리 설명은 다음과 같습니다:

- `apps/`: 다중 애플리케이션 시나리오를 위한 설정 및 캐시.
- `logs/`: 런타임 로그 및 디버그 출력.
- `uploads/`: 사용자가 업로드한 파일 및 미디어 리소스.
- `plugins/`: UI를 통해 업로드되거나 CLI를 통해 임포트된 패키지 플러그인.
- `tar/`: `yarn build <plugin> --tar` 실행 후 생성되는 압축된 플러그인 패키지.

> 일반적으로 `storage` 디렉토리를 `.gitignore`에 추가하고, 배포 또는 백업 시 별도로 처리하는 것이 좋습니다.

## 환경 설정 및 프로젝트 스크립트

- `.env`, `.env.test`, `.env.e2e`: 각각 로컬 실행, 유닛/통합 테스트, 엔드투엔드(E2E) 테스트에 사용됩니다.
- `scripts/`: 일반적인 유지보수 스크립트(예: 데이터베이스 초기화, 릴리스 유틸리티 등)를 저장합니다.

## 플러그인 로드 경로 및 우선순위

플러그인은 여러 위치에 존재할 수 있으며, NocoBase는 시작 시 다음 우선순위에 따라 로드합니다:

1. `packages/plugins`에 있는 소스 코드 버전 (로컬 개발 및 디버깅용).
2. `storage/plugins`에 있는 패키지 버전 (UI를 통해 업로드되거나 CLI를 통해 임포트된).
3. `node_modules`에 있는 의존성 패키지 (npm/yarn을 통해 설치되거나 프레임워크에 내장된).

동일한 이름의 플러그인이 소스 코드 디렉토리와 패키지 디렉토리에 동시에 존재할 경우, 시스템은 로컬 오버라이드 및 디버깅을 용이하게 하기 위해 소스 코드 버전을 우선적으로 로드합니다.

## 플러그인 디렉토리 템플릿

CLI를 사용하여 플러그인 생성:

```bash
yarn pm create @my-project/plugin-hello
```

생성된 디렉토리 구조는 다음과 같습니다:

```bash
packages/plugins/@my-project/plugin-hello/
├── dist/                    # 빌드 결과물 (필요에 따라 생성)
├── src/                     # 소스 코드 디렉토리
│   ├── client/              # 프론트엔드 코드 (블록, 페이지, 모델 등)
│   │   ├── plugin.ts        # 클라이언트 측 플러그인 메인 클래스
│   │   └── index.ts         # 클라이언트 측 진입점
│   ├── locale/              # 다국어 리소스 (프론트엔드 및 백엔드 공유)
│   ├── swagger/             # OpenAPI/Swagger 문서
│   └── server/              # 서버 측 코드
│       ├── collections/     # 데이터 테이블 / 컬렉션 정의
│       ├── commands/        # 사용자 정의 명령
│       ├── migrations/      # 데이터베이스 마이그레이션 스크립트
│       ├── plugin.ts        # 서버 측 플러그인 메인 클래스
│       └── index.ts         # 서버 측 진입점
├── index.ts                 # 프론트엔드 및 백엔드 브릿지 내보내기
├── client.d.ts              # 프론트엔드 타입 선언
├── client.js                # 프론트엔드 빌드 아티팩트
├── server.d.ts              # 서버 측 타입 선언
├── server.js                # 서버 측 빌드 아티팩트
├── .npmignore               # 게시 무시 설정
└── package.json
```

> 빌드가 완료되면, `dist/` 디렉토리와 `client.js`, `server.js` 파일은 플러그인이 활성화될 때 로드됩니다.
> 개발 단계에서는 `src/` 디렉토리만 수정하면 됩니다. 게시하기 전에 `yarn build <plugin>` 또는 `yarn build <plugin> --tar`를 실행하세요.