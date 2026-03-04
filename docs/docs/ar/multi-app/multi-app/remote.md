---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="إشعار الترجمة بالذكاء الاصطناعي"}
تمت ترجمة هذا المستند بواسطة الذكاء الاصطناعي. للحصول على معلومات دقيقة، يرجى الرجوع إلى [النسخة الإنجليزية](/multi-app/multi-app/remote).
:::

# وضع البيئات المتعددة

## مقدمة

تتمتع التطبيقات المتعددة في وضع الذاكرة المشتركة بمزايا واضحة في النشر والتشغيل والصيانة، ولكن مع زيادة عدد التطبيقات وتعقيد الأعمال، قد يواجه المثيل الواحد تدريجيًا مشكلات مثل التنافس على الموارد وانخفاض الاستقرار. لمثل هذه السيناريوهات، يمكن للمستخدمين اعتماد مخطط نشر هجين متعدد البيئات لدعم متطلبات الأعمال الأكثر تعقيدًا.

في هذا الوضع، يقوم النظام بنشر تطبيق مدخل كمركز موحد للإدارة والجدولة، مع نشر مثيلات NocoBase متعددة كبيئات تشغيل تطبيقات مستقلة مسؤولة عن استضافة تطبيقات الأعمال فعليًا. يتم عزل البيئات عن بعضها البعض وتعمل بشكل تعاوني، مما يوزع ضغط المثيل الواحد بفعالية ويعزز بشكل كبير استقرار النظام وقابليته للتوسع وقدرته على عزل الأعطال.

على مستوى النشر، يمكن تشغيل البيئات المختلفة في عمليات مستقلة، أو نشرها كحاويات Docker مختلفة، أو في شكل عمليات نشر Kubernetes متعددة، مما يتيح التكيف بمرونة مع بيئات البنية التحتية ذات الأحجام والهياكل المختلفة.

## النشر

في وضع النشر الهجين متعدد البيئات:

- تطبيق المدخل (Supervisor) مسؤول عن الإدارة الموحدة للتطبيقات ومعلومات البيئة.
- تطبيق العمل (Worker) يعمل كبيئة تشغيل الأعمال الفعلية.
- يتم تخزين تكوينات التطبيقات والبيئات عبر ذاكرة التخزين المؤقت Redis.
- يعتمد مزامنة التعليمات والحالة بين تطبيق المدخل وتطبيقات العمل على اتصالات Redis.

حاليًا، لا تتوفر وظيفة إنشاء البيئة بعد، ويجب نشر كل تطبيق عمل يدويًا وتكوين معلومات البيئة المقابلة قبل أن يتمكن تطبيق المدخل من التعرف عليه.

### متطلبات البنية

يرجى تجهيز الخدمات التالية قبل النشر:

- Redis
  - تخزين تكوينات التطبيقات والبيئات مؤقتًا.
  - يعمل كقناة اتصال للأوامر بين تطبيق المدخل وتطبيقات العمل.

- قاعدة البيانات
  - خدمات قاعدة البيانات التي يحتاج كل من تطبيق المدخل وتطبيقات العمل للاتصال بها.

### تطبيق المدخل (Supervisor)

يعمل تطبيق المدخل كمركز إدارة موحد، وهو مسؤول عن إنشاء التطبيقات وبدئها وإيقافها وجدولة البيئة، بالإضافة إلى وكيل الوصول للتطبيقات.

شرح تكوين متغيرات البيئة لتطبيق المدخل

```bash
# وضع التطبيق
APP_MODE=supervisor
# طريقة اكتشاف التطبيق
APP_DISCOVERY_ADAPTER=remote
# طريقة إدارة عمليات التطبيق
APP_PROCESS_ADAPTER=remote
# ذاكرة Redis لتخزين تكوينات التطبيقات والبيئات
APP_SUPERVISOR_REDIS_URL=
# طريقة اتصال أوامر التطبيق
APP_COMMAND_ADPATER=redis
# ذاكرة Redis لاتصال أوامر التطبيق
APP_COMMAND_REDIS_URL=
```

### تطبيق العمل (Worker)

يعمل تطبيق العمل كبيئة تشغيل الأعمال الفعلية، وهو مسؤول عن استضافة وتشغيل مثيلات تطبيق NocoBase المحددة.

شرح تكوين متغيرات البيئة لتطبيق العمل

