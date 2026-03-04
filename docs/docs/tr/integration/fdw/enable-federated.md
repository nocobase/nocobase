:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/integration/fdw/enable-federated) bakın.
:::

# MySQL'de Federated Motoru Nasıl Etkinleştirilir

MySQL veritabanında `federated` modülü varsayılan olarak etkin değildir; `my.cnf` yapılandırmasını değiştirmeniz gerekir. Eğer Docker sürümünü kullanıyorsanız, bu genişletme işlemini `volumes` (birimler) aracılığıyla gerçekleştirebilirsiniz:

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

Yeni bir `./storage/mysql-conf/federated.cnf` dosyası oluşturun:

```ini
[mysqld]
federated
```

MySQL'i yeniden başlatın:

```bash
docker compose up -d mysql
```

`federated` motorunun etkinleştirilip etkinleştirilmediğini kontrol edin:

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)