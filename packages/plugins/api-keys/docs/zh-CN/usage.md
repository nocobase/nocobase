# API keys 使用方法

## 创建 API Key

当你启用插件后，前往 API keys 的插件管理页面，点击 `添加 API Key` 并填写相关信息，点击 `保存` 即可创建 API Key。

## 使用 API Key

在请求头中添加 `Authorization` 字段，值为 `Bearer ${API_KEY}`，即可使用 API Key 访问 `NocoBase` 所有 API。

cURL 的例子如下

```bash
curl '{domain}/api/roles:check' -H 'Authorization: Bearer {API Key}'
```

## 删除 API Key

目前删除 API Key 并不能使 Key 失效，请注意保管好你的 API Key。
