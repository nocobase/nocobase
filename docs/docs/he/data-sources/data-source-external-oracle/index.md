---
pkg: "@nocobase/plugin-data-source-external-oracle"
---
:::tip
מסמך זה תורגם על ידי בינה מלאכותית. לכל אי דיוק, אנא עיין ב[גרסה האנגלית](/en)
:::


# מקור נתונים חיצוני - Oracle

## מבוא

תוסף זה מאפשר לכם להשתמש במסד נתונים חיצוני של Oracle בתור מקור נתונים. הוא תומך בגרסאות Oracle מ-11g ומעלה.

## התקנה

### התקנת לקוח Oracle

עבור גרסאות שרת Oracle מוקדמות מ-12.1, עליכם להתקין את לקוח Oracle.

![התקנת לקוח Oracle](https://static-docs.nocobase.com/20241204164359.png)

דוגמה עבור Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

אם הלקוח לא הותקן בדרך המתוארת לעיל, תצטרכו לציין את הנתיב ללקוח (לפרטים נוספים, עיינו בתיעוד של [node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![הגדרת נתיב לקוח Oracle](https://static-docs.nocobase.com/20241204165940.png)

### התקנת תוסף

עיינו ב

## שימוש

לפרטים נוספים, עיינו בסעיף [מקורות נתונים / מסד נתונים חיצוני](/data-sources/data-source-manager/external-database).