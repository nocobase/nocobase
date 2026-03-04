:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/integration/fdw/index)을 참조하세요.
:::

# 외부 데이터 테이블 연결 (FDW)

## 소개

데이터베이스의 Foreign Data Wrapper(FDW)를 기반으로 원격 데이터 테이블을 연결하는 기능입니다. 현재 MySQL 및 PostgreSQL 데이터베이스를 지원합니다.

:::info{title="데이터 소스 연결 vs 외부 데이터 테이블 연결"}
- **데이터 소스 연결**은 특정 데이터베이스 또는 API 서비스와 연결을 설정하는 것을 의미하며, 데이터베이스의 기능이나 API가 제공하는 서비스를 온전히 사용할 수 있습니다.
- **외부 데이터 테이블 연결**은 외부에서 데이터를 가져와 로컬에서 사용하도록 매핑하는 것을 의미합니다. 데이터베이스에서는 이를 FDW(Foreign Data Wrapper)라고 부르며, 원격 테이블을 로컬 테이블처럼 사용하는 데 중점을 둔 데이터베이스 기술입니다. 테이블을 하나씩만 연결할 수 있으며, 원격 접속 방식이기 때문에 사용 시 다양한 제약과 한계가 있을 수 있습니다.

이 두 가지는 함께 사용할 수도 있습니다. 전자는 데이터 소스와의 연결을 설정하는 데 사용되고, 후자는 데이터 소스 간 교차 액세스에 사용됩니다. 예를 들어, 특정 PostgreSQL 데이터 소스에 연결되어 있고, 이 데이터 소스 내의 특정 테이블이 FDW를 기반으로 생성된 외부 데이터 테이블인 경우가 이에 해당합니다.
:::

### MySQL

MySQL은 `federated` 엔진을 통해 원격 MySQL 및 MariaDB와 같은 프로토콜 호환 데이터베이스 연결을 지원하며, 활성화가 필요합니다. 자세한 내용은 [Federated Storage Engine](https://dev.mysql.com/doc/refman/8.0/en/federated-storage-engine.html) 문서를 참고하세요.

### PostgreSQL

PostgreSQL에서는 다양한 유형의 `fdw` 확장을 통해 여러 원격 데이터 유형을 지원할 수 있습니다. 현재 지원되는 확장은 다음과 같습니다:

- [postgres_fdw](https://www.postgresql.org/docs/current/postgres-fdw.html): PostgreSQL에서 원격 PostgreSQL 데이터베이스 연결.
- [mysql_fdw](https://github.com/EnterpriseDB/mysql_fdw): PostgreSQL에서 원격 MySQL 데이터베이스 연결.
- 기타 유형의 fdw 확장은 [PostgreSQL Foreign Data Wrappers](https://wiki.postgresql.org/wiki/Foreign_data_wrappers)를 참고하세요. NocoBase에 통합하려면 코드에서 해당 어댑터 인터페이스를 구현해야 합니다.

## 전제 조건

- NocoBase의 메인 데이터베이스가 MySQL인 경우, `federated`를 활성화해야 합니다. [MySQL에서 federated 엔진을 활성화하는 방법](./enable-federated)을 참고하세요.

그 다음 플러그인 관리자를 통해 플러그인을 설치하고 활성화합니다.

![플러그인 설치 및 활성화](https://static-docs.nocobase.com/f84276c5712851fb3ff33af3f1ff0f59.png)

## 사용 설명서

「컬렉션 관리 > 컬렉션 만들기」 드롭다운에서 「외부 데이터 연결」을 선택합니다.

![외부 데이터 연결](https://static-docs.nocobase.com/029d946a6d067d1c35a39755219d623c.png)

「데이터베이스 서비스」 드롭다운 옵션에서 기존 데이터베이스 서비스를 선택하거나 「데이터베이스 서비스 만들기」를 선택합니다.

![데이터베이스 서비스](https://static-docs.nocobase.com/766271708a911950a5599d60d6be4a4d.png)

데이터베이스 서비스 만들기

![데이터베이스 서비스 만들기](https://static-docs.nocobase.com/1e357216e04cc4f200bd6212827281c8.png)

데이터베이스 서비스를 선택한 후, 「원격 테이블」 드롭다운 옵션에서 연결할 데이터 테이블을 선택합니다.

![연결할 데이터 테이블 선택](https://static-docs.nocobase.com/e91fd6152b52b4fc01b3808053cc8dc4.png)

필드 정보 구성

![필드 정보 구성](https://static-docs.nocobase.com/e618fecc5fe327f6a495e61405e5f040.png)

원격 테이블의 구조가 변경된 경우, 「원격 테이블에서 동기화」를 할 수 있습니다.

![원격 테이블에서 동기화](https://static-docs.nocobase.com/3751a9a39f933889fb3fcc4d85a6f4ad.png)

원격 테이블 동기화

![원격 테이블 동기화](https://static-docs.nocobase.com/13f18200e31ea223fdd8dadaff1e9d28.png)

마지막으로, 인터페이스에 표시됩니다.

![인터페이스에 표시](https://static-docs.nocobase.com/368fca27a99277d9360ca81350949357.png)