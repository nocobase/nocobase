---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 데이터 소스 - KingbaseES

## 소개

KingbaseES 데이터베이스를 데이터 소스로 사용하여 주 데이터베이스 또는 외부 데이터베이스로 활용할 수 있습니다.

:::warning
현재는 pg 모드로 실행되는 KingbaseES 데이터베이스만 지원합니다.
:::

## 설치

### 주 데이터베이스로 사용하기

설치 과정은 설치 문서를 참고해 주세요. 주요 차이점은 환경 변수에 있습니다.

#### 환경 변수

.env 파일을 수정하여 다음 환경 변수 설정을 추가하거나 변경합니다.

```bash
# 실제 상황에 맞게 DB 관련 파라미터를 조정하세요.
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### Docker 설치

```yml
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # 사용자 토큰 생성 등에 사용되는 애플리케이션 키
      # APP_KEY가 변경되면 이전 토큰도 무효화됩니다.
      # 임의의 무작위 문자열을 사용할 수 있으며, 외부에 노출되지 않도록 주의하세요.
      - APP_KEY=your-secret-key
      # 데이터베이스 유형
      - DB_DIALECT=kingbase
      # 데이터베이스 호스트. 기존 데이터베이스 서버 IP로 대체할 수 있습니다.
      - DB_HOST=kingbase
      # 데이터베이스 이름
      - DB_DATABASE=kingbase
      # 데이터베이스 사용자
      - DB_USER=nocobase
      # 데이터베이스 비밀번호
      - DB_PASSWORD=nocobase
      # 시간대
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # 테스트 목적으로만 사용되는 Kingbase 서비스
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # 반드시 no로 설정해야 합니다.
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg 전용
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### create-nocobase-app을 이용한 설치

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### 외부 데이터베이스로 사용하기

설치 또는 업그레이드 명령을 실행합니다.

```bash
yarn nocobase install
# 또는
yarn nocobase upgrade
```

플러그인 활성화

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## 사용 가이드

- 주 데이터베이스: [주 데이터 소스](/data-sources/data-source-main/)를 참고하세요.
- 외부 데이터베이스: [데이터 소스 / 외부 데이터베이스](/data-sources/data-source-manager/external-database)를 확인하세요.