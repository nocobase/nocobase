---
pkg: "@nocobase/plugin-data-source-manager"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 데이터 소스 관리

## 소개

NocoBase는 데이터 소스 관리 플러그인을 제공하여 데이터 소스와 해당 컬렉션을 관리할 수 있도록 합니다. 데이터 소스 관리 플러그인은 모든 데이터 소스의 관리 인터페이스만 제공하며, 직접 데이터 소스에 접근하는 기능은 제공하지 않습니다. 이 플러그인은 다양한 데이터 소스 플러그인과 함께 사용해야 합니다. 현재 지원되는 데이터 소스는 다음과 같습니다:

- [메인 데이터베이스](/data-sources/data-source-main): NocoBase의 메인 데이터베이스로, MySQL, PostgreSQL, MariaDB 등 관계형 데이터베이스를 지원합니다.
- [외부 MySQL](/data-sources/data-source-external-mysql): 외부 MySQL 데이터베이스를 데이터 소스로 사용합니다.
- [외부 MariaDB](/data-sources/data-source-external-mariadb): 외부 MariaDB 데이터베이스를 데이터 소스로 사용합니다.
- [외부 PostgreSQL](/data-sources/data-source-external-postgres): 외부 PostgreSQL 데이터베이스를 데이터 소스로 사용합니다.
- [외부 MSSQL](/data-sources/data-source-external-mssql): 외부 MSSQL (SQL Server) 데이터베이스를 데이터 소스로 사용합니다.
- [외부 Oracle](/data-sources/data-source-external-oracle): 외부 Oracle 데이터베이스를 데이터 소스로 사용합니다.

이 외에도 플러그인을 통해 더 많은 유형의 데이터 소스를 확장할 수 있습니다. 여기에는 일반적인 다양한 데이터베이스뿐만 아니라 API(SDK)를 제공하는 플랫폼도 포함될 수 있습니다.

## 설치

내장 플러그인이므로 별도로 설치할 필요가 없습니다.

## 사용 방법

애플리케이션을 초기화하고 설치하면, NocoBase 데이터를 저장하는 데 사용되는 데이터 소스가 기본으로 제공됩니다. 이것을 메인 데이터베이스라고 부릅니다. 더 자세한 내용은 [메인 데이터베이스](/data-sources/data-source-main/) 문서를 참조하십시오.

### 외부 데이터 소스

외부 데이터베이스를 데이터 소스로 사용할 수 있습니다. 더 자세한 내용은 [외부 데이터베이스 / 소개](/data-sources/data-source-manager/external-database) 문서를 참조하십시오.

![nocobase_doc-2025-10-29-19-45-33](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-45-33.png)

### 사용자 정의 데이터베이스 테이블 동기화 지원

![nocobase_doc-2025-10-29-19-46-34](https://static-docs.nocobase.com/nocobase_doc-2025-10-29-19-46-34.png)

HTTP API 소스의 데이터도 연결할 수 있습니다. 더 자세한 내용은 [REST API 데이터 소스](/data-sources/data-source-rest-api/) 문서를 참조하십시오.