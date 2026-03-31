---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



pkg: "@nocobase/plugin-environment-variables"
---

# 변수와 비밀 키

## 소개

민감한 데이터 저장, 설정 데이터 재사용, 환경 설정 격리 등을 위해 환경 변수와 비밀 키를 중앙에서 설정하고 관리합니다.

## `.env` 파일과의 차이점

| **특징**     | **`.env` 파일**                                         | **동적으로 설정되는 환경 변수 및 비밀 키**                                             |
| ------------ | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **저장 위치** | 프로젝트 루트 디렉터리의 `.env` 파일에 저장됩니다.                        | 데이터베이스의 `environmentVariables` 테이블에 저장됩니다.                                 |
| **로딩 방식** | `dotenv`와 같은 도구를 사용하여 애플리케이션 시작 시 `process.env`에 로드됩니다. | 애플리케이션 시작 시 `app.environment`에 동적으로 읽어와 로드됩니다.                        |
| **수정 방식** | 파일을 직접 편집해야 하며, 변경 사항을 적용하려면 애플리케이션을 재시작해야 합니다.            | 런타임 중 수정이 가능하며, 애플리케이션 설정을 다시 로드하면 즉시 적용됩니다.                             |
| **환경 격리** | 각 환경(개발, 테스트, 프로덕션)마다 `.env` 파일을 별도로 관리해야 합니다.    | 각 환경(개발, 테스트, 프로덕션)마다 `environmentVariables` 테이블의 데이터를 별도로 관리해야 합니다. |
| **적용 시나리오** | 애플리케이션의 주 데이터베이스 정보와 같이 고정된 정적 설정에 적합합니다.                  | 외부 데이터베이스, 파일 저장 정보 등과 같이 자주 조정하거나 비즈니스 로직과 연결된 동적 설정에 적합합니다. |

## 설치

내장 플러그인으로, 별도로 설치할 필요가 없습니다.

## 사용 목적

### 설정 데이터 재사용

예를 들어, 워크플로우의 여러 곳에서 이메일 노드가 필요하고 SMTP를 설정해야 하는 경우, 공통 SMTP 설정을 환경 변수에 저장할 수 있습니다.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### 민감한 데이터 저장

다양한 외부 데이터베이스의 설정 정보, 클라우드 파일 저장 키 등 민감한 데이터를 저장할 수 있습니다.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### 환경 설정 격리

소프트웨어 개발, 테스트, 프로덕션과 같은 다양한 환경에서 각 환경의 설정과 데이터가 서로 간섭하지 않도록 독립적인 설정 관리 전략을 사용합니다. 각 환경은 고유한 설정, 변수 및 리소스를 가지므로 개발, 테스트, 프로덕션 환경 간의 충돌을 방지하고 각 환경에서 시스템이 예상대로 작동하도록 보장할 수 있습니다.

예를 들어, 파일 저장 서비스의 경우 개발 환경과 프로덕션 환경의 설정이 다음과 같이 다를 수 있습니다.

개발 환경

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

프로덕션 환경

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## 환경 변수 관리

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### 환경 변수 추가

- 개별 및 일괄 추가를 지원합니다.
- 평문 및 암호화 저장을 지원합니다.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

개별 추가

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

일괄 추가

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## 주의사항

### 애플리케이션 재시작

환경 변수를 수정하거나 삭제하면 상단에 애플리케이션 재시작 알림이 나타납니다. 재시작해야 변경된 환경 변수가 적용됩니다.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### 암호화 저장

환경 변수의 암호화된 데이터는 AES 대칭 암호화를 사용합니다. 암호화 및 복호화에 사용되는 PRIVATE KEY는 `storage` 디렉터리에 저장되므로, 잘 보관해 주십시오. 키를 분실하거나 덮어쓰면 암호화된 데이터를 복호화할 수 없습니다.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## 현재 환경 변수를 지원하는 플러그인

### Action: Custom request

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Auth: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Auth: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Auth: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Auth: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Auth: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Auth: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### 데이터 소스: External MariaDB

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### 데이터 소스: External MySQL

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### 데이터 소스: External Oracle

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### 데이터 소스: External PostgreSQL

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### 데이터 소스: External SQL Server

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### 데이터 소스: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### 데이터 소스: REST API

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### File storage: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### File storage: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### File storage: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### File storage: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### File storage: S3 Pro

미지원

### Map: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Map: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Email settings

미지원

### Notification: Email

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Public forms

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### System settings

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verification: Aliyun SMS

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verification: Tencent SMS

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### 워크플로우

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)