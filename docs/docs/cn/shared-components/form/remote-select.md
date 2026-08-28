---
title: "RemoteSelect"
description: "RemoteSelect：从异步数据源加载 Select 选项，适合插件设置页和表单字段。"
keywords: "RemoteSelect,Select,异步选项,useRequest,client-v2,NocoBase"
---

# RemoteSelect

`RemoteSelect` 是一个绑定异步数据源的 Antd `Select`。组件本身不感知 NocoBase 资源，你只需要传一个 `request` 函数，然后用 `fieldNames` 或 `mapOptions` 把返回值映射成选项。

## 基本用法

```tsx file="../_demos/remote-select.tsx" preview
```

实际插件里通常直接调用 `ctx.api`：

```tsx
import { RemoteSelect } from '@nocobase/client-v2';

<Form.Item name="provider" label={t('Provider')}>
  <RemoteSelect<{ name: string; title: string }>
    request={async () => {
      const response = await ctx.api.resource('smsOTPProviders').list();
      return response?.data?.data || [];
    }}
    cacheKey="@nocobase/plugin-verification:smsOTPProviders:list"
    mapOptions={(item) => ({ label: item.title, value: item.name })}
  />
</Form.Item>;
```

## API

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `request` | `() => Promise<Resp \| undefined>` | 拉取选项数据 |
| `selectItems` | `(response: Resp) => RawItem[] \| undefined` | 从响应包里取出列表 |
| `fieldNames` | `{ label?: string; value?: string }` | 指定原始数据里的 label / value 字段 |
| `mapOptions` | `(item, index) => { label; value }` | 完全自定义选项映射，优先级高于 `fieldNames` |
| `cacheKey` | `string` | 传给 ahooks `useRequest` 的缓存 key |
| `refreshDeps` | `unknown[]` | 依赖变化时重新请求 |
| `ready` | `boolean` | 是否自动请求，默认 `true` |
| `onLoaded` | `(items, response) => void` | 请求完成后的回调 |

其他 Antd `Select` 属性会原样透传。`showSearch` 和 `allowClear` 默认开启，搜索默认按 `label` 本地过滤。

## 服务端搜索

如果要做服务端搜索，把搜索词放进外部状态，再通过 `refreshDeps` 触发重新请求：

```tsx
const [keyword, setKeyword] = useState('');

<RemoteSelect
  showSearch
  filterOption={false}
  onSearch={setKeyword}
  refreshDeps={[keyword]}
  request={() => ctx.api.resource('providers').list({ filter: { title: { $includes: keyword } } })}
  selectItems={(response) => response?.data?.data || []}
/>;
```