```bash
# وضع التطبيق
APP_MODE=worker
# طريقة اكتشاف التطبيق
APP_DISCOVERY_ADAPTER=remote
# طريقة إدارة عمليات التطبيق
APP_PROCESS_ADAPTER=local
# ذاكرة Redis لتخزين تكوينات التطبيقات والبيئات
APP_SUPERVISOR_REDIS_URL=
# طريقة اتصال أوامر التطبيق
APP_COMMAND_ADPATER=redis
# ذاكرة Redis لاتصال أوامر التطبيق
APP_COMMAND_REDIS_URL=
# معرف البيئة
ENVIRONMENT_NAME=
# عنوان URL للوصول إلى البيئة
ENVIRONMENT_URL=
# عنوان URL لوكيل الوصول إلى البيئة
ENVIRONMENT_PROXY_URL=
```

### مثال Docker Compose

يوضح المثال التالي مخطط نشر هجين متعدد البيئات باستخدام حاويات Docker كوحدات تشغيل، حيث يتم نشر تطبيق مدخل واحد وتطبيقي عمل في وقت واحد عبر Docker Compose.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## دليل الاستخدام

عمليات الإدارة الأساسية للتطبيق لا تختلف عن وضع الذاكرة المشتركة، يرجى الرجوع إلى [وضع الذاكرة المشتركة](./local.md). يقدم هذا القسم بشكل أساسي المحتوى المتعلق بتكوين البيئات المتعددة.

### قائمة البيئات

بعد اكتمال النشر، ادخل إلى صفحة «مراقب التطبيقات» في تطبيق المدخل، حيث يمكنك عرض قائمة بيئات العمل المسجلة في علامة تبويب «البيئات». يتضمن ذلك معرف البيئة، وإصدار تطبيق العمل، وعنوان URL للوصول، والحالة، وغيرها من المعلومات. يرسل تطبيق العمل نبضات قلب كل دقيقتين لضمان توفر البيئة.

![](https://static-docs.nocobase.com/202512291830371.png)

### إنشاء تطبيق

عند إنشاء تطبيق، يمكنك اختيار بيئة تشغيل واحدة أو أكثر لتحديد تطبيقات العمل التي سيتم نشر هذا التطبيق فيها. في الحالات العادية، يوصى باختيار بيئة واحدة فقط. يتم اختيار بيئات متعددة فقط عندما يتم [تقسيم الخدمات](/cluster-mode/services-splitting) في تطبيق العمل، وتكون هناك حاجة لنشر نفس التطبيق في بيئات تشغيل متعددة لتحقيق موازنة الحمل أو عزل القدرات.

![](https://static-docs.nocobase.com/202512291835086.png)

### قائمة التطبيقات

ستعرض صفحة قائمة التطبيقات بيئة التشغيل الحالية ومعلومات الحالة لكل تطبيق. إذا تم نشر التطبيق في بيئات متعددة، فسيتم عرض حالات تشغيل متعددة. في الظروف العادية، سيحتفظ نفس التطبيق في بيئات متعددة بحالة موحدة، ويجب التحكم في البدء والإيقاف بشكل موحد.

![](https://static-docs.nocobase.com/202512291842216.png)

### بدء التطبيق

نظرًا لأن بدء تشغيل التطبيق قد يتضمن كتابة بيانات أولية في قاعدة البيانات، ولتجنب ظروف السباق في البيئات المتعددة، سيتم بدء تشغيل التطبيقات المنشورة في بيئات متعددة بالتتابع.

![](https://static-docs.nocobase.com/202512291841727.png)

### وكيل الوصول للتطبيقات

يمكن الوصول إلى تطبيقات العمل عبر وكيل من خلال المسار الفرعي `/apps/:appName/admin` لتطبيق المدخل.

![](https://static-docs.nocobase.com/202601082154230.png)

إذا تم نشر التطبيق في بيئات متعددة، فيجب تحديد بيئة مستهدفة لوكيل الوصول.

![](https://static-docs.nocobase.com/202601082155146.png)

بشكل افتراضي، يستخدم عنوان وصول الوكيل عنوان وصول تطبيق العمل، المقابل لمتغير البيئة `ENVIRONMENT_URL`؛ يجب التأكد من إمكانية الوصول إلى هذا العنوان في بيئة الشبكة التي يتواجد فيها تطبيق المدخل. إذا كنت بحاجة إلى استخدام عنوان وصول وكيل مختلف، فيمكنك تجاوزه عبر متغير البيئة `ENVIRONMENT_PROXY_URL`.