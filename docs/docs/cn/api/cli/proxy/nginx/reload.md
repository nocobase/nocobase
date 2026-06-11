---
title: "nb proxy nginx reload"
description: "nb proxy nginx reload 命令参考：按当前 driver 重载 Nginx 配置。"
keywords: "nb proxy nginx reload,NocoBase CLI,nginx,重载"
---

# nb proxy nginx reload

按当前 driver 重载 Nginx 配置。

## 用法

```bash
nb proxy nginx reload
```

## 示例

```bash
nb proxy nginx reload
```

## 说明

- 这条命令适合在你已经重新生成配置之后使用
- `reload` 要求当前 Nginx 已经在运行；如果还没启动，请先执行 `nb proxy nginx start`
- 本地 driver 会重载本地 Nginx，Docker driver 会在容器内执行重载

## 相关命令

- [`nb proxy nginx generate`](./generate.md)
- [`nb proxy nginx start`](./start.md)
