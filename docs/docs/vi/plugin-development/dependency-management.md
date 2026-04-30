---
title: "Quản lý dependency Plugin"
description: "Dependency của Plugin NocoBase: package.json, peerDependencies, phiên bản package @nocobase, khai báo dependency giữa các Plugin."
keywords: "quản lý dependency,peerDependencies,package.json,dependency plugin,NocoBase"
---

# Quản lý dependency

Trong phát triển Plugin NocoBase, dependency được chia thành hai loại: **dependency riêng** và **dependency toàn cục**.

- **Dependency toàn cục**: Được cung cấp bởi `@nocobase/server` và `@nocobase/client-v2`, không cần đóng gói riêng trong Plugin.
- **Dependency riêng**: Dependency riêng của Plugin (bao gồm dependency phía server), sẽ được đóng gói vào sản phẩm Plugin.

## Nguyên tắc phát triển

Vì dependency riêng sẽ được đóng gói vào sản phẩm Plugin (dependency server sẽ được đóng gói vào `dist/node_modules`), bạn có thể khai báo tất cả dependency trong `devDependencies` thay vì `dependencies`. Cách này giúp tránh sự khác biệt giữa môi trường phát triển và production.

Khi Plugin cần dùng các dependency dưới đây, hãy đảm bảo **số phiên bản** trùng khớp với dependency toàn cục trong `@nocobase/server` và `@nocobase/client-v2`, nếu không có thể gây xung đột lúc runtime.

## Dependency toàn cục

Các dependency dưới đây được NocoBase cung cấp, không cần đóng gói trong Plugin. Nếu thực sự cần dùng, phải giữ phiên bản đồng bộ với NocoBase.

``` js
// nocobase core
'@nocobase/acl',
'@nocobase/actions',
'@nocobase/auth',
'@nocobase/cache',
'@nocobase/client-v2',
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

// Tiện ích chung
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

## Khuyến nghị phát triển

1.  **Giữ tính nhất quán của dependency**\
    Nếu một package đã có trong dependency toàn cục, hãy dùng phiên bản toàn cục, đừng cài phiên bản khác.

2.  **Giảm thiểu kích thước đóng gói**\
    Các thư viện UI thường gặp (như `antd`), thư viện tiện ích (như `lodash`), driver database (như `pg`, `mysql2`) đều nên dùng phiên bản toàn cục để tránh đóng gói trùng lặp.

3.  **Đồng bộ giữa debug và production**\
    Dùng `devDependencies` đủ để đảm bảo môi trường phát triển và sản phẩm cuối nhất quán, tránh khác biệt môi trường do cấu hình `dependencies` và `peerDependencies` không đúng.

## Liên kết liên quan

- [Build và đóng gói](./build.md) — Cấu hình build và đóng gói Plugin
- [Cấu trúc thư mục dự án](./project-structure.md) — Cách tổ chức file của Plugin
- [Viết Plugin đầu tiên](./write-your-first-plugin.md) — Tạo Plugin từ đầu
- [Tổng quan phát triển Plugin](./index.md) — Giới thiệu tổng thể về phát triển Plugin
