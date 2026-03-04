:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/integration/fdw/enable-federated).
:::

# كيفية تفعيل محرك federated في MySQL

لا يتم تفعيل وحدة federated في قاعدة بيانات MySQL بشكل افتراضي. تحتاج إلى تعديل ملف الإعدادات `my.cnf`. إذا كنت تستخدم إصدار Docker، يمكنك التعامل مع التوسعة من خلال المجلدات (volumes):

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

أنشئ ملفاً جديداً باسم `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

أعد تشغيل MySQL

```bash
docker compose up -d mysql
```

تحقق مما إذا كان قد تم تفعيل federated

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)