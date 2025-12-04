:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# MySQL에서 Federated 엔진을 활성화하는 방법

MySQL 데이터베이스는 기본적으로 federated 모듈이 활성화되어 있지 않습니다. my.cnf 설정을 수정해야 합니다. Docker 버전을 사용 중이라면, 볼륨(volumes)을 통해 확장 상황을 처리할 수 있습니다:

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