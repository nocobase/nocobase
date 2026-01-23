:::tip
Tài liệu này được dịch bởi AI. Đối với bất kỳ thông tin không chính xác nào, vui lòng tham khảo [phiên bản tiếng Anh](/en)
:::


# Quản lý Phụ thuộc

Trong quá trình phát triển plugin NocoBase, các phụ thuộc được chia thành hai loại chính: **phụ thuộc của plugin** và **phụ thuộc toàn cục**.

- **Phụ thuộc toàn cục**: Được cung cấp bởi `@nocobase/server` và `@nocobase/client`, các plugin không cần đóng gói riêng.
- **Phụ thuộc của plugin**: Là các phụ thuộc riêng biệt của plugin (bao gồm cả phụ thuộc phía server), chúng sẽ được đóng gói vào sản phẩm của plugin.

## Nguyên tắc Phát triển

Vì các phụ thuộc của plugin sẽ được đóng gói vào sản phẩm của plugin (bao gồm cả các phụ thuộc phía server được đóng gói vào `dist/node_modules`), bạn nên khai báo tất cả các phụ thuộc trong `devDependencies` thay vì `dependencies` khi phát triển plugin. Điều này giúp tránh sự khác biệt giữa môi trường phát triển và môi trường sản xuất.

Khi một plugin cần cài đặt các phụ thuộc dưới đây, hãy đảm bảo **số phiên bản** của chúng phải khớp với các phụ thuộc toàn cục trong `@nocobase/server` và `@nocobase/client`. Nếu không, có thể xảy ra xung đột trong quá trình chạy.

## Các Phụ thuộc Toàn cục

Các phụ thuộc dưới đây được NocoBase cung cấp và không cần đóng gói trong các plugin. Nếu thực sự cần sử dụng, chúng phải khớp với phiên bản của framework.

``` js
// Core của NocoBase
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

// Hệ sinh thái Koa
'koa',
'@koa/cors',
'@koa/router',
'multer',
'@koa/multer',
'koa-bodyparser',
'koa-static',
'koa-send',

// Hệ sinh thái React
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

// Các tiện ích chung
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

## Khuyến nghị Phát triển

1.  **Duy trì tính nhất quán của phụ thuộc**\
    Nếu bạn cần sử dụng các gói đã có trong phụ thuộc toàn cục, hãy tránh cài đặt các phiên bản khác nhau và sử dụng trực tiếp phụ thuộc toàn cục.

2.  **Giảm thiểu kích thước gói đóng gói**\
    Đối với các thư viện UI phổ biến (như `antd`), thư viện tiện ích (như `lodash`) và trình điều khiển cơ sở dữ liệu (như `pg`, `mysql2`), bạn nên dựa vào các phiên bản được cung cấp toàn cục để tránh đóng gói trùng lặp.

3.  **Nhất quán giữa môi trường gỡ lỗi và sản xuất**\
    Việc sử dụng `devDependencies` giúp đảm bảo tính nhất quán giữa môi trường phát triển và sản phẩm cuối cùng, tránh các khác biệt về môi trường do cấu hình `dependencies` và `peerDependencies` không đúng cách.