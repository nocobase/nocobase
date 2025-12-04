:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# MySQL'de Federated Motoru Nasıl Etkinleştirilir?

MySQL veritabanı varsayılan olarak federated modülünü etkinleştirmez. Bunun için `my.cnf` yapılandırmasını değiştirmeniz gerekir. Eğer Docker sürümünü kullanıyorsanız, bu genişletme durumunu `volumes` aracılığıyla yönetebilirsiniz:

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

`./storage/mysql-conf/federated.cnf` adında yeni bir dosya oluşturun

```ini
[mysqld]
federated
```

MySQL'i yeniden başlatın

```bash
docker compose up -d mysql
```

federated motorunun etkinleştirilip etkinleştirilmediğini kontrol edin

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)