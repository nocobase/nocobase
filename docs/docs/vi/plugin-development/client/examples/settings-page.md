---
title: "Tạo một trang cài đặt Plugin"
description: "Thực hành Plugin NocoBase: dùng pluginSettingsManager + Component + ctx.api để tạo một trang cài đặt plugin, quản lý API Key của dịch vụ bên thứ ba."
keywords: "trang cài đặt plugin,pluginSettingsManager,addMenuItem,addPageTabItem,Antd Form,ctx.api,NocoBase"
---

# Tạo một trang cài đặt Plugin

Nhiều plugin cần một trang cài đặt để người dùng cấu hình tham số — ví dụ như API Key của dịch vụ bên thứ ba, địa chỉ Webhook, v.v. Ví dụ này hướng dẫn cách dùng `pluginSettingsManager` + React component + `ctx.api` để tạo một trang cài đặt Plugin hoàn chỉnh.

Ví dụ này không liên quan đến FlowEngine, hoàn toàn là sự kết hợp của Plugin + Router + Component + Context.

:::tip Đọc trước

Nên tìm hiểu các nội dung sau trước khi phát triển để mượt mà hơn:

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo plugin và cấu trúc thư mục
- [Plugin](../plugin) — Entry point và lifecycle `load()` của plugin
- [Router](../router) — Đăng ký trang cài đặt qua `pluginSettingsManager`
- [Phát triển Component](../component/index.md) — Cách viết React component và useFlowContext
- [i18n](../component/i18n) — Cách viết file dịch và cách dùng `useT()`

:::


## Kết quả cuối cùng

Chúng ta sẽ tạo một trang cài đặt "Cấu hình dịch vụ bên ngoài":

- Xuất hiện trong menu "Cấu hình Plugin"
- Dùng Antd Form để cung cấp UI form
- Đọc và lưu cấu hình bằng cách gọi API backend qua `ctx.api`
- Hiển thị thông báo khi lưu thành công

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

Toàn bộ source code xem tại [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page). Nếu bạn muốn chạy thử trực tiếp ở local:

```bash
yarn pm enable @nocobase-example/plugin-settings-page
```

Sau đây ta sẽ xây dựng plugin này từ đầu, từng bước một.

## Bước 1: Tạo khung plugin

Tại thư mục gốc của repo, chạy:

```bash
yarn pm create @my-project/plugin-settings-page
```

Lệnh này sẽ sinh cấu trúc file cơ bản tại `packages/plugins/@my-project/plugin-settings-page`, bao gồm các thư mục `src/client-v2/`, `src/server/`, `src/locale/`, v.v. Chi tiết xem tại [Viết Plugin đầu tiên](../../write-your-first-plugin).

## Bước 2: Đăng ký trang cài đặt

Chỉnh sửa `src/client-v2/plugin.tsx`, trong `load()` dùng `this.pluginSettingsManager` để đăng ký trang cài đặt. Chia làm hai bước — trước tiên dùng `addMenuItem()` để đăng ký mục menu, sau đó dùng `addPageTabItem()` để đăng ký trang thực tế:

```ts
// src/client-v2/plugin.tsx
import { Plugin, Application } from '@nocobase/client-v2';

export class PluginSettingsPageClient extends Plugin<any, Application> {
  async load() {
    // Đăng ký mục menu
    this.pluginSettingsManager.addMenuItem({
      key: 'external-api',
      title: this.t('External API Settings'),
      icon: 'ApiOutlined', // Icon Ant Design, tham khảo https://5x.ant.design/components/icon
    });

    // Tab 1: Cấu hình API (key là 'index', map đến đường dẫn gốc của menu /admin/settings/external-api)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'index',
      title: this.t('API Configuration'),
      componentLoader: () => import('./pages/ExternalApiSettingsPage'),
      sort: -1, // Giá trị sort càng nhỏ thì càng đứng trước
    });

    // Tab 2: Trang Giới thiệu (map đến /admin/settings/external-api/about)
    this.pluginSettingsManager.addPageTabItem({
      menuKey: 'external-api',
      key: 'about',
      title: this.t('About'),
      componentLoader: () => import('./pages/AboutPage'),
    });
  }
}

export default PluginSettingsPageClient;
```

