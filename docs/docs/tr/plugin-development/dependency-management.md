:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# Bağımlılık Yönetimi

NocoBase eklenti geliştirme sürecinde, bağımlılıklar iki ana kategoriye ayrılır: **eklenti bağımlılıkları** ve **genel bağımlılıklar**.

- **Genel bağımlılıklar**: `@nocobase/server` ve `@nocobase/client` tarafından sağlanır. Eklentilerde ayrıca paketlemeye gerek yoktur.
- **Eklenti bağımlılıkları**: Eklentilere özgü bağımlılıklar (sunucu tarafı bağımlılıkları dahil) eklenti çıktılarına dahil edilir.

## Geliştirme İlkeleri

Eklenti bağımlılıkları (sunucu bağımlılıkları da dahil olmak üzere) eklenti çıktılarına (`dist/node_modules` içine) paketleneceği için, eklenti geliştirirken tüm bağımlılıkları `dependencies` yerine `devDependencies` içinde tanımlayabilirsiniz. Bu yaklaşım, geliştirme ve üretim ortamları arasında farklılıkların oluşmasını engeller.

Bir eklenti aşağıdaki bağımlılıkları kurması gerektiğinde, **sürüm numarasının** `@nocobase/server` ve `@nocobase/client` içindeki genel bağımlılıklarla eşleştiğinden emin olun. Aksi takdirde, çalışma zamanı çakışmaları meydana gelebilir.

## Genel Bağımlılıklar

Aşağıdaki bağımlılıklar NocoBase tarafından sağlanır ve eklentilerde paketlenmesine gerek yoktur. Eğer mutlaka kullanmanız gerekiyorsa, çerçeve sürümüyle uyumlu olduğundan emin olmalısınız.

``` js
// NocoBase çekirdek
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

// Koa ekosistemi
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// React ekosistemi
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

// Genel yardımcı programlar
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

## Geliştirme Önerileri

1.  **Bağımlılık Tutarlılığını Koruyun**\
    Genel bağımlılıklarda zaten mevcut olan paketleri kullanmanız gerekiyorsa, farklı sürümlerini kurmaktan kaçının ve doğrudan genel bağımlılıkları kullanın.

2.  **Paket Boyutunu Minimumda Tutun**\
    Yaygın UI kütüphaneleri (örneğin `antd`), yardımcı kütüphaneler (örneğin `lodash`) ve veritabanı sürücüleri (örneğin `pg`, `mysql2`) için, genel olarak sağlanan sürümlere güvenmeli ve tekrar paketlemekten kaçınmalısınız.

3.  **Hata Ayıklama ve Üretim Ortamları Arasında Tutarlılık**\
    `devDependencies` kullanmak, geliştirme ve nihai çıktılar arasında tutarlılık sağlar. Bu sayede `dependencies` ve `peerDependencies` ayarlarının yanlış yapılandırılmasından kaynaklanan ortam farklılıklarını önlemiş olursunuz.