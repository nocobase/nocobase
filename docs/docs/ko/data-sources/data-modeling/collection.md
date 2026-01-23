:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 컬렉션 개요

NocoBase는 데이터 구조를 설명하기 위해 '컬렉션'이라는 고유한 DSL(Domain-Specific Language)을 제공합니다. 이 컬렉션은 다양한 소스의 데이터 구조를 통합하여, 데이터 관리, 분석 및 애플리케이션을 위한 안정적인 기반을 마련해 줍니다.

![20240512161522](https://static-docs.nocobase.com/20240512161522.png)

다양한 데이터 모델을 편리하게 사용하기 위해, NocoBase는 다음과 같은 다양한 유형의 컬렉션 생성을 지원합니다.

- [일반 컬렉션](/data-sources/data-source-main/general-collection): 자주 사용되는 시스템 필드가 내장되어 있습니다.
- [상속 컬렉션](/data-sources/data-source-main/inheritance-collection): 부모 컬렉션을 생성한 다음, 해당 부모 컬렉션에서 자식 컬렉션을 파생시킬 수 있습니다. 자식 컬렉션은 부모 컬렉션의 구조를 상속받으며, 동시에 자체 컬럼을 정의할 수도 있습니다.
- [트리 컬렉션](/data-sources/collection-tree): 트리 구조 컬렉션으로, 현재 인접 리스트(adjacency list) 설계만 지원합니다.
- [달력 컬렉션](/data-sources/calendar/calendar-collection): 달력 관련 이벤트 컬렉션을 생성하는 데 사용됩니다.
- [파일 컬렉션](/data-sources/file-manager/file-collection): 파일 저장소 관리에 사용됩니다.
- : 워크플로우의 동적 표현식 시나리오에 사용됩니다.
- [SQL 컬렉션](/data-sources/collection-sql): 실제 데이터베이스 테이블은 아니지만, SQL 쿼리를 구조화된 형태로 빠르게 보여줍니다.
- [뷰 컬렉션](/data-sources/collection-view): 기존 데이터베이스 뷰에 연결합니다.
- [외부 컬렉션](/data-sources/collection-fdw): FDW 기술을 기반으로, 데이터베이스 시스템이 외부 데이터 소스의 데이터에 직접 접근하고 쿼리할 수 있도록 합니다.