:::tip إشعار الترجمة بالذكاء الاصطناعي
تمت ترجمة هذه الوثائق تلقائيًا بواسطة الذكاء الاصطناعي.
:::

# إدارة التبعيات

في تطوير إضافات NocoBase، تنقسم التبعيات إلى فئتين: **تبعيات الإضافة** و**تبعيات عامة**.

- **التبعيات العامة**: يتم توفيرها بواسطة `@nocobase/server` و `@nocobase/client`، ولا تحتاج الإضافات إلى تجميعها بشكل منفصل.
- **تبعيات الإضافة**: هي التبعيات الفريدة للإضافات (بما في ذلك تبعيات جانب الخادم)، وسيتم تجميعها ضمن مخرجات الإضافة.

## مبادئ التطوير

نظرًا لأنه سيتم تجميع تبعيات الإضافة ضمن مخرجات الإضافة (بما في ذلك تبعيات الخادم التي سيتم تجميعها في `dist/node_modules`)، يمكنك عند تطوير الإضافات التصريح عن جميع التبعيات في `devDependencies` بدلاً من `dependencies`. يساعد هذا في تجنب الاختلافات بين بيئات التطوير والإنتاج.

عندما تحتاج إضافة إلى تثبيت التبعيات التالية، يرجى التأكد من أن **رقم الإصدار** يتطابق مع التبعيات العامة في `@nocobase/server` و `@nocobase/client`، وإلا فقد يؤدي ذلك إلى تعارضات أثناء التشغيل.

## التبعيات العامة

يتم توفير التبعيات التالية بواسطة NocoBase ولا تحتاج الإضافات إلى تجميعها. وإذا كانت هناك حاجة ماسة إليها، فيجب أن تتطابق مع إصدار الإطار.

``` js
// nocobase core
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client',
'@nocobase/database',
'@nocobase/evaluators',
'@nocobase/logger',
'@nocobase/resourcer',
'@nocobase/sdk',
'@nocobase/server',
'@nocobase/test',
'@nocobase/utils',

// @nocobase/auth
'jsonwebtoken',

// @nocobase/cache
'cache-manager',
'cache-manager-fs-hash',

// @nocobase/database
'sequelize',
'umzug',
'async-mutex',

// @nocobase/evaluators
'@formulajs/formulajs',
'mathjs',

// @nocobase/logger
'winston',
'winston-daily-rotate-file',

// koa ecosystem
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React ecosystem
'react',
'react-dom',
'react/jsx-runtime',

// React Router
'react-router',
'react-router-dom',

// Ant Design
'antd',
'antd-style',
'@ant-design/icons',
'@ant-design/cssinjs',

// i18n
'i18next',
'react-i18next',

// dnd-kit
'@dnd-kit/accessibility',
'@dnd-kit/core',
'@dnd-kit/modifiers',
'@dnd-kit/sortable',
'@dnd-kit/utilities',

// Formily
'@formily/antd-v5',
'@formily/core',
'@formily/react',
'@formily/json-schema',
'@formily/path',
'@formily/validator',
'@formily/shared',
'@formily/reactive',
'@formily/reactive-react',

// Common utilities
'dayjs',
'mysql2',
'pg',
'pg-hstore',
'supertest',
'axios',
'@emotion/css',
'ahooks',
'lodash',
```

## توصيات التطوير

1.  **الحفاظ على اتساق التبعيات**\
    إذا كنت بحاجة إلى استخدام حزم موجودة بالفعل ضمن التبعيات العامة، يرجى تجنب تثبيت إصدارات مختلفة واستخدام التبعيات العامة مباشرة.

2.  **تقليل حجم التجميع**\
    بالنسبة لمكتبات واجهة المستخدم الشائعة (مثل `antd`)، ومكتبات الأدوات المساعدة (مثل `lodash`)، ومشغلات قواعد البيانات (مثل `pg` و `mysql2`)، يجب الاعتماد على الإصدارات المتوفرة عالميًا لتجنب التجميع المزدوج.

3.  **الاتساق بين بيئات التطوير والإنتاج**\
    يضمن استخدام `devDependencies` الاتساق بين عملية التطوير والمخرجات النهائية، مما يتجنب الاختلافات البيئية الناتجة عن التكوين غير الصحيح لـ `dependencies` و `peerDependencies`.