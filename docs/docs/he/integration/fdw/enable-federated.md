:::tip{title="הודעת תרגום AI"}
מסמך זה תורגם על ידי AI. למידע מדויק, אנא עיינו ב[גרסה באנגלית](/integration/fdw/enable-federated).
:::

# כיצד להפעיל את מנוע ה-Federated ב-MySQL

מסד הנתונים MySQL אינו מפעיל את מודול ה-federated כברירת מחדל. יש לשנות את תצורת ה-my.cnf. אם אתם משתמשים בגרסת Docker, ניתן לנהל את ההרחבה באמצעות volumes:

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

צרו קובץ חדש בשם `./storage/mysql-conf/federated.cnf`

```ini
[mysqld]
federated
```

הפעילו מחדש את MySQL

```bash
docker compose up -d mysql
```

בדקו האם ה-federated הופעל

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)