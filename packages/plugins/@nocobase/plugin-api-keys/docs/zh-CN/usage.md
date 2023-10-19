# API keys 使用方法

## 创建 API key

当你启用插件后，前往 API keys 的插件管理页面，点击 `添加 API key` 并填写相关信息，点击 `保存` 即可创建 API key。

## 使用 API key

在请求头中添加 `Authorization` 字段，值为 `Bearer ${API_KEY}`，即可使用 API key 访问 `NocoBase` 所有 API。

cURL 的例子如下

```bash
curl '{domain}/api/roles:check' -H 'Authorization: Bearer {API key}'
```

> Warning: 当你使用 `Docker` 镜像来使用 `NocoBase` 时，请确保你配置了 [APP_KEY](https://docs-cn.nocobase.com/api/env#app_key) 环境变量，否则 API key 将在每次重启后失效。

## 删除 API key

删除 API key 后，该 Key 将无法继续使用。
