:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

```
pkg: "@nocobase/plugin-data-source-external-oracle"
```

# مصدر بيانات خارجي - Oracle

## مقدمة

تتيح لك هذه الإضافة استخدام قاعدة بيانات Oracle خارجية كمصدر بيانات. تدعم الإصدارات Oracle >= 11g.

## التثبيت

### تثبيت عميل Oracle

بالنسبة لإصدارات خادم Oracle الأقدم من 12.1، تحتاج إلى تثبيت عميل Oracle.

![تثبيت عميل Oracle](https://static-docs.nocobase.com/20241204164359.png)

مثال لنظام Linux:

```bash
apt-get update
apt-get install -y unzip wget libaio1
wget https://download.oracle.com/otn_software/linux/instantclient/1925000/instantclient-basic-linux.x64-19.25.0.0.0dbru.zip
unzip instantclient-basic-linux.x64-19.25.0.0.0dbru.zip -d /opt/
echo /opt/instantclient_19_25 > /etc/ld.so.conf.d/oracle-instantclient.conf
ldconfig
```

إذا لم يتم تثبيت العميل بالطريقة الموضحة أعلاه، فستحتاج إلى تحديد مسار العميل (لمزيد من التفاصيل، راجع [وثائق node-oracledb](https://node-oracledb.readthedocs.io/en/latest/user_guide/initialization.html)).

![تكوين مسار عميل Oracle](https://static-docs.nocobase.com/20241204165940.png)

### تثبيت الإضافة

راجع

## الاستخدام

للحصول على تعليمات مفصلة، راجع قسم [مصدر البيانات / قاعدة البيانات الخارجية](/data-sources/data-source-manager/external-database).