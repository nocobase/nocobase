:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 개요

데이터 모델링은 데이터베이스 설계의 핵심 단계이며, 현실 세계의 다양한 데이터와 그 상호 관계를 심층적으로 분석하고 추상화하는 과정을 포함합니다. 이 과정에서 데이터 간의 본질적인 연결을 밝혀내고, 이를 데이터 모델로 형식화하여 정보 시스템의 데이터베이스 구조를 위한 기반을 마련합니다. NocoBase는 데이터 모델 기반 플랫폼으로, 다음과 같은 특징을 가지고 있습니다.

## 다양한 소스의 데이터 연결 지원

NocoBase의 데이터 소스는 일반적인 다양한 데이터베이스, API(SDK) 플랫폼, 파일 등이 될 수 있습니다.

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

NocoBase는 [데이터 소스 관리 플러그인](/data-sources/data-source-manager)을 제공하여 각 데이터 소스와 해당 컬렉션을 관리할 수 있도록 합니다. 데이터 소스 관리 플러그인은 모든 데이터 소스의 관리 인터페이스만 제공하며, 데이터 소스에 직접 접근하는 기능은 제공하지 않습니다. 이 플러그인은 다양한 데이터 소스 플러그인과 함께 사용해야 합니다. 현재 지원되는 데이터 소스는 다음과 같습니다.

- [메인 데이터베이스](/data-sources/data-source-main): NocoBase의 메인 데이터베이스로, MySQL, PostgreSQL, MariaDB 등 관계형 데이터베이스를 지원합니다.
- [KingbaseES](/data-sources/data-source-kingbase): KingbaseES 데이터베이스를 데이터 소스로 사용하며, 메인 데이터베이스 또는 외부 데이터베이스로 활용할 수 있습니다.
- [외부 MySQL](/data-sources/data-source-external-mysql): 외부 MySQL 데이터베이스를 데이터 소스로 사용합니다.
- [외부 MariaDB](/data-sources/data-source-external-mariadb): 외부 MariaDB 데이터베이스를 데이터 소스로 사용합니다.
- [외부 PostgreSQL](/data-sources/data-source-external-postgres): 외부 PostgreSQL 데이터베이스를 데이터 소스로 사용합니다.
- [외부 MSSQL](/data-sources/data-source-external-mssql): 외부 MSSQL(SQL Server) 데이터베이스를 데이터 소스로 사용합니다.
- [외부 Oracle](/data-sources/data-source-external-oracle): 외부 Oracle 데이터베이스를 데이터 소스로 사용합니다.

![20240512083651](https://static-docs.nocobase.com/20240512083651.png)

## 다양한 데이터 모델링 도구 제공

**간편한 컬렉션 관리 인터페이스**: 다양한 모델(컬렉션)을 생성하거나 기존 모델(컬렉션)에 연결하는 데 사용됩니다.

![20240512090751](https://static-docs.nocobase.com/20240512090751.png)

**ER 다이어그램 스타일의 시각화 인터페이스**: 사용자 및 비즈니스 요구 사항에서 엔티티와 그 관계를 추출하는 데 사용됩니다. 데이터 모델을 직관적이고 이해하기 쉬운 방식으로 설명하며, ER 다이어그램을 통해 시스템의 주요 데이터 엔티티와 그 관계를 더욱 명확하게 파악할 수 있습니다.

![20240512091042](https://static-docs.nocobase.com/20240410075906.png)

## 다양한 유형의 컬렉션 생성 지원

| 컬렉션 | 설명 |
| - | - |
| [일반 컬렉션](/data-sources/data-source-main/general-collection) | 자주 사용되는 시스템 필드가 내장되어 있습니다. |
| [캘린더 컬렉션](/data-sources/calendar/calendar-collection) | 캘린더 관련 이벤트 컬렉션을 생성하는 데 사용됩니다. |
| 댓글 컬렉션 | 데이터에 대한 댓글이나 피드백을 저장하는 데 사용됩니다. |
| [트리 구조 컬렉션](/data-sources/collection-tree) | 트리 구조 컬렉션으로, 현재 인접 리스트 모델만 지원합니다. |
| [파일 컬렉션](/data-sources/file-manager/file-collection) | 파일 저장 관리에 사용됩니다. |
| [SQL 컬렉션](/data-sources/collection-sql) | 실제 데이터베이스 테이블이 아니라, SQL 쿼리 결과를 구조화하여 빠르게 보여줍니다. |
| [데이터베이스 뷰 연결](/data-sources/collection-view) | 기존 데이터베이스 뷰에 연결합니다. |
| 표현식 컬렉션 | 워크플로우의 동적 표현식 시나리오에 사용됩니다. |
| [외부 데이터 연결](/data-sources/collection-fdw) | 데이터베이스의 FDW 기술을 기반으로 원격 컬렉션에 연결합니다. |

![20240512102212](https://static-docs.nocobase.com/20240512102212.png)

더 자세한 내용은 「[컬렉션 / 개요](/data-sources/data-modeling/collection)」 섹션을 참조하십시오.

## 풍부한 필드 유형 제공

![20240512110352](https://static-docs.nocobase.com/20240512110352.png)

더 자세한 내용은 「[컬렉션 필드 / 개요](/data-sources/data-modeling/collection-fields)」 섹션을 참조하십시오.