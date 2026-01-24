---
pkg: "@nocobase/plugin-multi-space"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::



pkg: "@nocobase/plugin-multi-space"
---

# 멀티 스페이스

## 소개

**멀티 스페이스 플러그인**은 단일 애플리케이션 인스턴스 내에서 논리적 격리를 통해 여러 개의 독립적인 데이터 공간을 생성할 수 있도록 지원합니다.

#### 활용 사례
- **여러 매장 또는 공장**: 통합 재고 관리, 생산 계획, 판매 전략, 보고서 템플릿 등 비즈니스 프로세스와 시스템 구성이 매우 일관적이지만, 각 비즈니스 단위의 데이터가 서로 간섭하지 않도록 보장해야 하는 경우에 활용할 수 있습니다.
- **여러 조직 또는 자회사 관리**: 그룹 회사 산하의 여러 조직 또는 자회사가 동일한 플랫폼을 공유하지만, 각 브랜드가 독립적인 고객, 제품, 주문 데이터를 관리해야 하는 경우에 유용합니다.

## 설치

플러그인 관리에서 **멀티 스페이스(Multi-Space)** 플러그인을 찾아서 활성화합니다.

![](https://static-docs.nocobase.com/multi-space/Plugin-manager-NocoBase-10-15-2025_09_57_AM.png)

## 사용 설명서

### 멀티 스페이스 관리

플러그인을 활성화한 후, **「사용자 및 권한」** 설정 페이지로 이동하여 **공간** 패널로 전환하면 공간을 관리할 수 있습니다.

> 초기 상태에서는 내장된 **할당되지 않은 공간(Unassigned Space)**이 존재하며, 주로 어떤 공간과도 연결되지 않은 이전 데이터를 확인하는 데 사용됩니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM.png)

#### 공간 생성

「공간 추가」 버튼을 클릭하여 새로운 공간을 생성합니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_58_AM%20(1).png)

#### 사용자 할당

생성된 공간을 선택한 후, 오른쪽에서 해당 공간에 속할 사용자를 설정할 수 있습니다.

> **팁:** 공간에 사용자를 할당한 후에는 **수동으로 페이지를 새로고침**해야 오른쪽 상단의 공간 전환 목록에 최신 공간이 업데이트되어 표시됩니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_09_59_AM.png)

### 멀티 스페이스 전환 및 보기

오른쪽 상단에서 현재 공간을 전환할 수 있습니다.
오른쪽의 **눈 아이콘**(하이라이트된 상태)을 클릭하면 여러 공간의 데이터를 동시에 확인할 수 있습니다.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_26_AM.png)

### 멀티 스페이스 데이터 관리

플러그인을 활성화하면 컬렉션 생성 시 시스템이 자동으로 **공간 필드**를 미리 추가합니다.
**이 필드를 포함하는 컬렉션만 공간 관리 로직에 포함됩니다.**

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_01_AM.png)

기존 컬렉션의 경우, 공간 필드를 수동으로 추가하여 공간 관리를 활성화할 수 있습니다.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_03_AM.png)

#### 기본 로직

공간 필드를 포함하는 컬렉션에서는 시스템이 자동으로 다음 로직을 적용합니다.

1.  데이터를 생성할 때 현재 선택된 공간에 자동으로 연결됩니다.
2.  데이터를 필터링할 때 현재 선택된 공간의 데이터로 자동으로 제한됩니다.

### 이전 데이터의 멀티 스페이스 분류

멀티 스페이스 플러그인을 활성화하기 전에 이미 존재했던 데이터의 경우, 다음 단계를 통해 공간을 분류할 수 있습니다.

#### 1. 공간 필드 추가

이전 컬렉션에 공간 필드를 수동으로 추가합니다.

![](https://static-docs.nocobase.com/multi-space/data-source-manager-main-NocoBase-10-15-2025_10_18_AM.png)

#### 2. 할당되지 않은 공간에 사용자 할당

이전 데이터를 관리하는 사용자를 모든 공간에 연결해야 하며, 아직 공간에 할당되지 않은 데이터를 확인할 수 있도록 **할당되지 않은 공간(Unassigned Space)**을 포함해야 합니다.

![](https://static-docs.nocobase.com/multi-space/Users-Permissions-NocoBase-10-15-2025_10_14_AM.png)

#### 3. 모든 공간 데이터 보기로 전환

상단에서 모든 공간의 데이터를 볼 수 있도록 선택합니다.

![](https://static-docs.nocobase.com/multi-space/Goods-NocoBase-10-15-2025_10_20_AM.png)

#### 4. 이전 데이터 할당 페이지 구성

이전 데이터 할당을 위한 새 페이지를 생성합니다. **목록 페이지**와 **편집 페이지**에 「공간 필드」를 표시하여 수동으로 할당 공간을 조정할 수 있도록 합니다.

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_21_AM.png)

공간 필드를 편집 가능하도록 설정

![](https://static-docs.nocobase.com/multi-space/Goods-10-15-2025_10_22_AM.png)

#### 5. 데이터 공간 수동 할당

위에서 생성한 페이지를 통해 데이터를 수동으로 편집하여 이전 데이터에 올바른 공간을 점진적으로 할당합니다(일괄 편집도 직접 구성할 수 있습니다).