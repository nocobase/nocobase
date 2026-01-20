---
pkg: "@nocobase/plugin-data-source-kingbase"
---
:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::


# مصدر البيانات - قاعدة بيانات KingbaseES

## مقدمة

يمكن استخدام قاعدة بيانات KingbaseES كمصدر للبيانات، سواء كقاعدة بيانات رئيسية أو كقاعدة بيانات خارجية.

:::warning
حاليًا، لا يتم دعم سوى قواعد بيانات KingbaseES التي تعمل في وضع pg.
:::

## التثبيت

### الاستخدام كقاعدة بيانات رئيسية

يرجى الرجوع إلى وثائق التثبيت للحصول على إجراءات الإعداد، حيث يكمن الاختلاف الرئيسي في متغيرات البيئة.

#### متغيرات البيئة

عدّل ملف .env لإضافة أو تعديل إعدادات متغيرات البيئة التالية:

```bash
# اضبط معلمات قاعدة البيانات حسب الحاجة
DB_DIALECT=kingbase
DB_HOST=localhost
DB_PORT=54321
DB_DATABASE=kingbase
DB_USER=nocobase
DB_PASSWORD=nocobase
```

#### التثبيت باستخدام Docker

```yml
version: "3"

networks:
  nocobase:
    driver: bridge

  app:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest
    restart: always
    networks:
      - nocobase
    depends_on:
      - postgres
    environment:
      # مفتاح التطبيق المستخدم لتوليد رموز المستخدم (tokens) وما إلى ذلك.
      # إذا تم تغيير APP_KEY، فستصبح الرموز القديمة غير صالحة.
      # يمكن أن يكون أي سلسلة عشوائية، وتأكد من عدم تسريبها.
      - APP_KEY=your-secret-key
      # نوع قاعدة البيانات
      - DB_DIALECT=kingbase
      # مضيف قاعدة البيانات، يمكن استبداله بعنوان IP لخادم قاعدة بيانات موجود.
      - DB_HOST=kingbase
      # اسم قاعدة البيانات
      - DB_DATABASE=kingbase
      # مستخدم قاعدة البيانات
      - DB_USER=nocobase
      # كلمة مرور قاعدة البيانات
      - DB_PASSWORD=nocobase
      # المنطقة الزمنية
      - TZ=Asia/Shanghai
    volumes:
      - ./storage:/app/nocobase/storage
    ports:
      - "13000:80"

  # خدمة Kingbase لأغراض الاختبار فقط
  kingbase:
    image: registry.cn-shanghai.aliyuncs.com/nocobase/kingbase:v009r001c001b0030_single_x86
    platform: linux/amd64
    restart: always
    privileged: true
    networks:
      - nocobase
    volumes:
      - ./storage/db/kingbase:/home/kingbase/userdata
    environment:
      ENABLE_CI: no # يجب أن تكون "no"
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_MODE: pg  # pg فقط
      NEED_START: yes
    command: ["/usr/sbin/init"]
```

#### التثبيت باستخدام create-nocobase-app

```bash
yarn create nocobase-app my-nocobase-app -d kingbase \
   -e DB_HOST=localhost \
   -e DB_PORT=54321 \
   -e DB_DATABASE=kingbase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase \
   -e TZ=Asia/Shanghai
```

### الاستخدام كقاعدة بيانات خارجية

نفّذ أمر التثبيت أو الترقية:

```bash
yarn nocobase install
# or
yarn nocobase upgrade
```

تفعيل الإضافة

![20241024121815](https://static-docs.nocobase.com/20241024121815.png)

## دليل المستخدم

- قاعدة البيانات الرئيسية: راجع [مصدر البيانات الرئيسي](/data-sources/data-source-main/)
- قاعدة البيانات الخارجية: راجع [مصدر البيانات / قاعدة البيانات الخارجية](/data-sources/data-source-manager/external-database)