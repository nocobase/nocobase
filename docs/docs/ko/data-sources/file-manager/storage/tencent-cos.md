:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 텐센트 클라우드 COS

텐센트 클라우드 COS 기반의 스토리지 엔진입니다. 사용하기 전에 관련 계정과 권한을 준비해야 합니다.

## 구성 옵션

![텐센트 COS 스토리지 엔진 구성 옵션 예시](https://static-docs.nocobase.com/20240712222125.png)

:::info{title=팁}
이 섹션에서는 텐센트 클라우드 COS 스토리지 엔진의 전용 옵션만 다룹니다. 공통 옵션은 [엔진 공통 옵션](./index.md#common-engine-parameters)을 참고해 주세요.
:::

### 리전

COS 스토리지의 리전을 입력하세요. 예: `ap-chengdu`.

:::info{title=팁}
[텐센트 클라우드 COS 콘솔](https://console.cloud.tencent.com/cos)에서 스토리지 버킷의 리전 정보를 확인할 수 있으며, 리전 접두사 부분만 사용하면 됩니다(전체 도메인 이름은 필요 없음).
:::

### SecretId

텐센트 클라우드 인증 접근 키의 ID를 입력하세요.

### SecretKey

텐센트 클라우드 인증 접근 키의 Secret을 입력하세요.

### 버킷

COS 스토리지 버킷 이름을 입력하세요. 예: `qing-cdn-1234189398`.