:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 스토리지 엔진: Amazon S3

Amazon S3 기반 스토리지 엔진입니다. 사용하기 전에 관련 계정 및 권한을 준비해야 합니다.

## 설정 파라미터

![Amazon S3 스토리지 엔진 설정 예시](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=참고}
이 섹션에서는 Amazon S3 스토리지 엔진의 전용 파라미터만 설명합니다. 일반 파라미터는 [엔진 공통 파라미터](./index#引擎通用参数)를 참조하십시오.
:::

### 리전

S3 스토리지 리전을 입력합니다. 예: `us-west-1`.

:::info{title=참고}
[Amazon S3 콘솔](https://console.aws.amazon.com/s3/)에서 스토리지 버킷의 리전 정보를 확인할 수 있으며, 전체 도메인 이름이 아닌 리전 접두사 부분만 사용하면 됩니다.
:::

### AccessKey ID

Amazon S3 AccessKey ID를 입력합니다.

### AccessKey Secret

Amazon S3 AccessKey Secret을 입력합니다.

### 버킷

S3 스토리지 버킷 이름을 입력합니다.