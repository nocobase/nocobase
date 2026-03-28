---
pkg: "@nocobase/plugin-multi-space"
---

:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/multi-space/multi-space)을 참조하세요.
:::

# 멀티 공간

## 소개

**멀티 공간 플러그인**은 단일 애플리케이션 인스턴스 내에서 논리적 격리를 통해 여러 개의 독립적인 데이터 공간을 구현할 수 있게 해줍니다.

#### 활용 사례
- **다수의 매장 또는 공장**: 통합 재고 관리, 생산 계획, 판매 전략 및 보고서 템플릿과 같이 비즈니스 프로세스와 시스템 설정은 매우 유사하지만, 각 사업 단위의 데이터가 서로 간섭받지 않도록 보장해야 하는 경우에 적합합니다.
- **다중 조직 또는 자회사 관리**: 그룹사 산하의 여러 조직이나 자회사가 동일한 플랫폼을 공유하지만, 브랜드별로 독립적인 고객, 제품 및 주문 데이터를 보유하는 경우에 적합합니다.

## 설치

플러그인 관리자에서 **멀티 공간(Multi-Space)** 플러그인을 찾아 활성화합니다.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## 사용 설명서

### 멀티 공간 관리

플러그인을 활성화한 후, **「사용자 및 권한」** 설정 페이지로 이동하여 **공간** 패널로 전환하면 공간을 관리할 수 있습니다.

> 초기 상태에는 내장된 **미할당 공간(Unassigned Space)**이 존재하며, 주로 공간이 연결되지 않은 기존 데이터를 확인하는 용도로 사용됩니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### 공간 생성

「공간 추가」 버튼을 클릭하여 새로운 공간을 생성합니다:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### 사용자 할당

생성된 공간을 선택한 후, 오른쪽에서 해당 공간에 속할 사용자를 설정할 수 있습니다:

> **팁:** 공간에 사용자를 할당한 후에는 **페이지를 수동으로 새로고침**해야 우측 상단의 공간 전환 목록에 최신 공간이 업데이트되어 표시됩니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### 멀티 공간 전환 및 보기

우측 상단에서 현재 공간을 전환할 수 있습니다.  
우측의 **눈 아이콘**(활성화 상태)을 클릭하면 여러 공간의 데이터를 동시에 확인할 수 있습니다.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### 멀티 공간 데이터 관리

플러그인을 활성화하면, 데이터 테이블(**컬렉션**)을 생성할 때 시스템이 자동으로 **공간 필드**를 미리 구성합니다.  
**이 필드가 포함된 테이블만 공간 관리 로직에 포함됩니다.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

기존 데이터 테이블의 경우, 공간 필드를 수동으로 추가하여 공간 관리를 활성화할 수 있습니다:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### 기본 로직

공간 필드가 포함된 데이터 테이블에서 시스템은 자동으로 다음 로직을 적용합니다:

1. 데이터를 생성할 때, 현재 선택된 공간과 자동으로 연결됩니다.
2. 데이터를 필터링할 때, 현재 선택된 공간의 데이터로 자동 제한됩니다.

### 기존 데이터의 멀티 공간 분류

멀티 공간 플러그인을 활성화하기 전에 존재했던 데이터는 다음 단계에 따라 공간을 분류할 수 있습니다:

#### 1. 공간 필드 추가

기존 테이블에 공간 필드를 수동으로 추가합니다:

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. 미할당 공간에 사용자 할당

기존 데이터를 관리하는 사용자를 모든 공간에 연결합니다. 이때 아직 공간에 할당되지 않은 데이터를 확인하기 위해 **미할당 공간(Unassigned Space)**을 반드시 포함해야 합니다:

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. 모든 공간 데이터 보기로 전환

상단에서 모든 공간의 데이터를 보도록 선택합니다:

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. 기존 데이터 할당 페이지 구성

기존 데이터 할당을 위한 새 페이지를 만들고, **목록 블록**과 **편집 양식**에 「공간 필드」를 표시하여 소속 공간을 수동으로 조정할 수 있도록 합니다.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

공간 필드를 편집 가능 모드로 조정합니다.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. 데이터 공간 수동 할당

위에서 만든 페이지를 통해 데이터를 수동으로 편집하여 기존 데이터에 올바른 공간을 점진적으로 할당합니다(일괄 편집을 직접 구성할 수도 있습니다).