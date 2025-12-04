:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::

# איך להפעיל את מנוע ה-Federated ב-MySQL

בברירת מחדל, מסד הנתונים של MySQL אינו מפעיל את מודול ה-federated. עליכם לשנות את קובץ התצורה my.cnf. אם אתם משתמשים בגרסת Docker, תוכלו לטפל בהרחבה באמצעות volumes:

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

בדקו אם ה-federated הופעל

```sql
show engines
```

![Alt text](https://static-docs.nocobase.com/ac5d97cf902ad164e141633a41a23e46.png)