---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::


# 외부 데이터 소스 - Oracle

## 소개

외부 Oracle 데이터베이스를 데이터 소스로 활용할 수 있습니다. Oracle 11g 이상 버전을 지원합니다.

## 설치

### Oracle 클라이언트 설치

Oracle 서버 버전이 12.1 미만인 경우, Oracle 클라이언트를 설치해야 합니다.

![Oracle 클라이언트 설치](https://static-docs.nocobase.com/20241204164359.png)

Linux 예시:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

만약 위에서 설명한 방식대로 클라이언트를 설치하지 않았다면, 클라이언트가 설치된 경로를 제공해야 합니다. (자세한 내용은 [node-oracledb 문서](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)를 참조하세요.)

![Oracle 클라이언트 경로 설정](https://static-docs.nocobase.com/20241204165940.png)

### 플러그인 설치

참조

## 사용 방법

[데이터 소스 / 외부 데이터베이스](/data-sources/data-source-manager/external-database) 섹션을 참조하세요.