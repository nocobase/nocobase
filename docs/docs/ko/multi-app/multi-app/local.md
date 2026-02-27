---
pkg: '@nocobase/plugin-app-supervisor'
---

# 공유 메모리 모드

## 소개

복잡한 운영 구조 없이 앱 단위 분리를 원할 때 사용합니다.

## 사용 가이드

### 환경 변수

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### 앱 생성

**System Settings**에서 **App supervisor**로 이동 후 **Add**를 클릭합니다.

![](https://static-docs.nocobase.com/202512291056215.png)
![](https://static-docs.nocobase.com/202512291057696.png)

### 주요 설정

- **Application display name**
- **Application ID**
- **Start mode**
- **Environments (`local`)**
- **Database**
- **Upgrade**
- **JWT Secret**
- **Custom domain**

### 앱 운영

- **Start**: 시작
- **Visit**: 접속
- **Stop**: 중지
- **Delete**: 삭제

예시 URL:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

![](https://static-docs.nocobase.com/202512291121065.png)
![](https://static-docs.nocobase.com/202512291122113.png)
![](https://static-docs.nocobase.com/202512291122339.png)
![](https://static-docs.nocobase.com/202512291122178.png)

## FAQ

- 플러그인은 메인 앱과 동일 버전 사용 가능(설정은 앱별 분리)
- 앱별 독립 DB 사용 가능
- 메인 앱 백업에 타 앱 데이터는 포함되지 않음
- 앱 버전은 메인 앱 버전 추종
- JWT 분리 여부에 따라 세션 격리/편의성 트레이드오프 존재
