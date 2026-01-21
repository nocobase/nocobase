:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# كيفية تمكين محرك Federated في MySQL

لا يقوم MySQL بتمكين وحدة Federated بشكل افتراضي. لتمكينها، تحتاج إلى تعديل إعدادات `my.cnf`. إذا كنت تستخدم إصدار Docker، يمكنك التعامل مع هذا التوسيع عبر استخدام المجلدات (volumes) كالتالي:

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

أنشئ ملفًا جديدًا باسم `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

أعد تشغيل MySQL

```bash
docker compose up -d mysql
```

تحقق مما إذا كان Federated قد تم تفعيله

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)