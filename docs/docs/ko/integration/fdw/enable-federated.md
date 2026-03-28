:::tip{title="AI 번역 알림"}
이 문서는 AI에 의해 번역되었습니다. 정확한 정보는 [영어 버전](/integration/fdw/enable-federated)을 참조하세요.
:::

# MySQL에서 federated 엔진을 활성화하는 방법

MySQL 데이터베이스는 기본적으로 federated 모듈이 활성화되어 있지 않습니다. 이를 사용하려면 my.cnf 설정을 수정해야 합니다. Docker 버전을 사용하는 경우 volumes를 통해 설정을 확장할 수 있습니다.

```yml
mysql:
  image: mysql:8.1.0
  volumes:
    - ./storage/mysql-conf:/etc/mysql/conf.d
  environment:
    MYSQL_DATABASE: nocobase
    MYSQL_USER: nocobase
    MYSQL_PASSWORD: nocobase
    MYSQL_ROOT_PASSWORD: nocobase
  restart: always
  networks:
    - nocobase
```

`./storage/mysql-conf/federated.cnf` 파일을 새로 생성합니다.

```ini
[mysqld]
federated
```

MySQL을 재시작합니다.

```bash
docker compose up -d mysql
```

federated가 활성화되었는지 확인합니다.

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)