Sau khi đăng ký, trong menu "Cấu hình Plugin" sẽ xuất hiện mục "Cấu hình dịch vụ bên ngoài", phía trên có hai tab — "Cấu hình API" và "Giới thiệu". Khi menu chỉ có một trang thì thanh tab sẽ tự động ẩn, ở đây đăng ký hai trang nên sẽ tự động hiển thị. `this.t()` sẽ tự động dùng tên package của plugin hiện tại làm i18n namespace, xem chi tiết tại [Context → Khả năng thường dùng](../ctx/common-capabilities#i18n-ctxt--ctxi18n).

![settings page](https://static-docs.nocobase.com/20260415160006.png)

## Bước 3: Viết component cho trang cài đặt

Tạo file mới `src/client-v2/pages/ExternalApiSettingsPage.tsx`. Trang cài đặt chỉ là một React component thông thường. Ở đây dùng `Form` và `Card` của Antd để dựng UI, dùng `useFlowContext()` để lấy `ctx.api` cho việc tương tác với backend, dùng `useT()` để lấy hàm dịch.

```tsx
// src/client-v2/pages/ExternalApiSettingsPage.tsx
import React from 'react';
import { Form, Input, Button, Card, Space, message } from 'antd';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { useT } from '../locale';

interface ExternalApiSettings {
  apiKey: string;
  apiSecret: string;
  endpoint: string;
}

export default function ExternalApiSettingsPage() {
  const ctx = useFlowContext();
  const t = useT();
  const [form] = Form.useForm<ExternalApiSettings>();

  // Tải cấu hình hiện có
  const { loading } = useRequest(
    () =>
      ctx.api.request({
        url: 'externalApi:get',
        method: 'get',
      }),
    {
      onSuccess(response) {
        if (response?.data?.data) {
          form.setFieldsValue(response.data.data);
        }
      },
    },
  );

  // Lưu cấu hình
  const { run: save, loading: saving } = useRequest(
    (values: ExternalApiSettings) =>
      ctx.api.request({
        url: 'externalApi:set',
        method: 'post',
        data: values,
      }),
    {
      manual: true,
      onSuccess() {
        message.success(t('Saved successfully'));
      },
      onError() {
        message.error(t('Save failed'));
      },
    },
  );

  const handleSave = async () => {
    const values = await form.validateFields();
    save(values);
  };

  return (
    <Card title={t('External API Settings')} loading={loading}>
      <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
        <Form.Item
          label="API Key"
          name="apiKey"
          rules={[{ required: true, message: t('Please enter API Key') }]}
        >
          <Input placeholder="sk-xxxxxxxxxxxx" autoComplete="off" />
        </Form.Item>

        <Form.Item
          label="API Secret"
          name="apiSecret"
          rules={[{ required: true, message: t('Please enter API Secret') }]}
        >
          <Input.Password placeholder="••••••••" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Endpoint"
          name="endpoint"
          rules={[{ required: true, message: t('Please enter endpoint URL') }]}
        >
          <Input placeholder="https://api.example.com/v1" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSave} loading={saving}>
              {t('Save')}
            </Button>
            <Button onClick={() => form.resetFields()}>
              {t('Reset')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
```

Một số điểm chính:

- **`useFlowContext()`** — Import từ `@nocobase/flow-engine`, lấy các khả năng context như `ctx.api`
- **`useT()`** — Hook dịch import từ `locale.ts`, đã bind sẵn namespace của plugin, xem chi tiết tại [i18n](../component/i18n)
- **`useRequest()`** — Đến từ [ahooks](https://ahooks.js.org/hooks/use-request/index), xử lý trạng thái loading, error của request. `manual: true` nghĩa là không tự động gửi request, cần gọi thủ công `run()`
- **`ctx.api.request()`** — Cách dùng giống Axios, NocoBase sẽ tự động kèm thông tin xác thực

## Bước 4: Thêm file đa ngôn ngữ

Chỉnh sửa file dịch trong `src/locale/` của plugin:

```json
// src/locale/zh-CN.json
{
  "External API Settings": "外部服务配置",
  "API Configuration": "API 配置",
  "About": "关于",
  "Plugin name": "插件名称",
  "Version": "版本",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "这是一个演示插件，展示如何注册带多个 Tab 的设置页。",
  "Please enter API Key": "请输入 API Key",
  "Please enter API Secret": "请输入 API Secret",
  "Please enter endpoint URL": "请输入接口地址",
  "Save": "保存",
  "Reset": "重置",
  "Saved successfully": "保存成功",
  "Save failed": "保存失败"
}
```

```json
// src/locale/en-US.json
{
  "External API Settings": "External API Settings",
  "API Configuration": "API Configuration",
  "About": "About",
  "Plugin name": "Plugin name",
  "Version": "Version",
  "This is a demo plugin showing how to register a settings page with multiple tabs.": "This is a demo plugin showing how to register a settings page with multiple tabs.",
  "Please enter API Key": "Please enter API Key",
  "Please enter API Secret": "Please enter API Secret",
  "Please enter endpoint URL": "Please enter endpoint URL",
  "Save": "Save",
  "Reset": "Reset",
  "Saved successfully": "Saved successfully",
  "Save failed": "Save failed"
}
```

:::warning Lưu ý

Khi thêm file ngôn ngữ lần đầu, bạn cần khởi động lại ứng dụng để có hiệu lực.

:::

Về cách viết file dịch, hook `useT()`, `tExpr()` và các cách dùng khác, xem chi tiết tại [i18n](../component/i18n).

## Bước 5: API phía server

Form phía client cần backend cung cấp hai API `externalApi:get` và `externalApi:set`. Phần phía server không phức tạp — định nghĩa một collection để lưu cấu hình, sau đó đăng ký hai API là được.

### Định nghĩa Collection

Tạo file mới `src/server/collections/externalApiSettings.ts`. NocoBase sẽ tự động load các collection definition trong thư mục này:

```ts
// src/server/collections/externalApiSettings.ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'externalApiSettings',
  fields: [
    { name: 'apiKey', type: 'string', title: 'API Key' },
    { name: 'apiSecret', type: 'string', title: 'API Secret' },
    { name: 'endpoint', type: 'string', title: 'Endpoint' },
  ],
});
```

### Đăng ký Resource và API

Chỉnh sửa `src/server/plugin.ts`, dùng `resourceManager.define()` để đăng ký resource, sau đó cấu hình quyền ACL:

```ts
// src/server/plugin.ts
import { Plugin } from '@nocobase/server';

export class PluginSettingsPageServer extends Plugin {
  async load() {
    // Đăng ký resource và API
    this.app.resourceManager.define({
      name: 'externalApi',
      actions: {
        // GET /api/externalApi:get — Đọc cấu hình
        async get(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const record = await repo.findOne();
          ctx.body = record?.toJSON() ?? {};
          await next();
        },
        // POST /api/externalApi:set — Lưu cấu hình
        async set(ctx, next) {
          const repo = ctx.db.getRepository('externalApiSettings');
          const values = ctx.action.params.values;
          const existing = await repo.findOne();
          if (existing) {
            await repo.update({ values, filter: { id: existing.id } });
          } else {
            await repo.create({ values });
          }
          ctx.body = { ok: true };
          await next();
        },
      },
    });

    // Người dùng đã đăng nhập có thể đọc cấu hình
    this.app.acl.allow('externalApi', 'get', 'loggedIn');
  }
}

export default PluginSettingsPageServer;
```

Một số điểm chính:

- **`ctx.db.getRepository()`** — Lấy đối tượng thao tác dữ liệu qua tên collection
- **`ctx.action.params.values`** — Body data của POST request
- **`acl.allow()`** — `'loggedIn'` nghĩa là người dùng đã đăng nhập có thể truy cập. API `set` không có allow rõ ràng, mặc định chỉ admin mới gọi được
- **`await next()`** — Mỗi action đều phải gọi ở cuối, đây là quy ước của Koa middleware

## Bước 6: Viết trang "Giới thiệu"

Ở bước 2 chúng ta đã đăng ký hai tab. Component của trang "Cấu hình API" đã được viết ở bước 3, giờ ta viết trang cho tab "Giới thiệu".

Tạo file mới `src/client-v2/pages/AboutPage.tsx`:

```tsx
// src/client-v2/pages/AboutPage.tsx
import React from 'react';
import { Card, Descriptions, Typography } from 'antd';
import { useT } from '../locale';

const { Paragraph } = Typography;

export default function AboutPage() {
  const t = useT();

  return (
    <Card title={t('About')}>
      <Descriptions column={1} bordered style={{ maxWidth: 600 }}>
        <Descriptions.Item label={t('Plugin name')}>
          @nocobase-example/plugin-settings-page
        </Descriptions.Item>
        <Descriptions.Item label={t('Version')}>1.0.0</Descriptions.Item>
      </Descriptions>
      <Paragraph style={{ marginTop: 16, color: '#888' }}>
        {t('This is a demo plugin showing how to register a settings page with multiple tabs.')}
      </Paragraph>
    </Card>
  );
}
```

Trang này rất đơn giản — dùng `Descriptions` của Antd để hiển thị thông tin plugin. Trong dự án thực tế, tab "Giới thiệu" có thể dùng để đặt số phiên bản, changelog, link trợ giúp, v.v.

## Bước 7: Bật plugin

```bash
yarn pm enable @my-project/plugin-settings-page
```

Sau khi bật, refresh lại trang, bạn sẽ thấy mục "Cấu hình dịch vụ bên ngoài" trong menu "Cấu hình Plugin".

![20260407161139](https://static-docs.nocobase.com/20260407161139.png)

## Source code đầy đủ

- [@nocobase-example/plugin-settings-page](https://github.com/nocobase/nocobase/tree/develop/packages/plugins/%40nocobase-example/plugin-settings-page) — Ví dụ đầy đủ về trang cài đặt Plugin

## Tóm tắt

Các khả năng được sử dụng trong ví dụ này:

| Khả năng | Cách dùng | Tài liệu |
| -------- | --------- | -------- |
| Đăng ký trang cài đặt | `pluginSettingsManager.addMenuItem()` + `addPageTabItem()` | [Router](../router) |
| Trang cài đặt nhiều Tab | Đăng ký nhiều `addPageTabItem()` cùng `menuKey` | [Router](../router) |
| API request | `ctx.api.request()` | [Context → Khả năng thường dùng](../ctx/common-capabilities#api-request-ctxapi) |
| i18n (client) | `this.t()` / `useT()` | [i18n](../component/i18n) |
| i18n (server) | `ctx.t()` / `plugin.t()` | [i18n (phía server)](../../server/i18n) |
| UI Form | Antd Form | [Ant Design Form](https://5x.ant.design/components/form) |

## Liên kết liên quan

- [Viết Plugin đầu tiên](../../write-your-first-plugin) — Tạo khung plugin từ đầu
- [Plugin](../plugin) — Entry point và lifecycle của plugin
- [Router](../router) — Routing trang và đăng ký trang cài đặt plugin
- [Context → Khả năng thường dùng](../ctx/common-capabilities) — ctx.api, ctx.t, v.v.
- [Phát triển Component](../component/index.md) — Cách viết React component
- [Tổng quan phát triển phía server](../../server) — Định nghĩa API backend
- [i18n](../component/i18n) — Cách viết file dịch
- [i18n (phía server)](../../server/i18n) — Dịch phía server
